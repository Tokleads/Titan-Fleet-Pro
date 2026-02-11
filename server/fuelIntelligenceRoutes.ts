/**
 * Fuel Intelligence API Routes
 * 
 * Endpoints for AI-powered fuel analytics and cost optimization
 */

import type { Express, Request, Response } from "express";
import * as fuelAnalytics from "./fuelAnalyticsService";

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function registerFuelIntelligenceRoutes(app: Express) {
  /**
   * GET /api/fuel-intelligence/summary
   * Get fleet summary statistics
   */
  app.get("/api/fuel-intelligence/summary", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const start = new Date(startDate as string);
      const end = endOfDay(new Date(endDate as string));

      const summary = await fuelAnalytics.getFleetSummary(companyId, start, end);
      res.json(summary);
    } catch (error) {
      console.error("Error getting fuel intelligence summary:", error);
      res.status(500).json({ error: "Failed to get fuel intelligence summary" });
    }
  });

  /**
   * GET /api/fuel-intelligence/driver-performance
   * Get driver performance rankings
   */
  app.get("/api/fuel-intelligence/driver-performance", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const start = new Date(startDate as string);
      const end = endOfDay(new Date(endDate as string));

      const performance = await fuelAnalytics.getDriverPerformanceRankings(companyId, start, end);
      res.json(performance);
    } catch (error) {
      console.error("Error getting driver performance:", error);
      res.status(500).json({ error: "Failed to get driver performance" });
    }
  });

  /**
   * GET /api/fuel-intelligence/vehicle-performance
   * Get vehicle performance rankings
   */
  app.get("/api/fuel-intelligence/vehicle-performance", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const start = new Date(startDate as string);
      const end = endOfDay(new Date(endDate as string));

      const performance = await fuelAnalytics.getVehiclePerformanceRankings(companyId, start, end);
      res.json(performance);
    } catch (error) {
      console.error("Error getting vehicle performance:", error);
      res.status(500).json({ error: "Failed to get vehicle performance" });
    }
  });

  /**
   * GET /api/fuel-intelligence/anomalies
   * Detect fuel anomalies and potential fraud
   */
  app.get("/api/fuel-intelligence/anomalies", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const start = new Date(startDate as string);
      const end = endOfDay(new Date(endDate as string));

      const anomalies = await fuelAnalytics.detectFuelAnomalies(companyId, start, end);
      res.json(anomalies);
    } catch (error) {
      console.error("Error detecting fuel anomalies:", error);
      res.status(500).json({ error: "Failed to detect fuel anomalies" });
    }
  });

  /**
   * GET /api/fuel-intelligence/opportunities
   * Generate cost-saving opportunities
   */
  app.get("/api/fuel-intelligence/opportunities", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const start = new Date(startDate as string);
      const end = endOfDay(new Date(endDate as string));

      const opportunities = await fuelAnalytics.generateCostSavingOpportunities(companyId, start, end);
      res.json(opportunities);
    } catch (error) {
      console.error("Error generating cost-saving opportunities:", error);
      res.status(500).json({ error: "Failed to generate cost-saving opportunities" });
    }
  });

  /**
   * GET /api/fuel-intelligence/vehicle/:vehicleId
   * Get fuel efficiency data for a specific vehicle
   */
  app.get("/api/fuel-intelligence/vehicle/:vehicleId", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId);
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }
      const vehicleId = parseInt(req.params.vehicleId);
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const start = new Date(startDate as string);
      const end = endOfDay(new Date(endDate as string));

      const efficiency = await fuelAnalytics.getVehicleFuelEfficiency(companyId, vehicleId, start, end);
      
      if (!efficiency) {
        return res.status(404).json({ error: "No fuel data found for this vehicle" });
      }

      res.json(efficiency);
    } catch (error) {
      console.error("Error getting vehicle fuel efficiency:", error);
      res.status(500).json({ error: "Failed to get vehicle fuel efficiency" });
    }
  });
}
