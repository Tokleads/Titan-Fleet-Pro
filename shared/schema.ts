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
  
  // License tier and vehicle allowance
  licenseTier: varchar("license_tier", { length: 20 }).notNull().default("core"), // core | pro | operator
  vehicleAllowance: integer("vehicle_allowance").notNull().default(15),
  graceOverage: integer("grace_overage").notNull().default(3),
  enforcementMode: varchar("enforcement_mode", { length: 20 }).notNull().default("soft_block"), // soft_block
  
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
  
  // Google Drive integration (per-company credentials for white-label)
  googleDriveConnected: boolean("google_drive_connected").default(false),
  driveRootFolderId: text("drive_root_folder_id"),
  driveClientId: text("drive_client_id"), // Encrypted
  driveClientSecret: text("drive_client_secret"), // Encrypted
  driveRefreshToken: text("drive_refresh_token"), // Encrypted
  
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
  role: varchar("role", { length: 20 }).notNull(), // ADMIN | TRANSPORT_MANAGER | DRIVER | MECHANIC | AUDITOR
  pin: varchar("pin", { length: 4 }), // Optional driver PIN
  active: boolean("active").default(true),
  
  // Two-Factor Authentication (TOTP) for managers
  totpSecret: text("totp_secret"), // Encrypted TOTP secret key
  totpEnabled: boolean("totp_enabled").default(false),
  
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
  vehicleCategory: varchar("vehicle_category", { length: 10 }).default("HGV"), // HGV | LGV - determines min check time
  motDue: timestamp("mot_due"),
  taxDue: timestamp("tax_due"),
  active: boolean("active").default(true),
  
  // VOR (Vehicle Off Road) Management
  vorStatus: boolean("vor_status").default(false), // true = vehicle is off road
  vorReason: varchar("vor_reason", { length: 100 }), // Reason for VOR
  vorStartDate: timestamp("vor_start_date"), // When vehicle went off road
  vorNotes: text("vor_notes"), // Additional notes
  vorResolvedDate: timestamp("vor_resolved_date"), // When vehicle returned to service
  
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
  
  // DVSA Auditable Timing - records start/end for compliance evidence
  startedAt: timestamp("started_at"), // When driver clicked Start
  completedAt: timestamp("completed_at"), // When driver submitted
  durationSeconds: integer("duration_seconds"), // Total time spent on check
  vehicleCategory: varchar("vehicle_category", { length: 10 }), // HGV | LGV - for min time requirement
  
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
  status: varchar("status", { length: 20 }).notNull().default("OPEN"), // OPEN | ASSIGNED | IN_PROGRESS | RECTIFIED | VERIFIED | CLOSED | DEFERRED
  
  assignedTo: integer("assigned_to").references(() => users.id), // Mechanic user ID
  resolutionNotes: text("resolution_notes"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertDefectSchema = createInsertSchema(defects).omit({ id: true, createdAt: true, updatedAt: true });
export type Defect = typeof defects.$inferSelect;
export type InsertDefect = z.infer<typeof insertDefectSchema>;

// Company Documents - for driver acknowledgment
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // TOOLBOX_TALK | HANDBOOK | POLICY | NOTICE
  fileUrl: text("file_url"), // External file link or Drive ID
  content: text("content"), // Rich text content if no file
  priority: varchar("priority", { length: 20 }).default("NORMAL"), // LOW | NORMAL | HIGH | URGENT
  requiresAcknowledgment: boolean("requires_acknowledgment").default(true),
  expiresAt: timestamp("expires_at"), // Optional expiry date
  active: boolean("active").default(true),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// Document Acknowledgments - tracks who has read what
export const documentAcknowledgments = pgTable("document_acknowledgments", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  acknowledgedAt: timestamp("acknowledged_at").defaultNow().notNull()
});

export const insertDocumentAcknowledgmentSchema = createInsertSchema(documentAcknowledgments).omit({ id: true, acknowledgedAt: true });
export type DocumentAcknowledgment = typeof documentAcknowledgments.$inferSelect;
export type InsertDocumentAcknowledgment = z.infer<typeof insertDocumentAcknowledgmentSchema>;

// Manager audit log with hash chaining for immutability
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  userId: integer("user_id").references(() => users.id), // Who performed the action (null for system)
  action: varchar("action", { length: 50 }).notNull(), // LOGIN | LOGOUT | CREATE | UPDATE | DELETE | VIEW | EXPORT | ASSIGN | VERIFY | APPROVE
  entity: varchar("entity", { length: 50 }).notNull(), // USER | VEHICLE | INSPECTION | DEFECT | FUEL | SETTINGS | SESSION | TIMESHEET | RECTIFICATION | GEOFENCE
  entityId: integer("entity_id"), // ID of the affected entity
  details: jsonb("details"), // Additional context (old/new values, metadata)
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 compatible
  userAgent: text("user_agent"),
  
  // Hash chaining for immutability (blockchain-like)
  previousHash: varchar("previous_hash", { length: 64 }), // SHA-256 hash of previous log entry
  currentHash: varchar("current_hash", { length: 64 }).notNull(), // SHA-256 hash of this entry
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// License upgrade requests
export const licenseUpgradeRequests = pgTable("license_upgrade_requests", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  managerId: integer("manager_id").references(() => users.id).notNull(),
  message: text("message"),
  currentTier: varchar("current_tier", { length: 20 }).notNull(),
  requestedTier: varchar("requested_tier", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | contacted | completed
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertLicenseUpgradeRequestSchema = createInsertSchema(licenseUpgradeRequests).omit({ id: true, createdAt: true });
export type LicenseUpgradeRequest = typeof licenseUpgradeRequests.$inferSelect;
export type InsertLicenseUpgradeRequest = z.infer<typeof insertLicenseUpgradeRequestSchema>;

// Vehicle usage state type for license enforcement
export type VehicleUsageState = 'ok' | 'at_limit' | 'in_grace' | 'over_hard_limit';

export interface VehicleUsageInfo {
  activeVehicleCount: number;
  allowance: number;
  graceOverage: number;
  softLimit: number;
  hardLimit: number;
  state: VehicleUsageState;
  remainingToSoft: number;
  remainingToHard: number;
  percentUsed: number;
}

// Driver Locations - Real-time GPS tracking (5-minute pings)
export const driverLocations = pgTable("driver_locations", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  speed: integer("speed").default(0).notNull(), // km/h
  heading: integer("heading"), // degrees 0-360
  accuracy: integer("accuracy"), // meters
  isStagnant: boolean("is_stagnant").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertDriverLocationSchema = createInsertSchema(driverLocations).omit({ id: true, createdAt: true });
export type DriverLocation = typeof driverLocations.$inferSelect;
export type InsertDriverLocation = z.infer<typeof insertDriverLocationSchema>;

// Geofences - Depot locations with radius detection
export const geofences = pgTable("geofences", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  radiusMeters: integer("radius_meters").default(250).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertGeofenceSchema = createInsertSchema(geofences).omit({ id: true, createdAt: true, updatedAt: true });
export type Geofence = typeof geofences.$inferSelect;
export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;

// Timesheets - Automated depot-based time tracking
export const timesheets = pgTable("timesheets", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  depotId: integer("depot_id").references(() => geofences.id).notNull(),
  depotName: varchar("depot_name", { length: 100 }).notNull(),
  arrivalTime: timestamp("arrival_time").notNull(),
  departureTime: timestamp("departure_time"),
  totalMinutes: integer("total_minutes"),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"), // ACTIVE | COMPLETED
  arrivalLatitude: text("arrival_latitude"),
  arrivalLongitude: text("arrival_longitude"),
  departureLatitude: text("departure_latitude"),
  departureLongitude: text("departure_longitude"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertTimesheetSchema = createInsertSchema(timesheets).omit({ id: true, createdAt: true, updatedAt: true });
export type Timesheet = typeof timesheets.$inferSelect;
export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;

// Stagnation Alerts - Driver inactivity monitoring
export const stagnationAlerts = pgTable("stagnation_alerts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  stagnationStartTime: timestamp("stagnation_start_time").notNull(),
  stagnationDurationMinutes: integer("stagnation_duration_minutes").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"), // ACTIVE | ACKNOWLEDGED | RESOLVED
  acknowledgedBy: integer("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertStagnationAlertSchema = createInsertSchema(stagnationAlerts).omit({ id: true, createdAt: true, updatedAt: true });
export type StagnationAlert = typeof stagnationAlerts.$inferSelect;
export type InsertStagnationAlert = z.infer<typeof insertStagnationAlertSchema>;

// Notifications - Titan Command broadcast system
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  recipientId: integer("recipient_id").references(() => users.id), // null for broadcast
  isBroadcast: boolean("is_broadcast").default(false).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  priority: varchar("priority", { length: 20 }).notNull().default("NORMAL"), // LOW | NORMAL | HIGH | URGENT
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;


// ==================== END-OF-SHIFT CHECKS ====================

// Company-specific check templates (configurable per company)
export const companyCheckTemplates = pgTable("company_check_templates", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(), // e.g., "Standard HGV End-of-Shift"
  isActive: boolean("is_active").default(true).notNull(),
  
  // Check items configuration
  checkItems: jsonb("check_items").notNull().default([
    { id: "cab_cleanliness", label: "Cab Cleanliness", required: true, requiresPhoto: true, type: "pass_fail" },
    { id: "number_plate", label: "Number Plate in Door Pocket", required: true, requiresPhoto: true, type: "pass_fail" },
    { id: "mileage", label: "Mileage Reading", required: true, requiresPhoto: true, type: "numeric" },
    { id: "fuel_level", label: "Fuel Level", required: true, requiresPhoto: true, type: "percentage", minValue: 25 },
    { id: "adblue_level", label: "AdBlue Level", required: true, requiresPhoto: true, type: "percentage", minValue: 25 },
    { id: "fuel_card", label: "Fuel Card Present", required: true, requiresPhoto: true, type: "pass_fail" }
  ]),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertCompanyCheckTemplateSchema = createInsertSchema(companyCheckTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type CompanyCheckTemplate = typeof companyCheckTemplates.$inferSelect;
export type InsertCompanyCheckTemplate = z.infer<typeof insertCompanyCheckTemplateSchema>;

// Shift checks (completed end-of-shift inspections)
export const shiftChecks = pgTable("shift_checks", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  driverId: integer("driver_id").notNull().references(() => users.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  timesheetId: integer("timesheet_id").references(() => timesheets.id), // Links to timesheet for auto clock-out
  templateId: integer("template_id").references(() => companyCheckTemplates.id),
  
  // Check metadata
  status: varchar("status", { length: 20 }).notNull().default("in_progress"), // in_progress | completed | approved | rejected
  completedAt: timestamp("completed_at"),
  
  // GPS location when check completed
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  
  // Manager review
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertShiftCheckSchema = createInsertSchema(shiftChecks).omit({ id: true, createdAt: true, updatedAt: true });
export type ShiftCheck = typeof shiftChecks.$inferSelect;
export type InsertShiftCheck = z.infer<typeof insertShiftCheckSchema>;

// Individual check items within a shift check
export const shiftCheckItems = pgTable("shift_check_items", {
  id: serial("id").primaryKey(),
  shiftCheckId: integer("shift_check_id").notNull().references(() => shiftChecks.id),
  
  // Check item details
  itemId: varchar("item_id", { length: 50 }).notNull(), // e.g., "cab_cleanliness", "fuel_level"
  label: text("label").notNull(),
  itemType: varchar("item_type", { length: 20 }).notNull(), // pass_fail | numeric | percentage
  
  // Check result
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | passed | failed
  value: text("value"), // For numeric/percentage types
  notes: text("notes"),
  
  // Photo evidence
  photoUrl: text("photo_url"), // URL to photo in S3 storage
  
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertShiftCheckItemSchema = createInsertSchema(shiftCheckItems).omit({ id: true, createdAt: true, updatedAt: true });
export type ShiftCheckItem = typeof shiftCheckItems.$inferSelect;
export type InsertShiftCheckItem = z.infer<typeof insertShiftCheckItemSchema>;


// Rectifications - Mechanic workflow for fixing defects
export const rectifications = pgTable("rectifications", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  defectId: integer("defect_id").references(() => defects.id).notNull(),
  mechanicId: integer("mechanic_id").references(() => users.id).notNull(),
  
  // Work details
  status: varchar("status", { length: 20 }).notNull().default("IN_PROGRESS"), // IN_PROGRESS | COMPLETED | REQUIRES_PARTS | ON_HOLD
  workDescription: text("work_description").notNull(),
  
  // Time tracking
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  hoursWorked: integer("hours_worked"), // Decimal hours (e.g., 2.5 hours)
  
  // Parts used
  partsUsed: jsonb("parts_used").default([]), // Array of { partNumber, description, quantity, cost }
  totalPartsCost: integer("total_parts_cost").default(0), // In pence/cents
  labourCost: integer("labour_cost").default(0), // In pence/cents
  
  // Verification
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  verificationNotes: text("verification_notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertRectificationSchema = createInsertSchema(rectifications).omit({ id: true, createdAt: true, updatedAt: true });
export type Rectification = typeof rectifications.$inferSelect;
export type InsertRectification = z.infer<typeof insertRectificationSchema>;


// Reminders - Compliance tracking for MOT, service, insurance, etc.
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  
  // Reminder details
  type: varchar("type", { length: 20 }).notNull(), // MOT, SERVICE, TACHO, INSURANCE, TAX, INSPECTION
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  
  // Status tracking
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"), // ACTIVE, SNOOZED, COMPLETED, DISMISSED
  escalationLevel: integer("escalation_level").default(0), // 0 = not escalated, 1 = 30 days, 2 = 14 days, 3 = 7 days, 4 = 1 day, 5 = overdue
  
  // Completion tracking
  completedAt: timestamp("completed_at"),
  completedBy: integer("completed_by").references(() => users.id),
  completionNotes: text("completion_notes"),
  
  // Snooze tracking
  snoozedUntil: timestamp("snoozed_until"),
  snoozedBy: integer("snoozed_by").references(() => users.id),
  snoozeReason: text("snooze_reason"),
  
  // Notification tracking
  lastNotificationSent: timestamp("last_notification_sent"),
  notificationCount: integer("notification_count").default(0),
  
  // Recurrence (for recurring reminders like service intervals)
  recurring: boolean("recurring").default(false),
  recurrenceInterval: integer("recurrence_interval"), // Days between recurrences
  nextRecurrenceDate: timestamp("next_recurrence_date"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true, updatedAt: true });
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

// Push Notification Tokens - FCM device tokens
export const notificationTokens = pgTable("notification_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 500 }).notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  userRole: varchar("user_role", { length: 20 }).notNull(), // driver | manager
  platform: varchar("platform", { length: 20 }), // android | ios | web
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true).notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertNotificationTokenSchema = createInsertSchema(notificationTokens).omit({ id: true, createdAt: true });
export type NotificationToken = typeof notificationTokens.$inferSelect;
export type InsertNotificationToken = z.infer<typeof insertNotificationTokenSchema>;