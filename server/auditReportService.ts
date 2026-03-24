/**
 * AI Audit Report Service
 *
 * Generates a fleet-wide compliance score and letter grade with GPT-4o.
 * Produces actionable uplift paths (e.g., C → A) for every dimension.
 *
 * Dimensions scored:
 *  1. MOT Compliance          (vehicle MOT currency)
 *  2. Defect Resolution       (open defects, severity, time-to-close)
 *  3. Inspection Regularity   (walkaround completion rate)
 *  4. Fuel Integrity          (anomaly rate)
 *  5. Driver Hours Compliance (14h/10h rule infringements)
 *  6. Vehicle Availability    (VOR rate)
 */

import { db } from "./db";
import { vehicles, defects, inspections, fuelEntries, timesheets, users } from "@shared/schema";
import { eq, and, gte, lte, desc, sql, count, isNull } from "drizzle-orm";
import { openai } from "./replit_integrations/image/client";

export interface AuditCategory {
  name: string;
  score: number;       // 0–100
  grade: string;       // A B C D F
  issues: string[];
  actions: string[];
}

export interface AuditReport {
  companyId: number;
  generatedAt: string;
  overallScore: number;
  overallGrade: string;
  previousGrade: string | null;
  categories: AuditCategory[];
  narrative: string;
  topPriorities: string[];
  projectedGrade: string;
  vehiclesAnalysed: number;
  driversAnalysed: number;
}

function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

async function q(sql_: string, params: any[] = []) {
  const { pool } = await import("./db");
  const result = await pool.query(sql_, params);
  return result.rows;
}

export async function generateAuditReport(companyId: number): Promise<AuditReport> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 3600 * 1000);

  // --- 1. Fetch raw fleet data ---
  const [
    allVehicles,
    allDefects,
    recentInspections,
    recentFuel,
    activeDrivers,
  ] = await Promise.all([
    db.select().from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.active, true))),
    db.select().from(defects).where(eq(defects.companyId, companyId)),
    q(
      `SELECT DISTINCT ON (vehicle_id) vehicle_id, completed_at, started_at
       FROM inspections
       WHERE company_id = $1 AND completed_at IS NOT NULL
       ORDER BY vehicle_id, completed_at DESC`,
      [companyId]
    ),
    db.select().from(fuelEntries).where(and(
      eq(fuelEntries.companyId, companyId),
      gte(fuelEntries.createdAt, thirtyDaysAgo)
    )),
    db.select({ id: users.id, name: users.name }).from(users).where(and(
      eq(users.companyId, companyId),
      eq(users.role, "DRIVER"),
      eq(users.active, true)
    )),
  ]);

  const totalVehicles = allVehicles.length || 1;
  const totalDrivers = activeDrivers.length || 1;

  // --- 2. Score each dimension ---

  // DIMENSION 1: MOT Compliance
  let motScore = 100;
  const motIssues: string[] = [];
  const motActions: string[] = [];
  const motExpiredCount = allVehicles.filter(v => {
    if (!v.motDue) return true; // unknown = assume expired
    return new Date(v.motDue) < now;
  }).length;
  const motExpiringSoon = allVehicles.filter(v => {
    if (!v.motDue) return false;
    const d = new Date(v.motDue);
    return d >= now && d <= new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  }).length;
  const motNoDue = allVehicles.filter(v => !v.motDue).length;

  motScore -= motExpiredCount * 25;
  motScore -= motExpiringSoon * 8;
  motScore -= motNoDue * 5;
  motScore = clamp(motScore);

  if (motExpiredCount > 0) motIssues.push(`${motExpiredCount} vehicle${motExpiredCount > 1 ? "s have" : " has"} an expired or missing MOT`);
  if (motExpiringSoon > 0) motIssues.push(`${motExpiringSoon} vehicle${motExpiringSoon > 1 ? "s" : ""} MOT${motExpiringSoon > 1 ? "s expire" : " expires"} within 30 days`);
  if (motNoDue > 0) motIssues.push(`${motNoDue} vehicle${motNoDue > 1 ? "s have" : " has"} no MOT due date recorded`);
  if (motExpiredCount > 0) motActions.push(`Book MOT immediately for ${motExpiredCount} vehicle${motExpiredCount > 1 ? "s" : ""} — operating with expired MOT is a criminal offence`);
  if (motExpiringSoon > 0) motActions.push(`Schedule MOT appointments for ${motExpiringSoon} vehicle${motExpiringSoon > 1 ? "s" : ""} due within 30 days`);
  if (motNoDue > 0) motActions.push(`Verify and record MOT expiry dates for ${motNoDue} vehicle${motNoDue > 1 ? "s" : ""} — run DVSA lookup`);
  if (motIssues.length === 0) { motIssues.push("All vehicles have current MOTs"); motActions.push("Maintain current renewal cadence"); }

  // DIMENSION 2: Defect Resolution
  let defectScore = 100;
  const defectIssues: string[] = [];
  const defectActions: string[] = [];
  const openDefects = allDefects.filter(d => d.status === "OPEN");
  const criticalOpen = openDefects.filter(d => d.severity === "CRITICAL" || d.aiSeverity === "CRITICAL");
  const highOpen = openDefects.filter(d => d.severity === "HIGH" || d.aiSeverity === "HIGH");
  const untriagedDefects = allDefects.filter(d => !d.aiTriaged && d.status === "OPEN");

  // Time-to-close analysis
  const closedDefects = allDefects.filter(d => d.status === "COMPLETED" || d.status === "CANCELLED");
  let avgCloseHours = 48;
  if (closedDefects.length > 0) {
    const withDates = closedDefects.filter(d => d.createdAt && d.updatedAt);
    if (withDates.length > 0) {
      const sum = withDates.reduce((acc, d) => {
        return acc + (new Date(d.updatedAt!).getTime() - new Date(d.createdAt).getTime()) / 3600000;
      }, 0);
      avgCloseHours = sum / withDates.length;
    }
  }

  defectScore -= criticalOpen.length * 30;
  defectScore -= highOpen.length * 15;
  defectScore -= (openDefects.length - criticalOpen.length - highOpen.length) * 5;
  if (avgCloseHours > 72) defectScore -= 10;
  defectScore = clamp(defectScore);

  if (criticalOpen.length > 0) defectIssues.push(`${criticalOpen.length} CRITICAL defect${criticalOpen.length > 1 ? "s" : ""} unresolved — immediate prohibition risk`);
  if (highOpen.length > 0) defectIssues.push(`${highOpen.length} HIGH severity defect${highOpen.length > 1 ? "s" : ""} require urgent attention`);
  if (openDefects.length > 0) defectIssues.push(`${openDefects.length} total open defect${openDefects.length > 1 ? "s" : ""} across the fleet`);
  if (avgCloseHours > 72) defectIssues.push(`Average defect close time is ${Math.round(avgCloseHours)}h (target: <48h)`);
  if (criticalOpen.length > 0) defectActions.push(`Ground vehicles with CRITICAL defects immediately — no exceptions`);
  if (highOpen.length > 0) defectActions.push(`Assign HIGH defects to mechanics today; target 24–48h resolution`);
  if (untriagedDefects.length > 0) defectActions.push(`${untriagedDefects.length} defect${untriagedDefects.length > 1 ? "s" : ""} have not been AI-triaged — trigger analysis to verify severity`);
  if (defectIssues.length === 0) { defectIssues.push("No open defects"); defectActions.push("Continue driver walk-around discipline"); }

  // DIMENSION 3: Inspection Regularity
  let inspectionScore = 100;
  const inspectionIssues: string[] = [];
  const inspectionActions: string[] = [];
  const inspectedVehicleIds = new Set(recentInspections.map((r: any) => r.vehicle_id));
  const overdueVehicles = allVehicles.filter(v => !inspectedVehicleIds.has(v.id));
  const inspectedRecently = recentInspections.filter((r: any) => {
    return r.completed_at && new Date(r.completed_at) >= sevenDaysAgo;
  }).length;
  const completionRate = Math.round((inspectedRecently / totalVehicles) * 100);

  inspectionScore = completionRate;
  inspectionScore -= overdueVehicles.length * 5;
  inspectionScore = clamp(inspectionScore);

  if (overdueVehicles.length > 0) inspectionIssues.push(`${overdueVehicles.length} vehicle${overdueVehicles.length > 1 ? "s" : ""} have no recorded inspection in the last 7 days`);
  if (completionRate < 80) inspectionIssues.push(`Inspection completion rate is ${completionRate}% — DVSA expects daily checks`);
  if (overdueVehicles.length > 0) inspectionActions.push(`Require daily walkarounds for ${overdueVehicles.map(v => v.vrm).join(", ")}`);
  if (completionRate < 100) inspectionActions.push(`Set up automated reminders to drivers before each shift`);
  if (inspectionIssues.length === 0) { inspectionIssues.push("All vehicles inspected within 7 days"); inspectionActions.push("Maintain current inspection discipline"); }

  // DIMENSION 4: Fuel Integrity
  let fuelScore = 100;
  const fuelIssues: string[] = [];
  const fuelActions: string[] = [];
  const agentFuelAnomalies = await q(
    `SELECT COUNT(*) AS n FROM agent_actions WHERE company_id = $1 AND action_type = 'fuel_anomaly' AND created_at >= $2`,
    [companyId, thirtyDaysAgo]
  );
  const anomalyCount = parseInt(agentFuelAnomalies[0]?.n || "0");
  const anomalyRate = recentFuel.length > 0 ? (anomalyCount / recentFuel.length) * 100 : 0;

  fuelScore -= anomalyCount * 12;
  fuelScore = clamp(fuelScore);

  if (anomalyCount > 0) fuelIssues.push(`${anomalyCount} fuel anomaly flag${anomalyCount > 1 ? "s" : ""} in the last 30 days (${anomalyRate.toFixed(0)}% of entries)`);
  if (anomalyCount >= 3) fuelIssues.push(`Repeated anomalies suggest possible misfuelling, data error, or internal theft`);
  if (anomalyCount > 0) fuelActions.push(`Review flagged fuel entries with drivers; verify mileage and tank capacity`);
  if (anomalyCount >= 3) fuelActions.push(`Consider fuel card reconciliation and physical tank checks`);
  if (fuelIssues.length === 0) { fuelIssues.push("No fuel anomalies detected in last 30 days"); fuelActions.push("Continue current fuel logging discipline"); }

  // DIMENSION 5: Driver Hours
  let hoursScore = 100;
  const hoursIssues: string[] = [];
  const hoursActions: string[] = [];
  const longShifts = await q(
    `SELECT u.name, COUNT(*) AS n
     FROM timesheets t
     JOIN users u ON t.driver_id = u.id
     WHERE t.company_id = $1
       AND t.arrival_time >= $2
       AND t.total_minutes > 840
     GROUP BY u.name
     ORDER BY n DESC
     LIMIT 5`,
    [companyId, thirtyDaysAgo]
  );
  const totalInfringements = longShifts.reduce((acc: number, r: any) => acc + parseInt(r.n), 0);

  hoursScore -= totalInfringements * 8;
  hoursScore = clamp(hoursScore);

  if (totalInfringements > 0) hoursIssues.push(`${totalInfringements} shift${totalInfringements > 1 ? "s" : ""} exceeded 14-hour working limit in last 30 days`);
  if (longShifts.length > 0) {
    const names = longShifts.map((r: any) => r.name).join(", ");
    hoursIssues.push(`Drivers with most infringements: ${names}`);
  }
  if (totalInfringements > 0) hoursActions.push(`Brief drivers on Working Time Directive; review roster to spread hours`);
  if (totalInfringements >= 3) hoursActions.push(`Consider a formal hours review — repeat infringements attract DVSA operator licence points`);
  if (hoursIssues.length === 0) { hoursIssues.push("All recorded shifts within legal working time limits"); hoursActions.push("Continue monitoring driver hours proactively"); }

  // DIMENSION 6: Vehicle Availability (VOR)
  let vorScore = 100;
  const vorIssues: string[] = [];
  const vorActions: string[] = [];
  const vorVehicles = allVehicles.filter(v => v.vorStatus === true);
  const vorRate = Math.round((vorVehicles.length / totalVehicles) * 100);

  vorScore -= vorRate * 2;
  vorScore = clamp(vorScore);

  if (vorVehicles.length > 0) vorIssues.push(`${vorVehicles.length} vehicle${vorVehicles.length > 1 ? "s" : ""} currently Off Road (VOR) — ${vorRate}% of fleet unavailable`);
  if (vorVehicles.length > 0) vorActions.push(`Prioritise repair of VOR vehicles: ${vorVehicles.map(v => v.vrm).join(", ")}`);
  if (vorIssues.length === 0) { vorIssues.push("All vehicles available — zero VOR"); vorActions.push("Continue rapid defect resolution to maintain availability"); }

  // --- 3. Composite score ---
  const weights = {
    mot: 0.25,
    defect: 0.25,
    inspection: 0.20,
    fuel: 0.10,
    hours: 0.10,
    vor: 0.10,
  };
  const overallScore = Math.round(
    motScore * weights.mot +
    defectScore * weights.defect +
    inspectionScore * weights.inspection +
    fuelScore * weights.fuel +
    hoursScore * weights.hours +
    vorScore * weights.vor
  );
  const overallGrade = scoreToGrade(overallScore);

  // --- 4. GPT-4o narrative + uplift ---
  const payload = {
    fleet: `${totalVehicles} active vehicles, ${totalDrivers} active drivers`,
    mot: { score: motScore, grade: scoreToGrade(motScore), issues: motIssues, actions: motActions },
    defects: { score: defectScore, grade: scoreToGrade(defectScore), issues: defectIssues, actions: defectActions, openCritical: criticalOpen.length, openHigh: highOpen.length, avgCloseHours: Math.round(avgCloseHours) },
    inspections: { score: inspectionScore, grade: scoreToGrade(inspectionScore), issues: inspectionIssues, actions: inspectionActions, completionRate },
    fuel: { score: fuelScore, grade: scoreToGrade(fuelScore), issues: fuelIssues, actions: fuelActions, anomalies30Days: anomalyCount },
    driverHours: { score: hoursScore, grade: scoreToGrade(hoursScore), issues: hoursIssues, actions: hoursActions, infringements30Days: totalInfringements },
    vor: { score: vorScore, grade: scoreToGrade(vorScore), issues: vorIssues, actions: vorActions, vorVehicleCount: vorVehicles.length },
    overallScore,
    overallGrade,
  };

  let narrative = "Fleet compliance assessed. See category scores above for details.";
  let topPriorities: string[] = [];
  let projectedGrade = overallGrade;

  try {
    const systemPrompt = `You are a DVSA vehicle operator compliance specialist writing a concise audit report for a UK fleet manager. 
Be direct, professional, and specific. Reference UK operator licence obligations and DVSA Guide to Roadworthiness where relevant.
Respond with JSON: { "narrative": "3-4 sentences", "top_priorities": ["priority1", "priority2", "priority3"], "projected_grade": "A|B|C|D|F" }
The projected_grade should be the grade the fleet could achieve within 30 days if all top priorities are actioned.`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Fleet compliance data:\n${JSON.stringify(payload, null, 2)}\n\nWrite the audit narrative, top 3 priorities, and projected grade.` }
      ],
      max_tokens: 600,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = resp.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      narrative = parsed.narrative || narrative;
      topPriorities = Array.isArray(parsed.top_priorities) ? parsed.top_priorities : [];
      projectedGrade = parsed.projected_grade || projectedGrade;
    }
  } catch (err) {
    console.error("[AuditReport] GPT-4o narrative failed:", err instanceof Error ? err.message : err);
    topPriorities = [
      ...motActions.slice(0, 1),
      ...defectActions.slice(0, 1),
      ...inspectionActions.slice(0, 1),
    ].filter(Boolean).slice(0, 3);
  }

  return {
    companyId,
    generatedAt: now.toISOString(),
    overallScore,
    overallGrade,
    previousGrade: null,
    projectedGrade,
    vehiclesAnalysed: totalVehicles,
    driversAnalysed: totalDrivers,
    narrative,
    topPriorities,
    categories: [
      { name: "MOT Compliance", score: motScore, grade: scoreToGrade(motScore), issues: motIssues, actions: motActions },
      { name: "Defect Resolution", score: defectScore, grade: scoreToGrade(defectScore), issues: defectIssues, actions: defectActions },
      { name: "Inspection Regularity", score: inspectionScore, grade: scoreToGrade(inspectionScore), issues: inspectionIssues, actions: inspectionActions },
      { name: "Fuel Integrity", score: fuelScore, grade: scoreToGrade(fuelScore), issues: fuelIssues, actions: fuelActions },
      { name: "Driver Hours", score: hoursScore, grade: scoreToGrade(hoursScore), issues: hoursIssues, actions: hoursActions },
      { name: "Fleet Availability", score: vorScore, grade: scoreToGrade(vorScore), issues: vorIssues, actions: vorActions },
    ],
  };
}
