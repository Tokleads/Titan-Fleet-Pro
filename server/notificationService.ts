/**
 * Notification Service
 * 
 * Handles sending notifications via email, SMS, and in-app channels.
 * Manages notification preferences, templates, and history.
 */

import { db } from "./db";
import { storage } from "./storage";
import { notificationHistory, notificationPreferences, notificationTemplates } from "../shared/notificationSchema";
import { vehicles, users } from "../shared/schema";
import { eq, and, lte, gte, isNull } from "drizzle-orm";
import { pushNotificationService } from "./pushNotificationService";

export type NotificationType = 
  | 'MOT_EXPIRY'
  | 'TAX_EXPIRY'
  | 'SERVICE_DUE'
  | 'LICENSE_EXPIRY'
  | 'VOR_STATUS'
  | 'DEFECT_REPORTED'
  | 'INSPECTION_FAILED';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP';

interface NotificationData {
  companyId: number;
  userId?: number;
  vehicleId?: number;
  type: NotificationType;
  recipient: string; // Email or phone number
  subject?: string;
  message: string;
  metadata?: Record<string, any>;
  sendInApp?: boolean; // Whether to send in-app notification (default: true)
}

/**
 * Send a notification
 */
export async function sendNotification(data: NotificationData): Promise<boolean> {
  try {
    // Determine channel based on recipient format
    const channel: NotificationChannel = data.recipient.includes('@') ? 'EMAIL' : 'SMS';
    
    // Create notification history record
    const [notification] = await db.insert(notificationHistory).values({
      companyId: data.companyId,
      userId: data.userId,
      vehicleId: data.vehicleId,
      type: data.type,
      channel,
      recipient: data.recipient,
      subject: data.subject,
      message: data.message,
      status: 'PENDING',
      metadata: data.metadata
    }).returning();
    
    // Send based on channel
    let success = false;
    if (channel === 'EMAIL') {
      success = await sendEmail(data.recipient, data.subject || 'Titan Fleet Notification', data.message);
    } else if (channel === 'SMS') {
      success = await sendSMS(data.recipient, data.message);
    }
    
    // Also send in-app notification if userId is provided and sendInApp is not false
    if (data.userId && data.sendInApp !== false) {
      try {
        await pushNotificationService.sendToUser(data.userId, {
          companyId: data.companyId,
          title: data.subject || getNotificationTitle(data.type),
          body: data.message,
          data: {
            type: data.type,
            vehicleId: data.vehicleId?.toString() || '',
            ...data.metadata
          },
          priority: getPriorityForType(data.type)
        });
        console.log(`[IN-APP] Sent notification to user ${data.userId}`);
      } catch (error) {
        console.error('Error sending in-app notification:', error);
        // Don't fail the whole notification if in-app fails
      }
    }
    
    // Update notification status
    await db.update(notificationHistory)
      .set({
        status: success ? 'SENT' : 'FAILED',
        sentAt: success ? new Date() : null,
        failureReason: success ? null : 'Failed to send notification'
      })
      .where(eq(notificationHistory.id, notification.id));
    
    return success;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Send email notification (mock implementation - replace with actual email service)
 */
async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  try {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}, Body: ${body}`);
    
    // Mock success for now
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send SMS notification (mock implementation - replace with actual SMS service)
 */
async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`[SMS] To: ${to}, Message: ${message}`);
    
    // Mock success for now
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

/**
 * Check MOT expiry and send notifications
 */
export async function checkMOTExpiry(): Promise<void> {
  try {
    // Get all companies
    const companies = await storage.getAllCompanies();
    
    for (const company of companies) {
      // Get notification preferences for company
      const [prefs] = await db.select()
        .from(notificationPreferences)
        .where(and(
          eq(notificationPreferences.companyId, company.id),
          isNull(notificationPreferences.userId)
        ))
        .limit(1);
      
      if (!prefs || !prefs.motExpiryEnabled) continue;
      
      const daysThreshold = prefs.motExpiryDays || 30;
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
      
      // Get vehicles with MOT expiring soon
      const vehicleList = await db.select()
        .from(vehicles)
        .where(and(
          eq(vehicles.companyId, company.id),
          lte(vehicles.motDue, thresholdDate)
        ));
      
      // Get all managers for this company
      const managers = await db.select()
        .from(users)
        .where(and(
          eq(users.companyId, company.id),
          eq(users.role, 'manager')
        ));
      
      // Send notifications
      for (const vehicle of vehicleList) {
        if (!vehicle.motDue) continue;
        
        const daysUntilExpiry = Math.ceil((vehicle.motDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        const message = `MOT Expiry Alert: Vehicle ${vehicle.vrm} (${vehicle.make} ${vehicle.model}) MOT expires in ${daysUntilExpiry} days on ${vehicle.motDue.toLocaleDateString('en-GB')}.`;
        
        // Send to each manager
        for (const manager of managers) {
          await sendNotification({
            companyId: company.id,
            userId: manager.id,
            vehicleId: vehicle.id,
            type: 'MOT_EXPIRY',
            recipient: manager.email || prefs.email || company.contactEmail || 'admin@titanfleet.co.uk',
            subject: `MOT Expiry Alert - ${vehicle.vrm}`,
            message,
            metadata: {
              vehicleVRM: vehicle.vrm,
              vehicleMake: vehicle.make,
              vehicleModel: vehicle.model,
              expiryDate: vehicle.motDue.toISOString(),
              daysUntilExpiry
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking MOT expiry:', error);
  }
}

/**
 * Check Tax expiry and send notifications
 */
export async function checkTaxExpiry(): Promise<void> {
  try {
    const companies = await storage.getAllCompanies();
    
    for (const company of companies) {
      const [prefs] = await db.select()
        .from(notificationPreferences)
        .where(and(
          eq(notificationPreferences.companyId, company.id),
          isNull(notificationPreferences.userId)
        ))
        .limit(1);
      
      if (!prefs || !prefs.taxExpiryEnabled) continue;
      
      const daysThreshold = prefs.taxExpiryDays || 30;
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
      
      const vehicleList = await db.select()
        .from(vehicles)
        .where(and(
          eq(vehicles.companyId, company.id),
          lte(vehicles.taxDue, thresholdDate)
        ));
      
      // Get all managers for this company
      const managers = await db.select()
        .from(users)
        .where(and(
          eq(users.companyId, company.id),
          eq(users.role, 'manager')
        ));
      
      for (const vehicle of vehicleList) {
        if (!vehicle.taxDue) continue;
        
        const daysUntilExpiry = Math.ceil((vehicle.taxDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        const message = `Tax Expiry Alert: Vehicle ${vehicle.vrm} (${vehicle.make} ${vehicle.model}) road tax expires in ${daysUntilExpiry} days on ${vehicle.taxDue.toLocaleDateString('en-GB')}.`;
        
        // Send to each manager
        for (const manager of managers) {
          await sendNotification({
            companyId: company.id,
            userId: manager.id,
            vehicleId: vehicle.id,
            type: 'TAX_EXPIRY',
            recipient: manager.email || prefs.email || company.contactEmail || 'admin@titanfleet.co.uk',
            subject: `Tax Expiry Alert - ${vehicle.vrm}`,
            message,
            metadata: {
              vehicleVRM: vehicle.vrm,
              vehicleMake: vehicle.make,
              vehicleModel: vehicle.model,
              expiryDate: vehicle.taxDue.toISOString(),
              daysUntilExpiry
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking tax expiry:', error);
  }
}

/**
 * Check Service due and send notifications
 */
export async function checkServiceDue(): Promise<void> {
  try {
    const companies = await storage.getAllCompanies();
    
    for (const company of companies) {
      const [prefs] = await db.select()
        .from(notificationPreferences)
        .where(and(
          eq(notificationPreferences.companyId, company.id),
          isNull(notificationPreferences.userId)
        ))
        .limit(1);
      
      if (!prefs || !prefs.serviceDueEnabled) continue;
      
      const daysThreshold = prefs.serviceDueDays || 14;
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
      
      const vehicleList = await db.select()
        .from(vehicles)
        .where(and(
          eq(vehicles.companyId, company.id),
          lte(vehicles.nextServiceDue, thresholdDate)
        ));
      
      // Get all managers for this company
      const managers = await db.select()
        .from(users)
        .where(and(
          eq(users.companyId, company.id),
          eq(users.role, 'manager')
        ));
      
      for (const vehicle of vehicleList) {
        if (!vehicle.nextServiceDue) continue;
        
        const daysUntilDue = Math.ceil((vehicle.nextServiceDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        const message = `Service Due Alert: Vehicle ${vehicle.vrm} (${vehicle.make} ${vehicle.model}) service is due in ${daysUntilDue} days on ${vehicle.nextServiceDue.toLocaleDateString('en-GB')}.`;
        
        // Send to each manager
        for (const manager of managers) {
          await sendNotification({
            companyId: company.id,
            userId: manager.id,
            vehicleId: vehicle.id,
            type: 'SERVICE_DUE',
            recipient: manager.email || prefs.email || company.contactEmail || 'admin@titanfleet.co.uk',
            subject: `Service Due Alert - ${vehicle.vrm}`,
            message,
            metadata: {
              vehicleVRM: vehicle.vrm,
              vehicleMake: vehicle.make,
              vehicleModel: vehicle.model,
              dueDate: vehicle.nextServiceDue.toISOString(),
              daysUntilDue
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking service due:', error);
  }
}

/**
 * Send VOR status notification
 */
export async function sendVORNotification(vehicleId: number, status: boolean, reason?: string): Promise<void> {
  try {
    const vehicle = await storage.getVehicle(vehicleId);
    if (!vehicle) return;
    
    const [prefs] = await db.select()
      .from(notificationPreferences)
      .where(and(
        eq(notificationPreferences.companyId, vehicle.companyId),
        isNull(notificationPreferences.userId)
      ))
      .limit(1);
    
    if (!prefs || !prefs.vorStatusEnabled) return;
    
    const statusText = status ? 'OFF ROAD' : 'RETURNED TO SERVICE';
    const message = `VOR Status Change: Vehicle ${vehicle.vrm} (${vehicle.make} ${vehicle.model}) is now ${statusText}.${reason ? ` Reason: ${reason}` : ''}`;
    
    await sendNotification({
      companyId: vehicle.companyId,
      vehicleId: vehicle.id,
      type: 'VOR_STATUS',
      recipient: prefs.email || 'admin@titanfleet.co.uk',
      subject: `VOR Status Change - ${vehicle.vrm}`,
      message,
      metadata: {
        vehicleVRM: vehicle.vrm,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        vorStatus: status,
        reason
      }
    });
  } catch (error) {
    console.error('Error sending VOR notification:', error);
  }
}

/**
 * Get notification title based on type
 */
function getNotificationTitle(type: NotificationType): string {
  const titles: Record<NotificationType, string> = {
    'MOT_EXPIRY': 'MOT Expiry Alert',
    'TAX_EXPIRY': 'Tax Expiry Alert',
    'SERVICE_DUE': 'Service Due Alert',
    'LICENSE_EXPIRY': 'License Expiry Alert',
    'VOR_STATUS': 'VOR Status Change',
    'DEFECT_REPORTED': 'Defect Reported',
    'INSPECTION_FAILED': 'Inspection Failed'
  };
  return titles[type] || 'Titan Fleet Notification';
}

/**
 * Get notification priority based on type
 */
function getPriorityForType(type: NotificationType): 'high' | 'normal' {
  const highPriority: NotificationType[] = ['VOR_STATUS', 'DEFECT_REPORTED', 'INSPECTION_FAILED'];
  return highPriority.includes(type) ? 'high' : 'normal';
}

/**
 * Initialize default notification preferences for a company
 */
export async function initializeNotificationPreferences(companyId: number): Promise<void> {
  try {
    // Check if preferences already exist
    const existing = await db.select()
      .from(notificationPreferences)
      .where(and(
        eq(notificationPreferences.companyId, companyId),
        isNull(notificationPreferences.userId)
      ))
      .limit(1);
    
    if (existing.length > 0) return;
    
    // Create default preferences
    await db.insert(notificationPreferences).values({
      companyId,
      userId: null,
      emailEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      motExpiryEnabled: true,
      taxExpiryEnabled: true,
      serviceDueEnabled: true,
      licenseExpiryEnabled: true,
      vorStatusEnabled: true,
      defectReportedEnabled: true,
      inspectionFailedEnabled: true,
      motExpiryDays: 30,
      taxExpiryDays: 30,
      serviceDueDays: 14,
      licenseExpiryDays: 30
    });
  } catch (error) {
    console.error('Error initializing notification preferences:', error);
  }
}
