import type { Express, Request, Response } from "express";
import type { UploadedFile } from "express-fileupload";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertInspectionSchema, insertFuelEntrySchema, insertDefectSchema, insertTrailerSchema, insertDocumentSchema, insertLicenseUpgradeRequestSchema } from "@shared/schema";
import { z } from "zod";
import { dvsaService } from "./dvsa";
import { generateInspectionPDF, getInspectionFilename } from "./pdfService";
import { healthCheck, livenessProbe, readinessProbe } from "./healthCheck";
import { getPerformanceStats, getSlowQueries } from "./performanceMonitoring";
import { runNotificationChecks, getSchedulerStatus } from "./scheduler";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoints
  app.get("/health", healthCheck);
  app.get("/health/live", livenessProbe);
  app.get("/health/ready", readinessProbe);
  
  // Performance monitoring endpoints
  app.get("/api/performance/stats", (req, res) => {
    res.json(getPerformanceStats());
  });
  
  app.get("/api/performance/slow-queries", (req, res) => {
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
  
  // Notification scheduler endpoints
  app.get("/api/scheduler/status", (req, res) => {
    res.json(getSchedulerStatus());
  });
  
  app.post("/api/scheduler/run", async (req, res) => {
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
  
  // Cron endpoint (for external cron services like GitHub Actions)
  app.get("/api/cron/run-notifications", async (req, res) => {
    try {
      // Optional: Add authentication here for security
      // const authHeader = req.headers.authorization;
      // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      //   return res.status(401).json({ error: "Unauthorized" });
      // }
      
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

  // Get vehicle by ID
  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicleById(Number(req.params.id));
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create inspection
  app.post("/api/inspections", async (req, res) => {
    try {
      const validated = insertInspectionSchema.parse(req.body);
      const inspection = await storage.createInspection(validated);
      
      // Track vehicle usage
      await storage.trackVehicleUsage(
        inspection.companyId,
        inspection.driverId,
        inspection.vehicleId
      );
      
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
              
              const pdfStream = generateInspectionPDF(pdfData);
              
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
      const inspectionList = await storage.getInspectionsByCompany(Number(req.params.companyId));
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
      const { companyId, vehicleId, reportedBy, description, hasPhoto } = req.body;
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
      });
      
      res.status(201).json(defect);
    } catch (error) {
      console.error("Failed to create defect:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate PDF for inspection
  app.get("/api/inspections/:id/pdf", async (req, res) => {
    try {
      const inspection = await storage.getInspectionById(Number(req.params.id));
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
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

      const pdfStream = generateInspectionPDF(pdfData);
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

  // ==================== MANAGER API ROUTES ====================

  // Manager login
  app.post("/api/manager/login", async (req, res) => {
    try {
      const { companyCode, pin, totpToken } = req.body;
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

      res.json({ manager, company });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Manager dashboard stats
  app.get("/api/manager/stats/:companyId", async (req, res) => {
    try {
      const stats = await storage.getManagerDashboardStats(Number(req.params.companyId));
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // All inspections for manager
  app.get("/api/manager/inspections/:companyId", async (req, res) => {
    try {
      const { limit = '50', offset = '0' } = req.query;
      const inspectionList = await storage.getAllInspections(
        Number(req.params.companyId),
        Number(limit),
        Number(offset)
      );
      res.json(inspectionList);
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
      res.json(inspection);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Defects
  app.get("/api/manager/defects/:companyId", async (req, res) => {
    try {
      const defectList = await storage.getDefectsByCompany(Number(req.params.companyId));
      res.json(defectList);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/manager/defects", async (req, res) => {
    try {
      const validated = insertDefectSchema.parse(req.body);
      const defect = await storage.createDefect(validated);
      res.status(201).json(defect);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/manager/defects/:id", async (req, res) => {
    try {
      const defectId = Number(req.params.id);
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
      const trailerList = await storage.getTrailersByCompany(Number(req.params.companyId));
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
      const validated = insertVehicleSchema.parse(req.body);
      
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
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // VOR Management - Set vehicle as off road
  app.post("/api/manager/vehicles/:id/vor", async (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
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
      const { days = '30' } = req.query;
      const entries = await storage.getFuelEntriesByCompany(
        Number(req.params.companyId),
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
      const userList = await storage.getUsersByCompany(Number(req.params.companyId));
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
      
      const user = await storage.createUser({
        companyId: validated.companyId,
        name: validated.name,
        email: validated.email,
        role: validated.role,
        pin: validated.pin || null,
        active: true,
      });
      
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
      
      // Verify manager belongs to same company as target user
      if (validated.managerId) {
        const manager = await storage.getUser(validated.managerId);
        if (!manager || manager.companyId !== targetUser.companyId || manager.role !== 'MANAGER') {
          return res.status(403).json({ error: "Unauthorized to update users in this company" });
        }
      }
      
      // Build safe updates object (only allowed fields)
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
      const company = await storage.getCompanyById(companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      const usage = await storage.getVehicleUsage(companyId);
      
      res.json({
        tier: company.licenseTier,
        tierDisplay: company.licenseTier === 'core' ? 'Core' : company.licenseTier === 'pro' ? 'Pro' : 'Operator',
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
      const docs = await storage.getDocumentsByCompany(Number(req.params.companyId));
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
      const updated = await storage.updateDocument(Number(req.params.id), req.body);
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
      await storage.deleteDocument(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get document acknowledgments (manager)
  app.get("/api/manager/documents/:id/acknowledgments", async (req, res) => {
    try {
      const acks = await storage.getDocumentAcknowledgments(Number(req.params.id));
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
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }
      const ack = await storage.acknowledgeDocument(Number(req.params.id), Number(userId));
      res.status(201).json(ack);
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
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorage = new ObjectStorageService();
      const uploadURL = await objectStorage.getLogoUploadURL(Number(req.params.companyId));
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
      
      if (!companyId || !driverId || !vehicleId || !timesheetId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const shiftCheck = await storage.createShiftCheck(
        Number(companyId),
        Number(driverId),
        Number(vehicleId),
        Number(timesheetId)
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

  // ===== GDPR COMPLIANCE ROUTES =====
  
  // Export user data (GDPR Right to Data Portability)
  app.get("/api/gdpr/export/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const { exportUserData, generateGDPRDataExport } = await import('./gdprService');
      const userData = await exportUserData(userId);
      const jsonExport = generateGDPRDataExport(userData);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user_data_export_${userId}_${new Date().toISOString().split('T')[0]}.json"`);
      
      res.send(jsonExport);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Anonymize user (GDPR Right to be Forgotten)
  app.post("/api/gdpr/anonymize/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const { anonymizeUser } = await import('./gdprService');
      await anonymizeUser(userId);
      
      res.json({ success: true, message: 'User anonymized successfully' });
    } catch (error) {
      console.error("Error anonymizing user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Record user consent
  app.post("/api/gdpr/consent", async (req, res) => {
    try {
      const { userId, consentType, granted } = req.body;
      const ipAddress = req.ip || 'unknown';
      
      const { recordUserConsent } = await import('./gdprService');
      await recordUserConsent(userId, consentType, granted, ipAddress);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording consent:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Check user consent
  app.get("/api/gdpr/consent/:userId/:consentType", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
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
      
      const location = await storage.createDriverLocation({
        driverId: Number(driverId),
        companyId: Number(companyId),
        latitude: String(latitude),
        longitude: String(longitude),
        speed: speed || 0,
        heading,
        accuracy,
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
            speed: loc.speed || 0,
            heading: loc.heading,
            accuracy: loc.accuracy,
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
      const locations = await storage.getLatestDriverLocations(Number(req.params.companyId));
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
      const geofences = await storage.getGeofencesByCompany(Number(req.params.companyId));
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
  
  // ==================== TIMESHEETS ====================
  
  // Get timesheets for company
  app.get("/api/timesheets/:companyId", async (req, res) => {
    try {
      const { status, startDate, endDate } = req.query;
      const timesheets = await storage.getTimesheets(
        Number(req.params.companyId),
        status as string,
        startDate as string,
        endDate as string
      );
      res.json(timesheets);
    } catch (error) {
      console.error("Failed to fetch timesheets:", error);
      res.status(500).json({ error: "Failed to fetch timesheets" });
    }
  });
  
  // Export timesheets as CSV
  app.post("/api/timesheets/export", async (req, res) => {
    try {
      const { companyId, startDate, endDate } = req.body;
      
      if (!companyId) {
        return res.status(400).json({ error: "Missing companyId" });
      }
      
      const timesheets = await storage.getTimesheets(
        Number(companyId),
        "COMPLETED",
        startDate,
        endDate
      );
      
      // Generate CSV
      const csv = await storage.generateTimesheetCSV(timesheets);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="timesheets-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("CSV export error:", error);
      res.status(500).json({ error: "Failed to export timesheets" });
    }
  });
  
  // Manual timesheet override
  app.patch("/api/timesheets/:id", async (req, res) => {
    try {
      const timesheet = await storage.updateTimesheet(Number(req.params.id), req.body);
      res.json(timesheet);
    } catch (error) {
      console.error("Failed to update timesheet:", error);
      res.status(500).json({ error: "Failed to update timesheet" });
    }
  });
  
  // Get active timesheet for driver
  app.get("/api/timesheets/active/:driverId", async (req, res) => {
    try {
      const timesheet = await storage.getActiveTimesheet(Number(req.params.driverId));
      if (!timesheet) {
        return res.status(404).json({ error: "No active timesheet" });
      }
      res.json(timesheet);
    } catch (error) {
      console.error("Error fetching active timesheet:", error);
      res.status(500).json({ error: "Failed to fetch active timesheet" });
    }
  });
  
  // Clock in
  app.post("/api/timesheets/clock-in", async (req, res) => {
    try {
      const { companyId, driverId, depotId, latitude, longitude } = req.body;
      
      if (!companyId || !driverId || !depotId || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const timesheet = await storage.clockIn(
        Number(companyId),
        Number(driverId),
        Number(depotId),
        latitude,
        longitude
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
      const { timesheetId, latitude, longitude } = req.body;
      
      if (!timesheetId || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const timesheet = await storage.clockOut(
        Number(timesheetId),
        latitude,
        longitude
      );
      
      res.json(timesheet);
    } catch (error) {
      console.error("Clock out error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to clock out" });
    }
  });
  
  // ==================== PAY RATES & WAGE CALCULATIONS ====================
  
  // Get pay rates for company
  app.get("/api/pay-rates/:companyId", async (req, res) => {
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
  app.post("/api/pay-rates", async (req, res) => {
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
  app.patch("/api/pay-rates/:id", async (req, res) => {
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
  app.post("/api/wages/calculate/:timesheetId", async (req, res) => {
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
  
  // Get notifications for driver
  app.get("/api/notifications/:driverId", async (req, res) => {
    try {
      const notifications = await storage.getDriverNotifications(Number(req.params.driverId));
      res.json(notifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  
  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      const notification = await storage.markNotificationRead(Number(req.params.id));
      res.json(notification);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      res.status(500).json({ error: "Failed to update notification" });
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
  
  return httpServer;
}
