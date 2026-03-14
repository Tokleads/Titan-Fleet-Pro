import { useState, useEffect, useCallback } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { UploadCloud, CheckCircle, WifiOff, Wifi, RefreshCw, Trash2, Clock, AlertTriangle } from "lucide-react";
import { getQueuedItems, syncQueue, removeFromQueue, getQueueCount, type QueuedItem } from "@/lib/offlineQueue";
import { useToast } from "@/hooks/use-toast";

export default function DriverQueue() {
  const [items, setItems] = useState<QueuedItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  const loadItems = useCallback(async () => {
    try {
      const queued = await getQueuedItems();
      setItems(queued.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    loadItems();
    const handler = () => loadItems();
    window.addEventListener('offline-queue-update', handler);
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    const interval = setInterval(loadItems, 5000);
    return () => {
      window.removeEventListener('offline-queue-update', handler);
      clearInterval(interval);
    };
  }, [loadItems]);

  const handleSync = async () => {
    if (!navigator.onLine) {
      toast({ variant: "destructive", title: "No Connection", description: "You need internet access to sync." });
      return;
    }
    setIsSyncing(true);
    try {
      const { synced, failed } = await syncQueue();
      await loadItems();
      toast({
        title: synced > 0 ? "Sync Complete" : "Nothing to Sync",
        description: synced > 0 ? `${synced} item(s) uploaded successfully.${failed > 0 ? ` ${failed} failed.` : ''}` : "All items are already synced.",
        className: failed > 0 ? "border-amber-500 bg-amber-50" : "border-green-500 bg-green-50",
      });
    } catch {
      toast({ variant: "destructive", title: "Sync Failed", description: "Please try again." });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    await removeFromQueue(id);
    await loadItems();
    toast({ title: "Removed", description: "Queued item deleted." });
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'inspection': return '🔍';
      case 'defect': return '⚠️';
      case 'fuel': return '⛽';
      default: return '📋';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'syncing': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <DriverLayout>
      <div className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900" data-testid="text-queue-title">Upload Queue</h1>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${online ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`} data-testid="status-connection">
              {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {online ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="titan-card p-8 text-center" data-testid="status-all-synced">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="font-semibold text-slate-900 text-lg">All synced</p>
            <p className="text-sm text-slate-500 mt-2">
              All your inspections, fuel entries, and defect reports have been uploaded successfully.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-600 font-medium" data-testid="text-queue-count">{items.length} item{items.length !== 1 ? 's' : ''} waiting</p>
              <button
                onClick={handleSync}
                disabled={isSyncing || !online}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 active:scale-95 transition-all"
                data-testid="button-sync-all"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="titan-card p-4" data-testid={`card-queue-item-${item.id}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{typeIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900 text-sm truncate">{item.displayLabel}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="capitalize">{item.type}</span>
                        {item.retryCount > 0 && (
                          <span className="flex items-center gap-1 text-red-500">
                            <AlertTriangle className="h-3 w-3" />
                            {item.retryCount} retries
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      data-testid={`button-delete-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="titan-card p-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <WifiOff className="h-5 w-5 text-slate-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 text-sm">Offline Mode</p>
              <p className="text-xs text-slate-500">
                When you lose connection, inspections, fuel entries, and defect reports queue here and sync automatically when you're back online.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DriverLayout>
  );
}
