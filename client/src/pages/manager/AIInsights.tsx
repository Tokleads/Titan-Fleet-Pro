import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { useQuery, useMutation } from "@tanstack/react-query";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import { useToast } from "@/hooks/use-toast";
import { Brain, Sparkles, Shield, AlertTriangle, Truck, ChevronRight, Check, RefreshCw, Bot, Activity } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const riskColors: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  CRITICAL: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", bar: "bg-red-500" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", bar: "bg-orange-500" },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", bar: "bg-amber-500" },
  LOW: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", bar: "bg-blue-500" },
};

export default function AIInsights() {
  const { toast } = useToast();
  const company = session.getCompany();
  const companyId = company?.id;

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<any[]>({
    queryKey: ["/api/maintenance-alerts", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/maintenance-alerts?companyId=${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: vehiclesData } = useQuery<any>({
    queryKey: ["/api/vehicles", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles?companyId=${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
    enabled: !!companyId,
  });

  const vehiclesArray = Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData?.vehicles || []);
  const vehicleMap = new Map(vehiclesArray.map((v: any) => [v.id, v]));

  const runAnalysis = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/maintenance-alerts/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ companyId }),
      });
      if (!res.ok) throw new Error("Failed to run analysis");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-alerts", companyId] });
      toast({ title: "Analysis complete", description: "AI has analyzed your fleet defect patterns." });
    },
    onError: () => {
      toast({ title: "Analysis failed", description: "Could not run AI analysis. Try again later.", variant: "destructive" });
    },
  });

  const acknowledge = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/maintenance-alerts/${id}/acknowledge`, { method: "PATCH", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to acknowledge");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-alerts", companyId] });
      toast({ title: "Alert acknowledged" });
    },
  });

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2" data-testid="text-page-title">
                AI Compliance Agent
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 border border-violet-200/50">
                  <Sparkles className="h-3 w-3" />
                  AI Powered
                </span>
              </h1>
              <p className="text-sm text-slate-500" data-testid="text-page-subtitle">Predictive maintenance insights powered by AI</p>
            </div>
          </div>
          <button
            onClick={() => runAnalysis.mutate()}
            disabled={runAnalysis.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50"
            data-testid="button-run-analysis"
          >
            {runAnalysis.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            Run Analysis
          </button>
        </div>

        {alertsLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center" data-testid="empty-state">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-violet-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No maintenance alerts</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              The AI compliance agent continuously monitors defect patterns across your fleet.
              Run an analysis to generate predictive maintenance alerts based on historical data.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {alerts.map((alert: any) => {
              const vehicle = vehicleMap.get(alert.vehicleId);
              const colors = riskColors[alert.riskLevel] || riskColors.LOW;
              const isAcknowledged = alert.status === "ACKNOWLEDGED" || alert.status === "RESOLVED";

              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-2xl border transition-all ${isAcknowledged ? "border-slate-200 opacity-60" : "border-slate-200 hover:shadow-md hover:border-violet-200/50"}`}
                  data-testid={`card-alert-${alert.id}`}
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${colors.bg} ${colors.text} ${colors.border} border`}>
                          <AlertTriangle className="h-3 w-3" />
                          {alert.riskLevel}
                        </div>
                        {alert.category && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            <Shield className="h-3 w-3" />
                            {alert.category}
                          </span>
                        )}
                      </div>
                      {isAcknowledged && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <Check className="h-3.5 w-3.5" />
                          Acknowledged
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Risk Score</span>
                        <span className={`text-xs font-bold ${colors.text}`}>{alert.riskScore}/100</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${colors.bar}`}
                          style={{ width: `${alert.riskScore}%` }}
                        />
                      </div>
                    </div>

                    {vehicle && (
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{vehicle.vrm}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{vehicle.make} {vehicle.model}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] font-medium text-violet-500 uppercase tracking-wider mb-0.5">Prediction</p>
                        <p className="text-sm text-slate-700" data-testid={`text-prediction-${alert.id}`}>{alert.prediction}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-violet-500 uppercase tracking-wider mb-0.5">Recommendation</p>
                        <p className="text-sm text-slate-600" data-testid={`text-recommendation-${alert.id}`}>{alert.recommendation}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Based on {alert.basedOnDefects} defects
                        </span>
                        <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                      </div>
                      {!isAcknowledged && (
                        <button
                          onClick={() => acknowledge.mutate(alert.id)}
                          disabled={acknowledge.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-colors"
                          data-testid={`button-acknowledge-${alert.id}`}
                        >
                          <Check className="h-3 w-3" />
                          Acknowledge
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
