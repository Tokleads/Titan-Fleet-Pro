import { Router } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// GET /api/drivers - Get all drivers for a company
router.get("/", async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const drivers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.companyId, Number(companyId)),
          eq(users.role, "DRIVER")
        )
      );

    // TODO: Fetch current location, assigned vehicle, and shift data
    // For now, return basic driver info
    const driversWithDetails = drivers.map(driver => ({
      id: driver.id,
      name: driver.name,
      email: driver.email,
      role: driver.role,
      active: driver.active,
      pin: driver.pin,
      phone: null, // TODO: Add phone field to schema
      licenseNumber: null, // TODO: Add license field to schema
      currentLocation: null, // TODO: Fetch from driver_locations table
      assignedVehicle: null, // TODO: Fetch from vehicle assignments
      currentShift: null, // TODO: Fetch from timesheets table
    }));

    res.json(driversWithDetails);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// POST /api/drivers - Create a new driver
router.post("/", async (req, res) => {
  try {
    const { companyId, name, email, phone, pin, licenseNumber } = req.body;

    if (!companyId || !name || !email || !pin) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be exactly 4 digits" });
    }

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
        role: "DRIVER",
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
    const { name, email, phone, pin, licenseNumber, active } = req.body;

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
