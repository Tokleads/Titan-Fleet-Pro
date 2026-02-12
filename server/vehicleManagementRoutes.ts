import type { Express } from "express";
import { db } from "./db";
import {
  vehicles,
  inspections,
  defects,
  users,
  collisions,
  maintenanceBookings,
  vehiclePenalties,
  vehicleUsage,
  vehicleCategories,
  fuelEntries,
  insertCollisionSchema,
  insertMaintenanceBookingSchema,
  insertVehiclePenaltySchema,
} from "@shared/schema";
import {
  eq,
  and,
  gte,
  lte,
  desc,
  asc,
  sql,
  or,
  isNull,
  count,
  not,
  inArray,
  like,
  ilike,
} from "drizzle-orm";

function formatDateUK(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function registerVehicleManagementRoutes(app: Express) {
  // 1. GET /api/manager/vehicles/overview
  app.get("/api/manager/vehicles/overview", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [
        totalVehiclesResult,
        activeVehiclesResult,
        vorVehiclesResult,
        openDefectsResult,
        pendingDefectsResult,
        taxDueResult,
        servicesDueResult,
        motsDueResult,
        recentlyAddedResult,
        discardedResult,
      ] = await Promise.all([
        db.select({ count: count() }).from(vehicles).where(eq(vehicles.companyId, companyId)),
        db.select({ count: count() }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.active, true))),
        db.select({ count: count() }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.vorStatus, true))),
        db.select({ count: count() }).from(defects).where(and(eq(defects.companyId, companyId), eq(defects.status, "OPEN"))),
        db.select({ count: count() }).from(defects).where(and(eq(defects.companyId, companyId), eq(defects.status, "PENDING"))),
        db.select({ count: count() }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.active, true), lte(vehicles.taxDue, nextMonth), gte(vehicles.taxDue, now))),
        db.select({ count: count() }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.active, true), lte(vehicles.nextServiceDue, nextMonth))),
        db.select({ count: count() }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.active, true), lte(vehicles.motDue, nextMonth), gte(vehicles.motDue, now))),
        db.select().from(vehicles).where(and(eq(vehicles.companyId, companyId), gte(vehicles.createdAt, thirtyDaysAgo))).orderBy(desc(vehicles.createdAt)).limit(10),
        db.select().from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.active, false))).orderBy(desc(vehicles.createdAt)).limit(10),
      ]);

      const vehiclesWithChecksInLast24h = await db
        .selectDistinct({ vehicleId: inspections.vehicleId })
        .from(inspections)
        .where(and(eq(inspections.companyId, companyId), gte(inspections.createdAt, oneDayAgo)));
      const checkedVehicleIds = new Set(vehiclesWithChecksInLast24h.map((r) => r.vehicleId));

      const activeVehiclesList = await db
        .select({ id: vehicles.id })
        .from(vehicles)
        .where(and(eq(vehicles.companyId, companyId), eq(vehicles.active, true)));
      const withoutDailyCheck = activeVehiclesList.filter((v) => !checkedVehicleIds.has(v.id)).length;

      const assignedVehicleIds = await db
        .selectDistinct({ vehicleId: vehicleUsage.vehicleId })
        .from(vehicleUsage)
        .where(eq(vehicleUsage.companyId, companyId));
      const assignedSet = new Set(assignedVehicleIds.map((r) => r.vehicleId));
      const unassigned = activeVehiclesList.filter((v) => !assignedSet.has(v.id)).length;

      const sornCount = await db
        .select({ count: count() })
        .from(vehicles)
        .where(
          and(
            eq(vehicles.companyId, companyId),
            eq(vehicles.active, false),
            eq(vehicles.vorStatus, true)
          )
        );

      const latestReadings = await db
        .select({
          vehicleId: inspections.vehicleId,
          maxCreatedAt: sql<Date>`MAX(${inspections.createdAt})`.as("max_created_at"),
        })
        .from(inspections)
        .where(eq(inspections.companyId, companyId))
        .groupBy(inspections.vehicleId);

      let odometerLessThan1Week = 0;
      let odometerLessThan2Weeks = 0;
      let odometerLessThan4Weeks = 0;
      let odometerOlder = 0;
      for (const r of latestReadings) {
        const readingDate = new Date(r.maxCreatedAt);
        if (readingDate >= oneWeekAgo) odometerLessThan1Week++;
        else if (readingDate >= twoWeeksAgo) odometerLessThan2Weeks++;
        else if (readingDate >= fourWeeksAgo) odometerLessThan4Weeks++;
        else odometerOlder++;
      }

      res.json({
        kpis: {
          totalVehicles: totalVehiclesResult[0].count,
          activeVehicles: activeVehiclesResult[0].count,
          vorVehicles: vorVehiclesResult[0].count,
          sornVehicles: sornCount[0].count,
          unassignedVehicles: unassigned,
          withoutDailyCheck,
          openDefects: openDefectsResult[0].count,
          pendingDefects: pendingDefectsResult[0].count,
          taxDueNextMonth: taxDueResult[0].count,
          servicesDueNextMonth: servicesDueResult[0].count,
          motsDueNextMonth: motsDueResult[0].count,
        },
        recentlyAdded: recentlyAddedResult,
        recentlyDiscarded: discardedResult,
        odometerAgeDistribution: {
          lessThan1Week: odometerLessThan1Week,
          lessThan2Weeks: odometerLessThan2Weeks,
          lessThan4Weeks: odometerLessThan4Weeks,
          older: odometerOlder,
        },
      });
    } catch (error) {
      console.error("Vehicle overview error:", error);
      res.status(500).json({ error: "Failed to fetch vehicle overview" });
    }
  });

  // 2. GET /api/manager/vehicles/list
  app.get("/api/manager/vehicles/list", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const page = Math.max(1, Number(req.query.page) || 1);
      const perPage = Math.min(100, Math.max(1, Number(req.query.perPage) || 25));
      const search = (req.query.search as string) || "";
      const vehicleType = req.query.vehicleType as string;
      const category = req.query.category as string;
      const includeDiscarded = req.query.includeDiscarded === "true";

      const conditions: any[] = [eq(vehicles.companyId, companyId)];
      if (!includeDiscarded) conditions.push(eq(vehicles.active, true));
      if (search) conditions.push(or(ilike(vehicles.vrm, `%${search}%`), ilike(vehicles.make, `%${search}%`), ilike(vehicles.model, `%${search}%`)));
      if (vehicleType) conditions.push(eq(vehicles.vehicleCategory, vehicleType));
      if (category) conditions.push(eq(vehicles.categoryId, Number(category)));

      const whereClause = and(...conditions);

      const [totalResult, vehicleList] = await Promise.all([
        db.select({ count: count() }).from(vehicles).where(whereClause),
        db
          .select({
            id: vehicles.id,
            vrm: vehicles.vrm,
            make: vehicles.make,
            model: vehicles.model,
            vehicleCategory: vehicles.vehicleCategory,
            currentMileage: vehicles.currentMileage,
            active: vehicles.active,
            fleetNumber: vehicles.fleetNumber,
            categoryId: vehicles.categoryId,
            vorStatus: vehicles.vorStatus,
            motDue: vehicles.motDue,
            taxDue: vehicles.taxDue,
            createdAt: vehicles.createdAt,
          })
          .from(vehicles)
          .where(whereClause)
          .orderBy(asc(vehicles.vrm))
          .limit(perPage)
          .offset((page - 1) * perPage),
      ]);

      const vehicleIds = vehicleList.map((v) => v.id);
      let assignedDrivers: Record<number, { id: number; name: string; email: string }[]> = {};

      if (vehicleIds.length > 0) {
        const usages = await db
          .select({
            vehicleId: vehicleUsage.vehicleId,
            driverId: vehicleUsage.driverId,
            driverName: users.name,
            driverEmail: users.email,
          })
          .from(vehicleUsage)
          .innerJoin(users, eq(vehicleUsage.driverId, users.id))
          .where(and(eq(vehicleUsage.companyId, companyId), inArray(vehicleUsage.vehicleId, vehicleIds)));

        for (const u of usages) {
          if (!assignedDrivers[u.vehicleId]) assignedDrivers[u.vehicleId] = [];
          if (!assignedDrivers[u.vehicleId].find((d) => d.id === u.driverId)) {
            assignedDrivers[u.vehicleId].push({ id: u.driverId, name: u.driverName, email: u.driverEmail });
          }
        }
      }

      res.json({
        vehicles: vehicleList.map((v) => ({
          ...v,
          assignedDrivers: assignedDrivers[v.id] || [],
        })),
        pagination: {
          page,
          perPage,
          total: totalResult[0].count,
          totalPages: Math.ceil(totalResult[0].count / perPage),
        },
      });
    } catch (error) {
      console.error("Vehicle list error:", error);
      res.status(500).json({ error: "Failed to fetch vehicle list" });
    }
  });

  // 3. GET /api/manager/vehicles/safety-checks
  app.get("/api/manager/vehicles/safety-checks", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      const categoryFilter = req.query.category as string;
      const checksheetType = req.query.checksheetType as string;

      const conditions: any[] = [
        eq(inspections.companyId, companyId),
        gte(inspections.createdAt, startDate),
        lte(inspections.createdAt, endDate),
      ];
      if (checksheetType) conditions.push(eq(inspections.type, checksheetType));

      let query = db
        .select({
          id: inspections.id,
          createdAt: inspections.createdAt,
          type: inspections.type,
          status: inspections.status,
          odometer: inspections.odometer,
          defects: inspections.defects,
          checklist: inspections.checklist,
          vehicleVrm: vehicles.vrm,
          vehicleCategory: vehicles.vehicleCategory,
          driverName: users.name,
          driverEmail: users.email,
        })
        .from(inspections)
        .innerJoin(vehicles, eq(inspections.vehicleId, vehicles.id))
        .innerJoin(users, eq(inspections.driverId, users.id))
        .where(and(...conditions))
        .orderBy(desc(inspections.createdAt));

      const results = await query;

      let filtered = results;
      if (categoryFilter) {
        filtered = results.filter((r) => r.vehicleCategory === categoryFilter);
      }

      res.json(
        filtered.map((r) => {
          const defectsArr = (r.defects as any[]) || [];
          const remainingFaults = defectsArr.filter((d: any) => d.status !== "CLOSED" && d.status !== "RECTIFIED").length;
          return {
            id: r.id,
            inspectionDate: formatDateUK(r.createdAt),
            registration: r.vehicleVrm,
            driverName: r.driverName,
            driverEmail: r.driverEmail,
            checksheetTitle: r.type,
            faultsCount: defectsArr.length,
            remainingFaults,
            status: r.status,
          };
        })
      );
    } catch (error) {
      console.error("Safety checks error:", error);
      res.status(500).json({ error: "Failed to fetch safety checks" });
    }
  });

  // 4. GET /api/manager/vehicles/defects
  app.get("/api/manager/vehicles/defects", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const statusFilter = (req.query.status as string) || "ALL";
      const supplier = req.query.supplier as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const conditions: any[] = [eq(defects.companyId, companyId)];
      if (statusFilter === "OPEN") conditions.push(eq(defects.status, "OPEN"));
      else if (statusFilter === "COMPLETED") conditions.push(eq(defects.status, "COMPLETED"));
      else if (statusFilter === "CANCELLED") conditions.push(eq(defects.status, "CANCELLED"));
      else if (statusFilter === "MONITOR") conditions.push(eq(defects.status, "MONITOR"));
      else if (statusFilter === "CLOSED") conditions.push(eq(defects.status, "CLOSED"));
      if (startDate) conditions.push(gte(defects.createdAt, startDate));
      if (endDate) conditions.push(lte(defects.createdAt, endDate));
      if (supplier && supplier !== "All Suppliers") conditions.push(eq(defects.supplier, supplier));

      const results = await db
        .select({
          id: defects.id,
          description: defects.description,
          status: defects.status,
          severity: defects.severity,
          category: defects.category,
          createdAt: defects.createdAt,
          resolvedAt: defects.resolvedAt,
          vehicleVrm: vehicles.vrm,
          supplier: defects.supplier,
          site: defects.site,
          requiredBy: defects.requiredBy,
        })
        .from(defects)
        .leftJoin(vehicles, eq(defects.vehicleId, vehicles.id))
        .where(and(...conditions))
        .orderBy(desc(defects.createdAt));

      const now = new Date();
      res.json(
        results.map((r) => {
          const daysOpen = r.resolvedAt
            ? Math.ceil((new Date(r.resolvedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            : Math.ceil((now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          return {
            reference: r.id,
            registration: r.vehicleVrm,
            reportedDate: formatDateUK(r.createdAt),
            reportedDateISO: r.createdAt.toISOString(),
            requiredBy: r.requiredBy ? formatDateUK(r.requiredBy) : "Not Set",
            daysOpen,
            supplier: r.supplier || "",
            site: r.site || "",
            faultDescription: r.description,
            status: r.status,
            severity: r.severity,
            category: r.category,
          };
        })
      );
    } catch (error) {
      console.error("Defects error:", error);
      res.status(500).json({ error: "Failed to fetch defects" });
    }
  });

  // 5. POST /api/manager/vehicles/defects/bulk-status
  app.post("/api/manager/vehicles/defects/bulk-status", async (req, res) => {
    try {
      const { defectIds, status } = req.body;
      if (!Array.isArray(defectIds) || !status) {
        return res.status(400).json({ error: "Missing defectIds array or status" });
      }

      const validStatuses = ["OPEN", "COMPLETED", "CANCELLED", "MONITOR", "ASSIGNED", "IN_PROGRESS", "RECTIFIED", "VERIFIED", "CLOSED", "DEFERRED"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updateData: any = { status, updatedAt: new Date() };
      if (status === "CLOSED" || status === "RECTIFIED") {
        updateData.resolvedAt = new Date();
      }

      await db
        .update(defects)
        .set(updateData)
        .where(inArray(defects.id, defectIds));

      res.json({ success: true, updated: defectIds.length });
    } catch (error) {
      console.error("Bulk status update error:", error);
      res.status(500).json({ error: "Failed to update defect statuses" });
    }
  });

  // 6. GET /api/manager/vehicles/pending-defects
  app.get("/api/manager/vehicles/pending-defects", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const vehicleType = req.query.vehicleType as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const conditions: any[] = [
        eq(inspections.companyId, companyId),
        eq(inspections.status, "FAIL"),
        gte(inspections.createdAt, startDate),
        lte(inspections.createdAt, endDate),
      ];

      const results = await db
        .select({
          inspectionId: inspections.id,
          createdAt: inspections.createdAt,
          defects: inspections.defects,
          driverName: users.name,
          vehicleVrm: vehicles.vrm,
          vehicleCategory: vehicles.vehicleCategory,
          fleetNumber: vehicles.fleetNumber,
        })
        .from(inspections)
        .innerJoin(vehicles, eq(inspections.vehicleId, vehicles.id))
        .innerJoin(users, eq(inspections.driverId, users.id))
        .where(and(...conditions))
        .orderBy(desc(inspections.createdAt));

      let filtered = results;
      if (vehicleType) {
        filtered = results.filter((r) => r.vehicleCategory === vehicleType);
      }

      const pendingItems: any[] = [];
      for (const r of filtered) {
        const defectsArr = (r.defects as any[]) || [];
        for (const d of defectsArr) {
          pendingItems.push({
            checkDate: formatDateUK(r.createdAt),
            driverName: r.driverName,
            registration: r.vehicleVrm,
            vehicleType: r.vehicleCategory,
            fleetNumber: r.fleetNumber,
            description: d.description || d.note || d,
          });
        }
      }

      res.json(pendingItems);
    } catch (error) {
      console.error("Pending defects error:", error);
      res.status(500).json({ error: "Failed to fetch pending defects" });
    }
  });

  // 7. GET /api/manager/vehicles/maintenance
  app.get("/api/manager/vehicles/maintenance", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const categoryFilter = req.query.category as string;
      const supplierFilter = req.query.supplier as string;
      const statusFilter = req.query.status as string;

      const conditions: any[] = [eq(maintenanceBookings.companyId, companyId)];
      if (startDate) conditions.push(gte(maintenanceBookings.bookingDate, startDate));
      if (endDate) conditions.push(lte(maintenanceBookings.bookingDate, endDate));
      if (categoryFilter) conditions.push(eq(maintenanceBookings.category, categoryFilter));
      if (supplierFilter) conditions.push(eq(maintenanceBookings.supplier, supplierFilter));
      if (statusFilter) conditions.push(eq(maintenanceBookings.status, statusFilter));

      const results = await db
        .select({
          id: maintenanceBookings.id,
          vehicleId: maintenanceBookings.vehicleId,
          category: maintenanceBookings.category,
          supplier: maintenanceBookings.supplier,
          bookingDate: maintenanceBookings.bookingDate,
          bookingTime: maintenanceBookings.bookingTime,
          endDate: maintenanceBookings.endDate,
          status: maintenanceBookings.status,
          description: maintenanceBookings.description,
          costEstimate: maintenanceBookings.costEstimate,
          actualCost: maintenanceBookings.actualCost,
          notes: maintenanceBookings.notes,
          vehicleVrm: vehicles.vrm,
        })
        .from(maintenanceBookings)
        .innerJoin(vehicles, eq(maintenanceBookings.vehicleId, vehicles.id))
        .where(and(...conditions))
        .orderBy(desc(maintenanceBookings.bookingDate));

      res.json(
        results.map((r) => ({
          ...r,
          bookingDateFormatted: formatDateUK(r.bookingDate),
          endDateFormatted: formatDateUK(r.endDate),
        }))
      );
    } catch (error) {
      console.error("Maintenance error:", error);
      res.status(500).json({ error: "Failed to fetch maintenance bookings" });
    }
  });

  // 8. POST /api/manager/vehicles/maintenance
  app.post("/api/manager/vehicles/maintenance", async (req, res) => {
    try {
      const body = { ...req.body };
      if (typeof body.bookingDate === "string") body.bookingDate = new Date(body.bookingDate);
      if (typeof body.endDate === "string") body.endDate = new Date(body.endDate);

      const validated = insertMaintenanceBookingSchema.parse(body);
      const [booking] = await db.insert(maintenanceBookings).values(validated).returning();
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Create maintenance error:", error);
      if (error?.errors) return res.status(400).json({ error: "Validation failed", details: error.errors });
      res.status(500).json({ error: "Failed to create maintenance booking" });
    }
  });

  // 9. GET /api/manager/vehicles/services-due
  app.get("/api/manager/vehicles/services-due", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const categoryFilter = req.query.category as string;
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const conditions: any[] = [
        eq(vehicles.companyId, companyId),
        eq(vehicles.active, true),
      ];
      if (categoryFilter) conditions.push(eq(vehicles.categoryId, Number(categoryFilter)));

      const allVehicles = await db
        .select()
        .from(vehicles)
        .where(and(...conditions))
        .orderBy(asc(vehicles.nextServiceDue));

      const due = allVehicles.filter((v) => {
        const serviceDateDue = v.nextServiceDue && new Date(v.nextServiceDue) <= nextMonth;
        const serviceMileageDue = v.nextServiceMileage && v.currentMileage && v.nextServiceMileage - v.currentMileage <= 1000;
        return serviceDateDue || serviceMileageDue;
      });

      res.json(
        due.map((v) => ({
          id: v.id,
          vrm: v.vrm,
          make: v.make,
          model: v.model,
          vehicleCategory: v.vehicleCategory,
          currentMileage: v.currentMileage,
          lastServiceDate: formatDateUK(v.lastServiceDate),
          lastServiceMileage: v.lastServiceMileage,
          nextServiceDue: formatDateUK(v.nextServiceDue),
          nextServiceMileage: v.nextServiceMileage,
          milesUntilService: v.nextServiceMileage && v.currentMileage ? v.nextServiceMileage - v.currentMileage : null,
        }))
      );
    } catch (error) {
      console.error("Services due error:", error);
      res.status(500).json({ error: "Failed to fetch services due" });
    }
  });

  // 10. GET /api/manager/vehicles/mots-due
  app.get("/api/manager/vehicles/mots-due", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const categoryFilter = req.query.category as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      const conditions: any[] = [
        eq(vehicles.companyId, companyId),
        eq(vehicles.active, true),
        gte(vehicles.motDue, startDate),
        lte(vehicles.motDue, endDate),
      ];
      if (categoryFilter) conditions.push(eq(vehicles.categoryId, Number(categoryFilter)));

      const results = await db
        .select({
          id: vehicles.id,
          vrm: vehicles.vrm,
          make: vehicles.make,
          model: vehicles.model,
          vehicleCategory: vehicles.vehicleCategory,
          motDue: vehicles.motDue,
          categoryId: vehicles.categoryId,
        })
        .from(vehicles)
        .where(and(...conditions))
        .orderBy(asc(vehicles.motDue));

      const vehicleIds = results.map((v) => v.id);
      let driverMap: Record<number, string> = {};
      if (vehicleIds.length > 0) {
        const usages = await db
          .select({ vehicleId: vehicleUsage.vehicleId, driverName: users.name })
          .from(vehicleUsage)
          .innerJoin(users, eq(vehicleUsage.driverId, users.id))
          .where(inArray(vehicleUsage.vehicleId, vehicleIds));
        for (const u of usages) {
          if (!driverMap[u.vehicleId]) driverMap[u.vehicleId] = u.driverName;
        }
      }

      res.json(
        results.map((v) => ({
          id: v.id,
          registration: v.vrm,
          category: v.vehicleCategory,
          motDueDate: formatDateUK(v.motDue),
          assignedDriver: driverMap[v.id] || "Unassigned",
        }))
      );
    } catch (error) {
      console.error("MOTs due error:", error);
      res.status(500).json({ error: "Failed to fetch MOTs due" });
    }
  });

  // 11. GET /api/manager/vehicles/vor
  app.get("/api/manager/vehicles/vor", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const categoryFilter = req.query.category as string;

      const currentConditions: any[] = [
        eq(vehicles.companyId, companyId),
        eq(vehicles.vorStatus, true),
      ];
      if (categoryFilter) currentConditions.push(eq(vehicles.categoryId, Number(categoryFilter)));

      const currentVOR = await db
        .select()
        .from(vehicles)
        .where(and(...currentConditions))
        .orderBy(desc(vehicles.vorStartDate));

      const historyConditions: any[] = [
        eq(vehicles.companyId, companyId),
        eq(vehicles.vorStatus, false),
        not(isNull(vehicles.vorResolvedDate)),
      ];
      if (categoryFilter) historyConditions.push(eq(vehicles.categoryId, Number(categoryFilter)));

      const vorHistory = await db
        .select()
        .from(vehicles)
        .where(and(...historyConditions))
        .orderBy(desc(vehicles.vorResolvedDate))
        .limit(50);

      res.json({
        current: currentVOR.map((v) => ({
          id: v.id,
          vrm: v.vrm,
          make: v.make,
          model: v.model,
          vorReason: v.vorReason,
          vorStartDate: formatDateUK(v.vorStartDate),
          vorNotes: v.vorNotes,
          vehicleCategory: v.vehicleCategory,
        })),
        history: vorHistory.map((v) => ({
          id: v.id,
          vrm: v.vrm,
          make: v.make,
          model: v.model,
          vorReason: v.vorReason,
          vorStartDate: formatDateUK(v.vorStartDate),
          vorResolvedDate: formatDateUK(v.vorResolvedDate),
          vorNotes: v.vorNotes,
          vehicleCategory: v.vehicleCategory,
        })),
      });
    } catch (error) {
      console.error("VOR error:", error);
      res.status(500).json({ error: "Failed to fetch VOR data" });
    }
  });

  // 12. GET /api/manager/vehicles/tax-due
  app.get("/api/manager/vehicles/tax-due", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const categoryFilter = req.query.category as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      const conditions: any[] = [
        eq(vehicles.companyId, companyId),
        eq(vehicles.active, true),
        gte(vehicles.taxDue, startDate),
        lte(vehicles.taxDue, endDate),
      ];
      if (categoryFilter) conditions.push(eq(vehicles.categoryId, Number(categoryFilter)));

      const results = await db
        .select({
          id: vehicles.id,
          vrm: vehicles.vrm,
          vehicleCategory: vehicles.vehicleCategory,
          taxDue: vehicles.taxDue,
          categoryId: vehicles.categoryId,
        })
        .from(vehicles)
        .where(and(...conditions))
        .orderBy(asc(vehicles.taxDue));

      res.json(
        results.map((v) => ({
          id: v.id,
          registration: v.vrm,
          category: v.vehicleCategory,
          taxDueDate: formatDateUK(v.taxDue),
        }))
      );
    } catch (error) {
      console.error("Tax due error:", error);
      res.status(500).json({ error: "Failed to fetch tax due vehicles" });
    }
  });

  // 13. GET /api/manager/vehicles/sorn
  app.get("/api/manager/vehicles/sorn", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const categoryFilter = req.query.category as string;

      const conditions: any[] = [
        eq(vehicles.companyId, companyId),
        eq(vehicles.active, false),
        eq(vehicles.vorStatus, true),
      ];
      if (categoryFilter) conditions.push(eq(vehicles.categoryId, Number(categoryFilter)));

      const results = await db
        .select()
        .from(vehicles)
        .where(and(...conditions))
        .orderBy(asc(vehicles.vrm));

      res.json(
        results.map((v) => ({
          id: v.id,
          registration: v.vrm,
          make: v.make,
          model: v.model,
          vehicleCategory: v.vehicleCategory,
          vorReason: v.vorReason,
          vorStartDate: formatDateUK(v.vorStartDate),
          vorNotes: v.vorNotes,
        }))
      );
    } catch (error) {
      console.error("SORN error:", error);
      res.status(500).json({ error: "Failed to fetch SORN vehicles" });
    }
  });

  // 14. GET /api/manager/vehicles/collisions
  app.get("/api/manager/vehicles/collisions", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const statusFilter = req.query.status as string;
      const insurerFilter = req.query.insurer as string;
      const requiresFollowUp = req.query.requiresFollowUp as string;
      const categoryFilter = req.query.category as string;

      const conditions: any[] = [eq(collisions.companyId, companyId)];
      if (statusFilter) conditions.push(eq(collisions.status, statusFilter));
      if (insurerFilter) conditions.push(eq(collisions.insurer, insurerFilter));
      if (requiresFollowUp === "true") conditions.push(eq(collisions.requiresFollowUp, true));

      const results = await db
        .select({
          id: collisions.id,
          vehicleId: collisions.vehicleId,
          driverId: collisions.driverId,
          collisionDate: collisions.collisionDate,
          status: collisions.status,
          fault: collisions.fault,
          description: collisions.description,
          internalReference: collisions.internalReference,
          insurerReference: collisions.insurerReference,
          insurer: collisions.insurer,
          requiresFollowUp: collisions.requiresFollowUp,
          followUpNotes: collisions.followUpNotes,
          vehicleVrm: vehicles.vrm,
          vehicleCategory: vehicles.vehicleCategory,
          driverName: users.name,
        })
        .from(collisions)
        .innerJoin(vehicles, eq(collisions.vehicleId, vehicles.id))
        .leftJoin(users, eq(collisions.driverId, users.id))
        .where(and(...conditions))
        .orderBy(desc(collisions.collisionDate));

      let filtered = results;
      if (categoryFilter) {
        filtered = results.filter((r) => r.vehicleCategory === categoryFilter);
      }

      res.json(
        filtered.map((r) => ({
          ...r,
          collisionDateFormatted: formatDateUK(r.collisionDate),
        }))
      );
    } catch (error) {
      console.error("Collisions error:", error);
      res.status(500).json({ error: "Failed to fetch collisions" });
    }
  });

  // 15. POST /api/manager/vehicles/collisions
  app.post("/api/manager/vehicles/collisions", async (req, res) => {
    try {
      const body = { ...req.body };
      if (typeof body.collisionDate === "string") body.collisionDate = new Date(body.collisionDate);

      const validated = insertCollisionSchema.parse(body);
      const [collision] = await db.insert(collisions).values(validated).returning();
      res.status(201).json(collision);
    } catch (error: any) {
      console.error("Create collision error:", error);
      if (error?.errors) return res.status(400).json({ error: "Validation failed", details: error.errors });
      res.status(500).json({ error: "Failed to create collision record" });
    }
  });

  // 16. GET /api/manager/vehicles/penalties
  app.get("/api/manager/vehicles/penalties", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const statusFilter = req.query.status as string;
      const categoryFilter = req.query.category as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const onlyUnpaid = req.query.onlyUnpaid === "true";

      const conditions: any[] = [eq(vehiclePenalties.companyId, companyId)];
      if (statusFilter) conditions.push(eq(vehiclePenalties.penaltyStatus, statusFilter));
      if (onlyUnpaid) conditions.push(eq(vehiclePenalties.paid, false));
      if (startDate) conditions.push(gte(vehiclePenalties.penaltyDate, startDate));
      if (endDate) conditions.push(lte(vehiclePenalties.penaltyDate, endDate));

      const results = await db
        .select({
          id: vehiclePenalties.id,
          vehicleId: vehiclePenalties.vehicleId,
          driverId: vehiclePenalties.driverId,
          pcnReference: vehiclePenalties.pcnReference,
          internalReference: vehiclePenalties.internalReference,
          penaltyType: vehiclePenalties.penaltyType,
          penaltyDate: vehiclePenalties.penaltyDate,
          amount: vehiclePenalties.amount,
          penaltyStatus: vehiclePenalties.penaltyStatus,
          paid: vehiclePenalties.paid,
          paidDate: vehiclePenalties.paidDate,
          authority: vehiclePenalties.authority,
          notes: vehiclePenalties.notes,
          vehicleVrm: vehicles.vrm,
          vehicleCategory: vehicles.vehicleCategory,
          driverName: users.name,
        })
        .from(vehiclePenalties)
        .innerJoin(vehicles, eq(vehiclePenalties.vehicleId, vehicles.id))
        .leftJoin(users, eq(vehiclePenalties.driverId, users.id))
        .where(and(...conditions))
        .orderBy(desc(vehiclePenalties.penaltyDate));

      let filtered = results;
      if (categoryFilter) {
        filtered = results.filter((r) => r.vehicleCategory === categoryFilter);
      }

      res.json(
        filtered.map((r) => ({
          ...r,
          penaltyDateFormatted: formatDateUK(r.penaltyDate),
          paidDateFormatted: formatDateUK(r.paidDate),
        }))
      );
    } catch (error) {
      console.error("Penalties error:", error);
      res.status(500).json({ error: "Failed to fetch penalties" });
    }
  });

  // 17. POST /api/manager/vehicles/penalties
  app.post("/api/manager/vehicles/penalties", async (req, res) => {
    try {
      const body = { ...req.body };
      if (typeof body.penaltyDate === "string") body.penaltyDate = new Date(body.penaltyDate);
      if (typeof body.paidDate === "string") body.paidDate = new Date(body.paidDate);

      const validated = insertVehiclePenaltySchema.parse(body);
      const [penalty] = await db.insert(vehiclePenalties).values(validated).returning();
      res.status(201).json(penalty);
    } catch (error: any) {
      console.error("Create penalty error:", error);
      if (error?.errors) return res.status(400).json({ error: "Validation failed", details: error.errors });
      res.status(500).json({ error: "Failed to create penalty record" });
    }
  });

  // 18. GET /api/manager/vehicles/fuel-purchases
  app.get("/api/manager/vehicles/fuel-purchases", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "Missing companyId" });

      const page = Math.max(1, Number(req.query.page) || 1);
      const perPage = Math.min(100, Math.max(1, Number(req.query.perPage) || 10));
      const search = (req.query.search as string) || "";
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const includeDiscarded = req.query.includeDiscarded === "true";
      const fuelType = req.query.fuelType as string;

      const conditions: any[] = [eq(fuelEntries.companyId, companyId)];
      if (startDate) conditions.push(gte(fuelEntries.date, startDate));
      if (endDate) conditions.push(lte(fuelEntries.date, endDate));
      if (fuelType) conditions.push(eq(fuelEntries.fuelType, fuelType));

      let vehicleConditions: any[] = [];
      if (!includeDiscarded) {
        vehicleConditions.push(eq(vehicles.active, true));
      }

      const baseWhere = and(...conditions);

      const totalResult = await db
        .select({ count: count() })
        .from(fuelEntries)
        .innerJoin(vehicles, eq(fuelEntries.vehicleId, vehicles.id))
        .where(
          includeDiscarded
            ? baseWhere
            : and(baseWhere, eq(vehicles.active, true))
        );

      let query = db
        .select({
          id: fuelEntries.id,
          date: fuelEntries.date,
          fuelType: fuelEntries.fuelType,
          odometer: fuelEntries.odometer,
          litres: fuelEntries.litres,
          price: fuelEntries.price,
          location: fuelEntries.location,
          vehicleVrm: vehicles.vrm,
          vehicleActive: vehicles.active,
          driverName: users.name,
        })
        .from(fuelEntries)
        .innerJoin(vehicles, eq(fuelEntries.vehicleId, vehicles.id))
        .leftJoin(users, eq(fuelEntries.driverId, users.id))
        .where(
          includeDiscarded
            ? baseWhere
            : and(baseWhere, eq(vehicles.active, true))
        )
        .orderBy(desc(fuelEntries.date))
        .limit(perPage)
        .offset((page - 1) * perPage);

      const results = await query;

      let filtered = results;
      if (search) {
        const s = search.toLowerCase();
        filtered = results.filter(
          (r) =>
            r.vehicleVrm?.toLowerCase().includes(s) ||
            r.driverName?.toLowerCase().includes(s) ||
            r.location?.toLowerCase().includes(s)
        );
      }

      const vatRate = 0.2;
      res.json({
        purchases: filtered.map((r) => {
          const grossPence = r.price || 0;
          const grossPounds = grossPence / 100;
          const vatPounds = grossPounds - grossPounds / (1 + vatRate);
          const netPounds = grossPounds - vatPounds;
          return {
            id: r.id,
            transactionDate: formatDateUK(r.date),
            cardRegistration: r.vehicleVrm,
            transactionRegistration: r.vehicleVrm,
            transactionOdometer: r.odometer,
            product: r.fuelType,
            quantity: r.litres ? (r.litres / 100).toFixed(2) : "0.00",
            gross: `£${grossPounds.toFixed(2)}`,
            vat: `£${vatPounds.toFixed(2)}`,
            net: `£${netPounds.toFixed(2)}`,
            driverName: r.driverName,
            location: r.location,
          };
        }),
        pagination: {
          page,
          perPage,
          total: totalResult[0].count,
          totalPages: Math.ceil(totalResult[0].count / perPage),
        },
      });
    } catch (error) {
      console.error("Fuel purchases error:", error);
      res.status(500).json({ error: "Failed to fetch fuel purchases" });
    }
  });
}
