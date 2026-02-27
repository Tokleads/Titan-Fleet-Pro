import type { Express, Request, Response } from "express";
import type { UploadedFile } from "express-fileupload";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, gte, desc, isNull, sql, or } from "drizzle-orm";
import { insertVehicleSchema, insertInspectionSchema, insertFuelEntrySchema, insertDefectSchema, insertTrailerSchema, insertDocumentSchema, insertLicenseUpgradeRequestSchema, insertDeliverySchema, insertMessageSchema, vehicles, inspections, defects, notifications, messages, timesheets, users, fuelEntries, operatorLicences, operatorLicenceVehicles, documents, shiftChecks, reminders } from "@shared/schema";
import { z } from "zod";
import { dvsaService } from "./dvsa";
import { generateInspectionPDF, getInspectionFilename } from "./pdfService";
import { healthCheck, livenessProbe, readinessProbe } from "./healthCheck";
import { getPerformanceStats, getSlowQueries } from "./performanceMonitoring";
import { runNotificationChecks, getSchedulerStatus } from "./scheduler";
import { registerFuelIntelligenceRoutes } from "./fuelIntelligenceRoutes";
import { registerVehicleManagementRoutes } from "./vehicleManagementRoutes";
import { registerApiHealthRoutes } from "./apiHealthRoutes";
import driverRoutes from "./driverRoutes";
import authRoutes from "./authRoutes";
import { ObjectStorageService } from "./objectStorage";
import { triggerDefectReported, triggerInspectionFailed, triggerNewDriverWelcome, checkMOTExpiryWarnings } from "./notificationTriggers";
import { triageDefect } from "./aiTriageService";
import { getMaintenanceAlerts, runPredictiveMaintenance } from "./predictiveMaintenanceService";
import { maintenanceAlerts, stagnationAlerts } from "@shared/schema";
import { signToken, requireAuth, requireCompany, requireRole } from "./jwtAuth";
import { requirePermission } from './permissionGuard';
import { authLimiter } from "./rateLimiter";

const objectStorageService = new ObjectStorageService();

function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') return sanitizeInput(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObject(value);
    }
    return result;
  }
  return obj;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PUBLIC_PATHS = [
    '/api/driver/login',
    '/api/manager/login',
    '/api/health',
    '/api/health/live',
    '/api/health/ready',
    '/api/stripe/publishable-key',
    '/api/stripe/products',
    '/api/stripe/webhook',
    '/api/stripe/checkout',
    '/api/feedback',
    '/api/referral/validate/',
    '/api/admin/login',
    '/api/auth/',
    '/health',
  ];

  const PUBLIC_EXACT_PATTERNS = [
    /^\/api\/company\/[A-Za-z0-9_-]+$/,
  ];

  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) return next();

    const isPublic = PUBLIC_PATHS.some(p => req.path === p || req.path.startsWith(p));
    const isPublicPattern = PUBLIC_EXACT_PATTERNS.some(p => p.test(req.path));
    if (isPublic || isPublicPattern) return next();

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }
    next();
  });

  app.use((req, res, next) => {
    if (!req.user) return next();

    const paramCompanyId = Number(req.params.companyId);
    const queryCompanyId = Number(req.query.companyId);
    const bodyCompanyId = req.body?.companyId ? Number(req.body.companyId) : null;

    const suppliedCompanyId = paramCompanyId || queryCompanyId || bodyCompanyId;

    if (suppliedCompanyId && suppliedCompanyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
    }

    next();
  });

  // Health check endpoints (public, no auth needed)
  const { healthCheck, livenessProbe, readinessProbe } = await import('./healthCheck');
  app.get('/api/health', healthCheck);
  app.get('/api/health/live', livenessProbe);
  app.get('/api/health/ready', readinessProbe);

  const MANAGER_ROLES = ['ADMIN', 'TRANSPORT_MANAGER', 'OFFICE', 'PLANNER', 'AUDITOR', 'MECHANIC', 'manager'] as const;

  app.use('/api/manager', (req, res, next) => {
    if (req.path === '/login' || req.path === '/login/') return next();
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!MANAGER_ROLES.includes(req.user.role as any)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Manager access required' });
    }
    next();
  });

  // Auth routes
  app.use('/api/auth', authRoutes);

  // Stripe API routes
  app.get('/api/stripe/publishable-key', async (req, res) => {
    try {
      const { getStripePublishableKey } = await import('./stripeClient');
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get Stripe key' });
    }
  });

  app.get('/api/stripe/products', async (req, res) => {
    try {
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      
      const products = await stripe.products.list({ active: true, limit: 10 });
      const prices = await stripe.prices.list({ active: true, limit: 50 });
      
      const result = products.data.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        metadata: product.metadata,
        prices: prices.data
          .filter(price => price.product === product.id)
          .map(price => ({
            id: price.id,
            unitAmount: price.unit_amount,
            currency: price.currency,
            recurring: price.recurring,
          }))
      }));
      
      result.sort((a, b) => {
        const aPrice = a.prices[0]?.unitAmount || 0;
        const bPrice = b.prices[0]?.unitAmount || 0;
        return aPrice - bPrice;
      });
      
      res.json({ products: result });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.post('/api/stripe/checkout', async (req, res) => {
    try {
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      const { priceId, companyName, companyEmail, referralCode } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ error: 'Missing priceId' });
      }
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const sessionParams: any = {
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/?checkout=success`,
        cancel_url: `${baseUrl}/?checkout=cancelled`,
        allow_promotion_codes: true,
        subscription_data: {
          trial_period_days: 14,
          metadata: {},
        },
        metadata: {},
        custom_text: {
          submit: {
            message: 'Cancel anytime — no lock-in contracts. Your 14-day free trial starts today.',
          },
        },
      };
      
      if (companyEmail) {
        sessionParams.customer_email = companyEmail;
      }
      if (companyName) {
        sessionParams.subscription_data.metadata.companyName = companyName;
      }
      if (referralCode) {
        try {
          const referral = await storage.getReferralByCode(referralCode.toUpperCase());
          if (referral && referral.status === 'pending') {
            sessionParams.subscription_data.metadata.referralCode = referralCode;
            sessionParams.metadata.referralCode = referralCode;
          }
        } catch (err) {
          console.error('[REFERRAL] Failed to validate referral code at checkout:', err);
        }
      }
      
      const session = await stripe.checkout.sessions.create(sessionParams);
      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  app.post('/api/stripe/portal', async (req, res) => {
    try {
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      const { customerId } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ error: 'Missing customerId' });
      }
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/manager/settings`,
      });
      
      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Portal error:', error);
      res.status(500).json({ error: 'Failed to create portal session' });
    }
  });

  // Fuel Intelligence routes
  registerFuelIntelligenceRoutes(app);
  registerVehicleManagementRoutes(app);
  registerApiHealthRoutes(app);
  
  // Driver management routes
  app.use("/api/drivers", driverRoutes);
  
  // Feedback endpoint
  app.post("/api/feedback", async (req, res) => {
    try {
      const { type, page } = req.body;
      const message = typeof req.body.message === 'string' ? sanitizeInput(req.body.message) : req.body.message;
      console.log(`[FEEDBACK] ${type}: ${message} (from ${page})`);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to save feedback:", error);
      res.status(500).json({ error: "Failed to save feedback" });
    }
  });

  // Health check endpoints
  app.get("/health", healthCheck);
  app.get("/health/live", livenessProbe);
  app.get("/health/ready", readinessProbe);
  
  // Performance monitoring endpoints (admin-only)
  app.get("/api/performance/stats", (req, res) => {
    if (!req.user || !['ADMIN', 'TRANSPORT_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    res.json(getPerformanceStats());
  });
  
  app.get("/api/performance/slow-queries", (req, res) => {
    if (!req.user || !['ADMIN', 'TRANSPORT_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    res.json(getSlowQueries(limit));
  });
  
  // Sentry test endpoint
  app.get("/api/test-sentry", (req, res) => {
    try {
      // Trigger a test error
      throw new Error("Sentry test error - Backend is working! Check your Sentry dashboard.");
    } catch (error) {
      // Import captureException if Sentry is configured
      try {
        const { captureException } = require('./sentry');
        captureException(error as Error, {
          tags: { test: true },
          extra: { endpoint: '/api/test-sentry' }
        });
      } catch (e) {
        // Sentry not configured, that's okay
      }
      res.status(500).json({ 
        error: "Test error triggered",
        message: "Check your Sentry dashboard for this error",
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Notification scheduler endpoints (admin-only)
  app.get("/api/scheduler/status", (req, res) => {
    if (!req.user || !['ADMIN', 'TRANSPORT_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    res.json(getSchedulerStatus());
  });
  
  app.post("/api/scheduler/run", async (req, res) => {
    if (!req.user || !['ADMIN', 'TRANSPORT_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    try {
      const result = await runNotificationChecks();
      res.json({
        message: "Notification checks completed",
        ...result
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to run notification checks",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Cron endpoint (admin-only)
  app.get("/api/cron/run-notifications", async (req, res) => {
    if (!req.user || !['ADMIN', 'TRANSPORT_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    try {
      const result = await runNotificationChecks();
      res.json({
        message: "Notification checks completed",
        ...result
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to run notification checks",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // MOT expiry check endpoint
  app.post("/api/notifications/check-mot-expiry", async (req, res) => {
    try {
      const result = await checkMOTExpiryWarnings();
      res.json({
        message: "MOT expiry check completed",
        vehiclesChecked: result.checked,
        notificationsSent: result.notified
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to check MOT expiry",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Defect photo upload - get presigned URL
  app.post("/api/defect-photos/request-url", async (req, res) => {
    try {
      const { companyId, filename, contentType } = req.body;
      if (!companyId || !filename) {
        return res.status(400).json({ error: "Missing companyId or filename" });
      }
      
      const result = await objectStorageService.getDocumentUploadURL(
        Number(companyId),
        `defect-${Date.now()}-${filename}`
      );
      
      res.json({
        uploadURL: result.uploadUrl,
        objectPath: result.storagePath,
      });
    } catch (error) {
      console.error("Failed to get defect photo upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/api/global-search", async (req, res) => {
    try {
      const { companyId, q } = req.query;
      if (!companyId || !q) {
        return res.json({ drivers: [], vehicles: [] });
      }
      const query = String(q).toLowerCase().trim();
      if (query.length < 2) {
        return res.json({ drivers: [], vehicles: [] });
      }

      const [matchingUsers, matchingVehicles] = await Promise.all([
        db.select().from(users)
          .where(and(
            eq(users.companyId, Number(companyId)),
            or(
              sql`LOWER(${users.name}) LIKE ${`%${query}%`}`,
              sql`LOWER(${users.email}) LIKE ${`%${query}%`}`
            )
          ))
          .limit(10),
        db.select().from(vehicles)
          .where(and(
            eq(vehicles.companyId, Number(companyId)),
            or(
              sql`LOWER(${vehicles.vrm}) LIKE ${`%${query}%`}`,
              sql`LOWER(${vehicles.make}) LIKE ${`%${query}%`}`,
              sql`LOWER(${vehicles.model}) LIKE ${`%${query}%`}`
            )
          ))
          .limit(10),
      ]);

      const drivers = matchingUsers
        .map((u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role }));

      const matchedVehicles = matchingVehicles
        .map((v: any) => ({ id: v.id, vrm: v.vrm, make: v.make, model: v.model }));

      res.json({ drivers, vehicles: matchedVehicles });
    } catch (error) {
      console.error("Global search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Company lookup
  app.get("/api/company/:code", async (req, res) => {
    try {
      const company = await storage.getCompanyByCode(req.params.code);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vehicle search
  app.get("/api/vehicles/search", async (req, res) => {
    try {
      const { companyId, query } = req.query;
      if (!companyId || !query) {
        return res.status(400).json({ error: "Missing companyId or query" });
      }
      
      const results = await storage.searchVehicles(Number(companyId), String(query));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });  // Get all vehicles for a company
  app.get("/api/vehicles", async (req, res) => {
    try {
      const { companyId, limit = '50', offset = '0' } = req.query;
      if (!companyId) {
        return res.status(400).json({ error: "Missing companyId" });
      }
      
      const result = await storage.getVehiclesByCompany(
        Number(companyId),
        Number(limit),
        Number(offset)
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get recent vehicles for driver
  app.get("/api/vehicles/recent", async (req, res) => {
    try {
      const { companyId, driverId, limit = '5' } = req.query;
      if (!companyId || !driverId) {
        return res.status(400).json({ error: "Missing companyId or driverId" });
      }
      
      const recentVehicles = await storage.getRecentVehicles(
        Number(companyId),
        Number(driverId),
        Number(limit)
      );
      res.json(recentVehicles);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get last recorded mileage for a vehicle
  app.get("/api/vehicles/:id/last-mileage", async (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
      const vehicle = await storage.getVehicleById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (req.user && vehicle.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const results = await db.select({ odometer: inspections.odometer })
        .from(inspections)
        .where(eq(inspections.vehicleId, vehicleId))
        .orderBy(desc(inspections.createdAt))
        .limit(1);
      
      const lastMileage = results.length > 0 ? results[0].odometer : null;
      res.json({ lastMileage });
    } catch (error) {
      console.error("Failed to get last mileage:", error);
      res.json({ lastMileage: null });
    }
  });

  // Get vehicle by ID
  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicleById(Number(req.params.id));
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (req.user && vehicle.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/vehicles/:id/full-profile", async (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
      const vehicle = await storage.getVehicleById(vehicleId);
      if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
      if (req.user && vehicle.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }

      const [vehicleInspections, vehicleDefects, vehicleFuelEntries, assignedDriver] = await Promise.all([
        db.select({
          id: inspections.id,
          type: inspections.type,
          status: inspections.status,
          driverId: inspections.driverId,
          odometer: inspections.odometer,
          createdAt: inspections.createdAt,
          driverName: users.name,
        }).from(inspections)
          .leftJoin(users, eq(inspections.driverId, users.id))
          .where(eq(inspections.vehicleId, vehicleId))
          .orderBy(desc(inspections.createdAt))
          .limit(50),
        db.select({
          id: defects.id,
          description: defects.description,
          status: defects.status,
          severity: defects.severity,
          category: defects.category,
          supplier: defects.supplier,
          site: defects.site,
          createdAt: defects.createdAt,
          resolvedAt: defects.resolvedAt,
          reportedByName: users.name,
        }).from(defects)
          .leftJoin(users, eq(defects.reportedBy, users.id))
          .where(eq(defects.vehicleId, vehicleId))
          .orderBy(desc(defects.createdAt))
          .limit(50),
        db.select().from(fuelEntries)
          .where(eq(fuelEntries.vehicleId, vehicleId))
          .orderBy(desc(fuelEntries.createdAt))
          .limit(50),
        db.select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .innerJoin(
            sql`(SELECT DISTINCT ON (vehicle_id) driver_id, vehicle_id FROM inspections WHERE vehicle_id = ${vehicleId} ORDER BY vehicle_id, created_at DESC) AS latest`,
            sql`${users.id} = latest.driver_id`
          )
          .limit(1),
      ]);

      const now = new Date();
      res.json({
        ...vehicle,
        createdAt: vehicle.createdAt?.toISOString(),
        motDue: vehicle.motDue?.toISOString() || null,
        taxDue: vehicle.taxDue?.toISOString() || null,
        vorStartDate: vehicle.vorStartDate?.toISOString() || null,
        vorResolvedDate: vehicle.vorResolvedDate?.toISOString() || null,
        lastServiceDate: vehicle.lastServiceDate?.toISOString() || null,
        nextServiceDue: vehicle.nextServiceDue?.toISOString() || null,
        assignedDriver: assignedDriver[0] || null,
        inspections: vehicleInspections.map((i) => ({
          ...i,
          createdAt: i.createdAt?.toISOString(),
        })),
        defects: vehicleDefects.map((d) => {
          const daysOpen = d.resolvedAt
            ? Math.ceil((new Date(d.resolvedAt).getTime() - new Date(d.createdAt).getTime()) / (1000*60*60*24))
            : Math.ceil((now.getTime() - new Date(d.createdAt).getTime()) / (1000*60*60*24));
          return {
            ...d,
            daysOpen,
            createdAt: d.createdAt?.toISOString(),
            resolvedAt: d.resolvedAt?.toISOString() || null,
          };
        }),
        fuelEntries: vehicleFuelEntries.map((f) => ({
          ...f,
          createdAt: f.createdAt?.toISOString(),
        })),
      });
    } catch (error) {
      console.error("Vehicle full profile error:", error);
      res.status(500).json({ error: "Failed to fetch vehicle profile" });
    }
  });

  // Create inspection
  app.post("/api/inspections", async (req, res) => {
    try {
      const body = { ...req.body };
      if (typeof body.startedAt === "string") {
        body.startedAt = new Date(body.startedAt);
      }
      if (typeof body.completedAt === "string") {
        body.completedAt = new Date(body.completedAt);
      }
      if (body.odometer != null) {
        body.odometer = Math.min(Math.max(0, Math.round(Number(body.odometer) || 0)), 2147483647);
      }
      let validated;
      try {
        validated = insertInspectionSchema.parse(body);
      } catch (parseErr: any) {
        console.error("Inspection validation failed:", JSON.stringify(parseErr.errors || parseErr.message, null, 2));
        console.error("Body keys:", Object.keys(body));
        return res.status(400).json({ error: "Validation failed", details: parseErr.errors || parseErr.message });
      }
      const inspection = await storage.createInspection(validated);
      
      // Track vehicle usage
      await storage.trackVehicleUsage(
        inspection.companyId,
        inspection.driverId,
        inspection.vehicleId
      );
      
      // Create defect records in the defects table from inspection defects
      const defectsArray = inspection.defects as any[] | null;
      if (defectsArray && defectsArray.length > 0) {
        setImmediate(async () => {
          try {
            for (const defect of defectsArray) {
              await storage.createDefect({
                companyId: inspection.companyId,
                vehicleId: inspection.vehicleId,
                inspectionId: inspection.id,
                reportedBy: inspection.driverId,
                category: defect.category || defect.item || 'General',
                description: defect.notes || defect.description || defect.item || 'Defect reported during inspection',
                severity: defect.severity || (inspection.status === 'FAIL' ? 'HIGH' : 'MEDIUM'),
                status: 'OPEN',
                photo: defect.photo || defect.photoUrl || null,
              });
            }
            console.log(`[DEFECT-SYNC] Created ${defectsArray.length} defect record(s) from inspection ${inspection.id}`);
          } catch (err) {
            console.error('[DEFECT-SYNC] Failed to create defect records:', err);
          }
        });
      }

      // If inspection failed (has defects), notify managers
      if (inspection.status === 'FAIL') {
        const defectCount = defectsArray?.length || 1;
        setImmediate(() => {
          triggerInspectionFailed({
            companyId: inspection.companyId,
            vehicleId: inspection.vehicleId,
            driverId: inspection.driverId,
            defectCount,
          });
        });

        // Auto-VOR: Flag vehicle as off-road when inspection fails
        setImmediate(async () => {
          try {
            await storage.updateVehicle(inspection.vehicleId, {
              vorStatus: true,
              vorReason: 'FAILED_INSPECTION',
              vorStartDate: new Date(),
              vorNotes: `Auto-flagged: Failed inspection by driver (${defectCount} defect${defectCount !== 1 ? 's' : ''})`,
            });
            console.log(`[AUTO-VOR] Vehicle ${inspection.vehicleId} flagged as VOR due to failed inspection`);
          } catch (err) {
            console.error('[AUTO-VOR] Failed to set VOR status:', err);
          }
        });
      }
      
      // Auto-upload PDF to Google Drive if configured (async, non-blocking)
      setImmediate(async () => {
        try {
          const company = await storage.getCompanyById(inspection.companyId);
          if (company?.googleDriveConnected && company.driveRefreshToken) {
            const vehicle = await storage.getVehicleById(inspection.vehicleId);
            const driver = await storage.getUser(inspection.driverId);
            
            if (vehicle && driver) {
              const { generateInspectionPDF, getInspectionFilename } = await import("./pdfService");
              const { googleDriveService } = await import("./googleDriveService");
              
              const pdfData = {
                id: inspection.id,
                companyName: company.name,
                vehicleVrm: vehicle.vrm,
                vehicleMake: vehicle.make,
                vehicleModel: vehicle.model,
                driverName: driver.name,
                type: inspection.type,
                status: inspection.status,
                odometer: inspection.odometer,
                checklist: inspection.checklist as any[],
                defects: inspection.defects as any[] | null,
                hasTrailer: inspection.hasTrailer || false,
                startedAt: inspection.startedAt?.toISOString() || null,
                completedAt: inspection.completedAt?.toISOString() || null,
                durationSeconds: inspection.durationSeconds,
                createdAt: inspection.createdAt.toISOString(),
              };
              
              const filename = getInspectionFilename({
                vehicleVrm: vehicle.vrm,
                createdAt: inspection.createdAt.toISOString(),
                type: inspection.type,
              });
              
              const pdfStream = await generateInspectionPDF(pdfData);
              
              // Decrypt all stored credentials
              const { decrypt } = await import("./encryption");
              const decryptedClientId = decrypt(company.driveClientId!);
              const decryptedClientSecret = decrypt(company.driveClientSecret!);
              const decryptedToken = decrypt(company.driveRefreshToken!);
              
              const result = await googleDriveService.uploadPDF(pdfStream, filename, {
                clientId: decryptedClientId,
                clientSecret: decryptedClientSecret,
                refreshToken: decryptedToken,
                folderId: company.driveRootFolderId || undefined,
              });
              
              if (result.success) {
                console.log(`PDF uploaded to Google Drive: ${result.fileId}`);
              } else {
                console.error(`Google Drive upload failed: ${result.error}`);
              }
            }
          }
        } catch (err) {
          console.error('Google Drive auto-upload error:', err);
        }
      });
      
      res.status(201).json(inspection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get driver's inspections
  app.get("/api/inspections", async (req, res) => {
    try {
      const { companyId, driverId, days = '7' } = req.query;
      if (!companyId || !driverId) {
        return res.status(400).json({ error: "Missing companyId or driverId" });
      }
      
      const inspectionList = await storage.getInspectionsByDriver(
        Number(companyId),
        Number(driverId),
        Number(days)
      );
      res.json(inspectionList);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all inspections for company (manager view)
  app.get("/api/inspections/company/:companyId", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const inspectionList = await storage.getInspectionsByCompany(requestedCompanyId);
      res.json(inspectionList);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create fuel entry
  app.post("/api/fuel", async (req, res) => {
    try {
      const validated = insertFuelEntrySchema.parse(req.body);
      const fuelEntry = await storage.createFuelEntry(validated);
      
      // Track vehicle usage
      await storage.trackVehicleUsage(
        fuelEntry.companyId,
        fuelEntry.driverId,
        fuelEntry.vehicleId
      );
      
      res.status(201).json(fuelEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get driver's fuel entries
  app.get("/api/fuel", async (req, res) => {
    try {
      const { companyId, driverId, days = '7' } = req.query;
      if (!companyId || !driverId) {
        return res.status(400).json({ error: "Missing companyId or driverId" });
      }
      
      const entries = await storage.getFuelEntriesByDriver(
        Number(companyId),
        Number(driverId),
        Number(days)
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create defect report (driver)
  app.post("/api/defects", async (req, res) => {
    try {
      const { companyId, vehicleId, reportedBy, hasPhoto, severity } = req.body;
      const description = typeof req.body.description === 'string' ? sanitizeInput(req.body.description) : req.body.description;
      if (!companyId || !vehicleId || !reportedBy || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const defect = await storage.createDefect({
        companyId,
        vehicleId,
        reportedBy,
        description,
        category: "VEHICLE",
        status: "OPEN",
        severity: severity || "MEDIUM",
      });
      
      // Trigger notification to managers (async, non-blocking)
      setImmediate(() => {
        triggerDefectReported({
          companyId,
          vehicleId,
          reportedBy,
          description,
          severity: defect.severity,
        });
      });
      
      // Trigger AI triage (async, non-blocking)
      setImmediate(() => {
        triageDefect(defect.id).catch(err => 
          console.error('[AI Triage] Background triage failed:', err)
        );
      });
      
      res.status(201).json(defect);
    } catch (error) {
      console.error("Failed to create defect:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // AI Maintenance Alerts API
  app.get("/api/maintenance-alerts", async (req, res) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) return res.status(400).json({ error: "companyId required" });
      const alerts = await getMaintenanceAlerts(companyId);
      res.json(alerts);
    } catch (error) {
      console.error("Failed to get maintenance alerts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/maintenance-alerts/run", async (req, res) => {
    try {
      const { companyId } = req.body;
      if (!companyId) return res.status(400).json({ error: "companyId required" });
      await runPredictiveMaintenance(companyId);
      const alerts = await getMaintenanceAlerts(companyId);
      res.json({ success: true, alerts });
    } catch (error) {
      console.error("Failed to run predictive maintenance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/maintenance-alerts/:id/acknowledge", async (req, res) => {
    try {
      const alertId = Number(req.params.id);
      const { userId, companyId } = req.body;

      const [alert] = await db.select().from(maintenanceAlerts).where(eq(maintenanceAlerts.id, alertId));
      if (!alert) return res.status(404).json({ error: "Alert not found" });
      if (req.user && alert.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }

      await db.update(maintenanceAlerts)
        .set({ status: "ACKNOWLEDGED", acknowledgedBy: userId || null, acknowledgedAt: new Date() })
        .where(eq(maintenanceAlerts.id, alertId));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // AI Triage - manually trigger for existing defect
  app.post("/api/defects/:id/triage", async (req, res) => {
    try {
      const defectId = Number(req.params.id);
      const [existingDefect] = await db.select().from(defects).where(eq(defects.id, defectId));
      if (!existingDefect) {
        return res.status(404).json({ error: "Defect not found" });
      }
      if (req.user && existingDefect.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['host'] || req.headers['x-forwarded-host'];
      const baseUrl = host ? `${protocol}://${host}` : undefined;
      await triageDefect(defectId, baseUrl as string | undefined);
      const defect = await db.select().from(defects).where(eq(defects.id, defectId));
      res.json(defect[0] || { error: "Defect not found" });
    } catch (error) {
      console.error("Failed to triage defect:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get single inspection detail
  app.get("/api/inspections/:id", async (req, res) => {
    try {
      const inspection = await storage.getInspectionById(Number(req.params.id));
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      if (req.user && inspection.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const vehicle = await storage.getVehicleById(inspection.vehicleId);
      const driver = await storage.getUser(inspection.driverId);
      const company = await storage.getCompanyById(inspection.companyId);
      res.json({
        ...inspection,
        vehicleVrm: vehicle?.vrm || "Unknown",
        vehicleMake: vehicle?.make || "",
        vehicleModel: vehicle?.model || "",
        driverName: driver?.name || "Unknown",
        driverEmail: driver?.email || "",
        companyName: company?.name || "",
        createdAt: inspection.createdAt?.toISOString(),
        startedAt: inspection.startedAt?.toISOString() || null,
        completedAt: inspection.completedAt?.toISOString() || null,
      });
    } catch (error) {
      console.error("Get inspection error:", error);
      res.status(500).json({ error: "Failed to fetch inspection" });
    }
  });

  // Delete inspection
  app.delete("/api/inspections/:id", async (req, res) => {
    try {
      const inspection = await storage.getInspectionById(Number(req.params.id));
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }

      if (req.user && inspection.companyId !== req.user.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await db.update(inspections)
        .set({ status: 'DELETED' })
        .where(eq(inspections.id, Number(req.params.id)));

      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: inspection.companyId,
        userId: req.user?.userId || null,
        action: 'DELETE',
        entity: 'INSPECTION',
        entityId: inspection.id,
        details: { softDeleted: true, vehicleId: inspection.vehicleId, type: inspection.type },
        req,
      });

      res.json({ success: true, message: "Inspection archived (soft-deleted)" });
    } catch (error) {
      console.error("Delete inspection error:", error);
      res.status(500).json({ error: "Failed to delete inspection" });
    }
  });

  // Generate PDF for inspection
  app.get("/api/inspections/:id/pdf", async (req, res) => {
    try {
      const inspection = await storage.getInspectionById(Number(req.params.id));
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      if (req.user && inspection.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }

      const company = await storage.getCompanyById(inspection.companyId);
      const vehicle = await storage.getVehicleById(inspection.vehicleId);
      const driver = await storage.getUser(inspection.driverId);

      if (!company || !vehicle || !driver) {
        return res.status(404).json({ error: "Related data not found" });
      }

      const pdfData = {
        id: inspection.id,
        companyName: company.name,
        vehicleVrm: vehicle.vrm,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        driverName: driver.name,
        type: inspection.type,
        status: inspection.status,
        odometer: inspection.odometer,
        checklist: inspection.checklist as any[],
        defects: inspection.defects as any[] | null,
        cabPhotos: (inspection.cabPhotos as string[] | null) || undefined,
        hasTrailer: inspection.hasTrailer || false,
        startedAt: inspection.startedAt?.toISOString() || null,
        completedAt: inspection.completedAt?.toISOString() || null,
        durationSeconds: inspection.durationSeconds,
        createdAt: inspection.createdAt.toISOString(),
      };

      const filename = getInspectionFilename({
        vehicleVrm: vehicle.vrm,
        createdAt: inspection.createdAt.toISOString(),
        type: inspection.type,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const pdfStream = await generateInspectionPDF(pdfData);
      pdfStream.pipe(res);
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // DVSA MOT lookup
  app.get("/api/dvsa/mot/:registration", async (req, res) => {
    try {
      const motStatus = await dvsaService.getMotStatus(req.params.registration);
      if (!motStatus) {
        return res.status(404).json({ error: "Vehicle not found in DVSA database" });
      }
      res.json(motStatus);
    } catch (error) {
      console.error("DVSA lookup error:", error);
      res.status(500).json({ error: "Failed to fetch MOT data" });
    }
  });

  // DVSA full vehicle lookup
  app.get("/api/dvsa/vehicle/:registration", async (req, res) => {
    try {
      const vehicle = await dvsaService.getVehicleByRegistration(req.params.registration);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("DVSA vehicle lookup error:", error);
      res.status(500).json({ error: "Failed to fetch vehicle data" });
    }
  });

  // Driver login
  app.post("/api/driver/login", authLimiter, async (req, res) => {
    try {
      const companyCode = (req.body.companyCode || "").trim().toUpperCase();
      const pin = (req.body.pin || "").trim();
      if (!companyCode || !pin) {
        return res.status(400).json({ error: "Missing company code or PIN" });
      }

      console.log(`[Driver Login] Attempting login with company code: "${companyCode}"`);
      const company = await storage.getCompanyByCode(companyCode);
      if (!company) {
        return res.status(401).json({ error: "Invalid company code" });
      }

      const user = await storage.getUserByCompanyAndPin(company.id, pin, "driver");
      if (!user) {
        return res.status(401).json({ error: "Invalid PIN" });
      }

      const token = signToken({ userId: user.id, companyId: user.companyId, role: user.role as any, email: user.email || '', name: user.name });

      res.json({
        user: {
          id: user.id,
          companyId: user.companyId,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        },
        company: {
          id: company.id,
          name: company.name,
          companyCode: company.companyCode,
          primaryColor: company.primaryColor,
          settings: company.settings,
          licenseTier: company.licenseTier,
        },
        token,
      });
    } catch (error) {
      console.error("Driver login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // ==================== MANAGER API ROUTES ====================

  // Manager login
  app.post("/api/manager/login", authLimiter, async (req, res) => {
    try {
      const companyCode = (req.body.companyCode || "").trim().toUpperCase();
      const pin = (req.body.pin || "").trim();
      const totpToken = req.body.totpToken;
      if (!companyCode || !pin) {
        return res.status(400).json({ error: "Missing company code or PIN" });
      }

      const company = await storage.getCompanyByCode(companyCode);
      if (!company) {
        return res.status(401).json({ error: "Invalid company code" });
      }

      const manager = await storage.getUserByCompanyAndPin(company.id, pin, "manager");
      if (!manager) {
        return res.status(401).json({ error: "Invalid PIN" });
      }

      // Check if 2FA is enabled for this manager
      if (manager.totpEnabled && manager.totpSecret) {
        // If no TOTP token provided, indicate that 2FA is required
        if (!totpToken) {
          return res.json({ 
            requiresTwoFactor: true, 
            managerId: manager.id,
            managerName: manager.name
          });
        }
        
        // Verify TOTP token
        const { verifyTotpToken } = await import("./totpService");
        const isValid = verifyTotpToken(totpToken, manager.totpSecret);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid verification code" });
        }
      }

      // Audit log: Manager login
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: company.id,
        userId: manager.id,
        action: 'LOGIN',
        entity: 'SESSION',
        details: { managerName: manager.name, with2FA: !!manager.totpEnabled },
        req,
      });

      const token = signToken({ userId: manager.id, companyId: manager.companyId, role: manager.role as any, email: manager.email || '', name: manager.name });

      res.json({
        manager: {
          id: manager.id,
          companyId: manager.companyId,
          name: manager.name,
          email: manager.email,
          role: manager.role,
          active: manager.active,
          totpEnabled: manager.totpEnabled,
        },
        company: {
          id: company.id,
          name: company.name,
          companyCode: company.companyCode,
          primaryColor: company.primaryColor,
          settings: company.settings,
          licenseTier: company.licenseTier,
        },
        token,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Compliance score endpoint
  app.get("/api/manager/compliance-score/:companyId", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }

      const allVehicles = await db.select().from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.active, true)));
      const totalVehicles = allVehicles.length;

      if (totalVehicles === 0) {
        return res.json({
          score: 100,
          breakdown: { inspections: 100, defects: 100, mot: 100, vor: 100 },
          grade: "A"
        });
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayInspections = await db.select().from(inspections).where(and(eq(inspections.companyId, companyId), gte(inspections.createdAt, todayStart)));
      const inspectedVehicleIds = new Set(todayInspections.map(i => i.vehicleId));
      const inspectionScore = Math.round((inspectedVehicleIds.size / totalVehicles) * 100);

      const allDefects = await db.select().from(defects).where(eq(defects.companyId, companyId));
      const totalDefects = allDefects.length;
      const resolvedDefects = allDefects.filter(d => d.status === 'RESOLVED' || d.status === 'resolved').length;
      const defectScore = totalDefects === 0 ? 100 : Math.round((resolvedDefects / totalDefects) * 100);

      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const motCompliantCount = allVehicles.filter(v => {
        if (!v.motDue) return false;
        const motDate = new Date(v.motDue);
        return motDate > sevenDaysFromNow;
      }).length;
      const motScore = Math.round((motCompliantCount / totalVehicles) * 100);

      const vorCount = allVehicles.filter(v => v.vorStatus === true).length;
      const vorScore = Math.round(((totalVehicles - vorCount) / totalVehicles) * 100);

      const score = Math.round(
        inspectionScore * 0.30 +
        defectScore * 0.25 +
        motScore * 0.25 +
        vorScore * 0.20
      );

      let grade: string;
      if (score >= 90) grade = "A";
      else if (score >= 80) grade = "B";
      else if (score >= 70) grade = "C";
      else if (score >= 60) grade = "D";
      else grade = "F";

      res.json({
        score,
        breakdown: {
          inspections: inspectionScore,
          defects: defectScore,
          mot: motScore,
          vor: vorScore
        },
        grade
      });
    } catch (error) {
      console.error("Failed to calculate compliance score:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Manager dashboard stats
  app.get("/api/manager/on-shift/:companyId", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const results = await db
        .select({
          driverId: timesheets.driverId,
          driverName: users.name,
          depotName: timesheets.depotName,
          arrivalTime: timesheets.arrivalTime,
          latitude: timesheets.arrivalLatitude,
          longitude: timesheets.arrivalLongitude,
        })
        .from(timesheets)
        .innerJoin(users, eq(timesheets.driverId, users.id))
        .where(
          and(
            eq(timesheets.companyId, companyId),
            eq(timesheets.status, "ACTIVE"),
            isNull(timesheets.departureTime)
          )
        );
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch on-shift drivers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/manager/stats/:companyId", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const stats = await storage.getManagerDashboardStats(requestedCompanyId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // All inspections for manager with server-side filtering
  app.get("/api/manager/inspections/:companyId", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { 
        limit = '50', 
        offset = '0',
        status,
        vehicleId,
        driverId,
        startDate,
        endDate
      } = req.query;
      
      const result = await storage.getAllInspections(
        requestedCompanyId,
        {
          limit: Number(limit),
          offset: Number(offset),
          status: status as string | undefined,
          vehicleId: vehicleId ? Number(vehicleId) : undefined,
          driverId: driverId ? Number(driverId) : undefined,
          startDate: startDate as string | undefined,
          endDate: endDate as string | undefined
        }
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get single inspection
  app.get("/api/manager/inspection/:id", async (req, res) => {
    try {
      const inspection = await storage.getInspectionById(Number(req.params.id));
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      if (req.user && inspection.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      res.json(inspection);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Defects
  app.get("/api/manager/defects/:companyId", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const defectList = await storage.getDefectsByCompany(requestedCompanyId);
      res.json(defectList);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/manager/defects", async (req, res) => {
    try {
      const validated = insertDefectSchema.parse(req.body);
      const defect = await storage.createDefect(validated);
      
      // Trigger notification to managers (async, non-blocking)
      if (defect.vehicleId) {
        setImmediate(() => {
          triggerDefectReported({
            companyId: defect.companyId,
            vehicleId: defect.vehicleId!,
            reportedBy: defect.reportedBy,
            description: defect.description,
            severity: defect.severity,
          });
        });
      }
      
      res.status(201).json(defect);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get single defect detail with vehicle info
  app.get("/api/manager/defects/detail/:id", async (req, res) => {
    try {
      const defectId = Number(req.params.id);
      const [defect] = await db.select().from(defects).where(eq(defects.id, defectId));
      if (!defect) return res.status(404).json({ error: "Defect not found" });
      if (req.user && defect.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }

      const vehicle = defect.vehicleId ? await storage.getVehicleById(defect.vehicleId) : null;
      const reporter = await storage.getUser(defect.reportedBy);
      
      // Get all defects for the same vehicle
      let vehicleDefects: any[] = [];
      if (defect.vehicleId) {
        const vDefects = await db.select({
          id: defects.id,
          description: defects.description,
          status: defects.status,
          severity: defects.severity,
          category: defects.category,
          supplier: defects.supplier,
          site: defects.site,
          requiredBy: defects.requiredBy,
          createdAt: defects.createdAt,
          resolvedAt: defects.resolvedAt,
          vehicleVrm: vehicles.vrm,
        }).from(defects)
          .leftJoin(vehicles, eq(defects.vehicleId, vehicles.id))
          .where(eq(defects.vehicleId, defect.vehicleId))
          .orderBy(desc(defects.createdAt));
        const now = new Date();
        vehicleDefects = vDefects.map((r) => {
          const daysOpen = r.resolvedAt
            ? Math.ceil((new Date(r.resolvedAt).getTime() - new Date(r.createdAt).getTime()) / (1000*60*60*24))
            : Math.ceil((now.getTime() - new Date(r.createdAt).getTime()) / (1000*60*60*24));
          return {
            reference: r.id,
            registration: r.vehicleVrm,
            reportedDate: r.createdAt.toLocaleDateString("en-GB"),
            requiredBy: r.requiredBy ? r.requiredBy.toLocaleDateString("en-GB") : "Not Set",
            daysOpen,
            supplier: r.supplier || "",
            site: r.site || "",
            faultDescription: r.description,
            status: r.status,
            severity: r.severity,
          };
        });
      }

      res.json({
        ...defect,
        vehicleVrm: vehicle?.vrm || null,
        vehicleMake: vehicle?.make || null,
        vehicleModel: vehicle?.model || null,
        vehicleVorStatus: vehicle?.vorStatus || false,
        vehicleVorReason: vehicle?.vorReason || null,
        vehicleVorStartDate: vehicle?.vorStartDate || null,
        vehicleFleetNumber: vehicle?.fleetNumber || null,
        reportedByName: reporter?.name || "Unknown",
        reportedByEmail: reporter?.email || "",
        vehicleDefects,
        createdAt: defect.createdAt?.toISOString(),
        updatedAt: defect.updatedAt?.toISOString(),
        resolvedAt: defect.resolvedAt?.toISOString() || null,
      });
    } catch (error) {
      console.error("Get defect detail error:", error);
      res.status(500).json({ error: "Failed to fetch defect detail" });
    }
  });

  // Delete defect
  app.delete("/api/manager/defects/:id", async (req, res) => {
    try {
      const defectId = Number(req.params.id);
      const [defect] = await db.select().from(defects).where(eq(defects.id, defectId));
      if (!defect) return res.status(404).json({ error: "Defect not found" });
      if (req.user && defect.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      await db.delete(defects).where(eq(defects.id, defectId));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete defect error:", error);
      res.status(500).json({ error: "Failed to delete defect" });
    }
  });

  app.patch("/api/manager/defects/:id", async (req, res) => {
    try {
      const defectId = Number(req.params.id);
      const [existingDefect] = await db.select().from(defects).where(eq(defects.id, defectId));
      if (!existingDefect) {
        return res.status(404).json({ error: "Defect not found" });
      }
      if (req.user && existingDefect.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const updated = await storage.updateDefect(defectId, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Defect not found" });
      }
      
      // Audit log: Defect updated
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: updated.companyId,
        userId: req.body.managerId || null,
        action: 'UPDATE',
        entity: 'DEFECT',
        entityId: defectId,
        details: { status: updated.status, changes: req.body },
        req,
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Trailers
  app.get("/api/manager/trailers/:companyId", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const trailerList = await storage.getTrailersByCompany(requestedCompanyId);
      res.json(trailerList);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/manager/trailers", async (req, res) => {
    try {
      const validated = insertTrailerSchema.parse(req.body);
      const trailer = await storage.createTrailer(validated);
      res.status(201).json(trailer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vehicle CRUD for manager
  app.patch("/api/manager/vehicles/:id", async (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
      const oldVehicle = await storage.getVehicleById(vehicleId);
      if (!oldVehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (req.user && oldVehicle.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const updated = await storage.updateVehicle(vehicleId, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      
      // Audit log: Vehicle updated
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: updated.companyId,
        userId: req.body.managerId || null,
        action: 'UPDATE',
        entity: 'VEHICLE',
        entityId: vehicleId,
        details: { vrm: updated.vrm, changes: req.body },
        req,
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/manager/vehicles", async (req, res) => {
    try {
      const sanitizedBody = { ...req.body };
      if (typeof sanitizedBody.vrm === 'string') sanitizedBody.vrm = sanitizeInput(sanitizedBody.vrm);
      if (typeof sanitizedBody.make === 'string') sanitizedBody.make = sanitizeInput(sanitizedBody.make);
      if (typeof sanitizedBody.model === 'string') sanitizedBody.model = sanitizeInput(sanitizedBody.model);
      const validated = insertVehicleSchema.parse(sanitizedBody);
      
      // Check vehicle usage limits before creating
      const usage = await storage.getVehicleUsage(validated.companyId);
      
      if (usage.state === 'over_hard_limit') {
        return res.status(403).json({ 
          error: "Vehicle capacity exceeded — request upgrade to add more vehicles.",
          usage 
        });
      }
      
      const vehicle = await storage.createVehicle(validated);
      
      // Audit log: Vehicle created
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: vehicle.companyId,
        userId: req.body.managerId || null,
        action: 'CREATE',
        entity: 'VEHICLE',
        entityId: vehicle.id,
        details: { vrm: vehicle.vrm, make: vehicle.make, model: vehicle.model },
        req,
      });
      
      // Return with warning if at limit or in grace
      if (usage.state === 'at_limit' || usage.state === 'in_grace') {
        return res.status(201).json({ 
          vehicle, 
          warning: 'grace_active',
          usage 
        });
      }
      
      res.status(201).json({ vehicle });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating vehicle:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Approve manually added vehicle (clear pending review flag)
  app.patch("/api/manager/vehicles/:id/approve", async (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
      const vehicle = await storage.getVehicleById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (req.user && vehicle.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      const [updated] = await db
        .update(vehicles)
        .set({ 
          pendingReview: false,
          reviewNotes: null
        })
        .where(eq(vehicles.id, vehicleId))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      
      // Audit log: Vehicle approved
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: updated.companyId,
        userId: req.body.managerId || null,
        action: 'UPDATE',
        entity: 'VEHICLE',
        entityId: vehicleId,
        details: { vrm: updated.vrm, action: 'APPROVED', previousStatus: 'pending_review' },
        req,
      });
      
      res.json({ message: "Vehicle approved", vehicle: updated });
    } catch (error) {
      console.error("Error approving vehicle:", error);
      res.status(500).json({ error: "Failed to approve vehicle" });
    }
  });

  // VOR Management - Set vehicle as off road
  app.post("/api/manager/vehicles/:id/vor", async (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
      const existingVehicle = await storage.getVehicleById(vehicleId);
      if (!existingVehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (req.user && existingVehicle.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { reason, notes } = req.body;
      
      const updated = await storage.setVehicleVOR(vehicleId, reason, notes);
      if (!updated) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      
      // Audit log: Vehicle set to VOR
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: updated.companyId,
        userId: req.body.managerId || null,
        action: 'UPDATE',
        entity: 'VEHICLE',
        entityId: vehicleId,
        details: { vrm: updated.vrm, action: 'SET_VOR', reason, notes },
        req,
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // VOR Management - Return vehicle to service
  app.post("/api/manager/vehicles/:id/vor/resolve", async (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
      const existingVehicle = await storage.getVehicleById(vehicleId);
      if (!existingVehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (req.user && existingVehicle.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      const updated = await storage.resolveVehicleVOR(vehicleId);
      if (!updated) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      
      // Audit log: Vehicle returned to service
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: updated.companyId,
        userId: req.body.managerId || null,
        action: 'UPDATE',
        entity: 'VEHICLE',
        entityId: vehicleId,
        details: { vrm: updated.vrm, action: 'RESOLVE_VOR' },
        req,
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get VOR vehicles for company
  app.get("/api/manager/vehicles/vor", async (req, res) => {
    try {
      const { companyId } = req.query;
      if (!companyId) {
        return res.status(400).json({ error: "Missing companyId" });
      }
      
      const vorVehicles = await storage.getVORVehicles(Number(companyId));
      res.json(vorVehicles);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Service Interval Management - Update vehicle mileage
  app.post("/api/manager/vehicles/:id/mileage", async (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
      const existingVehicle = await storage.getVehicleById(vehicleId);
      if (!existingVehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (req.user && existingVehicle.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { mileage } = req.body;
      
      if (!mileage || mileage < 0) {
        return res.status(400).json({ error: "Invalid mileage" });
      }
      
      const updated = await storage.updateVehicleMileage(vehicleId, mileage);
      if (!updated) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating mileage:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Service Interval Management - Log service
  app.post("/api/manager/vehicles/:id/service", async (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
      const existingVehicle = await storage.getVehicleById(vehicleId);
      if (!existingVehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (req.user && existingVehicle.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { serviceDate, serviceMileage, serviceType, serviceProvider, cost, workPerformed, performedBy } = req.body;
      
      if (!serviceDate || !serviceMileage || !serviceType) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const service = await storage.logService({
        vehicleId,
        serviceDate: new Date(serviceDate),
        serviceMileage,
        serviceType,
        serviceProvider,
        cost,
        workPerformed,
        performedBy
      });
      
      // Audit log: Service logged
      const { logAudit } = await import("./auditService");
      const vehicle = await storage.getVehicle(vehicleId);
      if (vehicle) {
        await logAudit({
          userId: performedBy,
          companyId: vehicle.companyId,
          action: "CREATE",
          entity: "VEHICLE",
          entityId: vehicleId,
          details: {
            action: "service_logged",
            vrm: vehicle.vrm,
            serviceType,
            serviceMileage
          }
        });
      }
      
      res.json(service);
    } catch (error) {
      console.error("Error logging service:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get service history for vehicle
  app.get("/api/manager/vehicles/:id/service-history", async (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
      const existingVehicle = await storage.getVehicleById(vehicleId);
      if (!existingVehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (req.user && existingVehicle.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const history = await storage.getServiceHistory(vehicleId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching service history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get vehicles due for service
  app.get("/api/manager/vehicles/service-due", async (req, res) => {
    try {
      const { companyId } = req.query;
      if (!companyId) {
        return res.status(400).json({ error: "Missing companyId" });
      }
      
      const dueVehicles = await storage.getServiceDueVehicles(Number(companyId));
      res.json(dueVehicles);
    } catch (error) {
      console.error("Error fetching service due vehicles:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/manager/vehicles/:id", async (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
      const vehicle = await storage.getVehicleById(vehicleId);
      if (vehicle && req.user && vehicle.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      await storage.deleteVehicle(vehicleId);
      
      // Audit log: Vehicle deleted
      if (vehicle) {
        const { logAudit } = await import("./auditService");
        await logAudit({
          companyId: vehicle.companyId,
          userId: req.body.managerId || null,
          action: 'DELETE',
          entity: 'VEHICLE',
          entityId: vehicleId,
          details: { vrm: vehicle.vrm },
          req,
        });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Fuel entries for manager
  app.get("/api/manager/fuel/:companyId", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { days = '30' } = req.query;
      const entries = await storage.getFuelEntriesByCompany(
        requestedCompanyId,
        Number(days)
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Users for manager
  app.get("/api/manager/users/:companyId", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const userList = await storage.getUsersByCompany(requestedCompanyId);
      res.json(userList);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create user
  app.post("/api/manager/users", async (req, res) => {
    try {
      const createUserSchema = z.object({
        companyId: z.number(),
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(['DRIVER', 'MANAGER']),
        pin: z.string().length(4).optional().nullable(),
        managerId: z.number().optional(),
      });
      
      const validated = createUserSchema.parse(req.body);
      
      // Verify manager belongs to this company
      if (validated.managerId) {
        const manager = await storage.getUser(validated.managerId);
        if (!manager || manager.companyId !== validated.companyId || manager.role !== 'MANAGER') {
          return res.status(403).json({ error: "Unauthorized to create users for this company" });
        }
      }
      
      let assignedPin = validated.pin || null;
      if (assignedPin) {
        const { validatePinAvailable } = await import('./pinUtils');
        const pinFree = await validatePinAvailable(validated.companyId, assignedPin);
        if (!pinFree) {
          return res.status(409).json({ error: "This PIN is already in use by another driver in your company" });
        }
      } else {
        const { generateUniquePin } = await import('./pinUtils');
        assignedPin = await generateUniquePin(validated.companyId);
      }

      const user = await storage.createUser({
        companyId: validated.companyId,
        name: validated.name,
        email: validated.email,
        role: validated.role,
        pin: assignedPin,
        active: true,
      });
      
      // Send welcome notification and email to new drivers
      if (validated.role === 'DRIVER' && validated.managerId) {
        setImmediate(async () => {
          triggerNewDriverWelcome({
            companyId: validated.companyId,
            newDriverId: user.id,
            addedByManagerId: validated.managerId!,
          });

          if (user.email && validated.pin) {
            try {
              const { sendWelcomeEmail } = await import("./emailService");
              const company = await storage.getCompanyById(validated.companyId);
              if (company) {
                await sendWelcomeEmail({
                  email: user.email,
                  name: user.name,
                  companyName: company.name,
                  companyCode: company.companyCode,
                  pin: validated.pin,
                });
                console.log(`Welcome email sent to new driver ${user.name} (${user.email})`);
              }
            } catch (emailErr) {
              console.error("Failed to send welcome email:", emailErr);
            }
          }
        });
      }
      
      // Audit log
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: validated.companyId,
        userId: validated.managerId || null,
        action: 'CREATE',
        entity: 'USER',
        entityId: user.id,
        details: { name: user.name, email: user.email, role: user.role },
        req,
      });
      
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Failed to create user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Bulk upload drivers from CSV
  app.post("/api/manager/bulk-upload/drivers", async (req, res) => {
    try {
      const bulkDriverSchema = z.object({
        companyId: z.number(),
        managerId: z.number(),
        drivers: z.array(z.object({
          name: z.string().min(1),
          email: z.string().email(),
          role: z.string().default('DRIVER'),
          pin: z.string().length(4).optional().nullable(),
          phone: z.string().optional().nullable(),
          driverCategory: z.string().optional().nullable(),
        }).passthrough()),
      });

      const validated = bulkDriverSchema.parse(req.body);
      const { companyId, managerId, drivers: driverRows } = validated;

      const existingUsers = await db.select({ email: users.email })
        .from(users)
        .where(eq(users.companyId, companyId));
      const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

      const { generateUniquePin, validatePinAvailable } = await import('./pinUtils');
      const { logAudit } = await import('./auditService');

      const createdDrivers: any[] = [];
      const errors: Array<{ row: number; name: string; reason: string }> = [];
      let skipped = 0;

      for (let i = 0; i < driverRows.length; i++) {
        const row = driverRows[i];
        const rowNum = i + 1;
        try {
          const email = sanitizeInput(row.email.trim().toLowerCase());
          const name = sanitizeInput(row.name.trim());

          if (existingEmails.has(email)) {
            errors.push({ row: rowNum, name, reason: 'Duplicate email — already exists in company' });
            skipped++;
            continue;
          }

          let assignedPin = row.pin || null;
          if (assignedPin) {
            const pinFree = await validatePinAvailable(companyId, assignedPin);
            if (!pinFree) {
              errors.push({ row: rowNum, name, reason: `PIN ${assignedPin} already in use` });
              skipped++;
              continue;
            }
          } else {
            assignedPin = await generateUniquePin(companyId);
          }

          const user = await storage.createUser({
            companyId,
            name,
            email,
            role: row.role || 'DRIVER',
            pin: assignedPin,
            phone: row.phone ? sanitizeInput(row.phone.trim()) : null,
            active: true,
          });

          existingEmails.add(email);
          createdDrivers.push(user);

          await logAudit({
            companyId,
            userId: managerId,
            action: 'CREATE',
            entity: 'USER',
            entityId: user.id,
            details: { name: user.name, email: user.email, role: user.role, source: 'bulk_upload' },
            req,
          });
        } catch (rowError) {
          errors.push({ row: rowNum, name: row.name || 'Unknown', reason: rowError instanceof Error ? rowError.message : 'Unknown error' });
        }
      }

      res.json({
        created: createdDrivers.length,
        skipped,
        errors,
        createdDrivers,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Bulk driver upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Bulk upload vehicles from CSV
  app.post("/api/manager/bulk-upload/vehicles", async (req, res) => {
    try {
      const bulkVehicleSchema = z.object({
        companyId: z.number(),
        managerId: z.number(),
        vehicles: z.array(z.object({
          vrm: z.string().min(1),
          make: z.string().min(1),
          model: z.string().min(1),
          fleetNumber: z.string().optional().nullable(),
          vehicleCategory: z.string().optional().nullable(),
          vehicleType: z.string().optional().nullable(),
          odometer: z.string().optional().nullable(),
          driverCategory: z.string().optional().nullable(),
        })),
      });

      const validated = bulkVehicleSchema.parse(req.body);
      const { companyId, managerId, vehicles: vehicleRows } = validated;

      const usage = await storage.getVehicleUsage(companyId);
      if (usage.state === 'over_hard_limit') {
        return res.status(403).json({
          error: "Vehicle capacity exceeded — request upgrade to add more vehicles.",
          usage,
        });
      }

      const existingVehicles = await storage.getVehiclesByCompany(companyId, 10000, 0);
      const existingVrms = new Set(
        existingVehicles.vehicles.map(v => v.vrm.toUpperCase().replace(/\s/g, ''))
      );

      const { logAudit } = await import('./auditService');

      const createdVehicles: any[] = [];
      const errors: Array<{ row: number; vrm: string; reason: string }> = [];
      let skipped = 0;

      for (let i = 0; i < vehicleRows.length; i++) {
        const row = vehicleRows[i];
        const rowNum = i + 1;
        try {
          const vrm = sanitizeInput(row.vrm.trim().toUpperCase());
          const normalizedVrm = vrm.replace(/\s/g, '');

          if (existingVrms.has(normalizedVrm)) {
            errors.push({ row: rowNum, vrm, reason: 'Duplicate VRM — already exists in company' });
            skipped++;
            continue;
          }

          const vehicle = await storage.createVehicle({
            companyId,
            vrm,
            make: sanitizeInput(row.make.trim()),
            model: sanitizeInput(row.model.trim()),
            fleetNumber: row.fleetNumber ? sanitizeInput(row.fleetNumber.trim()) : null,
            vehicleCategory: row.vehicleCategory || row.vehicleType || 'HGV',
          });

          existingVrms.add(normalizedVrm);
          createdVehicles.push(vehicle);

          await logAudit({
            companyId,
            userId: managerId,
            action: 'CREATE',
            entity: 'VEHICLE',
            entityId: vehicle.id,
            details: { vrm: vehicle.vrm, make: vehicle.make, model: vehicle.model, source: 'bulk_upload' },
            req,
          });
        } catch (rowError) {
          errors.push({ row: rowNum, vrm: row.vrm || 'Unknown', reason: rowError instanceof Error ? rowError.message : 'Unknown error' });
        }
      }

      res.json({
        created: createdVehicles.length,
        skipped,
        errors,
        createdVehicles,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Bulk vehicle upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // CSV template downloads
  app.get("/api/manager/bulk-upload/templates/:type", (req, res) => {
    const { type } = req.params;

    if (type === 'drivers') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="drivers-template.csv"');
      return res.send('name,email,phone,pin\n"John Smith","john@example.com","07700900000","1234"');
    }

    if (type === 'vehicles') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="vehicles-template.csv"');
      return res.send('vrm,make,model,fleet_number,vehicle_category\n"AB12 CDE","Mercedes","Actros","FL001","HGV"');
    }

    res.status(400).json({ error: 'Invalid template type. Use "drivers" or "vehicles".' });
  });

  // Update user
  app.patch("/api/manager/users/:id", async (req, res) => {
    try {
      const userId = Number(req.params.id);
      
      const updateUserSchema = z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        pin: z.string().length(4).optional().nullable(),
        active: z.boolean().optional(),
        managerId: z.number().optional(),
        companyId: z.number().optional(),
      });
      
      const validated = updateUserSchema.parse(req.body);
      
      // Get target user to verify company ownership
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }
      if (req.user && targetUser.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      // Verify manager belongs to same company as target user
      if (validated.managerId) {
        const manager = await storage.getUser(validated.managerId);
        if (!manager || manager.companyId !== targetUser.companyId || manager.role !== 'MANAGER') {
          return res.status(403).json({ error: "Unauthorized to update users in this company" });
        }
      }
      
      if (validated.pin !== undefined && validated.pin !== null) {
        const { validatePinAvailable } = await import('./pinUtils');
        const pinFree = await validatePinAvailable(targetUser.companyId, validated.pin, userId);
        if (!pinFree) {
          return res.status(409).json({ error: "This PIN is already in use by another driver in your company" });
        }
      }

      const updates: { name?: string; email?: string; pin?: string | null; active?: boolean } = {};
      if (validated.name !== undefined) updates.name = validated.name;
      if (validated.email !== undefined) updates.email = validated.email;
      if (validated.pin !== undefined) updates.pin = validated.pin;
      if (validated.active !== undefined) updates.active = validated.active;
      
      const updated = await storage.updateUser(userId, updates);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Audit log
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: updated.companyId,
        userId: validated.managerId || null,
        action: 'UPDATE',
        entity: 'USER',
        entityId: userId,
        details: { name: updated.name, changes: updates },
        req,
      });
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Deactivate user (soft delete)
  app.delete("/api/manager/users/:id", async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { managerId, companyId } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (req.user && user.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      // Verify manager belongs to same company and has permission
      if (managerId) {
        const manager = await storage.getUser(managerId);
        if (!manager || manager.companyId !== user.companyId || manager.role !== 'MANAGER') {
          return res.status(403).json({ error: "Unauthorized to deactivate users in this company" });
        }
        // Prevent self-deactivation
        if (managerId === userId) {
          return res.status(400).json({ error: "Cannot deactivate your own account" });
        }
      }
      
      await storage.updateUser(userId, { active: false });
      
      // Audit log
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: user.companyId,
        userId: managerId || null,
        action: 'DELETE',
        entity: 'USER',
        entityId: userId,
        details: { name: user.name, email: user.email },
        req,
      });
      
      res.status(200).json({ success: true, message: "User deactivated" });
    } catch (error) {
      console.error("Failed to deactivate user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== AUDIT LOG API ROUTES ====================

  // Get audit logs for company
  app.get("/api/manager/audit-logs/:companyId", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { limit = '50', offset = '0', entity, action } = req.query;
      
      const options = {
        limit: Number(limit),
        offset: Number(offset),
        entity: entity as string | undefined,
        action: action as string | undefined,
      };
      
      const [logs, total] = await Promise.all([
        storage.getAuditLogs(companyId, options),
        storage.getAuditLogCount(companyId, { entity: options.entity, action: options.action }),
      ]);
      
      // Fetch user details for each log
      const logsWithUsers = await Promise.all(
        logs.map(async (log) => {
          let userName = 'System';
          if (log.userId) {
            const user = await storage.getUser(log.userId);
            userName = user?.name || 'Unknown';
          }
          return { ...log, userName };
        })
      );
      
      res.json({ logs: logsWithUsers, total, limit: options.limit, offset: options.offset });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Export audit logs as CSV
  app.get("/api/manager/audit-logs/:companyId/export", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { entity, action } = req.query;
      
      const logs = await storage.getAuditLogs(companyId, {
        limit: 10000,
        entity: entity as string | undefined,
        action: action as string | undefined,
      });
      
      // Fetch user details
      const logsWithUsers = await Promise.all(
        logs.map(async (log) => {
          let userName = 'System';
          if (log.userId) {
            const user = await storage.getUser(log.userId);
            userName = user?.name || 'Unknown';
          }
          return { ...log, userName };
        })
      );
      
      // Generate CSV
      const csvHeaders = 'Timestamp,User,Action,Entity,Entity ID,Details,IP Address\n';
      const csvRows = logsWithUsers.map(log => {
        const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
        return `"${log.createdAt.toISOString()}","${log.userName}","${log.action}","${log.entity}","${log.entityId || ''}","${details}","${log.ipAddress || ''}"`;
      }).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-log-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvHeaders + csvRows);
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== 2FA/TOTP API ROUTES ====================

  // Generate TOTP setup (QR code and secret)
  app.post("/api/manager/2fa/setup/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (req.user && user.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      if (user.role !== 'MANAGER') {
        return res.status(403).json({ error: "2FA is only available for managers" });
      }
      
      const { generateTotpSetup } = await import("./totpService");
      const setup = await generateTotpSetup(user.email);
      
      // Store the secret temporarily (user must verify before enabling)
      await storage.updateUser(userId, { totpSecret: setup.secret, totpEnabled: false });
      
      res.json({
        qrCodeDataUrl: setup.qrCodeDataUrl,
        secret: setup.secret // For manual entry fallback
      });
    } catch (error) {
      console.error("Error generating 2FA setup:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Verify and enable 2FA
  app.post("/api/manager/2fa/enable/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Verification token required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.totpSecret) {
        return res.status(400).json({ error: "2FA setup not initiated" });
      }
      if (req.user && user.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      const { verifyTotpToken } = await import("./totpService");
      const isValid = verifyTotpToken(token, user.totpSecret);
      
      if (!isValid) {
        return res.status(400).json({ error: "Invalid verification code" });
      }
      
      await storage.updateUser(userId, { totpEnabled: true });
      
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: user.companyId,
        userId: user.id,
        action: 'UPDATE',
        entity: 'SETTINGS',
        details: { action: '2FA enabled' },
        req
      });
      
      res.json({ success: true, message: "Two-factor authentication enabled" });
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Disable 2FA
  app.post("/api/manager/2fa/disable/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const { token } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (req.user && user.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      // Require valid TOTP token to disable
      if (user.totpEnabled && user.totpSecret) {
        const { verifyTotpToken } = await import("./totpService");
        const isValid = verifyTotpToken(token, user.totpSecret);
        if (!isValid) {
          return res.status(400).json({ error: "Invalid verification code" });
        }
      }
      
      await storage.updateUser(userId, { totpSecret: null, totpEnabled: false });
      
      const { logAudit } = await import("./auditService");
      await logAudit({
        companyId: user.companyId,
        userId: user.id,
        action: 'UPDATE',
        entity: 'SETTINGS',
        details: { action: '2FA disabled' },
        req
      });
      
      res.json({ success: true, message: "Two-factor authentication disabled" });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get 2FA status for user
  app.get("/api/manager/2fa/status/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (req.user && user.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      res.json({
        enabled: user.totpEnabled || false,
        hasSecret: !!user.totpSecret
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== LICENSE API ROUTES ====================

  // Get license info and vehicle usage
  app.get("/api/company/license/:companyId", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const company = await storage.getCompanyById(companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      const usage = await storage.getVehicleUsage(companyId);
      
      res.json({
        tier: company.licenseTier,
        tierDisplay: company.licenseTier === 'starter' ? 'Starter' : company.licenseTier === 'growth' ? 'Growth' : company.licenseTier === 'pro' ? 'Pro' : company.licenseTier === 'scale' ? 'Scale' : company.licenseTier === 'core' ? 'Starter' : company.licenseTier === 'operator' ? 'Scale' : company.licenseTier,
        ...usage
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Request license upgrade
  app.post("/api/company/license/request-upgrade", async (req, res) => {
    try {
      const validated = insertLicenseUpgradeRequestSchema.parse(req.body);
      const request = await storage.createLicenseUpgradeRequest(validated);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== DOCUMENT API ROUTES ====================

  // Get all documents for company (manager)
  app.get("/api/manager/documents/:companyId", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const docs = await storage.getDocumentsByCompany(requestedCompanyId);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create document (manager)
  app.post("/api/manager/documents", async (req, res) => {
    try {
      const validated = insertDocumentSchema.parse(req.body);
      const doc = await storage.createDocument(validated);
      res.status(201).json(doc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update document (manager)
  app.patch("/api/manager/documents/:id", async (req, res) => {
    try {
      const docId = Number(req.params.id);
      const [existingDoc] = await db.select().from(documents).where(eq(documents.id, docId));
      if (!existingDoc) {
        return res.status(404).json({ error: "Document not found" });
      }
      if (req.user && existingDoc.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const updated = await storage.updateDocument(docId, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete document (manager)
  app.delete("/api/manager/documents/:id", async (req, res) => {
    try {
      const docId = Number(req.params.id);
      const [existingDoc] = await db.select().from(documents).where(eq(documents.id, docId));
      if (!existingDoc) {
        return res.status(404).json({ error: "Document not found" });
      }
      if (req.user && existingDoc.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      await storage.deleteDocument(docId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get document acknowledgments (manager)
  app.get("/api/manager/documents/:id/acknowledgments", async (req, res) => {
    try {
      const docId = Number(req.params.id);
      const [existingDoc] = await db.select().from(documents).where(eq(documents.id, docId));
      if (!existingDoc) {
        return res.status(404).json({ error: "Document not found" });
      }
      if (req.user && existingDoc.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const acks = await storage.getDocumentAcknowledgments(docId);
      res.json(acks);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get unread documents for driver
  app.get("/api/documents/unread", async (req, res) => {
    try {
      const { companyId, userId } = req.query;
      if (!companyId || !userId) {
        return res.status(400).json({ error: "Missing companyId or userId" });
      }
      const unreadDocs = await storage.getUnreadDocuments(Number(companyId), Number(userId));
      res.json(unreadDocs);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Acknowledge document (driver)
  app.post("/api/documents/:id/acknowledge", async (req, res) => {
    try {
      const docId = Number(req.params.id);
      const [existingDoc] = await db.select().from(documents).where(eq(documents.id, docId));
      if (!existingDoc) {
        return res.status(404).json({ error: "Document not found" });
      }
      if (req.user && existingDoc.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }
      const ack = await storage.acknowledgeDocument(docId, Number(userId));
      res.status(201).json(ack);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== COMPANY FEATURE SETTINGS ====================

  app.patch("/api/manager/company/:companyId/settings", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { settings } = req.body;
      if (!settings || typeof settings !== "object") {
        return res.status(400).json({ error: "Invalid settings" });
      }
      const company = await storage.getCompanyById(companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      const mergedSettings = { ...(company.settings as Record<string, any>), ...settings };
      const updated = await storage.updateCompany(companyId, { settings: mergedSettings });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update company settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== DRIVER MESSAGES ====================

  // Create a new message from a driver
  app.post("/api/messages", async (req, res) => {
    try {
      const sanitizedMsgBody = { ...req.body };
      if (typeof sanitizedMsgBody.content === 'string') sanitizedMsgBody.content = sanitizeInput(sanitizedMsgBody.content);
      if (typeof sanitizedMsgBody.message === 'string') sanitizedMsgBody.message = sanitizeInput(sanitizedMsgBody.message);
      if (typeof sanitizedMsgBody.subject === 'string') sanitizedMsgBody.subject = sanitizeInput(sanitizedMsgBody.subject);
      const validated = insertMessageSchema.parse(sanitizedMsgBody);
      const sender = await storage.getUser(validated.senderId);
      if (!sender || sender.companyId !== validated.companyId) {
        return res.status(403).json({ error: "Sender does not belong to this company" });
      }
      const message = await storage.createMessage(validated);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get messages for a company
  app.get("/api/manager/messages/:companyId", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      const messagesList = await storage.getMessagesByCompany(companyId, { limit, offset });
      const safe = messagesList.map(msg => ({
        ...msg,
        sender: msg.sender ? { id: msg.sender.id, name: msg.sender.name, role: msg.sender.role } : undefined,
      }));
      res.json(safe);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get unread message count for a company
  app.get("/api/manager/messages/:companyId/unread-count", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const count = await storage.getUnreadMessageCount(companyId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/manager/messages/:id/read", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getMessageById(id);
      if (!existing) {
        return res.status(404).json({ error: "Message not found" });
      }
      if (req.user && existing.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const message = await storage.markMessageRead(id);
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== GOOGLE DRIVE SETTINGS ====================
  
  // Update Google Drive settings for company
  app.patch("/api/manager/company/:companyId/gdrive", async (req, res) => {
    try {
      const { clientId, clientSecret, refreshToken, folderId, disconnect } = req.body;
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      if (disconnect) {
        const updated = await storage.updateCompany(companyId, {
          googleDriveConnected: false,
          driveClientId: null,
          driveClientSecret: null,
          driveRefreshToken: null,
          driveRootFolderId: null,
        });
        return res.json(updated);
      }
      
      if (!clientId || !clientSecret || !refreshToken) {
        return res.status(400).json({ error: "Missing Google credentials" });
      }
      
      // Encrypt all credentials before storing
      const { encrypt } = await import("./encryption");
      
      const updated = await storage.updateCompany(companyId, {
        googleDriveConnected: true,
        driveClientId: encrypt(clientId),
        driveClientSecret: encrypt(clientSecret),
        driveRefreshToken: encrypt(refreshToken),
        driveRootFolderId: folderId || null,
      });
      
      if (!updated) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Test Google Drive connection
  app.post("/api/manager/company/:companyId/gdrive/test", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { clientId, clientSecret, refreshToken } = req.body;
      
      if (!clientId || !clientSecret || !refreshToken) {
        return res.status(400).json({ error: "Missing Google credentials" });
      }
      
      const { googleDriveService } = await import("./googleDriveService");
      const result = await googleDriveService.testConnection(clientId, clientSecret, refreshToken);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== LOGO UPLOAD ====================

  // Get presigned URL for logo upload
  app.post("/api/manager/company/:companyId/logo/upload", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorage = new ObjectStorageService();
      const uploadURL = await objectStorage.getLogoUploadURL(requestedCompanyId);
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting logo upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Save uploaded logo URL to company
  app.patch("/api/manager/company/:companyId/logo", async (req, res) => {
    try {
      const { logoURL } = req.body;
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      
      if (!logoURL) {
        return res.status(400).json({ error: "Missing logoURL" });
      }
      
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorage = new ObjectStorageService();
      const normalizedPath = objectStorage.normalizeLogoPath(logoURL);
      
      const updated = await storage.updateCompany(companyId, {
        logoUrl: normalizedPath,
      });
      
      if (!updated) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error saving logo:", error);
      res.status(500).json({ error: "Failed to save logo" });
    }
  });

  // ==================== DOCUMENT UPLOAD ====================

  // Get presigned URL for document upload
  app.post("/api/manager/documents/upload-url", async (req, res) => {
    try {
      const { companyId, filename } = req.body;
      if (!companyId || !filename) {
        return res.status(400).json({ error: "Missing companyId or filename" });
      }
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorage = new ObjectStorageService();
      const result = await objectStorage.getDocumentUploadURL(Number(companyId), filename);
      res.json(result);
    } catch (error) {
      console.error("Error getting document upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Serve uploaded objects (logos, etc.)
  app.get("/objects/*", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorage = new ObjectStorageService();
      const objectFile = await objectStorage.getObjectFile(req.path);
      objectStorage.downloadObject(objectFile, res);
    } catch (error) {
      if ((error as any).name === "ObjectNotFoundError") {
        return res.status(404).json({ error: "Object not found" });
      }
      console.error("Error serving object:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== SHIFT CHECKS (END-OF-SHIFT) ====================
  
  // Create new shift check
  app.post("/api/shift-checks", async (req, res) => {
    try {
      const { companyId, driverId, vehicleId, timesheetId } = req.body;
      
      if (!companyId || !driverId || !vehicleId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const shiftCheck = await storage.createShiftCheck(
        Number(companyId),
        Number(driverId),
        Number(vehicleId),
        timesheetId ? Number(timesheetId) : null
      );
      
      res.json(shiftCheck);
    } catch (error) {
      console.error("Error creating shift check:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Add check item with photo
  app.post("/api/shift-checks/:id/item", async (req: any, res: Response) => {
    try {
      const shiftCheckId = Number(req.params.id);
      const [existingCheck] = await db.select().from(shiftChecks).where(eq(shiftChecks.id, shiftCheckId));
      if (!existingCheck) {
        return res.status(404).json({ error: "Shift check not found" });
      }
      if (req.user && existingCheck.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { itemId, label, itemType, status, value, notes } = req.body;
      
      let photoUrl: string | undefined;
      
      // Handle photo upload if present
      if (req.files && 'photo' in req.files) {
        const photoFile = Array.isArray(req.files.photo) ? req.files.photo[0] : req.files.photo;
        // TODO: Implement S3 storage upload
        // For now, store a placeholder URL
        photoUrl = `/uploads/shift-checks/${shiftCheckId}/${itemId}-${Date.now()}.jpg`;
      }
      
      const item = await storage.addShiftCheckItem(
        shiftCheckId,
        itemId,
        label,
        itemType,
        status,
        value,
        notes,
        photoUrl
      );
      
      res.json(item);
    } catch (error) {
      console.error("Error adding shift check item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Complete shift check and clock out
  app.post("/api/shift-checks/:id/complete", async (req, res) => {
    try {
      const shiftCheckId = Number(req.params.id);
      const [existingCheck] = await db.select().from(shiftChecks).where(eq(shiftChecks.id, shiftCheckId));
      if (!existingCheck) {
        return res.status(404).json({ error: "Shift check not found" });
      }
      if (req.user && existingCheck.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const { latitude, longitude } = req.body;
      
      const result = await storage.completeShiftCheck(
        shiftCheckId,
        latitude || '0',
        longitude || '0'
      );
      
      res.json({
        success: true,
        message: 'Shift check completed and driver clocked out',
        shiftCheck: result
      });
    } catch (error) {
      console.error("Error completing shift check:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get shift checks for company (manager view)
  app.get("/api/shift-checks/:companyId", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      if (req.user && companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const checks = await storage.getShiftChecksByCompany(companyId);
      res.json(checks);
    } catch (error) {
      console.error("Error fetching shift checks:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get shift checks for driver
  app.get("/api/shift-checks/driver/:driverId", async (req, res) => {
    try {
      const driverId = Number(req.params.driverId);
      const driver = await storage.getUser(driverId);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      if (req.user && driver.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const checks = await storage.getShiftChecksByDriver(driverId);
      res.json(checks);
    } catch (error) {
      console.error("Error fetching driver shift checks:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

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
      const reminder = await storage.createReminder(req.body);
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
      const { completedBy, notes } = req.body;
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
      const { snoozedBy, snoozedUntil, reason } = req.body;
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

  // ===== PDF REPORT GENERATION ROUTES =====
  
  // Generate DVSA Compliance Report
  app.post("/api/reports/dvsa-compliance", async (req, res) => {
    try {
      const { companyId, startDate, endDate } = req.body;
      
      const company = await storage.getCompanyById(companyId);
      const inspections = await storage.getInspectionsByCompany(companyId);
      const { vehicles } = await storage.getVehiclesByCompany(companyId);
      const defects = await storage.getDefectsByCompany(companyId);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Filter by date range
      const filteredInspections = inspections.filter((i: any) => {
        const inspectionDate = new Date(i.createdAt);
        return inspectionDate >= start && inspectionDate <= end;
      });
      
      const filteredDefects = defects.filter((d: any) => {
        const defectDate = new Date(d.createdAt);
        return defectDate >= start && defectDate <= end;
      });
      
      // Prepare data for PDF
      const reportData = {
        companyName: company?.name || 'Unknown Company',
        startDate: start,
        endDate: end,
        totalVehicles: vehicles.length,
        totalInspections: filteredInspections.length,
        totalDefects: filteredDefects.length,
        openDefects: filteredDefects.filter((d: any) => d.status === 'OPEN').length,
        criticalDefects: filteredDefects.filter((d: any) => d.severity === 'CRITICAL').length,
        defectsBySeverity: {
          critical: filteredDefects.filter((d: any) => d.severity === 'CRITICAL').length,
          major: filteredDefects.filter((d: any) => d.severity === 'MAJOR').length,
          minor: filteredDefects.filter((d: any) => d.severity === 'MINOR').length,
        },
        defectsByStatus: {
          open: filteredDefects.filter((d: any) => d.status === 'OPEN').length,
          assigned: filteredDefects.filter((d: any) => d.status === 'ASSIGNED').length,
          inProgress: filteredDefects.filter((d: any) => d.status === 'IN_PROGRESS').length,
          rectified: filteredDefects.filter((d: any) => d.status === 'RECTIFIED').length,
          verified: filteredDefects.filter((d: any) => d.status === 'VERIFIED').length,
          closed: filteredDefects.filter((d: any) => d.status === 'CLOSED').length,
        },
        vehicleSummary: vehicles.map((v: any) => {
          const vehicleInspections = filteredInspections.filter((i: any) => i.vehicleId === v.id);
          const vehicleDefects = filteredDefects.filter((d: any) => d.vehicleId === v.id);
          return {
            vrm: v.vrm,
            make: v.make,
            model: v.model,
            inspections: vehicleInspections.length,
            defects: vehicleDefects.length,
            openDefects: vehicleDefects.filter((d: any) => d.status === 'OPEN').length,
          };
        }),
      };
      
      const { generateDVSAComplianceReport } = await import('./pdfService');
      const pdfStream = generateDVSAComplianceReport(reportData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="DVSA_Compliance_Report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.pdf"`);
      
      pdfStream.pipe(res);
    } catch (error) {
      console.error("Error generating DVSA compliance report:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Generate Fleet Utilization Report
  app.post("/api/reports/fleet-utilization", async (req, res) => {
    try {
      const { companyId, startDate, endDate } = req.body;
      
      const company = await storage.getCompanyById(companyId);
      const { vehicles } = await storage.getVehiclesByCompany(companyId);
      const timesheets = await storage.getTimesheets(companyId);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Filter timesheets by date range
      const filteredTimesheets = timesheets.filter((t: any) => {
        const clockInDate = new Date(t.clockInTime);
        return clockInDate >= start && clockInDate <= end;
      });
      
      const totalHours = filteredTimesheets.reduce((sum: number, t: any) => sum + (t.totalMinutes || 0), 0) / 60;
      
      const reportData = {
        companyName: company?.name || 'Unknown Company',
        startDate: start,
        endDate: end,
        totalVehicles: vehicles.length,
        totalShifts: filteredTimesheets.length,
        totalHours,
        vehicleUtilization: vehicles.map((v: any) => {
          const vehicleTimesheets = filteredTimesheets.filter((t: any) => t.vehicleId === v.id);
          const vehicleHours = vehicleTimesheets.reduce((sum: number, t: any) => sum + (t.totalMinutes || 0), 0) / 60;
          return {
            vrm: v.vrm,
            hours: vehicleHours,
            shifts: vehicleTimesheets.length,
          };
        }),
      };
      
      const { generateFleetUtilizationReport } = await import('./pdfService');
      const pdfStream = generateFleetUtilizationReport(reportData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Fleet_Utilization_Report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.pdf"`);
      
      pdfStream.pipe(res);
    } catch (error) {
      console.error("Error generating fleet utilization report:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Generate Driver Performance Report
  app.post("/api/reports/driver-performance", async (req, res) => {
    try {
      const { companyId, startDate, endDate } = req.body;
      
      const company = await storage.getCompanyById(companyId);
      const users = await storage.getUsersByCompany(companyId);
      const drivers = users.filter((u: any) => u.role === 'DRIVER');
      const inspections = await storage.getInspectionsByCompany(companyId);
      const defects = await storage.getDefectsByCompany(companyId);
      const timesheets = await storage.getTimesheets(companyId);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Filter by date range
      const filteredInspections = inspections.filter((i: any) => {
        const date = new Date(i.createdAt);
        return date >= start && date <= end;
      });
      
      const filteredDefects = defects.filter((d: any) => {
        const date = new Date(d.createdAt);
        return date >= start && date <= end;
      });
      
      const filteredTimesheets = timesheets.filter((t: any) => {
        const date = new Date(t.clockInTime);
        return date >= start && date <= end;
      });
      
      const reportData = {
        companyName: company?.name || 'Unknown Company',
        startDate: start,
        endDate: end,
        driverPerformance: drivers.map((driver: any) => {
          const driverInspections = filteredInspections.filter((i: any) => i.driverId === driver.id);
          const driverDefects = filteredDefects.filter((d: any) => d.reportedBy === driver.id);
          const driverTimesheets = filteredTimesheets.filter((t: any) => t.driverId === driver.id);
          const driverHours = driverTimesheets.reduce((sum: number, t: any) => sum + (t.totalMinutes || 0), 0) / 60;
          
          return {
            name: driver.name || 'Unknown Driver',
            email: driver.email || 'N/A',
            inspections: driverInspections.length,
            defectsReported: driverDefects.length,
            hoursWorked: driverHours,
            shifts: driverTimesheets.length,
          };
        }),
      };
      
      const { generateDriverPerformanceReport } = await import('./pdfService');
      const pdfStream = generateDriverPerformanceReport(reportData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Driver_Performance_Report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.pdf"`);
      
      pdfStream.pipe(res);
    } catch (error) {
      console.error("Error generating driver performance report:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===== GDPR COMPLIANCE ROUTES (protected versions are registered later in the file) =====
  
  // Check user consent
  app.get("/api/gdpr/consent/:userId/:consentType", async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const userId = parseInt(req.params.userId);
      if (req.user.userId !== userId && !['ADMIN', 'TRANSPORT_MANAGER'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const consentType = req.params.consentType;
      
      const { hasUserConsent } = await import('./gdprService');
      const hasConsent = await hasUserConsent(userId, consentType);
      
      res.json({ hasConsent });
    } catch (error) {
      console.error("Error checking consent:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // ==================== GPS TRACKING & LOCATION ======================
  
  // Submit driver location (5-minute ping from mobile app)
  app.post("/api/driver/location", async (req, res) => {
    try {
      const { driverId, companyId, latitude, longitude, speed, heading, accuracy } = req.body;
      
      if (!driverId || !companyId || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      if (req.user) {
        if (Number(companyId) !== req.user.companyId) {
          return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
        }
        if (req.user.role === 'DRIVER' && Number(driverId) !== req.user.userId) {
          return res.status(403).json({ error: 'Forbidden', message: 'Cannot submit location for another driver' });
        }
      }
      
      const location = await storage.createDriverLocation({
        driverId: Number(driverId),
        companyId: Number(companyId),
        latitude: String(latitude),
        longitude: String(longitude),
        speed: Math.round(Number(speed) || 0),
        heading: heading != null ? Math.round(Number(heading)) : undefined,
        accuracy: accuracy != null ? Math.round(Number(accuracy)) : undefined,
        timestamp: new Date()
      });
      
      // Check for stagnation (30 minutes threshold)
      await storage.checkStagnation(Number(driverId), Number(companyId));
      
      // Check geofence entry/exit for timesheet management
      await storage.checkGeofences(Number(driverId), Number(companyId), String(latitude), String(longitude));
      
      res.json(location);
    } catch (error) {
      console.error("Location submission error:", error);
      res.status(500).json({ error: "Failed to submit location" });
    }
  });
  
  // Batch submit driver locations (offline queue processing)
  app.post("/api/driver/location/batch", async (req, res) => {
    try {
      const { locations } = req.body;
      
      if (!locations || !Array.isArray(locations)) {
        return res.status(400).json({ error: "Invalid locations array" });
      }
      
      const results = [];
      
      for (const loc of locations) {
        try {
          const location = await storage.createDriverLocation({
            driverId: Number(loc.driverId),
            companyId: Number(loc.companyId),
            latitude: String(loc.latitude),
            longitude: String(loc.longitude),
            speed: Math.round(Number(loc.speed) || 0),
            heading: loc.heading != null ? Math.round(Number(loc.heading)) : undefined,
            accuracy: loc.accuracy != null ? Math.round(Number(loc.accuracy)) : undefined,
            timestamp: new Date(loc.timestamp)
          });
          results.push({ success: true, location });
        } catch (error) {
          results.push({ success: false, error: String(error) });
        }
      }
      
      res.json({ 
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results 
      });
    } catch (error) {
      console.error("Batch location submission error:", error);
      res.status(500).json({ error: "Failed to process batch locations" });
    }
  });
  
  // Get all driver locations for company (manager dashboard)
  app.get("/api/manager/driver-locations/:companyId", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const locations = await storage.getLatestDriverLocations(requestedCompanyId);
      res.json(locations);
    } catch (error) {
      console.error("Failed to fetch driver locations:", error);
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });
  
  // ==================== GEOFENCING ====================
  
  // Create geofence (depot location)
  app.post("/api/geofences", async (req, res) => {
    try {
      const { companyId, name, latitude, longitude, radiusMeters } = req.body;
      
      if (!companyId || !name || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const geofence = await storage.createGeofence({
        companyId: Number(companyId),
        name,
        latitude: String(latitude),
        longitude: String(longitude),
        radiusMeters: radiusMeters || 250,
        isActive: true
      });
      
      res.json(geofence);
    } catch (error) {
      console.error("Geofence creation error:", error);
      res.status(500).json({ error: "Failed to create geofence" });
    }
  });
  
  // Get all geofences for company
  app.get("/api/geofences/:companyId", async (req, res) => {
    try {
      const requestedCompanyId = Number(req.params.companyId);
      if (req.user && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      const geofences = await storage.getGeofencesByCompany(requestedCompanyId);
      res.json(geofences);
    } catch (error) {
      console.error("Failed to fetch geofences:", error);
      res.status(500).json({ error: "Failed to fetch geofences" });
    }
  });
  
  // Update geofence
  app.patch("/api/geofences/:id", async (req, res) => {
    try {
      const geofence = await storage.updateGeofence(Number(req.params.id), req.body);
      res.json(geofence);
    } catch (error) {
      console.error("Failed to update geofence:", error);
      res.status(500).json({ error: "Failed to update geofence" });
    }
  });
  
  // Delete geofence
  app.delete("/api/geofences/:id", async (req, res) => {
    try {
      await storage.deleteGeofence(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete geofence:", error);
      res.status(500).json({ error: "Failed to delete geofence" });
    }
  });
  
  // ==================== TIMESHEETS ====================
  
  // Get timesheets for a specific driver
  app.get("/api/driver/timesheets/:companyId/:driverId", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const driverId = Number(req.params.driverId);
      const { startDate, endDate } = req.query;
      
      const conditions = [
        eq(timesheets.companyId, companyId),
        eq(timesheets.driverId, driverId),
      ];

      if (startDate) {
        conditions.push(gte(timesheets.arrivalTime, new Date(startDate as string)));
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        conditions.push(sql`${timesheets.arrivalTime} <= ${end}`);
      }
      
      const results = await db.select()
        .from(timesheets)
        .where(and(...conditions))
        .orderBy(desc(timesheets.arrivalTime))
        .limit(200);
      
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch driver timesheets:", error);
      res.status(500).json({ error: "Failed to fetch driver timesheets" });
    }
  });

  // Get pending adjustments for a company (must be before :companyId route)
  app.get("/api/timesheets/pending-adjustments/:companyId", requirePermission('timesheets'), async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const pending = await db
        .select({
          timesheet: timesheets,
          driver: {
            name: users.name,
            email: users.email,
          },
        })
        .from(timesheets)
        .leftJoin(users, eq(timesheets.driverId, users.id))
        .where(
          and(
            eq(timesheets.companyId, companyId),
            eq(timesheets.adjustmentStatus, "PENDING")
          )
        )
        .orderBy(desc(timesheets.updatedAt));

      const result = pending.map((row) => ({
        ...row.timesheet,
        driver: row.driver,
      }));
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch pending adjustments:", error);
      res.status(500).json({ error: "Failed to fetch pending adjustments" });
    }
  });

  // Get timesheets for company
  app.get("/api/timesheets/:companyId", requirePermission('timesheets'), async (req, res) => {
    try {
      const { status, startDate, endDate, driverId } = req.query;
      const timesheets = await storage.getTimesheets(
        Number(req.params.companyId),
        status as string,
        startDate as string,
        endDate as string,
        driverId ? Number(driverId) : undefined
      );
      res.json(timesheets);
    } catch (error) {
      console.error("Failed to fetch timesheets:", error);
      res.status(500).json({ error: "Failed to fetch timesheets" });
    }
  });
  
  // Export timesheets as CSV
  app.post("/api/timesheets/export", requirePermission('timesheets'), async (req, res) => {
    try {
      const { companyId, startDate, endDate, driverId } = req.body;
      
      if (!companyId) {
        return res.status(400).json({ error: "Missing companyId" });
      }
      
      const timesheets = await storage.getTimesheets(
        Number(companyId),
        undefined,
        startDate,
        endDate,
        driverId ? Number(driverId) : undefined
      );
      
      // Generate CSV
      const csv = await storage.generateTimesheetCSV(timesheets);
      
      // Use plain text content type to avoid virus scanner false positives
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="timesheet_export.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("CSV export error:", error);
      res.status(500).json({ error: "Failed to export timesheets" });
    }
  });
  
  // Manual timesheet override (with adjustment approval workflow)
  app.patch("/api/timesheets/:id", requirePermission('timesheets'), async (req, res) => {
    try {
      const { role: _clientRole, userId, requestedBy, adjustmentNote, arrivalTime, departureTime, ...otherUpdates } = req.body;
      const timesheetId = Number(req.params.id);

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const user = await storage.getUser(Number(userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userRole = user.role;

      if (userRole === "OFFICE") {
        return res.status(403).json({ error: "OFFICE users cannot modify timesheets" });
      }

      if (userRole === "TRANSPORT_MANAGER" && (arrivalTime || departureTime)) {
        const existing = await storage.getTimesheetById(timesheetId);
        if (!existing) {
          return res.status(404).json({ error: "Timesheet not found" });
        }

        const timesheet = await storage.updateTimesheet(timesheetId, {
          originalArrivalTime: existing.originalArrivalTime || existing.arrivalTime,
          originalDepartureTime: existing.originalDepartureTime || existing.departureTime,
          proposedArrivalTime: arrivalTime ? new Date(arrivalTime) : null,
          proposedDepartureTime: departureTime ? new Date(departureTime) : null,
          adjustmentStatus: "PENDING",
          adjustmentRequestedBy: requestedBy || null,
          adjustmentNote: adjustmentNote || null,
          ...otherUpdates,
        });
        return res.json(timesheet);
      }

      if (userRole === "ADMIN" && (arrivalTime || departureTime)) {
        const updateData: any = { ...otherUpdates };
        if (arrivalTime) updateData.arrivalTime = new Date(arrivalTime);
        if (departureTime) updateData.departureTime = new Date(departureTime);
        if (updateData.arrivalTime && updateData.departureTime) {
          updateData.totalMinutes = Math.round(
            (new Date(updateData.departureTime).getTime() - new Date(updateData.arrivalTime).getTime()) / 60000
          );
        }
        const timesheet = await storage.updateTimesheet(timesheetId, updateData);
        return res.json(timesheet);
      }

      const timesheet = await storage.updateTimesheet(timesheetId, otherUpdates);
      res.json(timesheet);
    } catch (error) {
      console.error("Failed to update timesheet:", error);
      res.status(500).json({ error: "Failed to update timesheet" });
    }
  });

  // Approve adjustment
  app.post("/api/timesheets/:id/approve-adjustment", requirePermission('timesheets'), async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }
      const approver = await storage.getUser(Number(userId));
      if (!approver || approver.role !== "ADMIN") {
        return res.status(403).json({ error: "Only ADMIN users can approve adjustments" });
      }

      const timesheetId = Number(req.params.id);
      const existing = await storage.getTimesheetById(timesheetId);
      if (!existing) {
        return res.status(404).json({ error: "Timesheet not found" });
      }
      if (existing.adjustmentStatus !== "PENDING") {
        return res.status(400).json({ error: "No pending adjustment to approve" });
      }

      const newArrival = existing.proposedArrivalTime || existing.arrivalTime;
      const newDeparture = existing.proposedDepartureTime || existing.departureTime;
      let totalMinutes = existing.totalMinutes;
      if (newArrival && newDeparture) {
        totalMinutes = Math.round(
          (new Date(newDeparture).getTime() - new Date(newArrival).getTime()) / 60000
        );
      }

      const timesheet = await storage.updateTimesheet(timesheetId, {
        arrivalTime: newArrival,
        departureTime: newDeparture,
        totalMinutes,
        adjustmentStatus: "APPROVED",
        proposedArrivalTime: null,
        proposedDepartureTime: null,
      });
      res.json(timesheet);
    } catch (error) {
      console.error("Failed to approve adjustment:", error);
      res.status(500).json({ error: "Failed to approve adjustment" });
    }
  });

  // Reject adjustment
  app.post("/api/timesheets/:id/reject-adjustment", requirePermission('timesheets'), async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }
      const rejector = await storage.getUser(Number(userId));
      if (!rejector || rejector.role !== "ADMIN") {
        return res.status(403).json({ error: "Only ADMIN users can reject adjustments" });
      }

      const timesheetId = Number(req.params.id);
      const existing = await storage.getTimesheetById(timesheetId);
      if (!existing) {
        return res.status(404).json({ error: "Timesheet not found" });
      }
      if (existing.adjustmentStatus !== "PENDING") {
        return res.status(400).json({ error: "No pending adjustment to reject" });
      }

      const timesheet = await storage.updateTimesheet(timesheetId, {
        adjustmentStatus: "REJECTED",
        proposedArrivalTime: null,
        proposedDepartureTime: null,
      });
      res.json(timesheet);
    } catch (error) {
      console.error("Failed to reject adjustment:", error);
      res.status(500).json({ error: "Failed to reject adjustment" });
    }
  });
  
  // Get active timesheet for driver
  app.get("/api/timesheets/active/:driverId", async (req, res) => {
    try {
      const timesheet = await storage.getActiveTimesheet(Number(req.params.driverId));
      res.json({ timesheet: timesheet || null });
    } catch (error) {
      console.error("Error fetching active timesheet:", error);
      res.status(500).json({ error: "Failed to fetch active timesheet" });
    }
  });
  
  // Clock in
  app.post("/api/timesheets/clock-in", async (req, res) => {
    try {
      const { companyId, driverId, depotId, latitude, longitude, accuracy, manualSelection, lowAccuracy } = req.body;
      
      if (!companyId || !driverId || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existingActive = await db.select().from(timesheets)
        .where(and(
          eq(timesheets.driverId, Number(driverId)),
          eq(timesheets.companyId, Number(companyId)),
          eq(timesheets.status, 'ACTIVE')
        ))
        .limit(1);

      if (existingActive.length > 0) {
        return res.status(409).json({ 
          error: 'Already clocked in',
          activeTimesheetId: existingActive[0].id 
        });
      }
      
      const timesheet = await storage.clockIn(
        Number(companyId),
        Number(driverId),
        depotId ? Number(depotId) : null,
        latitude,
        longitude,
        accuracy ? Math.round(Number(accuracy)) : null,
        manualSelection === true || lowAccuracy === true
      );
      
      res.json(timesheet);
    } catch (error) {
      console.error("Clock in error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to clock in" });
    }
  });
  
  // Clock out
  app.post("/api/timesheets/clock-out", async (req, res) => {
    try {
      const { timesheetId, latitude, longitude, accuracy } = req.body;
      
      if (!timesheetId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const timesheet = await storage.clockOut(
        Number(timesheetId),
        latitude || null,
        longitude || null,
        accuracy ? Math.round(Number(accuracy)) : null
      );
      
      res.json(timesheet);
    } catch (error) {
      console.error("Clock out error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to clock out" });
    }
  });
  
  // Manager clock-out driver
  app.post("/api/manager/clock-in-driver", async (req, res) => {
    try {
      const { driverId, companyId, depotId, depotName, managerId } = req.body;
      
      if (!driverId || !companyId || !managerId) {
        return res.status(400).json({ error: "Missing required fields (driverId, companyId, managerId)" });
      }

      const manager = await storage.getUser(Number(managerId));
      if (!manager || manager.companyId !== Number(companyId)) {
        return res.status(403).json({ error: "Unauthorized: manager does not belong to this company" });
      }
      if (!["ADMIN", "TRANSPORT_MANAGER"].includes(manager.role)) {
        return res.status(403).json({ error: "Unauthorized: only managers and admins can manually clock in drivers" });
      }

      const driver = await storage.getUser(Number(driverId));
      if (!driver || driver.companyId !== Number(companyId)) {
        return res.status(403).json({ error: "Driver does not belong to this company" });
      }

      const existing = await storage.getActiveTimesheet(Number(driverId));
      if (existing) {
        return res.status(409).json({ error: "Driver is already clocked in" });
      }

      const timesheet = await storage.clockIn(
        Number(companyId),
        Number(driverId),
        depotId ? Number(depotId) : null,
        "0",
        "0",
        null,
        true
      );

      const finalDepotName = depotId ? timesheet.depotName : (depotName || "Manual Clock-In");
      const updated = await storage.updateTimesheet(timesheet.id, { depotName: finalDepotName });

      await storage.createAuditLog({
        companyId: Number(companyId),
        userId: Number(managerId),
        action: "MANUAL_CLOCK_IN",
        entity: "timesheet",
        entityId: timesheet.id,
        details: {
          driverId: Number(driverId),
          driverName: driver.name,
          managerName: manager.name,
          depotName: finalDepotName,
          timesheetId: timesheet.id,
        },
      });

      console.log(`[Manager Action] Manual clock-in: Driver ${driver.name} (ID:${driverId}) clocked in by ${manager.name} (ID:${managerId}) at "${finalDepotName}"`);
      
      res.json(updated || timesheet);
    } catch (error) {
      console.error("Manager clock in error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to clock in driver" });
    }
  });

  app.post("/api/manager/clock-out-driver", async (req, res) => {
    try {
      const { driverId, companyId, managerId } = req.body;

      if (!driverId || !companyId) {
        return res.status(400).json({ error: "Missing driverId or companyId" });
      }

      const activeTimesheet = await storage.getActiveTimesheet(Number(driverId));
      if (!activeTimesheet) {
        return res.status(404).json({ error: "No active timesheet found for this driver" });
      }

      if (activeTimesheet.companyId !== Number(companyId)) {
        return res.status(403).json({ error: "Driver does not belong to this company" });
      }

      const timesheet = await storage.clockOut(
        activeTimesheet.id,
        null as any,
        null as any,
        null
      );

      if (managerId) {
        const driver = await storage.getUser(Number(driverId));
        const manager = await storage.getUser(Number(managerId));
        await storage.createAuditLog({
          companyId: Number(companyId),
          userId: Number(managerId),
          action: "MANUAL_CLOCK_OUT",
          entity: "timesheet",
          entityId: activeTimesheet.id,
          details: {
            driverId: Number(driverId),
            driverName: driver?.name,
            managerName: manager?.name,
            totalMinutes: timesheet.totalMinutes,
            timesheetId: activeTimesheet.id,
          },
        });
        console.log(`[Manager Action] Manual clock-out: Driver ${driver?.name} (ID:${driverId}) clocked out by ${manager?.name} (ID:${managerId})`);
      }

      res.json(timesheet);
    } catch (error) {
      console.error("Manager clock out error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to clock out driver" });
    }
  });

  // ==================== PAY RATES & WAGE CALCULATIONS ====================
  
  // Get pay rates for company
  app.get("/api/pay-rates/:companyId", requirePermission('pay-rates'), async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const { initializeDefaultPayRates } = await import('./wageCalculationService');
      const { db } = await import('./db');
      const { payRates } = await import('../shared/schema');
      const { eq, and, isNull } = await import('drizzle-orm');
      
      // Get all pay rates for company
      let rates = await db.select()
        .from(payRates)
        .where(eq(payRates.companyId, companyId));
      
      // If no rates exist, initialize default
      if (rates.length === 0) {
        await initializeDefaultPayRates(companyId);
        rates = await db.select()
          .from(payRates)
          .where(eq(payRates.companyId, companyId));
      }
      
      res.json(rates);
    } catch (error) {
      console.error("Failed to fetch pay rates:", error);
      res.status(500).json({ error: "Failed to fetch pay rates" });
    }
  });
  
  // Create or update pay rate
  app.post("/api/pay-rates", requirePermission('pay-rates'), async (req, res) => {
    try {
      const { db } = await import('./db');
      const { payRates } = await import('../shared/schema');
      
      const [newRate] = await db.insert(payRates).values(req.body).returning();
      res.json(newRate);
    } catch (error) {
      console.error("Failed to create pay rate:", error);
      res.status(500).json({ error: "Failed to create pay rate" });
    }
  });
  
  // Update pay rate
  app.patch("/api/pay-rates/:id", requirePermission('pay-rates'), async (req, res) => {
    try {
      const { db } = await import('./db');
      const { payRates } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const [updated] = await db.update(payRates)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(payRates.id, Number(req.params.id)))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update pay rate:", error);
      res.status(500).json({ error: "Failed to update pay rate" });
    }
  });
  
  // Get bank holidays for company
  app.get("/api/bank-holidays/:companyId", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { bankHolidays } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const holidays = await db.select()
        .from(bankHolidays)
        .where(eq(bankHolidays.companyId, Number(req.params.companyId)));
      
      res.json(holidays);
    } catch (error) {
      console.error("Failed to fetch bank holidays:", error);
      res.status(500).json({ error: "Failed to fetch bank holidays" });
    }
  });
  
  // Add bank holiday
  app.post("/api/bank-holidays", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { bankHolidays } = await import('../shared/schema');
      
      const [newHoliday] = await db.insert(bankHolidays).values(req.body).returning();
      res.json(newHoliday);
    } catch (error) {
      console.error("Failed to add bank holiday:", error);
      res.status(500).json({ error: "Failed to add bank holiday" });
    }
  });
  
  // Initialize UK bank holidays for year
  app.post("/api/bank-holidays/init-uk/:companyId/:year", async (req, res) => {
    try {
      const { addUKBankHolidays } = await import('./wageCalculationService');
      await addUKBankHolidays(Number(req.params.companyId), Number(req.params.year));
      res.json({ success: true, message: "UK bank holidays added" });
    } catch (error) {
      console.error("Failed to initialize bank holidays:", error);
      res.status(500).json({ error: "Failed to initialize bank holidays" });
    }
  });
  
  // Calculate wages for timesheet
  app.post("/api/wages/calculate/:timesheetId", requirePermission('pay-rates'), async (req, res) => {
    try {
      const { calculateWages } = await import('./wageCalculationService');
      const { companyId, driverId, arrivalTime, departureTime } = req.body;
      
      const wages = await calculateWages(
        Number(req.params.timesheetId),
        companyId,
        driverId,
        new Date(arrivalTime),
        new Date(departureTime)
      );
      
      res.json(wages);
    } catch (error) {
      console.error("Failed to calculate wages:", error);
      res.status(500).json({ error: "Failed to calculate wages" });
    }
  });

  // Get all pay rates for a company with driver info
  app.get("/api/pay-rates/:companyId/drivers", requirePermission('pay-rates'), async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const { db } = await import('./db');
      const { payRates } = await import('../shared/payRatesSchema');
      const { users } = await import('../shared/schema');
      const { eq, sql } = await import('drizzle-orm');

      const rates = await db.select({
        id: payRates.id,
        companyId: payRates.companyId,
        driverId: payRates.driverId,
        baseRate: payRates.baseRate,
        nightRate: payRates.nightRate,
        weekendRate: payRates.weekendRate,
        bankHolidayRate: payRates.bankHolidayRate,
        overtimeMultiplier: payRates.overtimeMultiplier,
        nightStartHour: payRates.nightStartHour,
        nightEndHour: payRates.nightEndHour,
        dailyOvertimeThreshold: payRates.dailyOvertimeThreshold,
        weeklyOvertimeThreshold: payRates.weeklyOvertimeThreshold,
        isActive: payRates.isActive,
        effectiveFrom: payRates.effectiveFrom,
        effectiveTo: payRates.effectiveTo,
        createdAt: payRates.createdAt,
        updatedAt: payRates.updatedAt,
        driverName: users.name,
      })
        .from(payRates)
        .leftJoin(users, eq(payRates.driverId, users.id))
        .where(eq(payRates.companyId, companyId));

      res.json(rates);
    } catch (error) {
      console.error("Failed to fetch driver pay rates:", error);
      res.status(500).json({ error: "Failed to fetch driver pay rates" });
    }
  });

  // Create or update a per-driver pay rate
  app.post("/api/pay-rates/driver", requirePermission('pay-rates'), async (req, res) => {
    try {
      const { companyId, driverId, baseRate, nightRate, weekendRate, bankHolidayRate, overtimeMultiplier } = req.body;

      if (!companyId || !driverId) {
        return res.status(400).json({ error: "Missing companyId or driverId" });
      }

      const { db } = await import('./db');
      const { payRates } = await import('../shared/payRatesSchema');
      const { eq, and, isNull } = await import('drizzle-orm');

      // Get company default to copy threshold settings
      const [companyDefault] = await db.select()
        .from(payRates)
        .where(and(
          eq(payRates.companyId, Number(companyId)),
          isNull(payRates.driverId)
        ))
        .limit(1);

      const nightStartHour = companyDefault?.nightStartHour ?? 22;
      const nightEndHour = companyDefault?.nightEndHour ?? 6;
      const dailyOvertimeThreshold = companyDefault?.dailyOvertimeThreshold ?? 480;
      const weeklyOvertimeThreshold = companyDefault?.weeklyOvertimeThreshold ?? 2400;

      // Check if driver rate already exists
      const [existing] = await db.select()
        .from(payRates)
        .where(and(
          eq(payRates.companyId, Number(companyId)),
          eq(payRates.driverId, Number(driverId))
        ))
        .limit(1);

      if (existing) {
        const [updated] = await db.update(payRates)
          .set({
            baseRate: baseRate || existing.baseRate,
            nightRate: nightRate || existing.nightRate,
            weekendRate: weekendRate || existing.weekendRate,
            bankHolidayRate: bankHolidayRate || existing.bankHolidayRate,
            overtimeMultiplier: overtimeMultiplier || existing.overtimeMultiplier,
            nightStartHour,
            nightEndHour,
            dailyOvertimeThreshold,
            weeklyOvertimeThreshold,
            updatedAt: new Date()
          })
          .where(eq(payRates.id, existing.id))
          .returning();
        return res.json(updated);
      }

      const [newRate] = await db.insert(payRates).values({
        companyId: Number(companyId),
        driverId: Number(driverId),
        baseRate: baseRate || "12.00",
        nightRate: nightRate || "15.00",
        weekendRate: weekendRate || "18.00",
        bankHolidayRate: bankHolidayRate || "24.00",
        overtimeMultiplier: overtimeMultiplier || "1.5",
        nightStartHour,
        nightEndHour,
        dailyOvertimeThreshold,
        weeklyOvertimeThreshold,
        isActive: true
      }).returning();

      res.json(newRate);
    } catch (error) {
      console.error("Failed to create/update driver pay rate:", error);
      res.status(500).json({ error: "Failed to create/update driver pay rate" });
    }
  });

  // Delete a driver-specific pay rate
  app.delete("/api/pay-rates/driver/:driverId/:companyId", requirePermission('pay-rates'), async (req, res) => {
    try {
      const driverId = Number(req.params.driverId);
      const companyId = Number(req.params.companyId);

      const { db } = await import('./db');
      const { payRates } = await import('../shared/payRatesSchema');
      const { eq, and } = await import('drizzle-orm');

      const [deleted] = await db.delete(payRates)
        .where(and(
          eq(payRates.companyId, companyId),
          eq(payRates.driverId, driverId)
        ))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "No driver-specific pay rate found" });
      }

      res.json({ success: true, message: "Driver pay rate deleted, company default will apply" });
    } catch (error) {
      console.error("Failed to delete driver pay rate:", error);
      res.status(500).json({ error: "Failed to delete driver pay rate" });
    }
  });

  // Export wages as CSV
  app.post("/api/wages/export-csv", requirePermission('pay-rates'), async (req, res) => {
    try {
      const { companyId, startDate, endDate } = req.body;

      if (!companyId || !startDate || !endDate) {
        return res.status(400).json({ error: "Missing companyId, startDate, or endDate" });
      }

      const { calculateWages } = await import('./wageCalculationService');
      const { db } = await import('./db');
      const { payRates } = await import('../shared/payRatesSchema');
      const { eq, and, isNull } = await import('drizzle-orm');

      const completedTimesheets = await storage.getTimesheets(
        Number(companyId),
        "COMPLETED",
        startDate,
        endDate
      );

      if (completedTimesheets.length === 0) {
        return res.status(404).json({ error: "No completed timesheets found for this date range" });
      }

      // Get company default pay rate for CSV display
      const [companyDefault] = await db.select()
        .from(payRates)
        .where(and(
          eq(payRates.companyId, Number(companyId)),
          isNull(payRates.driverId)
        ))
        .limit(1);

      // Get all driver-specific pay rates
      const driverRates = await db.select()
        .from(payRates)
        .where(eq(payRates.companyId, Number(companyId)));

      const driverRateMap = new Map<number, typeof driverRates[0]>();
      for (const rate of driverRates) {
        if (rate.driverId) {
          driverRateMap.set(rate.driverId, rate);
        }
      }

      const csvHeaders = [
        "Driver Name", "Date", "Day", "Clock In", "Clock Out", "Depot",
        "Total Hours", "Regular Hours", "Night Hours", "Weekend Hours",
        "Bank Holiday Hours", "Overtime Hours",
        "Base Rate (£/hr)", "Night Rate (£/hr)", "Weekend Rate (£/hr)", "Holiday Rate (£/hr)",
        "Regular Pay", "Night Pay", "Weekend Pay", "Holiday Pay", "Overtime Pay", "Total Pay"
      ];

      const csvRows: string[] = [csvHeaders.join(",")];
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      for (const ts of completedTimesheets) {
        if (!ts.departureTime) continue;

        try {
          const wages = await calculateWages(
            ts.id,
            ts.companyId,
            ts.driverId,
            new Date(ts.arrivalTime),
            new Date(ts.departureTime)
          );

          const driverName = ts.driver?.name || `Driver ${ts.driverId}`;
          const arrivalDate = new Date(ts.arrivalTime);
          const departureDate = new Date(ts.departureTime);
          const dayName = days[arrivalDate.getDay()];
          const dateStr = arrivalDate.toLocaleDateString("en-GB");
          const clockIn = arrivalDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
          const clockOut = departureDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
          const depot = ts.depotName || "Unknown";
          const totalMinutes = (departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60);
          const totalHours = (totalMinutes / 60).toFixed(2);
          const regularHours = (wages.regularMinutes / 60).toFixed(2);
          const nightHours = (wages.nightMinutes / 60).toFixed(2);
          const weekendHours = (wages.weekendMinutes / 60).toFixed(2);
          const bankHolidayHours = (wages.bankHolidayMinutes / 60).toFixed(2);
          const overtimeHours = (wages.overtimeMinutes / 60).toFixed(2);

          const rate = driverRateMap.get(ts.driverId) || companyDefault;
          const baseRateVal = rate?.baseRate || "12.00";
          const nightRateVal = rate?.nightRate || "15.00";
          const weekendRateVal = rate?.weekendRate || "18.00";
          const bankHolidayRateVal = rate?.bankHolidayRate || "24.00";

          const escapeCSV = (val: string) => {
            if (val.includes(",") || val.includes('"') || val.includes("\n")) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          };

          const row = [
            escapeCSV(driverName),
            dateStr,
            dayName,
            clockIn,
            clockOut,
            escapeCSV(depot),
            totalHours,
            regularHours,
            nightHours,
            weekendHours,
            bankHolidayHours,
            overtimeHours,
            baseRateVal,
            nightRateVal,
            weekendRateVal,
            bankHolidayRateVal,
            wages.regularPay.toFixed(2),
            wages.nightPay.toFixed(2),
            wages.weekendPay.toFixed(2),
            wages.bankHolidayPay.toFixed(2),
            wages.overtimePay.toFixed(2),
            wages.totalPay.toFixed(2)
          ];

          csvRows.push(row.join(","));
        } catch (calcError) {
          console.error(`Failed to calculate wages for timesheet ${ts.id}:`, calcError);
        }
      }

      const csvContent = csvRows.join("\n");
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="wage_export_${startDate}_to_${endDate}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Wage CSV export error:", error);
      res.status(500).json({ error: "Failed to export wage CSV" });
    }
  });

  // ==================== STAGNATION ALERTS ====================
  
  // Get stagnation alerts for company
  app.get("/api/stagnation-alerts/:companyId", async (req, res) => {
    try {
      const { status } = req.query;
      const alerts = await storage.getStagnationAlerts(
        Number(req.params.companyId),
        status as string
      );
      res.json(alerts);
    } catch (error) {
      console.error("Failed to fetch stagnation alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });
  
  // Acknowledge stagnation alert
  app.patch("/api/stagnation-alerts/:id", async (req, res) => {
    try {
      const { acknowledgedBy, resolutionNotes, status } = req.body;
      
      const alert = await storage.updateStagnationAlert(Number(req.params.id), {
        status,
        acknowledgedBy: acknowledgedBy ? Number(acknowledgedBy) : undefined,
        acknowledgedAt: new Date(),
        resolutionNotes
      });
      
      res.json(alert);
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  });
  
  app.post("/api/stagnation-alerts/:companyId/dismiss-all", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const result = await db.update(stagnationAlerts)
        .set({ status: 'DISMISSED', updatedAt: new Date() })
        .where(
          and(
            eq(stagnationAlerts.companyId, companyId),
            eq(stagnationAlerts.status, 'ACTIVE')
          )
        );
      res.json({ success: true, message: "All active alerts dismissed" });
    } catch (error) {
      console.error("Failed to bulk dismiss alerts:", error);
      res.status(500).json({ error: "Failed to dismiss alerts" });
    }
  });

  // ==================== TITAN COMMAND (NOTIFICATIONS) ====================
  
  // Send broadcast notification to all drivers
  app.post("/api/notifications/broadcast", async (req, res) => {
    try {
      const { companyId, senderId, title, message, priority } = req.body;
      
      if (!companyId || !senderId || !title || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const notification = await storage.createBroadcastNotification({
        companyId: Number(companyId),
        senderId: Number(senderId),
        title,
        message,
        priority: priority || "NORMAL",
        isBroadcast: true
      });
      
      res.json(notification);
    } catch (error) {
      console.error("Broadcast notification error:", error);
      res.status(500).json({ error: "Failed to send broadcast" });
    }
  });
  
  // Send individual notification
  app.post("/api/notifications/individual", async (req, res) => {
    try {
      const { companyId, senderId, recipientId, title, message, priority } = req.body;
      
      if (!companyId || !senderId || !recipientId || !title || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const notification = await storage.createNotification({
        companyId: Number(companyId),
        senderId: Number(senderId),
        recipientId: Number(recipientId),
        title,
        message,
        priority: priority || "NORMAL",
        isBroadcast: false
      });
      
      res.json(notification);
    } catch (error) {
      console.error("Individual notification error:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });
  
  // Get public broadcast announcements by company code (no auth required - for login page)
  app.get("/api/notifications/public/:companyCode", async (req, res) => {
    try {
      const { companyCode } = req.params;
      
      // Get company by code
      const company = await storage.getCompanyByCode(companyCode.toUpperCase());
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      // Get recent broadcast notifications for this company (last 7 days, max 5)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const broadcasts = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.companyId, company.id),
            eq(notifications.isBroadcast, true),
            gte(notifications.createdAt, sevenDaysAgo)
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(20);
      
      const seen = new Set<string>();
      const unique = broadcasts.filter(b => {
        const key = `${b.title}|${b.message}|${new Date(b.createdAt!).toISOString().slice(0, 16)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 5);
      
      res.json(unique);
    } catch (error) {
      console.error("Failed to fetch public notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/sent", async (req, res) => {
    try {
      const { companyId, senderId, limit: limitParam } = req.query;
      
      if (!companyId || !senderId) {
        return res.status(400).json({ error: "Missing companyId or senderId" });
      }
      
      const sentNotifications = await db
        .select({
          id: notifications.id,
          companyId: notifications.companyId,
          senderId: notifications.senderId,
          recipientId: notifications.recipientId,
          isBroadcast: notifications.isBroadcast,
          title: notifications.title,
          message: notifications.message,
          priority: notifications.priority,
          isRead: notifications.isRead,
          readAt: notifications.readAt,
          createdAt: notifications.createdAt,
          recipientName: users.name,
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.recipientId, users.id))
        .where(
          and(
            eq(notifications.companyId, Number(companyId)),
            eq(notifications.senderId, Number(senderId))
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(limitParam ? Number(limitParam) : 50);
      
      res.json(sentNotifications);
    } catch (error) {
      console.error("Failed to fetch sent notifications:", error);
      res.status(500).json({ error: "Failed to fetch sent notifications" });
    }
  });

  // Get notifications for current user (both direct and broadcast)
  app.get("/api/notifications", async (req, res) => {
    try {
      const { companyId, userId, limit } = req.query;
      
      if (!companyId || !userId) {
        return res.status(400).json({ error: "Missing companyId or userId" });
      }
      
      const notifications = await storage.getUserNotifications(
        Number(companyId),
        Number(userId),
        limit ? Number(limit) : 50
      );
      res.json(notifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  
  // Mark all notifications as read
  app.patch("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const { companyId, userId } = req.body;
      
      if (!companyId || !userId) {
        return res.status(400).json({ error: "Missing companyId or userId" });
      }
      
      await storage.markAllNotificationsRead(Number(companyId), Number(userId));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  });
  
  // Get unread notification count
  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      const { companyId, userId } = req.query;
      
      if (!companyId || !userId) {
        return res.status(400).json({ error: "Missing companyId or userId" });
      }
      
      const count = await storage.getUnreadNotificationCount(Number(companyId), Number(userId));
      res.json({ count });
    } catch (error) {
      console.error("Failed to get unread count:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // Mark notification as read (parameterized - must come after specific routes)
  app.patch("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      const notification = await storage.markNotificationRead(Number(req.params.id));
      res.json(notification);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      res.status(500).json({ error: "Failed to update notification" });
    }
  });

  // Get notifications for driver (parameterized - must come after specific routes)
  app.get("/api/notifications/:driverId", async (req, res) => {
    try {
      const notifications = await storage.getDriverNotifications(Number(req.params.driverId));
      res.json(notifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // ==================== REPORT ENDPOINTS ====================
  
  /**
   * Generate Report
   * POST /api/manager/reports/generate
   */
  app.post("/api/manager/reports/generate", async (req, res) => {
    try {
      const { reportType, filters } = req.body;
      
      if (!reportType || !filters || !filters.companyId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { reportGenerators } = await import("./reports");
      
      if (!reportGenerators[reportType as keyof typeof reportGenerators]) {
        return res.status(400).json({ error: "Invalid report type" });
      }

      const generator = reportGenerators[reportType as keyof typeof reportGenerators];
      const reportData = await generator(filters);

      res.json(reportData);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  /**
   * Export Report as CSV
   * POST /api/manager/reports/export/csv
   */
  app.post("/api/manager/reports/export/csv", async (req, res) => {
    try {
      const { reportType, filters } = req.body;
      
      if (!reportType || !filters || !filters.companyId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { reportGenerators } = await import("./reports");
      const { generateCSV } = await import("./reportExport");
      
      if (!reportGenerators[reportType as keyof typeof reportGenerators]) {
        return res.status(400).json({ error: "Invalid report type" });
      }

      const generator = reportGenerators[reportType as keyof typeof reportGenerators];
      const reportData = await generator(filters);
      const csv = generateCSV(reportData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  /**
   * Export Report as PDF
   * POST /api/manager/reports/export/pdf
   */
  app.post("/api/manager/reports/export/pdf", async (req, res) => {
    try {
      const { reportType, filters } = req.body;
      
      if (!reportType || !filters || !filters.companyId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { reportGenerators } = await import("./reports");
      const { generatePDF } = await import("./reportExport");
      
      if (!reportGenerators[reportType as keyof typeof reportGenerators]) {
        return res.status(400).json({ error: "Invalid report type" });
      }

      const generator = reportGenerators[reportType as keyof typeof reportGenerators];
      const reportData = await generator(filters);
      const pdfBuffer = await generatePDF(reportData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      res.status(500).json({ error: "Failed to export PDF" });
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
  
  // ============================================
  // Fleet Hierarchy Management
  // ============================================
  
  // Vehicle Categories
  app.get("/api/manager/hierarchy/categories", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const { getVehicleCategories } = await import("./hierarchyService");
      const categories = await getVehicleCategories(companyId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  
  app.post("/api/manager/hierarchy/categories", async (req, res) => {
    try {
      const { createVehicleCategory } = await import("./hierarchyService");
      const category = await createVehicleCategory(req.body);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });
  
  app.put("/api/manager/hierarchy/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { updateVehicleCategory } = await import("./hierarchyService");
      const category = await updateVehicleCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });
  
  app.delete("/api/manager/hierarchy/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { deleteVehicleCategory } = await import("./hierarchyService");
      await deleteVehicleCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });
  
  // Cost Centres
  app.get("/api/manager/hierarchy/cost-centres", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const { getCostCentres } = await import("./hierarchyService");
      const costCentres = await getCostCentres(companyId);
      res.json(costCentres);
    } catch (error) {
      console.error("Error fetching cost centres:", error);
      res.status(500).json({ error: "Failed to fetch cost centres" });
    }
  });
  
  app.post("/api/manager/hierarchy/cost-centres", async (req, res) => {
    try {
      const { createCostCentre } = await import("./hierarchyService");
      const costCentre = await createCostCentre(req.body);
      res.json(costCentre);
    } catch (error) {
      console.error("Error creating cost centre:", error);
      res.status(500).json({ error: "Failed to create cost centre" });
    }
  });
  
  app.put("/api/manager/hierarchy/cost-centres/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { updateCostCentre } = await import("./hierarchyService");
      const costCentre = await updateCostCentre(id, req.body);
      res.json(costCentre);
    } catch (error) {
      console.error("Error updating cost centre:", error);
      res.status(500).json({ error: "Failed to update cost centre" });
    }
  });
  
  app.delete("/api/manager/hierarchy/cost-centres/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { deleteCostCentre } = await import("./hierarchyService");
      await deleteCostCentre(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting cost centre:", error);
      res.status(500).json({ error: "Failed to delete cost centre" });
    }
  });
  
  // Departments
  app.get("/api/manager/hierarchy/departments", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const { getDepartments } = await import("./hierarchyService");
      const departments = await getDepartments(companyId);
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });
  
  app.post("/api/manager/hierarchy/departments", async (req, res) => {
    try {
      const { createDepartment } = await import("./hierarchyService");
      const department = await createDepartment(req.body);
      res.json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({ error: "Failed to create department" });
    }
  });
  
  app.put("/api/manager/hierarchy/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { updateDepartment } = await import("./hierarchyService");
      const department = await updateDepartment(id, req.body);
      res.json(department);
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({ error: "Failed to update department" });
    }
  });
  
  app.delete("/api/manager/hierarchy/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { deleteDepartment } = await import("./hierarchyService");
      await deleteDepartment(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ error: "Failed to delete department" });
    }
  });
  
  // Assign vehicle hierarchy
  app.put("/api/manager/vehicles/:id/hierarchy", async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const { assignVehicleHierarchy } = await import("./hierarchyService");
      const vehicle = await assignVehicleHierarchy(vehicleId, req.body);
      res.json(vehicle);
    } catch (error) {
      console.error("Error assigning hierarchy:", error);
      res.status(500).json({ error: "Failed to assign hierarchy" });
    }
  });
  
  // Get hierarchy statistics
  app.get("/api/manager/hierarchy/stats", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const { getHierarchyStats } = await import("./hierarchyService");
      const stats = await getHierarchyStats(companyId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching hierarchy stats:", error);
      res.status(500).json({ error: "Failed to fetch hierarchy stats" });
    }
  });
  
  // Fleet Documents Routes
  const fleetDocumentsRoutes = await import("./fleetDocumentsRoutes.js");
  app.use("/api/fleet-documents", fleetDocumentsRoutes.default);
  
  // Dashboard Routes
  const dashboardRoutes = await import("./dashboardRoutes.js");
  app.use("/api/dashboard", dashboardRoutes.default);
  
  // Notification Preferences Routes
  const notificationPreferencesRoutes = await import("./notificationPreferencesRoutes.js");
  app.use("/api/notification-preferences", notificationPreferencesRoutes.default);
  
  // User Roles Routes
  const userRolesRoutes = await import("./userRolesRoutes.js");
  app.use("/api/user-roles", userRolesRoutes.default);

  // Per-user dashboard permissions endpoint (admin only, company-scoped)
  app.put("/api/user-roles/:userId/permissions", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const { permissions: permsBody, requestingUserId } = req.body;
      const companyId = Number(req.query.companyId);
      const { VALID_PERMISSION_KEYS: validKeys } = await import("@shared/schema");

      if (!requestingUserId) {
        return res.status(400).json({ error: "Missing requestingUserId in request body" });
      }

      if (!companyId) {
        return res.status(400).json({ error: "Missing companyId query parameter" });
      }

      const requestingUser = await storage.getUser(Number(requestingUserId));
      if (!requestingUser) {
        return res.status(403).json({ error: "Requesting user not found" });
      }
      if (requestingUser.role !== 'ADMIN') {
        return res.status(403).json({ error: "Only admins can update user permissions" });
      }
      if (requestingUser.companyId !== companyId) {
        return res.status(403).json({ error: "Admin does not belong to the specified company" });
      }

      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ error: "Target user not found" });
      }
      if (targetUser.companyId !== companyId) {
        return res.status(403).json({ error: "Target user does not belong to the same company" });
      }

      if (!Array.isArray(permsBody)) {
        return res.status(400).json({ error: "permissions must be an array" });
      }

      const invalidKeys = permsBody.filter((key: string) => !validKeys.includes(key));
      if (invalidKeys.length > 0) {
        return res.status(400).json({ error: `Invalid permission keys: ${invalidKeys.join(", ")}` });
      }

      const [updated] = await db.update(users)
        .set({ permissions: permsBody })
        .where(and(eq(users.id, userId), eq(users.companyId, companyId)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, user: { id: updated.id, name: updated.name, permissions: updated.permissions } });
    } catch (error) {
      console.error("Update permissions error:", error);
      res.status(500).json({ error: "Failed to update permissions" });
    }
  });

  // Referral Program Routes
  
  // Generate referral code helper
  function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'TITAN-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  
  // GET /api/referral/code - Get or generate referral code for current company
  app.get("/api/referral/code", async (req, res) => {
    try {
      const { companyId } = req.query;
      if (!companyId) {
        return res.status(400).json({ error: "Missing companyId" });
      }
      
      // Check if company already has a referral code
      let referral = await storage.getReferralByCompany(Number(companyId));
      
      if (!referral) {
        // Generate new unique referral code
        let code = generateReferralCode();
        let attempts = 0;
        while (await storage.getReferralByCode(code) && attempts < 10) {
          code = generateReferralCode();
          attempts++;
        }
        
        referral = await storage.createReferral({
          referrerCompanyId: Number(companyId),
          referralCode: code,
          status: 'pending'
        });
      }
      
      res.json({ referralCode: referral.referralCode });
    } catch (error) {
      console.error("Failed to get referral code:", error);
      res.status(500).json({ error: "Failed to get referral code" });
    }
  });
  
  // GET /api/referral/stats - Get referral stats for company
  app.get("/api/referral/stats", async (req, res) => {
    try {
      const { companyId } = req.query;
      if (!companyId) {
        return res.status(400).json({ error: "Missing companyId" });
      }
      
      const stats = await storage.getReferralStats(Number(companyId));
      res.json(stats);
    } catch (error) {
      console.error("Failed to get referral stats:", error);
      res.status(500).json({ error: "Failed to get referral stats" });
    }
  });
  
  // GET /api/referral/list - List all referrals with status
  app.get("/api/referral/list", async (req, res) => {
    try {
      const { companyId } = req.query;
      if (!companyId) {
        return res.status(400).json({ error: "Missing companyId" });
      }
      
      const referrals = await storage.getReferralsByReferrer(Number(companyId));
      
      // Get referred company names
      const referralsWithCompanies = await Promise.all(
        referrals.map(async (r) => {
          let referredCompanyName = null;
          if (r.referredCompanyId) {
            const company = await storage.getCompanyById(r.referredCompanyId);
            referredCompanyName = company?.name || 'Unknown';
          }
          return { ...r, referredCompanyName };
        })
      );
      
      res.json(referralsWithCompanies);
    } catch (error) {
      console.error("Failed to get referral list:", error);
      res.status(500).json({ error: "Failed to get referral list" });
    }
  });
  
  // POST /api/referral/validate/:code - Validate a referral code (for signup)
  app.post("/api/referral/validate/:code", async (req, res) => {
    try {
      const { code } = req.params;
      if (!code) {
        return res.status(400).json({ error: "Missing referral code" });
      }
      
      const referral = await storage.getReferralByCode(code.toUpperCase());
      
      if (!referral) {
        return res.status(404).json({ valid: false, error: "Invalid referral code" });
      }
      
      // Get referrer company name
      const referrerCompany = await storage.getCompanyById(referral.referrerCompanyId);
      
      res.json({ 
        valid: true, 
        referralCode: referral.referralCode,
        referrerCompanyName: referrerCompany?.name || 'Titan Fleet Partner'
      });
    } catch (error) {
      console.error("Failed to validate referral code:", error);
      res.status(500).json({ error: "Failed to validate referral code" });
    }
  });
  
  // POST /api/referral/apply - Apply referral code when company signs up
  app.post("/api/referral/apply", async (req, res) => {
    try {
      const { referralCode, referredCompanyId } = req.body;
      if (!referralCode || !referredCompanyId) {
        return res.status(400).json({ error: "Missing referralCode or referredCompanyId" });
      }
      
      const referral = await storage.getReferralByCode(referralCode.toUpperCase());
      
      if (!referral) {
        return res.status(404).json({ error: "Invalid referral code" });
      }
      
      // Update referral with referred company
      const updatedReferral = await storage.updateReferral(referral.id, {
        referredCompanyId: Number(referredCompanyId),
        status: 'signed_up',
        signedUpAt: new Date()
      });
      
      res.json({ 
        success: true, 
        message: "Referral code applied successfully",
        referral: updatedReferral
      });
    } catch (error) {
      console.error("Failed to apply referral code:", error);
      res.status(500).json({ error: "Failed to apply referral code" });
    }
  });
  
  // ==================== DELIVERY (POD) ROUTES ====================

  app.post("/api/deliveries", async (req, res) => {
    try {
      const body = { ...req.body };
      if (typeof body.completedAt === "string") {
        body.completedAt = new Date(body.completedAt);
      }
      if (typeof body.arrivedAt === "string") {
        body.arrivedAt = new Date(body.arrivedAt);
      }
      if (typeof body.departedAt === "string") {
        body.departedAt = new Date(body.departedAt);
      }
      if (!body.completedAt) {
        body.completedAt = new Date();
      }
      let validated;
      try {
        validated = insertDeliverySchema.parse(body);
      } catch (parseErr: any) {
        console.error("Delivery validation failed:", JSON.stringify(parseErr.errors || parseErr.message, null, 2));
        return res.status(400).json({ error: "Validation failed", details: parseErr.errors || parseErr.message });
      }
      const delivery = await storage.createDelivery(validated);
      try {
        const { triggerDeliveryCompleted } = await import('./notificationTriggers');
        await triggerDeliveryCompleted({
          companyId: delivery.companyId,
          driverId: delivery.driverId,
          vehicleId: delivery.vehicleId,
          customerName: delivery.customerName,
          deliveryId: delivery.id,
          referenceNumber: delivery.referenceNumber || undefined,
        });
      } catch (notifErr) {
        console.error('Failed to send delivery notification:', notifErr);
      }
      res.status(201).json(delivery);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Failed to create delivery:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/deliveries/driver", async (req, res) => {
    try {
      const { companyId, driverId, limit = '20', offset = '0' } = req.query;
      if (!companyId || !driverId) {
        return res.status(400).json({ error: "Missing companyId or driverId" });
      }
      const result = await storage.getDeliveriesByDriver(
        Number(companyId),
        Number(driverId),
        Number(limit),
        Number(offset)
      );
      res.json(result);
    } catch (error) {
      console.error("Failed to get driver deliveries:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/deliveries/:id/pdf", async (req, res) => {
    try {
      const delivery = await storage.getDeliveryById(Number(req.params.id));
      if (!delivery) {
        return res.status(404).json({ error: "Delivery not found" });
      }
      if (req.user && delivery.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }

      const company = await storage.getCompanyById(delivery.companyId);
      const driver = await storage.getUser(delivery.driverId);
      let vehicleVrm: string | undefined;
      if (delivery.vehicleId) {
        const vehicle = await storage.getVehicleById(delivery.vehicleId);
        vehicleVrm = vehicle?.vrm;
      }

      const { generatePODPdf } = await import("./podPdfService");

      const pdfData = {
        id: delivery.id,
        companyName: company?.name || "Unknown Company",
        driverName: driver?.name || "Unknown Driver",
        vehicleVrm,
        customerName: delivery.customerName,
        deliveryAddress: delivery.deliveryAddress || undefined,
        referenceNumber: delivery.referenceNumber || undefined,
        deliveryNotes: delivery.deliveryNotes || undefined,
        gpsLatitude: delivery.gpsLatitude,
        gpsLongitude: delivery.gpsLongitude,
        gpsAccuracy: delivery.gpsAccuracy || undefined,
        arrivedAt: delivery.arrivedAt ? delivery.arrivedAt.toISOString() : null,
        departedAt: delivery.departedAt ? delivery.departedAt.toISOString() : null,
        completedAt: delivery.completedAt.toISOString(),
        status: delivery.status,
        photoCount: Array.isArray(delivery.photoUrls) ? (delivery.photoUrls as string[]).length : 0,
        hasSignature: !!delivery.signatureUrl,
      };

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="POD_${delivery.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date(delivery.completedAt).toISOString().split('T')[0]}.pdf"`);

      const pdfStream = generatePODPdf(pdfData);
      pdfStream.pipe(res);
    } catch (error) {
      console.error("POD PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  app.get("/api/deliveries/:id", async (req, res) => {
    try {
      const delivery = await storage.getDeliveryById(Number(req.params.id));
      if (!delivery) {
        return res.status(404).json({ error: "Delivery not found" });
      }
      if (req.user && delivery.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this company' });
      }
      res.json(delivery);
    } catch (error) {
      console.error("Failed to get delivery:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/deliveries/upload-url", async (req, res) => {
    try {
      const { companyId, filename, contentType, type } = req.body;
      if (!companyId || !filename) {
        return res.status(400).json({ error: "Missing companyId or filename" });
      }
      const prefix = type === "signature" ? "sig" : "photo";
      const result = await objectStorageService.getDocumentUploadURL(
        Number(companyId),
        `deliveries/company-${companyId}/${prefix}-${Date.now()}-${filename}`
      );
      res.json({
        uploadURL: result.uploadUrl,
        objectPath: result.storagePath,
      });
    } catch (error) {
      console.error("Failed to get delivery upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/api/manager/deliveries/:companyId/stats", async (req, res) => {
    try {
      const stats = await storage.getDeliveryStats(Number(req.params.companyId));
      res.json(stats);
    } catch (error) {
      console.error("Failed to get delivery stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/manager/deliveries/:companyId/export/csv", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const { startDate, endDate, driverId, vehicleId, status, search } = req.query;
      const filters: any = {};
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      if (driverId) filters.driverId = Number(driverId);
      if (vehicleId) filters.vehicleId = Number(vehicleId);
      if (status) filters.status = status as string;
      if (search) filters.search = search as string;

      const { deliveries: deliveryList } = await storage.getDeliveriesByCompany(companyId, filters, 10000, 0);

      const csvHeader = "Date,Time,Driver,Vehicle,Customer,Address,Reference,GPS Lat,GPS Lng,Arrived,Departed,On-Site Duration,Notes,Status";
      const csvRows = deliveryList.map((d: any) => {
        const completedAt = new Date(d.completedAt);
        const date = completedAt.toISOString().split('T')[0];
        const time = completedAt.toTimeString().split(' ')[0];
        const escape = (val: any) => {
          const str = String(val || '').replace(/"/g, '""');
          return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
        };
        const arrivedStr = d.arrivedAt ? new Date(d.arrivedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
        const departedStr = d.departedAt ? new Date(d.departedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
        let onSiteDuration = '';
        if (d.arrivedAt && d.departedAt) {
          const diffSec = Math.floor((new Date(d.departedAt).getTime() - new Date(d.arrivedAt).getTime()) / 1000);
          const h = Math.floor(diffSec / 3600);
          const m = Math.floor((diffSec % 3600) / 60);
          onSiteDuration = h > 0 ? `${h}h ${m}m` : `${m} mins`;
        }
        return [
          date,
          time,
          escape(d.driverName || ''),
          escape(d.vehicleId || ''),
          escape(d.customerName),
          escape(d.deliveryAddress),
          escape(d.referenceNumber),
          d.gpsLatitude,
          d.gpsLongitude,
          arrivedStr,
          departedStr,
          onSiteDuration,
          escape(d.deliveryNotes),
          d.status,
        ].join(',');
      });

      const csv = [csvHeader, ...csvRows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="deliveries-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Failed to export deliveries CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  app.get("/api/manager/deliveries/:companyId", async (req, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const { startDate, endDate, driverId, vehicleId, status, search, limit = '50', offset = '0' } = req.query;
      const filters: any = {};
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      if (driverId) filters.driverId = Number(driverId);
      if (vehicleId) filters.vehicleId = Number(vehicleId);
      if (status) filters.status = status as string;
      if (search) filters.search = search as string;

      const result = await storage.getDeliveriesByCompany(companyId, filters, Number(limit), Number(offset));
      res.json(result);
    } catch (error) {
      console.error("Failed to get company deliveries:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/manager/deliveries/:id/status", async (req, res) => {
    try {
      const { status, invoicedAt } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Missing status" });
      }
      const updated = await storage.updateDeliveryStatus(
        Number(req.params.id),
        status,
        invoicedAt ? new Date(invoicedAt) : undefined
      );
      res.json(updated);
    } catch (error) {
      console.error("Failed to update delivery status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/manager/deliveries/bulk-status", async (req, res) => {
    try {
      const { ids, status } = req.body;
      if (!ids || !Array.isArray(ids) || !status) {
        return res.status(400).json({ error: "Missing ids array or status" });
      }
      const count = await storage.bulkUpdateDeliveryStatus(ids, status);
      res.json({ updated: count });
    } catch (error) {
      console.error("Failed to bulk update delivery status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/manager/deliveries/:id", async (req, res) => {
    try {
      await storage.deleteDelivery(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete delivery:", error);
      res.status(500).json({ error: "Internal server error" });
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
      const { companyId, licenceNumber, trafficArea, licenceType } = req.body;
      if (!companyId || !licenceNumber || !trafficArea || !licenceType) {
        return res.status(400).json({ error: "Missing required fields: companyId, licenceNumber, trafficArea, licenceType" });
      }
      const values = { ...req.body };
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
      const { companyId, ...updateData } = req.body;
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
      const { vehicleId } = req.body;
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
      const { driverId, companyId, numberPlate, startTime, notes } = req.body;
      if (!driverId || !companyId || !numberPlate) {
        return res.status(400).json({ error: "Missing required fields" });
      }
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

  return httpServer;
}
