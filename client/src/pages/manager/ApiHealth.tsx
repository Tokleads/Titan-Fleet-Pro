import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Code,
  Loader2,
  RefreshCw,
  XCircle,
  Zap,
  Sparkles,
} from "lucide-react";

type TabKey = "overview" | "incidents" | "fixes" | "analytics";

export default function ApiHealth() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const { data: statusData, isLoading: statusLoading } = useQuery<any>({
    queryKey: ["api-health-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/api-health/status", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
  });

  const { data: incidents, isLoading: incidentsLoading } = useQuery<any[]>({
    queryKey: ["api-health-incidents"],
    queryFn: async () => {
      const res = await fetch("/api/admin/api-health/incidents?status=open", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch incidents");
      return res.json();
    },
    enabled: activeTab === "incidents",
  });

  const { data: pendingFixes, isLoading: fixesLoading } = useQuery<any[]>({
    queryKey: ["api-health-fixes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/api-health/fixes/pending", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch fixes");
      return res.json();
    },
    enabled: activeTab === "fixes",
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ["api-health-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/api-health/analytics?days=7", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: activeTab === "analytics",
  });

  const runHealthCheck = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/api-health/check", { method: "POST", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to run health check");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-health-status"] });
      queryClient.invalidateQueries({ queryKey: ["api-health-incidents"] });
    },
  });

  const approveFix = useMutation({
    mutationFn: async (fixId: number) => {
      const res = await fetch(`/api/admin/api-health/fixes/${fixId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId: 1 }),
      });
      if (!res.ok) throw new Error("Failed to approve fix");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-health-fixes"] });
      queryClient.invalidateQueries({ queryKey: ["api-health-status"] });
    },
  });

  const rejectFix = useMutation({
    mutationFn: async (fixId: number) => {
      const res = await fetch(`/api/admin/api-health/fixes/${fixId}/reject`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to reject fix");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-health-fixes"] });
    },
  });

  const apis = statusData?.apis || [];
  const summary = statusData?.summary || { healthy: 0, degraded: 0, down: 0 };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "incidents", label: "Incidents" },
    { key: "fixes", label: "Pending Fixes" },
    { key: "analytics", label: "Analytics" },
  ];

  function statusBadge(status: string) {
    if (status === "healthy") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" data-testid="badge-healthy">
          <CheckCircle className="h-3 w-3" />
          Healthy
        </span>
      );
    }
    if (status === "degraded") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200" data-testid="badge-degraded">
          <AlertCircle className="h-3 w-3" />
          Degraded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200" data-testid="badge-down">
        <XCircle className="h-3 w-3" />
        Down
      </span>
    );
  }

  function severityBadge(severity: string) {
    const s = severity?.toUpperCase();
    if (s === "CRITICAL" || s === "HIGH") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
          {s}
        </span>
      );
    }
    if (s === "MEDIUM") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        {s || "LOW"}
      </span>
    );
  }

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2" data-testid="text-page-title">
                API Health Monitor
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 border border-violet-200/50">
                  <Sparkles className="h-3 w-3" />
                  AI Powered
                </span>
              </h1>
              <p className="text-sm text-slate-500" data-testid="text-page-subtitle">
                Real-time health monitoring for all API integrations
              </p>
            </div>
          </div>
          <button
            onClick={() => runHealthCheck.mutate()}
            disabled={runHealthCheck.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50"
            data-testid="button-run-health-check"
          >
            {runHealthCheck.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Run Health Check
          </button>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              data-testid={`tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6" data-testid="card-system-summary">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">System Health Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-200/50">
                  <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-700" data-testid="text-healthy-count">{summary.healthy}</p>
                  <p className="text-xs text-emerald-600 font-medium">Healthy</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-200/50">
                  <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-700" data-testid="text-degraded-count">{summary.degraded}</p>
                  <p className="text-xs text-amber-600 font-medium">Degraded</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-red-50 border border-red-200/50">
                  <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-700" data-testid="text-down-count">{summary.down}</p>
                  <p className="text-xs text-red-600 font-medium">Down</p>
                </div>
              </div>
            </div>

            {statusLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                    <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : apis.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center" data-testid="empty-state-apis">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-violet-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No APIs configured</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Run a health check to discover and monitor your API integrations.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {apis.map((api: any) => (
                  <div
                    key={api.id || api.name}
                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-violet-200/50 transition-all"
                    data-testid={`card-api-${api.id || api.name}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-900">{api.name}</h4>
                      {statusBadge(api.status)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Activity className="h-3.5 w-3.5" />
                        <span>Response: {api.responseTime ?? "—"}ms</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Last checked: {api.lastChecked ? new Date(api.lastChecked).toLocaleString() : "Never"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "incidents" && (
          <div className="space-y-4">
            {incidentsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
                    <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : !incidents || incidents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center" data-testid="empty-state-incidents">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No open incidents</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  All API integrations are operating normally. No incidents to report.
                </p>
              </div>
            ) : (
              incidents.map((incident: any) => (
                <div
                  key={incident.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all"
                  data-testid={`card-incident-${incident.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{incident.apiName || incident.name}</h4>
                      {severityBadge(incident.severity)}
                    </div>
                    <span className="text-xs text-slate-400">
                      {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : ""}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{incident.errorMessage || incident.message}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Failures: {incident.failureCount ?? incident.consecutiveFailures ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Duration: {incident.duration || "Ongoing"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "fixes" && (
          <div className="space-y-4">
            {fixesLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                    <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                    <div className="h-20 bg-slate-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : !pendingFixes || pendingFixes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center" data-testid="empty-state-fixes">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <Code className="h-8 w-8 text-violet-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No pending fixes</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  The AI triage system has no pending fixes to review at this time.
                </p>
              </div>
            ) : (
              pendingFixes.map((fix: any) => (
                <div
                  key={fix.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all"
                  data-testid={`card-fix-${fix.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        {fix.apiName || fix.name}
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 border border-violet-200/50">
                          <Sparkles className="h-3 w-3" />
                          AI Fix
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {fix.createdAt ? new Date(fix.createdAt).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-medium text-violet-500 uppercase tracking-wider mb-0.5">AI Diagnosis</p>
                      <p className="text-sm text-slate-700">{fix.diagnosis || fix.aiDiagnosis}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-violet-500 uppercase tracking-wider mb-0.5">Proposed Fix</p>
                      <p className="text-sm text-slate-600">{fix.description || fix.fixDescription}</p>
                    </div>
                    {(fix.generatedCode || fix.code) && (
                      <div>
                        <p className="text-[10px] font-medium text-violet-500 uppercase tracking-wider mb-1">Generated Code</p>
                        <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-x-auto">
                          <code>{fix.generatedCode || fix.code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => approveFix.mutate(fix.id)}
                      disabled={approveFix.isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
                      data-testid={`button-approve-fix-${fix.id}`}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve & Apply
                    </button>
                    <button
                      onClick={() => rejectFix.mutate(fix.id)}
                      disabled={rejectFix.isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                      data-testid={`button-reject-fix-${fix.id}`}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {analyticsLoading ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
                    <div className="h-8 bg-slate-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5" data-testid="card-stat-checks">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-violet-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">Total Health Checks</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900" data-testid="text-total-checks">
                      {analytics?.totalChecks ?? 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Last 7 days</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5" data-testid="card-stat-resolved">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">Incidents Resolved</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900" data-testid="text-resolved-count">
                      {analytics?.incidentsResolved ?? 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Last 7 days</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5" data-testid="card-stat-response">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">Avg Response Time</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900" data-testid="text-avg-response">
                      {analytics?.averageResponseTime ?? 0}ms
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Across all APIs</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6" data-testid="card-uptime-list">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">API Uptime</h3>
                  {analytics?.apiUptime && analytics.apiUptime.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.apiUptime.map((api: any) => (
                        <div key={api.name || api.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                              <Zap className="h-4 w-4 text-violet-500" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">{api.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  (api.uptime ?? 0) >= 99 ? "bg-emerald-500" : (api.uptime ?? 0) >= 95 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${Math.min(api.uptime ?? 0, 100)}%` }}
                              />
                            </div>
                            <span className={`text-sm font-semibold ${
                              (api.uptime ?? 0) >= 99 ? "text-emerald-600" : (api.uptime ?? 0) >= 95 ? "text-amber-600" : "text-red-600"
                            }`}>
                              {(api.uptime ?? 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No uptime data available yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
