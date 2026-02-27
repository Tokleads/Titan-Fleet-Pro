import type { Express, Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { shiftChecks, stagnationAlerts, insertDeliverySchema } from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService } from "./objectStorage";

const objectStorageService = new ObjectStorageService();

export function registerOperationsRoutes(app: Express) {
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

}
