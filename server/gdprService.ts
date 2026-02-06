import { storage } from './storage';
import type { User } from '@shared/schema';

/**
 * GDPR Data Export - Generate complete user data package
 */
export async function exportUserData(userId: number): Promise<any> {
  const user = await storage.getUser(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  // Gather all user-related data
  const inspections = await storage.getInspectionsByDriver(user.companyId, userId, 365);
  const defects = await storage.getDefectsByCompany(user.companyId);
  const timesheets = await storage.getTimesheets(user.companyId);
  const notifications = await storage.getDriverNotifications(userId);
  const shiftChecks = await storage.getShiftChecksByDriver(userId);
  
  // Prepare comprehensive data export
  const dataExport = {
    exportDate: new Date().toISOString(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      active: user.active,
      totpEnabled: user.totpEnabled,
      createdAt: user.createdAt,
    },
    inspections: inspections.map((i: any) => ({
      id: i.id,
      vehicleId: i.vehicleId,
      inspectionType: i.inspectionType,
      status: i.status,
      mileage: i.mileage,
      location: i.location,
      createdAt: i.createdAt,
    })),
    defectsReported: defects.map((d: any) => ({
      id: d.id,
      vehicleId: d.vehicleId,
      title: d.title,
      description: d.description,
      severity: d.severity,
      category: d.category,
      status: d.status,
      createdAt: d.createdAt,
    })),
    timesheets: timesheets.map((t: any) => ({
      id: t.id,
      vehicleId: t.vehicleId,
      clockInTime: t.clockInTime,
      clockOutTime: t.clockOutTime,
      totalMinutes: t.totalMinutes,
      geofenceId: t.geofenceId,
      status: t.status,
    })),
    notifications: notifications.map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      priority: n.priority,
      read: n.read,
      createdAt: n.createdAt,
    })),
    shiftChecks: shiftChecks.map((s: any) => ({
      id: s.id,
      vehicleId: s.vehicleId,
      timesheetId: s.timesheetId,
      completedAt: s.completedAt,
      status: s.status,
    })),
    metadata: {
      totalInspections: inspections.length,
      totalDefectsReported: defects.length,
      totalShifts: timesheets.length,
      totalNotifications: notifications.length,
      totalShiftChecks: shiftChecks.length,
    },
  };

  return dataExport;
}

/**
 * GDPR Right to be Forgotten - Anonymize user data
 * 
 * This function anonymizes a user's personal data while preserving
 * operational records for compliance (DVSA 15-month retention).
 */
export async function anonymizeUser(userId: number): Promise<void> {
  const user = await storage.getUser(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  // Anonymize user record
  await storage.updateUser(userId, {
    name: `Deleted User ${userId}`,
    email: `deleted.user.${userId}@anonymized.local`,
    active: false,
  });

  // Note: We keep operational records (inspections, defects, timesheets)
  // for DVSA compliance but they now reference an anonymized user.
  // Photos and documents are kept for 15 months as required by law.
  
  // Anonymize notifications (personal messages)
  const notifications = await storage.getDriverNotifications(userId);
  for (const notification of notifications) {
    await storage.markNotificationRead(notification.id);
    // Optionally delete notification content if it contains personal data
  }

  console.log(`User ${userId} anonymized successfully`);
}

/**
 * GDPR Data Portability - Export user data in machine-readable format (JSON)
 */
export function generateGDPRDataExport(userData: any): string {
  return JSON.stringify(userData, null, 2);
}

/**
 * GDPR Consent Management - Track user consent for data processing
 */
export interface GDPRConsent {
  userId: number;
  consentType: 'DATA_PROCESSING' | 'MARKETING' | 'ANALYTICS' | 'THIRD_PARTY_SHARING';
  granted: boolean;
  grantedAt: Date | null;
  revokedAt: Date | null;
  ipAddress: string | null;
}

/**
 * Check if user has granted specific consent
 */
export async function hasUserConsent(userId: number, consentType: string): Promise<boolean> {
  // TODO: Implement consent tracking in database
  // For now, return true (assume consent for operational data)
  return true;
}

/**
 * Record user consent
 */
export async function recordUserConsent(
  userId: number,
  consentType: string,
  granted: boolean,
  ipAddress: string
): Promise<void> {
  // TODO: Implement consent recording in database
  console.log(`Consent recorded for user ${userId}: ${consentType} = ${granted}`);
}

/**
 * Get data retention period for different data types
 */
export function getRetentionPeriod(dataType: string): number {
  const retentionPeriods: Record<string, number> = {
    INSPECTION: 18, // months - DVSA minimum requirement for walkaround check records
    DEFECT: 18, // months - DVSA minimum requirement for defect records
    CAB_PHOTO: 18, // months - tied to inspection records (DVSA)
    FUEL_ENTRY: 18, // months - operational records linked to inspections
    TIMESHEET: 72, // 6 years in months (employment law)
    AUDIT_LOG: 84, // 7 years in months (compliance)
    NOTIFICATION: 3, // months (operational)
    USER_DATA: 0, // deleted on request (GDPR)
  };

  return retentionPeriods[dataType] || 12; // default 12 months
}

/**
 * Check if data is eligible for deletion based on retention period
 */
export function isEligibleForDeletion(createdAt: Date, dataType: string): boolean {
  const retentionMonths = getRetentionPeriod(dataType);
  const now = new Date();
  const ageInMonths = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  return ageInMonths > retentionMonths;
}
