import type { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { reminders, operatorLicences, operatorLicenceVehicles, vehicles, insertReminderSchema, insertOperatorLicenceSchema, insertCompanyCarRegisterSchema } from "@shared/schema";
import { requirePermission } from "./permissionGuard";

export function registerComplianceRoutes(app: Express) {
  // ===== REMINDER ROUTES (Compliance Tracking) =====
  
  // Get reminders for a company
  app.get("/api/reminders", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const reminders = await storage.getActiveReminders(companyId);
      
      // Enrich with vehicle VRM
      const enriched = await Promise.all(
        reminders.map(async (reminder: any) => {
          const vehicle = await storage.getVehicleById(reminder.vehicleId);
          return {
            ...reminder,
            vehicleVrm: vehicle?.vrm || 'Unknown',
          };
        })
      );
      
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Create new reminder
  app.post("/api/reminders", async (req, res) => {
    try {
      const validation = insertReminderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const reminder = await storage.createReminder(validation.data);
      res.json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Complete reminder
  app.patch("/api/reminders/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [existingReminder] = await db.select().from(reminders).where(eq(reminders.id, id));
      if (!existingReminder) {
        return res.status(404).json({ error: "Reminder not found" });
      }
      if (req.user && existingReminder.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const completeSchema = z.object({ completedBy: z.number(), notes: z.string().optional() });
      const validation = completeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { completedBy, notes } = validation.data;
      const reminder = await storage.completeReminder(id, completedBy, notes);
      res.json(reminder);
    } catch (error) {
      console.error("Error completing reminder:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Snooze reminder
  app.patch("/api/reminders/:id/snooze", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [existingReminder] = await db.select().from(reminders).where(eq(reminders.id, id));
      if (!existingReminder) {
        return res.status(404).json({ error: "Reminder not found" });
      }
      if (req.user && existingReminder.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const snoozeSchema = z.object({ snoozedBy: z.number(), snoozedUntil: z.string(), reason: z.string().optional() });
      const validation = snoozeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { snoozedBy, snoozedUntil, reason } = validation.data;
      const reminder = await storage.snoozeReminder(id, snoozedBy, new Date(snoozedUntil), reason);
      res.json(reminder);
    } catch (error) {
      console.error("Error snoozing reminder:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Dismiss reminder
  app.patch("/api/reminders/:id/dismiss", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [existingReminder] = await db.select().from(reminders).where(eq(reminders.id, id));
      if (!existingReminder) {
        return res.status(404).json({ error: "Reminder not found" });
      }
      if (req.user && existingReminder.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const reminder = await storage.dismissReminder(id);
      res.json(reminder);
    } catch (error) {
      console.error("Error dismissing reminder:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // ==================== DVLA LICENSE VERIFICATION ====================

  /**
   * Get DVLA integration status
   */
  app.get("/api/manager/dvla/status", async (req, res) => {
    try {
      const { getDVLAStatus } = await import("./dvlaService");
      const status = getDVLAStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting DVLA status:", error);
      res.status(500).json({ error: "Failed to get DVLA status" });
    }
  });

  /**
   * Verify a driver's license
   */
  app.post("/api/manager/drivers/:driverId/verify-license", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const { licenseNumber } = req.body;
      const companyId = req.body.companyId;
      const initiatedBy = req.body.initiatedBy || null;

      if (!licenseNumber) {
        return res.status(400).json({ error: "License number is required" });
      }

      const { performLicenseVerification } = await import("./dvlaService");
      const result = await performLicenseVerification(
        driverId,
        companyId,
        licenseNumber,
        initiatedBy,
        'manual'
      );

      res.json(result);
    } catch (error) {
      console.error("Error verifying license:", error);
      res.status(500).json({ error: "Failed to verify license" });
    }
  });

  /**
   * Get driver's license data
   */
  app.get("/api/manager/drivers/:driverId/license", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const { getDriverLicense } = await import("./dvlaService");
      const license = await getDriverLicense(driverId);
      
      if (!license) {
        return res.status(404).json({ error: "License not found" });
      }

      res.json(license);
    } catch (error) {
      console.error("Error getting license:", error);
      res.status(500).json({ error: "Failed to get license" });
    }
  });

  /**
   * Get driver's license verification history
   */
  app.get("/api/manager/drivers/:driverId/license/history", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const limit = parseInt(req.query.limit as string) || 10;
      
      const { getVerificationHistory } = await import("./dvlaService");
      const history = await getVerificationHistory(driverId, limit);
      
      res.json(history);
    } catch (error) {
      console.error("Error getting verification history:", error);
      res.status(500).json({ error: "Failed to get verification history" });
    }
  });

  /**
   * Get active license alerts for a driver
   */
  app.get("/api/manager/drivers/:driverId/license/alerts", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const { getActiveLicenseAlerts } = await import("./dvlaService");
      const alerts = await getActiveLicenseAlerts(driverId);
      
      res.json(alerts);
    } catch (error) {
      console.error("Error getting license alerts:", error);
      res.status(500).json({ error: "Failed to get license alerts" });
    }
  });

  /**
   * Get all active license alerts for a company
   */
  app.get("/api/manager/license/alerts", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const { getCompanyLicenseAlerts } = await import("./dvlaService");
      const alerts = await getCompanyLicenseAlerts(companyId);
      
      res.json(alerts);
    } catch (error) {
      console.error("Error getting company license alerts:", error);
      res.status(500).json({ error: "Failed to get company license alerts" });
    }
  });

  /**
   * Acknowledge a license alert
   */
  app.post("/api/manager/license/alerts/:alertId/acknowledge", async (req, res) => {
    try {
      const alertId = parseInt(req.params.alertId);
      const { acknowledgedBy } = req.body;

      if (!acknowledgedBy) {
        return res.status(400).json({ error: "acknowledgedBy is required" });
      }

      const { acknowledgeLicenseAlert } = await import("./dvlaService");
      await acknowledgeLicenseAlert(alertId, acknowledgedBy);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  });

  /**
   * Resolve a license alert
   */
  app.post("/api/manager/license/alerts/:alertId/resolve", async (req, res) => {
    try {
      const alertId = parseInt(req.params.alertId);
      const { resolutionNotes } = req.body;

      if (!resolutionNotes) {
        return res.status(400).json({ error: "resolutionNotes is required" });
      }

      const { resolveLicenseAlert } = await import("./dvlaService");
      await resolveLicenseAlert(alertId, resolutionNotes);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  });
  

  // ==================== OPERATOR LICENCES ====================

  // Get count of vehicles without an operator licence (must be before :companyId route)
  app.get("/api/operator-licences/unassigned-count/:companyId", requirePermission('o-licence'), async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const allVehicles = await db.select({ id: vehicles.id })
        .from(vehicles)
        .where(and(eq(vehicles.companyId, companyId), eq(vehicles.active, true)));
      
      const assignedVehicleIds = await db.select({ vehicleId: operatorLicenceVehicles.vehicleId })
        .from(operatorLicenceVehicles)
        .innerJoin(operatorLicences, eq(operatorLicenceVehicles.licenceId, operatorLicences.id))
        .where(eq(operatorLicences.companyId, companyId));
      
      const assignedSet = new Set(assignedVehicleIds.map(v => v.vehicleId));
      const unassignedCount = allVehicles.filter(v => !assignedSet.has(v.id)).length;
      
      res.json({ count: unassignedCount, total: allVehicles.length });
    } catch (error) {
      console.error("Failed to fetch unassigned count:", error);
      res.status(500).json({ error: "Failed to fetch unassigned count" });
    }
  });

  app.get("/api/operator-licences/:companyId/with-vehicles", requirePermission('o-licence'), async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const licences = await db.select().from(operatorLicences)
        .where(and(eq(operatorLicences.companyId, companyId), eq(operatorLicences.active, true)))
        .orderBy(desc(operatorLicences.createdAt));

      const result = await Promise.all(licences.map(async (licence) => {
        const assignments = await db.select({ vehicleId: operatorLicenceVehicles.vehicleId })
          .from(operatorLicenceVehicles)
          .where(eq(operatorLicenceVehicles.licenceId, licence.id));

        return {
          id: licence.id,
          licenceNumber: licence.licenceNumber,
          trafficArea: licence.trafficArea,
          licenceType: licence.licenceType,
          vehicleIds: assignments.map(a => a.vehicleId),
        };
      }));

      res.json(result);
    } catch (error) {
      console.error("Failed to fetch operator licences with vehicles:", error);
      res.status(500).json({ error: "Failed to fetch operator licences with vehicles" });
    }
  });

  // Get all operator licences for company
  app.get("/api/operator-licences/:companyId", requirePermission('o-licence'), async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const licences = await db.select().from(operatorLicences)
        .where(eq(operatorLicences.companyId, companyId))
        .orderBy(desc(operatorLicences.createdAt));
      
      const result = await Promise.all(licences.map(async (licence) => {
        const assignedVehicles = await db.select({ count: sql<number>`count(*)::int` })
          .from(operatorLicenceVehicles)
          .where(eq(operatorLicenceVehicles.licenceId, licence.id));
        
        return {
          ...licence,
          actualVehicles: assignedVehicles[0]?.count || 0,
          actualTrailers: 0,
        };
      }));
      
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch operator licences:", error);
      res.status(500).json({ error: "Failed to fetch operator licences" });
    }
  });

  // Create operator licence
  app.post("/api/operator-licences", requirePermission('o-licence'), async (req, res) => {
    try {
      const validation = insertOperatorLicenceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const values = { ...validation.data } as any;
      if (values.inForceFrom) values.inForceFrom = new Date(values.inForceFrom);
      if (values.reviewDate) values.reviewDate = new Date(values.reviewDate);
      const [licence] = await db.insert(operatorLicences).values(values).returning();
      res.json(licence);
    } catch (error) {
      console.error("Failed to create operator licence:", error);
      res.status(500).json({ error: "Failed to create operator licence" });
    }
  });

  // Update operator licence
  app.put("/api/operator-licences/:id", async (req, res) => {
    try {
      const validation = insertOperatorLicenceSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { companyId, ...updateData } = validation.data as any;
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });
      const existing = await db.select().from(operatorLicences).where(eq(operatorLicences.id, Number(req.params.id)));
      if (!existing.length || existing[0].companyId !== companyId) {
        return res.status(403).json({ error: "Not authorised" });
      }
      if (updateData.inForceFrom) updateData.inForceFrom = new Date(updateData.inForceFrom);
      if (updateData.reviewDate) updateData.reviewDate = new Date(updateData.reviewDate);
      const [licence] = await db.update(operatorLicences)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(operatorLicences.id, Number(req.params.id)))
        .returning();
      res.json(licence);
    } catch (error) {
      console.error("Failed to update operator licence:", error);
      res.status(500).json({ error: "Failed to update operator licence" });
    }
  });

  // Delete operator licence
  app.delete("/api/operator-licences/:id", requirePermission('o-licence'), async (req, res) => {
    try {
      const { companyId } = req.query;
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });
      const existing = await db.select().from(operatorLicences).where(eq(operatorLicences.id, Number(req.params.id)));
      if (!existing.length || existing[0].companyId !== Number(companyId)) {
        return res.status(403).json({ error: "Not authorised" });
      }
      await db.delete(operatorLicenceVehicles)
        .where(eq(operatorLicenceVehicles.licenceId, Number(req.params.id)));
      await db.delete(operatorLicences)
        .where(eq(operatorLicences.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete operator licence:", error);
      res.status(500).json({ error: "Failed to delete operator licence" });
    }
  });

  // Get vehicles assigned to a licence
  app.get("/api/operator-licences/:id/vehicles", requirePermission('o-licence'), async (req, res) => {
    try {
      const assignments = await db.select({
        id: operatorLicenceVehicles.id,
        vehicleId: operatorLicenceVehicles.vehicleId,
        assignedAt: operatorLicenceVehicles.assignedAt,
        vrm: vehicles.vrm,
        make: vehicles.make,
        model: vehicles.model,
      })
      .from(operatorLicenceVehicles)
      .innerJoin(vehicles, eq(operatorLicenceVehicles.vehicleId, vehicles.id))
      .where(eq(operatorLicenceVehicles.licenceId, Number(req.params.id)));
      res.json(assignments);
    } catch (error) {
      console.error("Failed to fetch licence vehicles:", error);
      res.status(500).json({ error: "Failed to fetch licence vehicles" });
    }
  });

  // Assign vehicle to licence
  app.post("/api/operator-licences/:id/vehicles", requirePermission('o-licence'), async (req, res) => {
    try {
      const vehicleSchema = z.object({ vehicleId: z.number() });
      const validation = vehicleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { vehicleId } = validation.data;
      const [assignment] = await db.insert(operatorLicenceVehicles)
        .values({ licenceId: Number(req.params.id), vehicleId })
        .returning();
      res.json(assignment);
    } catch (error) {
      console.error("Failed to assign vehicle:", error);
      res.status(500).json({ error: "Failed to assign vehicle" });
    }
  });

  // Remove vehicle from licence
  app.delete("/api/operator-licence-vehicles/:id", async (req, res) => {
    try {
      await db.delete(operatorLicenceVehicles)
        .where(eq(operatorLicenceVehicles.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove vehicle:", error);
      res.status(500).json({ error: "Failed to remove vehicle" });
    }
  });


  // ==================== COMPANY CAR REGISTER ====================

  app.post("/api/car-register", async (req, res) => {
    try {
      const validation = insertCompanyCarRegisterSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { driverId, companyId, numberPlate, startTime, notes } = validation.data as any;
      const entry = await storage.createCarRegisterEntry({
        driverId,
        companyId,
        numberPlate: numberPlate.toUpperCase().replace(/\s+/g, ''),
        startTime: startTime ? new Date(startTime) : new Date(),
        notes: notes || null,
        endTime: null,
      });
      res.status(201).json(entry);
    } catch (error) {
      console.error("Failed to create car register entry:", error);
      res.status(500).json({ error: "Failed to create car register entry" });
    }
  });

  app.patch("/api/car-register/:id/end", async (req, res) => {
    try {
      const entry = await storage.endCarRegisterEntry(Number(req.params.id));
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Failed to end car register entry:", error);
      res.status(500).json({ error: "Failed to end car register entry" });
    }
  });

  app.get("/api/car-register/driver/:driverId", async (req, res) => {
    try {
      const entries = await storage.getCarRegisterByDriver(Number(req.params.driverId));
      res.json(entries);
    } catch (error) {
      console.error("Failed to get car register entries:", error);
      res.status(500).json({ error: "Failed to get car register entries" });
    }
  });

  app.get("/api/car-register/company/:companyId", async (req, res) => {
    try {
      const entries = await storage.getCarRegisterByCompany(Number(req.params.companyId));
      res.json(entries);
    } catch (error) {
      console.error("Failed to get car register entries:", error);
      res.status(500).json({ error: "Failed to get car register entries" });
    }
  });

  app.get("/api/car-register/active/:companyId", async (req, res) => {
    try {
      const entries = await storage.getActiveCarAssignments(Number(req.params.companyId));
      res.json(entries);
    } catch (error) {
      console.error("Failed to get active car assignments:", error);
      res.status(500).json({ error: "Failed to get active car assignments" });
    }
  });

  app.get("/api/gdpr/export/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      if (!req.user || (req.user.userId !== userId && !['ADMIN', 'TRANSPORT_MANAGER'].includes(req.user.role))) {
        return res.status(403).json({ error: "Access denied" });
      }
      const { exportUserData, generateGDPRDataExport } = await import("./gdprService");
      const userData = await exportUserData(userId);
      const exportJson = generateGDPRDataExport(userData);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${userId}-${new Date().toISOString().split('T')[0]}.json"`);
      res.send(exportJson);
    } catch (error) {
      console.error("GDPR export error:", error);
      res.status(500).json({ error: "Failed to export user data" });
    }
  });

  app.post("/api/gdpr/anonymize/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      if (!req.user || !['ADMIN'].includes(req.user.role)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { anonymizeUser } = await import("./gdprService");
      await anonymizeUser(userId);

      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: req.user.companyId,
        userId: req.user.userId,
        action: 'DELETE',
        entity: 'USER',
        entityId: userId,
        details: { type: 'GDPR_ANONYMIZATION' },
        req,
      });

      res.json({ success: true, message: "User data anonymized" });
    } catch (error) {
      console.error("GDPR anonymize error:", error);
      res.status(500).json({ error: "Failed to anonymize user data" });
    }
  });
}
