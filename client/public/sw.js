// Titan Fleet Service Worker - Self-destruct mode
// This version unregisters itself and clears all caches to fix stale content issues

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
      .then(() => {
        return self.clients.matchAll({ type: 'window' });
      })
      .then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      })
  );
});

// Pass everything straight to the network - no caching at all
self.addEventListener('fetch', (event) => {
  return;
});
