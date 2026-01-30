import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { VORWidget } from "@/components/VORWidget";
import { ServiceDueWidget } from "@/components/ServiceDueWidget";
import { ComplianceCountdownWidget } from "@/components/ComplianceCountdownWidget";
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
  Navigation,
  Radio,
  MapPin,
  Activity,
  TrendingUp,
  Users
} from "lucide-react";
import { Link } from "wouter";

interface DashboardStats {
  inspectionsToday: number;
  openDefects: number;
  vehiclesDue: number;
  totalVehicles: number;
}

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  iconBg,
  iconColor,
  statusText,
  statusType,
  subText,
  loading,
  trend
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType; 
  iconBg: string;
  iconColor: string;
  statusText?: string;
  statusType?: 'positive' | 'neutral' | 'warning' | 'danger';
  subText?: string;
  loading?: boolean;
  trend?: { value: number; direction: 'up' | 'down' };
}) {
  const statusColors = {
    positive: 'text-emerald-600',
    neutral: 'text-slate-500',
    warning: 'text-amber-600',
    danger: 'text-red-600'
  };

  return (
    <div 
      className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
      data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <div className="h-9 w-20 bg-slate-100 rounded-lg animate-pulse" />
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
                {trend && (
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${
                    trend.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`h-3 w-3 ${trend.direction === 'down' ? 'rotate-180' : ''}`} />
                    {trend.value}%
                  </span>
                )}
              </div>
              {statusText && (
                <p className={`text-xs font-medium flex items-center gap-1 ${statusColors[statusType || 'neutral']}`}>
                  {statusType === 'positive' && <Check className="h-3 w-3" />}
                  {statusText}
                </p>
              )}
              {subText && (
                <p className="text-xs text-slate-400">{subText}</p>
              )}
            </>
          )}
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBg} shadow-sm`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, count, color, testId, href }: { icon: React.ElementType; label: string; count?: number; color: string; testId: string; href?: string }) {
  return (
    <Link 
      href={href || '#'}
      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200/60 hover:border-blue-300 hover:shadow-sm transition-all group w-full" 
      data-testid={testId}
    >
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color} shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{label}</p>
        {count !== undefined && (
          <p className="text-xs text-slate-500">{count} items</p>
        )}
      </div>
      <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
    </Link>
  );
}

function ActivityItem({ icon: Icon, title, description, time, status }: {
  icon: React.ElementType;
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'info';
}) {
  const statusColors = {
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    info: 'bg-blue-100 text-blue-600'
  };

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${statusColors[status]} flex-shrink-0`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap">{time}</span>
    </div>
  );
}

export default function ManagerDashboard() {
  const company = session.getCompany();
  const companyId = company?.id;
  const user = session.getUser();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["manager-stats", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/stats/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!companyId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: inspections, isLoading: inspectionsLoading } = useQuery({
    queryKey: ["manager-inspections", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/inspections/${companyId}?limit=8`);
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

  const activeVehicles = vehicles?.filter((v: any) => v.isActive).length || 0;
  const activeDrivers = users?.filter((u: any) => u.role === 'driver' && u.active).length || 0;

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-[#0F172A] to-slate-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                Welcome back, {user?.name || 'Manager'}
              </h1>
              <p className="text-slate-300 text-sm">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Fleet Status</p>
                <p className="text-2xl font-bold text-emerald-400">Operational</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Compliance Banner */}
          <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-100">You're compliant today</span>
            <span className="text-xs text-emerald-300/70 ml-auto">
              DVSA-compliant records • Time-stamped & driver-signed • Audit-ready
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Inspections Today"
            value={stats?.inspectionsToday || 0}
            icon={ClipboardCheck}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            statusText={stats?.inspectionsToday === 0 ? "Waiting for first check" : "On track"}
            statusType={stats?.inspectionsToday === 0 ? "neutral" : "positive"}
            loading={statsLoading}
            trend={{ value: 12, direction: 'up' }}
          />
          <KPICard
            title="Open Defects"
            value={stats?.openDefects || 0}
            icon={AlertTriangle}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            statusText={stats?.openDefects === 0 ? "All clear" : `${stats?.openDefects} require attention`}
            statusType={stats?.openDefects === 0 ? "positive" : "warning"}
            loading={statsLoading}
          />
          <KPICard
            title="MOT Due"
            value={stats?.vehiclesDue || 0}
            icon={Calendar}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            statusText={stats?.vehiclesDue === 0 ? "No MOTs due soon" : `${stats?.vehiclesDue} vehicles due`}
            statusType={stats?.vehiclesDue === 0 ? "positive" : "warning"}
            loading={statsLoading}
          />
          <KPICard
            title="Active Vehicles"
            value={activeVehicles}
            icon={Truck}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            statusText={`${activeVehicles} active in fleet`}
            statusType="positive"
            subText={`${stats?.totalVehicles || 0} total vehicles`}
            loading={statsLoading}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions & Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Fuel className="h-5 w-5 text-blue-600" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QuickAction
                  icon={Navigation}
                  label="View Fleet"
                  count={activeVehicles}
                  color="bg-blue-100 text-blue-600"
                  testId="action-view-fleet"
                  href="/manager/fleet"
                />
                <QuickAction
                  icon={MapPin}
                  label="Manage Defects"
                  count={stats?.openDefects || 0}
                  color="bg-amber-100 text-amber-600"
                  testId="action-manage-defects"
                  href="/manager/defects"
                />
                <QuickAction
                  icon={Radio}
                  label="Titan Command"
                  color="bg-purple-100 text-purple-600"
                  testId="action-titan-command"
                  href="/manager/titan-command"
                />
                <QuickAction
                  icon={Clock}
                  label="View Timesheets"
                  color="bg-emerald-100 text-emerald-600"
                  testId="action-view-timesheets"
                  href="/manager/timesheets"
                />
              </div>
            </div>

            {/* Recent Inspections */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  Recent Inspections
                </h2>
                <Link href="/manager/inspections" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {inspectionsLoading ? (
                  <div className="p-8 text-center text-slate-400">
                    Loading inspections...
                  </div>
                ) : inspections && inspections.length > 0 ? (
                  inspections.slice(0, 5).map((inspection: any) => (
                    <div key={inspection.id} className="p-4 hover:bg-slate-50 transition-colors">
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
                              <span className="font-semibold text-slate-900">{inspection.vrm}</span>
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
                    <p className="text-slate-500 font-medium">No inspections yet</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Inspections will appear here once drivers start their checks
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Live Activity Feed */}
          <div className="space-y-6">
            {/* Fleet Overview */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Fleet Overview
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Vehicles</p>
                      <p className="text-xs text-slate-500">{activeVehicles} active</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{stats?.totalVehicles || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Drivers</p>
                      <p className="text-xs text-slate-500">{activeDrivers} active</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">{users?.length || 0}</span>
                </div>
              </div>
            </div>

             {/* Compliance Countdown Widget */}
            <ComplianceCountdownWidget companyId={companyId!} />

            {/* VOR Widget */}
            <VORWidget companyId={companyId!} />

            {/* Service Due Widget */}
            <ServiceDueWidget companyId={companyId!} />

            {/* Live Activity Feed */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Live Activity
                </h2>
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                {inspections && inspections.length > 0 ? (
                  inspections.slice(0, 6).map((inspection: any, index: number) => (
                    <ActivityItem
                      key={inspection.id}
                      icon={inspection.result === 'PASS' ? CheckCircle2 : AlertTriangle}
                      title={`${inspection.vrm} Inspection`}
                      description={`${inspection.driverName || 'Driver'} completed ${inspection.result.toLowerCase()} check`}
                      time={new Date(inspection.createdAt).toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      status={inspection.result === 'PASS' ? 'success' : 'warning'}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Activity className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
