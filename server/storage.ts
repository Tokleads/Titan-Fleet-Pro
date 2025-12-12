import { 
  type User, type InsertUser,
  type Company, type InsertCompany,
  type Vehicle, type InsertVehicle,
  type Inspection, type InsertInspection,
  type FuelEntry, type InsertFuelEntry,
  type Media, type InsertMedia,
  type Defect, type InsertDefect,
  type Trailer, type InsertTrailer,
  companies, users, vehicles, inspections, fuelEntries, media, vehicleUsage, defects, trailers
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
  getVehiclesByCompany(companyId: number): Promise<Vehicle[]>;
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
  
  // Fuel for company
  getFuelEntriesByCompany(companyId: number, days?: number): Promise<FuelEntry[]>;
  
  // User management
  getUsersByCompany(companyId: number): Promise<User[]>;
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
  async getVehiclesByCompany(companyId: number): Promise<Vehicle[]> {
    return await db.select().from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(vehicles.active, true)
      ))
      .orderBy(vehicles.vrm);
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
}

export const storage = new DatabaseStorage();
