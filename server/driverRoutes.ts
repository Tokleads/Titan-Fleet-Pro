import { Router } from "express";
import { db } from "./db";
import { users, driverLocations, timesheets, inspections, vehicles, companies } from "@shared/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { sendWelcomeEmail } from "./emailService";
import { generateUniquePin, validatePinAvailable } from "./pinUtils";

const router = Router();

// GET /api/drivers - Get all drivers for a company
router.get("/", async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const companyIdNum = Number(companyId);
    
    const drivers = await db
      .select()
      .from(users)
      .where(eq(users.companyId, companyIdNum));

    if (drivers.length === 0) return res.json([]);

    const driverIds = drivers.map(d => d.id);

    const latestLocations = await db.execute(sql`
      SELECT DISTINCT ON (driver_id) * 
      FROM driver_locations 
      WHERE company_id = ${companyIdNum} AND driver_id = ANY(ARRAY[${sql.join(driverIds.map(id => sql`${id}`), sql`, `)}]::int[])
      ORDER BY driver_id, timestamp DESC
    `);
    const locationMap = new Map();
    for (const loc of latestLocations.rows) {
      locationMap.set(loc.driver_id, loc);
    }

    const activeTimesheets = await db.select().from(timesheets)
      .where(and(
        eq(timesheets.companyId, companyIdNum),
        eq(timesheets.status, 'ACTIVE'),
        inArray(timesheets.driverId, driverIds)
      ));
    const timesheetMap = new Map();
    for (const ts of activeTimesheets) {
      timesheetMap.set(ts.driverId, ts);
    }

    const recentInspections = await db.execute(sql`
      SELECT DISTINCT ON (i.driver_id) i.driver_id, i.vehicle_id, v.vrm, v.make, v.model, v.fleet_number
      FROM inspections i
      LEFT JOIN vehicles v ON v.id = i.vehicle_id
      WHERE i.company_id = ${companyIdNum} AND i.driver_id = ANY(ARRAY[${sql.join(driverIds.map(id => sql`${id}`), sql`, `)}]::int[])
      ORDER BY i.driver_id, i.created_at DESC
    `);
    const vehicleMap = new Map();
    for (const row of recentInspections.rows) {
      vehicleMap.set(row.driver_id, {
        id: row.vehicle_id,
        vrm: row.vrm,
        make: row.make,
        model: row.model,
        fleetNumber: row.fleet_number,
      });
    }

    const driversWithDetails = drivers.map((driver) => {
      const latestLocation = locationMap.get(driver.id);
      const activeTimesheet = timesheetMap.get(driver.id);
      const assignedVehicle = vehicleMap.get(driver.id) || null;

      return {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        pin: driver.pin,
        licenseNumber: driver.licenseNumber,
        role: driver.role,
        active: driver.active,
        currentLocation: latestLocation
          ? {
              latitude: latestLocation.latitude,
              longitude: latestLocation.longitude,
              speed: latestLocation.speed,
              heading: latestLocation.heading,
              accuracy: latestLocation.accuracy,
              isStagnant: latestLocation.is_stagnant,
              timestamp: latestLocation.timestamp,
            }
          : null,
        assignedVehicle,
        currentShift: activeTimesheet
          ? {
              id: activeTimesheet.id,
              depotName: activeTimesheet.depotName,
              arrivalTime: activeTimesheet.arrivalTime,
              status: activeTimesheet.status,
            }
          : null,
      };
    });

    res.json(driversWithDetails);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

const exportAttempts = new Map<string, { count: number; lastAttempt: number }>();
const EXPORT_MAX_ATTEMPTS = 3;
const EXPORT_LOCKOUT_MS = 30 * 60 * 1000;

router.post("/export-pins", async (req, res) => {
  try {
    const { companyId, managerId, pin: managerPin } = req.body;
    if (!companyId || !managerId || !managerPin) {
      return res.status(400).json({ error: "Manager verification required" });
    }

    const attemptKey = `${managerId}-${companyId}`;
    const attempt = exportAttempts.get(attemptKey);
    if (attempt && attempt.count >= EXPORT_MAX_ATTEMPTS && (Date.now() - attempt.lastAttempt) < EXPORT_LOCKOUT_MS) {
      return res.status(429).json({ error: "Too many export attempts. Please try again in 30 minutes." });
    }

    const [manager] = await db.select().from(users)
      .where(and(
        eq(users.id, Number(managerId)),
        eq(users.companyId, Number(companyId)),
        eq(users.pin, managerPin),
        eq(users.active, true)
      ));

    if (!manager || !['TRANSPORT_MANAGER', 'ADMIN', 'MANAGER'].includes(manager.role)) {
      const current = exportAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
      exportAttempts.set(attemptKey, { count: current.count + 1, lastAttempt: Date.now() });
      return res.status(403).json({ error: "Unauthorized" });
    }

    exportAttempts.delete(attemptKey);

    const allDrivers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      pin: users.pin,
      role: users.role,
      active: users.active,
    }).from(users).where(eq(users.companyId, Number(companyId)));

    console.log(`[Audit] PIN export by manager ${manager.name} (ID:${manager.id}) for company ${companyId} - ${allDrivers.length} records`);

    res.json(allDrivers);
  } catch (error) {
    console.error("Error exporting pins:", error);
    res.status(500).json({ error: "Failed to export driver data" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { companyId, name, email, phone, pin, licenseNumber, role } = req.body;

    if (!companyId || !name || !email) {
      return res.status(400).json({ error: "Missing required fields (companyId, name, email)" });
    }

    let assignedPin = pin;
    if (assignedPin) {
      if (assignedPin.length !== 4 || !/^\d{4}$/.test(assignedPin)) {
        return res.status(400).json({ error: "PIN must be exactly 4 digits" });
      }
      const pinFree = await validatePinAvailable(Number(companyId), assignedPin);
      if (!pinFree) {
        return res.status(409).json({ error: "This PIN is already in use by another driver in your company" });
      }
    } else {
      assignedPin = await generateUniquePin(Number(companyId));
    }

    const validRoles = ["DRIVER", "TRANSPORT_MANAGER", "ADMIN"];
    const userRole = role && validRoles.includes(role) ? role : "DRIVER";

    const existingDriver = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.companyId, companyId),
          eq(users.email, email)
        )
      )
      .limit(1);

    if (existingDriver.length > 0) {
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    const [newDriver] = await db
      .insert(users)
      .values({
        companyId,
        name,
        email,
        role: userRole,
        pin: assignedPin,
        active: true,
      })
      .returning();

    // Send welcome email with app link and login details
    if (newDriver.email) {
      setImmediate(async () => {
        try {
          const [company] = await db
            .select()
            .from(companies)
            .where(eq(companies.id, Number(companyId)))
            .limit(1);

          if (company) {
            await sendWelcomeEmail({
              email: newDriver.email!,
              name: newDriver.name,
              companyName: company.name,
              companyCode: company.companyCode,
              pin: assignedPin,
            });
            console.log(`Welcome email sent to new driver ${newDriver.name} (${newDriver.email})`);
          }
        } catch (emailErr) {
          console.error("Failed to send welcome email:", emailErr);
        }
      });
    }

    res.status(201).json({
      id: newDriver.id,
      name: newDriver.name,
      email: newDriver.email,
      role: newDriver.role,
      active: newDriver.active,
      pin: newDriver.pin,
    });
  } catch (error) {
    console.error("Error creating driver:", error);
    res.status(500).json({ error: "Failed to create driver" });
  }
});

const pinAttempts = new Map<string, { count: number; lastAttempt: number }>();
const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 15 * 60 * 1000;

// POST /api/drivers/verify-pin - Verify a driver's current PIN
router.post("/verify-pin", async (req, res) => {
  try {
    const { driverId, companyId, pin } = req.body;

    if (!driverId || !companyId || !pin) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const attemptKey = `${driverId}-${companyId}`;
    const attempt = pinAttempts.get(attemptKey);
    if (attempt && attempt.count >= PIN_MAX_ATTEMPTS && (Date.now() - attempt.lastAttempt) < PIN_LOCKOUT_MS) {
      return res.status(429).json({ error: "Too many attempts. Please try again in 15 minutes." });
    }

    const [driver] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, Number(driverId)),
          eq(users.companyId, Number(companyId))
        )
      )
      .limit(1);

    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    const valid = driver.pin === pin;
    if (!valid) {
      const current = pinAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
      pinAttempts.set(attemptKey, { count: current.count + 1, lastAttempt: Date.now() });
    } else {
      pinAttempts.delete(attemptKey);
    }
    res.json({ valid });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    res.status(500).json({ error: "Failed to verify PIN" });
  }
});

// PUT /api/drivers/:id - Update a driver
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, name, email, phone, pin, licenseNumber, active, role } = req.body;

    // Verify the driver belongs to the company
    if (companyId) {
      const existingDriver = await db
        .select()
        .from(users)
        .where(and(eq(users.id, Number(id)), eq(users.companyId, Number(companyId))))
        .limit(1);
      
      if (existingDriver.length === 0) {
        return res.status(403).json({ error: "Unauthorized: Driver does not belong to this company" });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (pin !== undefined) {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be exactly 4 digits" });
      }
      const driverCompanyId = companyId || (await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, Number(id))).limit(1))[0]?.companyId;
      if (driverCompanyId) {
        const pinFree = await validatePinAvailable(Number(driverCompanyId), pin, Number(id));
        if (!pinFree) {
          return res.status(409).json({ error: "This PIN is already in use by another driver in your company" });
        }
      }
      updateData.pin = pin;
    }
    if (active !== undefined) updateData.active = active;
    if (role !== undefined) {
      const validRoles = ["DRIVER", "TRANSPORT_MANAGER", "ADMIN"];
      if (validRoles.includes(role)) {
        updateData.role = role;
      }
    }

    const [existingDriverRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(id)))
      .limit(1);

    const hadNoPinBefore = existingDriverRecord && !existingDriverRecord.pin;

    const [updatedDriver] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, Number(id)))
      .returning();

    if (!updatedDriver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    if (hadNoPinBefore && pin && updatedDriver.email) {
      setImmediate(async () => {
        try {
          const [company] = await db
            .select()
            .from(companies)
            .where(eq(companies.id, Number(updatedDriver.companyId)))
            .limit(1);

          if (company) {
            await sendWelcomeEmail({
              email: updatedDriver.email!,
              name: updatedDriver.name,
              companyName: company.name,
              companyCode: company.companyCode,
              pin: pin,
            });
            console.log(`Welcome email sent to updated driver ${updatedDriver.name} (${updatedDriver.email})`);
          }
        } catch (emailErr) {
          console.error("Failed to send welcome email:", emailErr);
        }
      });
    }

    res.json({
      id: updatedDriver.id,
      name: updatedDriver.name,
      email: updatedDriver.email,
      role: updatedDriver.role,
      active: updatedDriver.active,
      pin: updatedDriver.pin,
    });
  } catch (error) {
    console.error("Error updating driver:", error);
    res.status(500).json({ error: "Failed to update driver" });
  }
});

// DELETE /api/drivers/:id - Delete a driver
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.query;

    // Verify the driver belongs to the company for authorization
    if (companyId) {
      const existingDriver = await db
        .select()
        .from(users)
        .where(and(eq(users.id, Number(id)), eq(users.companyId, Number(companyId))))
        .limit(1);
      
      if (existingDriver.length === 0) {
        return res.status(403).json({ error: "Unauthorized: Driver does not belong to this company" });
      }
    }

    // Soft delete by setting active = false
    const [deletedDriver] = await db
      .update(users)
      .set({ active: false })
      .where(eq(users.id, Number(id)))
      .returning();

    if (!deletedDriver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    res.json({ message: "Driver deleted successfully", id: deletedDriver.id });
  } catch (error) {
    console.error("Error deleting driver:", error);
    res.status(500).json({ error: "Failed to delete driver" });
  }
});

// POST /api/drivers/manual-vehicle - Driver adds an unrecognized vehicle for manager review
router.post("/manual-vehicle", async (req, res) => {
  try {
    const { companyId, driverId, vrm, notes } = req.body;

    if (!companyId || !driverId || !vrm) {
      return res.status(400).json({ error: "Company ID, Driver ID, and VRM are required" });
    }

    // Normalize VRM (uppercase, remove spaces)
    const normalizedVrm = vrm.toUpperCase().replace(/\s+/g, '');

    // Check if vehicle already exists
    const [existingVehicle] = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.companyId, Number(companyId)),
          eq(vehicles.vrm, normalizedVrm)
        )
      );

    if (existingVehicle) {
      return res.status(400).json({ 
        error: "Vehicle already exists", 
        vehicleId: existingVehicle.id 
      });
    }

    // Get driver name for notes
    const [driver] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(driverId)));

    // Create vehicle with pending review flag
    const [newVehicle] = await db
      .insert(vehicles)
      .values({
        companyId: Number(companyId),
        vrm: normalizedVrm,
        make: "Unknown",
        model: "Pending Review",
        vehicleCategory: "HGV",
        pendingReview: true,
        addedByDriverId: Number(driverId),
        reviewNotes: notes || `Manually added by driver ${driver?.name || 'Unknown'} - needs manager verification`,
        active: true
      })
      .returning();

    res.status(201).json({
      message: "Vehicle added for manager review",
      vehicle: newVehicle,
      flaggedForReview: true
    });
  } catch (error) {
    console.error("Error adding manual vehicle:", error);
    res.status(500).json({ error: "Failed to add vehicle" });
  }
});

export default router;
