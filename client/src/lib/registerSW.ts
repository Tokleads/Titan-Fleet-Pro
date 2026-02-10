// Service Worker Registration for Titan Fleet PWA

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('Unregistered old service worker');
    }

    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log('Deleted cache:', cacheName);
    }

    console.log('Service workers disabled - all caches cleared');
    return null;
  } catch (error) {
    console.error('Service Worker cleanup failed:', error);
    return null;
  }
}

// Unregister service worker (for debugging)
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('Service Worker unregistered:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}

// Check if app is running as PWA
export function isRunningAsPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );
}

// Request persistent storage
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) {
    return false;
  }

  try {
    const isPersisted = await navigator.storage.persisted();
    
    if (isPersisted) {
      console.log('Storage is already persistent');
      return true;
    }

    const result = await navigator.storage.persist();
    console.log('Persistent storage request:', result ? 'granted' : 'denied');
    return result;
  } catch (error) {
    console.error('Persistent storage request failed:', error);
    return false;
  }
}

// Get storage estimate
export async function getStorageEstimate() {
  if (!navigator.storage || !navigator.storage.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = (usage / quota) * 100;

    return {
      usage,
      quota,
      percentUsed,
      usageMB: (usage / (1024 * 1024)).toFixed(2),
      quotaMB: (quota / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.error('Storage estimate failed:', error);
    return null;
  }
}

// Clear all caches
export async function clearAllCaches(): Promise<boolean> {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    );
    console.log('All caches cleared');
    return true;
  } catch (error) {
    console.error('Cache clearing failed:', error);
    return false;
  }
}
