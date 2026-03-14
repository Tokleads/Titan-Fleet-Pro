import { db } from './db';
import { driverHoursLogs, users, timesheets } from '@shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

const DAILY_DRIVING_MAX = 9 * 60;
const DAILY_DRIVING_EXTENDED = 10 * 60;
const WEEKLY_DRIVING_MAX = 56 * 60;
const FORTNIGHTLY_DRIVING_MAX = 90 * 60;
const DAILY_REST_MIN = 11 * 60;
const WEEKLY_REST_MIN = 45 * 60;
const WTD_WEEKLY_MAX = 60 * 60;
const WTD_AVERAGE_MAX = 48 * 60;
const WTD_REFERENCE_WEEKS = 17;

export interface DriverHoursSummary {
  driverId: number;
  driverName: string;
  todayDriving: number;
  todayOtherWork: number;
  todayTotal: number;
  weekDriving: number;
  weekTotal: number;
  fortnightDriving: number;
  remainingDailyDriving: number;
  remainingWeeklyDriving: number;
  wtdWeeklyHours: number;
  wtdAverageHours: number;
  infringements: Infringement[];
  status: 'ok' | 'warning' | 'critical';
}

export interface Infringement {
  type: string;
  severity: 'warning' | 'critical';
  description: string;
  date: string;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0, 0, 0, 0);
  return r;
}

export async function getDriverHoursSummary(companyId: number, driverId: number): Promise<DriverHoursSummary> {
  const now = new Date();
  const today = startOfDay(now);
  const weekStart = startOfWeek(now);
  const fortnightStart = new Date(weekStart);
  fortnightStart.setDate(fortnightStart.getDate() - 7);

  const [driver] = await db.select({ id: users.id, name: users.name })
    .from(users).where(eq(users.id, driverId));

  const logs = await db.select().from(driverHoursLogs)
    .where(and(
      eq(driverHoursLogs.driverId, driverId),
      gte(driverHoursLogs.date, fortnightStart)
    ))
    .orderBy(desc(driverHoursLogs.date));

  let todayDriving = 0, todayOtherWork = 0;
  let weekDriving = 0, weekTotal = 0;
  let fortnightDriving = 0;

  for (const log of logs) {
    const logDate = new Date(log.date);
    const driving = log.drivingMinutes;
    const work = log.otherWorkMinutes;
    const total = driving + work + log.availabilityMinutes;

    if (logDate >= today) {
      todayDriving += driving;
      todayOtherWork += work;
    }
    if (logDate >= weekStart) {
      weekDriving += driving;
      weekTotal += total;
    }
    fortnightDriving += driving;
  }

  const todayTotal = todayDriving + todayOtherWork;
  const remainingDailyDriving = Math.max(0, DAILY_DRIVING_MAX - todayDriving);
  const remainingWeeklyDriving = Math.max(0, WEEKLY_DRIVING_MAX - weekDriving);

  const wtdWeeklyHours = Math.round(weekTotal / 60 * 10) / 10;
  const wtdAverageHours = Math.round(weekTotal / 60 * 10) / 10;

  const infringements = detectInfringements(logs, todayDriving, weekDriving, fortnightDriving, weekTotal);

  const status = infringements.some(i => i.severity === 'critical') ? 'critical'
    : infringements.some(i => i.severity === 'warning') ? 'warning' : 'ok';

  return {
    driverId,
    driverName: driver?.name || 'Unknown',
    todayDriving,
    todayOtherWork,
    todayTotal,
    weekDriving,
    weekTotal,
    fortnightDriving,
    remainingDailyDriving,
    remainingWeeklyDriving,
    wtdWeeklyHours,
    wtdAverageHours,
    infringements,
    status,
  };
}

function detectInfringements(
  logs: any[],
  todayDriving: number,
  weekDriving: number,
  fortnightDriving: number,
  weekTotal: number
): Infringement[] {
  const infringements: Infringement[] = [];
  const today = new Date().toISOString().split('T')[0];

  if (todayDriving > DAILY_DRIVING_EXTENDED) {
    infringements.push({
      type: 'daily_driving_exceeded',
      severity: 'critical',
      description: `Daily driving ${Math.round(todayDriving / 60 * 10) / 10}h exceeds maximum 10h`,
      date: today,
    });
  } else if (todayDriving > DAILY_DRIVING_MAX) {
    infringements.push({
      type: 'daily_driving_extended',
      severity: 'warning',
      description: `Daily driving ${Math.round(todayDriving / 60 * 10) / 10}h exceeds standard 9h limit (10h allowed twice/week)`,
      date: today,
    });
  }

  if (weekDriving > WEEKLY_DRIVING_MAX) {
    infringements.push({
      type: 'weekly_driving_exceeded',
      severity: 'critical',
      description: `Weekly driving ${Math.round(weekDriving / 60 * 10) / 10}h exceeds 56h limit`,
      date: today,
    });
  } else if (weekDriving > WEEKLY_DRIVING_MAX * 0.9) {
    infringements.push({
      type: 'weekly_driving_approaching',
      severity: 'warning',
      description: `Weekly driving ${Math.round(weekDriving / 60 * 10) / 10}h approaching 56h limit`,
      date: today,
    });
  }

  if (fortnightDriving > FORTNIGHTLY_DRIVING_MAX) {
    infringements.push({
      type: 'fortnightly_driving_exceeded',
      severity: 'critical',
      description: `Fortnightly driving ${Math.round(fortnightDriving / 60 * 10) / 10}h exceeds 90h limit`,
      date: today,
    });
  }

  if (weekTotal > WTD_WEEKLY_MAX) {
    infringements.push({
      type: 'wtd_weekly_exceeded',
      severity: 'critical',
      description: `Working Time Directive: ${Math.round(weekTotal / 60 * 10) / 10}h exceeds 60h weekly max`,
      date: today,
    });
  }

  return infringements;
}

export async function getAllDriverHoursSummaries(companyId: number): Promise<DriverHoursSummary[]> {
  const drivers = await db.select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.role, 'DRIVER'), eq(users.active, true)));

  const summaries: DriverHoursSummary[] = [];
  for (const driver of drivers) {
    try {
      const summary = await getDriverHoursSummary(companyId, driver.id);
      summaries.push(summary);
    } catch (err) {
      console.error(`[DriverHours] Error for driver ${driver.id}:`, err);
    }
  }

  return summaries.sort((a, b) => {
    const statusOrder = { critical: 0, warning: 1, ok: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });
}

export async function logDriverHours(data: {
  companyId: number;
  driverId: number;
  date: Date;
  drivingMinutes: number;
  otherWorkMinutes: number;
  availabilityMinutes?: number;
  restMinutes?: number;
  breakMinutes?: number;
  source?: string;
  notes?: string;
}) {
  const [existing] = await db.select().from(driverHoursLogs)
    .where(and(
      eq(driverHoursLogs.driverId, data.driverId),
      eq(driverHoursLogs.date, data.date)
    ));

  if (existing) {
    await db.update(driverHoursLogs)
      .set({
        drivingMinutes: data.drivingMinutes,
        otherWorkMinutes: data.otherWorkMinutes,
        availabilityMinutes: data.availabilityMinutes || 0,
        restMinutes: data.restMinutes || 0,
        breakMinutes: data.breakMinutes || 0,
        source: data.source || 'manual',
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(driverHoursLogs.id, existing.id));
    return existing.id;
  }

  const [inserted] = await db.insert(driverHoursLogs).values({
    companyId: data.companyId,
    driverId: data.driverId,
    date: data.date,
    drivingMinutes: data.drivingMinutes,
    otherWorkMinutes: data.otherWorkMinutes,
    availabilityMinutes: data.availabilityMinutes || 0,
    restMinutes: data.restMinutes || 0,
    breakMinutes: data.breakMinutes || 0,
    source: data.source || 'manual',
    notes: data.notes,
  }).returning();

  return inserted.id;
}
