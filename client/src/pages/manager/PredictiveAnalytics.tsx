import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Brain, Shield, AlertTriangle, TrendingUp, TrendingDown,
  Truck, Wrench, FileCheck, Fuel, ChevronRight, Loader2,
  Activity, Target, Clock, ArrowUpRight, ArrowDownRight, Minus,
  CheckCircle2, XCircle, AlertCircle, BarChart3, Zap
} from "lucide-react";
import { useState } from "react";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const RISK_COLORS: Record<string, { bg: string; text: string; border: string; fill: string }> = {
  CRITICAL: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", fill: "#ef4444" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", fill: "#f97316" },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", fill: "#f59e0b" },
  LOW: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", fill: "#10b981" },
};

const PIE_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#10b981"];

const PRIORITY_ICONS: Record<string, any> = {
  CRITICAL: XCircle,
  HIGH: AlertTriangle,
  MEDIUM: AlertCircle,
  LOW: CheckCircle2,
};

const CATEGORY_ICONS: Record<string, any> = {
  MAINTENANCE: Wrench,
  COMPLIANCE: Shield,
  INSPECTION: FileCheck,
  FUEL: Fuel,
};

function ScoreGauge({ score, label, size = "lg" }: { score: number; label: string; size?: "lg" | "sm" }) {
  const radius = size === "lg" ? 70 : 40;
  const stroke = size === "lg" ? 10 : 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";
  const dim = (radius + stroke) * 2;

  return (
    <div className="flex flex-col items-center" data-testid={`gauge-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <svg width={dim} height={dim} className="transform -rotate-90">
        <circle cx={radius + stroke} cy={radius + stroke} r={radius} fill="none"
          stroke="#e5e7eb" strokeWidth={stroke} />
        <circle cx={radius + stroke} cy={radius + stroke} r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeDasharray={circumference}
          strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: dim, height: dim }}>
        <span className={`font-bold ${size === "lg" ? "text-3xl" : "text-lg"}`} style={{ color }}>{score}</span>
        {size === "lg" && <span className="text-xs text-slate-500">/ 100</span>}
      </div>
      <span className={`mt-1 font-medium text-slate-600 ${size === "lg" ? "text-sm" : "text-xs"}`}>{label}</span>
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "WORSENING") return <ArrowUpRight className="h-4 w-4 text-red-500" />;
  if (trend === "IMPROVING") return <ArrowDownRight className="h-4 w-4 text-emerald-500" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
}

export default function PredictiveAnalytics() {
  const company = session.getCompany();
  const companyId = company?.id;
  const [activeTab, setActiveTab] = useState<"overview" | "compliance" | "maintenance" | "actions">("overview");

  const { data, isLoading } = useQuery<any>({
    queryKey: ["predictive-analytics", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/predictive-analytics/${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "compliance" as const, label: "Compliance", icon: Shield },
    { id: "maintenance" as const, label: "Maintenance", icon: Wrench },
    { id: "actions" as const, label: "Action Items", icon: Zap },
  ];

  return (
    <ManagerLayout>
      <div className="space-y-6" data-testid="predictive-analytics-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Brain className="h-7 w-7 text-indigo-600" />
              Predictive Analytics
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              AI-powered forecasting for maintenance and compliance
            </p>
          </div>
          {data && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${data.summary.overallRiskScore >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : data.summary.overallRiskScore >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                Fleet Health: {data.summary.overallRiskScore}/100
              </Badge>
            </div>
          )}
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg" data-testid="analytics-tabs">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              data-testid={`tab-${tab.id}`}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-slate-600">Analyzing fleet data...</span>
          </div>
        ) : data ? (
          <>
            {activeTab === "overview" && <OverviewTab data={data} />}
            {activeTab === "compliance" && <ComplianceTab data={data} />}
            {activeTab === "maintenance" && <MaintenanceTab data={data} />}
            {activeTab === "actions" && <ActionsTab data={data} />}
          </>
        ) : (
          <Card><CardContent className="p-12 text-center text-slate-500">No analytics data available</CardContent></Card>
        )}
      </div>
    </ManagerLayout>
  );
}

function OverviewTab({ data }: { data: any }) {
  const { summary, costProjections, inspectionInsights, actionItems } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="col-span-1 md:col-span-2" data-testid="card-fleet-health">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="relative">
                <ScoreGauge score={summary.overallRiskScore} label="Fleet Health" />
              </div>
              <div className="flex-1 ml-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Compliance</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${summary.complianceScore}%`, backgroundColor: summary.complianceScore >= 80 ? "#10b981" : summary.complianceScore >= 60 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right">{summary.complianceScore}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Maintenance</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${summary.maintenanceScore}%`, backgroundColor: summary.maintenanceScore >= 80 ? "#10b981" : summary.maintenanceScore >= 60 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right">{summary.maintenanceScore}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Inspections</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${summary.inspectionScore}%`, backgroundColor: summary.inspectionScore >= 80 ? "#10b981" : summary.inspectionScore >= 60 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right">{summary.inspectionScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-vehicles-at-risk">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Vehicles at Risk</span>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{summary.vehiclesAtRisk}</p>
            <p className="text-xs text-slate-400 mt-1">of {summary.totalVehicles} total</p>
          </CardContent>
        </Card>

        <Card data-testid="card-action-items">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Action Items</span>
              <Zap className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{actionItems.length}</p>
            <p className="text-xs text-red-500 mt-1">
              {actionItems.filter((a: any) => a.priority === "CRITICAL").length} critical
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card data-testid="card-risk-trend">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-500" />
              Fleet Health Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={summary.riskTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="score" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="card-risk-distribution">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-500" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={summary.riskDistribution} dataKey="count" nameKey="level"
                    cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {summary.riskDistribution.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {summary.riskDistribution.map((item: any, i: number) => (
                  <div key={item.level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-sm text-slate-600">{item.level}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-cost-projections">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Cost Projections (30 Day)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Est. Maintenance</p>
              <p className="text-xl font-bold text-slate-900">£{(costProjections.estimatedMaintenanceCost30d / 100).toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Est. Fuel</p>
              <p className="text-xl font-bold text-slate-900">£{(costProjections.estimatedFuelCost30d / 100).toLocaleString()}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-xs text-emerald-600 mb-1">Potential Savings</p>
              <p className="text-xl font-bold text-emerald-700">£{(costProjections.potentialSavings / 100).toLocaleString()}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={costProjections.costTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `£${Math.round(v / 100)}`} />
              <Tooltip formatter={(v: number) => `£${(v / 100).toFixed(0)}`} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Legend />
              <Bar dataKey="maintenance" name="Maintenance" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fuel" name="Fuel" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function ComplianceTab({ data }: { data: any }) {
  const { complianceForecasts } = data;
  const overdue = complianceForecasts.filter((f: any) => f.status === "OVERDUE");
  const critical = complianceForecasts.filter((f: any) => f.status === "CRITICAL");
  const warning = complianceForecasts.filter((f: any) => f.status === "WARNING");

  const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
    OVERDUE: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: XCircle },
    CRITICAL: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", icon: AlertTriangle },
    WARNING: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: Clock },
  };

  return (
    <div className="space-y-6" data-testid="compliance-tab">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><XCircle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-2xl font-bold text-red-700">{overdue.length}</p>
                <p className="text-sm text-red-600">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{critical.length}</p>
                <p className="text-sm text-orange-600">Expiring This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{warning.length}</p>
                <p className="text-sm text-amber-600">Due Within 30 Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {complianceForecasts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">All Clear</h3>
            <p className="text-sm text-slate-500 mt-1">No upcoming compliance deadlines within 30 days</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {complianceForecasts.map((forecast: any, i: number) => {
            const cfg = statusConfig[forecast.status] || statusConfig.WARNING;
            const Icon = cfg.icon;
            return (
              <Card key={i} className={`${cfg.bg} border`} data-testid={`compliance-forecast-${i}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/60">
                      <Icon className={`h-5 w-5 ${cfg.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`${cfg.text} border-current text-xs`}>{forecast.type}</Badge>
                        <span className="font-semibold text-slate-900">{forecast.entityName}</span>
                      </div>
                      <p className="text-sm text-slate-600">{forecast.recommendation}</p>
                      {forecast.dueDate && (
                        <p className="text-xs text-slate-400 mt-1">
                          {forecast.daysRemaining < 0
                            ? `Expired ${Math.abs(forecast.daysRemaining)} days ago`
                            : `Due: ${new Date(forecast.dueDate).toLocaleDateString("en-GB")} (${forecast.daysRemaining} days)`}
                        </p>
                      )}
                      {forecast.type === "SERVICE" && (
                        <p className="text-xs text-slate-400 mt-1">
                          {forecast.daysRemaining <= 0
                            ? `Overdue by ${Math.abs(forecast.daysRemaining)} miles`
                            : `${forecast.daysRemaining} miles remaining`}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MaintenanceTab({ data }: { data: any }) {
  const { maintenanceRisks, inspectionInsights } = data;
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? maintenanceRisks : maintenanceRisks.slice(0, 10);

  return (
    <div className="space-y-6" data-testid="maintenance-tab">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500 mb-1">Inspections (30d)</p>
            <p className="text-2xl font-bold text-slate-900">{inspectionInsights.totalInspections30d}</p>
            <p className="text-xs text-slate-400">{inspectionInsights.inspectionRate}% completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500 mb-1">Missed Inspections</p>
            <p className={`text-2xl font-bold ${inspectionInsights.missedInspections > 0 ? "text-red-600" : "text-emerald-600"}`}>{inspectionInsights.missedInspections}</p>
            <p className="text-xs text-slate-400">estimated this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500 mb-1">Fail Rate</p>
            <p className={`text-2xl font-bold ${inspectionInsights.failRate > 20 ? "text-red-600" : inspectionInsights.failRate > 10 ? "text-amber-600" : "text-emerald-600"}`}>{inspectionInsights.failRate}%</p>
            <p className="text-xs text-slate-400">items failing checks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500 mb-1">Avg Duration</p>
            <p className="text-2xl font-bold text-slate-900">{Math.round(inspectionInsights.avgDuration / 60)}m</p>
            <p className="text-xs text-slate-400">per inspection</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-indigo-500" />
            Vehicle Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="risk-table">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Vehicle</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Risk</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-500">Score</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-500">Open Defects</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-500">Trend</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Predictions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((v: any) => {
                  const rc = RISK_COLORS[v.riskLevel] || RISK_COLORS.LOW;
                  return (
                    <tr key={v.vehicleId} className="border-b border-slate-50 hover:bg-slate-50/50" data-testid={`risk-row-${v.vehicleId}`}>
                      <td className="py-3 px-3">
                        <div>
                          <span className="font-semibold text-slate-900">{v.vrm}</span>
                          {v.make && <span className="text-slate-400 ml-1 text-xs">{v.make} {v.model}</span>}
                        </div>
                        {v.serviceOverdue && <Badge variant="outline" className="text-red-600 border-red-200 text-[10px] mt-0.5">Service Overdue</Badge>}
                      </td>
                      <td className="py-3 px-3">
                        <Badge className={`${rc.bg} ${rc.text} ${rc.border} border`}>{v.riskLevel}</Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-12 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${v.riskScore}%`, backgroundColor: rc.fill }} />
                          </div>
                          <span className="text-xs font-mono">{v.riskScore}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={v.openDefects > 0 ? "font-semibold text-red-600" : "text-slate-400"}>{v.openDefects}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <TrendIcon trend={v.defectTrend} />
                          <span className="text-xs text-slate-500">{v.defectTrend.charAt(0) + v.defectTrend.slice(1).toLowerCase()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {v.predictions.length > 0 ? (
                          <ul className="text-xs text-slate-600 space-y-0.5">
                            {v.predictions.slice(0, 2).map((p: string, i: number) => (
                              <li key={i} className="flex items-start gap-1">
                                <ChevronRight className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-slate-400">No issues predicted</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {maintenanceRisks.length > 10 && (
            <div className="mt-3 text-center">
              <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)} data-testid="button-show-all-risks">
                {showAll ? "Show Less" : `Show All ${maintenanceRisks.length} Vehicles`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {inspectionInsights.trend.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-indigo-500" />
              Inspection Trends (Weekly)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={inspectionInsights.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#94a3b8" unit="%" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Inspections" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="failRate" name="Fail Rate %" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ActionsTab({ data }: { data: any }) {
  const { actionItems } = data;

  const grouped = {
    CRITICAL: actionItems.filter((a: any) => a.priority === "CRITICAL"),
    HIGH: actionItems.filter((a: any) => a.priority === "HIGH"),
    MEDIUM: actionItems.filter((a: any) => a.priority === "MEDIUM"),
    LOW: actionItems.filter((a: any) => a.priority === "LOW"),
  };

  const priorityConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    CRITICAL: { label: "Critical Priority", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    HIGH: { label: "High Priority", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    MEDIUM: { label: "Medium Priority", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    LOW: { label: "Low Priority", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  };

  return (
    <div className="space-y-6" data-testid="actions-tab">
      {actionItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">No Action Items</h3>
            <p className="text-sm text-slate-500 mt-1">Your fleet is in good shape. Keep up the great work!</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([priority, items]) => {
          if ((items as any[]).length === 0) return null;
          const cfg = priorityConfig[priority];
          const PriorityIcon = PRIORITY_ICONS[priority];
          return (
            <div key={priority}>
              <h3 className={`text-sm font-semibold ${cfg.text} mb-3 flex items-center gap-1.5`}>
                <PriorityIcon className="h-4 w-4" />
                {cfg.label} ({(items as any[]).length})
              </h3>
              <div className="space-y-2">
                {(items as any[]).map((item: any, i: number) => {
                  const CatIcon = CATEGORY_ICONS[item.category] || Shield;
                  return (
                    <Card key={i} className={`${cfg.bg} ${cfg.border} border`} data-testid={`action-item-${priority}-${i}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 bg-white/60 rounded-lg">
                            <CatIcon className={`h-4 w-4 ${cfg.text}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-slate-900 text-sm">{item.title}</h4>
                              <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                            </div>
                            <p className="text-sm text-slate-600 mt-0.5">{item.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
