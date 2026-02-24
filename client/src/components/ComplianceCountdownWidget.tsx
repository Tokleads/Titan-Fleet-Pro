import { useQuery } from "@tanstack/react-query";
import { Shield, Calendar, Wrench, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { getMOTCountdown, getTaxCountdown, getServiceCountdown } from "@/lib/countdown";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ComplianceCountdownWidgetProps {
  companyId: number;
}

export function ComplianceCountdownWidget({ companyId }: ComplianceCountdownWidgetProps) {
  const [, navigate] = useLocation();

  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ['vehicles', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles?companyId=${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
    refetchInterval: 60000
  });

  const vehicles = Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData?.vehicles || []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Compliance Overview</h3>
            <p className="text-sm text-slate-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate compliance statistics
  const stats = {
    mot: { overdue: 0, dueSoon: 0, ok: 0 },
    tax: { overdue: 0, dueSoon: 0, ok: 0 },
    service: { overdue: 0, dueSoon: 0, ok: 0 }
  };

  vehicles?.forEach((vehicle: any) => {
    // MOT
    const motCountdown = getMOTCountdown(vehicle.motDue);
    if (motCountdown) {
      if (motCountdown.isOverdue) stats.mot.overdue++;
      else if (motCountdown.urgency === 'danger' || motCountdown.urgency === 'warning') stats.mot.dueSoon++;
      else stats.mot.ok++;
    }

    // Tax
    const taxCountdown = getTaxCountdown(vehicle.taxDue);
    if (taxCountdown) {
      if (taxCountdown.isOverdue) stats.tax.overdue++;
      else if (taxCountdown.urgency === 'danger' || taxCountdown.urgency === 'warning') stats.tax.dueSoon++;
      else stats.tax.ok++;
    }

    // Service
    const serviceCountdown = getServiceCountdown(vehicle.nextServiceDue);
    if (serviceCountdown) {
      if (serviceCountdown.isOverdue) stats.service.overdue++;
      else if (serviceCountdown.urgency === 'danger' || serviceCountdown.urgency === 'warning') stats.service.dueSoon++;
      else stats.service.ok++;
    }
  });

  const totalOverdue = stats.mot.overdue + stats.tax.overdue + stats.service.overdue;
  const totalDueSoon = stats.mot.dueSoon + stats.tax.dueSoon + stats.service.dueSoon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Compliance Overview</h3>
            <p className="text-sm text-slate-500">
              {totalOverdue > 0 ? (
                <span className="text-red-600 font-medium">{totalOverdue} overdue</span>
              ) : totalDueSoon > 0 ? (
                <span className="text-amber-600 font-medium">{totalDueSoon} due soon</span>
              ) : (
                <span className="text-emerald-600 font-medium">All up to date</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/manager/fleet")}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </button>
      </div>

      {/* Compliance Cards */}
      <div className="space-y-3">
        {/* MOT */}
        <div 
          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
            stats.mot.overdue > 0 
              ? 'bg-red-50 border-red-200 hover:border-red-300' 
              : stats.mot.dueSoon > 0
              ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
              : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
          }`}
          onClick={() => navigate("/manager/fleet")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                stats.mot.overdue > 0 
                  ? 'bg-red-100' 
                  : stats.mot.dueSoon > 0
                  ? 'bg-amber-100'
                  : 'bg-emerald-100'
              }`}>
                <Calendar className={`h-5 w-5 ${
                  stats.mot.overdue > 0 
                    ? 'text-red-600' 
                    : stats.mot.dueSoon > 0
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">MOT Tests</p>
                <p className="text-sm text-slate-600">
                  {stats.mot.overdue > 0 && (
                    <span className="text-red-600 font-medium">{stats.mot.overdue} overdue</span>
                  )}
                  {stats.mot.overdue > 0 && stats.mot.dueSoon > 0 && <span className="text-slate-400"> • </span>}
                  {stats.mot.dueSoon > 0 && (
                    <span className="text-amber-600 font-medium">{stats.mot.dueSoon} due soon</span>
                  )}
                  {stats.mot.overdue === 0 && stats.mot.dueSoon === 0 && (
                    <span className="text-emerald-600 font-medium">{stats.mot.ok} up to date</span>
                  )}
                </p>
              </div>
            </div>
            {stats.mot.overdue > 0 ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : stats.mot.dueSoon > 0 ? (
              <Clock className="h-5 w-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            )}
          </div>
        </div>

        {/* Tax */}
        <div 
          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
            stats.tax.overdue > 0 
              ? 'bg-red-50 border-red-200 hover:border-red-300' 
              : stats.tax.dueSoon > 0
              ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
              : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
          }`}
          onClick={() => navigate("/manager/fleet")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                stats.tax.overdue > 0 
                  ? 'bg-red-100' 
                  : stats.tax.dueSoon > 0
                  ? 'bg-amber-100'
                  : 'bg-emerald-100'
              }`}>
                <Shield className={`h-5 w-5 ${
                  stats.tax.overdue > 0 
                    ? 'text-red-600' 
                    : stats.tax.dueSoon > 0
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Road Tax</p>
                <p className="text-sm text-slate-600">
                  {stats.tax.overdue > 0 && (
                    <span className="text-red-600 font-medium">{stats.tax.overdue} overdue</span>
                  )}
                  {stats.tax.overdue > 0 && stats.tax.dueSoon > 0 && <span className="text-slate-400"> • </span>}
                  {stats.tax.dueSoon > 0 && (
                    <span className="text-amber-600 font-medium">{stats.tax.dueSoon} due soon</span>
                  )}
                  {stats.tax.overdue === 0 && stats.tax.dueSoon === 0 && (
                    <span className="text-emerald-600 font-medium">{stats.tax.ok} up to date</span>
                  )}
                </p>
              </div>
            </div>
            {stats.tax.overdue > 0 ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : stats.tax.dueSoon > 0 ? (
              <Clock className="h-5 w-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            )}
          </div>
        </div>

        {/* Service */}
        <div 
          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
            stats.service.overdue > 0 
              ? 'bg-red-50 border-red-200 hover:border-red-300' 
              : stats.service.dueSoon > 0
              ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
              : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
          }`}
          onClick={() => navigate("/manager/fleet")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                stats.service.overdue > 0 
                  ? 'bg-red-100' 
                  : stats.service.dueSoon > 0
                  ? 'bg-amber-100'
                  : 'bg-emerald-100'
              }`}>
                <Wrench className={`h-5 w-5 ${
                  stats.service.overdue > 0 
                    ? 'text-red-600' 
                    : stats.service.dueSoon > 0
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Services</p>
                <p className="text-sm text-slate-600">
                  {stats.service.overdue > 0 && (
                    <span className="text-red-600 font-medium">{stats.service.overdue} overdue</span>
                  )}
                  {stats.service.overdue > 0 && stats.service.dueSoon > 0 && <span className="text-slate-400"> • </span>}
                  {stats.service.dueSoon > 0 && (
                    <span className="text-amber-600 font-medium">{stats.service.dueSoon} due soon</span>
                  )}
                  {stats.service.overdue === 0 && stats.service.dueSoon === 0 && (
                    <span className="text-emerald-600 font-medium">{stats.service.ok} up to date</span>
                  )}
                </p>
              </div>
            </div>
            {stats.service.overdue > 0 ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : stats.service.dueSoon > 0 ? (
              <Clock className="h-5 w-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
