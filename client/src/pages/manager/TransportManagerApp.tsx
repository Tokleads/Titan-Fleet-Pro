import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { session } from "@/lib/session";
import { NotificationBell } from "@/components/NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  Users,
  ClipboardCheck,
  Clock,
  ArrowLeft,
  UserPlus,
  LogOut,
  Search,
  X,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Filter,
  Calendar,
  Loader2,
  Activity,
  LayoutDashboard,
  ExternalLink,
  Download,
  Smartphone,
  Share2,
  MoreHorizontal,
  Truck,
} from "lucide-react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDuration(minutes?: number | null): string {
  if (!minutes) return "In Progress";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatTimeUK(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function liveDuration(arrivalTime: string): string {
  const ms = Date.now() - new Date(arrivalTime).getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h ${mins}m`;
}

interface OnShiftDriver {
  driverId: number;
  driverName: string;
  depotName: string;
  latitude: string;
  longitude: string;
  arrivalTime: string;
  timesheetId?: number;
}

interface DriverLocation {
  id: number;
  driverId: number;
  latitude: string;
  longitude: string;
  speed: number;
  heading?: number;
  isStagnant: boolean;
  timestamp: string;
  driver?: { id: number; name: string; email: string };
}

interface Inspection {
  id: number;
  vehicleId: number;
  driverId: number;
  type: string;
  status: string;
  odometer?: number;
  createdAt: string;
  notes?: string;
  items?: any[];
  photos?: string[];
  vrm?: string;
  driverName?: string;
  vehicleName?: string;
}

interface Timesheet {
  id: number;
  driverId: number;
  depotId: number;
  depotName: string;
  arrivalTime: string;
  departureTime?: string;
  totalMinutes?: number;
  status: string;
  driver?: { name: string; email: string };
}

interface Driver {
  id: number;
  name: string;
  email: string;
  role: string;
  active?: boolean;
}

interface Geofence {
  id: number;
  name: string;
  companyId: number;
  latitude?: string;
  longitude?: string;
}

type TabId = "map" | "onduty" | "checks" | "timesheets" | "more";

const TABS: { id: TabId; label: string; icon: typeof Navigation }[] = [
  { id: "map", label: "Map", icon: Navigation },
  { id: "onduty", label: "On Duty", icon: Users },
  { id: "checks", label: "Checks", icon: ClipboardCheck },
  { id: "timesheets", label: "Timesheets", icon: Clock },
  { id: "more", label: "More", icon: MoreHorizontal },
];

function MapTab({
  companyId,
  active,
}: {
  companyId: number;
  active: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  const { data: locations } = useQuery<DriverLocation[]>({
    queryKey: ["app-driver-locations", companyId],
    queryFn: async () => {
      const res = await fetch(
        `/api/manager/driver-locations/${companyId}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Failed to fetch locations");
      return res.json();
    },
    enabled: !!companyId && active,
    refetchInterval: 30000,
  });

  const { data: onShiftDrivers } = useQuery<OnShiftDriver[]>({
    queryKey: ["app-on-shift", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/on-shift/${companyId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch on-shift drivers");
      return res.json();
    },
    enabled: !!companyId && active,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    const map = L.map(mapRef.current).setView([53.5, -1.5], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    leafletMapRef.current = map;
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (active && leafletMapRef.current) {
      setTimeout(() => leafletMapRef.current?.invalidateSize(), 100);
    }
  }, [active]);

  useEffect(() => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;
    const markers = markersRef.current;
    markers.forEach((m) => m.remove());
    markers.clear();
    const allBounds: [number, number][] = [];
    const driversWithGPS = new Set<number>();

    if (locations?.length) {
      locations.forEach((loc) => {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);
        if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;
        driversWithGPS.add(loc.driverId);
        const color = loc.isStagnant ? "#ef4444" : "#22c55e";
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:18px;height:18px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(
          `<div style="font-family:Inter,system-ui,sans-serif;min-width:150px;">
            <strong style="font-size:14px;color:#0f172a;">${loc.driver?.name || "Driver"}</strong>
            <p style="margin:4px 0 0;font-size:12px;color:#475569;">Speed: ${loc.speed} km/h</p>
            <p style="margin:2px 0 0;font-size:12px;color:#475569;">Updated: ${formatTimeUK(loc.timestamp)}</p>
            ${loc.isStagnant ? '<p style="color:#ef4444;font-weight:600;margin:4px 0 0;font-size:12px;">⚠️ Stagnant</p>' : ""}
          </div>`
        );
        markers.set(loc.driverId, marker);
        allBounds.push([lat, lng]);
      });
    }

    if (onShiftDrivers?.length) {
      onShiftDrivers.forEach((d) => {
        if (driversWithGPS.has(d.driverId)) return;
        const lat = parseFloat(d.latitude);
        const lng = parseFloat(d.longitude);
        if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:18px;height:18px;background:#8b5cf6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(
          `<div style="font-family:Inter,system-ui,sans-serif;min-width:150px;">
            <strong style="font-size:14px;color:#0f172a;">${d.driverName}</strong>
            <p style="margin:4px 0 0;font-size:12px;color:#475569;">📍 ${d.depotName}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#475569;">🕐 ${formatTimeUK(d.arrivalTime)}</p>
          </div>`
        );
        markers.set(d.driverId, marker);
        allBounds.push([lat, lng]);
      });
    }

    if (allBounds.length > 0) {
      try {
        map.fitBounds(L.latLngBounds(allBounds), { padding: [40, 40] });
      } catch {}
    }
  }, [locations, onShiftDrivers]);

  const onDutyCount = onShiftDrivers?.length || 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur-sm border-b border-slate-200/60" data-testid="map-status-bar">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 animate-pulse text-emerald-500" />
          <span className="text-sm font-medium text-slate-700">{onDutyCount} driver{onDutyCount !== 1 ? "s" : ""} on duty</span>
        </div>
        <span className="text-xs text-slate-400">Updates every 30s</span>
      </div>
      <div ref={mapRef} className="flex-1" data-testid="map-container" />
      {onDutyCount === 0 && (
        <div className="absolute inset-0 top-[100px] flex flex-col items-center justify-center bg-white/80 z-[1000]" data-testid="map-empty-state">
          <MapPin className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No drivers currently on shift</p>
          <p className="text-sm text-slate-400 mt-1">Locations appear when drivers clock in</p>
        </div>
      )}
    </div>
  );
}

function OnDutyTab({ companyId }: { companyId: number }) {
  const queryClient = useQueryClient();
  const user = session.getUser();
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [selectedDepotId, setSelectedDepotId] = useState<number | null>(null);

  const { data: onShiftDrivers, isLoading } = useQuery<OnShiftDriver[]>({
    queryKey: ["app-on-shift", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/on-shift/${companyId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!companyId,
    refetchInterval: 30000,
  });

  const { data: allDrivers } = useQuery<Driver[]>({
    queryKey: ["app-all-drivers", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/users/${companyId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      const users = await res.json();
      return users.filter((u: Driver) => u.role === "DRIVER" || u.role === "driver");
    },
    enabled: !!companyId,
  });

  const { data: geofences } = useQuery<Geofence[]>({
    queryKey: ["app-geofences", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/geofences/${companyId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!companyId,
  });

  const clockOutMutation = useMutation({
    mutationFn: async (driverId: number) => {
      const res = await fetch("/api/manager/clock-out-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ driverId, companyId, managerId: user?.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to clock out");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-on-shift"] });
      queryClient.invalidateQueries({ queryKey: ["app-driver-locations"] });
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async ({
      driverId,
      depotId,
    }: {
      driverId: number;
      depotId?: number;
    }) => {
      const depot = geofences?.find((g) => g.id === depotId);
      const res = await fetch("/api/manager/clock-in-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          driverId,
          companyId,
          depotId: depotId || undefined,
          depotName: depot?.name || undefined,
          managerId: user?.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to clock in");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-on-shift"] });
      queryClient.invalidateQueries({ queryKey: ["app-driver-locations"] });
      setShowClockInModal(false);
      setSelectedDriverId(null);
      setSelectedDepotId(null);
      setDriverSearch("");
    },
  });

  const onShiftIds = new Set(onShiftDrivers?.map((d) => d.driverId) || []);
  const availableDrivers = (allDrivers || []).filter(
    (d) => !onShiftIds.has(d.id) && d.active !== false
  );
  const filteredDrivers = driverSearch
    ? availableDrivers.filter((d) =>
        d.name.toLowerCase().includes(driverSearch.toLowerCase())
      )
    : availableDrivers;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-slate-200/60 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "Oswald, sans-serif" }} data-testid="text-on-duty-count">
          {onShiftDrivers?.length || 0} Drivers On Duty
        </h2>
        {user?.role !== 'PLANNER' && (
        <button
          onClick={() => setShowClockInModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[56px]"
          data-testid="button-clock-in"
        >
          <UserPlus className="h-4 w-4" />
          Clock In
        </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : !onShiftDrivers?.length ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No drivers on shift</p>
            <p className="text-sm text-slate-400 mt-1">Tap Clock In to add a driver</p>
          </div>
        ) : (
          onShiftDrivers.map((driver) => (
            <div
              key={driver.driverId}
              className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4"
              data-testid={`card-driver-${driver.driverId}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link href="/manager/drivers" className="font-semibold text-blue-700 hover:underline" data-testid={`link-driver-${driver.driverId}`}>{driver.driverName}</Link>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm text-slate-500">{driver.depotName || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400">
                      Arrived: {formatTimeUK(driver.arrivalTime)}
                    </span>
                    <span className={`text-xs font-medium ${
                      (Date.now() - new Date(driver.arrivalTime).getTime()) / 60000 >= 840
                        ? "text-red-600 font-bold"
                        : "text-blue-600"
                    }`}>
                      {liveDuration(driver.arrivalTime)}
                    </span>
                  </div>
                </div>
                {user?.role !== 'PLANNER' && (
                <button
                  onClick={() => clockOutMutation.mutate(driver.driverId)}
                  disabled={clockOutMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 active:bg-red-200 transition-colors min-h-[44px]"
                  data-testid={`button-clock-out-${driver.driverId}`}
                >
                  <LogOut className="h-4 w-4" />
                  Clock Out
                </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showClockInModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
            onClick={() => setShowClockInModal(false)}
            data-testid="modal-clock-in"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: "Oswald, sans-serif" }}>
                  Clock In Driver
                </h3>
                <button
                  onClick={() => setShowClockInModal(false)}
                  className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
                  data-testid="button-close-clock-in"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Search Driver
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      placeholder="Search by name..."
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="input-driver-search"
                    />
                  </div>
                  <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {filteredDrivers.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No available drivers</p>
                    ) : (
                      filteredDrivers.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDriverId(d.id)}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors min-h-[44px] ${
                            selectedDriverId === d.id
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                          data-testid={`select-driver-${d.id}`}
                        >
                          {d.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Depot / Location
                  </label>
                  <select
                    value={selectedDepotId || ""}
                    onChange={(e) =>
                      setSelectedDepotId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="select-depot"
                  >
                    <option value="">Select depot (optional)</option>
                    {geofences?.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    if (selectedDriverId) {
                      clockInMutation.mutate({
                        driverId: selectedDriverId,
                        depotId: selectedDepotId || undefined,
                      });
                    }
                  }}
                  disabled={!selectedDriverId || clockInMutation.isPending}
                  className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px] flex items-center justify-center gap-2"
                  data-testid="button-confirm-clock-in"
                >
                  {clockInMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Clock In Driver
                    </>
                  )}
                </button>
                {clockInMutation.isError && (
                  <p className="text-sm text-red-600 text-center mt-2" data-testid="text-clock-in-error">
                    {clockInMutation.error?.message || "Failed to clock in"}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChecksTab({ companyId }: { companyId: number }) {
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  const { data: inspectionsData, isLoading } = useQuery<{
    inspections: Inspection[];
    total: number;
  }>({
    queryKey: ["app-inspections", companyId],
    queryFn: async () => {
      const res = await fetch(
        `/api/manager/inspections/${companyId}?limit=50&offset=0`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: vehiclesData } = useQuery<{ vehicles: any[] }>({
    queryKey: ["app-vehicles", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles?companyId=${companyId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: usersData } = useQuery<Driver[]>({
    queryKey: ["app-users", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/users/${companyId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!companyId,
  });

  const vehicles = vehiclesData?.vehicles || [];
  const inspections = inspectionsData?.inspections || [];

  const getVrm = (vehicleId: number) =>
    vehicles.find((v: any) => v.id === vehicleId)?.vrm || "—";
  const getDriverName = (driverId: number) =>
    usersData?.find((u) => u.id === driverId)?.name || "Unknown";

  const resultColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "PASS") return "bg-emerald-50 text-emerald-700";
    if (s === "FAIL") return "bg-red-50 text-red-700";
    return "bg-amber-50 text-amber-700";
  };

  const resultIcon = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "PASS") return <CheckCircle2 className="h-3.5 w-3.5" />;
    if (s === "FAIL") return <XCircle className="h-3.5 w-3.5" />;
    return <AlertTriangle className="h-3.5 w-3.5" />;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-slate-200/60 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "Oswald, sans-serif" }} data-testid="text-checks-title">
            Driver Checks
          </h2>
          <p className="text-xs text-slate-400">{inspections.length} recent inspections</p>
        </div>
        <Link href="/manager/inspections" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors min-h-[44px]" data-testid="link-all-inspections">
          View All <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : inspections.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No inspections found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {inspections.map((insp) => (
              <button
                key={insp.id}
                onClick={() => setSelectedInspection(insp)}
                className="w-full text-left px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center gap-3 min-h-[56px]"
                data-testid={`card-inspection-${insp.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 text-sm">
                      {getDriverName(insp.driverId)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${resultColor(insp.status)}`}>
                      {resultIcon(insp.status)}
                      {insp.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-slate-500">
                      {getVrm(insp.vehicleId)}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-400">
                      {formatRelativeDate(insp.createdAt)} {formatTimeUK(insp.createdAt)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedInspection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
            onClick={() => setSelectedInspection(null)}
            data-testid="modal-inspection-details"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: "Oswald, sans-serif" }}>
                  Inspection Details
                </h3>
                <button
                  onClick={() => setSelectedInspection(null)}
                  className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100"
                  data-testid="button-close-inspection"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase">Driver</p>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {getDriverName(selectedInspection.driverId)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase">Vehicle</p>
                    <p className="font-mono font-semibold text-slate-900 mt-0.5">
                      {getVrm(selectedInspection.vehicleId)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase">Date & Time</p>
                    <p className="text-sm text-slate-900 mt-0.5">
                      {formatRelativeDate(selectedInspection.createdAt)}{" "}
                      {formatTimeUK(selectedInspection.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase">Result</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mt-0.5 ${resultColor(selectedInspection.status)}`}>
                      {resultIcon(selectedInspection.status)}
                      {selectedInspection.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase">Type</p>
                    <p className="text-sm text-slate-900 mt-0.5 capitalize">
                      {selectedInspection.type?.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </div>
                  {selectedInspection.odometer && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase">Mileage</p>
                      <p className="font-mono text-sm text-slate-900 mt-0.5">
                        {selectedInspection.odometer.toLocaleString()} mi
                      </p>
                    </div>
                  )}
                </div>

                {selectedInspection.items && selectedInspection.items.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-2">Check Items</p>
                    <div className="space-y-1.5">
                      {selectedInspection.items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 text-sm"
                        >
                          <span className="text-slate-700">{item.label || item.name || `Item ${idx + 1}`}</span>
                          <span
                            className={`text-xs font-medium ${
                              item.status === "PASS" || item.result === "ok"
                                ? "text-emerald-600"
                                : item.status === "FAIL" || item.result === "defect"
                                ? "text-red-600"
                                : "text-amber-600"
                            }`}
                          >
                            {item.status || item.result || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedInspection.notes && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Notes</p>
                    <p className="text-sm text-slate-600">{selectedInspection.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type DatePreset = "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "custom";

function getDatePresetRange(preset: DatePreset): { start: string; end: string } {
  const today = new Date();
  const toISO = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "today":
      return { start: toISO(today), end: toISO(today) };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { start: toISO(y), end: toISO(y) };
    }
    case "thisWeek": {
      const dow = today.getDay();
      const mon = new Date(today);
      mon.setDate(today.getDate() - ((dow + 6) % 7));
      return { start: toISO(mon), end: toISO(today) };
    }
    case "lastWeek": {
      const dow = today.getDay();
      const thisMon = new Date(today);
      thisMon.setDate(today.getDate() - ((dow + 6) % 7));
      const lastMon = new Date(thisMon);
      lastMon.setDate(thisMon.getDate() - 7);
      const lastSun = new Date(thisMon);
      lastSun.setDate(thisMon.getDate() - 1);
      return { start: toISO(lastMon), end: toISO(lastSun) };
    }
    case "thisMonth": {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: toISO(first), end: toISO(today) };
    }
    case "lastMonth": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: toISO(first), end: toISO(last) };
    }
    default:
      return { start: toISO(new Date(Date.now() - 7 * 86400000)), end: toISO(today) };
  }
}

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This Week",
  lastWeek: "Last Week",
  thisMonth: "This Month",
  lastMonth: "Last Month",
  custom: "Custom Range",
};

function TimesheetsTab({ companyId }: { companyId: number }) {
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [driverSearch, setDriverSearch] = useState("");
  const [activePreset, setActivePreset] = useState<DatePreset>("thisWeek");
  const [dateRange, setDateRange] = useState(() => getDatePresetRange("thisWeek"));
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const handlePresetChange = (preset: DatePreset) => {
    setActivePreset(preset);
    if (preset !== "custom") {
      setDateRange(getDatePresetRange(preset));
    }
  };

  const { data: timesheets, isLoading } = useQuery<Timesheet[]>({
    queryKey: ["app-timesheets", companyId, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      const res = await fetch(`/api/timesheets/${companyId}?${params}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: drivers } = useQuery<Driver[]>({
    queryKey: ["app-all-drivers", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/users/${companyId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      const users = await res.json();
      return users.filter((u: Driver) => u.role === "DRIVER" || u.role === "driver");
    },
    enabled: !!companyId,
  });

  const filtered = useMemo(() => {
    if (!timesheets) return [];
    let result = timesheets;
    if (driverFilter !== "all") {
      result = result.filter((t) => t.driverId === Number(driverFilter));
    }
    return result;
  }, [timesheets, driverFilter]);

  const filteredDrivers = useMemo(() => {
    if (!drivers) return [];
    if (!driverSearch.trim()) return drivers;
    const q = driverSearch.toLowerCase();
    return drivers.filter((d) => d.name.toLowerCase().includes(q));
  }, [drivers, driverSearch]);

  const driverTimesheetSummary = useMemo(() => {
    if (!timesheets || !drivers) return [];
    const map = new Map<number, { driver: Driver; totalMinutes: number; entries: number; latestDate: string }>();
    for (const ts of timesheets) {
      const existing = map.get(ts.driverId);
      if (existing) {
        existing.totalMinutes += ts.totalMinutes || 0;
        existing.entries += 1;
        if (ts.arrivalTime > existing.latestDate) existing.latestDate = ts.arrivalTime;
      } else {
        const driver = drivers.find((d) => d.id === ts.driverId);
        if (driver) {
          map.set(ts.driverId, {
            driver,
            totalMinutes: ts.totalMinutes || 0,
            entries: 1,
            latestDate: ts.arrivalTime,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.latestDate.localeCompare(a.latestDate));
  }, [timesheets, drivers]);

  const filteredSummary = useMemo(() => {
    if (!driverSearch.trim()) return driverTimesheetSummary;
    const q = driverSearch.toLowerCase();
    return driverTimesheetSummary.filter((s) => s.driver.name.toLowerCase().includes(q));
  }, [driverTimesheetSummary, driverSearch]);

  if (selectedDriver) {
    const driverEntries = filtered.filter((t) => t.driverId === selectedDriver.id);
    const totalHours = driverEntries.reduce((sum, t) => sum + (t.totalMinutes || 0), 0);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-4 py-3 bg-white border-b border-slate-200/60">
          <button
            onClick={() => setSelectedDriver(null)}
            className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-2 min-h-[44px]"
            data-testid="button-back-to-drivers"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all drivers
          </button>
          <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "Oswald, sans-serif" }}>
            {selectedDriver.name}
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="bg-blue-50 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-blue-600 font-medium">{driverEntries.length} entries</span>
            </div>
            <div className="bg-emerald-50 px-3 py-1.5 rounded-lg">
              <span className={`text-xs font-medium ${totalHours >= 840 ? "text-red-600 font-bold" : "text-emerald-600"}`}>{formatDuration(totalHours)} total</span>
            </div>
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-slate-600 font-medium">
                {dateRange.start === dateRange.end
                  ? new Date(dateRange.start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                  : `${new Date(dateRange.start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(dateRange.end).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                }
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {driverEntries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No entries for this period</p>
              <p className="text-sm text-slate-400 mt-1">Try a different date range</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {driverEntries.map((ts) => (
                <div
                  key={ts.id}
                  className="px-4 py-3.5 hover:bg-slate-50 transition-colors"
                  data-testid={`card-timesheet-detail-${ts.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">
                          {new Date(ts.arrivalTime).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{ts.depotName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-600 font-medium">
                          {formatTimeUK(ts.arrivalTime)}
                          {ts.departureTime ? ` – ${formatTimeUK(ts.departureTime)}` : " – ongoing"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          ts.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {ts.status === "COMPLETED" ? "Completed" : "Active"}
                      </span>
                      <p className={`text-sm font-bold mt-1 ${
                        ts.totalMinutes && ts.totalMinutes >= 840 ? "text-red-600" : "text-slate-900"
                      }`}>
                        {formatDuration(ts.totalMinutes)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-slate-200/60">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "Oswald, sans-serif" }} data-testid="text-timesheets-title">
              Timesheets
            </h2>
          </div>
          <Link href="/manager/timesheets" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors min-h-[44px]" data-testid="link-all-timesheets">
            Full View <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] ${
                activePreset === preset
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              data-testid={`button-preset-${preset}`}
            >
              {DATE_PRESET_LABELS[preset]}
            </button>
          ))}
        </div>

        {activePreset === "custom" && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              data-testid="input-timesheet-start-date"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              data-testid="input-timesheet-end-date"
            />
          </div>
        )}

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search driver..."
            value={driverSearch}
            onChange={(e) => setDriverSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors"
            data-testid="input-search-driver-timesheets"
          />
          {driverSearch && (
            <button onClick={() => setDriverSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-400">
            {filteredSummary.length} driver{filteredSummary.length !== 1 ? "s" : ""} · {filtered.length} total entries
          </p>
          <p className="text-xs text-slate-400">
            {activePreset !== "custom" ? DATE_PRESET_LABELS[activePreset] : `${dateRange.start} – ${dateRange.end}`}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredSummary.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No timesheets found</p>
            <p className="text-sm text-slate-400 mt-1">Try a different date range or search term</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSummary.map((summary) => (
              <button
                key={summary.driver.id}
                onClick={() => setSelectedDriver(summary.driver)}
                className="w-full px-4 py-3.5 hover:bg-slate-50 transition-colors text-left"
                data-testid={`card-driver-timesheet-${summary.driver.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">
                          {summary.driver.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {summary.entries} entr{summary.entries !== 1 ? "ies" : "y"} · Last: {formatRelativeDate(summary.latestDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${summary.totalMinutes >= 840 ? "text-red-600" : "text-slate-900"}`}>{formatDuration(summary.totalMinutes)}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MoreTab({ companyName }: { companyName: string }) {
  const [, setLocation] = useLocation();
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const handleShare = async (url: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-4 bg-white border-b border-slate-200/60">
        <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "Oswald, sans-serif" }} data-testid="text-more-title">
          Download Apps
        </h2>
        <p className="text-sm text-slate-500 mt-1">Install to your phone's home screen for quick access</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="bg-slate-900 px-5 py-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base" style={{ fontFamily: "Oswald, sans-serif" }}>TM Manager App</h3>
              <p className="text-slate-400 text-xs">For Transport Managers</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm text-slate-600">
              The app you're using right now. Install it to your home screen for instant access — no app store needed.
            </p>
            <button
              onClick={() => handleShare(`${appUrl}/manager/app`, `${companyName} - TM Manager App`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[56px]"
              data-testid="button-share-tm-app"
            >
              <Share2 className="h-4 w-4" />
              Share / Copy Link
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="bg-emerald-700 px-5 py-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base" style={{ fontFamily: "Oswald, sans-serif" }}>Driver App</h3>
              <p className="text-emerald-300 text-xs">For your drivers</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm text-slate-600">
              Send this link to your drivers so they can install the Driver App on their phone for inspections, clock in/out, and deliveries.
            </p>
            <button
              onClick={() => handleShare(`${appUrl}/app`, `${companyName} - Driver App`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-colors min-h-[56px]"
              data-testid="button-share-driver-app"
            >
              <Share2 className="h-4 w-4" />
              Share Driver App Link
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl border border-blue-100 p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-3" style={{ fontFamily: "Oswald, sans-serif" }}>
            How to Install
          </h3>
          {isIOS ? (
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><span className="font-bold text-blue-600 flex-shrink-0">1.</span> Tap the <strong>Share</strong> button (box with arrow) in Safari</li>
              <li className="flex gap-2"><span className="font-bold text-blue-600 flex-shrink-0">2.</span> Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li className="flex gap-2"><span className="font-bold text-blue-600 flex-shrink-0">3.</span> Tap <strong>"Add"</strong> — the app icon will appear on your home screen</li>
            </ol>
          ) : isAndroid ? (
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><span className="font-bold text-blue-600 flex-shrink-0">1.</span> Tap the <strong>three dots menu</strong> (⋮) in Chrome</li>
              <li className="flex gap-2"><span className="font-bold text-blue-600 flex-shrink-0">2.</span> Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
              <li className="flex gap-2"><span className="font-bold text-blue-600 flex-shrink-0">3.</span> Tap <strong>"Add"</strong> — the app icon will appear on your home screen</li>
            </ol>
          ) : (
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><span className="font-bold text-blue-600 flex-shrink-0">1.</span> Open the link on your phone in <strong>Safari</strong> (iPhone) or <strong>Chrome</strong> (Android)</li>
              <li className="flex gap-2"><span className="font-bold text-blue-600 flex-shrink-0">2.</span> Use the browser menu to select <strong>"Add to Home Screen"</strong></li>
              <li className="flex gap-2"><span className="font-bold text-blue-600 flex-shrink-0">3.</span> The app will appear as an icon on your home screen</li>
            </ol>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>
            Quick Links
          </h3>
          <Link
            href="/manager"
            className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors min-h-[56px]"
            data-testid="link-full-dashboard-more"
          >
            <LayoutDashboard className="h-5 w-5 text-slate-500" />
            <div className="flex-1">
              <p className="font-medium text-sm text-slate-900">Full Dashboard</p>
              <p className="text-xs text-slate-400">Desktop management console</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>
          <Link
            href="/manager/drivers"
            className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors min-h-[56px]"
            data-testid="link-all-drivers-more"
          >
            <Users className="h-5 w-5 text-slate-500" />
            <div className="flex-1">
              <p className="font-medium text-sm text-slate-900">All Drivers</p>
              <p className="text-xs text-slate-400">Manage driver accounts</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>
          <Link
            href="/manager/fleet"
            className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors min-h-[56px]"
            data-testid="link-fleet-more"
          >
            <Truck className="h-5 w-5 text-slate-500" />
            <div className="flex-1">
              <p className="font-medium text-sm text-slate-900">Fleet</p>
              <p className="text-xs text-slate-400">Vehicles and compliance</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TransportManagerApp() {
  const [, setLocation] = useLocation();
  const user = session.getUser();
  const company = session.getCompany();
  const [activeTab, setActiveTab] = useState<TabId>("map");

  useEffect(() => {
    if (!user || !company) {
      setLocation("/manager/login");
    }
  }, [user, company, setLocation]);

  if (!user || !company) return null;

  const companyId = company.id;

  return (
    <div className="h-screen flex flex-col bg-slate-50" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between z-20 safe-area-top" data-testid="app-header">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/manager"
            className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
            data-testid="link-back-dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-semibold truncate" data-testid="text-company-name">
            {company.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/manager"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors"
            data-testid="link-full-dashboard"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <Link
            href="/manager/drivers"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors"
            data-testid="link-all-drivers"
          >
            <Users className="h-3.5 w-3.5" />
            Drivers
          </Link>
          <NotificationBell />
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === "map" && <MapTab companyId={companyId} active={activeTab === "map"} />}
            {activeTab === "onduty" && <OnDutyTab companyId={companyId} />}
            {activeTab === "checks" && <ChecksTab companyId={companyId} />}
            {activeTab === "timesheets" && <TimesheetsTab companyId={companyId} />}
            {activeTab === "more" && <MoreTab companyName={company.name} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="bg-white border-t border-slate-200/60 flex safe-area-bottom z-20" data-testid="bottom-nav">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
                isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : ""}`} />
              <span className={`text-[11px] mt-0.5 font-medium ${isActive ? "text-blue-600" : ""}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 h-0.5 w-12 bg-blue-600 rounded-b-full"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
