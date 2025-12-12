import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertInspectionSchema, insertFuelEntrySchema, insertDefectSchema, insertTrailerSchema } from "@shared/schema";
import { z } from "zod";
import { dvsaService } from "./dvsa";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
  });

  // Get all vehicles for company
  app.get("/api/vehicles", async (req, res) => {
    try {
      const { companyId } = req.query;
      if (!companyId) {
        return res.status(400).json({ error: "Missing companyId" });
      }
      
      const vehicleList = await storage.getVehiclesByCompany(Number(companyId));
      res.json(vehicleList);
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
      const { companyCode, pin } = req.body;
      if (!companyCode || !pin) {
        return res.status(400).json({ error: "Missing company code or PIN" });
      }

      const company = await storage.getCompanyByCode(companyCode);
      if (!company) {
        return res.status(401).json({ error: "Invalid company code" });
      }

      const manager = await storage.getUserByCompanyAndPin(company.id, pin, "MANAGER");
      if (!manager) {
        return res.status(401).json({ error: "Invalid PIN" });
      }

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
      const updated = await storage.updateDefect(Number(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ error: "Defect not found" });
      }
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
      const updated = await storage.updateVehicle(Number(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/manager/vehicles", async (req, res) => {
    try {
      const validated = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(validated);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/manager/vehicles/:id", async (req, res) => {
    try {
      await storage.deleteVehicle(Number(req.params.id));
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

  return httpServer;
}
