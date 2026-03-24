/**
 * Inspection Chasing Service
 *
 * Finds vehicles that haven't had a completed walkaround inspection within the
 * configured interval (default: 24 hours for commercial vehicles) and:
 *  1. Logs an agent action
 *  2. Notifies transport managers
 *
 * Also sweeps for defects that have never been AI-triaged and triages them.
 */

import { db } from "./db";
import { vehicles, users, notifications, defects } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";
import { logAgentAction } from "./agentLogger";
import { triageDefect } from "./aiTriageService";

async function q(sql: string, params: any[] = []) {
  const { pool } = await import("./db");
  const result = await pool.query(sql, params);
  return result.rows;
}

async function notify(companyId: number, managerId: number, title: string, message: string) {
  try {
    await db.insert(notifications).values({
      companyId,
      senderId: managerId,
      recipientId: null,
      title,
      message,
      priority: "HIGH",
      isBroadcast: true,
      isRead: false,
    });
  } catch (_) {}
}

export async function checkOverdueInspections(): Promise<{ checked: number; flagged: number }> {
  try {
    // Find active vehicles across all companies with no inspection in last 24h
    const overdueRows = await q(
      `SELECT v.id AS vehicle_id, v.vrm, v.make, v.model, v.company_id,
              MAX(i.completed_at) AS last_inspection
       FROM vehicles v
       LEFT JOIN inspections i ON i.vehicle_id = v.id AND i.completed_at IS NOT NULL
       WHERE v.active = TRUE AND v.vor_status IS NOT TRUE
       GROUP BY v.id, v.vrm, v.make, v.model, v.company_id
       HAVING MAX(i.completed_at) < NOW() - INTERVAL '24 hours'
          OR MAX(i.completed_at) IS NULL`,
      []
    );

    let flagged = 0;

    for (const row of overdueRows) {
      const { vehicle_id, vrm, make, model, company_id, last_inspection } = row;
      const hoursAgo = last_inspection
        ? Math.round((Date.now() - new Date(last_inspection).getTime()) / 3600000)
        : null;
      const label = hoursAgo ? `${hoursAgo}h ago` : "never";

      const managers = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.companyId, company_id),
            eq(users.active, true),
          )
        )
        .limit(3);

      const managerId = managers[0]?.id;
      if (!managerId) continue;

      await notify(
        company_id,
        managerId,
        `Inspection Overdue — ${vrm}`,
        `${vrm} (${make} ${model}) last inspected: ${label}. Ensure driver completes a walkaround before the next journey.`
      );

      await logAgentAction({
        companyId: company_id,
        actionType: "inspection_alert",
        severity: hoursAgo && hoursAgo > 48 ? "critical" : "warning",
        title: `Inspection overdue — ${vrm}`,
        description: `${vrm} (${make} ${model}) has not had a completed walkaround inspection since ${label}. DVSA requires daily checks for commercial vehicles.`,
        vehicleVrm: vrm,
        actionTaken: `Transport managers notified. Inspection must be completed before next operation.`,
      });

      flagged++;
    }

    console.log(`[InspectionChasing] ${overdueRows.length} vehicles checked, ${flagged} overdue inspections flagged`);
    return { checked: overdueRows.length, flagged };
  } catch (err) {
    console.error("[InspectionChasing] checkOverdueInspections error:", err);
    return { checked: 0, flagged: 0 };
  }
}

export async function sweepUntriagedDefects(): Promise<{ found: number; triaged: number }> {
  try {
    // Find open defects that haven't been AI-triaged yet, across all companies
    const untriaged = await q(
      `SELECT id, company_id, description, photo
       FROM defects
       WHERE (ai_triaged IS NULL OR ai_triaged = FALSE)
         AND status = 'OPEN'
       ORDER BY created_at ASC
       LIMIT 20`,
      []
    );

    let triaged = 0;
    for (const row of untriaged) {
      try {
        await triageDefect(row.id);
        triaged++;

        // Re-fetch to get AI results
        const [updated] = await db.select().from(defects).where(eq(defects.id, row.id)).limit(1);
        if (updated && updated.aiSeverity === "CRITICAL") {
          await logAgentAction({
            companyId: row.company_id,
            actionType: "defect_escalated",
            severity: "critical",
            title: `AI triage: CRITICAL defect detected`,
            description: `Defect "${row.description}" classified CRITICAL by AI (${updated.aiConfidence}% confidence). ${updated.aiAnalysis}`,
            actionTaken: "Severity updated automatically. Managers should review immediately.",
            referenceId: row.id,
          });
        } else if (updated && updated.aiSeverity === "HIGH") {
          await logAgentAction({
            companyId: row.company_id,
            actionType: "defect_escalated",
            severity: "warning",
            title: `AI triage: HIGH severity defect`,
            description: `Defect "${row.description}" classified HIGH by AI (${updated.aiConfidence}% confidence). ${updated.aiAnalysis}`,
            actionTaken: "Severity updated. Repair required within 24–48 hours.",
            referenceId: row.id,
          });
        }
      } catch (err) {
        console.error(`[AITriage] Failed to triage defect ${row.id}:`, err instanceof Error ? err.message : err);
      }
    }

    console.log(`[AITriage] Untriaged sweep: ${untriaged.length} found, ${triaged} triaged`);
    return { found: untriaged.length, triaged };
  } catch (err) {
    console.error("[AITriage] sweepUntriagedDefects error:", err);
    return { found: 0, triaged: 0 };
  }
}
