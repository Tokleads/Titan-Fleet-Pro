/**
 * Notification Scheduler Service
 * 
 * Runs automated checks for compliance notifications:
 * - MOT expiry alerts
 * - Tax expiry alerts
 * - Service due reminders
 * - Driver license expiry alerts
 * 
 * Uses node-cron to schedule daily checks at 8:00 AM
 */

import cron from 'node-cron';
import { 
  checkMOTExpiry, 
  checkTaxExpiry, 
  checkServiceDue
} from './notificationService';
import { checkDefectEscalation, checkFuelAnomalies } from './notificationTriggers';
import { runPredictiveMaintenance } from './predictiveMaintenanceService';
import { runAllHealthChecks } from './apiHealthService';
import { db } from './db';
import { companies } from '@shared/schema';
import { eq } from 'drizzle-orm';

let isSchedulerRunning = false;
let lastRunTime: Date | null = null;
let lastRunStatus: 'success' | 'error' | null = null;
let lastRunError: string | null = null;

/**
 * Run all notification checks
 * Can be called manually or by cron job
 */
export async function runNotificationChecks(): Promise<{
  success: boolean;
  timestamp: Date;
  results: {
    motExpiry: { success: boolean; error?: string };
    taxExpiry: { success: boolean; error?: string };
    serviceDue: { success: boolean; error?: string };
    defectEscalation: { success: boolean; error?: string };
    fuelAnomalies: { success: boolean; error?: string };
    predictiveMaintenance: { success: boolean; error?: string };
  };
}> {
  const timestamp = new Date();
  console.log(`[Scheduler] Running notification checks at ${timestamp.toISOString()}`);

  const results = {
    motExpiry: { success: false, error: undefined as string | undefined },
    taxExpiry: { success: false, error: undefined as string | undefined },
    serviceDue: { success: false, error: undefined as string | undefined },
    defectEscalation: { success: false, error: undefined as string | undefined },
    fuelAnomalies: { success: false, error: undefined as string | undefined },
    predictiveMaintenance: { success: false, error: undefined as string | undefined },
  };

  // Check MOT expiry
  try {
    await checkMOTExpiry();
    results.motExpiry.success = true;
    console.log('[Scheduler] ✓ MOT expiry check complete');
  } catch (error) {
    results.motExpiry.success = false;
    results.motExpiry.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Scheduler] ✗ MOT expiry check failed:', error);
  }

  // Check Tax expiry
  try {
    await checkTaxExpiry();
    results.taxExpiry.success = true;
    console.log('[Scheduler] ✓ Tax expiry check complete');
  } catch (error) {
    results.taxExpiry.success = false;
    results.taxExpiry.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Scheduler] ✗ Tax expiry check failed:', error);
  }

  // Check Service due
  try {
    await checkServiceDue();
    results.serviceDue.success = true;
    console.log('[Scheduler] ✓ Service due check complete');
  } catch (error) {
    results.serviceDue.success = false;
    results.serviceDue.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Scheduler] ✗ Service due check failed:', error);
  }

  // Check Defect escalation
  try {
    await checkDefectEscalation();
    results.defectEscalation.success = true;
    console.log('[Scheduler] ✓ Defect escalation check complete');
  } catch (error) {
    results.defectEscalation.success = false;
    results.defectEscalation.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Scheduler] ✗ Defect escalation check failed:', error);
  }

  // Check Fuel anomalies
  try {
    await checkFuelAnomalies();
    results.fuelAnomalies.success = true;
    console.log('[Scheduler] ✓ Fuel anomaly check complete');
  } catch (error) {
    results.fuelAnomalies.success = false;
    results.fuelAnomalies.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Scheduler] ✗ Fuel anomaly check failed:', error);
  }

  // Run predictive maintenance for all active companies
  try {
    const activeCompanies = await db.select({ id: companies.id }).from(companies).where(eq(companies.isActive, true));
    for (const company of activeCompanies) {
      await runPredictiveMaintenance(company.id);
    }
    results.predictiveMaintenance.success = true;
    console.log('[Scheduler] ✓ Predictive maintenance check complete');
  } catch (error) {
    results.predictiveMaintenance.success = false;
    results.predictiveMaintenance.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Scheduler] ✗ Predictive maintenance check failed:', error);
  }

  // Note: License expiry check not implemented yet
  // Uncomment when checkLicenseExpiry is added to notificationService
  // try {
  //   await checkLicenseExpiry();
  //   results.licenseExpiry.success = true;
  //   console.log('[Scheduler] ✓ License expiry check complete');
  // } catch (error) {
  //   results.licenseExpiry.success = false;
  //   results.licenseExpiry.error = error instanceof Error ? error.message : 'Unknown error';
  //   console.error('[Scheduler] ✗ License expiry check failed:', error);
  // }

  const allSuccess = Object.values(results).every(r => r.success);
  
  lastRunTime = timestamp;
  lastRunStatus = allSuccess ? 'success' : 'error';
  lastRunError = allSuccess ? null : 'Some checks failed';

  console.log(`[Scheduler] Notification checks complete. Success: ${allSuccess}`);

  return {
    success: allSuccess,
    timestamp,
    results,
  };
}

/**
 * Start the notification scheduler
 * Runs daily at 8:00 AM
 */
export function startScheduler(): void {
  if (isSchedulerRunning) {
    console.log('[Scheduler] Already running, skipping start');
    return;
  }

  console.log('[Scheduler] Starting notification scheduler...');

  // Schedule daily at 8:00 AM
  // Cron format: second minute hour day month weekday
  // '0 8 * * *' = At 8:00 AM every day
  cron.schedule('0 8 * * *', async () => {
    console.log('[Scheduler] Cron job triggered');
    try {
      await runNotificationChecks();
    } catch (error) {
      console.error('[Scheduler] Error in cron job:', error);
      lastRunStatus = 'error';
      lastRunError = error instanceof Error ? error.message : 'Unknown error';
    }
  });

  cron.schedule('0 * * * *', async () => {
    console.log('[Scheduler] Running hourly API health checks...');
    try {
      await runAllHealthChecks();
      console.log('[Scheduler] API health checks completed successfully');
    } catch (error) {
      console.error('[Scheduler] API health check error:', error);
    }
  });

  cron.schedule('0 */4 * * *', async () => {
    console.log('[Scheduler] Running defect escalation and fuel anomaly checks...');
    try {
      await checkDefectEscalation();
      await checkFuelAnomalies();
    } catch (error) {
      console.error('[Scheduler] Error in 4-hourly checks:', error);
    }
  });

  isSchedulerRunning = true;
  console.log('[Scheduler] ✓ Notification scheduler started (runs daily at 8:00 AM, defect/fuel checks every 4 hours)');

  // Run once on startup for immediate check (optional)
  // Comment out if you don't want immediate execution on server start
  setTimeout(async () => {
    console.log('[Scheduler] Running initial notification check on startup...');
    try {
      await runNotificationChecks();
    } catch (error) {
      console.error('[Scheduler] Error in startup check:', error);
    }
  }, 5000); // Wait 5 seconds after server start
}

/**
 * Stop the notification scheduler
 */
export function stopScheduler(): void {
  if (!isSchedulerRunning) {
    console.log('[Scheduler] Not running, skipping stop');
    return;
  }

  // Note: node-cron doesn't provide a direct way to stop all tasks
  // In production, you'd want to keep references to tasks and stop them individually
  isSchedulerRunning = false;
  console.log('[Scheduler] Notification scheduler stopped');
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  isRunning: boolean;
  lastRunTime: Date | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunError: string | null;
  nextRunTime: string;
} {
  return {
    isRunning: isSchedulerRunning,
    lastRunTime,
    lastRunStatus,
    lastRunError,
    nextRunTime: 'Daily at 8:00 AM',
  };
}
