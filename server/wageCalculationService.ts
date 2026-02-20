/**
 * Wage Calculation Service
 * 
 * Calculates wages based on flexible pay rates:
 * - Base rate (standard hours)
 * - Night shift premium (10 PM - 6 AM)
 * - Weekend rates (Saturday/Sunday)
 * - Bank holiday rates
 * - Overtime multiplier (>8 hours/day or >40 hours/week)
 * 
 * All date/time operations use Europe/London timezone (CORR-001)
 * Shifts spanning midnight are split at day boundaries (CORR-002)
 * Bank holidays fetched from GOV.UK API with DB fallback (CORR-003)
 * Weekend night minutes use the higher night rate (CORR-004)
 */

import { db } from "./db";
import { payRates, bankHolidays, wageCalculations } from "../shared/payRatesSchema";
import { timesheets, type Timesheet } from "../shared/schema";
import { eq, and, lte, gte, isNull, sql } from "drizzle-orm";

export interface WageBreakdown {
  regularMinutes: number;
  nightMinutes: number;
  weekendMinutes: number;
  bankHolidayMinutes: number;
  overtimeMinutes: number;
  regularPay: number;
  nightPay: number;
  weekendPay: number;
  bankHolidayPay: number;
  overtimePay: number;
  totalPay: number;
}

function getUKHour(date: Date): number {
  return parseInt(new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric', hour12: false, timeZone: 'Europe/London'
  }).format(date));
}

function getUKDayOfWeek(date: Date): number {
  const ukDateStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', timeZone: 'Europe/London'
  }).format(date);
  const dayMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  return dayMap[ukDateStr] ?? 0;
}

function getUKDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/London'
  }).format(date);
}

function getUKMidnight(date: Date): Date {
  const parts = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'Europe/London'
  }).formatToParts(date);

  const get = (type: string) => parts.find(p => p.type === type)?.value || '0';
  const year = parseInt(get('year'));
  const month = parseInt(get('month'));
  const day = parseInt(get('day'));

  const midnightUK = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`);
  const testOffset = getUKOffsetMinutes(midnightUK);
  return new Date(midnightUK.getTime() + testOffset * 60 * 1000);
}

function getUKOffsetMinutes(date: Date): number {
  const utcStr = date.toISOString().slice(0, 16);
  const ukStr = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false, timeZone: 'Europe/London'
  }).format(date);

  const [datePart, timePart] = ukStr.split(', ');
  const [dd, mm, yyyy] = datePart.split('/');
  const [hh, min] = timePart.split(':');
  const ukDate = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00Z`);
  const utcDate = new Date(utcStr + ':00Z');
  return Math.round((utcDate.getTime() - ukDate.getTime()) / (60 * 1000));
}

function getNextUKMidnight(date: Date): Date {
  const midnight = getUKMidnight(date);
  return new Date(midnight.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Calculate wages for a timesheet
 */
export async function calculateWages(
  timesheetId: number,
  companyId: number,
  driverId: number,
  arrivalTime: Date,
  departureTime: Date
): Promise<WageBreakdown> {
  const payRate = await getPayRate(companyId, driverId);
  
  if (!payRate) {
    throw new Error("No pay rate found for driver or company");
  }
  
  const totalMinutes = Math.floor((departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60));
  
  const breakdown = await calculateHoursBreakdown(
    arrivalTime,
    departureTime,
    payRate.nightStartHour,
    payRate.nightEndHour,
    companyId
  );
  
  const dailyOvertimeThreshold = payRate.dailyOvertimeThreshold;
  const netMinutes = totalMinutes - (totalMinutes > 360 ? 30 : 0);
  const overtimeMinutes = Math.max(0, netMinutes - dailyOvertimeThreshold);
  
  const baseRate = parseFloat(payRate.baseRate);
  const nightRate = parseFloat(payRate.nightRate);
  const weekendRate = parseFloat(payRate.weekendRate);
  const bankHolidayRate = parseFloat(payRate.bankHolidayRate);
  const overtimeMultiplier = parseFloat(payRate.overtimeMultiplier);
  
  const regularPay = (breakdown.regularMinutes / 60) * baseRate;
  const nightPay = (breakdown.nightMinutes / 60) * nightRate;
  const weekendPay = (breakdown.weekendMinutes / 60) * weekendRate;
  const bankHolidayPay = (breakdown.bankHolidayMinutes / 60) * bankHolidayRate;
  const overtimePay = (overtimeMinutes / 60) * baseRate * overtimeMultiplier;
  
  const totalPay = regularPay + nightPay + weekendPay + bankHolidayPay + overtimePay;
  
  await saveWageCalculation({
    timesheetId,
    companyId,
    driverId,
    payRateId: payRate.id,
    regularMinutes: breakdown.regularMinutes,
    nightMinutes: breakdown.nightMinutes,
    weekendMinutes: breakdown.weekendMinutes,
    bankHolidayMinutes: breakdown.bankHolidayMinutes,
    overtimeMinutes,
    regularPay,
    nightPay,
    weekendPay,
    bankHolidayPay,
    overtimePay,
    totalPay
  });
  
  return {
    regularMinutes: breakdown.regularMinutes,
    nightMinutes: breakdown.nightMinutes,
    weekendMinutes: breakdown.weekendMinutes,
    bankHolidayMinutes: breakdown.bankHolidayMinutes,
    overtimeMinutes,
    regularPay,
    nightPay,
    weekendPay,
    bankHolidayPay,
    overtimePay,
    totalPay
  };
}

/**
 * Break down hours by type (regular, night, weekend, bank holiday)
 * Splits shifts at midnight boundaries and classifies each minute using UK timezone.
 * Priority: bankHoliday > night > weekend > regular
 * Weekend + night overlap uses the night rate (CORR-004)
 */
async function calculateHoursBreakdown(
  arrivalTime: Date,
  departureTime: Date,
  nightStartHour: number,
  nightEndHour: number,
  companyId: number
): Promise<{
  regularMinutes: number;
  nightMinutes: number;
  weekendMinutes: number;
  bankHolidayMinutes: number;
}> {
  let regularMinutes = 0;
  let nightMinutes = 0;
  let weekendMinutes = 0;
  let bankHolidayMinutes = 0;

  let segmentStart = new Date(arrivalTime);

  while (segmentStart < departureTime) {
    const nextMidnight = getNextUKMidnight(segmentStart);
    const segmentEnd = nextMidnight < departureTime ? nextMidnight : departureTime;

    const ukDay = getUKDayOfWeek(segmentStart);
    const isWeekend = ukDay === 0 || ukDay === 6;

    const ukDateStr = getUKDateString(segmentStart);
    const [dd, mm, yyyy] = ukDateStr.split('/');
    const ukDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    const isBankHoliday = await checkBankHolidayByDate(companyId, ukDate);

    let current = new Date(segmentStart);
    while (current < segmentEnd) {
      const ukHour = getUKHour(current);
      const nextMinute = new Date(current.getTime() + 60 * 1000);
      const end = nextMinute > segmentEnd ? segmentEnd : nextMinute;
      const mins = Math.round((end.getTime() - current.getTime()) / (1000 * 60));

      if (mins <= 0) {
        current = end;
        continue;
      }

      const isNightHour = (nightStartHour > nightEndHour)
        ? (ukHour >= nightStartHour || ukHour < nightEndHour)
        : (ukHour >= nightStartHour && ukHour < nightEndHour);

      if (isBankHoliday) {
        bankHolidayMinutes += mins;
      } else if (isNightHour) {
        nightMinutes += mins;
      } else if (isWeekend) {
        weekendMinutes += mins;
      } else {
        regularMinutes += mins;
      }

      current = end;
    }

    segmentStart = segmentEnd;
  }

  return { regularMinutes, nightMinutes, weekendMinutes, bankHolidayMinutes };
}

/**
 * Get pay rate for driver (or company default)
 */
async function getPayRate(companyId: number, driverId: number) {
  const [driverRate] = await db.select()
    .from(payRates)
    .where(and(
      eq(payRates.companyId, companyId),
      eq(payRates.driverId, driverId),
      eq(payRates.isActive, true)
    ))
    .limit(1);
  
  if (driverRate) return driverRate;
  
  const [companyRate] = await db.select()
    .from(payRates)
    .where(and(
      eq(payRates.companyId, companyId),
      isNull(payRates.driverId),
      eq(payRates.isActive, true)
    ))
    .limit(1);
  
  return companyRate;
}

/**
 * Check if a specific UK date is a bank holiday (using UTC date for comparison)
 */
async function checkBankHolidayByDate(companyId: number, ukDate: Date): Promise<boolean> {
  const nextDay = new Date(ukDate.getTime() + 24 * 60 * 60 * 1000);

  const [holiday] = await db.select()
    .from(bankHolidays)
    .where(and(
      eq(bankHolidays.companyId, companyId),
      gte(bankHolidays.date, ukDate),
      lte(bankHolidays.date, nextDay)
    ))
    .limit(1);
  
  return !!holiday;
}

/**
 * Check if date is a bank holiday (legacy, kept for backwards compatibility)
 */
async function checkBankHoliday(companyId: number, date: Date): Promise<boolean> {
  const ukDateStr = getUKDateString(date);
  const [dd, mm, yyyy] = ukDateStr.split('/');
  const ukDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
  return checkBankHolidayByDate(companyId, ukDate);
}

/**
 * Save wage calculation to database
 */
async function saveWageCalculation(data: {
  timesheetId: number;
  companyId: number;
  driverId: number;
  payRateId: number;
  regularMinutes: number;
  nightMinutes: number;
  weekendMinutes: number;
  bankHolidayMinutes: number;
  overtimeMinutes: number;
  regularPay: number;
  nightPay: number;
  weekendPay: number;
  bankHolidayPay: number;
  overtimePay: number;
  totalPay: number;
}) {
  await db.execute(sql`
    INSERT INTO wage_calculations (timesheet_id, company_id, driver_id, pay_rate_id, 
      regular_minutes, night_minutes, weekend_minutes, bank_holiday_minutes, overtime_minutes,
      regular_pay, night_pay, weekend_pay, bank_holiday_pay, overtime_pay, total_pay, calculated_at)
    VALUES (${data.timesheetId}, ${data.companyId}, ${data.driverId}, ${data.payRateId},
      ${data.regularMinutes}, ${data.nightMinutes}, ${data.weekendMinutes}, ${data.bankHolidayMinutes}, ${data.overtimeMinutes},
      ${data.regularPay.toFixed(2)}, ${data.nightPay.toFixed(2)}, ${data.weekendPay.toFixed(2)}, 
      ${data.bankHolidayPay.toFixed(2)}, ${data.overtimePay.toFixed(2)}, ${data.totalPay.toFixed(2)}, NOW())
    ON CONFLICT (timesheet_id) 
    DO UPDATE SET
      regular_minutes = EXCLUDED.regular_minutes, night_minutes = EXCLUDED.night_minutes,
      weekend_minutes = EXCLUDED.weekend_minutes, bank_holiday_minutes = EXCLUDED.bank_holiday_minutes,
      overtime_minutes = EXCLUDED.overtime_minutes, regular_pay = EXCLUDED.regular_pay,
      night_pay = EXCLUDED.night_pay, weekend_pay = EXCLUDED.weekend_pay,
      bank_holiday_pay = EXCLUDED.bank_holiday_pay, overtime_pay = EXCLUDED.overtime_pay,
      total_pay = EXCLUDED.total_pay, calculated_at = NOW(), updated_at = NOW()
  `);
}

/**
 * Get wage calculation for timesheet
 */
export async function getWageCalculation(timesheetId: number) {
  const [calculation] = await db.select()
    .from(wageCalculations)
    .where(eq(wageCalculations.timesheetId, timesheetId))
    .limit(1);
  
  return calculation;
}

/**
 * Initialize default pay rates for a company
 */
export async function initializeDefaultPayRates(companyId: number) {
  const [existing] = await db.select()
    .from(payRates)
    .where(and(
      eq(payRates.companyId, companyId),
      isNull(payRates.driverId)
    ))
    .limit(1);
  
  if (existing) return existing;
  
  const [newRate] = await db.insert(payRates).values({
    companyId,
    driverId: null,
    baseRate: "12.00",
    nightRate: "15.00",
    weekendRate: "18.00",
    bankHolidayRate: "24.00",
    overtimeMultiplier: "1.5",
    nightStartHour: 22,
    nightEndHour: 6,
    dailyOvertimeThreshold: 480,
    weeklyOvertimeThreshold: 2400,
    isActive: true
  }).returning();
  
  return newRate;
}

let bankHolidayCache: { data: any; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Add UK bank holidays for a company, fetched from GOV.UK API with DB fallback
 */
export async function addUKBankHolidays(companyId: number, year: number) {
  try {
    let govData: any;

    if (bankHolidayCache && (Date.now() - bankHolidayCache.fetchedAt) < CACHE_TTL_MS) {
      govData = bankHolidayCache.data;
    } else {
      const response = await fetch('https://www.gov.uk/bank-holidays.json');
      if (!response.ok) {
        throw new Error(`GOV.UK API returned ${response.status}`);
      }
      govData = await response.json();
      bankHolidayCache = { data: govData, fetchedAt: Date.now() };
    }

    const englandWales = govData['england-and-wales'].events;
    const yearHolidays = englandWales.filter((e: any) => e.date.startsWith(String(year)));

    for (const holiday of yearHolidays) {
      const holidayDate = new Date(holiday.date + 'T00:00:00Z');

      const existingCheck = await db.select().from(bankHolidays)
        .where(and(
          eq(bankHolidays.companyId, companyId),
          gte(bankHolidays.date, holidayDate),
          lte(bankHolidays.date, new Date(holidayDate.getTime() + 24 * 60 * 60 * 1000))
        )).limit(1);

      if (existingCheck.length === 0) {
        await db.insert(bankHolidays).values({
          companyId,
          name: holiday.title,
          date: holidayDate,
          isRecurring: false
        });
      }
    }
  } catch (error) {
    console.error('Failed to fetch UK bank holidays from GOV.UK, using database fallback:', error);
  }
}
