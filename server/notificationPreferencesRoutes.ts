/**
 * Notification Preferences & History API Routes
 * 
 * Handles notification preferences, history, and sending test notifications
 * Separate from push notification system
 */

import { Router, Request, Response } from 'express';
import { db } from './db.js';
import { notificationPreferences, notificationHistory } from '../shared/schema.js';
import { eq, and, sql, desc, or, like } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/notification-preferences
 * Get notification preferences for a company
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    
    // Get or create preferences
    let [prefs] = await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.companyId, companyId))
      .limit(1);
    
    if (!prefs) {
      // Create default preferences
      [prefs] = await db.insert(notificationPreferences)
        .values({ companyId })
        .returning();
    }
    
    // Transform to frontend format
    const response = {
      emailEnabled: prefs.emailEnabled,
      smsEnabled: prefs.smsEnabled,
      inAppEnabled: prefs.inAppEnabled,
      emailOverride: prefs.email || null,
      notificationTypes: {
        MOT_EXPIRY: {
          enabled: prefs.motExpiryEnabled,
          daysBeforeExpiry: prefs.motExpiryDays
        },
        TAX_EXPIRY: {
          enabled: prefs.taxExpiryEnabled,
          daysBeforeExpiry: prefs.taxExpiryDays
        },
        SERVICE_DUE: {
          enabled: prefs.serviceDueEnabled,
          daysBeforeExpiry: prefs.serviceDueDays
        },
        LICENSE_EXPIRY: {
          enabled: prefs.licenseExpiryEnabled,
          daysBeforeExpiry: prefs.licenseExpiryDays
        },
        VOR_STATUS: {
          enabled: prefs.vorStatusEnabled
        },
        DEFECT_REPORTED: {
          enabled: prefs.defectReportedEnabled
        },
        INSPECTION_FAILED: {
          enabled: prefs.inspectionFailedEnabled
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * PUT /api/notification-preferences
 * Update notification preferences
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const { emailEnabled, smsEnabled, inAppEnabled, emailOverride, notificationTypes } = req.body;
    
    // Check if preferences exist
    const [existing] = await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.companyId, companyId))
      .limit(1);
    
    const values = {
      companyId,
      emailEnabled,
      smsEnabled,
      inAppEnabled,
      email: emailOverride || null,
      motExpiryEnabled: notificationTypes.MOT_EXPIRY?.enabled ?? true,
      motExpiryDays: notificationTypes.MOT_EXPIRY?.daysBeforeExpiry ?? 30,
      taxExpiryEnabled: notificationTypes.TAX_EXPIRY?.enabled ?? true,
      taxExpiryDays: notificationTypes.TAX_EXPIRY?.daysBeforeExpiry ?? 30,
      serviceDueEnabled: notificationTypes.SERVICE_DUE?.enabled ?? true,
      serviceDueDays: notificationTypes.SERVICE_DUE?.daysBeforeExpiry ?? 14,
      licenseExpiryEnabled: notificationTypes.LICENSE_EXPIRY?.enabled ?? true,
      licenseExpiryDays: notificationTypes.LICENSE_EXPIRY?.daysBeforeExpiry ?? 30,
      vorStatusEnabled: notificationTypes.VOR_STATUS?.enabled ?? true,
      defectReportedEnabled: notificationTypes.DEFECT_REPORTED?.enabled ?? true,
      inspectionFailedEnabled: notificationTypes.INSPECTION_FAILED?.enabled ?? true,
      updatedAt: new Date()
    };
    
    let prefs;
    if (existing) {
      // Update existing
      [prefs] = await db.update(notificationPreferences)
        .set(values)
        .where(eq(notificationPreferences.id, existing.id))
        .returning();
    } else {
      // Create new
      [prefs] = await db.insert(notificationPreferences)
        .values(values)
        .returning();
    }
    
    res.json({ success: true, preferences: prefs });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * POST /api/notification-preferences/test
 * Send a test notification
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const { type, channel, recipient } = req.body;
    
    // Create test notification in history
    const [notification] = await db.insert(notificationHistory)
      .values({
        companyId,
        type: type || 'TEST',
        channel: channel || 'EMAIL',
        recipient: recipient || 'test@example.com',
        subject: 'Test Notification',
        message: 'This is a test notification from Titan Fleet.',
        status: 'SENT',
        sentAt: new Date(),
        metadata: { test: true }
      })
      .returning();
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

/**
 * GET /api/notification-preferences/history
 * Get notification history with filters
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const { type, status, channel, search, limit = '50', offset = '0' } = req.query;
    
    // Build where conditions
    const conditions = [eq(notificationHistory.companyId, companyId)];
    
    if (type && type !== 'all') {
      conditions.push(eq(notificationHistory.type, type as string));
    }
    
    if (status && status !== 'all') {
      conditions.push(eq(notificationHistory.status, status as string));
    }
    
    if (channel && channel !== 'all') {
      conditions.push(eq(notificationHistory.channel, channel as string));
    }
    
    if (search) {
      conditions.push(
        or(
          like(notificationHistory.subject, `%${search}%`),
          like(notificationHistory.message, `%${search}%`),
          like(notificationHistory.recipient, `%${search}%`)
        )!
      );
    }
    
    // Get notifications
    const notifications = await db.select()
      .from(notificationHistory)
      .where(and(...conditions))
      .orderBy(desc(notificationHistory.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    // Get total count
    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(notificationHistory)
      .where(and(...conditions));
    
    res.json({
      notifications,
      total: Number(count)
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
});

/**
 * DELETE /api/notification-preferences/history/:id
 * Delete a notification from history
 */
router.delete('/history/:id', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const notificationId = parseInt(req.params.id);
    
    await db.delete(notificationHistory)
      .where(and(
        eq(notificationHistory.id, notificationId),
        eq(notificationHistory.companyId, companyId)
      ));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
