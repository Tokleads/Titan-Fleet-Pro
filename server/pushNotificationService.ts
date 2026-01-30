// Backend Push Notification Service
// Uses Firebase Cloud Messaging Admin SDK to send notifications

import * as admin from 'firebase-admin';
import { db } from './db';
import { notificationTokens, notifications } from '../shared/schema';
import { eq, and, inArray } from 'drizzle-orm';

// Initialize Firebase Admin (only once)
let firebaseApp: admin.app.App | null = null;

export function initializeFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Check if service account credentials are provided
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccount) {
      // Initialize with service account JSON
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    } else {
      // For development: use application default credentials
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }

    console.log('Firebase Admin initialized');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    return null;
  }
}

export interface SendNotificationOptions {
  companyId: number;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, string>;
  clickAction?: string;
  priority?: 'high' | 'normal';
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
}

export interface BroadcastOptions extends SendNotificationOptions {
  targetRole?: 'driver' | 'manager' | 'all';
  targetUserIds?: number[];
}

class PushNotificationService {
  /**
   * Send notification to a single user
   */
  async sendToUser(
    userId: number,
    options: SendNotificationOptions
  ): Promise<boolean> {
    try {
      // Get user's FCM tokens
      const tokens = await db
        .select()
        .from(notificationTokens)
        .where(
          and(
            eq(notificationTokens.userId, userId),
            eq(notificationTokens.isActive, true)
          )
        );

      if (tokens.length === 0) {
        console.log(`No active tokens for user ${userId}`);
        return false;
      }

      // Send to all user's devices
      const results = await Promise.all(
        tokens.map(token => this.sendToToken(token.token, options))
      );

      // Save notification to database
      await this.saveNotification(userId, options);

      return results.some(r => r);
    } catch (error) {
      console.error('Failed to send notification to user:', error);
      return false;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(
    userIds: number[],
    options: SendNotificationOptions
  ): Promise<number> {
    try {
      const results = await Promise.all(
        userIds.map(userId => this.sendToUser(userId, options))
      );

      return results.filter(r => r).length;
    } catch (error) {
      console.error('Failed to send notifications to users:', error);
      return 0;
    }
  }

  /**
   * Broadcast notification to all users in a company
   */
  async broadcast(options: BroadcastOptions): Promise<number> {
    try {
      // Get all active tokens for the company
      // Build conditions array
      const conditions = [
        eq(notificationTokens.companyId, options.companyId),
        eq(notificationTokens.isActive, true)
      ];

      // Filter by role if specified
      if (options.targetRole && options.targetRole !== 'all') {
        conditions.push(eq(notificationTokens.userRole, options.targetRole));
      }

      // Filter by specific users if specified
      if (options.targetUserIds && options.targetUserIds.length > 0) {
        conditions.push(inArray(notificationTokens.userId, options.targetUserIds));
      }

      const tokens = await db
        .select()
        .from(notificationTokens)
        .where(and(...conditions));

      if (tokens.length === 0) {
        console.log('No active tokens found for broadcast');
        return 0;
      }

      // Send to all tokens
      const results = await Promise.all(
        tokens.map(token => this.sendToToken(token.token, options))
      );

      // Save notifications to database
      const uniqueUserIds = [...new Set(tokens.map(t => t.userId))];
      await Promise.all(
        uniqueUserIds.map(userId => this.saveNotification(userId, options))
      );

      return results.filter(r => r).length;
    } catch (error) {
      console.error('Failed to broadcast notification:', error);
      return 0;
    }
  }

  /**
   * Send notification to a specific FCM token
   */
  private async sendToToken(
    token: string,
    options: SendNotificationOptions
  ): Promise<boolean> {
    try {
      const app = initializeFirebaseAdmin();
      if (!app) {
        throw new Error('Firebase Admin not initialized');
      }

      const message: admin.messaging.Message = {
        token,
        notification: {
          title: options.title,
          body: options.body,
          imageUrl: options.image
        },
        data: options.data || {},
        webpush: {
          notification: {
            icon: options.icon || '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            requireInteraction: options.requireInteraction || false,
            silent: options.silent || false,
            tag: options.tag,
            vibrate: [200, 100, 200]
          },
          fcmOptions: {
            link: options.clickAction || '/'
          }
        },
        android: {
          priority: options.priority || 'high',
          notification: {
            icon: options.icon || '/icons/icon-192x192.png',
            color: '#00a3ff',
            sound: 'default',
            clickAction: options.clickAction || '/'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          },
          fcmOptions: {
            imageUrl: options.image
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log('Notification sent successfully:', response);
      return true;
    } catch (error: any) {
      // Handle invalid token
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        console.log('Invalid token, marking as inactive:', token);
        await this.markTokenInactive(token);
      } else {
        console.error('Failed to send notification:', error);
      }
      return false;
    }
  }

  /**
   * Save notification to database
   */
  private async saveNotification(
    userId: number,
    options: SendNotificationOptions
  ): Promise<void> {
    try {
      await db.insert(notifications).values({
        companyId: options.companyId,
        senderId: 0, // System notification
        recipientId: userId,
        isBroadcast: false,
        title: options.title,
        message: options.body,
        priority: 'NORMAL',
        isRead: false
      });
    } catch (error) {
      console.error('Failed to save notification to database:', error);
    }
  }

  /**
   * Mark token as inactive
   */
  private async markTokenInactive(token: string): Promise<void> {
    try {
      await db
        .update(notificationTokens)
        .set({ isActive: false })
        .where(eq(notificationTokens.token, token));
    } catch (error) {
      console.error('Failed to mark token as inactive:', error);
    }
  }

  /**
   * Save FCM token to database
   */
  async saveToken(
    token: string,
    userId: number,
    companyId: number,
    userRole: 'driver' | 'manager',
    platform: string,
    userAgent: string
  ): Promise<void> {
    try {
      // Check if token already exists
      const existing = await db
        .select()
        .from(notificationTokens)
        .where(eq(notificationTokens.token, token))
        .limit(1);

      if (existing.length > 0) {
        // Update existing token
        await db
          .update(notificationTokens)
          .set({
            userId,
            companyId,
            userRole,
            platform,
            userAgent,
            isActive: true,
            lastUsed: new Date()
          })
          .where(eq(notificationTokens.token, token));
      } else {
        // Insert new token
        await db.insert(notificationTokens).values({
          token,
          userId,
          companyId,
          userRole,
          platform,
          userAgent,
          isActive: true
        });
      }

      console.log('Token saved to database');
    } catch (error) {
      console.error('Failed to save token to database:', error);
      throw error;
    }
  }

  /**
   * Remove FCM token from database
   */
  async removeToken(token: string): Promise<void> {
    try {
      await db
        .update(notificationTokens)
        .set({ isActive: false })
        .where(eq(notificationTokens.token, token));

      console.log('Token removed from database');
    } catch (error) {
      console.error('Failed to remove token from database:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
