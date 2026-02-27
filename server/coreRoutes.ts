import type { Express } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, gte, desc } from "drizzle-orm";
import { documents, notifications, insertDocumentSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function registerCoreRoutes(app: Express) {
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
      const validation = insertDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const doc = await storage.createDocument(validation.data);
      res.status(201).json(doc);
    } catch (error) {
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
      const validation = insertDocumentSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const updated = await storage.updateDocument(docId, validation.data);
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
      const ackSchema = z.object({ userId: z.number() });
      const validation = ackSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const ack = await storage.acknowledgeDocument(docId, validation.data.userId);
      res.status(201).json(ack);
    } catch (error) {
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


  // ==================== TITAN COMMAND (NOTIFICATIONS) ====================
  
  // Send broadcast notification to all drivers
  app.post("/api/notifications/broadcast", async (req, res) => {
    try {
      const broadcastSchema = z.object({ companyId: z.number(), senderId: z.number(), title: z.string(), message: z.string(), priority: z.string().optional() });
      const validation = broadcastSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { companyId, senderId, title, message, priority } = validation.data;
      
      const notification = await storage.createBroadcastNotification({
        companyId,
        senderId,
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
      const individualSchema = z.object({ companyId: z.number(), senderId: z.number(), recipientId: z.number(), title: z.string(), message: z.string(), priority: z.string().optional() });
      const validation = individualSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }
      const { companyId, senderId, recipientId, title, message, priority } = validation.data;
      
      const notification = await storage.createNotification({
        companyId,
        senderId,
        recipientId,
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

}
