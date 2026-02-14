import { db } from "./db";
import { defects, vehicles, maintenanceAlerts } from "@shared/schema";
import { eq, and, gte, desc, sql, count } from "drizzle-orm";
import { openai } from "./replit_integrations/image/client";

interface VehicleHealthReport {
  vehicleId: number;
  riskScore: number;
  riskLevel: string;
  predictions: Array<{
    category: string;
    prediction: string;
    recommendation: string;
    confidence: number;
  }>;
  defectTrend: string;
  totalDefects30Days: number;
  totalDefectsAllTime: number;
  openDefects: number;
}

function getRiskLevel(score: number): string {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

export async function analyzeVehicleHealth(vehicleId: number, companyId: number): Promise<VehicleHealthReport> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const allDefects = await db
    .select()
    .from(defects)
    .where(
      and(
        eq(defects.vehicleId, vehicleId),
        eq(defects.companyId, companyId)
      )
    )
    .orderBy(desc(defects.createdAt));

  const recentDefects = allDefects.filter(d => d.createdAt >= ninetyDaysAgo);
  const last30Days = allDefects.filter(d => d.createdAt >= thirtyDaysAgo);
  const prev30Days = allDefects.filter(d => d.createdAt >= sixtyDaysAgo && d.createdAt < thirtyDaysAgo);
  const openDefectsList = allDefects.filter(d => d.status === "OPEN" || d.status === "ASSIGNED" || d.status === "IN_PROGRESS");

  const categoryMap: Record<string, number> = {};
  for (const d of recentDefects) {
    categoryMap[d.category] = (categoryMap[d.category] || 0) + 1;
  }

  const severityMap: Record<string, number> = {};
  for (const d of recentDefects) {
    severityMap[d.severity] = (severityMap[d.severity] || 0) + 1;
  }

  const repeatCategories = Object.values(categoryMap).filter(c => c >= 2).length;

  let trendDirection: string;
  if (last30Days.length > prev30Days.length + 1) {
    trendDirection = "WORSENING";
  } else if (last30Days.length < prev30Days.length - 1) {
    trendDirection = "IMPROVING";
  } else {
    trendDirection = "STABLE";
  }

  const openScore = Math.min(openDefectsList.length * 10, 30);
  const repeatScore = Math.min(repeatCategories * 8, 25);
  const trendScore = trendDirection === "WORSENING" ? 25 : trendDirection === "STABLE" ? 10 : 0;

  const severityScore = Math.min(
    ((severityMap["CRITICAL"] || 0) * 20 +
      (severityMap["HIGH"] || 0) * 10 +
      (severityMap["MEDIUM"] || 0) * 5 +
      (severityMap["LOW"] || 0) * 2),
    20
  );

  const riskScore = Math.min(openScore + repeatScore + trendScore + severityScore, 100);
  const riskLevel = getRiskLevel(riskScore);

  let predictions: VehicleHealthReport["predictions"] = [];

  if (recentDefects.length >= 3) {
    try {
      const defectData = recentDefects.map(d => ({
        category: d.category,
        severity: d.severity,
        status: d.status,
        date: d.createdAt.toISOString().split("T")[0],
        description: d.description?.substring(0, 100)
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a fleet maintenance analyst. Analyze vehicle defect patterns and predict potential failures. Respond with valid JSON only."
          },
          {
            role: "user",
            content: `Analyze these vehicle defects and predict which systems might fail next. Return a JSON array of predictions.

Defect history:
${JSON.stringify(defectData, null, 2)}

Respond with ONLY a JSON array in this format:
[
  {
    "category": "system category (e.g. BRAKES, TYRES, LIGHTS)",
    "prediction": "what might fail and why",
    "recommendation": "what maintenance action to take",
    "confidence": 0-100
  }
]`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content || "[]";
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed)) {
        predictions = parsed.map((p: any) => ({
          category: String(p.category || "UNKNOWN"),
          prediction: String(p.prediction || ""),
          recommendation: String(p.recommendation || ""),
          confidence: Number(p.confidence) || 50
        }));
      }
    } catch (error) {
      console.error(`[PredictiveMaintenance] OpenAI analysis failed for vehicle ${vehicleId}:`, error);
      predictions = generateRulesBasedPredictions(categoryMap, severityMap, openDefectsList.length);
    }
  } else {
    predictions = generateRulesBasedPredictions(categoryMap, severityMap, openDefectsList.length);
  }

  return {
    vehicleId,
    riskScore,
    riskLevel,
    predictions,
    defectTrend: trendDirection,
    totalDefects30Days: last30Days.length,
    totalDefectsAllTime: allDefects.length,
    openDefects: openDefectsList.length
  };
}

function generateRulesBasedPredictions(
  categoryMap: Record<string, number>,
  severityMap: Record<string, number>,
  openCount: number
): VehicleHealthReport["predictions"] {
  const predictions: VehicleHealthReport["predictions"] = [];

  for (const [category, count] of Object.entries(categoryMap)) {
    if (count >= 2) {
      predictions.push({
        category,
        prediction: `Recurring ${category.toLowerCase()} issues detected (${count} defects). This system may need comprehensive inspection.`,
        recommendation: `Schedule a full ${category.toLowerCase()} system inspection and preventive maintenance.`,
        confidence: Math.min(count * 25, 85)
      });
    }
  }

  if ((severityMap["CRITICAL"] || 0) > 0 || (severityMap["HIGH"] || 0) >= 2) {
    predictions.push({
      category: "GENERAL",
      prediction: "High severity defect pattern indicates potential safety risk.",
      recommendation: "Prioritize vehicle for immediate maintenance review.",
      confidence: 75
    });
  }

  if (openCount >= 3) {
    predictions.push({
      category: "GENERAL",
      prediction: `${openCount} unresolved defects may compound into larger failures.`,
      recommendation: "Address open defects promptly to prevent cascading issues.",
      confidence: 70
    });
  }

  return predictions;
}

export async function runPredictiveMaintenance(companyId: number): Promise<void> {
  try {
    const activeVehicles = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.companyId, companyId),
          eq(vehicles.active, true)
        )
      );

    for (const vehicle of activeVehicles) {
      try {
        const report = await analyzeVehicleHealth(vehicle.id, companyId);

        if (report.riskScore >= 40) {
          const existingAlert = await db
            .select()
            .from(maintenanceAlerts)
            .where(
              and(
                eq(maintenanceAlerts.vehicleId, vehicle.id),
                eq(maintenanceAlerts.companyId, companyId),
                eq(maintenanceAlerts.status, "ACTIVE"),
                eq(maintenanceAlerts.riskLevel, report.riskLevel)
              )
            )
            .limit(1);

          if (existingAlert.length > 0) {
            continue;
          }

          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const topPrediction = report.predictions[0];

          await db.insert(maintenanceAlerts).values({
            companyId,
            vehicleId: vehicle.id,
            riskLevel: report.riskLevel,
            riskScore: report.riskScore,
            prediction: topPrediction?.prediction || `Vehicle health risk score: ${report.riskScore}/100. ${report.openDefects} open defects detected.`,
            recommendation: topPrediction?.recommendation || "Schedule preventive maintenance inspection.",
            basedOnDefects: report.totalDefectsAllTime,
            category: topPrediction?.category || "GENERAL",
            status: "ACTIVE",
            expiresAt
          });
        }
      } catch (error) {
        console.error(`[PredictiveMaintenance] Failed to analyze vehicle ${vehicle.id}:`, error);
      }
    }
  } catch (error) {
    console.error(`[PredictiveMaintenance] Failed to run for company ${companyId}:`, error);
  }
}

export async function getMaintenanceAlerts(companyId: number) {
  const now = new Date();

  return db
    .select()
    .from(maintenanceAlerts)
    .where(
      and(
        eq(maintenanceAlerts.companyId, companyId),
        eq(maintenanceAlerts.status, "ACTIVE"),
        gte(maintenanceAlerts.expiresAt, now)
      )
    )
    .orderBy(desc(maintenanceAlerts.riskScore));
}
