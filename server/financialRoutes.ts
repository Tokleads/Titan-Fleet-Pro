import type { Express } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, gte, desc, isNull, sql, or } from "drizzle-orm";
import { timesheets, users } from "@shared/schema";
import { requirePermission } from "./permissionGuard";

export function registerFinancialRoutes(app: Express) {
  // ==================== TIMESHEETS ====================
  
  // Get timesheets for a specific driver
  app.get("/api/driver/timesheets/:companyId/:driverId", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const driverId = Number(req.params.driverId);
      const { startDate, endDate } = req.query;
      
      const conditions = [
        eq(timesheets.companyId, companyId),
        eq(timesheets.driverId, driverId),
      ];

      if (startDate) {
        conditions.push(gte(timesheets.arrivalTime, new Date(startDate as string)));
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        conditions.push(sql`${timesheets.arrivalTime} <= ${end}`);
      }
      
      const results = await db.select()
        .from(timesheets)
        .where(and(...conditions))
        .orderBy(desc(timesheets.arrivalTime))
        .limit(200);
      
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch driver timesheets:", error);
      res.status(500).json({ error: "Failed to fetch driver timesheets" });
    }
  });

  // Get pending adjustments for a company (must be before :companyId route)
  app.get("/api/timesheets/pending-adjustments/:companyId", requirePermission('timesheets'), async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const pending = await db
        .select({
          timesheet: timesheets,
          driver: {
            name: users.name,
            email: users.email,
          },
        })
        .from(timesheets)
        .leftJoin(users, eq(timesheets.driverId, users.id))
        .where(
          and(
            eq(timesheets.companyId, companyId),
            eq(timesheets.adjustmentStatus, "PENDING")
          )
        )
        .orderBy(desc(timesheets.updatedAt));

      const result = pending.map((row) => ({
        ...row.timesheet,
        driver: row.driver,
      }));
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch pending adjustments:", error);
      res.status(500).json({ error: "Failed to fetch pending adjustments" });
    }
  });

  // Get timesheets for company
  app.get("/api/timesheets/:companyId", requirePermission('timesheets'), async (req, res) => {
    try {
      const { status, startDate, endDate, driverId } = req.query;
      const timesheets = await storage.getTimesheets(
        Number(req.params.companyId),
        status as string,
        startDate as string,
        endDate as string,
        driverId ? Number(driverId) : undefined
      );
      res.json(timesheets);
    } catch (error) {
      console.error("Failed to fetch timesheets:", error);
      res.status(500).json({ error: "Failed to fetch timesheets" });
    }
  });
  
  // Export timesheets as CSV
  app.post("/api/timesheets/export", requirePermission('timesheets'), async (req, res) => {
    try {
      const { companyId, startDate, endDate, driverId } = req.body;
      
      if (!companyId) {
        return res.status(400).json({ error: "Missing companyId" });
      }
      
      const timesheets = await storage.getTimesheets(
        Number(companyId),
        undefined,
        startDate,
        endDate,
        driverId ? Number(driverId) : undefined
      );
      
      // Generate CSV
      const csv = await storage.generateTimesheetCSV(timesheets);
      
      // Use plain text content type to avoid virus scanner false positives
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="timesheet_export.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("CSV export error:", error);
      res.status(500).json({ error: "Failed to export timesheets" });
    }
  });
  
  // Manual timesheet override (with adjustment approval workflow)
  app.patch("/api/timesheets/:id", requirePermission('timesheets'), async (req, res) => {
    try {
      const { role: _clientRole, userId, requestedBy, adjustmentNote, arrivalTime, departureTime, ...otherUpdates } = req.body;
      const timesheetId = Number(req.params.id);

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const user = await storage.getUser(Number(userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userRole = user.role;

      if (userRole === "OFFICE") {
        return res.status(403).json({ error: "OFFICE users cannot modify timesheets" });
      }

      if (userRole === "TRANSPORT_MANAGER" && (arrivalTime || departureTime)) {
        const existing = await storage.getTimesheetById(timesheetId);
        if (!existing) {
          return res.status(404).json({ error: "Timesheet not found" });
        }

        const timesheet = await storage.updateTimesheet(timesheetId, {
          originalArrivalTime: existing.originalArrivalTime || existing.arrivalTime,
          originalDepartureTime: existing.originalDepartureTime || existing.departureTime,
          proposedArrivalTime: arrivalTime ? new Date(arrivalTime) : null,
          proposedDepartureTime: departureTime ? new Date(departureTime) : null,
          adjustmentStatus: "PENDING",
          adjustmentRequestedBy: requestedBy || null,
          adjustmentNote: adjustmentNote || null,
          ...otherUpdates,
        });
        return res.json(timesheet);
      }

      if (userRole === "ADMIN" && (arrivalTime || departureTime)) {
        const updateData: any = { ...otherUpdates };
        if (arrivalTime) updateData.arrivalTime = new Date(arrivalTime);
        if (departureTime) updateData.departureTime = new Date(departureTime);
        if (updateData.arrivalTime && updateData.departureTime) {
          updateData.totalMinutes = Math.round(
            (new Date(updateData.departureTime).getTime() - new Date(updateData.arrivalTime).getTime()) / 60000
          );
        }
        const timesheet = await storage.updateTimesheet(timesheetId, updateData);
        return res.json(timesheet);
      }

      const timesheet = await storage.updateTimesheet(timesheetId, otherUpdates);
      res.json(timesheet);
    } catch (error) {
      console.error("Failed to update timesheet:", error);
      res.status(500).json({ error: "Failed to update timesheet" });
    }
  });

  // Approve adjustment
  app.post("/api/timesheets/:id/approve-adjustment", requirePermission('timesheets'), async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }
      const approver = await storage.getUser(Number(userId));
      if (!approver || approver.role !== "ADMIN") {
        return res.status(403).json({ error: "Only ADMIN users can approve adjustments" });
      }

      const timesheetId = Number(req.params.id);
      const existing = await storage.getTimesheetById(timesheetId);
      if (!existing) {
        return res.status(404).json({ error: "Timesheet not found" });
      }
      if (existing.adjustmentStatus !== "PENDING") {
        return res.status(400).json({ error: "No pending adjustment to approve" });
      }

      const newArrival = existing.proposedArrivalTime || existing.arrivalTime;
      const newDeparture = existing.proposedDepartureTime || existing.departureTime;
      let totalMinutes = existing.totalMinutes;
      if (newArrival && newDeparture) {
        totalMinutes = Math.round(
          (new Date(newDeparture).getTime() - new Date(newArrival).getTime()) / 60000
        );
      }

      const timesheet = await storage.updateTimesheet(timesheetId, {
        arrivalTime: newArrival,
        departureTime: newDeparture,
        totalMinutes,
        adjustmentStatus: "APPROVED",
        proposedArrivalTime: null,
        proposedDepartureTime: null,
      });
      res.json(timesheet);
    } catch (error) {
      console.error("Failed to approve adjustment:", error);
      res.status(500).json({ error: "Failed to approve adjustment" });
    }
  });

  // Reject adjustment
  app.post("/api/timesheets/:id/reject-adjustment", requirePermission('timesheets'), async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }
      const rejector = await storage.getUser(Number(userId));
      if (!rejector || rejector.role !== "ADMIN") {
        return res.status(403).json({ error: "Only ADMIN users can reject adjustments" });
      }

      const timesheetId = Number(req.params.id);
      const existing = await storage.getTimesheetById(timesheetId);
      if (!existing) {
        return res.status(404).json({ error: "Timesheet not found" });
      }
      if (existing.adjustmentStatus !== "PENDING") {
        return res.status(400).json({ error: "No pending adjustment to reject" });
      }

      const timesheet = await storage.updateTimesheet(timesheetId, {
        adjustmentStatus: "REJECTED",
        proposedArrivalTime: null,
        proposedDepartureTime: null,
      });
      res.json(timesheet);
    } catch (error) {
      console.error("Failed to reject adjustment:", error);
      res.status(500).json({ error: "Failed to reject adjustment" });
    }
  });
  
  // Get active timesheet for driver
  app.get("/api/timesheets/active/:driverId", async (req, res) => {
    try {
      const timesheet = await storage.getActiveTimesheet(Number(req.params.driverId));
      res.json({ timesheet: timesheet || null });
    } catch (error) {
      console.error("Error fetching active timesheet:", error);
      res.status(500).json({ error: "Failed to fetch active timesheet" });
    }
  });
  
  // Clock in
  app.post("/api/timesheets/clock-in", async (req, res) => {
    try {
      const { companyId, driverId, depotId, latitude, longitude, accuracy, manualSelection, lowAccuracy } = req.body;
      
      if (!companyId || !driverId || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existingActive = await db.select().from(timesheets)
        .where(and(
          eq(timesheets.driverId, Number(driverId)),
          eq(timesheets.companyId, Number(companyId)),
          eq(timesheets.status, 'ACTIVE')
        ))
        .limit(1);

      if (existingActive.length > 0) {
        return res.status(409).json({ 
          error: 'Already clocked in',
          activeTimesheetId: existingActive[0].id 
        });
      }
      
      const timesheet = await storage.clockIn(
        Number(companyId),
        Number(driverId),
        depotId ? Number(depotId) : null,
        latitude,
        longitude,
        accuracy ? Math.round(Number(accuracy)) : null,
        manualSelection === true || lowAccuracy === true
      );
      
      res.json(timesheet);
    } catch (error) {
      console.error("Clock in error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to clock in" });
    }
  });
  
  // Clock out
  app.post("/api/timesheets/clock-out", async (req, res) => {
    try {
      const { timesheetId, latitude, longitude, accuracy } = req.body;
      
      if (!timesheetId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const timesheet = await storage.clockOut(
        Number(timesheetId),
        latitude || null,
        longitude || null,
        accuracy ? Math.round(Number(accuracy)) : null
      );
      
      res.json(timesheet);
    } catch (error) {
      console.error("Clock out error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to clock out" });
    }
  });
  
  // Manager clock-out driver
  app.post("/api/manager/clock-in-driver", async (req, res) => {
    try {
      const { driverId, companyId, depotId, depotName, managerId } = req.body;
      
      if (!driverId || !companyId || !managerId) {
        return res.status(400).json({ error: "Missing required fields (driverId, companyId, managerId)" });
      }

      const manager = await storage.getUser(Number(managerId));
      if (!manager || manager.companyId !== Number(companyId)) {
        return res.status(403).json({ error: "Unauthorized: manager does not belong to this company" });
      }
      if (!["ADMIN", "TRANSPORT_MANAGER"].includes(manager.role)) {
        return res.status(403).json({ error: "Unauthorized: only managers and admins can manually clock in drivers" });
      }

      const driver = await storage.getUser(Number(driverId));
      if (!driver || driver.companyId !== Number(companyId)) {
        return res.status(403).json({ error: "Driver does not belong to this company" });
      }

      const existing = await storage.getActiveTimesheet(Number(driverId));
      if (existing) {
        return res.status(409).json({ error: "Driver is already clocked in" });
      }

      const timesheet = await storage.clockIn(
        Number(companyId),
        Number(driverId),
        depotId ? Number(depotId) : null,
        "0",
        "0",
        null,
        true
      );

      const finalDepotName = depotId ? timesheet.depotName : (depotName || "Manual Clock-In");
      const updated = await storage.updateTimesheet(timesheet.id, { depotName: finalDepotName });

      await storage.createAuditLog({
        companyId: Number(companyId),
        userId: Number(managerId),
        action: "MANUAL_CLOCK_IN",
        entity: "timesheet",
        entityId: timesheet.id,
        details: {
          driverId: Number(driverId),
          driverName: driver.name,
          managerName: manager.name,
          depotName: finalDepotName,
          timesheetId: timesheet.id,
        },
      });

      console.log(`[Manager Action] Manual clock-in: Driver ${driver.name} (ID:${driverId}) clocked in by ${manager.name} (ID:${managerId}) at "${finalDepotName}"`);
      
      res.json(updated || timesheet);
    } catch (error) {
      console.error("Manager clock in error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to clock in driver" });
    }
  });

  app.post("/api/manager/clock-out-driver", async (req, res) => {
    try {
      const { driverId, companyId, managerId } = req.body;

      if (!driverId || !companyId) {
        return res.status(400).json({ error: "Missing driverId or companyId" });
      }

      const activeTimesheet = await storage.getActiveTimesheet(Number(driverId));
      if (!activeTimesheet) {
        return res.status(404).json({ error: "No active timesheet found for this driver" });
      }

      if (activeTimesheet.companyId !== Number(companyId)) {
        return res.status(403).json({ error: "Driver does not belong to this company" });
      }

      const timesheet = await storage.clockOut(
        activeTimesheet.id,
        null as any,
        null as any,
        null
      );

      if (managerId) {
        const driver = await storage.getUser(Number(driverId));
        const manager = await storage.getUser(Number(managerId));
        await storage.createAuditLog({
          companyId: Number(companyId),
          userId: Number(managerId),
          action: "MANUAL_CLOCK_OUT",
          entity: "timesheet",
          entityId: activeTimesheet.id,
          details: {
            driverId: Number(driverId),
            driverName: driver?.name,
            managerName: manager?.name,
            totalMinutes: timesheet.totalMinutes,
            timesheetId: activeTimesheet.id,
          },
        });
        console.log(`[Manager Action] Manual clock-out: Driver ${driver?.name} (ID:${driverId}) clocked out by ${manager?.name} (ID:${managerId})`);
      }

      res.json(timesheet);
    } catch (error) {
      console.error("Manager clock out error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to clock out driver" });
    }
  });


  // ==================== PAY RATES & WAGE CALCULATIONS ====================
  
  // Get pay rates for company
  app.get("/api/pay-rates/:companyId", requirePermission('pay-rates'), async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const { initializeDefaultPayRates } = await import('./wageCalculationService');
      const { db } = await import('./db');
      const { payRates } = await import('../shared/schema');
      const { eq, and, isNull } = await import('drizzle-orm');
      
      // Get all pay rates for company
      let rates = await db.select()
        .from(payRates)
        .where(eq(payRates.companyId, companyId));
      
      // If no rates exist, initialize default
      if (rates.length === 0) {
        await initializeDefaultPayRates(companyId);
        rates = await db.select()
          .from(payRates)
          .where(eq(payRates.companyId, companyId));
      }
      
      res.json(rates);
    } catch (error) {
      console.error("Failed to fetch pay rates:", error);
      res.status(500).json({ error: "Failed to fetch pay rates" });
    }
  });
  
  // Create or update pay rate
  app.post("/api/pay-rates", requirePermission('pay-rates'), async (req, res) => {
    try {
      const { db } = await import('./db');
      const { payRates } = await import('../shared/schema');
      
      const [newRate] = await db.insert(payRates).values(req.body).returning();
      res.json(newRate);
    } catch (error) {
      console.error("Failed to create pay rate:", error);
      res.status(500).json({ error: "Failed to create pay rate" });
    }
  });
  
  // Update pay rate
  app.patch("/api/pay-rates/:id", requirePermission('pay-rates'), async (req, res) => {
    try {
      const { db } = await import('./db');
      const { payRates } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const [updated] = await db.update(payRates)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(payRates.id, Number(req.params.id)))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update pay rate:", error);
      res.status(500).json({ error: "Failed to update pay rate" });
    }
  });
  
  // Get bank holidays for company
  app.get("/api/bank-holidays/:companyId", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { bankHolidays } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const holidays = await db.select()
        .from(bankHolidays)
        .where(eq(bankHolidays.companyId, Number(req.params.companyId)));
      
      res.json(holidays);
    } catch (error) {
      console.error("Failed to fetch bank holidays:", error);
      res.status(500).json({ error: "Failed to fetch bank holidays" });
    }
  });
  
  // Add bank holiday
  app.post("/api/bank-holidays", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { bankHolidays } = await import('../shared/schema');
      
      const [newHoliday] = await db.insert(bankHolidays).values(req.body).returning();
      res.json(newHoliday);
    } catch (error) {
      console.error("Failed to add bank holiday:", error);
      res.status(500).json({ error: "Failed to add bank holiday" });
    }
  });
  
  // Initialize UK bank holidays for year
  app.post("/api/bank-holidays/init-uk/:companyId/:year", async (req, res) => {
    try {
      const { addUKBankHolidays } = await import('./wageCalculationService');
      await addUKBankHolidays(Number(req.params.companyId), Number(req.params.year));
      res.json({ success: true, message: "UK bank holidays added" });
    } catch (error) {
      console.error("Failed to initialize bank holidays:", error);
      res.status(500).json({ error: "Failed to initialize bank holidays" });
    }
  });
  
  // Calculate wages for timesheet
  app.post("/api/wages/calculate/:timesheetId", requirePermission('pay-rates'), async (req, res) => {
    try {
      const { calculateWages } = await import('./wageCalculationService');
      const { companyId, driverId, arrivalTime, departureTime } = req.body;
      
      const wages = await calculateWages(
        Number(req.params.timesheetId),
        companyId,
        driverId,
        new Date(arrivalTime),
        new Date(departureTime)
      );
      
      res.json(wages);
    } catch (error) {
      console.error("Failed to calculate wages:", error);
      res.status(500).json({ error: "Failed to calculate wages" });
    }
  });

  // Get all pay rates for a company with driver info
  app.get("/api/pay-rates/:companyId/drivers", requirePermission('pay-rates'), async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const { db } = await import('./db');
      const { payRates } = await import('../shared/payRatesSchema');
      const { users } = await import('../shared/schema');
      const { eq, sql } = await import('drizzle-orm');

      const rates = await db.select({
        id: payRates.id,
        companyId: payRates.companyId,
        driverId: payRates.driverId,
        baseRate: payRates.baseRate,
        nightRate: payRates.nightRate,
        weekendRate: payRates.weekendRate,
        bankHolidayRate: payRates.bankHolidayRate,
        overtimeMultiplier: payRates.overtimeMultiplier,
        nightStartHour: payRates.nightStartHour,
        nightEndHour: payRates.nightEndHour,
        dailyOvertimeThreshold: payRates.dailyOvertimeThreshold,
        weeklyOvertimeThreshold: payRates.weeklyOvertimeThreshold,
        isActive: payRates.isActive,
        effectiveFrom: payRates.effectiveFrom,
        effectiveTo: payRates.effectiveTo,
        createdAt: payRates.createdAt,
        updatedAt: payRates.updatedAt,
        driverName: users.name,
      })
        .from(payRates)
        .leftJoin(users, eq(payRates.driverId, users.id))
        .where(eq(payRates.companyId, companyId));

      res.json(rates);
    } catch (error) {
      console.error("Failed to fetch driver pay rates:", error);
      res.status(500).json({ error: "Failed to fetch driver pay rates" });
    }
  });

  // Create or update a per-driver pay rate
  app.post("/api/pay-rates/driver", requirePermission('pay-rates'), async (req, res) => {
    try {
      const { companyId, driverId, baseRate, nightRate, weekendRate, bankHolidayRate, overtimeMultiplier } = req.body;

      if (!companyId || !driverId) {
        return res.status(400).json({ error: "Missing companyId or driverId" });
      }

      const { db } = await import('./db');
      const { payRates } = await import('../shared/payRatesSchema');
      const { eq, and, isNull } = await import('drizzle-orm');

      // Get company default to copy threshold settings
      const [companyDefault] = await db.select()
        .from(payRates)
        .where(and(
          eq(payRates.companyId, Number(companyId)),
          isNull(payRates.driverId)
        ))
        .limit(1);

      const nightStartHour = companyDefault?.nightStartHour ?? 22;
      const nightEndHour = companyDefault?.nightEndHour ?? 6;
      const dailyOvertimeThreshold = companyDefault?.dailyOvertimeThreshold ?? 480;
      const weeklyOvertimeThreshold = companyDefault?.weeklyOvertimeThreshold ?? 2400;

      // Check if driver rate already exists
      const [existing] = await db.select()
        .from(payRates)
        .where(and(
          eq(payRates.companyId, Number(companyId)),
          eq(payRates.driverId, Number(driverId))
        ))
        .limit(1);

      if (existing) {
        const [updated] = await db.update(payRates)
          .set({
            baseRate: baseRate || existing.baseRate,
            nightRate: nightRate || existing.nightRate,
            weekendRate: weekendRate || existing.weekendRate,
            bankHolidayRate: bankHolidayRate || existing.bankHolidayRate,
            overtimeMultiplier: overtimeMultiplier || existing.overtimeMultiplier,
            nightStartHour,
            nightEndHour,
            dailyOvertimeThreshold,
            weeklyOvertimeThreshold,
            updatedAt: new Date()
          })
          .where(eq(payRates.id, existing.id))
          .returning();
        return res.json(updated);
      }

      const [newRate] = await db.insert(payRates).values({
        companyId: Number(companyId),
        driverId: Number(driverId),
        baseRate: baseRate || "12.00",
        nightRate: nightRate || "15.00",
        weekendRate: weekendRate || "18.00",
        bankHolidayRate: bankHolidayRate || "24.00",
        overtimeMultiplier: overtimeMultiplier || "1.5",
        nightStartHour,
        nightEndHour,
        dailyOvertimeThreshold,
        weeklyOvertimeThreshold,
        isActive: true
      }).returning();

      res.json(newRate);
    } catch (error) {
      console.error("Failed to create/update driver pay rate:", error);
      res.status(500).json({ error: "Failed to create/update driver pay rate" });
    }
  });

  // Delete a driver-specific pay rate
  app.delete("/api/pay-rates/driver/:driverId/:companyId", requirePermission('pay-rates'), async (req, res) => {
    try {
      const driverId = Number(req.params.driverId);
      const companyId = Number(req.params.companyId);

      const { db } = await import('./db');
      const { payRates } = await import('../shared/payRatesSchema');
      const { eq, and } = await import('drizzle-orm');

      const [deleted] = await db.delete(payRates)
        .where(and(
          eq(payRates.companyId, companyId),
          eq(payRates.driverId, driverId)
        ))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "No driver-specific pay rate found" });
      }

      res.json({ success: true, message: "Driver pay rate deleted, company default will apply" });
    } catch (error) {
      console.error("Failed to delete driver pay rate:", error);
      res.status(500).json({ error: "Failed to delete driver pay rate" });
    }
  });

  // Export wages as CSV
  app.post("/api/wages/export-csv", requirePermission('pay-rates'), async (req, res) => {
    try {
      const { companyId, startDate, endDate } = req.body;

      if (!companyId || !startDate || !endDate) {
        return res.status(400).json({ error: "Missing companyId, startDate, or endDate" });
      }

      const { calculateWages } = await import('./wageCalculationService');
      const { db } = await import('./db');
      const { payRates } = await import('../shared/payRatesSchema');
      const { eq, and, isNull } = await import('drizzle-orm');

      const completedTimesheets = await storage.getTimesheets(
        Number(companyId),
        "COMPLETED",
        startDate,
        endDate
      );

      if (completedTimesheets.length === 0) {
        return res.status(404).json({ error: "No completed timesheets found for this date range" });
      }

      // Get company default pay rate for CSV display
      const [companyDefault] = await db.select()
        .from(payRates)
        .where(and(
          eq(payRates.companyId, Number(companyId)),
          isNull(payRates.driverId)
        ))
        .limit(1);

      // Get all driver-specific pay rates
      const driverRates = await db.select()
        .from(payRates)
        .where(eq(payRates.companyId, Number(companyId)));

      const driverRateMap = new Map<number, typeof driverRates[0]>();
      for (const rate of driverRates) {
        if (rate.driverId) {
          driverRateMap.set(rate.driverId, rate);
        }
      }

      const csvHeaders = [
        "Driver Name", "Date", "Day", "Clock In", "Clock Out", "Depot",
        "Total Hours", "Regular Hours", "Night Hours", "Weekend Hours",
        "Bank Holiday Hours", "Overtime Hours",
        "Base Rate (£/hr)", "Night Rate (£/hr)", "Weekend Rate (£/hr)", "Holiday Rate (£/hr)",
        "Regular Pay", "Night Pay", "Weekend Pay", "Holiday Pay", "Overtime Pay", "Total Pay"
      ];

      const csvRows: string[] = [csvHeaders.join(",")];
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      for (const ts of completedTimesheets) {
        if (!ts.departureTime) continue;

        try {
          const wages = await calculateWages(
            ts.id,
            ts.companyId,
            ts.driverId,
            new Date(ts.arrivalTime),
            new Date(ts.departureTime)
          );

          const driverName = ts.driver?.name || `Driver ${ts.driverId}`;
          const arrivalDate = new Date(ts.arrivalTime);
          const departureDate = new Date(ts.departureTime);
          const dayName = days[arrivalDate.getDay()];
          const dateStr = arrivalDate.toLocaleDateString("en-GB");
          const clockIn = arrivalDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
          const clockOut = departureDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
          const depot = ts.depotName || "Unknown";
          const totalMinutes = (departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60);
          const totalHours = (totalMinutes / 60).toFixed(2);
          const regularHours = (wages.regularMinutes / 60).toFixed(2);
          const nightHours = (wages.nightMinutes / 60).toFixed(2);
          const weekendHours = (wages.weekendMinutes / 60).toFixed(2);
          const bankHolidayHours = (wages.bankHolidayMinutes / 60).toFixed(2);
          const overtimeHours = (wages.overtimeMinutes / 60).toFixed(2);

          const rate = driverRateMap.get(ts.driverId) || companyDefault;
          const baseRateVal = rate?.baseRate || "12.00";
          const nightRateVal = rate?.nightRate || "15.00";
          const weekendRateVal = rate?.weekendRate || "18.00";
          const bankHolidayRateVal = rate?.bankHolidayRate || "24.00";

          const escapeCSV = (val: string) => {
            if (val.includes(",") || val.includes('"') || val.includes("\n")) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          };

          const row = [
            escapeCSV(driverName),
            dateStr,
            dayName,
            clockIn,
            clockOut,
            escapeCSV(depot),
            totalHours,
            regularHours,
            nightHours,
            weekendHours,
            bankHolidayHours,
            overtimeHours,
            baseRateVal,
            nightRateVal,
            weekendRateVal,
            bankHolidayRateVal,
            wages.regularPay.toFixed(2),
            wages.nightPay.toFixed(2),
            wages.weekendPay.toFixed(2),
            wages.bankHolidayPay.toFixed(2),
            wages.overtimePay.toFixed(2),
            wages.totalPay.toFixed(2)
          ];

          csvRows.push(row.join(","));
        } catch (calcError) {
          console.error(`Failed to calculate wages for timesheet ${ts.id}:`, calcError);
        }
      }

      const csvContent = csvRows.join("\n");
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="wage_export_${startDate}_to_${endDate}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Wage CSV export error:", error);
      res.status(500).json({ error: "Failed to export wage CSV" });
    }
  });

}
