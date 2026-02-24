import { useQuery, useQueryClient } from "@tanstack/react-query";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

import { 
  AlertTriangle, 
  Clock,
  MapPin,
  Fuel,
  AlertCircle,
  CheckCircle2,
  X,
  Bell,
  Zap
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StagnationAlert {
  id: number;
  driverId: number;
  latitude: string;
  longitude: string;
  stagnationStartTime: string;
  stagnationDurationMinutes: number;
  status: string;
  driver?: {
    name: string;
  };
}

interface Alert {
  id: string;
  type: 'stagnation' | 'geofence' | 'fuel' | 'inspection' | 'defect';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  driverName?: string;
  acknowledged: boolean;
}

export function TitanIntelligenceSidebar() {
  const company = session.getCompany();
  const companyId = company?.id;
  const queryClient = useQueryClient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Fetch stagnation alerts
  const { data: stagnationAlerts } = useQuery<StagnationAlert[]>({
    queryKey: ["stagnation-alerts", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/stagnation-alerts/${companyId}?status=ACTIVE`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!companyId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Transform stagnation alerts into unified alert format
  const alerts: Alert[] = [
    ...(stagnationAlerts || []).map(alert => ({
      id: `stagnation-${alert.id}`,
      type: 'stagnation' as const,
      priority: alert.stagnationDurationMinutes > 60 ? 'critical' as const : 'high' as const,
      title: 'Vehicle Stagnant',
      message: `${alert.driver?.name || 'Driver'} has been stationary for ${alert.stagnationDurationMinutes} minutes`,
      timestamp: alert.stagnationStartTime,
      driverName: alert.driver?.name,
      acknowledged: acknowledgedAlerts.has(`stagnation-${alert.id}`)
    }))
  ];

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  const getPriorityColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
    }
  };

  const getPriorityBg = (priority: Alert['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-blue-50 border-blue-200';
    }
  };

  const getPriorityText = (priority: Alert['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-700';
      case 'high': return 'text-orange-700';
      case 'medium': return 'text-yellow-700';
      case 'low': return 'text-blue-700';
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'stagnation': return AlertTriangle;
      case 'geofence': return MapPin;
      case 'fuel': return Fuel;
      case 'inspection': return Clock;
      case 'defect': return AlertCircle;
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
    const numericId = alertId.replace('stagnation-', '');
    try {
      await fetch(`/api/stagnation-alerts/${numericId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: 'ACKNOWLEDGED' })
      });
      queryClient.invalidateQueries({ queryKey: ["stagnation-alerts", companyId] });
    } catch {}
  };

  const handleDismiss = async (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    const numericId = alertId.replace('stagnation-', '');
    try {
      await fetch(`/api/stagnation-alerts/${numericId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: 'DISMISSED' })
      });
      queryClient.invalidateQueries({ queryKey: ["stagnation-alerts", companyId] });
    } catch {
      setDismissedAlerts(prev => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (isCollapsed) {
    return (
      <div className="fixed right-0 top-0 h-full w-16 bg-[#0F172A] border-l border-slate-700 flex flex-col items-center py-6 z-40">
        <button
          onClick={() => setIsCollapsed(false)}
          className="relative p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <Bell className="h-5 w-5 text-slate-300" />
          {unacknowledgedCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
              {unacknowledgedCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-[#0F172A] border-l border-slate-700 flex flex-col z-40 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide">TITAN INTELLIGENCE</h2>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <p className="text-xs text-slate-400">Real-time fleet monitoring</p>
      </div>

      {/* Alert Count */}
      <div className="p-4 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Active Alerts</span>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            unacknowledgedCount > 0 ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {unacknowledgedCount}
          </span>
        </div>
        {alerts.length > 1 && (
          <button
            onClick={async () => {
              if (!confirm(`Dismiss all ${alerts.filter(a => !dismissedAlerts.has(a.id)).length} alerts?`)) return;
              setDismissedAlerts(new Set(alerts.map(a => a.id)));
              try {
                await fetch(`/api/stagnation-alerts/${companyId}/dismiss-all`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...authHeaders() },
                });
                queryClient.invalidateQueries({ queryKey: ["stagnation-alerts", companyId] });
              } catch {
                setDismissedAlerts(new Set());
              }
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 text-xs font-medium transition-colors border border-red-600/30"
            data-testid="button-dismiss-all-alerts"
          >
            <X className="h-3.5 w-3.5" />
            Dismiss All Alerts
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
              <p className="text-sm font-medium text-slate-300">All Clear</p>
              <p className="text-xs text-slate-500 mt-1">No active alerts</p>
            </div>
          ) : (
            alerts
              .filter((a) => !dismissedAlerts.has(a.id))
              .map((alert) => {
              const Icon = getAlertIcon(alert.type);
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`border-b border-slate-800 ${
                    alert.acknowledged ? 'opacity-50' : ''
                  }`}
                >
                  <div className={`p-4 ${getPriorityBg(alert.priority)} border-l-4 relative ${
                    alert.priority === 'critical' ? 'border-red-500' :
                    alert.priority === 'high' ? 'border-orange-500' :
                    alert.priority === 'medium' ? 'border-yellow-500' :
                    'border-blue-500'
                  }`}>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full bg-slate-300/60 hover:bg-red-200 text-slate-500 hover:text-red-700 transition-colors"
                      data-testid={`button-dismiss-sidebar-alert-${alert.id}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex items-start gap-3 pr-6">
                      <div className={`h-8 w-8 rounded-lg ${getPriorityColor(alert.priority)} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`text-sm font-semibold ${getPriorityText(alert.priority)}`}>
                            {alert.title}
                          </h3>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {getTimeAgo(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">
                          {alert.message}
                        </p>
                        {alert.driverName && (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-xs font-medium text-slate-700">
                              {alert.driverName}
                            </span>
                          </div>
                        )}
                        {!alert.acknowledged && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            Acknowledge →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Last updated</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
