import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import {
  Bot, Shield, Zap, Clock, AlertTriangle, CheckCircle,
  TrendingUp, Activity, RefreshCw, ChevronRight, Fuel,
  Wrench, FileWarning, Car, Calendar, Search
} from "lucide-react";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface AgentAction {
  id: number;
  companyId: number;
  actionType: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  vehicleVrm?: string;
  driverName?: string;
  actionTaken?: string;
  referenceId?: number;
  createdAt: string;
}

const ACTION_META: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  defect_escalated: { icon: AlertTriangle, label: "Defect Escalated", color: "text-orange-600", bg: "bg-orange-50" },
  mot_flagged: { icon: Calendar, label: "MOT Flagged", color: "text-red-600", bg: "bg-red-50" },
  tax_flagged: { icon: FileWarning, label: "Tax Flagged", color: "text-red-600", bg: "bg-red-50" },
  service_due: { icon: Wrench, label: "Service Due", color: "text-amber-600", bg: "bg-amber-50" },
  fuel_anomaly: { icon: Fuel, label: "Fuel Anomaly", color: "text-yellow-600", bg: "bg-yellow-50" },
  predictive_alert: { icon: TrendingUp, label: "Predictive Alert", color: "text-blue-600", bg: "bg-blue-50" },
  compliance_scan: { icon: Shield, label: "Compliance Scan", color: "text-emerald-600", bg: "bg-emerald-50" },
  vor_auto: { icon: Car, label: "Auto VOR", color: "text-purple-600", bg: "bg-purple-50" },
  inspection_alert: { icon: Search, label: "Inspection Alert", color: "text-slate-600", bg: "bg-slate-50" },
};

const SEVERITY_STYLE: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ComplianceAgent() {
  const user = session.getUser();
  const companyId = user?.companyId;
  const [filter, setFilter] = useState<string>("all");

  const { data: actions, isLoading, dataUpdatedAt, refetch } = useQuery<AgentAction[]>({
    queryKey: ["agent-activity", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/agent-activity/${companyId}`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!companyId,
    refetchInterval: 60_000,
  });

  const all = actions || [];
  const filtered = filter === "all" ? all : all.filter(a => a.severity === filter || a.actionType === filter);

  const criticalCount = all.filter(a => a.severity === "critical").length;
  const warningCount = all.filter(a => a.severity === "warning").length;
  const last24h = all.filter(a => Date.now() - new Date(a.createdAt).getTime() < 86400000).length;

  const lastScan = all.length > 0 ? timeAgo(all[0].createdAt) : "No scans yet";

  return (
    <ManagerLayout>
      <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bot className="h-7 w-7 text-blue-600" />
              Compliance Agent
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Autonomous 24/7 fleet compliance monitoring — running while you sleep
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Status Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-lg">Agent Online — Running 24/7</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-blue-100 text-xs font-medium mb-1">Last Activity</p>
              <p className="font-bold text-lg">{lastScan}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-blue-100 text-xs font-medium mb-1">Actions (24h)</p>
              <p className="font-bold text-lg">{last24h}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-blue-100 text-xs font-medium mb-1">Critical Issues</p>
              <p className="font-bold text-lg text-red-300">{criticalCount}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-blue-100 text-xs font-medium mb-1">Warnings</p>
              <p className="font-bold text-lg text-amber-300">{warningCount}</p>
            </div>
          </div>
        </div>

        {/* What the Agent Does */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: "MOT & Tax Scanning", desc: "Daily checks for expiring MOTs and road tax. Auto-alerts before deadlines.", color: "text-blue-600", bg: "bg-blue-50" },
            { icon: AlertTriangle, title: "Defect Escalation", desc: "Unresolved defects automatically escalated every 4 hours until fixed.", color: "text-orange-600", bg: "bg-orange-50" },
            { icon: Fuel, title: "Fuel Intelligence", desc: "Anomalous fuel entries flagged automatically. Catches misfuels & fraud.", color: "text-yellow-600", bg: "bg-yellow-50" },
            { icon: TrendingUp, title: "Predictive Maintenance", desc: "AI models flag vehicles likely to fail before the next service.", color: "text-purple-600", bg: "bg-purple-50" },
            { icon: Zap, title: "Zero Human Input", desc: "Runs continuously. No manual triggers needed. Just check the feed.", color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: Activity, title: "DVSA-Ready Audit Trail", desc: "Every autonomous action logged with timestamp for compliance audits.", color: "text-slate-600", bg: "bg-slate-50" },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3">
              <div className={`h-9 w-9 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Agent Activity Feed
              {all.length > 0 && (
                <span className="text-xs font-normal text-slate-400 ml-1">· {all.length} total actions</span>
              )}
            </h2>
            {/* Filter pills */}
            <div className="flex gap-1.5">
              {["all", "critical", "warning"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                    filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">All clear</p>
              <p className="text-slate-400 text-sm mt-1">
                {all.length === 0
                  ? "The agent will log its first actions during the next scheduled scan."
                  : "No actions match the selected filter."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((action) => {
                const meta = ACTION_META[action.actionType] || ACTION_META.compliance_scan;
                const Icon = meta.icon;
                return (
                  <div key={action.id} className="flex gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                    <div className={`h-10 w-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`h-5 w-5 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{action.title}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SEVERITY_STYLE[action.severity]}`}>
                            {action.severity}
                          </span>
                          <span className="text-xs text-slate-400">{timeAgo(action.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-1.5">{action.description}</p>
                      {action.actionTaken && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5 w-fit">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>{action.actionTaken}</span>
                        </div>
                      )}
                      {(action.vehicleVrm || action.driverName) && (
                        <div className="flex gap-2 mt-1.5">
                          {action.vehicleVrm && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{action.vehicleVrm}</span>
                          )}
                          {action.driverName && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{action.driverName}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Showing {filtered.length} action{filtered.length !== 1 ? "s" : ""} ·
                Auto-refreshes every 60 seconds ·
                {dataUpdatedAt ? ` Last updated ${timeAgo(new Date(dataUpdatedAt).toISOString())}` : ""}
              </p>
            </div>
          )}
        </div>

        {/* Next scan info */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <Clock className="h-8 w-8 text-slate-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-700">Scan schedule</p>
            <p className="text-xs text-slate-500 mt-0.5">
              MOT/Tax/Service checks run daily at 8:00 AM · Defect escalation + Fuel anomalies every 4 hours · Predictive maintenance daily · GPS purge nightly at 3:00 AM
            </p>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
