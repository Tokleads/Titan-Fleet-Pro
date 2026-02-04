import { db } from "./db";
import { users, vehicles, notifications } from "@shared/schema";
import { eq, and, lte, gte, sql } from "drizzle-orm";
import { storage } from "./storage";

type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface CreateNotificationParams {
  companyId: number;
  senderId: number;
  recipientId: number | null;
  title: string;
  message: string;
  priority: NotificationPriority;
  isBroadcast?: boolean;
}

async function getManagersByCompany(companyId: number) {
  return await db.select().from(users)
    .where(and(
      eq(users.companyId, companyId),
      sql`${users.role} IN ('MANAGER', 'TRANSPORT_MANAGER', 'ADMIN')`,
      eq(users.active, true)
    ));
}

async function createNotificationHelper(params: CreateNotificationParams) {
  const [notification] = await db.insert(notifications).values({
    companyId: params.companyId,
    senderId: params.senderId,
    recipientId: params.recipientId,
    title: params.title,
    message: params.message,
    priority: params.priority,
    isBroadcast: params.isBroadcast || false,
    isRead: false,
  }).returning();
  return notification;
}

function mapSeverityToPriority(severity: string): NotificationPriority {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return 'URGENT';
    case 'HIGH':
      return 'HIGH';
    case 'MEDIUM':
    case 'MAJOR':
      return 'HIGH';
    case 'LOW':
    case 'MINOR':
      return 'NORMAL';
    default:
      return 'NORMAL';
  }
}

export async function triggerDefectReported(params: {
  companyId: number;
  vehicleId: number;
  reportedBy: number;
  description: string;
  severity?: string;
}) {
  try {
    const [vehicle, driver] = await Promise.all([
      storage.getVehicleById(params.vehicleId),
      storage.getUser(params.reportedBy)
    ]);

    if (!vehicle || !driver) {
      console.error('triggerDefectReported: Vehicle or driver not found');
      return;
    }

    const managers = await getManagersByCompany(params.companyId);
    if (managers.length === 0) {
      console.log('triggerDefectReported: No managers to notify');
      return;
    }

    const severity = params.severity || 'MEDIUM';
    const priority = mapSeverityToPriority(severity);
    const title = `Defect Reported - ${vehicle.vrm}`;
    const message = `${driver.name} reported a ${severity.toLowerCase()} defect: ${params.description}`;

    for (const manager of managers) {
      await createNotificationHelper({
        companyId: params.companyId,
        senderId: params.reportedBy,
        recipientId: manager.id,
        title,
        message,
        priority,
      });
    }

    console.log(`Defect notification sent to ${managers.length} manager(s)`);
  } catch (error) {
    console.error('triggerDefectReported error:', error);
  }
}

export async function triggerInspectionFailed(params: {
  companyId: number;
  vehicleId: number;
  driverId: number;
  defectCount: number;
}) {
  try {
    const [vehicle, driver] = await Promise.all([
      storage.getVehicleById(params.vehicleId),
      storage.getUser(params.driverId)
    ]);

    if (!vehicle || !driver) {
      console.error('triggerInspectionFailed: Vehicle or driver not found');
      return;
    }

    const managers = await getManagersByCompany(params.companyId);
    if (managers.length === 0) {
      console.log('triggerInspectionFailed: No managers to notify');
      return;
    }

    const title = `Failed Inspection - ${vehicle.vrm}`;
    const message = `${driver.name} completed inspection with ${params.defectCount} defect(s)`;

    for (const manager of managers) {
      await createNotificationHelper({
        companyId: params.companyId,
        senderId: params.driverId,
        recipientId: manager.id,
        title,
        message,
        priority: 'HIGH',
      });
    }

    console.log(`Failed inspection notification sent to ${managers.length} manager(s)`);
  } catch (error) {
    console.error('triggerInspectionFailed error:', error);
  }
}

export async function triggerNewDriverWelcome(params: {
  companyId: number;
  newDriverId: number;
  addedByManagerId: number;
}) {
  try {
    const company = await storage.getCompanyById(params.companyId);
    
    if (!company) {
      console.error('triggerNewDriverWelcome: Company not found');
      return;
    }

    await createNotificationHelper({
      companyId: params.companyId,
      senderId: params.addedByManagerId,
      recipientId: params.newDriverId,
      title: `Welcome to ${company.name}`,
      message: 'Your account has been set up. You can now log in and start your inspections.',
      priority: 'NORMAL',
    });

    console.log(`Welcome notification sent to new driver ${params.newDriverId}`);
  } catch (error) {
    console.error('triggerNewDriverWelcome error:', error);
  }
}

export async function checkMOTExpiryWarnings(): Promise<{ checked: number; notified: number }> {
  try {
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiringVehicles = await db.select().from(vehicles)
      .where(and(
        eq(vehicles.active, true),
        lte(vehicles.motDue, fourteenDaysFromNow),
        gte(vehicles.motDue, today)
      ));

    let notificationCount = 0;

    const vehiclesByCompany = new Map<number, typeof expiringVehicles>();
    for (const vehicle of expiringVehicles) {
      const existing = vehiclesByCompany.get(vehicle.companyId) || [];
      existing.push(vehicle);
      vehiclesByCompany.set(vehicle.companyId, existing);
    }

    for (const [companyId, companyVehicles] of vehiclesByCompany) {
      const managers = await getManagersByCompany(companyId);
      
      if (managers.length === 0) continue;

      for (const vehicle of companyVehicles) {
        const motDate = vehicle.motDue ? new Date(vehicle.motDue).toLocaleDateString('en-GB') : 'Unknown';
        const title = `MOT Expiring Soon - ${vehicle.vrm}`;
        const message = `MOT expires on ${motDate}. Please schedule renewal.`;

        for (const manager of managers) {
          await createNotificationHelper({
            companyId,
            senderId: managers[0].id,
            recipientId: manager.id,
            title,
            message,
            priority: 'HIGH',
          });
          notificationCount++;
        }
      }
    }

    console.log(`MOT expiry check: ${expiringVehicles.length} vehicles checked, ${notificationCount} notifications sent`);
    return { checked: expiringVehicles.length, notified: notificationCount };
  } catch (error) {
    console.error('checkMOTExpiryWarnings error:', error);
    return { checked: 0, notified: 0 };
  }
}

export const notificationTriggers = {
  defectReported: triggerDefectReported,
  inspectionFailed: triggerInspectionFailed,
  newDriverWelcome: triggerNewDriverWelcome,
  checkMOTExpiry: checkMOTExpiryWarnings,
};
