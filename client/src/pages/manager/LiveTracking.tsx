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
  X,
  Route,
  Square,
  ChevronDown
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
  const [selectedTrailDriver, setSelectedTrailDriver] = useState<number | null>(null);
  const [selectedTrailTimesheet, setSelectedTrailTimesheet] = useState<number | null>(null);
  const trailMapRef = useRef<HTMLDivElement>(null);
  const trailLeafletRef = useRef<L.Map | null>(null);

  // Fetch driver locations every 30 seconds
  const { data: locations, isLoading } = useQuery<DriverLocation[]>({
    queryKey: ["driver-locations", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/driver-locations/${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch locations");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!companyId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: onShiftDrivers } = useQuery<Array<{ driverId: number; driverName: string; depotName: string; latitude: string; longitude: string; arrivalTime: string }>>({
    queryKey: ["on-shift-drivers", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/on-shift/${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch on-shift drivers");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!companyId,
    refetchInterval: 30000,
  });

  const { data: alerts } = useQuery<StagnationAlert[]>({
    queryKey: ["stagnation-alerts", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/stagnation-alerts/${companyId}?status=ACTIVE`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch alerts");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
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

          const driverName = location.driver?.name || 'Unknown Driver';
          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
              <div style="position: relative; cursor: pointer;">
                <div style="
                  width: 28px;
                  height: 28px;
                  background-color: ${markerColor};
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                "></div>
                <div style="
                  position: absolute;
                  top: -24px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: white;
                  padding: 2px 8px;
                  border-radius: 10px;
                  font-size: 11px;
                  font-weight: 600;
                  color: #0f172a;
                  white-space: nowrap;
                  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
                  border: 1px solid #e2e8f0;
                  font-family: system-ui, -apple-system, sans-serif;
                ">${driverName}</div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

          const timeAgo = Math.floor((Date.now() - new Date(location.timestamp).getTime()) / 60000);
          const timeAgoStr = timeAgo < 1 ? 'Just now' : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`;

          const popupContent = `
            <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px; padding: 4px;">
              <h3 style="font-weight: 700; margin: 0 0 10px 0; font-size: 15px; color: #0f172a;">
                ${driverName}
              </h3>
              <div style="display: flex; gap: 12px; margin-bottom: 6px;">
                <div style="flex: 1; background: #f1f5f9; border-radius: 8px; padding: 6px 10px; text-align: center;">
                  <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Speed</div>
                  <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${location.speed || 0} <span style="font-size: 11px; font-weight: 500;">km/h</span></div>
                </div>
                <div style="flex: 1; background: #f1f5f9; border-radius: 8px; padding: 6px 10px; text-align: center;">
                  <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Updated</div>
                  <div style="font-size: 13px; font-weight: 600; color: #0f172a;">${timeAgoStr}</div>
                </div>
              </div>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
                ${new Date(location.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
              ${isStagnant ? '<p style="color: #ef4444; font-weight: bold; margin: 8px 0 0 0; font-size: 13px; background: #fef2f2; padding: 4px 8px; border-radius: 6px;">⚠️ STAGNANT</p>' : ''}
            </div>
          `;

          marker.bindPopup(popupContent, { maxWidth: 280 });
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
            <div style="position: relative; cursor: pointer;">
              <div style="
                width: 28px;
                height: 28px;
                background-color: #8b5cf6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              "></div>
              <div style="
                position: absolute;
                top: -24px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
                color: #0f172a;
                white-space: nowrap;
                box-shadow: 0 1px 4px rgba(0,0,0,0.15);
                border: 1px solid #e2e8f0;
                font-family: system-ui, -apple-system, sans-serif;
              ">${driver.driverName}</div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

        const clockedInAt = new Date(driver.arrivalTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const shiftDuration = Math.floor((Date.now() - new Date(driver.arrivalTime).getTime()) / 60000);
        const shiftH = Math.floor(shiftDuration / 60);
        const shiftM = shiftDuration % 60;

        const popupContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px; padding: 4px;">
            <h3 style="font-weight: 700; margin: 0 0 10px 0; font-size: 15px; color: #0f172a;">
              ${driver.driverName}
            </h3>
            <div style="display: flex; gap: 12px; margin-bottom: 6px;">
              <div style="flex: 1; background: #f5f3ff; border-radius: 8px; padding: 6px 10px; text-align: center;">
                <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Clocked In</div>
                <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${clockedInAt}</div>
              </div>
              <div style="flex: 1; background: #f5f3ff; border-radius: 8px; padding: 6px 10px; text-align: center;">
                <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">On Shift</div>
                <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${shiftH}h ${shiftM}m</div>
              </div>
            </div>
            <p style="margin: 4px 0; font-size: 12px; color: #475569;">
              <strong>Depot:</strong> ${driver.depotName || 'N/A'}
            </p>
            <p style="margin: 6px 0 0 0; font-size: 11px; color: #8b5cf6;">
              📍 Clock-in location (no live GPS)
            </p>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 280 });
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

  // Fetch timesheets for selected driver (for shift trail)
  const { data: driverTimesheets } = useQuery<Array<{ id: number; arrivalTime: string; departureTime: string | null; depotName: string; status: string; totalMinutes: number | null }>>({
    queryKey: ["driver-timesheets-trail", selectedTrailDriver],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] });
      const res = await fetch(`/api/driver/timesheets/${companyId}/${selectedTrailDriver}?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch timesheets");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedTrailDriver && !!companyId,
  });

  // Fetch shift trail data
  const { data: shiftTrail, isLoading: trailLoading } = useQuery<{ locations: any[]; stops: any[] }>({
    queryKey: ["shift-trail", selectedTrailDriver, selectedTrailTimesheet],
    queryFn: async () => {
      const res = await fetch(`/api/shift-trail/${selectedTrailDriver}/${selectedTrailTimesheet}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch trail");
      return res.json();
    },
    enabled: !!selectedTrailDriver && !!selectedTrailTimesheet,
  });

  // Initialize trail map
  useEffect(() => {
    if (!trailMapRef.current || !shiftTrail || trailLeafletRef.current) return;

    const map = L.map(trailMapRef.current).setView([51.5074, -0.1278], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    trailLeafletRef.current = map;

    return () => {
      if (trailLeafletRef.current) {
        trailLeafletRef.current.remove();
        trailLeafletRef.current = null;
      }
    };
  }, [shiftTrail]);

  // Draw trail on map
  useEffect(() => {
    if (!trailLeafletRef.current || !shiftTrail) return;
    const map = trailLeafletRef.current;

    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
    });

    const routePoints: [number, number][] = [];
    const allBounds: [number, number][] = [];

    if (shiftTrail.locations.length > 0) {
      shiftTrail.locations.forEach((loc: any) => {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);
        if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0)) {
          routePoints.push([lat, lng]);
          allBounds.push([lat, lng]);
        }
      });

      if (routePoints.length > 1) {
        L.polyline(routePoints, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8,
          smoothFactor: 1,
        }).addTo(map);
      }

      // Start marker
      if (routePoints.length > 0) {
        const startIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="width: 16px; height: 16px; background: #22c55e; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [16, 16], iconAnchor: [8, 8],
        });
        L.marker(routePoints[0], { icon: startIcon }).addTo(map)
          .bindPopup(`<strong>Shift Start</strong><br/>${new Date(shiftTrail.locations[0].timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`);
      }

      // End marker
      if (routePoints.length > 1) {
        const endIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="width: 16px; height: 16px; background: #ef4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [16, 16], iconAnchor: [8, 8],
        });
        const lastLoc = shiftTrail.locations[shiftTrail.locations.length - 1];
        L.marker(routePoints[routePoints.length - 1], { icon: endIcon }).addTo(map)
          .bindPopup(`<strong>Latest Position</strong><br/>${new Date(lastLoc.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`);
      }
    }

    // Stop markers
    if (shiftTrail.stops.length > 0) {
      shiftTrail.stops.forEach((stop: any, idx: number) => {
        const lat = parseFloat(stop.latitude);
        const lng = parseFloat(stop.longitude);
        if (isNaN(lat) || isNaN(lng)) return;
        allBounds.push([lat, lng]);

        const stopIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="position: relative;">
              <div style="width: 24px; height: 24px; background: #f59e0b; border: 3px solid white; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 11px; font-weight: 800;">${idx + 1}</span>
              </div>
            </div>
          `,
          iconSize: [24, 24], iconAnchor: [12, 12],
        });

        const startTime = new Date(stop.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const endTime = stop.endTime ? new Date(stop.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Ongoing';

        L.marker([lat, lng], { icon: stopIcon }).addTo(map)
          .bindPopup(`
            <div style="font-family: system-ui, sans-serif; min-width: 180px;">
              <h3 style="font-weight: 700; margin: 0 0 6px 0; font-size: 14px;">Stop ${idx + 1}</h3>
              <div style="display: flex; gap: 10px; margin-bottom: 4px;">
                <div style="flex: 1; background: #fffbeb; border-radius: 6px; padding: 4px 8px; text-align: center;">
                  <div style="font-size: 9px; color: #92400e; text-transform: uppercase;">Duration</div>
                  <div style="font-size: 15px; font-weight: 700; color: #92400e;">${stop.durationMinutes}m</div>
                </div>
                <div style="flex: 1; background: #f1f5f9; border-radius: 6px; padding: 4px 8px; text-align: center;">
                  <div style="font-size: 9px; color: #64748b; text-transform: uppercase;">Time</div>
                  <div style="font-size: 12px; font-weight: 600; color: #0f172a;">${startTime} – ${endTime}</div>
                </div>
              </div>
            </div>
          `, { maxWidth: 250 });
      });
    }

    if (allBounds.length > 0) {
      try {
        map.fitBounds(L.latLngBounds(allBounds), { padding: [40, 40] });
      } catch {}
    }
  }, [shiftTrail]);

  // Cleanup trail map when driver/timesheet changes
  useEffect(() => {
    if (trailLeafletRef.current) {
      trailLeafletRef.current.remove();
      trailLeafletRef.current = null;
    }
  }, [selectedTrailDriver, selectedTrailTimesheet]);

  // Fetch all users for driver selection
  const { data: allUsers } = useQuery<Array<{ id: number; name: string; role: string; active: boolean }>>({
    queryKey: ["users-for-trail", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/users/${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      return (Array.isArray(data) ? data : []).filter((u: any) => u.role === 'DRIVER' && u.active);
    },
    enabled: !!companyId,
  });

  const onShiftCount = onShiftDrivers?.length || 0;
  const gpsActiveCount = locations?.filter(l => !l.isStagnant).length || 0;
  const activeDrivers = onShiftCount;
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
            <div className="relative">
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
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg px-4 py-3 z-[500]" data-testid="map-legend">
                <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Map Key</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#00a3ff] border-2 border-white shadow-sm flex-shrink-0"></div>
                    <span className="text-xs text-slate-600">Active — GPS tracking</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#ef4444] border-2 border-white shadow-sm flex-shrink-0"></div>
                    <span className="text-xs text-slate-600">Stagnant — not moving</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#8b5cf6] border-2 border-white shadow-sm flex-shrink-0"></div>
                    <span className="text-xs text-slate-600">Clocked in — no GPS</span>
                  </div>
                </div>
              </div>
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
        {/* Shift Trail - Route & Stops */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Route className="h-5 w-5 text-blue-600" />
              Shift Trail
              <span className="text-xs font-normal text-slate-400 ml-1">Route & stops for a driver's shift</span>
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Select Driver</label>
                <select
                  value={selectedTrailDriver || ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSelectedTrailDriver(val);
                    setSelectedTrailTimesheet(null);
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="select-trail-driver"
                >
                  <option value="">Choose a driver...</option>
                  {allUsers?.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Select Shift</label>
                <select
                  value={selectedTrailTimesheet || ''}
                  onChange={(e) => setSelectedTrailTimesheet(e.target.value ? Number(e.target.value) : null)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedTrailDriver || !driverTimesheets}
                  data-testid="select-trail-shift"
                >
                  <option value="">Choose a shift...</option>
                  {driverTimesheets?.map(ts => {
                    const date = new Date(ts.arrivalTime);
                    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                    const dur = ts.totalMinutes ? `${Math.floor(ts.totalMinutes / 60)}h ${ts.totalMinutes % 60}m` : (ts.status === 'ACTIVE' ? 'Active' : '—');
                    return (
                      <option key={ts.id} value={ts.id}>
                        {dateStr} at {timeStr} — {ts.depotName || 'Unknown'} ({dur})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {selectedTrailTimesheet && (
              <>
                {trailLoading ? (
                  <div className="h-[450px] flex items-center justify-center bg-slate-50 rounded-xl">
                    <div className="text-slate-400 text-sm">Loading shift trail...</div>
                  </div>
                ) : shiftTrail && (shiftTrail.locations.length > 0 || shiftTrail.stops.length > 0) ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-blue-600 font-medium">GPS Points</p>
                        <p className="text-xl font-bold text-blue-900">{shiftTrail.locations.length}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-amber-600 font-medium">Stops (10m+)</p>
                        <p className="text-xl font-bold text-amber-900">{shiftTrail.stops.length}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-purple-600 font-medium">Total Stop Time</p>
                        <p className="text-xl font-bold text-purple-900">
                          {shiftTrail.stops.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0)}m
                        </p>
                      </div>
                    </div>
                    <div ref={trailMapRef} className="w-full h-[450px] rounded-xl overflow-hidden border border-slate-200" />
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-6">
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Trail Key</p>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#22c55e] border-2 border-white shadow-sm"></div>
                        <span className="text-xs text-slate-600">Start</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#ef4444] border-2 border-white shadow-sm"></div>
                        <span className="text-xs text-slate-600">Latest</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-[#3b82f6]" style={{ width: '14px' }}></div>
                        <span className="text-xs text-slate-600">Route</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#f59e0b] rounded border-2 border-white shadow-sm flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">#</span>
                        </div>
                        <span className="text-xs text-slate-600">Stop (10m+)</span>
                      </div>
                    </div>
                    {shiftTrail.stops.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Stop Log</p>
                        {shiftTrail.stops.map((stop: any, idx: number) => (
                          <div key={stop.id} className="flex items-center gap-3 p-3 bg-amber-50/60 rounded-lg border border-amber-200/40">
                            <div className="w-7 h-7 bg-amber-500 rounded-md flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">{idx + 1}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900">
                                {new Date(stop.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                {' – '}
                                {stop.endTime ? new Date(stop.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {parseFloat(stop.latitude).toFixed(5)}, {parseFloat(stop.longitude).toFixed(5)}
                              </p>
                            </div>
                            <div className="bg-amber-100 px-2.5 py-1 rounded-full">
                              <span className="text-xs font-bold text-amber-800">{stop.durationMinutes}m</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center bg-slate-50 rounded-xl text-slate-400">
                    <Route className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm font-medium">No GPS data for this shift</p>
                    <p className="text-xs mt-1">GPS tracking data will appear here once collected</p>
                  </div>
                )}
              </>
            )}

            {!selectedTrailTimesheet && !selectedTrailDriver && (
              <div className="h-[150px] flex flex-col items-center justify-center bg-slate-50 rounded-xl text-slate-400">
                <Route className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Select a driver and shift to view their route and stops</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
