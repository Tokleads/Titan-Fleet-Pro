/**
 * Agent Logger — persists autonomous Compliance Agent actions to the database
 * Called by the scheduler, notification triggers, and defect escalation service
 * so managers can see exactly what the AI did while they were offline.
 */

import { db } from './db';
import { agentActions } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export interface LogAgentActionParams {
  companyId: number;
  actionType:
    | 'mot_flagged'
    | 'tax_flagged'
    | 'service_due'
    | 'defect_escalated'
    | 'fuel_anomaly'
    | 'predictive_alert'
    | 'compliance_scan'
    | 'vor_auto'
    | 'inspection_alert';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  vehicleVrm?: string;
  driverName?: string;
  actionTaken?: string;
  referenceId?: number;
}

export async function logAgentAction(params: LogAgentActionParams): Promise<void> {
  try {
    await db.insert(agentActions).values({
      companyId: params.companyId,
      actionType: params.actionType,
      severity: params.severity,
      title: params.title,
      description: params.description,
      vehicleVrm: params.vehicleVrm,
      driverName: params.driverName,
      actionTaken: params.actionTaken,
      referenceId: params.referenceId,
    });
  } catch (err) {
    // Non-critical — never let logging failures break the main scheduler
    console.error('[AgentLogger] Failed to persist agent action:', err instanceof Error ? err.message : err);
  }
}

export async function getAgentActions(companyId: number, limit = 50) {
  return db
    .select()
    .from(agentActions)
    .where(eq(agentActions.companyId, companyId))
    .orderBy(desc(agentActions.createdAt))
    .limit(limit);
}
