import { 
  type User, type InsertUser,
  type Company, type InsertCompany,
  type Vehicle, type InsertVehicle,
  type Inspection, type InsertInspection,
  type FuelEntry, type InsertFuelEntry,
  type Media, type InsertMedia,
  type Defect, type InsertDefect,
  type Trailer, type InsertTrailer,
  type Document, type InsertDocument,
  type DocumentAcknowledgment, type InsertDocumentAcknowledgment,
  type LicenseUpgradeRequest, type InsertLicenseUpgradeRequest,
  type AuditLog, type InsertAuditLog,
  type VehicleUsageInfo, type VehicleUsageState,
  type DriverLocation, type InsertDriverLocation,
  type Geofence, type InsertGeofence,
  type Timesheet, type InsertTimesheet,
  type StagnationAlert, type InsertStagnationAlert,
  type Notification, type InsertNotification,
  type ServiceHistory, type InsertServiceHistory,
  companies, users, vehicles, inspections, fuelEntries, media, vehicleUsage, defects, trailers, documents, documentAcknowledgments, licenseUpgradeRequests, auditLogs, driverLocations, geofences, timesheets, stagnationAlerts, notifications, serviceHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, count } from "drizzle-orm";

export interface IStorage {
  // Company operations
  getCompanyByCode(code: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vehicle operations
  getVehiclesByCompany(companyId: number, limit?: number, offset?: number): Promise<{ vehicles: Vehicle[], total: number }>;
  searchVehicles(companyId: number, query: string): Promise<Vehicle[]>;
  getVehicleById(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  getRecentVehicles(companyId: number, driverId: number, limit: number): Promise<Vehicle[]>;
  trackVehicleUsage(companyId: number, driverId: number, vehicleId: number): Promise<void>;
  
  // Inspection operations
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  getInspectionsByDriver(companyId: number, driverId: number, days: number): Promise<Inspection[]>;
  getInspectionsByCompany(companyId: number): Promise<Inspection[]>;
  
  // Fuel operations
  createFuelEntry(entry: InsertFuelEntry): Promise<FuelEntry>;
  getFuelEntriesByDriver(companyId: number, driverId: number, days: number): Promise<FuelEntry[]>;
  
  // Media operations
  createMedia(mediaData: InsertMedia): Promise<Media>;
  
  // Manager operations
  getUserByCompanyAndPin(companyId: number, pin: string, role: string): Promise<User | undefined>;
  getManagerDashboardStats(companyId: number): Promise<{
    inspectionsToday: number;
    openDefects: number;
    vehiclesDue: number;
    totalVehicles: number;
  }>;
  getAllInspections(companyId: number, limit?: number, offset?: number): Promise<Inspection[]>;
  getInspectionById(id: number): Promise<Inspection | undefined>;
  
  // Defect operations
  getDefectsByCompany(companyId: number): Promise<Defect[]>;
  createDefect(defect: InsertDefect): Promise<Defect>;
  updateDefect(id: number, updates: Partial<Defect>): Promise<Defect | undefined>;
  
  // Trailer operations
  getTrailersByCompany(companyId: number): Promise<Trailer[]>;
  createTrailer(trailer: InsertTrailer): Promise<Trailer>;
  updateTrailer(id: number, updates: Partial<Trailer>): Promise<Trailer | undefined>;
  
  // Vehicle CRUD
  updateVehicle(id: number, updates: Partial<Vehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<void>;
  
  // VOR Management
  setVehicleVOR(id: number, reason: string, notes?: string): Promise<Vehicle | undefined>;
  resolveVehicleVOR(id: number): Promise<Vehicle | undefined>;
  getVORVehicles(companyId: number): Promise<Vehicle[]>;
  
  // Service Interval Management
  updateVehicleMileage(id: number, mileage: number): Promise<Vehicle | undefined>;
  logService(service: any): Promise<any>;
  getServiceHistory(vehicleId: number): Promise<any[]>;
  getServiceDueVehicles(companyId: number): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  
  // Fuel for company
  getFuelEntriesByCompany(companyId: number, days?: number): Promise<FuelEntry[]>;
  
  // User management
  getUsersByCompany(companyId: number): Promise<User[]>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Document operations
  getDocumentsByCompany(companyId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<void>;
  getUnreadDocuments(companyId: number, userId: number): Promise<Document[]>;
  acknowledgeDocument(documentId: number, userId: number): Promise<DocumentAcknowledgment>;
  getDocumentAcknowledgments(documentId: number): Promise<(DocumentAcknowledgment & { user?: User })[]>;
  
  // License operations
  getVehicleUsage(companyId: number): Promise<VehicleUsageInfo>;
  getCompanyById(companyId: number): Promise<Company | undefined>;
  createLicenseUpgradeRequest(request: InsertLicenseUpgradeRequest): Promise<LicenseUpgradeRequest>;
  getActiveVehicleCount(companyId: number): Promise<number>;
  
  // Company settings
  updateCompany(id: number, updates: Partial<Company>): Promise<Company | undefined>;
  
  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(companyId: number, options?: { limit?: number; offset?: number; entity?: string; action?: string }): Promise<AuditLog[]>;
  getAuditLogCount(companyId: number, options?: { entity?: string; action?: string }): Promise<number>;
  
  // GPS Tracking & Location operations
  createDriverLocation(location: InsertDriverLocation): Promise<DriverLocation>;
  getLatestDriverLocations(companyId: number): Promise<(DriverLocation & { driver?: User })[]>;
  checkStagnation(driverId: number, companyId: number): Promise<void>;
  
  // Geofence operations
  createGeofence(geofence: InsertGeofence): Promise<Geofence>;
  getGeofencesByCompany(companyId: number): Promise<Geofence[]>;
  updateGeofence(id: number, updates: Partial<Geofence>): Promise<Geofence | undefined>;
  checkGeofences(driverId: number, companyId: number, latitude: string, longitude: string): Promise<void>;
  
  // Timesheet operations
  getTimesheets(companyId: number, status?: string, startDate?: string, endDate?: string): Promise<(Timesheet & { driver?: User })[]>;
  getActiveTimesheet(driverId: number): Promise<Timesheet | undefined>;
  clockIn(companyId: number, driverId: number, depotId: number, latitude: string, longitude: string): Promise<Timesheet>;
  clockOut(timesheetId: number, latitude: string, longitude: string): Promise<Timesheet>;
  updateTimesheet(id: number, updates: Partial<Timesheet>): Promise<Timesheet | undefined>;
  generateTimesheetCSV(timesheets: (Timesheet & { driver?: User })[]): Promise<string>;
  
  // Stagnation Alert operations
  getStagnationAlerts(companyId: number, status?: string): Promise<(StagnationAlert & { driver?: User })[]>;
  updateStagnationAlert(id: number, updates: Partial<StagnationAlert>): Promise<StagnationAlert | undefined>;
  
  // Notification operations (Titan Command)
  createBroadcastNotification(notification: InsertNotification): Promise<Notification>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  getDriverNotifications(driverId: number): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<Notification | undefined>;
  
  // Shift check operations (End-of-shift vehicle checks)
  createShiftCheck(companyId: number, driverId: number, vehicleId: number, timesheetId: number): Promise<any>;
  addShiftCheckItem(shiftCheckId: number, itemId: string, label: string, itemType: string, status: string, value?: string, notes?: string, photoUrl?: string): Promise<any>;
  completeShiftCheck(shiftCheckId: number, latitude: string, longitude: string): Promise<any>;
  getShiftChecksByCompany(companyId: number): Promise<any[]>;
  getShiftChecksByDriver(driverId: number): Promise<any[]>;
  
  // Reminder operations (Compliance tracking)
  createReminder(reminder: any): Promise<any>;
  getActiveReminders(companyId?: number): Promise<any[]>;
  getRemindersByVehicle(vehicleId: number): Promise<any[]>;
  updateReminder(id: number, updates: Partial<any>): Promise<any | undefined>;
  completeReminder(id: number, completedBy: number, notes?: string): Promise<any | undefined>;
  snoozeReminder(id: number, snoozedBy: number, snoozedUntil: Date, reason?: string): Promise<any | undefined>;
  dismissReminder(id: number): Promise<any | undefined>;
  getCompany(companyId: number): Promise<any | undefined>;
  getVehicle(vehicleId: number): Promise<any | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Company
  async getCompanyByCode(code: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.companyCode, code));
    return company || undefined;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  // User
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Vehicle
  async getVehiclesByCompany(companyId: number, limit: number = 50, offset: number = 0): Promise<{ vehicles: Vehicle[], total: number }> {
    const vehicleList = await db.select().from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(vehicles.active, true)
      ))
      .orderBy(vehicles.vrm)
      .limit(limit)
      .offset(offset);
    
    const [{ count: totalCount }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(vehicles.active, true)
      ));
    
    return { vehicles: vehicleList, total: totalCount };
  }

  async searchVehicles(companyId: number, query: string): Promise<Vehicle[]> {
    const normalizedQuery = query.toUpperCase().replace(/\s/g, '');
    return await db.select().from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(vehicles.active, true),
        sql`UPPER(REPLACE(${vehicles.vrm}, ' ', '')) LIKE ${`%${normalizedQuery}%`}`
      ))
      .limit(10);
  }

  async getVehicleById(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async getRecentVehicles(companyId: number, driverId: number, limit: number): Promise<Vehicle[]> {
    const result = await db
      .select({ vehicle: vehicles })
      .from(vehicleUsage)
      .innerJoin(vehicles, eq(vehicleUsage.vehicleId, vehicles.id))
      .where(and(
        eq(vehicleUsage.companyId, companyId),
        eq(vehicleUsage.driverId, driverId)
      ))
      .orderBy(desc(vehicleUsage.lastUsedAt))
      .limit(limit);
    
    return result.map(r => r.vehicle);
  }

  async trackVehicleUsage(companyId: number, driverId: number, vehicleId: number): Promise<void> {
    // For simplicity, just insert/update - Drizzle handles duplicates
    try {
      await db.insert(vehicleUsage).values({ 
        companyId, 
        driverId, 
        vehicleId, 
        lastUsedAt: new Date() 
      });
    } catch (error) {
      // If already exists, update the timestamp
      await db
        .update(vehicleUsage)
        .set({ lastUsedAt: new Date() })
        .where(
          and(
            eq(vehicleUsage.companyId, companyId),
            eq(vehicleUsage.driverId, driverId),
            eq(vehicleUsage.vehicleId, vehicleId)
          )
        );
    }
  }

  // Inspection
  async createInspection(inspection: InsertInspection): Promise<Inspection> {
    const [newInspection] = await db.insert(inspections).values(inspection).returning();
    return newInspection;
  }

  async getInspectionsByDriver(companyId: number, driverId: number, days: number): Promise<Inspection[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db.select().from(inspections)
      .where(and(
        eq(inspections.companyId, companyId),
        eq(inspections.driverId, driverId),
        sql`${inspections.createdAt} >= ${cutoffDate}`
      ))
      .orderBy(desc(inspections.createdAt));
  }

  async getInspectionsByCompany(companyId: number): Promise<Inspection[]> {
    return await db.select().from(inspections)
      .where(eq(inspections.companyId, companyId))
      .orderBy(desc(inspections.createdAt))
      .limit(50);
  }

  // Fuel
  async createFuelEntry(entry: InsertFuelEntry): Promise<FuelEntry> {
    const [newEntry] = await db.insert(fuelEntries).values(entry).returning();
    return newEntry;
  }

  async getFuelEntriesByDriver(companyId: number, driverId: number, days: number): Promise<FuelEntry[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db.select().from(fuelEntries)
      .where(and(
        eq(fuelEntries.companyId, companyId),
        eq(fuelEntries.driverId, driverId),
        sql`${fuelEntries.createdAt} >= ${cutoffDate}`
      ))
      .orderBy(desc(fuelEntries.createdAt));
  }

  // Media
  async createMedia(mediaData: InsertMedia): Promise<Media> {
    const [newMedia] = await db.insert(media).values(mediaData).returning();
    return newMedia;
  }

  // Manager auth
  async getUserByCompanyAndPin(companyId: number, pin: string, role: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(
        eq(users.companyId, companyId),
        eq(users.pin, pin),
        eq(users.role, role),
        eq(users.active, true)
      ));
    return user || undefined;
  }

  // Manager dashboard stats
  async getManagerDashboardStats(companyId: number): Promise<{
    inspectionsToday: number;
    openDefects: number;
    vehiclesDue: number;
    totalVehicles: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Inspections today
    const [inspectionsResult] = await db
      .select({ count: count() })
      .from(inspections)
      .where(and(
        eq(inspections.companyId, companyId),
        gte(inspections.createdAt, today)
      ));

    // Open defects
    const [defectsResult] = await db
      .select({ count: count() })
      .from(defects)
      .where(and(
        eq(defects.companyId, companyId),
        sql`${defects.status} IN ('OPEN', 'IN_PROGRESS')`
      ));

    // Vehicles with MOT due soon
    const [vehiclesDueResult] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(vehicles.active, true),
        sql`${vehicles.motDue} <= ${thirtyDaysFromNow}`
      ));

    // Total active vehicles
    const [totalVehiclesResult] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(vehicles.active, true)
      ));

    return {
      inspectionsToday: inspectionsResult?.count || 0,
      openDefects: defectsResult?.count || 0,
      vehiclesDue: vehiclesDueResult?.count || 0,
      totalVehicles: totalVehiclesResult?.count || 0
    };
  }

  // All inspections for company
  async getAllInspections(companyId: number, limit = 50, offset = 0): Promise<Inspection[]> {
    return await db.select().from(inspections)
      .where(eq(inspections.companyId, companyId))
      .orderBy(desc(inspections.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getInspectionById(id: number): Promise<Inspection | undefined> {
    const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id));
    return inspection || undefined;
  }

  // Defects
  async getDefectsByCompany(companyId: number): Promise<Defect[]> {
    return await db.select().from(defects)
      .where(eq(defects.companyId, companyId))
      .orderBy(desc(defects.createdAt));
  }

  async createDefect(defect: InsertDefect): Promise<Defect> {
    const [newDefect] = await db.insert(defects).values(defect).returning();
    return newDefect;
  }

  async updateDefect(id: number, updates: Partial<Defect>): Promise<Defect | undefined> {
    const [updated] = await db.update(defects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(defects.id, id))
      .returning();
    return updated || undefined;
  }

  // Trailers
  async getTrailersByCompany(companyId: number): Promise<Trailer[]> {
    return await db.select().from(trailers)
      .where(and(
        eq(trailers.companyId, companyId),
        eq(trailers.active, true)
      ))
      .orderBy(trailers.trailerId);
  }

  async createTrailer(trailer: InsertTrailer): Promise<Trailer> {
    const [newTrailer] = await db.insert(trailers).values(trailer).returning();
    return newTrailer;
  }

  async updateTrailer(id: number, updates: Partial<Trailer>): Promise<Trailer | undefined> {
    const [updated] = await db.update(trailers)
      .set(updates)
      .where(eq(trailers.id, id))
      .returning();
    return updated || undefined;
  }

  // Vehicle CRUD
  async updateVehicle(id: number, updates: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const [updated] = await db.update(vehicles)
      .set(updates)
      .where(eq(vehicles.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteVehicle(id: number): Promise<void> {
    await db.update(vehicles).set({ active: false }).where(eq(vehicles.id, id));
  }

  // VOR Management
  async setVehicleVOR(id: number, reason: string, notes?: string): Promise<Vehicle | undefined> {
    const [updated] = await db.update(vehicles)
      .set({
        vorStatus: true,
        vorReason: reason,
        vorStartDate: new Date(),
        vorNotes: notes || null,
        vorResolvedDate: null // Clear any previous resolved date
      })
      .where(eq(vehicles.id, id))
      .returning();
    return updated || undefined;
  }

  async resolveVehicleVOR(id: number): Promise<Vehicle | undefined> {
    const [updated] = await db.update(vehicles)
      .set({
        vorStatus: false,
        vorResolvedDate: new Date()
      })
      .where(eq(vehicles.id, id))
      .returning();
    return updated || undefined;
  }

  async getVORVehicles(companyId: number): Promise<Vehicle[]> {
    return await db.select()
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(vehicles.vorStatus, true),
        eq(vehicles.active, true)
      ))
      .orderBy(desc(vehicles.vorStartDate));
  }

  // Service Interval Management
  async updateVehicleMileage(id: number, mileage: number): Promise<Vehicle | undefined> {
    // Calculate next service due based on mileage
    const vehicle = await this.getVehicle(id);
    if (!vehicle) return undefined;

    const updates: any = {
      currentMileage: mileage
    };

    // Calculate next service mileage if interval is set
    if (vehicle.serviceIntervalMiles) {
      const lastServiceMileage = vehicle.lastServiceMileage || 0;
      const milesSinceService = mileage - lastServiceMileage;
      
      if (milesSinceService >= vehicle.serviceIntervalMiles) {
        // Service is overdue
        updates.nextServiceMileage = mileage;
      } else {
        updates.nextServiceMileage = lastServiceMileage + vehicle.serviceIntervalMiles;
      }
    }

    const [updated] = await db.update(vehicles)
      .set(updates)
      .where(eq(vehicles.id, id))
      .returning();
    return updated || undefined;
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select()
      .from(vehicles)
      .where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async logService(serviceData: any): Promise<ServiceHistory> {
    const { vehicleId, serviceDate, serviceMileage, serviceType, serviceProvider, cost, workPerformed, performedBy } = serviceData;
    
    // Get vehicle to calculate next service
    const vehicle = await this.getVehicle(vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    // Calculate next service date (based on service interval months)
    let nextServiceDue: Date | undefined;
    if (vehicle.serviceIntervalMonths) {
      nextServiceDue = new Date(serviceDate);
      nextServiceDue.setMonth(nextServiceDue.getMonth() + vehicle.serviceIntervalMonths);
    }

    // Calculate next service mileage
    let nextServiceMileage: number | undefined;
    if (vehicle.serviceIntervalMiles) {
      nextServiceMileage = serviceMileage + vehicle.serviceIntervalMiles;
    }

    // Insert service record
    const [service] = await db.insert(serviceHistory)
      .values({
        vehicleId,
        companyId: vehicle.companyId,
        serviceDate,
        serviceMileage,
        serviceType,
        serviceProvider,
        cost,
        workPerformed,
        nextServiceDue,
        nextServiceMileage,
        performedBy
      })
      .returning();

    // Update vehicle with last service info and next service due
    await db.update(vehicles)
      .set({
        lastServiceDate: serviceDate,
        lastServiceMileage: serviceMileage,
        nextServiceDue,
        nextServiceMileage,
        currentMileage: serviceMileage
      })
      .where(eq(vehicles.id, vehicleId));

    return service;
  }

  async getServiceHistory(vehicleId: number): Promise<ServiceHistory[]> {
    return await db.select()
      .from(serviceHistory)
      .where(eq(serviceHistory.vehicleId, vehicleId))
      .orderBy(desc(serviceHistory.serviceDate));
  }

  async getServiceDueVehicles(companyId: number): Promise<Vehicle[]> {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Get vehicles where service is due within 30 days (by date or mileage)
    const allVehicles = await db.select()
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(vehicles.active, true)
      ));

    // Filter vehicles that are due for service
    return allVehicles.filter(vehicle => {
      // Check if service is due by date
      if (vehicle.nextServiceDue) {
        const dueDate = new Date(vehicle.nextServiceDue);
        if (dueDate <= thirtyDaysFromNow) {
          return true;
        }
      }

      // Check if service is due by mileage (within 500 miles)
      if (vehicle.nextServiceMileage && vehicle.currentMileage) {
        const milesUntilService = vehicle.nextServiceMileage - vehicle.currentMileage;
        if (milesUntilService <= 500) {
          return true;
        }
      }

      return false;
    });
  }

  // Fuel for company
  async getFuelEntriesByCompany(companyId: number, days = 30): Promise<FuelEntry[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db.select().from(fuelEntries)
      .where(and(
        eq(fuelEntries.companyId, companyId),
        gte(fuelEntries.createdAt, cutoffDate)
      ))
      .orderBy(desc(fuelEntries.createdAt));
  }

  // User management
  async getUsersByCompany(companyId: number): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.companyId, companyId))
      .orderBy(users.name);
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  // Document operations
  async getDocumentsByCompany(companyId: number): Promise<Document[]> {
    return await db.select().from(documents)
      .where(eq(documents.companyId, companyId))
      .orderBy(desc(documents.createdAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(document).returning();
    return newDoc;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const [updated] = await db.update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.update(documents).set({ active: false }).where(eq(documents.id, id));
  }

  async getUnreadDocuments(companyId: number, userId: number): Promise<Document[]> {
    // Get all active documents that require acknowledgment and haven't been acknowledged by this user
    const allDocs = await db.select().from(documents)
      .where(and(
        eq(documents.companyId, companyId),
        eq(documents.active, true),
        eq(documents.requiresAcknowledgment, true)
      ));
    
    // Get user's acknowledgments
    const userAcks = await db.select().from(documentAcknowledgments)
      .where(eq(documentAcknowledgments.userId, userId));
    
    const acknowledgedDocIds = new Set(userAcks.map(a => a.documentId));
    
    // Filter to unread documents
    return allDocs.filter(doc => !acknowledgedDocIds.has(doc.id));
  }

  async acknowledgeDocument(documentId: number, userId: number): Promise<DocumentAcknowledgment> {
    const [ack] = await db.insert(documentAcknowledgments)
      .values({ documentId, userId })
      .returning();
    return ack;
  }

  async getDocumentAcknowledgments(documentId: number): Promise<(DocumentAcknowledgment & { user?: User })[]> {
    const acks = await db.select().from(documentAcknowledgments)
      .where(eq(documentAcknowledgments.documentId, documentId))
      .orderBy(desc(documentAcknowledgments.acknowledgedAt));
    
    // Enrich with user info
    const enriched = await Promise.all(acks.map(async (ack) => {
      const [user] = await db.select().from(users).where(eq(users.id, ack.userId));
      return { ...ack, user };
    }));
    
    return enriched;
  }

  // License operations
  async getCompanyById(companyId: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, companyId));
    return company || undefined;
  }

  async getActiveVehicleCount(companyId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(vehicles.active, true)
      ));
    return result?.count || 0;
  }

  async getVehicleUsage(companyId: number): Promise<VehicleUsageInfo> {
    const company = await this.getCompanyById(companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    const activeVehicleCount = await this.getActiveVehicleCount(companyId);
    const allowance = company.vehicleAllowance;
    const graceOverage = company.graceOverage;
    const softLimit = allowance;
    const hardLimit = allowance + graceOverage;

    // Determine state
    let state: VehicleUsageState;
    if (activeVehicleCount < allowance) {
      state = 'ok';
    } else if (activeVehicleCount === allowance) {
      state = 'at_limit';
    } else if (activeVehicleCount < hardLimit) {
      state = 'in_grace';
    } else {
      state = 'over_hard_limit';
    }

    const remainingToSoft = Math.max(0, softLimit - activeVehicleCount);
    const remainingToHard = Math.max(0, hardLimit - activeVehicleCount);
    const percentUsed = Math.round((activeVehicleCount / allowance) * 100);

    return {
      activeVehicleCount,
      allowance,
      graceOverage,
      softLimit,
      hardLimit,
      state,
      remainingToSoft,
      remainingToHard,
      percentUsed
    };
  }

  async createLicenseUpgradeRequest(request: InsertLicenseUpgradeRequest): Promise<LicenseUpgradeRequest> {
    const [newRequest] = await db.insert(licenseUpgradeRequests).values(request).returning();
    return newRequest;
  }

  async updateCompany(id: number, updates: Partial<Company>): Promise<Company | undefined> {
    const [updated] = await db.update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updated || undefined;
  }

  // Audit log operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogs(companyId: number, options?: { limit?: number; offset?: number; entity?: string; action?: string }): Promise<AuditLog[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    let conditions = [eq(auditLogs.companyId, companyId)];
    
    if (options?.entity) {
      conditions.push(eq(auditLogs.entity, options.entity));
    }
    if (options?.action) {
      conditions.push(eq(auditLogs.action, options.action));
    }
    
    const logs = await db.select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
    
    return logs;
  }

  async getAuditLogCount(companyId: number, options?: { entity?: string; action?: string }): Promise<number> {
    let conditions = [eq(auditLogs.companyId, companyId)];
    
    if (options?.entity) {
      conditions.push(eq(auditLogs.entity, options.entity));
    }
    if (options?.action) {
      conditions.push(eq(auditLogs.action, options.action));
    }
    
    const [result] = await db.select({ count: count() })
      .from(auditLogs)
      .where(and(...conditions));
    
    return result?.count || 0;
  }
  
  // ==================== GPS TRACKING & LOCATION ====================
  
  async createDriverLocation(location: InsertDriverLocation): Promise<DriverLocation> {
    const [newLocation] = await db.insert(driverLocations).values(location).returning();
    return newLocation;
  }
  
  async getLatestDriverLocations(companyId: number): Promise<(DriverLocation & { driver?: User })[]> {
    try {
      // Get the latest location for each driver
      const latestLocations = await db
        .select()
        .from(driverLocations)
        .where(eq(driverLocations.companyId, companyId))
        .orderBy(desc(driverLocations.timestamp));
      
      // If no locations found, return empty array
      if (!latestLocations || latestLocations.length === 0) {
        return [];
      }
      
      // Group by driver and get only the most recent
      const locationMap = new Map<number, DriverLocation>();
      for (const loc of latestLocations) {
        if (!locationMap.has(loc.driverId)) {
          locationMap.set(loc.driverId, loc);
        }
      }
      
      // Fetch driver info
      const result = [];
      for (const location of locationMap.values()) {
        try {
          const driver = await this.getUser(location.driverId);
          result.push({ ...location, driver });
        } catch (error) {
          // If driver not found, include location without driver info
          console.warn(`Driver ${location.driverId} not found for location`);
          result.push({ ...location, driver: undefined });
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error in getLatestDriverLocations:", error);
      // Return empty array instead of throwing to prevent crashes
      return [];
    }
  }
  
  async checkStagnation(driverId: number, companyId: number): Promise<void> {
    // Get last 7 locations (35 minutes of data at 5-min intervals)
    const recentLocations = await db
      .select()
      .from(driverLocations)
      .where(and(
        eq(driverLocations.driverId, driverId),
        eq(driverLocations.companyId, companyId)
      ))
      .orderBy(desc(driverLocations.timestamp))
      .limit(7);
    
    if (recentLocations.length < 6) return; // Need at least 30 minutes of data
    
    const latest = recentLocations[0];
    const thirtyMinAgo = recentLocations[6];
    
    // Check if coordinates unchanged and speed is 0
    const isStagnant = 
      latest.latitude === thirtyMinAgo.latitude &&
      latest.longitude === thirtyMinAgo.longitude &&
      latest.speed === 0;
    
    if (isStagnant && !latest.isStagnant) {
      // Create stagnation alert
      const stagnationStart = new Date(thirtyMinAgo.timestamp);
      const durationMinutes = Math.floor((new Date(latest.timestamp).getTime() - stagnationStart.getTime()) / 60000);
      
      await db.insert(stagnationAlerts).values({
        companyId,
        driverId,
        latitude: latest.latitude,
        longitude: latest.longitude,
        stagnationStartTime: stagnationStart,
        stagnationDurationMinutes: durationMinutes,
        status: 'ACTIVE'
      });
      
      // Mark location as stagnant
      await db.update(driverLocations)
        .set({ isStagnant: true })
        .where(eq(driverLocations.id, latest.id));
    }
  }
  
  // ==================== GEOFENCING ====================
  
  async createGeofence(geofence: InsertGeofence): Promise<Geofence> {
    const [newGeofence] = await db.insert(geofences).values(geofence).returning();
    return newGeofence;
  }
  
  async getGeofencesByCompany(companyId: number): Promise<Geofence[]> {
    return await db.select().from(geofences)
      .where(and(
        eq(geofences.companyId, companyId),
        eq(geofences.isActive, true)
      ));
  }
  
  async updateGeofence(id: number, updates: Partial<Geofence>): Promise<Geofence | undefined> {
    const [updated] = await db.update(geofences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(geofences.id, id))
      .returning();
    return updated || undefined;
  }
  
  async checkGeofences(driverId: number, companyId: number, latitude: string, longitude: string): Promise<void> {
    const allGeofences = await this.getGeofencesByCompany(companyId);
    
    const lat1 = parseFloat(latitude);
    const lon1 = parseFloat(longitude);
    
    // Check each geofence
    for (const geofence of allGeofences) {
      const lat2 = parseFloat(geofence.latitude);
      const lon2 = parseFloat(geofence.longitude);
      
      // Calculate distance using Haversine formula
      const R = 6371000; // Earth's radius in meters
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      const isInside = distance <= geofence.radiusMeters;
      
      // Check for active timesheet
      const [activeTimesheet] = await db.select().from(timesheets)
        .where(and(
          eq(timesheets.driverId, driverId),
          eq(timesheets.depotId, geofence.id),
          eq(timesheets.status, 'ACTIVE')
        ))
        .limit(1);
      
      if (isInside && !activeTimesheet) {
        // Driver entered geofence - create timesheet
        await db.insert(timesheets).values({
          companyId,
          driverId,
          depotId: geofence.id,
          depotName: geofence.name,
          arrivalTime: new Date(),
          arrivalLatitude: latitude,
          arrivalLongitude: longitude,
          status: 'ACTIVE'
        });
      } else if (!isInside && activeTimesheet) {
        // Driver left geofence - close timesheet
        const departureTime = new Date();
        const totalMinutes = Math.floor((departureTime.getTime() - new Date(activeTimesheet.arrivalTime).getTime()) / 60000);
        
        await db.update(timesheets)
          .set({
            departureTime,
            departureLatitude: latitude,
            departureLongitude: longitude,
            totalMinutes,
            status: 'COMPLETED',
            updatedAt: new Date()
          })
          .where(eq(timesheets.id, activeTimesheet.id));
      }
    }
  }
  
  // ==================== TIMESHEETS ====================
  
  async getTimesheets(companyId: number, status?: string, startDate?: string, endDate?: string): Promise<(Timesheet & { driver?: User })[]> {
    let conditions = [eq(timesheets.companyId, companyId)];
    
    if (status) {
      conditions.push(eq(timesheets.status, status));
    }
    if (startDate) {
      conditions.push(gte(timesheets.arrivalTime, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(sql`${timesheets.arrivalTime} <= ${new Date(endDate)}`);
    }
    
    const sheets = await db.select().from(timesheets)
      .where(and(...conditions))
      .orderBy(desc(timesheets.arrivalTime));
    
    // Fetch driver info
    const result = [];
    for (const sheet of sheets) {
      const driver = await this.getUser(sheet.driverId);
      result.push({ ...sheet, driver });
    }
    
    return result;
  }
  
  async getActiveTimesheet(driverId: number): Promise<Timesheet | undefined> {
    const [active] = await db.select().from(timesheets)
      .where(and(
        eq(timesheets.driverId, driverId),
        eq(timesheets.status, 'ACTIVE')
      ))
      .limit(1);
    return active || undefined;
  }
  
  async clockIn(companyId: number, driverId: number, depotId: number, latitude: string, longitude: string): Promise<Timesheet> {
    // Check if driver already has an active timesheet
    const existing = await this.getActiveTimesheet(driverId);
    if (existing) {
      throw new Error('Driver already clocked in');
    }
    
    // Get depot info
    const depot = await db.select().from(geofences)
      .where(eq(geofences.id, depotId))
      .limit(1);
    
    if (!depot[0]) {
      throw new Error('Depot not found');
    }
    
    // Create new timesheet
    const [timesheet] = await db.insert(timesheets).values({
      companyId,
      driverId,
      depotId,
      depotName: depot[0].name,
      arrivalTime: new Date(),
      arrivalLatitude: latitude,
      arrivalLongitude: longitude,
      status: 'ACTIVE',
      departureTime: null,
      totalMinutes: null,
      departureLatitude: null,
      departureLongitude: null
    }).returning();
    
    if (!timesheet) {
      throw new Error('Failed to create timesheet');
    }
    
    return timesheet;
  }
  
  async clockOut(timesheetId: number, latitude: string, longitude: string): Promise<Timesheet> {
    // Get existing timesheet
    const [existing] = await db.select().from(timesheets)
      .where(eq(timesheets.id, timesheetId))
      .limit(1);
    
    if (!existing) {
      throw new Error('Timesheet not found');
    }
    
    if (existing.status === 'COMPLETED') {
      throw new Error('Timesheet already completed');
    }
    
    const departureTime = new Date();
    const totalMinutes = Math.floor(
      (departureTime.getTime() - new Date(existing.arrivalTime).getTime()) / 60000
    );
    
    // Update timesheet
    const [updated] = await db.update(timesheets)
      .set({
        departureTime,
        departureLatitude: latitude,
        departureLongitude: longitude,
        totalMinutes,
        status: 'COMPLETED',
        updatedAt: new Date()
      })
      .where(eq(timesheets.id, timesheetId))
      .returning();
    
    if (!updated) {
      throw new Error('Failed to update timesheet');
    }
    
    return updated;
  }
  
  async updateTimesheet(id: number, updates: Partial<Timesheet>): Promise<Timesheet | undefined> {
    const [updated] = await db.update(timesheets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(timesheets.id, id))
      .returning();
    return updated || undefined;
  }
  
  async generateTimesheetCSV(timesheets: (Timesheet & { driver?: User; wageCalculation?: any })[]): Promise<string> {
    // Enhanced CSV format for wage invoices with detailed pay breakdown
    const header = 'Driver Name,Date,Clock In,Clock Out,Depot,Total Hours,Regular Hours,Night Hours,Weekend Hours,Bank Holiday Hours,Overtime Hours,Base Rate,Night Rate,Weekend Rate,Holiday Rate,Overtime Rate,Regular Pay,Night Pay,Weekend Pay,Holiday Pay,Overtime Pay,Total Pay,Status\n';
    
    const rows = timesheets.map(ts => {
      const driverName = ts.driver?.name || 'Unknown';
      const date = new Date(ts.arrivalTime).toLocaleDateString('en-GB');
      const clockIn = new Date(ts.arrivalTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const clockOut = ts.departureTime 
        ? new Date(ts.departureTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : 'Active';
      
      const totalMinutes = ts.totalMinutes || 0;
      const totalHours = (totalMinutes / 60).toFixed(2);
      
      // Calculate break time (30 mins for shifts > 6 hours)
      const breakTime = totalMinutes > 360 ? 30 : 0;
      const netMinutes = totalMinutes - breakTime;
      const netHours = (netMinutes / 60).toFixed(2);
      
      // Get wage calculation if available
      const wage = ts.wageCalculation;
      
      if (wage) {
        // Use calculated wage breakdown
        const regularHours = (wage.regularMinutes / 60).toFixed(2);
        const nightHours = (wage.nightMinutes / 60).toFixed(2);
        const weekendHours = (wage.weekendMinutes / 60).toFixed(2);
        const holidayHours = (wage.bankHolidayMinutes / 60).toFixed(2);
        const overtimeHours = (wage.overtimeMinutes / 60).toFixed(2);
        
        return `"${driverName}",${date},${clockIn},${clockOut},"${ts.depotName}",${totalHours},${regularHours},${nightHours},${weekendHours},${holidayHours},${overtimeHours},${wage.baseRate || '0.00'},${wage.nightRate || '0.00'},${wage.weekendRate || '0.00'},${wage.holidayRate || '0.00'},${wage.overtimeRate || '0.00'},${wage.regularPay},${wage.nightPay},${wage.weekendPay},${wage.bankHolidayPay},${wage.overtimePay},${wage.totalPay},${ts.status}`;
      } else {
        // Fallback to basic calculation
        const overtimeMinutes = Math.max(0, netMinutes - 480);
        const overtime = (overtimeMinutes / 60).toFixed(2);
        const regularHours = ((netMinutes - overtimeMinutes) / 60).toFixed(2);
        
        return `"${driverName}",${date},${clockIn},${clockOut},"${ts.depotName}",${totalHours},${regularHours},0.00,0.00,0.00,${overtime},0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,${ts.status}`;
      }
    }).join('\n');
    
    // Add weekly summary at the bottom
    const driverSummaries = new Map<number, { name: string; totalHours: number; shifts: number }>();
    
    timesheets.forEach(ts => {
      if (ts.status === 'COMPLETED' && ts.totalMinutes) {
        const existing = driverSummaries.get(ts.driverId);
        const hours = ts.totalMinutes / 60;
        
        if (existing) {
          existing.totalHours += hours;
          existing.shifts += 1;
        } else {
          driverSummaries.set(ts.driverId, {
            name: ts.driver?.name || 'Unknown',
            totalHours: hours,
            shifts: 1
          });
        }
      }
    });
    
    let summary = '\n\n--- WEEKLY SUMMARY ---\n';
    summary += 'Driver Name,Total Shifts,Total Hours,Regular Hours,Overtime Hours\n';
    
    driverSummaries.forEach(({ name, totalHours, shifts }) => {
      const regularHours = Math.min(totalHours, 40).toFixed(2);
      const overtimeHours = Math.max(0, totalHours - 40).toFixed(2);
      summary += `"${name}",${shifts},${totalHours.toFixed(2)},${regularHours},${overtimeHours}\n`;
    });
    
    return header + rows + summary;
  }
  
  // ==================== STAGNATION ALERTS ====================
  
  async getStagnationAlerts(companyId: number, status?: string): Promise<(StagnationAlert & { driver?: User })[]> {
    let conditions = [eq(stagnationAlerts.companyId, companyId)];
    
    if (status) {
      conditions.push(eq(stagnationAlerts.status, status));
    }
    
    const alerts = await db.select().from(stagnationAlerts)
      .where(and(...conditions))
      .orderBy(desc(stagnationAlerts.createdAt));
    
    // Fetch driver info
    const result = [];
    for (const alert of alerts) {
      const driver = await this.getUser(alert.driverId);
      result.push({ ...alert, driver });
    }
    
    return result;
  }
  
  async updateStagnationAlert(id: number, updates: Partial<StagnationAlert>): Promise<StagnationAlert | undefined> {
    const [updated] = await db.update(stagnationAlerts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stagnationAlerts.id, id))
      .returning();
    return updated || undefined;
  }
  
  // ==================== NOTIFICATIONS (TITAN COMMAND) ====================
  
  async createBroadcastNotification(notification: InsertNotification): Promise<Notification> {
    // Get all drivers in the company
    const drivers = await db.select().from(users)
      .where(and(
        eq(users.companyId, notification.companyId),
        eq(users.role, 'DRIVER'),
        eq(users.active, true)
      ));
    
    // Create notification for each driver
    const createdNotifications = [];
    for (const driver of drivers) {
      const [notif] = await db.insert(notifications).values({
        ...notification,
        recipientId: driver.id,
        isBroadcast: true
      }).returning();
      createdNotifications.push(notif);
    }
    
    return createdNotifications[0]; // Return first one as representative
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }
  
  async getDriverNotifications(driverId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.recipientId, driverId))
      .orderBy(desc(notifications.createdAt));
  }
  
  async markNotificationRead(id: number): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return updated || undefined;
  }
  
  // ==================== SHIFT CHECKS (END-OF-SHIFT) ====================
  
  async createShiftCheck(companyId: number, driverId: number, vehicleId: number, timesheetId: number): Promise<any> {
    const { shiftChecks } = await import('@shared/schema');
    
    const [shiftCheck] = await db.insert(shiftChecks).values({
      companyId,
      driverId,
      vehicleId,
      timesheetId,
      status: 'in_progress'
    }).returning();
    
    return shiftCheck;
  }
  
  async addShiftCheckItem(
    shiftCheckId: number,
    itemId: string,
    label: string,
    itemType: string,
    status: string,
    value?: string,
    notes?: string,
    photoUrl?: string
  ): Promise<any> {
    const { shiftCheckItems } = await import('@shared/schema');
    
    const [item] = await db.insert(shiftCheckItems).values({
      shiftCheckId,
      itemId,
      label,
      itemType,
      status,
      value,
      notes,
      photoUrl,
      completedAt: new Date()
    }).returning();
    
    return item;
  }
  
  async completeShiftCheck(shiftCheckId: number, latitude: string, longitude: string): Promise<any> {
    const { shiftChecks } = await import('@shared/schema');
    
    // Get the shift check to find the timesheet
    const [shiftCheck] = await db.select().from(shiftChecks).where(eq(shiftChecks.id, shiftCheckId));
    
    if (!shiftCheck) {
      throw new Error('Shift check not found');
    }
    
    // Update shift check to completed
    const [updated] = await db.update(shiftChecks)
      .set({
        status: 'completed',
        completedAt: new Date(),
        latitude,
        longitude
      })
      .where(eq(shiftChecks.id, shiftCheckId))
      .returning();
    
    // Automatically clock out the driver by completing their timesheet
    if (shiftCheck.timesheetId) {
      await this.clockOut(shiftCheck.timesheetId, latitude, longitude);
    }
    
    return updated;
  }
  
  async getShiftChecksByCompany(companyId: number): Promise<any[]> {
    const { shiftChecks, shiftCheckItems } = await import('@shared/schema');
    
    const checks = await db.select({
      shiftCheck: shiftChecks,
      driver: users,
      vehicle: vehicles
    })
      .from(shiftChecks)
      .leftJoin(users, eq(shiftChecks.driverId, users.id))
      .leftJoin(vehicles, eq(shiftChecks.vehicleId, vehicles.id))
      .where(eq(shiftChecks.companyId, companyId))
      .orderBy(desc(shiftChecks.createdAt));
    
    // Get items for each check
    const checksWithItems = await Promise.all(
      checks.map(async (check) => {
        const items = await db.select()
          .from(shiftCheckItems)
          .where(eq(shiftCheckItems.shiftCheckId, check.shiftCheck.id));
        
        return {
          ...check.shiftCheck,
          driver: check.driver,
          vehicle: check.vehicle,
          items
        };
      })
    );
    
    return checksWithItems;
  }
  
  async getShiftChecksByDriver(driverId: number): Promise<any[]> {
    const { shiftChecks, shiftCheckItems } = await import('@shared/schema');
    
    const checks = await db.select({
      shiftCheck: shiftChecks,
      vehicle: vehicles
    })
      .from(shiftChecks)
      .leftJoin(vehicles, eq(shiftChecks.vehicleId, vehicles.id))
      .where(eq(shiftChecks.driverId, driverId))
      .orderBy(desc(shiftChecks.createdAt))
      .limit(30);
    
    // Get items for each check
    const checksWithItems = await Promise.all(
      checks.map(async (check) => {
        const items = await db.select()
          .from(shiftCheckItems)
          .where(eq(shiftCheckItems.shiftCheckId, check.shiftCheck.id));
        
        return {
          ...check.shiftCheck,
          vehicle: check.vehicle,
          items
        };
      })
    );
    
     return checksWithItems;
  }
  
  // Reminder operations
  async createReminder(reminder: any): Promise<any> {
    const { reminders } = await import('@shared/schema');
    const [created] = await db.insert(reminders).values(reminder).returning();
    return created;
  }
  
  async getActiveReminders(companyId?: number): Promise<any[]> {
    const { reminders } = await import('@shared/schema');
    
    if (companyId) {
      return await db.select()
        .from(reminders)
        .where(
          and(
            eq(reminders.companyId, companyId),
            sql`${reminders.status} IN ('ACTIVE', 'SNOOZED')`
          )
        )
        .orderBy(reminders.dueDate);
    }
    
    return await db.select()
      .from(reminders)
      .where(sql`${reminders.status} IN ('ACTIVE', 'SNOOZED')`)
      .orderBy(reminders.dueDate);
  }
  
  async getRemindersByVehicle(vehicleId: number): Promise<any[]> {
    const { reminders } = await import('@shared/schema');
    return await db.select()
      .from(reminders)
      .where(eq(reminders.vehicleId, vehicleId))
      .orderBy(reminders.dueDate);
  }
  
  async updateReminder(id: number, updates: Partial<any>): Promise<any | undefined> {
    const { reminders } = await import('@shared/schema');
    const [updated] = await db.update(reminders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(reminders.id, id))
      .returning();
    return updated;
  }
  
  async completeReminder(id: number, completedBy: number, notes?: string): Promise<any | undefined> {
    const { reminders } = await import('@shared/schema');
    const [updated] = await db.update(reminders)
      .set({
        status: 'COMPLETED',
        completedAt: new Date(),
        completedBy,
        completionNotes: notes || null,
        updatedAt: new Date()
      })
      .where(eq(reminders.id, id))
      .returning();
    return updated;
  }
  
  async snoozeReminder(id: number, snoozedBy: number, snoozedUntil: Date, reason?: string): Promise<any | undefined> {
    const { reminders } = await import('@shared/schema');
    const [updated] = await db.update(reminders)
      .set({
        status: 'SNOOZED',
        snoozedBy,
        snoozedUntil,
        snoozeReason: reason || null,
        updatedAt: new Date()
      })
      .where(eq(reminders.id, id))
      .returning();
    return updated;
  }
  
  async dismissReminder(id: number): Promise<any | undefined> {
    const { reminders } = await import('@shared/schema');
    const [updated] = await db.update(reminders)
      .set({
        status: 'DISMISSED',
        updatedAt: new Date()
      })
      .where(eq(reminders.id, id))
      .returning();
    return updated;
  }
  
  async getCompany(companyId: number): Promise<any | undefined> {
    return await this.getCompanyById(companyId);
  }
}
export const storage = new DatabaseStorage();
