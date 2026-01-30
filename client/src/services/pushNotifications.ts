// Push Notification Service for Titan Fleet
// Uses Firebase Cloud Messaging (FCM) for reliable push notifications

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { initializeApp, FirebaseApp } from 'firebase/app';

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID'
};

// VAPID key for push notifications (replace with your actual key)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY';

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  renotify?: boolean;
  vibrate?: number[];
  timestamp?: number;
}

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
}

class PushNotificationService {
  private app: FirebaseApp | null = null;
  private messaging: Messaging | null = null;
  private currentToken: string | null = null;
  private listeners: Set<(notification: PushNotification) => void> = new Set();

  /**
   * Initialize Firebase and messaging
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return false;
      }

      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(this.app);

      // Listen for foreground messages
      onMessage(this.messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        const notification: PushNotification = {
          title: payload.notification?.title || 'Titan Fleet',
          body: payload.notification?.body || '',
          icon: payload.notification?.icon || '/icons/icon-192x192.png',
          data: payload.data
        };

        // Notify listeners
        this.listeners.forEach(listener => listener(notification));

        // Show notification if permission granted
        if (Notification.permission === 'granted') {
          this.showNotification(notification);
        }
      });

      console.log('Push notification service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  /**
   * Check current permission status
   */
  getPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: number, userRole: 'driver' | 'manager'): Promise<string | null> {
    try {
      // Check permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Initialize if not already done
      if (!this.messaging) {
        const initialized = await this.initialize();
        if (!initialized) return null;
      }

      // Get FCM token
      const token = await getToken(this.messaging!, {
        vapidKey: VAPID_KEY
      });

      if (token) {
        console.log('FCM token obtained:', token);
        this.currentToken = token;

        // Save token to backend
        await this.saveTokenToBackend(token, userId, userRole);

        return token;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: number): Promise<boolean> {
    try {
      if (!this.currentToken) {
        return true;
      }

      // Remove token from backend
      await this.removeTokenFromBackend(this.currentToken, userId);

      this.currentToken = null;
      console.log('Unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  /**
   * Get current FCM token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Show notification
   */
  private async showNotification(notification: PushNotification): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: notification.badge || '/icons/badge-72x72.png',
        data: notification.data,
        actions: notification.actions,
        requireInteraction: notification.requireInteraction || false,
        silent: notification.silent || false,
        tag: notification.tag,
        renotify: notification.renotify || false,
        vibrate: notification.vibrate || [200, 100, 200],
        timestamp: notification.timestamp || Date.now()
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Add message listener
   */
  addMessageListener(callback: (notification: PushNotification) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Save token to backend
   */
  private async saveTokenToBackend(token: string, userId: number, userRole: string): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          userId,
          userRole,
          platform: this.getPlatform(),
          userAgent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save token');
      }

      console.log('Token saved to backend');
    } catch (error) {
      console.error('Failed to save token to backend:', error);
      throw error;
    }
  }

  /**
   * Remove token from backend
   */
  private async removeTokenFromBackend(token: string, userId: number): Promise<void> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove token');
      }

      console.log('Token removed from backend');
    } catch (error) {
      console.error('Failed to remove token from backend:', error);
      throw error;
    }
  }

  /**
   * Get platform information
   */
  private getPlatform(): string {
    const ua = navigator.userAgent;
    
    if (/android/i.test(ua)) {
      return 'android';
    } else if (/iPad|iPhone|iPod/.test(ua)) {
      return 'ios';
    } else if (/Windows/.test(ua)) {
      return 'windows';
    } else if (/Mac/.test(ua)) {
      return 'macos';
    } else if (/Linux/.test(ua)) {
      return 'linux';
    }
    
    return 'unknown';
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Check if currently subscribed
   */
  isSubscribed(): boolean {
    return this.currentToken !== null && Notification.permission === 'granted';
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
