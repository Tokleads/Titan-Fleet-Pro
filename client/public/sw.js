// Titan Fleet Service Worker
// Provides offline support, caching, and PWA functionality

const CACHE_NAME = 'titan-fleet-v8';
const RUNTIME_CACHE = 'titan-fleet-runtime-v8';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response before caching
          const responseToCache = response.clone();
          
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - network first, cache fallback (ensures fresh code)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Background sync for offline GPS updates
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-gps-locations') {
    event.waitUntil(syncGPSLocations());
  }
});

// Sync GPS locations from offline queue
async function syncGPSLocations() {
  try {
    // Get offline queue from IndexedDB or localStorage
    const queue = await getOfflineQueue();
    
    if (queue.length === 0) {
      return;
    }

    // Send batch update
    const response = await fetch('/api/driver/location/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ locations: queue })
    });

    if (response.ok) {
      // Clear queue on success
      await clearOfflineQueue();
      console.log('[SW] GPS locations synced:', queue.length);
    }
  } catch (error) {
    console.error('[SW] Failed to sync GPS locations:', error);
    throw error; // Retry on failure
  }
}

// Get offline queue (placeholder - actual implementation in GPS service)
async function getOfflineQueue() {
  try {
    const stored = localStorage.getItem('gps_offline_queue');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

// Clear offline queue
async function clearOfflineQueue() {
  try {
    localStorage.removeItem('gps_offline_queue');
  } catch (error) {
    console.error('[SW] Failed to clear queue:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.notification?.title || data.title || 'Titan Fleet';
  const body = data.notification?.body || data.body || 'You have a new notification';
  
  // Parse notification data
  const notificationData = {
    ...data.data,
    clickAction: data.notification?.clickAction || data.clickAction || '/'
  };
  
  // Build notification options
  const options = {
    body: body,
    icon: data.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.notification?.image,
    vibrate: [200, 100, 200],
    data: notificationData,
    requireInteraction: data.notification?.requireInteraction || false,
    silent: data.notification?.silent || false,
    tag: data.notification?.tag || 'titan-fleet',
    renotify: data.notification?.renotify || false,
    timestamp: Date.now(),
    actions: data.notification?.actions || [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  // Handle different actions
  if (event.action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Determine URL to open
  let urlToOpen = event.notification.data?.clickAction || '/';
  
  // Handle special actions
  if (event.action === 'call') {
    urlToOpen = event.notification.data?.phoneNumber || 'tel:+441234567890';
  } else if (event.action === 'open') {
    urlToOpen = event.notification.data?.clickAction || '/';
  }

  // Handle tel: links (open phone dialer)
  if (urlToOpen.startsWith('tel:')) {
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
    return;
  }

  // Handle regular URLs
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler for communication with app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service worker loaded');
