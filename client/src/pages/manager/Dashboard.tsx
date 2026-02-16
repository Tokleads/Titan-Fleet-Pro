import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { 
  ClipboardCheck, 
  AlertTriangle, 
  Truck, 
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Fuel,
  Shield,
  Check,
  Users,
  MessageSquare,
  AlertOctagon,
  Mail,
  FileWarning,
  Package,
  MapPin
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { SkeletonCard, SkeletonComplianceScore } from "@/components/titan-ui/Skeleton";
import { HelpTooltip } from "@/components/titan-ui/HelpTooltip";
import UKDriverMap from "@/components/UKDriverMap";
import { VehicleDetailModal } from "@/components/VehicleDetailModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DriverMessage {
  id: number;
  companyId: number;
  senderId: number;
  subject: string | null;
  content: string;
  priority: string | null;
  readAt: string | null;
  createdAt: string;
  sender?: { id: number; name: string; role: string };
}

interface DashboardStats {
  inspectionsToday: number;
  openDefects: number;
  vehiclesDue: number;
  totalVehicles: number;
}

interface Defect {
  id: number;
  vehicleId: number;
  severity: string;
  status: string;
  description: string;
  vrm?: string;
  vehicleReg?: string;
  createdAt: string;
  reportedBy?: string;
}

function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function isToday(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
}

export default function ManagerDashboard() {
  const company = session.getCompany();
  const companyId = company?.id;
  const user = session.getUser();
  const queryClient = useQueryClient();
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [showMissedInspections, setShowMissedInspections] = useState(false);

  const { data: allVehiclesData } = useQuery({
    queryKey: ["all-vehicles-lookup", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles?companyId=${companyId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!companyId,
  });
  const vrmToIdMap = new Map(((allVehiclesData as any)?.vehicles || (Array.isArray(allVehiclesData) ? allVehiclesData : [])).map((v: any) => [v.vrm, v.id]));

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["manager-stats", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/stats/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!companyId,
    refetchInterval: 30000,
  });

  const { data: inspections, isLoading: inspectionsLoading } = useQuery({
    queryKey: ["manager-inspections", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/inspections/${companyId}?limit=20`);
      if (!res.ok) throw new Error("Failed to fetch inspections");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: users } = useQuery({
    queryKey: ["users", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/users/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: driverMessages, isLoading: messagesLoading } = useQuery<DriverMessage[]>({
    queryKey: ["manager-messages", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/messages/${companyId}?limit=10`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!companyId,
    refetchInterval: 30000,
  });

  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ["manager-messages-unread", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/messages/${companyId}/unread-count`);
      if (!res.ok) throw new Error("Failed to fetch unread count");
      return res.json();
    },
    enabled: !!companyId,
    refetchInterval: 30000,
  });

  const unreadCount = unreadCountData?.count || 0;

  const { data: complianceScore, isLoading: complianceLoading } = useQuery<{
    score: number;
    breakdown: { inspections: number; defects: number; mot: number; vor: number };
    grade: string;
  }>({
    queryKey: ["compliance-score", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/compliance-score/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch compliance score");
      return res.json();
    },
    enabled: !!companyId,
    refetchInterval: 60000,
  });

  const { data: defects } = useQuery<Defect[]>({
    queryKey: ["manager-defects", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/defects/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch defects");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: onShiftDrivers } = useQuery<Array<{ driverId: number; driverName: string; depotName: string; latitude: string; longitude: string; arrivalTime: string }>>({
    queryKey: ["on-shift-drivers", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/on-shift/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch on-shift drivers");
      return res.json();
    },
    enabled: !!companyId,
    refetchInterval: 30000,
  });

  async function handleMessageClick(msg: DriverMessage) {
    if (expandedMessageId === msg.id) {
      setExpandedMessageId(null);
      return;
    }
    setExpandedMessageId(msg.id);
    if (!msg.readAt) {
      try {
        await fetch(`/api/manager/messages/${msg.id}/read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId }),
        });
        queryClient.invalidateQueries({ queryKey: ["manager-messages", companyId] });
        queryClient.invalidateQueries({ queryKey: ["manager-messages-unread", companyId] });
      } catch (e) {}
    }
  }

  const vehiclesList: any[] = Array.isArray(vehicles) ? vehicles : (vehicles?.vehicles || []);
  const inspectionsList: any[] = Array.isArray(inspections) ? inspections : (inspections?.inspections || []);
  const usersList: any[] = Array.isArray(users) ? users : (users || []);
  const defectsList: Defect[] = Array.isArray(defects) ? defects : (defects || []);

  const activeVehicles = vehiclesList.filter((v: any) => v.active).length;
  const vorVehicles = vehiclesList.filter((v: any) => v.vorStatus === true || v.vorStatus === 'VOR' || v.vorStatus === 'vor').length;
  const activeDrivers = usersList.filter((u: any) => (u.role === 'driver' || u.role === 'DRIVER') && u.active).length;
  const totalDrivers = usersList.filter((u: any) => u.role === 'driver' || u.role === 'DRIVER').length;

  const todayInspections = inspectionsList.filter((i: any) => isToday(i.createdAt));
  const todayPassed = todayInspections.filter((i: any) => i.result === 'PASS' || i.status === 'PASS').length;
  const todayFailed = todayInspections.filter((i: any) => i.result === 'FAIL' || i.status === 'FAIL').length;

  const openDefects = defectsList.filter((d: Defect) => d.status?.toUpperCase() === 'OPEN');
  const criticalDefects = openDefects.filter((d: Defect) => d.severity?.toUpperCase() === 'CRITICAL');
  const highDefects = openDefects.filter((d: Defect) => d.severity?.toUpperCase() === 'HIGH');

  const inspectedVrms = new Set(todayInspections.map((i: any) => i.vrm?.toUpperCase()));
  const activeVehiclesList = vehiclesList.filter((v: any) => v.active);
  const missedInspections = activeVehiclesList.filter((v: any) => !inspectedVrms.has(v.vrm?.toUpperCase()));

  const now = new Date();
  const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const expiringVehicles = vehiclesList.filter((v: any) => {
    const motExpiry = v.motDue ? new Date(v.motDue) : null;
    const taxExpiry = v.taxDue ? new Date(v.taxDue) : null;
    return (motExpiry && motExpiry <= fourteenDaysFromNow && motExpiry >= now) ||
           (taxExpiry && taxExpiry <= fourteenDaysFromNow && taxExpiry >= now);
  });

  const score = complianceScore?.score || 0;
  const fleetStatusColor = score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'red';
  const fleetStatusLabel = score >= 80 ? 'Operational' : score >= 60 ? 'Needs Attention' : 'Critical';

  const attentionItemsCount = missedInspections.length + criticalDefects.length + highDefects.length + unreadCount + expiringVehicles.length;

  return (
    <ManagerLayout>
      <div className="space-y-6 titan-page-enter">
        {/* Header */}
        <div className={`bg-gradient-to-br ${fleetStatusColor === 'emerald' ? 'from-emerald-600 to-emerald-800' : fleetStatusColor === 'amber' ? 'from-amber-600 to-amber-800' : 'from-red-600 to-red-800'} rounded-2xl p-6 md:p-8 text-white shadow-xl`} data-testid="header-greeting">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
                {getGreeting()}, {user?.name || 'Manager'}
              </h1>
              <p className="text-white/70 text-sm">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-white/60 uppercase tracking-wide">Fleet Status</p>
                <p className="text-xl font-bold">{fleetStatusLabel}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${fleetStatusColor === 'emerald' ? 'bg-white/20' : fleetStatusColor === 'amber' ? 'bg-white/20' : 'bg-white/20'}`}>
                {fleetStatusColor === 'emerald' ? (
                  <CheckCircle2 className="h-6 w-6 text-white" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
          </div>
          {score > 0 && (
            <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl">
              <Shield className="h-4 w-4 text-white/80" />
              <span className="text-sm text-white/90">Compliance Score: <strong>{score}%</strong> ({complianceScore?.grade})</span>
              <span className="text-xs text-white/60 ml-auto">DVSA-compliant • Audit-ready</span>
            </div>
          )}
        </div>

        {/* Shift Overview Row */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => setLocation("/manager/drivers")} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm text-left hover:shadow-md hover:border-slate-300 transition-all cursor-pointer" data-testid="stat-drivers-active">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Drivers on Shift</p>
                  <p className="text-3xl font-bold text-slate-900">{onShiftDrivers?.length || 0}</p>
                  <p className="text-xs text-slate-400">{totalDrivers} registered drivers</p>
                </div>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-100 shadow-sm">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </button>

            <button onClick={() => setLocation("/manager/inspections")} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm text-left hover:shadow-md hover:border-slate-300 transition-all cursor-pointer" data-testid="stat-inspections-today">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Inspections Today</p>
                  <p className="text-3xl font-bold text-slate-900">{todayInspections.length}</p>
                  <div className="flex items-center gap-2">
                    {todayPassed > 0 && (
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> {todayPassed} pass
                      </span>
                    )}
                    {todayFailed > 0 && (
                      <span className="text-xs font-medium text-red-600 flex items-center gap-0.5">
                        <XCircle className="h-3 w-3" /> {todayFailed} fail
                      </span>
                    )}
                    {todayInspections.length === 0 && (
                      <span className="text-xs text-slate-400">Waiting for first check</span>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-emerald-100 shadow-sm">
                  <ClipboardCheck className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </button>

            <button onClick={() => setLocation("/manager/defects")} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm text-left hover:shadow-md hover:border-slate-300 transition-all cursor-pointer" data-testid="stat-open-defects">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Open Defects</p>
                  <p className="text-3xl font-bold text-slate-900">{openDefects.length}</p>
                  <div className="flex items-center gap-2">
                    {criticalDefects.length > 0 && (
                      <span className="text-xs font-medium text-red-600">{criticalDefects.length} critical</span>
                    )}
                    {highDefects.length > 0 && (
                      <span className="text-xs font-medium text-amber-600">{highDefects.length} high</span>
                    )}
                    {openDefects.length === 0 && (
                      <span className="text-xs text-emerald-600 flex items-center gap-0.5"><Check className="h-3 w-3" /> All clear</span>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-amber-100 shadow-sm">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </button>

            <button onClick={() => setLocation("/manager/fleet")} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm text-left hover:shadow-md hover:border-slate-300 transition-all cursor-pointer" data-testid="stat-vor-vehicles">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">VOR Vehicles</p>
                  <p className="text-3xl font-bold text-slate-900">{vorVehicles}</p>
                  <p className="text-xs text-slate-400">{vehiclesList.length} vehicles in fleet</p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm ${vorVehicles > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                  <Truck className={`h-6 w-6 ${vorVehicles > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
                </div>
              </div>
            </button>
          </div>
        )}


        {/* Attention Required Section */}
        {attentionItemsCount > 0 && (
          <div className="space-y-3" data-testid="section-attention-required">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-amber-600" />
              Attention Required
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{attentionItemsCount}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {missedInspections.length > 0 && (
                <button
                  onClick={() => setShowMissedInspections(true)}
                  className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 text-left w-full hover:shadow-md hover:border-amber-300 transition-all cursor-pointer"
                  data-testid="attention-missed-inspections"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <FileWarning className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Missed Inspections</p>
                      <p className="text-xs font-bold text-amber-700">{missedInspections.length} vehicles</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 line-clamp-2">
                    {missedInspections.slice(0, 3).map((v: any, idx: number) => (
                      <span key={v.id || idx}>
                        {idx > 0 && ', '}
                        {v.vrm}
                      </span>
                    ))}
                    {missedInspections.length > 3 && ` +${missedInspections.length - 3} more`}
                  </p>
                </button>
              )}

              {(criticalDefects.length > 0 || highDefects.length > 0) && (
                <button
                  onClick={() => setLocation("/manager/defects")}
                  className={`${criticalDefects.length > 0 ? 'bg-red-50 border-red-200/60 hover:border-red-300' : 'bg-amber-50 border-amber-200/60 hover:border-amber-300'} border rounded-2xl p-4 text-left w-full hover:shadow-md transition-all cursor-pointer`}
                  data-testid="attention-critical-defects"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${criticalDefects.length > 0 ? 'bg-red-100' : 'bg-amber-100'}`}>
                      <AlertTriangle className={`h-4 w-4 ${criticalDefects.length > 0 ? 'text-red-600' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${criticalDefects.length > 0 ? 'text-red-900' : 'text-amber-900'}`}>Critical/High Defects</p>
                      <p className={`text-xs font-bold ${criticalDefects.length > 0 ? 'text-red-700' : 'text-amber-700'}`}>{criticalDefects.length + highDefects.length} open</p>
                    </div>
                  </div>
                  <p className={`text-xs ${criticalDefects.length > 0 ? 'text-red-700' : 'text-amber-700'} line-clamp-2`}>
                    {[...criticalDefects, ...highDefects].slice(0, 2).map((d: Defect, idx: number) => (
                      <span key={d.id || idx}>
                        {idx > 0 && '; '}
                        Vehicle: {d.description?.slice(0, 30) || 'Defect reported'}
                      </span>
                    ))}
                  </p>
                </button>
              )}

              {unreadCount > 0 && (
                <button
                  onClick={() => setLocation("/manager/messages")}
                  className="bg-blue-50 border border-blue-200/60 rounded-2xl p-4 text-left w-full hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                  data-testid="attention-unread-messages"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Unread Messages</p>
                      <p className="text-xs font-bold text-blue-700">{unreadCount} unread</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 line-clamp-2">
                    {driverMessages?.filter((m: DriverMessage) => !m.readAt).slice(0, 2).map((m: DriverMessage) => 
                      `${m.sender?.name || 'Driver'}: ${m.content?.slice(0, 30)}...`
                    ).join('; ') || 'New messages from drivers'}
                  </p>
                </button>
              )}

              {expiringVehicles.length > 0 && (
                <button
                  onClick={() => setLocation("/manager/reminders")}
                  className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 text-left w-full hover:shadow-md hover:border-amber-300 transition-all cursor-pointer"
                  data-testid="attention-expiring-docs"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-900">MOT/Tax Expiring</p>
                      <p className="text-xs font-bold text-amber-700">{expiringVehicles.length} vehicles</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 line-clamp-2">
                    {expiringVehicles.slice(0, 3).map((v: any, idx: number) => (
                      <span key={v.id || idx}>
                        {idx > 0 && ', '}
                        {v.vrm}
                      </span>
                    ))}
                    {expiringVehicles.length > 3 && ` +${expiringVehicles.length - 3} more`}
                  </p>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Live Driver Locations Map */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6" data-testid="section-driver-map">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Live Driver Locations
          </h2>
          <UKDriverMap drivers={onShiftDrivers || []} />
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Today's Inspections */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  Today's Inspections
                </h2>
                <Link href="/manager/inspections" className="text-sm text-blue-600 hover:text-blue-700 font-medium" data-testid="link-view-all-inspections">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {inspectionsLoading ? (
                  <div className="p-8 text-center text-slate-400">Loading inspections...</div>
                ) : todayInspections.length > 0 ? (
                  todayInspections.map((inspection: any) => (
                    <div key={inspection.id} className="p-4 hover:bg-slate-50 transition-colors" data-testid={`inspection-item-${inspection.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            inspection.result === 'PASS' ? 'bg-emerald-100' : 'bg-red-100'
                          }`}>
                            {inspection.result === 'PASS' ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); const id = vrmToIdMap.get(inspection.vrm); if (id) setSelectedVehicleId(id); }}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer bg-transparent border-none p-0"
                              >
                                {inspection.vrm}
                              </button>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                inspection.result === 'PASS' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {inspection.result}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                              <span>{inspection.driverName || 'Unknown Driver'}</span>
                              <span>•</span>
                              <span>{new Date(inspection.createdAt).toLocaleTimeString('en-GB', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 font-medium">No inspections completed yet today</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Inspections will appear here once drivers start their checks
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Driver Messages */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden" data-testid="section-driver-messages">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Driver Messages
                  {unreadCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">{unreadCount}</span>
                  )}
                </h2>
              </div>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {messagesLoading ? (
                  <div className="p-8 text-center text-slate-400">Loading messages...</div>
                ) : driverMessages && driverMessages.length > 0 ? (
                  driverMessages.map((msg: DriverMessage) => (
                    <div key={msg.id} data-testid={`message-item-${msg.id}`}>
                      <button
                        onClick={() => handleMessageClick(msg)}
                        className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${!msg.readAt ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                        data-testid={`button-message-${msg.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${!msg.readAt ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {msg.sender?.name || 'Driver'}
                              </span>
                              {msg.priority === 'urgent' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">URGENT</span>
                              )}
                            </div>
                            <p className={`text-sm mt-0.5 truncate ${!msg.readAt ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                              {msg.subject && <span className="font-bold">{msg.subject}: </span>}
                              {msg.content.length > 80 ? msg.content.slice(0, 80) + '...' : msg.content}
                            </p>
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{timeAgo(msg.createdAt)}</span>
                        </div>
                      </button>
                      {expandedMessageId === msg.id && (
                        <div className="px-4 pb-4 bg-slate-50 border-l-4 border-l-blue-200">
                          {msg.subject && <p className="text-sm font-bold text-slate-900 mb-1">{msg.subject}</p>}
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs text-slate-400 mt-2">From {msg.sender?.name || 'Driver'} • {new Date(msg.createdAt).toLocaleString('en-GB')}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 font-medium">No messages yet</p>
                    <p className="text-sm text-slate-400 mt-1">Messages from drivers will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Score Widget */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6" data-testid="widget-compliance-score">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Compliance Score
                <HelpTooltip term="Compliance Score" />
              </h2>
              {complianceLoading ? (
                <SkeletonComplianceScore />
              ) : complianceScore ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-center gap-6">
                    <div className="relative">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                        <circle cx="48" cy="48" r="40" fill="none"
                          stroke={complianceScore.score >= 80 ? '#10b981' : complianceScore.score >= 60 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - complianceScore.score / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-900">{complianceScore.score}</span>
                      </div>
                    </div>
                    <div className={`h-14 w-14 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-sm ${
                      complianceScore.score >= 80 ? 'bg-emerald-500' : complianceScore.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`} data-testid="compliance-grade">
                      {complianceScore.grade}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Inspections', value: complianceScore.breakdown.inspections, weight: '30%' },
                      { label: 'Defects', value: complianceScore.breakdown.defects, weight: '25%', tooltip: 'Defect Escalation' as const },
                      { label: 'MOT', value: complianceScore.breakdown.mot, weight: '25%' },
                      { label: 'VOR', value: complianceScore.breakdown.vor, weight: '20%', tooltip: 'VOR' as const },
                    ].map(item => (
                      <div key={item.label} data-testid={`compliance-breakdown-${item.label.toLowerCase()}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-600">{item.label}{'tooltip' in item && item.tooltip && <HelpTooltip term={item.tooltip} />} <span className="text-slate-400">({item.weight})</span></span>
                          <span className={`text-xs font-bold ${item.value >= 80 ? 'text-emerald-600' : item.value >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{item.value}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${item.value >= 80 ? 'bg-emerald-500' : item.value >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-500">Unable to load compliance score</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link 
              href="/manager/fleet"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 hover:border-blue-300 hover:shadow-sm transition-all group"
              data-testid="quick-link-fleet"
            >
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 shadow-sm">
                <Truck className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">View Fleet</span>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors ml-auto" />
            </Link>
            <Link 
              href="/manager/defects"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 hover:border-amber-300 hover:shadow-sm transition-all group"
              data-testid="quick-link-defects"
            >
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600 shadow-sm">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-slate-900 group-hover:text-amber-600 transition-colors">Manage Defects</span>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition-colors ml-auto" />
            </Link>
            <Link 
              href="/manager/fuel"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 hover:border-emerald-300 hover:shadow-sm transition-all group"
              data-testid="quick-link-fuel"
            >
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600 shadow-sm">
                <Fuel className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-slate-900 group-hover:text-emerald-600 transition-colors">Fuel Log</span>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors ml-auto" />
            </Link>
            <Link 
              href="/manager/deliveries"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 hover:border-purple-300 hover:shadow-sm transition-all group"
              data-testid="quick-link-deliveries"
            >
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600 shadow-sm">
                <Package className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-slate-900 group-hover:text-purple-600 transition-colors">Deliveries</span>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors ml-auto" />
            </Link>
          </div>
        </div>
      </div>
      {selectedVehicleId && (
        <VehicleDetailModal vehicleId={selectedVehicleId} onClose={() => setSelectedVehicleId(null)} />
      )}

      <Dialog open={showMissedInspections} onOpenChange={setShowMissedInspections}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-amber-600" />
              Missed Inspections Today
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 -mt-2">
            {missedInspections.length} vehicle{missedInspections.length !== 1 ? 's' : ''} not yet inspected today
          </p>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {missedInspections.map((v: any) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{v.vrm}</p>
                      <p className="text-xs text-slate-500">{v.make} {v.model}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowMissedInspections(false);
                      setSelectedVehicleId(v.id);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    data-testid={`view-vehicle-${v.id}`}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  );
}
