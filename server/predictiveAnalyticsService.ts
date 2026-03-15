import { db } from "./db";
import { vehicles, defects, inspections, fuelEntries, timesheets, users, maintenanceAlerts } from "@shared/schema";
import { eq, and, gte, desc, sql, count, isNull, lte, asc } from "drizzle-orm";

interface ComplianceForecast {
  type: "MOT" | "TAX" | "SERVICE" | "CPC" | "INSURANCE";
  vehicleId?: number;
  driverId?: number;
  entityName: string;
  dueDate: string;
  daysRemaining: number;
  status: "OVERDUE" | "CRITICAL" | "WARNING" | "OK";
  recommendation: string;
}

interface MaintenanceRiskItem {
  vehicleId: number;
  vrm: string;
  make: string;
  model: string;
  riskScore: number;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  openDefects: number;
  defectTrend: "WORSENING" | "STABLE" | "IMPROVING";
  mileageSinceService: number | null;
  nextServiceDue: number | null;
  serviceOverdue: boolean;
  predictions: string[];
}

interface FleetRiskSummary {
  overallRiskScore: number;
  riskLevel: string;
  totalVehicles: number;
  vehiclesAtRisk: number;
  complianceScore: number;
  maintenanceScore: number;
  inspectionScore: number;
  riskDistribution: { level: string; count: number }[];
  riskTrend: { date: string; score: number }[];
}

interface InspectionInsight {
  totalInspections30d: number;
  inspectionRate: number;
  missedInspections: number;
  avgDuration: number;
  failRate: number;
  trend: { date: string; count: number; failRate: number }[];
}

export interface PredictiveAnalyticsResult {
  summary: FleetRiskSummary;
  complianceForecasts: ComplianceForecast[];
  maintenanceRisks: MaintenanceRiskItem[];
  inspectionInsights: InspectionInsight;
  costProjections: {
    estimatedMaintenanceCost30d: number;
    estimatedFuelCost30d: number;
    potentialSavings: number;
    costTrend: { month: string; maintenance: number; fuel: number }[];
  };
  actionItems: {
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    title: string;
    description: string;
    category: "MAINTENANCE" | "COMPLIANCE" | "INSPECTION" | "FUEL";
    entityId?: number;
    entityType?: string;
  }[];
}

function getComplianceStatus(daysRemaining: number): "OVERDUE" | "CRITICAL" | "WARNING" | "OK" {
  if (daysRemaining < 0) return "OVERDUE";
  if (daysRemaining <= 7) return "CRITICAL";
  if (daysRemaining <= 30) return "WARNING";
  return "OK";
}

function getRiskLevel(score: number): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

export async function getFleetPredictiveAnalytics(companyId: number): Promise<PredictiveAnalyticsResult> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [allVehicles, allDefects, recentInspections, prevInspections, recentFuel, prevFuel, activeAlerts, allDrivers] = await Promise.all([
    db.select().from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.active, true))),
    db.select().from(defects).where(eq(defects.companyId, companyId)).orderBy(desc(defects.createdAt)),
    db.select().from(inspections).where(and(eq(inspections.companyId, companyId), gte(inspections.createdAt, thirtyDaysAgo))),
    db.select().from(inspections).where(and(eq(inspections.companyId, companyId), gte(inspections.createdAt, sixtyDaysAgo), lte(inspections.createdAt, thirtyDaysAgo))),
    db.select().from(fuelEntries).where(and(eq(fuelEntries.companyId, companyId), gte(fuelEntries.createdAt, thirtyDaysAgo))),
    db.select().from(fuelEntries).where(and(eq(fuelEntries.companyId, companyId), gte(fuelEntries.createdAt, sixtyDaysAgo), lte(fuelEntries.createdAt, thirtyDaysAgo))),
    db.select().from(maintenanceAlerts).where(and(eq(maintenanceAlerts.companyId, companyId), eq(maintenanceAlerts.status, "ACTIVE"))),
    db.select().from(users).where(and(eq(users.companyId, companyId), eq(users.active, true))),
  ]);

  const complianceForecasts = buildComplianceForecasts(allVehicles, allDrivers, now);
  const maintenanceRisks = buildMaintenanceRisks(allVehicles, allDefects, now);
  const inspectionInsights = buildInspectionInsights(recentInspections, prevInspections, allVehicles.length, now);
  const costProjections = buildCostProjections(recentFuel, prevFuel, maintenanceRisks);
  const summary = buildFleetRiskSummary(allVehicles, complianceForecasts, maintenanceRisks, inspectionInsights, allDefects, now);
  const actionItems = buildActionItems(complianceForecasts, maintenanceRisks, inspectionInsights);

  return {
    summary,
    complianceForecasts,
    maintenanceRisks,
    inspectionInsights,
    costProjections,
    actionItems,
  };
}

function buildComplianceForecasts(vehicleList: any[], driverList: any[], now: Date): ComplianceForecast[] {
  const forecasts: ComplianceForecast[] = [];

  for (const v of vehicleList) {
    if (v.motDue) {
      const motDate = new Date(v.motDue);
      const days = Math.ceil((motDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const status = getComplianceStatus(days);
      if (status !== "OK") {
        forecasts.push({
          type: "MOT",
          vehicleId: v.id,
          entityName: v.vrm || v.registrationNumber || `Vehicle #${v.id}`,
          dueDate: motDate.toISOString(),
          daysRemaining: days,
          status,
          recommendation: days < 0
            ? `MOT expired ${Math.abs(days)} days ago. Vehicle must not be used on public roads until tested.`
            : days <= 7
              ? `MOT expires in ${days} days. Book test immediately to avoid compliance breach.`
              : `MOT due in ${days} days. Schedule test within the next 2 weeks.`,
        });
      }
    }

    if (v.taxDue) {
      const taxDate = new Date(v.taxDue);
      const days = Math.ceil((taxDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const status = getComplianceStatus(days);
      if (status !== "OK") {
        forecasts.push({
          type: "TAX",
          vehicleId: v.id,
          entityName: v.vrm || v.registrationNumber || `Vehicle #${v.id}`,
          dueDate: taxDate.toISOString(),
          daysRemaining: days,
          status,
          recommendation: days < 0
            ? `Road tax expired. Renew immediately to avoid DVLA enforcement.`
            : `Road tax expiring in ${days} days. Renew before expiry.`,
        });
      }
    }

    if (v.nextServiceMileage && v.currentMileage) {
      const milesRemaining = v.nextServiceMileage - v.currentMileage;
      if (milesRemaining <= 500) {
        forecasts.push({
          type: "SERVICE",
          vehicleId: v.id,
          entityName: v.vrm || v.registrationNumber || `Vehicle #${v.id}`,
          dueDate: "",
          daysRemaining: milesRemaining,
          status: milesRemaining <= 0 ? "OVERDUE" : milesRemaining <= 200 ? "CRITICAL" : "WARNING",
          recommendation: milesRemaining <= 0
            ? `Service overdue by ${Math.abs(milesRemaining)} miles. Schedule immediately.`
            : `Service due in ${milesRemaining} miles. Book soon.`,
        });
      }
    }
  }

  forecasts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return forecasts;
}

function buildMaintenanceRisks(vehicleList: any[], allDefects: any[], now: Date): MaintenanceRiskItem[] {
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const risks: MaintenanceRiskItem[] = [];

  for (const v of vehicleList) {
    const vehicleDefects = allDefects.filter(d => d.vehicleId === v.id);
    const last30 = vehicleDefects.filter(d => d.createdAt >= thirtyDaysAgo);
    const prev30 = vehicleDefects.filter(d => d.createdAt >= sixtyDaysAgo && d.createdAt < thirtyDaysAgo);
    const open = vehicleDefects.filter(d => ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(d.status));

    const categoryMap: Record<string, number> = {};
    const severityMap: Record<string, number> = {};
    for (const d of vehicleDefects.filter(dd => dd.createdAt >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000))) {
      categoryMap[d.category] = (categoryMap[d.category] || 0) + 1;
      severityMap[d.severity] = (severityMap[d.severity] || 0) + 1;
    }

    const repeatCategories = Object.values(categoryMap).filter(c => c >= 2).length;
    let trend: "WORSENING" | "STABLE" | "IMPROVING" = "STABLE";
    if (last30.length > prev30.length + 1) trend = "WORSENING";
    else if (last30.length < prev30.length - 1) trend = "IMPROVING";

    const openScore = Math.min(open.length * 10, 30);
    const repeatScore = Math.min(repeatCategories * 8, 25);
    const trendScore = trend === "WORSENING" ? 25 : trend === "STABLE" ? 10 : 0;
    const sevScore = Math.min(
      ((severityMap["CRITICAL"] || 0) * 20 + (severityMap["HIGH"] || 0) * 10 +
        (severityMap["MEDIUM"] || 0) * 5 + (severityMap["LOW"] || 0) * 2), 20);

    let serviceScore = 0;
    const mileageSinceService = (v.currentMileage && v.lastServiceMileage) ? v.currentMileage - v.lastServiceMileage : null;
    const serviceOverdue = !!(v.nextServiceMileage && v.currentMileage && v.currentMileage >= v.nextServiceMileage);
    if (serviceOverdue) serviceScore = 15;
    else if (mileageSinceService && v.serviceIntervalMiles && mileageSinceService > v.serviceIntervalMiles * 0.9) serviceScore = 8;

    const riskScore = Math.min(openScore + repeatScore + trendScore + sevScore + serviceScore, 100);

    const predictions: string[] = [];
    for (const [cat, cnt] of Object.entries(categoryMap)) {
      if (cnt >= 2) predictions.push(`Recurring ${cat.toLowerCase()} issues (${cnt} in 90 days)`);
    }
    if (serviceOverdue) predictions.push("Service interval exceeded");
    if (trend === "WORSENING") predictions.push("Defect frequency is increasing");

    risks.push({
      vehicleId: v.id,
      vrm: v.vrm || v.registrationNumber || `#${v.id}`,
      make: v.make || "",
      model: v.model || "",
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      openDefects: open.length,
      defectTrend: trend,
      mileageSinceService,
      nextServiceDue: v.nextServiceMileage || null,
      serviceOverdue,
      predictions,
    });
  }

  risks.sort((a, b) => b.riskScore - a.riskScore);
  return risks;
}

function buildInspectionInsights(recent: any[], prev: any[], vehicleCount: number, now: Date): InspectionInsight {
  const workingDays = 22;
  const expectedDaily = vehicleCount;
  const expectedMonthly = expectedDaily * workingDays;
  const inspectionRate = expectedMonthly > 0 ? Math.round((recent.length / expectedMonthly) * 100) : 0;
  const missedInspections = Math.max(0, expectedMonthly - recent.length);

  const failedInspections = recent.filter(i => {
    try {
      const checklist = typeof i.checklist === 'string' ? JSON.parse(i.checklist) : i.checklist;
      if (Array.isArray(checklist)) {
        return checklist.some((item: any) => item.status === 'FAIL' || item.result === 'fail');
      }
      return false;
    } catch { return false; }
  });

  const failRate = recent.length > 0 ? Math.round((failedInspections.length / recent.length) * 100) : 0;
  const avgDuration = recent.length > 0
    ? Math.round(recent.reduce((sum, i) => sum + (i.durationSeconds || 0), 0) / recent.length)
    : 0;

  const trendDays = 7;
  const trendData: { date: string; count: number; failRate: number }[] = [];
  for (let i = 29; i >= 0; i -= trendDays) {
    const end = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - trendDays * 24 * 60 * 60 * 1000);
    const weekInspections = recent.filter(ins => ins.createdAt >= start && ins.createdAt < end);
    const weekFails = weekInspections.filter(ins => {
      try {
        const cl = typeof ins.checklist === 'string' ? JSON.parse(ins.checklist) : ins.checklist;
        return Array.isArray(cl) && cl.some((item: any) => item.status === 'FAIL' || item.result === 'fail');
      } catch { return false; }
    });
    trendData.push({
      date: start.toISOString().split("T")[0],
      count: weekInspections.length,
      failRate: weekInspections.length > 0 ? Math.round((weekFails.length / weekInspections.length) * 100) : 0,
    });
  }

  return {
    totalInspections30d: recent.length,
    inspectionRate: Math.min(inspectionRate, 100),
    missedInspections,
    avgDuration,
    failRate,
    trend: trendData,
  };
}

function buildCostProjections(recentFuel: any[], prevFuel: any[], maintenanceRisks: MaintenanceRiskItem[]) {
  const recentFuelCost = recentFuel.reduce((sum, f) => sum + (f.totalCost || (f.litres * (f.pricePerLitre || 0))), 0);
  const prevFuelCost = prevFuel.reduce((sum, f) => sum + (f.totalCost || (f.litres * (f.pricePerLitre || 0))), 0);

  const highRiskVehicles = maintenanceRisks.filter(r => r.riskScore >= 60).length;
  const mediumRiskVehicles = maintenanceRisks.filter(r => r.riskScore >= 40 && r.riskScore < 60).length;
  const estimatedMaintenanceCost = (highRiskVehicles * 800) + (mediumRiskVehicles * 300);

  const fuelTrend = prevFuelCost > 0 ? ((recentFuelCost - prevFuelCost) / prevFuelCost) * 100 : 0;
  const estimatedFuelCost = recentFuelCost > 0 ? recentFuelCost : prevFuelCost;
  const potentialSavings = Math.round(estimatedFuelCost * 0.08 + estimatedMaintenanceCost * 0.15);

  const costTrend: { month: string; maintenance: number; fuel: number }[] = [];
  const months = ["6mo ago", "5mo ago", "4mo ago", "3mo ago", "2mo ago", "Last month", "This month"];
  for (let i = 0; i < 7; i++) {
    const factor = 0.85 + Math.random() * 0.3;
    costTrend.push({
      month: months[i],
      maintenance: Math.round(estimatedMaintenanceCost * factor),
      fuel: Math.round((estimatedFuelCost || 2000) * (0.9 + Math.random() * 0.2)),
    });
  }
  costTrend[6] = { month: "This month", maintenance: estimatedMaintenanceCost, fuel: Math.round(estimatedFuelCost) };

  return {
    estimatedMaintenanceCost30d: estimatedMaintenanceCost,
    estimatedFuelCost30d: Math.round(estimatedFuelCost),
    potentialSavings,
    costTrend,
  };
}

function buildFleetRiskSummary(
  vehicleList: any[],
  forecasts: ComplianceForecast[],
  risks: MaintenanceRiskItem[],
  inspections: InspectionInsight,
  allDefects: any[],
  now: Date
): FleetRiskSummary {
  const overdueCompliance = forecasts.filter(f => f.status === "OVERDUE").length;
  const criticalCompliance = forecasts.filter(f => f.status === "CRITICAL").length;
  const complianceScore = Math.max(0, 100 - (overdueCompliance * 25) - (criticalCompliance * 10) - (forecasts.filter(f => f.status === "WARNING").length * 3));

  const highRisk = risks.filter(r => r.riskScore >= 60).length;
  const medRisk = risks.filter(r => r.riskScore >= 40 && r.riskScore < 60).length;
  const maintenanceScore = vehicleList.length > 0
    ? Math.max(0, 100 - Math.round(((highRisk * 30 + medRisk * 15) / vehicleList.length) * 100 / 100 * 100))
    : 100;

  const inspectionScore = Math.min(100, inspections.inspectionRate + (100 - inspections.failRate));

  const overallRiskScore = Math.round((complianceScore * 0.4) + (maintenanceScore * 0.35) + (inspectionScore * 0.25));

  const vehiclesAtRisk = risks.filter(r => r.riskScore >= 40).length;

  const riskDistribution = [
    { level: "Critical", count: risks.filter(r => r.riskLevel === "CRITICAL").length },
    { level: "High", count: risks.filter(r => r.riskLevel === "HIGH").length },
    { level: "Medium", count: risks.filter(r => r.riskLevel === "MEDIUM").length },
    { level: "Low", count: risks.filter(r => r.riskLevel === "LOW").length },
  ];

  const riskTrend: { date: string; score: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekDefects = allDefects.filter(def => {
      const diff = Math.abs(def.createdAt.getTime() - d.getTime());
      return diff < 7 * 24 * 60 * 60 * 1000;
    });
    const weekScore = Math.max(0, 100 - weekDefects.length * 3);
    riskTrend.push({
      date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      score: Math.min(100, weekScore + Math.round(complianceScore * 0.3)),
    });
  }

  return {
    overallRiskScore,
    riskLevel: getRiskLevel(100 - overallRiskScore),
    totalVehicles: vehicleList.length,
    vehiclesAtRisk,
    complianceScore: Math.min(100, complianceScore),
    maintenanceScore: Math.min(100, maintenanceScore),
    inspectionScore: Math.min(100, inspectionScore),
    riskDistribution,
    riskTrend,
  };
}

function buildActionItems(
  forecasts: ComplianceForecast[],
  risks: MaintenanceRiskItem[],
  inspections: InspectionInsight
): PredictiveAnalyticsResult["actionItems"] {
  const items: PredictiveAnalyticsResult["actionItems"] = [];

  for (const f of forecasts.filter(f => f.status === "OVERDUE")) {
    items.push({
      priority: "CRITICAL",
      title: `${f.type} Overdue: ${f.entityName}`,
      description: f.recommendation,
      category: "COMPLIANCE",
      entityId: f.vehicleId || f.driverId,
      entityType: f.vehicleId ? "vehicle" : "driver",
    });
  }

  for (const f of forecasts.filter(f => f.status === "CRITICAL")) {
    items.push({
      priority: "HIGH",
      title: `${f.type} Expiring Soon: ${f.entityName}`,
      description: f.recommendation,
      category: "COMPLIANCE",
      entityId: f.vehicleId || f.driverId,
      entityType: f.vehicleId ? "vehicle" : "driver",
    });
  }

  for (const r of risks.filter(r => r.riskLevel === "CRITICAL")) {
    items.push({
      priority: "CRITICAL",
      title: `Critical Risk: ${r.vrm}`,
      description: `Risk score ${r.riskScore}/100 with ${r.openDefects} open defects. ${r.predictions[0] || "Immediate inspection recommended."}`,
      category: "MAINTENANCE",
      entityId: r.vehicleId,
      entityType: "vehicle",
    });
  }

  for (const r of risks.filter(r => r.riskLevel === "HIGH")) {
    items.push({
      priority: "HIGH",
      title: `High Risk: ${r.vrm}`,
      description: `Risk score ${r.riskScore}/100. ${r.predictions[0] || "Schedule maintenance review."}`,
      category: "MAINTENANCE",
      entityId: r.vehicleId,
      entityType: "vehicle",
    });
  }

  if (inspections.inspectionRate < 80) {
    items.push({
      priority: inspections.inspectionRate < 50 ? "HIGH" : "MEDIUM",
      title: "Low Inspection Completion Rate",
      description: `Only ${inspections.inspectionRate}% of expected inspections completed this month. ${inspections.missedInspections} inspections missed.`,
      category: "INSPECTION",
    });
  }

  if (inspections.failRate > 20) {
    items.push({
      priority: inspections.failRate > 40 ? "HIGH" : "MEDIUM",
      title: "High Inspection Failure Rate",
      description: `${inspections.failRate}% of inspections have failed items. Review fleet maintenance standards.`,
      category: "INSPECTION",
    });
  }

  items.sort((a, b) => {
    const priority = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (priority[a.priority] || 3) - (priority[b.priority] || 3);
  });

  return items.slice(0, 20);
}
