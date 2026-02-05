import { Router } from "express";
import { db } from "./db";
import { users, driverLocations, timesheets, inspections, vehicles } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

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

    // Fetch additional data for each driver
    const driversWithDetails = await Promise.all(
      drivers.map(async (driver) => {
        // Fetch latest location from driver_locations
        const [latestLocation] = await db
          .select()
          .from(driverLocations)
          .where(
            and(
              eq(driverLocations.driverId, driver.id),
              eq(driverLocations.companyId, companyIdNum)
            )
          )
          .orderBy(desc(driverLocations.timestamp))
          .limit(1);

        // Fetch active timesheet (current shift)
        const [activeTimesheet] = await db
          .select()
          .from(timesheets)
          .where(
            and(
              eq(timesheets.driverId, driver.id),
              eq(timesheets.companyId, companyIdNum),
              eq(timesheets.status, "ACTIVE")
            )
          )
          .limit(1);

        // Fetch assigned vehicle from most recent inspection
        const [recentInspection] = await db
          .select({
            vehicleId: inspections.vehicleId,
          })
          .from(inspections)
          .where(
            and(
              eq(inspections.driverId, driver.id),
              eq(inspections.companyId, companyIdNum)
            )
          )
          .orderBy(desc(inspections.createdAt))
          .limit(1);

        let assignedVehicle = null;
        if (recentInspection?.vehicleId) {
          const [vehicle] = await db
            .select()
            .from(vehicles)
            .where(eq(vehicles.id, recentInspection.vehicleId))
            .limit(1);
          if (vehicle) {
            assignedVehicle = {
              id: vehicle.id,
              vrm: vehicle.vrm,
              make: vehicle.make,
              model: vehicle.model,
              fleetNumber: vehicle.fleetNumber,
            };
          }
        }

        return {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          role: driver.role,
          active: driver.active,
          pin: driver.pin,
          currentLocation: latestLocation
            ? {
                latitude: latestLocation.latitude,
                longitude: latestLocation.longitude,
                speed: latestLocation.speed,
                heading: latestLocation.heading,
                accuracy: latestLocation.accuracy,
                isStagnant: latestLocation.isStagnant,
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
      })
    );

    res.json(driversWithDetails);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// POST /api/drivers - Create a new driver
router.post("/", async (req, res) => {
  try {
    console.log("POST /api/drivers - Request body:", JSON.stringify(req.body));
    const { companyId, name, email, phone, pin, licenseNumber, role } = req.body;

    if (!companyId || !name || !email || !pin) {
      console.log("Missing fields - companyId:", companyId, "name:", name, "email:", email, "pin:", pin);
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be exactly 4 digits" });
    }

    const validRoles = ["DRIVER", "TRANSPORT_MANAGER", "ADMIN"];
    const userRole = role && validRoles.includes(role) ? role : "DRIVER";

    // Check if email already exists for this company
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

    // Create the driver
    const [newDriver] = await db
      .insert(users)
      .values({
        companyId,
        name,
        email,
        role: userRole,
        pin,
        active: true,
      })
      .returning();

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
      updateData.pin = pin;
    }
    if (active !== undefined) updateData.active = active;
    if (role !== undefined) {
      const validRoles = ["DRIVER", "TRANSPORT_MANAGER", "ADMIN"];
      if (validRoles.includes(role)) {
        updateData.role = role;
      }
    }

    const [updatedDriver] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, Number(id)))
      .returning();

    if (!updatedDriver) {
      return res.status(404).json({ error: "Driver not found" });
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

export default router;
