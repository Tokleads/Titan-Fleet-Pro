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
    podEnabled: true,
    driverHistoryDays: 7,
    fuelAnomalyThreshold: 2.0
  }),
  
  // Contact and status
  contactEmail: text("contact_email"),
  isActive: boolean("is_active").default(true),
  
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
  password: text("password"), // Hashed password for local auth (optional)
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
  
  // Service Interval Management
  currentMileage: integer("current_mileage").default(0), // Current odometer reading
  lastServiceDate: timestamp("last_service_date"), // Date of last service
  lastServiceMileage: integer("last_service_mileage"), // Mileage at last service
  serviceIntervalMiles: integer("service_interval_miles").default(10000), // Service every X miles
  serviceIntervalMonths: integer("service_interval_months").default(12), // Service every X months
  nextServiceDue: timestamp("next_service_due"), // Calculated next service date
  nextServiceMileage: integer("next_service_mileage"), // Calculated next service mileage
  
  // Fleet Hierarchy
  categoryId: integer("category_id").references(() => vehicleCategories.id),
  costCentreId: integer("cost_centre_id").references(() => costCentres.id),
  departmentId: integer("department_id").references(() => departments.id),
  
  // Manual entry flagging
  pendingReview: boolean("pending_review").default(false), // Flagged for manager review
  addedByDriverId: integer("added_by_driver_id").references(() => users.id), // Driver who manually added
  reviewNotes: text("review_notes"), // Notes from driver about why manual entry
  
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
  cabPhotos: jsonb("cab_photos"), // Array of object storage paths for cab cleanliness photos
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
  photo: text("photo"), // Object storage path for defect photo evidence
  
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
  geofenceType: varchar("geofence_type", { length: 20 }).default("circle").notNull(),
  polygonCoordinates: jsonb("polygon_coordinates"),
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
  arrivalAccuracy: integer("arrival_accuracy"),
  departureAccuracy: integer("departure_accuracy"),
  manualDepotSelection: boolean("manual_depot_selection").default(false).notNull(),
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

// Service History - Track all vehicle services
export const serviceHistory = pgTable("service_history", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  serviceDate: timestamp("service_date").notNull(),
  serviceMileage: integer("service_mileage").notNull(),
  serviceType: varchar("service_type", { length: 50 }).notNull(), // Annual Service | Interim Service | Major Service | Oil Change | Brake Service | etc.
  serviceProvider: text("service_provider"), // Workshop name
  cost: integer("cost"), // Cost in pence
  workPerformed: text("work_performed"), // Description of work
  nextServiceDue: timestamp("next_service_due"), // Calculated next service date
  nextServiceMileage: integer("next_service_mileage"), // Calculated next service mileage
  invoiceUrl: text("invoice_url"), // Link to invoice/receipt
  performedBy: integer("performed_by").references(() => users.id), // Manager who logged the service
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertServiceHistorySchema = createInsertSchema(serviceHistory).omit({ id: true, createdAt: true });
export type ServiceHistory = typeof serviceHistory.$inferSelect;
export type InsertServiceHistory = z.infer<typeof insertServiceHistorySchema>;

// ==================== DVLA LICENSE INTEGRATION ====================

// Driver License Data - Stores DVLA license information
export const driverLicenses = pgTable("driver_licenses", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => users.id).notNull().unique(), // One license per driver
  companyId: integer("company_id").references(() => companies.id).notNull(),
  
  // License identification
  licenseNumber: varchar("license_number", { length: 20 }).notNull(),
  
  // Driver information (from DVLA)
  firstName: text("first_name"),
  lastName: text("last_name"),
  dateOfBirth: timestamp("date_of_birth"),
  
  // License details
  licenseType: varchar("license_type", { length: 20 }), // Full | Provisional
  licenseStatus: varchar("license_status", { length: 20 }), // Valid | Expired | Suspended | Revoked
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  
  // Entitlements (categories) - stored as JSON array
  entitlements: jsonb("entitlements"), // [{ categoryCode: "C", expiryDate: "2037-10-25" }, ...]
  
  // Endorsements (penalty points) - stored as JSON array
  endorsements: jsonb("endorsements"), // [{ offenceCode: "SP30", offenceDate: "2018-04-28", penaltyPoints: 3, ... }, ...]
  totalPenaltyPoints: integer("total_penalty_points").default(0),
  
  // Disqualifications
  isDisqualified: boolean("is_disqualified").default(false),
  disqualificationDetails: jsonb("disqualification_details"), // { startDate, endDate, reason }
  
  // CPC (Certificate of Professional Competency) for HGV/PSV drivers
  cpcNumber: varchar("cpc_number", { length: 50 }),
  cpcExpiryDate: timestamp("cpc_expiry_date"),
  
  // Tachograph card
  tachographCardNumber: varchar("tachograph_card_number", { length: 50 }),
  tachographExpiryDate: timestamp("tachograph_expiry_date"),
  
  // Verification tracking
  lastVerifiedAt: timestamp("last_verified_at"),
  lastVerificationStatus: varchar("last_verification_status", { length: 20 }), // success | failed | pending
  nextVerificationDue: timestamp("next_verification_due"), // Auto-check monthly
  
  // Raw DVLA response (for audit trail)
  rawDvlaResponse: jsonb("raw_dvla_response"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertDriverLicenseSchema = createInsertSchema(driverLicenses).omit({ id: true, createdAt: true, updatedAt: true });
export type DriverLicense = typeof driverLicenses.$inferSelect;
export type InsertDriverLicense = z.infer<typeof insertDriverLicenseSchema>;

// License Verification History - Audit trail of all DVLA checks
export const licenseVerifications = pgTable("license_verifications", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  licenseId: integer("license_id").references(() => driverLicenses.id),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  
  // Verification details
  verificationDate: timestamp("verification_date").defaultNow().notNull(),
  verificationType: varchar("verification_type", { length: 20 }).notNull(), // manual | automatic | scheduled
  verificationStatus: varchar("verification_status", { length: 20 }).notNull(), // success | failed | error
  
  // Results
  licenseValid: boolean("license_valid"),
  licenseStatus: varchar("license_status", { length: 20 }), // Valid | Expired | Suspended | Revoked
  penaltyPoints: integer("penalty_points"),
  isDisqualified: boolean("is_disqualified"),
  
  // Changes detected
  changesDetected: boolean("changes_detected").default(false),
  changesSummary: text("changes_summary"), // Human-readable summary of changes
  
  // API response
  dvlaResponse: jsonb("dvla_response"), // Full DVLA API response
  errorMessage: text("error_message"), // If verification failed
  
  // Who initiated the check
  initiatedBy: integer("initiated_by").references(() => users.id), // Manager who requested check
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertLicenseVerificationSchema = createInsertSchema(licenseVerifications).omit({ id: true, createdAt: true });
export type LicenseVerification = typeof licenseVerifications.$inferSelect;
export type InsertLicenseVerification = z.infer<typeof insertLicenseVerificationSchema>;

// License Alerts - Automated alerts for license issues
export const licenseAlerts = pgTable("license_alerts", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  licenseId: integer("license_id").references(() => driverLicenses.id),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  
  // Alert details
  alertType: varchar("alert_type", { length: 50 }).notNull(), // expiry_warning | penalty_points | disqualification | verification_failed | invalid_license
  severity: varchar("severity", { length: 20 }).notNull(), // info | warning | critical
  title: text("title").notNull(),
  message: text("message").notNull(),
  
  // Alert status
  status: varchar("status", { length: 20 }).notNull().default("active"), // active | acknowledged | resolved
  acknowledgedBy: integer("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  
  // Related data
  relatedVerificationId: integer("related_verification_id").references(() => licenseVerifications.id),
  expiryDate: timestamp("expiry_date"), // For expiry warnings
  penaltyPoints: integer("penalty_points"), // For penalty point alerts
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertLicenseAlertSchema = createInsertSchema(licenseAlerts).omit({ id: true, createdAt: true, updatedAt: true });
export type LicenseAlert = typeof licenseAlerts.$inferSelect;
export type InsertLicenseAlert = z.infer<typeof insertLicenseAlertSchema>;


// Fleet Hierarchy - Categories
export const vehicleCategories = pgTable("vehicle_categories", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "HGV", "LGV", "Van", "Car"
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3b82f6"), // Hex color for UI
  icon: varchar("icon", { length: 50 }).default("truck"), // Lucide icon name
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertVehicleCategorySchema = createInsertSchema(vehicleCategories).omit({ id: true, createdAt: true, updatedAt: true });
export type VehicleCategory = typeof vehicleCategories.$inferSelect;
export type InsertVehicleCategory = z.infer<typeof insertVehicleCategorySchema>;

// Fleet Hierarchy - Cost Centres
export const costCentres = pgTable("cost_centres", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  code: varchar("code", { length: 50 }).notNull(), // e.g., "LON-001", "MAN-002"
  name: varchar("name", { length: 100 }).notNull(), // e.g., "London Depot", "Manchester Warehouse"
  description: text("description"),
  location: text("location"), // Address or location description
  managerName: varchar("manager_name", { length: 100 }),
  managerEmail: varchar("manager_email", { length: 255 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertCostCentreSchema = createInsertSchema(costCentres).omit({ id: true, createdAt: true, updatedAt: true });
export type CostCentre = typeof costCentres.$inferSelect;
export type InsertCostCentre = z.infer<typeof insertCostCentreSchema>;

// Fleet Hierarchy - Departments
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Sales", "Delivery", "Maintenance"
  description: text("description"),
  headOfDepartment: varchar("head_of_department", { length: 100 }),
  budgetCode: varchar("budget_code", { length: 50 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true, updatedAt: true });
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

// Fleet Documents - Vehicle and Driver Compliance Documents
export const fleetDocuments = pgTable("fleet_documents", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(), // S3 URL
  fileKey: text("file_key").notNull(), // S3 key for deletion
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  category: varchar("category", { length: 50 }).notNull(), 
  // Categories: VEHICLE_INSURANCE, VEHICLE_MOT, VEHICLE_V5C, VEHICLE_ROAD_TAX, VEHICLE_SERVICE_RECORD, 
  //             VEHICLE_TACHOGRAPH_CALIBRATION, VEHICLE_OPERATOR_LICENSE, VEHICLE_OTHER,
  //             DRIVER_LICENSE, DRIVER_CPC, DRIVER_TACHO_CARD, DRIVER_MEDICAL, DRIVER_INSURANCE,
  //             DRIVER_EMPLOYMENT_CONTRACT, DRIVER_TRAINING_CERT, DRIVER_OTHER
  entityType: varchar("entity_type", { length: 20 }).notNull(), // 'vehicle' | 'driver'
  entityId: integer("entity_id").notNull(), // ID of vehicle or user (driver)
  description: text("description"),
  expiryDate: timestamp("expiry_date"), // Optional expiry date for time-sensitive documents
  status: varchar("status", { length: 20 }).default("active"), // 'active' | 'expiring_soon' | 'expired'
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertFleetDocumentSchema = createInsertSchema(fleetDocuments).omit({ id: true, uploadedAt: true, updatedAt: true });
export type FleetDocument = typeof fleetDocuments.$inferSelect;
export type InsertFleetDocument = z.infer<typeof insertFleetDocumentSchema>;

// Notification System Tables (imported from notificationSchema.ts)
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  
  // Notification channels
  emailEnabled: boolean("email_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(false),
  inAppEnabled: boolean("in_app_enabled").default(true),
  
  // Notification types
  motExpiryEnabled: boolean("mot_expiry_enabled").default(true),
  taxExpiryEnabled: boolean("tax_expiry_enabled").default(true),
  serviceDueEnabled: boolean("service_due_enabled").default(true),
  licenseExpiryEnabled: boolean("license_expiry_enabled").default(true),
  vorStatusEnabled: boolean("vor_status_enabled").default(true),
  defectReportedEnabled: boolean("defect_reported_enabled").default(true),
  inspectionFailedEnabled: boolean("inspection_failed_enabled").default(true),
  
  // Timing preferences
  motExpiryDays: integer("mot_expiry_days").default(30),
  taxExpiryDays: integer("tax_expiry_days").default(30),
  serviceDueDays: integer("service_due_days").default(14),
  licenseExpiryDays: integer("license_expiry_days").default(30),
  
  // Email preferences
  email: text("email"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;

export const notificationHistory = pgTable("notification_history", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  
  type: varchar("type", { length: 50 }).notNull(),
  channel: varchar("channel", { length: 20 }).notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  
  status: varchar("status", { length: 20 }).notNull().default("PENDING"),
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertNotificationHistorySchema = createInsertSchema(notificationHistory).omit({ id: true, createdAt: true });
export type NotificationHistory = typeof notificationHistory.$inferSelect;
export type InsertNotificationHistory = z.infer<typeof insertNotificationHistorySchema>;

// ==================== PAY RATES & WAGE CALCULATIONS ====================

// Pay Rates - Flexible wage calculation
export const payRates = pgTable("pay_rates", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  driverId: integer("driver_id").references(() => users.id), // null = company default
  
  // Base rates (£/hour)
  baseRate: varchar("base_rate", { length: 10 }).notNull().default("12.00"),
  nightRate: varchar("night_rate", { length: 10 }).notNull().default("15.00"), // 10 PM - 6 AM
  weekendRate: varchar("weekend_rate", { length: 10 }).notNull().default("18.00"), // Saturday/Sunday
  bankHolidayRate: varchar("bank_holiday_rate", { length: 10 }).notNull().default("24.00"),
  overtimeMultiplier: varchar("overtime_multiplier", { length: 10 }).notNull().default("1.5"), // 1.5x base rate
  
  // Time thresholds
  nightStartHour: integer("night_start_hour").notNull().default(22), // 10 PM
  nightEndHour: integer("night_end_hour").notNull().default(6), // 6 AM
  dailyOvertimeThreshold: integer("daily_overtime_threshold").notNull().default(480), // 8 hours in minutes
  weeklyOvertimeThreshold: integer("weekly_overtime_threshold").notNull().default(2400), // 40 hours in minutes
  
  // Settings
  isActive: boolean("is_active").notNull().default(true),
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertPayRateSchema = createInsertSchema(payRates).omit({ id: true, createdAt: true, updatedAt: true });
export type PayRate = typeof payRates.$inferSelect;
export type InsertPayRate = z.infer<typeof insertPayRateSchema>;

// Bank Holidays - UK public holidays
export const bankHolidays = pgTable("bank_holidays", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  date: timestamp("date").notNull(),
  isRecurring: boolean("is_recurring").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertBankHolidaySchema = createInsertSchema(bankHolidays).omit({ id: true, createdAt: true });
export type BankHoliday = typeof bankHolidays.$inferSelect;
export type InsertBankHoliday = z.infer<typeof insertBankHolidaySchema>;

// Wage Calculations - Cached wage breakdowns for timesheets
export const wageCalculations = pgTable("wage_calculations", {
  id: serial("id").primaryKey(),
  timesheetId: integer("timesheet_id").notNull().unique(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  payRateId: integer("pay_rate_id").references(() => payRates.id).notNull(),
  
  // Hours breakdown (in minutes)
  regularMinutes: integer("regular_minutes").notNull().default(0),
  nightMinutes: integer("night_minutes").notNull().default(0),
  weekendMinutes: integer("weekend_minutes").notNull().default(0),
  bankHolidayMinutes: integer("bank_holiday_minutes").notNull().default(0),
  overtimeMinutes: integer("overtime_minutes").notNull().default(0),
  
  // Wage breakdown (in £)
  regularPay: varchar("regular_pay", { length: 10 }).notNull().default("0.00"),
  nightPay: varchar("night_pay", { length: 10 }).notNull().default("0.00"),
  weekendPay: varchar("weekend_pay", { length: 10 }).notNull().default("0.00"),
  bankHolidayPay: varchar("bank_holiday_pay", { length: 10 }).notNull().default("0.00"),
  overtimePay: varchar("overtime_pay", { length: 10 }).notNull().default("0.00"),
  totalPay: varchar("total_pay", { length: 10 }).notNull().default("0.00"),
  
  // Metadata
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertWageCalculationSchema = createInsertSchema(wageCalculations).omit({ id: true, createdAt: true, updatedAt: true });
export type WageCalculation = typeof wageCalculations.$inferSelect;
export type InsertWageCalculation = z.infer<typeof insertWageCalculationSchema>;

// Purchase Requests - Company signup/registration requests (legacy table)
export const purchaseRequests = pgTable("purchase_requests", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  companyName: text("company_name"),
  fleetSize: text("fleet_size"),
  tier: text("tier"),
  paymentUrl: text("payment_url"),
  userAgent: text("user_agent"),
  ip: text("ip"),
  contactName: text("contact_name"),
  phone: text("phone"),
  status: text("status"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertPurchaseRequestSchema = createInsertSchema(purchaseRequests).omit({ id: true, createdAt: true });
export type PurchaseRequest = typeof purchaseRequests.$inferSelect;
export type InsertPurchaseRequest = z.infer<typeof insertPurchaseRequestSchema>;

// Referrals - Referral program system
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerCompanyId: integer("referrer_company_id").references(() => companies.id).notNull(),
  referralCode: varchar("referral_code", { length: 20 }).notNull().unique(),
  referredCompanyId: integer("referred_company_id").references(() => companies.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | signed_up | converted | rewarded
  rewardType: varchar("reward_type", { length: 50 }), // free_month | credit | discount
  rewardValue: integer("reward_value"), // e.g., 1 for 1 month free, 50 for £50 credit
  rewardClaimed: boolean("reward_claimed").default(false),
  signedUpAt: timestamp("signed_up_at"),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true });
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  deliveryAddress: text("delivery_address"),
  referenceNumber: varchar("reference_number", { length: 100 }),
  signatureUrl: text("signature_url").notNull(),
  photoUrls: jsonb("photo_urls").notNull(),
  deliveryNotes: text("delivery_notes"),
  gpsLatitude: text("gps_latitude").notNull(),
  gpsLongitude: text("gps_longitude").notNull(),
  gpsAccuracy: integer("gps_accuracy"),
  arrivedAt: timestamp("arrived_at"),
  departedAt: timestamp("departed_at"),
  completedAt: timestamp("completed_at").notNull(),
  status: varchar("status", { length: 20 }).default("completed").notNull(),
  invoicedAt: timestamp("invoiced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({ id: true, createdAt: true, updatedAt: true });
export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  priority: varchar("priority", { length: 20 }).default("normal"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Account Setup Tokens - sent after Stripe purchase
export const accountSetupTokens = pgTable("account_setup_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  email: text("email").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  tier: varchar("tier", { length: 20 }),
  maxVehicles: integer("max_vehicles"),
  used: boolean("used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertAccountSetupTokenSchema = createInsertSchema(accountSetupTokens).omit({ id: true, createdAt: true });
export type AccountSetupToken = typeof accountSetupTokens.$inferSelect;
export type InsertAccountSetupToken = z.infer<typeof insertAccountSetupTokenSchema>;

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  used: boolean("used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
