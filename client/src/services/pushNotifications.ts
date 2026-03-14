export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  renotify?: boolean;
  vibrate?: number[];
  timestamp?: number;
}

class PushNotificationService {
  private listeners: Set<(notification: PushNotification) => void> = new Set();
  private swRegistration: ServiceWorkerRegistration | null = null;

  async initialize(): Promise<boolean> {
    try {
      if (!this.isSupported()) return false;

      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    return Notification.requestPermission();
  }

  getPermission(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  async subscribe(userId: number, userRole: 'driver' | 'manager'): Promise<boolean> {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') return false;

      if (!this.swRegistration) {
        const initialized = await this.initialize();
        if (!initialized) return false;
      }

      localStorage.setItem('pushNotificationsEnabled', 'true');
      localStorage.setItem('pushNotificationsUserId', String(userId));
      localStorage.setItem('pushNotificationsRole', userRole);

      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return false;
    }
  }

  async unsubscribe(): Promise<boolean> {
    localStorage.removeItem('pushNotificationsEnabled');
    localStorage.removeItem('pushNotificationsUserId');
    localStorage.removeItem('pushNotificationsRole');
    return true;
  }

  async showLocalNotification(notification: PushNotification): Promise<void> {
    try {
      if (Notification.permission !== 'granted') return;

      if (this.swRegistration) {
        await this.swRegistration.showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icons/icon-192x192.png',
          badge: notification.badge || '/icons/badge-72x72.png',
          data: notification.data,
          requireInteraction: notification.requireInteraction || false,
          silent: notification.silent || false,
          tag: notification.tag,
        });
      } else {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icons/icon-192x192.png',
        });
      }

      this.listeners.forEach(listener => listener(notification));
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  addMessageListener(callback: (notification: PushNotification) => void): () => void {
    this.listeners.add(callback);
    return () => { this.listeners.delete(callback); };
  }

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  isSubscribed(): boolean {
    return localStorage.getItem('pushNotificationsEnabled') === 'true' && Notification.permission === 'granted';
  }
}

export const pushNotificationService = new PushNotificationService();
