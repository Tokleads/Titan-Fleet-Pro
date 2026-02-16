import type { Express, Request, Response } from "express";
import {
  runAllHealthChecks,
  getHealthStatus,
  getIncidents,
  getPendingFixes,
  approveFix,
  rejectFix,
  getAnalytics,
} from "./apiHealthService";

export function registerApiHealthRoutes(app: Express): void {
  app.get("/api/admin/api-health/status", async (req: Request, res: Response) => {
    try {
      const status = await getHealthStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting API health status:", error);
      res.status(500).json({ error: "Failed to get API health status" });
    }
  });

  app.post("/api/admin/api-health/check", async (req: Request, res: Response) => {
    try {
      await runAllHealthChecks();
      res.json({ success: true, message: "Health checks completed" });
    } catch (error) {
      console.error("Error running health checks:", error);
      res.status(500).json({ error: "Failed to run health checks" });
    }
  });

  app.get("/api/admin/api-health/incidents", async (req: Request, res: Response) => {
    try {
      const incidents = await getIncidents(req.query.status as string | undefined);
      res.json(incidents);
    } catch (error) {
      console.error("Error getting incidents:", error);
      res.status(500).json({ error: "Failed to get incidents" });
    }
  });

  app.get("/api/admin/api-health/fixes/pending", async (req: Request, res: Response) => {
    try {
      const fixes = await getPendingFixes();
      res.json(fixes);
    } catch (error) {
      console.error("Error getting pending fixes:", error);
      res.status(500).json({ error: "Failed to get pending fixes" });
    }
  });

  app.post("/api/admin/api-health/fixes/:fixId/approve", async (req: Request, res: Response) => {
    try {
      const { fixId } = req.params;
      const { userId } = req.body;
      const result = await approveFix(parseInt(fixId), userId);
      res.json(result);
    } catch (error) {
      console.error("Error approving fix:", error);
      res.status(500).json({ error: "Failed to approve fix" });
    }
  });

  app.post("/api/admin/api-health/fixes/:fixId/reject", async (req: Request, res: Response) => {
    try {
      const { fixId } = req.params;
      const result = await rejectFix(parseInt(fixId));
      res.json(result);
    } catch (error) {
      console.error("Error rejecting fix:", error);
      res.status(500).json({ error: "Failed to reject fix" });
    }
  });

  app.get("/api/admin/api-health/analytics", async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const analytics = await getAnalytics(days);
      res.json(analytics);
    } catch (error) {
      console.error("Error getting analytics:", error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });
}
