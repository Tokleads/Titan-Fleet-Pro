import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import {
  Bot, Shield, Zap, Clock, AlertTriangle, CheckCircle,
  TrendingUp, Activity, RefreshCw, Fuel, Wrench, FileWarning,
  Car, Calendar, Search, Star, ChevronDown, ChevronUp,
  ArrowRight, FileText, X, Loader2, BarChart2, Target
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

interface AuditCategory {
  name: string;
  score: number;
  grade: string;
  issues: string[];
  actions: string[];
}

interface AuditReport {
  companyId: number;
  generatedAt: string;
  overallScore: number;
  overallGrade: string;
  previousGrade: string | null;
  projectedGrade: string;
  vehiclesAnalysed: number;
  driversAnalysed: number;
  narrative: string;
  topPriorities: string[];
  categories: AuditCategory[];
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

const GRADE_STYLE: Record<string, { bg: string; text: string; ring: string; label: string }> = {
  A: { bg: "bg-emerald-500", text: "text-white", ring: "ring-emerald-300", label: "Excellent" },
  B: { bg: "bg-green-500", text: "text-white", ring: "ring-green-300", label: "Good" },
  C: { bg: "bg-amber-500", text: "text-white", ring: "ring-amber-300", label: "Adequate" },
  D: { bg: "bg-orange-500", text: "text-white", ring: "ring-orange-300", label: "Poor" },
  F: { bg: "bg-red-600", text: "text-white", ring: "ring-red-300", label: "Failing" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ScoreBar({ score, grade }: { score: number; grade: string }) {
  const g = GRADE_STYLE[grade] || GRADE_STYLE.F;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${g.bg}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${g.bg} ${g.text} min-w-[28px] text-center`}>
        {grade}
      </span>
    </div>
  );
}

function CategoryRow({ cat }: { cat: AuditCategory }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
          <ScoreBar score={cat.score} grade={cat.grade} />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-slate-700">{cat.score}/100</span>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3 bg-slate-50/50">
          {cat.issues.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Issues</p>
              <ul className="space-y-1">
                {cat.issues.map((issue, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-700">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {cat.actions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Actions</p>
              <ul className="space-y-1">
                {cat.actions.map((action, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-700">
                    <ArrowRight className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AuditReportPanel({ report, onClose }: { report: AuditReport; onClose: () => void }) {
  const overall = GRADE_STYLE[report.overallGrade] || GRADE_STYLE.F;
  const projected = GRADE_STYLE[report.projectedGrade] || GRADE_STYLE.B;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wide">AI Audit Report</p>
              <h2 className="text-white text-xl font-bold">Fleet Compliance Assessment</h2>
              <p className="text-slate-400 text-xs mt-1">
                {report.vehiclesAnalysed} vehicles · {report.driversAnalysed} drivers ·
                Generated {timeAgo(report.generatedAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors mt-1"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Grade uplift */}
          <div className="flex items-center gap-4 mt-5">
            <div className="text-center">
              <p className="text-slate-400 text-xs mb-1">Current Grade</p>
              <div className={`h-16 w-16 rounded-2xl ${overall.bg} flex items-center justify-center ring-4 ${overall.ring}`}>
                <span className={`text-3xl font-black ${overall.text}`}>{report.overallGrade}</span>
              </div>
              <p className="text-slate-300 text-xs mt-1">{overall.label}</p>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <ArrowRight className="h-6 w-6 text-slate-500 mb-1" />
              <p className="text-slate-400 text-xs text-center">30-day<br />potential</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-xs mb-1">Projected Grade</p>
              <div className={`h-16 w-16 rounded-2xl ${projected.bg} flex items-center justify-center ring-4 ${projected.ring}`}>
                <span className={`text-3xl font-black ${projected.text}`}>{report.projectedGrade}</span>
              </div>
              <p className="text-slate-300 text-xs mt-1">{projected.label}</p>
            </div>
            <div className="flex-1 text-right">
              <p className="text-white text-3xl font-black">{report.overallScore}</p>
              <p className="text-slate-400 text-xs">/ 100</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Narrative */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" /> AI Assessment
            </p>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
              {report.narrative}
            </p>
          </div>

          {/* Top priorities */}
          {report.topPriorities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> Top Priorities
              </p>
              <div className="space-y-2">
                {report.topPriorities.map((p, i) => (
                  <div key={i} className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-700 leading-snug">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category breakdown */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5" /> Category Scores
            </p>
            <div className="space-y-2">
              {report.categories.map(cat => (
                <CategoryRow key={cat.name} cat={cat} />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <p className="text-xs text-slate-400 text-center">
            AI-generated report · DVSA compliance guidance applied · Not a substitute for a formal audit
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ComplianceAgent() {
  const user = session.getUser();
  const companyId = user?.companyId;
  const [filter, setFilter] = useState<string>("all");
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);

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

  const auditMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/manager/audit-report/${companyId}`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate report");
      }
      return res.json() as Promise<AuditReport>;
    },
    onSuccess: (data) => {
      setAuditReport(data);
      refetch();
    },
  });

  const all = actions || [];
  const filtered = filter === "all" ? all : all.filter(a => a.severity === filter || a.actionType === filter);

  const criticalCount = all.filter(a => a.severity === "critical").length;
  const warningCount = all.filter(a => a.severity === "warning").length;
  const last24h = all.filter(a => Date.now() - new Date(a.createdAt).getTime() < 86400000).length;
  const lastScan = all.length > 0 ? timeAgo(all[0].createdAt) : "No activity yet";

  return (
    <ManagerLayout>
      <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bot className="h-7 w-7 text-blue-600" />
              Compliance Agent
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Autonomous 24/7 fleet compliance monitoring — running while you sleep
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => auditMutation.mutate()}
              disabled={auditMutation.isPending}
              className="flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg px-4 py-2 transition-all shadow-sm disabled:opacity-60"
              data-testid="button-generate-audit"
            >
              {auditMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  AI Audit Report
                </>
              )}
            </button>
          </div>
        </div>

        {auditMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {auditMutation.error?.message || "Failed to generate report. Please try again."}
          </div>
        )}

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
              <p className="text-blue-100 text-xs font-medium mb-1">Critical</p>
              <p className="font-bold text-lg text-red-300">{criticalCount}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-blue-100 text-xs font-medium mb-1">Warnings</p>
              <p className="font-bold text-lg text-amber-300">{warningCount}</p>
            </div>
          </div>
        </div>

        {/* Autonomous Capabilities */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: "MOT & Tax Scanning", desc: "Daily checks. Auto-alerts before deadlines.", color: "text-blue-600", bg: "bg-blue-50" },
            { icon: AlertTriangle, title: "Defect Escalation", desc: "Unresolved defects auto-escalated every 4h.", color: "text-orange-600", bg: "bg-orange-50" },
            { icon: Fuel, title: "Fuel Intelligence", desc: "Anomalous entries flagged automatically.", color: "text-yellow-600", bg: "bg-yellow-50" },
            { icon: Search, title: "Inspection Chasing", desc: "Vehicles without walkarounds flagged at 24h.", color: "text-slate-600", bg: "bg-slate-100" },
            { icon: TrendingUp, title: "AI Photo Triage", desc: "GPT-4o Vision classifies every defect photo.", color: "text-purple-600", bg: "bg-purple-50" },
            { icon: Star, title: "AI Audit Reports", desc: "One-click grade + uplift path for DVSA audit.", color: "text-emerald-600", bg: "bg-emerald-50" },
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
                <span className="text-xs font-normal text-slate-400 ml-1">· {all.length} total</span>
              )}
            </h2>
            <div className="flex gap-1.5">
              {["all", "critical", "warning", "info"].map(f => (
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
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
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
                          <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(action.createdAt)}</span>
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
                {filtered.length} action{filtered.length !== 1 ? "s" : ""} ·
                Auto-refreshes every 60 seconds
                {dataUpdatedAt ? ` · Updated ${timeAgo(new Date(dataUpdatedAt).toISOString())}` : ""}
              </p>
            </div>
          )}
        </div>

        {/* Scan schedule */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-start gap-4">
          <Clock className="h-8 w-8 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-700">Automated scan schedule</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              MOT / Tax / Service checks daily at 08:00 · Defect escalation + Fuel anomalies every 4 hours ·
              Inspection chasing every 4 hours · AI defect triage sweep every 4 hours ·
              Predictive maintenance daily · GPS purge nightly at 03:00
            </p>
          </div>
        </div>
      </div>

      {auditReport && (
        <AuditReportPanel report={auditReport} onClose={() => setAuditReport(null)} />
      )}
    </ManagerLayout>
  );
}
