import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Company - Multi-tenant root
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  companyCode: varchar("company_code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  
  // Brand customization
  primaryColor: varchar("primary_color", { length: 7 }).default("#2563eb"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#1e293b"),
  neutralTint: varchar("neutral_tint", { length: 7 }).default("#f8fafc"),
  
  // Feature flags
  settings: jsonb("settings").notNull().default({
    poolFleet: true,
    showFuelPrices: false,
    requireFuelCardPhoto: true,
    enableEndOfShiftCheck: false,
    fuelEnabled: true,
    adblueEnabled: true,
    collisionsEnabled: true,
    driverHistoryDays: 7
  }),
  
  // Google Drive integration
  googleDriveConnected: boolean("google_drive_connected").default(false),
  driveRootFolderId: text("drive_root_folder_id"),
  driveRefreshToken: text("drive_refresh_token"), // Should be encrypted in production
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

// Users - Drivers and Managers
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // DRIVER | MANAGER
  pin: varchar("pin", { length: 4 }), // Optional driver PIN
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Vehicles
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  vrm: varchar("vrm", { length: 20 }).notNull(), // Registration
  make: text("make").notNull(),
  model: text("model").notNull(),
  fleetNumber: varchar("fleet_number", { length: 50 }),
  motDue: timestamp("mot_due"),
  taxDue: timestamp("tax_due"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true });
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

// Inspections
export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // SAFETY_CHECK | END_OF_SHIFT
  odometer: integer("odometer").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // PASS | FAIL | PENDING
  hasTrailer: boolean("has_trailer").default(false), // Whether trailer was attached
  checklist: jsonb("checklist").notNull(), // Array of check items with pass/fail
  defects: jsonb("defects"), // Array of defect notes
  driveFolderId: text("drive_folder_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertInspectionSchema = createInsertSchema(inspections).omit({ id: true, createdAt: true });
export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;

// Fuel Entries
export const fuelEntries = pgTable("fuel_entries", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  fuelType: varchar("fuel_type", { length: 20 }).notNull(), // DIESEL | ADBLUE
  odometer: integer("odometer").notNull(),
  litres: integer("litres"),
  price: integer("price"), // In pence, optional
  location: text("location"),
  receiptDriveFileId: text("receipt_drive_file_id"),
  fuelCardDriveFileId: text("fuel_card_drive_file_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertFuelEntrySchema = createInsertSchema(fuelEntries).omit({ id: true, createdAt: true });
export type FuelEntry = typeof fuelEntries.$inferSelect;
export type InsertFuelEntry = z.infer<typeof insertFuelEntrySchema>;

// Media files (Drive references)
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  kind: varchar("kind", { length: 50 }).notNull(), // INSPECTION | FUEL | COLLISION
  linkedId: integer("linked_id").notNull(), // ID of inspection/fuel/collision
  driveFileId: text("drive_file_id").notNull(),
  driveUrl: text("drive_url"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertMediaSchema = createInsertSchema(media).omit({ id: true, createdAt: true });
export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;

// Vehicle usage tracking (for recents)
export const vehicleUsage = pgTable("vehicle_usage", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  lastUsedAt: timestamp("last_used_at").defaultNow().notNull()
});

export type VehicleUsage = typeof vehicleUsage.$inferSelect;

// Trailers
export const trailers = pgTable("trailers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  trailerId: varchar("trailer_id", { length: 20 }).notNull(), // Trailer registration/ID
  type: varchar("type", { length: 50 }).notNull(), // CURTAINSIDER | BOX | FLATBED | TANKER
  make: text("make"),
  model: text("model"),
  axles: integer("axles").default(3),
  motDue: timestamp("mot_due"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertTrailerSchema = createInsertSchema(trailers).omit({ id: true, createdAt: true });
export type Trailer = typeof trailers.$inferSelect;
export type InsertTrailer = z.infer<typeof insertTrailerSchema>;

// Defects - Standalone defect tracking with lifecycle
export const defects = pgTable("defects", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  trailerId: integer("trailer_id").references(() => trailers.id),
  inspectionId: integer("inspection_id").references(() => inspections.id),
  reportedBy: integer("reported_by").references(() => users.id).notNull(),
  
  category: varchar("category", { length: 50 }).notNull(), // LIGHTS | BRAKES | TYRES | etc.
  description: text("description").notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("MEDIUM"), // LOW | MEDIUM | HIGH | CRITICAL
  status: varchar("status", { length: 20 }).notNull().default("OPEN"), // OPEN | IN_PROGRESS | RESOLVED | DEFERRED
  
  assignedTo: text("assigned_to"), // Workshop/engineer name
  resolutionNotes: text("resolution_notes"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertDefectSchema = createInsertSchema(defects).omit({ id: true, createdAt: true, updatedAt: true });
export type Defect = typeof defects.$inferSelect;
export type InsertDefect = z.infer<typeof insertDefectSchema>;

// Manager audit log
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  managerId: integer("manager_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // CREATE | UPDATE | DELETE | LOGIN | EXPORT
  entity: varchar("entity", { length: 50 }).notNull(), // VEHICLE | DEFECT | INSPECTION | USER
  entityId: integer("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type AuditLog = typeof auditLogs.$inferSelect;
