// Titan Fleet Service Worker
// Provides offline support, caching, and PWA functionality

const CACHE_NAME = 'titan-fleet-v9';
const RUNTIME_CACHE = 'titan-fleet-runtime-v9';

const PRECACHE_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v9...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v9...');
  
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
      .then(() => {
        return self.clients.matchAll({ type: 'window' });
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_NAME });
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (!url.protocol.startsWith('http')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html') || new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      });
    })
  );
});

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-gps-locations') {
    event.waitUntil(syncGPSLocations());
  }
});

async function syncGPSLocations() {
  try {
    const queue = await getOfflineQueue();
    
    if (queue.length === 0) {
      return;
    }

    const response = await fetch('/api/driver/location/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ locations: queue })
    });

    if (response.ok) {
      await clearOfflineQueue();
      console.log('[SW] GPS locations synced:', queue.length);
    }
  } catch (error) {
    console.error('[SW] Failed to sync GPS locations:', error);
    throw error;
  }
}

async function getOfflineQueue() {
  try {
    const stored = localStorage.getItem('gps_offline_queue');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

async function clearOfflineQueue() {
  try {
    localStorage.removeItem('gps_offline_queue');
  } catch (error) {
    console.error('[SW] Failed to clear queue:', error);
  }
}

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.notification?.title || data.title || 'Titan Fleet';
  const body = data.notification?.body || data.body || 'You have a new notification';
  
  const notificationData = {
    ...data.data,
    clickAction: data.notification?.clickAction || data.clickAction || '/'
  };
  
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

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  let urlToOpen = event.notification.data?.clickAction || '/';
  
  if (event.action === 'call') {
    urlToOpen = event.notification.data?.phoneNumber || 'tel:+441234567890';
  } else if (event.action === 'open') {
    urlToOpen = event.notification.data?.clickAction || '/';
  }

  if (urlToOpen.startsWith('tel:')) {
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

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

console.log('[SW] Service worker v9 loaded');
