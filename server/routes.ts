import type { Express, Request, Response } from "express";
import type { UploadedFile } from "express-fileupload";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, gte, desc, isNull, sql, or } from "drizzle-orm";
import { insertVehicleSchema, insertInspectionSchema, insertFuelEntrySchema, insertDefectSchema, insertTrailerSchema, insertLicenseUpgradeRequestSchema, vehicles, inspections, defects, notifications, timesheets, users, fuelEntries, documents } from "@shared/schema";
import { z } from "zod";
import { dvsaService } from "./dvsa";
import { generateInspectionPDF, getInspectionFilename } from "./pdfService";
import { healthCheck, livenessProbe, readinessProbe } from "./healthCheck";
import { getPerformanceStats, getSlowQueries } from "./performanceMonitoring";
import { runNotificationChecks, getSchedulerStatus } from "./scheduler";
import { registerFuelIntelligenceRoutes } from "./fuelIntelligenceRoutes";
import { registerVehicleManagementRoutes } from "./vehicleManagementRoutes";
import { registerApiHealthRoutes } from "./apiHealthRoutes";
import { registerComplianceRoutes } from "./complianceRoutes";
import { registerOperationsRoutes } from "./operationsRoutes";
import { registerFinancialRoutes } from "./financialRoutes";
import { registerSettingsRoutes } from "./settingsRoutes";
import { registerCoreRoutes } from "./coreRoutes";
import driverRoutes from "./driverRoutes";
import authRoutes from "./authRoutes";
import { ObjectStorageService } from "./objectStorage";
import { triggerDefectReported, triggerInspectionFailed, triggerNewDriverWelcome, checkMOTExpiryWarnings } from "./notificationTriggers";
import { triageDefect } from "./aiTriageService";
import { getMaintenanceAlerts, runPredictiveMaintenance } from "./predictiveMaintenanceService";
import { maintenanceAlerts } from "@shared/schema";
import { signToken, setAuthCookie, clearAuthCookie, requireAuth, requireCompany, requireRole } from "./jwtAuth";
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
    '/api/logout',
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
      const checkoutSchema = z.object({ priceId: z.string(), companyName: z.string().optional(), companyEmail: z.string().optional(), referralCode: z.string().optional() });
      const validation = checkoutSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      const { priceId, companyName, companyEmail, referralCode } = validation.data;
      
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
      const portalSchema = z.object({ customerId: z.string() });
      const validation = portalSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      const { customerId } = validation.data;
      
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
  registerComplianceRoutes(app);
  registerOperationsRoutes(app);
  registerFinancialRoutes(app);
  registerSettingsRoutes(app);
  registerCoreRoutes(app);
  
  // Driver management routes
  app.use("/api/drivers", driverRoutes);
  
  // Feedback endpoint
  app.post("/api/feedback", async (req, res) => {
    try {
      const feedbackSchema = z.object({ type: z.string(), message: z.string(), page: z.string().optional(), userId: z.number().optional() });
      const validation = feedbackSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { type, page } = validation.data;
      const message = sanitizeInput(validation.data.message);
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
      const photoUrlSchema = z.object({ companyId: z.number(), filename: z.string(), contentType: z.string().optional() });
      const validation = photoUrlSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { companyId, filename, contentType } = validation.data;
      
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
      const defectInputSchema = z.object({ companyId: z.number(), vehicleId: z.number(), reportedBy: z.number(), description: z.string().min(1), hasPhoto: z.boolean().optional(), severity: z.string().optional() });
      const validation = defectInputSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { companyId, vehicleId, reportedBy, severity } = validation.data;
      const description = sanitizeInput(validation.data.description);
      
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

      setAuthCookie(res, token);

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

      setAuthCookie(res, token);

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

  app.post("/api/logout", (_req, res) => {
    clearAuthCookie(res);
    res.json({ success: true });
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
      const validation = insertDefectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const defect = await storage.createDefect(validation.data);
      
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
      const patchValidation = insertDefectSchema.partial().safeParse(req.body);
      if (!patchValidation.success) {
        return res.status(400).json({ error: "Invalid input", issues: patchValidation.error.issues });
      }
      const updated = await storage.updateDefect(defectId, patchValidation.data);
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
      const vorSchema = z.object({ reason: z.string().min(1), notes: z.string().optional(), managerId: z.number().optional() });
      const validation = vorSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { reason, notes } = validation.data;
      
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
      const serviceSchema = z.object({ serviceDate: z.string(), serviceMileage: z.number(), serviceType: z.string(), serviceProvider: z.string().optional(), cost: z.number().optional(), workPerformed: z.string().optional(), performedBy: z.number().optional() });
      const validation = serviceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { serviceDate, serviceMileage, serviceType, serviceProvider, cost, workPerformed, performedBy } = validation.data;
      
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
      const referralApplySchema = z.object({ referralCode: z.string(), referredCompanyId: z.number() });
      const validation = referralApplySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { referralCode, referredCompanyId } = validation.data;
      
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
  

  return httpServer;
}
