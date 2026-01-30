// Backend API routes for push notifications
import { Router } from 'express';
import { pushNotificationService, initializeFirebaseAdmin } from './pushNotificationService';
import { db } from './db';
import { notifications, notificationTokens, users } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Initialize Firebase Admin on startup
initializeFirebaseAdmin();

/**
 * Subscribe to push notifications
 * POST /api/notifications/subscribe
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { token, userId, userRole, platform, userAgent } = req.body;

    if (!token || !userId || !userRole) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user's company ID
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const companyId = user[0].companyId;

    // Save token to database
    await pushNotificationService.saveToken(
      token,
      userId,
      companyId,
      userRole,
      platform || 'web',
      userAgent || ''
    );

    res.json({ success: true, message: 'Subscribed to push notifications' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

/**
 * Unsubscribe from push notifications
 * POST /api/notifications/unsubscribe
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { token, userId } = req.body;

    if (!token || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await pushNotificationService.removeToken(token);

    res.json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * Send notification to specific user
 * POST /api/notifications/send
 */
router.post('/send', async (req, res) => {
  try {
    const { userId, companyId, title, body, icon, image, data, clickAction, priority } = req.body;

    if (!userId || !companyId || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const success = await pushNotificationService.sendToUser(userId, {
      companyId,
      title,
      body,
      icon,
      image,
      data,
      clickAction,
      priority: priority || 'normal'
    });

    if (success) {
      res.json({ success: true, message: 'Notification sent' });
    } else {
      res.status(500).json({ error: 'Failed to send notification' });
    }
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

/**
 * Broadcast notification to all users in company
 * POST /api/notifications/broadcast
 */
router.post('/broadcast', async (req, res) => {
  try {
    const {
      companyId,
      title,
      body,
      icon,
      image,
      data,
      clickAction,
      priority,
      targetRole,
      targetUserIds
    } = req.body;

    if (!companyId || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sentCount = await pushNotificationService.broadcast({
      companyId,
      title,
      body,
      icon,
      image,
      data,
      clickAction,
      priority: priority || 'high',
      targetRole: targetRole || 'all',
      targetUserIds
    });

    res.json({
      success: true,
      message: `Notification sent to ${sentCount} users`,
      sentCount
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
});

/**
 * Get user's notification history
 * GET /api/notifications/history/:userId
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(userNotifications);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get notification history' });
  }
});

/**
 * Mark notification as read
 * POST /api/notifications/:id/read
 */
router.post('/:id/read', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(eq(notifications.id, notificationId));

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * Mark all notifications as read
 * POST /api/notifications/read-all/:userId
 */
router.post('/read-all/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(
        and(
          eq(notifications.recipientId, userId),
          eq(notifications.isRead, false)
        )
      );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

/**
 * Get unread notification count
 * GET /api/notifications/unread-count/:userId
 */
router.get('/unread-count/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, userId),
          eq(notifications.isRead, false)
        )
      );

    res.json({ count: unreadNotifications.length });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);

    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

/**
 * Get user's active tokens
 * GET /api/notifications/tokens/:userId
 */
router.get('/tokens/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const tokens = await db
      .select()
      .from(notificationTokens)
      .where(
        and(
          eq(notificationTokens.userId, userId),
          eq(notificationTokens.isActive, true)
        )
      );

    res.json(tokens);
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
});

export default router;
