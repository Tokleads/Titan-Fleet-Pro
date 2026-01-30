import { storage } from "./storage";
import { Request } from "express";
import type { InsertAuditLog } from "@shared/schema";
import { createHash } from 'crypto';

export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'ASSIGN' | 'VERIFY' | 'APPROVE' | 'COMPLETE' | 'CLOCK_IN' | 'CLOCK_OUT';
export type AuditEntity = 'USER' | 'VEHICLE' | 'INSPECTION' | 'DEFECT' | 'FUEL' | 'SETTINGS' | 'SESSION' | 'TRAILER' | 'DOCUMENT' | 'TIMESHEET' | 'RECTIFICATION' | 'GEOFENCE' | 'NOTIFICATION' | 'SHIFT_CHECK' | 'REMINDER';

interface AuditLogParams {
  companyId: number;
  userId?: number | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: number | null;
  details?: Record<string, unknown>;
  req?: Request;
}

function getClientIp(req?: Request): string | undefined {
  if (!req) return undefined;
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || undefined;
}

function getUserAgent(req?: Request): string | undefined {
  if (!req) return undefined;
  return req.headers['user-agent'] || undefined;
}

/**
 * Generate SHA-256 hash for audit log entry
 */
function generateHash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Create hash string from audit log data
 */
function createHashString(log: InsertAuditLog, previousHash: string | null, timestamp: Date): string {
  const data = JSON.stringify({
    companyId: log.companyId,
    userId: log.userId,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    details: log.details,
    timestamp: timestamp.toISOString(),
    previousHash: previousHash || 'GENESIS',
  });
  return data;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    // Get the last audit log entry for this company to chain hashes
    const logs = await storage.getAuditLogs(params.companyId, { limit: 1 });
    const lastLog = logs[0] || null;
    const previousHash = lastLog?.currentHash || null;
    
    // Prepare log entry
    const log: InsertAuditLog = {
      companyId: params.companyId,
      userId: params.userId || null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId || null,
      details: params.details || null,
      ipAddress: getClientIp(params.req) || null,
      userAgent: getUserAgent(params.req) || null,
      previousHash,
      currentHash: '', // Will be calculated
    };
    
    // Generate current hash
    const timestamp = new Date();
    const hashString = createHashString(log, previousHash, timestamp);
    log.currentHash = generateHash(hashString);
    
    await storage.createAuditLog(log);
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Verify the integrity of the audit log chain for a company
 */
export async function verifyAuditLogIntegrity(companyId: number): Promise<{
  valid: boolean;
  totalEntries: number;
  firstTamperedEntry?: number;
  errors: string[];
}> {
  try {
    const logs = await storage.getAuditLogs(companyId, { limit: 10000 });
    
    if (logs.length === 0) {
      return { valid: true, totalEntries: 0, errors: [] };
    }
    
    const errors: string[] = [];
    let firstTamperedEntry: number | undefined;
    
    // Verify each entry's hash
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const previousHash = i === 0 ? null : logs[i - 1].currentHash;
      
      // Verify previous hash matches
      if (log.previousHash !== previousHash) {
        errors.push(`Entry ${log.id}: Previous hash mismatch`);
        if (!firstTamperedEntry) firstTamperedEntry = log.id;
      }
      
      // Recalculate current hash and verify
      const hashString = createHashString(
        {
          companyId: log.companyId,
          userId: log.userId,
          action: log.action as AuditAction,
          entity: log.entity as AuditEntity,
          entityId: log.entityId,
          details: log.details as Record<string, unknown> | null,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          previousHash: log.previousHash,
          currentHash: '', // Not used in hash calculation
        },
        previousHash,
        new Date(log.createdAt)
      );
      const expectedHash = generateHash(hashString);
      
      if (log.currentHash !== expectedHash) {
        errors.push(`Entry ${log.id}: Current hash mismatch (tampering detected)`);
        if (!firstTamperedEntry) firstTamperedEntry = log.id;
      }
    }
    
    return {
      valid: errors.length === 0,
      totalEntries: logs.length,
      firstTamperedEntry,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      totalEntries: 0,
      errors: [`Verification failed: ${error}`],
    };
  }
}

export function formatAuditAction(action: string): string {
  const actionLabels: Record<string, string> = {
    'LOGIN': 'Logged in',
    'LOGOUT': 'Logged out',
    'CREATE': 'Created',
    'UPDATE': 'Updated',
    'DELETE': 'Deleted',
    'VIEW': 'Viewed',
    'EXPORT': 'Exported',
  };
  return actionLabels[action] || action;
}

export function formatAuditEntity(entity: string): string {
  const entityLabels: Record<string, string> = {
    'USER': 'User',
    'VEHICLE': 'Vehicle',
    'INSPECTION': 'Inspection',
    'DEFECT': 'Defect',
    'FUEL': 'Fuel Entry',
    'SETTINGS': 'Settings',
    'SESSION': 'Session',
    'TRAILER': 'Trailer',
    'DOCUMENT': 'Document',
  };
  return entityLabels[entity] || entity;
}
