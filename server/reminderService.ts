import { storage } from './storage';
import type { Reminder } from '@shared/schema';
import { db } from './db';
import { companies } from '@shared/schema';
import { eq } from 'drizzle-orm';

export type ReminderType = 'MOT' | 'SERVICE' | 'TACHO' | 'INSURANCE' | 'TAX' | 'INSPECTION';

interface ReminderEscalation {
  level: number;
  daysBeforeDue: number;
  label: string;
}

const ESCALATION_LEVELS: ReminderEscalation[] = [
  { level: 1, daysBeforeDue: 30, label: '30 days notice' },
  { level: 2, daysBeforeDue: 14, label: '14 days notice' },
  { level: 3, daysBeforeDue: 7, label: '7 days notice' },
  { level: 4, daysBeforeDue: 1, label: '1 day notice' },
  { level: 5, daysBeforeDue: 0, label: 'OVERDUE' },
];

/**
 * Calculate days until due date
 */
function getDaysUntilDue(dueDate: Date): number {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Determine escalation level based on days until due
 */
function getEscalationLevel(daysUntilDue: number): number {
  if (daysUntilDue < 0) return 5; // Overdue
  if (daysUntilDue <= 1) return 4;
  if (daysUntilDue <= 7) return 3;
  if (daysUntilDue <= 14) return 2;
  if (daysUntilDue <= 30) return 1;
  return 0; // Not yet escalated
}

/**
 * Check if reminder needs notification based on escalation level
 */
function needsNotification(reminder: Reminder, currentEscalationLevel: number): boolean {
  // If escalation level increased, send notification
  if (currentEscalationLevel > (reminder.escalationLevel || 0)) {
    return true;
  }
  
  // If overdue and no notification sent in last 24 hours, send reminder
  if (currentEscalationLevel === 5 && reminder.lastNotificationSent) {
    const hoursSinceLastNotification = (Date.now() - new Date(reminder.lastNotificationSent).getTime()) / (1000 * 60 * 60);
    return hoursSinceLastNotification >= 24;
  }
  
  return false;
}

/**
 * Get reminder priority for sorting
 */
export function getReminderPriority(reminder: Reminder): number {
  const daysUntilDue = getDaysUntilDue(new Date(reminder.dueDate));
  
  if (daysUntilDue < 0) return 1000; // Overdue - highest priority
  if (daysUntilDue === 0) return 900; // Due today
  if (daysUntilDue === 1) return 800; // Due tomorrow
  if (daysUntilDue <= 7) return 700; // Due this week
  if (daysUntilDue <= 14) return 600; // Due in 2 weeks
  if (daysUntilDue <= 30) return 500; // Due this month
  
  return 100; // Future
}

/**
 * Get reminder status color for UI
 */
export function getReminderStatusColor(reminder: Reminder): string {
  const daysUntilDue = getDaysUntilDue(new Date(reminder.dueDate));
  
  if (reminder.status === 'COMPLETED') return 'green';
  if (reminder.status === 'DISMISSED') return 'gray';
  if (reminder.status === 'SNOOZED') return 'blue';
  
  if (daysUntilDue < 0) return 'red'; // Overdue
  if (daysUntilDue <= 7) return 'orange'; // Due soon
  if (daysUntilDue <= 14) return 'yellow'; // Approaching
  
  return 'blue'; // Future
}

/**
 * Process all active reminders and update escalation levels
 * This should be run daily via cron job
 */
export async function processReminders(): Promise<{
  processed: number;
  escalated: number;
  notificationsSent: number;
  errors: string[];
}> {
  const stats = {
    processed: 0,
    escalated: 0,
    notificationsSent: 0,
    errors: [] as string[],
  };
  
  try {
    // Get all active reminders across all companies
    const reminders = await storage.getActiveReminders();
    
    for (const reminder of reminders) {
      try {
        stats.processed++;
        
        // Skip snoozed reminders that haven't reached snooze end date
        if (reminder.status === 'SNOOZED' && reminder.snoozedUntil) {
          if (new Date(reminder.snoozedUntil) > new Date()) {
            continue;
          }
          // Snooze period ended, reactivate
          await storage.updateReminder(reminder.id, { status: 'ACTIVE', snoozedUntil: null });
        }
        
        const daysUntilDue = getDaysUntilDue(new Date(reminder.dueDate));
        const currentEscalationLevel = getEscalationLevel(daysUntilDue);
        
        // Update escalation level if changed
        if (currentEscalationLevel !== reminder.escalationLevel) {
          await storage.updateReminder(reminder.id, { escalationLevel: currentEscalationLevel });
          stats.escalated++;
        }
        
        // Check if notification needed
        if (needsNotification(reminder, currentEscalationLevel)) {
          await sendReminderNotification(reminder, currentEscalationLevel);
          await storage.updateReminder(reminder.id, {
            lastNotificationSent: new Date(),
            notificationCount: (reminder.notificationCount || 0) + 1,
          });
          stats.notificationsSent++;
        }
        
        // Handle recurring reminders that are completed
        if (reminder.recurring && reminder.status === 'COMPLETED' && reminder.nextRecurrenceDate) {
          const nextDue = new Date(reminder.nextRecurrenceDate);
          if (nextDue <= new Date()) {
            // Create next occurrence
            await storage.createReminder({
              companyId: reminder.companyId,
              vehicleId: reminder.vehicleId,
              type: reminder.type,
              title: reminder.title,
              description: reminder.description,
              dueDate: nextDue,
              recurring: true,
              recurrenceInterval: reminder.recurrenceInterval,
              nextRecurrenceDate: reminder.recurrenceInterval 
                ? new Date(nextDue.getTime() + reminder.recurrenceInterval * 24 * 60 * 60 * 1000)
                : null,
            });
          }
        }
      } catch (error) {
        stats.errors.push(`Error processing reminder ${reminder.id}: ${error}`);
      }
    }
  } catch (error) {
    stats.errors.push(`Fatal error in processReminders: ${error}`);
  }
  
  return stats;
}

/**
 * Send reminder notification via email
 */
async function sendReminderNotification(reminder: Reminder, escalationLevel: number): Promise<void> {
  try {
    // Get vehicle and company details
    const vehicle = await storage.getVehicle(reminder.vehicleId);
    const company = await storage.getCompany(reminder.companyId);
    
    if (!vehicle || !company) {
      throw new Error('Vehicle or company not found');
    }
    
    const escalation = ESCALATION_LEVELS.find(e => e.level === escalationLevel);
    const daysUntilDue = getDaysUntilDue(new Date(reminder.dueDate));
    
    const subject = escalationLevel === 5
      ? `OVERDUE: ${reminder.type} for ${vehicle.vrm}`
      : `Reminder: ${reminder.type} for ${vehicle.vrm} - ${escalation?.label}`;
    
    const message = `
      Vehicle: ${vehicle.vrm} (${vehicle.make} ${vehicle.model})
      Reminder Type: ${reminder.type}
      Due Date: ${new Date(reminder.dueDate).toLocaleDateString()}
      Days Until Due: ${daysUntilDue}
      
      ${reminder.description || ''}
      
      Please take action to complete this ${reminder.type} requirement.
    `;
    
    console.log(`[REMINDER] ${subject}`);
    try {
      const { sendEmail } = await import('./emailService');
      const companyRecord = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
      const managerEmail = companyRecord[0]?.contactEmail;
      if (managerEmail) {
        await sendEmail({
          to: managerEmail,
          subject,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚛 Titan Fleet</h1>
            </div>
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1e293b;">${subject}</h2>
              <pre style="white-space: pre-wrap; color: #334155;">${message}</pre>
            </div>
          </div>`,
          text: message,
        });
      }
    } catch (emailError) {
      console.error('[REMINDER] Email delivery failed:', emailError);
    }
  } catch (error) {
    console.error('Failed to send reminder notification:', error);
    throw error;
  }
}

/**
 * Get upcoming reminders for a company (for dashboard widget)
 */
export async function getUpcomingReminders(companyId: number, limit: number = 10): Promise<Reminder[]> {
  const reminders = await storage.getActiveReminders(companyId);
  
  // Sort by priority (overdue first, then by due date)
  return reminders
    .sort((a, b) => getReminderPriority(b) - getReminderPriority(a))
    .slice(0, limit);
}

/**
 * Get overdue reminders count for a company
 */
export async function getOverdueCount(companyId: number): Promise<number> {
  const reminders = await storage.getActiveReminders(companyId);
  return reminders.filter(r => getDaysUntilDue(new Date(r.dueDate)) < 0).length;
}
