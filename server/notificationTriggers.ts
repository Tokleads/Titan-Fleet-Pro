import { db } from "./db";
import { users, vehicles, notifications, defects, fuelEntries } from "@shared/schema";
import { eq, and, lte, gte, sql, desc } from "drizzle-orm";
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

export async function checkDefectEscalation(): Promise<{ checked: number; escalated: number }> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const openDefects = await db.select().from(defects)
      .where(and(
        eq(defects.status, 'OPEN'),
        lte(defects.createdAt, twentyFourHoursAgo),
        sql`${defects.severity} != 'CRITICAL'`
      ));
    
    let escalatedCount = 0;
    
    for (const defect of openDefects) {
      const newSeverity = defect.severity === 'LOW' ? 'MEDIUM' 
        : defect.severity === 'MEDIUM' ? 'HIGH' 
        : defect.severity === 'HIGH' ? 'CRITICAL' 
        : defect.severity;
      
      if (newSeverity !== defect.severity) {
        await db.update(defects)
          .set({ severity: newSeverity, updatedAt: new Date() })
          .where(eq(defects.id, defect.id));
        escalatedCount++;
        
        const vehicle = defect.vehicleId ? await storage.getVehicleById(defect.vehicleId) : null;
        const vrm = vehicle?.vrm || 'Unknown';
        
        const managers = await getManagersByCompany(defect.companyId);
        const hoursOpen = Math.round((Date.now() - new Date(defect.createdAt).getTime()) / 3600000);
        
        for (const manager of managers) {
          await createNotificationHelper({
            companyId: defect.companyId,
            senderId: managers[0].id,
            recipientId: manager.id,
            title: `Defect Escalated - ${vrm}`,
            message: `Unresolved defect "${defect.description}" has been open for ${hoursOpen}h. Severity escalated to ${newSeverity}.`,
            priority: newSeverity === 'CRITICAL' ? 'URGENT' : 'HIGH',
          });
        }
      }
    }
    
    console.log(`Defect escalation: ${openDefects.length} checked, ${escalatedCount} escalated`);
    return { checked: openDefects.length, escalated: escalatedCount };
  } catch (error) {
    console.error('checkDefectEscalation error:', error);
    return { checked: 0, escalated: 0 };
  }
}

export async function checkFuelAnomalies(): Promise<{ checked: number; flagged: number }> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentEntries = await db.select().from(fuelEntries)
      .where(gte(fuelEntries.createdAt, oneDayAgo));
    
    let flaggedCount = 0;
    
    for (const entry of recentEntries) {
      const historicalEntries = await db.select().from(fuelEntries)
        .where(and(
          eq(fuelEntries.vehicleId, entry.vehicleId),
          eq(fuelEntries.fuelType, entry.fuelType),
          sql`${fuelEntries.id} != ${entry.id}`
        ))
        .orderBy(desc(fuelEntries.createdAt))
        .limit(30);
      
      if (historicalEntries.length < 3) continue;
      
      const amounts = historicalEntries.map(e => Number(e.litres));
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const company = await storage.getCompanyById(entry.companyId);
      const companySettings = (company?.settings as any) || {};
      const multiplier = companySettings.fuelAnomalyThreshold ?? 2.0;
      const threshold = avg * multiplier;
      
      if (Number(entry.litres) > threshold && avg > 0) {
        flaggedCount++;
        
        const vehicle = await storage.getVehicleById(entry.vehicleId);
        const driver = await storage.getUser(entry.driverId);
        const vrm = vehicle?.vrm || 'Unknown';
        const driverName = driver?.name || 'Unknown driver';
        
        const managers = await getManagersByCompany(entry.companyId);
        
        for (const manager of managers) {
          await createNotificationHelper({
            companyId: entry.companyId,
            senderId: managers[0].id,
            recipientId: manager.id,
            title: `Fuel Anomaly - ${vrm}`,
            message: `${driverName} logged ${entry.litres}L of ${entry.fuelType} for ${vrm}. This is ${(Number(entry.litres) / avg * 100).toFixed(0)}% of the vehicle average (${avg.toFixed(0)}L). Please investigate.`,
            priority: 'HIGH',
          });
        }
      }
    }
    
    console.log(`Fuel anomaly check: ${recentEntries.length} entries checked, ${flaggedCount} flagged`);
    return { checked: recentEntries.length, flagged: flaggedCount };
  } catch (error) {
    console.error('checkFuelAnomalies error:', error);
    return { checked: 0, flagged: 0 };
  }
}

export async function triggerDeliveryCompleted(params: {
  companyId: number;
  driverId: number;
  vehicleId: number | null;
  customerName: string;
  deliveryId: number;
  referenceNumber?: string;
}) {
  try {
    const driver = await storage.getUser(params.driverId);
    const vehicle = params.vehicleId ? await storage.getVehicleById(params.vehicleId) : null;

    if (!driver) {
      console.error('triggerDeliveryCompleted: Driver not found');
      return;
    }

    const managers = await getManagersByCompany(params.companyId);
    if (managers.length === 0) {
      console.log('triggerDeliveryCompleted: No managers to notify');
      return;
    }

    const driverName = driver.name || 'Unknown driver';
    const vrm = vehicle?.vrm;
    const title = vrm
      ? `Delivery Completed - ${params.customerName} (${vrm})`
      : `Delivery Completed - ${params.customerName}`;
    const message = `${driverName} completed delivery to ${params.customerName}${params.referenceNumber ? ' (Ref: ' + params.referenceNumber + ')' : ''}. POD with signature and photos available.`;

    for (const manager of managers) {
      await createNotificationHelper({
        companyId: params.companyId,
        senderId: params.driverId,
        recipientId: manager.id,
        title,
        message,
        priority: 'NORMAL',
      });
    }

    console.log(`Delivery completed notification sent to ${managers.length} manager(s)`);
  } catch (error) {
    console.error('triggerDeliveryCompleted error:', error);
  }
}

export const notificationTriggers = {
  defectReported: triggerDefectReported,
  inspectionFailed: triggerInspectionFailed,
  newDriverWelcome: triggerNewDriverWelcome,
  checkMOTExpiry: checkMOTExpiryWarnings,
  checkDefectEscalation,
  checkFuelAnomalies,
  deliveryCompleted: triggerDeliveryCompleted,
};
