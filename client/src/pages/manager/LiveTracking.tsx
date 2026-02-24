import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

import { 
  MapPin, 
  AlertTriangle, 
  Clock,
  Navigation,
  Activity,
  TrendingUp,
  Zap,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DriverLocation {
  id: number;
  driverId: number;
  latitude: string;
  longitude: string;
  speed: number;
  heading?: number;
  accuracy?: number;
  isStagnant: boolean;
  timestamp: string;
  driver?: {
    id: number;
    name: string;
    email: string;
  };
}

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

export default function LiveTracking() {
  const company = session.getCompany();
  const companyId = company?.id;
  const queryClient = useQueryClient();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const [dismissingIds, setDismissingIds] = useState<Set<number>>(new Set());
  const [acknowledgingIds, setAcknowledgingIds] = useState<Set<number>>(new Set());

  // Fetch driver locations every 30 seconds
  const { data: locations, isLoading } = useQuery<DriverLocation[]>({
    queryKey: ["driver-locations", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/driver-locations/${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch locations");
      return res.json();
    },
    enabled: !!companyId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: onShiftDrivers } = useQuery<Array<{ driverId: number; driverName: string; depotName: string; latitude: string; longitude: string; arrivalTime: string }>>({
    queryKey: ["on-shift-drivers", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/on-shift/${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch on-shift drivers");
      return res.json();
    },
    enabled: !!companyId,
    refetchInterval: 30000,
  });

  // Fetch active stagnation alerts
  const { data: alerts } = useQuery<StagnationAlert[]>({
    queryKey: ["stagnation-alerts", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/stagnation-alerts/${companyId}?status=ACTIVE`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    enabled: !!companyId,
    refetchInterval: 30000,
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Create map centered on London
    const map = L.map(mapRef.current).setView([51.5074, -0.1278], 10);

    // Add OpenStreetMap tile layer (free!)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;

    // Cleanup on unmount
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update markers when locations or on-shift drivers change
  useEffect(() => {
    if (!leafletMapRef.current) return;

    const map = leafletMapRef.current;
    const markers = markersRef.current;

    markers.forEach((marker) => {
      marker.remove();
    });
    markers.clear();

    const allBounds: [number, number][] = [];
    const driversWithGPS = new Set<number>();

    if (locations && locations.length > 0) {
      locations.forEach((location) => {
        try {
          const lat = parseFloat(location.latitude);
          const lng = parseFloat(location.longitude);

          if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
            return;
          }

          driversWithGPS.add(location.driverId);
          const isStagnant = location.isStagnant;
          const markerColor = isStagnant ? '#ef4444' : '#00a3ff';

          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
              <div style="
                width: 20px;
                height: 20px;
                background-color: ${markerColor};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

          const popupContent = `
            <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
              <h3 style="font-weight: bold; margin: 0 0 8px 0; font-size: 14px; color: #0f172a;">
                ${location.driver?.name || 'Unknown Driver'}
              </h3>
              <p style="margin: 4px 0; font-size: 13px; color: #475569;">
                <strong>Speed:</strong> ${location.speed} km/h
              </p>
              <p style="margin: 4px 0; font-size: 13px; color: #475569;">
                <strong>Last Update:</strong> ${new Date(location.timestamp).toLocaleTimeString()}
              </p>
              ${isStagnant ? '<p style="color: #ef4444; font-weight: bold; margin: 8px 0 0 0; font-size: 13px;">⚠️ STAGNANT</p>' : ''}
            </div>
          `;

          marker.bindPopup(popupContent);
          markers.set(location.driverId, marker);
          allBounds.push([lat, lng]);
        } catch (error) {
          console.error('Error creating marker for driver', location.driverId, error);
        }
      });
    }

    if (onShiftDrivers && onShiftDrivers.length > 0) {
      onShiftDrivers.forEach((driver) => {
        if (driversWithGPS.has(driver.driverId)) return;

        const lat = parseFloat(driver.latitude);
        const lng = parseFloat(driver.longitude);
        if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background-color: #8b5cf6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

        const popupContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
            <h3 style="font-weight: bold; margin: 0 0 8px 0; font-size: 14px; color: #0f172a;">
              ${driver.driverName}
            </h3>
            <p style="margin: 4px 0; font-size: 13px; color: #475569;">
              <strong>Status:</strong> Clocked In
            </p>
            <p style="margin: 4px 0; font-size: 13px; color: #475569;">
              <strong>Depot:</strong> ${driver.depotName || 'N/A'}
            </p>
            <p style="margin: 4px 0; font-size: 11px; color: #8b5cf6;">
              📍 Timesheet location (no GPS data)
            </p>
          </div>
        `;

        marker.bindPopup(popupContent);
        markers.set(driver.driverId, marker);
        allBounds.push([lat, lng]);
      });
    }

    if (allBounds.length > 0) {
      try {
        const bounds = L.latLngBounds(allBounds);
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (error) {
        console.warn('Error fitting bounds:', error);
      }
    }
  }, [locations, onShiftDrivers]);

  const onShiftCount = onShiftDrivers?.length || 0;
  const activeDrivers = Math.max(locations?.filter(l => !l.isStagnant).length || 0, onShiftCount);
  const stagnantDrivers = locations?.filter(l => l.isStagnant).length || 0;
  const avgSpeed = locations && locations.length > 0
    ? Math.round(locations.reduce((sum, l) => sum + l.speed, 0) / locations.length)
    : 0;

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Live Tracking</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Real-time driver location monitoring
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Activity className="h-4 w-4 animate-pulse text-emerald-500" />
            <span>Live • Updates every 30s</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Drivers</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{activeDrivers}</p>
                {onShiftCount > (locations?.filter(l => !l.isStagnant).length || 0) && (
                  <p className="text-xs text-slate-400 mt-0.5">({onShiftCount} clocked in)</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Navigation className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Stagnant</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stagnantDrivers}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Avg Speed</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{avgSpeed} km/h</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Alerts</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{alerts?.length || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Map and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Driver Locations
              </h2>
            </div>
            <div 
              ref={mapRef} 
              className="w-full h-[600px]"
            >
              {isLoading && (
                <div className="flex items-center justify-center h-full bg-slate-50">
                  <div className="text-slate-400">Loading map...</div>
                </div>
              )}
            </div>
          </div>

          {/* Stagnation Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Stagnation Alerts
                </h2>
                {alerts && alerts.filter(a => !dismissingIds.has(a.id)).length > 1 && (
                  <button
                    onClick={async () => {
                      const visibleCount = alerts.filter(a => !dismissingIds.has(a.id)).length;
                      if (!confirm(`Dismiss all ${visibleCount} alerts?`)) return;
                      setDismissingIds(new Set(alerts.map(a => a.id)));
                      try {
                        await fetch(`/api/stagnation-alerts/${companyId}/dismiss-all`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', ...authHeaders() },
                        });
                        queryClient.invalidateQueries({ queryKey: ["stagnation-alerts", companyId] });
                      } catch {
                        setDismissingIds(new Set());
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-medium transition-colors border border-red-200"
                    data-testid="button-dismiss-all-stagnation"
                  >
                    <X className="h-3.5 w-3.5" />
                    Dismiss All
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {alerts && alerts.length > 0 ? (
                alerts
                  .filter((a) => !dismissingIds.has(a.id))
                  .map((alert) => (
                  <div 
                    key={alert.id}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg relative group"
                  >
                    <button
                      onClick={async () => {
                        setDismissingIds(prev => new Set([...prev, alert.id]));
                        try {
                          await fetch(`/api/stagnation-alerts/${alert.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', ...authHeaders() },
                            body: JSON.stringify({ status: 'DISMISSED' })
                          });
                          queryClient.invalidateQueries({ queryKey: ["stagnation-alerts", companyId] });
                        } catch {
                          setDismissingIds(prev => {
                            const next = new Set(prev);
                            next.delete(alert.id);
                            return next;
                          });
                        }
                      }}
                      className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-slate-200/80 hover:bg-red-200 text-slate-500 hover:text-red-700 transition-colors"
                      data-testid={`button-dismiss-alert-${alert.id}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-start justify-between pr-8">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {alert.driver?.name || `Driver ${alert.driverId}`}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {alert.stagnationDurationMinutes} minutes
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Since {new Date(alert.stagnationStartTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <button 
                        className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                          acknowledgingIds.has(alert.id) 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                        disabled={acknowledgingIds.has(alert.id)}
                        onClick={async () => {
                          setAcknowledgingIds(prev => new Set([...prev, alert.id]));
                          await fetch(`/api/stagnation-alerts/${alert.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', ...authHeaders() },
                            body: JSON.stringify({ status: 'ACKNOWLEDGED' })
                          });
                          queryClient.invalidateQueries({ queryKey: ["stagnation-alerts", companyId] });
                        }}
                      >
                        {acknowledgingIds.has(alert.id) ? 'Done' : 'Acknowledge'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No active alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
