const DB_NAME = 'titanfleet-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-submissions';

export interface QueuedItem {
  id: string;
  type: 'inspection' | 'defect' | 'fuel';
  endpoint: string;
  method: string;
  body: any;
  createdAt: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
  displayLabel: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addToQueue(item: Omit<QueuedItem, 'id' | 'createdAt' | 'retryCount' | 'status'>): Promise<string> {
  const db = await openDB();
  const id = `${item.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const queuedItem: QueuedItem = {
    ...item,
    id,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: 'pending',
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(queuedItem);
    tx.oncomplete = () => { db.close(); resolve(id); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getQueuedItems(): Promise<QueuedItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function getQueueCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).count();
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(0); };
  });
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function updateItemStatus(id: string, status: QueuedItem['status'], retryCount?: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        item.status = status;
        if (retryCount !== undefined) item.retryCount = retryCount;
        store.put(item);
      }
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const items = await getQueuedItems();
  const pending = items.filter(i => i.status === 'pending' || i.status === 'failed');
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      await updateItemStatus(item.id, 'syncing');
      const token = localStorage.getItem('fleetcheck_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(item.endpoint, {
        method: item.method,
        headers,
        credentials: 'include',
        body: JSON.stringify(item.body),
      });

      if (response.ok) {
        await removeFromQueue(item.id);
        synced++;
      } else {
        await updateItemStatus(item.id, 'failed', item.retryCount + 1);
        failed++;
      }
    } catch {
      await updateItemStatus(item.id, 'failed', item.retryCount + 1);
      failed++;
    }
  }

  return { synced, failed };
}

let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync() {
  if (syncInterval) return;

  window.addEventListener('online', () => {
    syncQueue().then(({ synced }) => {
      if (synced > 0) {
        window.dispatchEvent(new CustomEvent('offline-queue-update'));
      }
    });
  });

  syncInterval = setInterval(async () => {
    if (navigator.onLine) {
      const { synced } = await syncQueue();
      if (synced > 0) {
        window.dispatchEvent(new CustomEvent('offline-queue-update'));
      }
    }
  }, 30000);
}

export function isOnline(): boolean {
  return navigator.onLine;
}
