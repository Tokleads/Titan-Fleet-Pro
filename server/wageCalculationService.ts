/**
 * Wage Calculation Service
 * 
 * Calculates wages based on flexible pay rates:
 * - Base rate (standard hours)
 * - Night shift premium (10 PM - 6 AM)
 * - Weekend rates (Saturday/Sunday)
 * - Bank holiday rates
 * - Overtime multiplier (>8 hours/day or >40 hours/week)
 */

import { db } from "./db";
import { payRates, bankHolidays, wageCalculations } from "../shared/payRatesSchema";
import { timesheets, type Timesheet } from "../shared/schema";
import { eq, and, lte, gte, isNull } from "drizzle-orm";

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
  // Get pay rate for driver (or company default)
  const payRate = await getPayRate(companyId, driverId);
  
  if (!payRate) {
    throw new Error("No pay rate found for driver or company");
  }
  
  // Check if date is a bank holiday
  const isBankHoliday = await checkBankHoliday(companyId, arrivalTime);
  
  // Calculate total minutes
  const totalMinutes = Math.floor((departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60));
  
  // Break down hours by type
  const breakdown = calculateHoursBreakdown(
    arrivalTime,
    departureTime,
    totalMinutes,
    payRate.nightStartHour,
    payRate.nightEndHour,
    isBankHoliday
  );
  
  // Calculate overtime (>8 hours/day)
  const dailyOvertimeThreshold = payRate.dailyOvertimeThreshold;
  const netMinutes = totalMinutes - (totalMinutes > 360 ? 30 : 0); // Subtract break time
  const overtimeMinutes = Math.max(0, netMinutes - dailyOvertimeThreshold);
  
  // Calculate pay for each category
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
  
  // Save calculation to database
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
 */
function calculateHoursBreakdown(
  arrivalTime: Date,
  departureTime: Date,
  totalMinutes: number,
  nightStartHour: number,
  nightEndHour: number,
  isBankHoliday: boolean
): {
  regularMinutes: number;
  nightMinutes: number;
  weekendMinutes: number;
  bankHolidayMinutes: number;
} {
  // If bank holiday, all hours are bank holiday hours
  if (isBankHoliday) {
    return {
      regularMinutes: 0,
      nightMinutes: 0,
      weekendMinutes: 0,
      bankHolidayMinutes: totalMinutes
    };
  }
  
  // Check if weekend
  const dayOfWeek = arrivalTime.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekend) {
    // Weekend: split between regular weekend and night weekend
    const nightMinutes = calculateNightMinutes(arrivalTime, departureTime, nightStartHour, nightEndHour);
    return {
      regularMinutes: 0,
      nightMinutes: 0,
      weekendMinutes: totalMinutes - nightMinutes,
      bankHolidayMinutes: 0
    };
  }
  
  // Weekday: split between regular and night
  const nightMinutes = calculateNightMinutes(arrivalTime, departureTime, nightStartHour, nightEndHour);
  return {
    regularMinutes: totalMinutes - nightMinutes,
    nightMinutes,
    weekendMinutes: 0,
    bankHolidayMinutes: 0
  };
}

/**
 * Calculate minutes worked during night hours
 */
function calculateNightMinutes(
  arrivalTime: Date,
  departureTime: Date,
  nightStartHour: number,
  nightEndHour: number
): number {
  let nightMinutes = 0;
  let currentTime = new Date(arrivalTime);
  
  // Iterate through each hour of the shift
  while (currentTime < departureTime) {
    const hour = currentTime.getHours();
    const nextHour = new Date(currentTime);
    nextHour.setHours(hour + 1, 0, 0, 0);
    
    // Calculate minutes in this hour
    const endOfHour = nextHour > departureTime ? departureTime : nextHour;
    const minutesInHour = Math.floor((endOfHour.getTime() - currentTime.getTime()) / (1000 * 60));
    
    // Check if this hour is night time
    const isNightHour = (nightStartHour > nightEndHour) 
      ? (hour >= nightStartHour || hour < nightEndHour) // e.g., 22:00 - 06:00
      : (hour >= nightStartHour && hour < nightEndHour); // e.g., 00:00 - 06:00
    
    if (isNightHour) {
      nightMinutes += minutesInHour;
    }
    
    currentTime = endOfHour;
  }
  
  return nightMinutes;
}

/**
 * Get pay rate for driver (or company default)
 */
async function getPayRate(companyId: number, driverId: number) {
  // Try to get driver-specific rate first
  const [driverRate] = await db.select()
    .from(payRates)
    .where(and(
      eq(payRates.companyId, companyId),
      eq(payRates.driverId, driverId),
      eq(payRates.isActive, true)
    ))
    .limit(1);
  
  if (driverRate) return driverRate;
  
  // Fall back to company default rate
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
 * Check if date is a bank holiday
 */
async function checkBankHoliday(companyId: number, date: Date): Promise<boolean> {
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(dateOnly);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const [holiday] = await db.select()
    .from(bankHolidays)
    .where(and(
      eq(bankHolidays.companyId, companyId),
      gte(bankHolidays.date, dateOnly),
      lte(bankHolidays.date, nextDay)
    ))
    .limit(1);
  
  return !!holiday;
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
  // Check if calculation already exists
  const [existing] = await db.select()
    .from(wageCalculations)
    .where(eq(wageCalculations.timesheetId, data.timesheetId))
    .limit(1);
  
  if (existing) {
    // Update existing calculation
    await db.update(wageCalculations)
      .set({
        ...data,
        regularPay: data.regularPay.toFixed(2),
        nightPay: data.nightPay.toFixed(2),
        weekendPay: data.weekendPay.toFixed(2),
        bankHolidayPay: data.bankHolidayPay.toFixed(2),
        overtimePay: data.overtimePay.toFixed(2),
        totalPay: data.totalPay.toFixed(2),
        calculatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(wageCalculations.id, existing.id));
  } else {
    // Create new calculation
    await db.insert(wageCalculations).values({
      ...data,
      regularPay: data.regularPay.toFixed(2),
      nightPay: data.nightPay.toFixed(2),
      weekendPay: data.weekendPay.toFixed(2),
      bankHolidayPay: data.bankHolidayPay.toFixed(2),
      overtimePay: data.overtimePay.toFixed(2),
      totalPay: data.totalPay.toFixed(2),
      calculatedAt: new Date()
    });
  }
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
  // Check if default rate already exists
  const [existing] = await db.select()
    .from(payRates)
    .where(and(
      eq(payRates.companyId, companyId),
      isNull(payRates.driverId)
    ))
    .limit(1);
  
  if (existing) return existing;
  
  // Create default pay rates
  const [newRate] = await db.insert(payRates).values({
    companyId,
    driverId: null, // Company default
    baseRate: "12.00", // £12/hour
    nightRate: "15.00", // £15/hour (25% premium)
    weekendRate: "18.00", // £18/hour (50% premium)
    bankHolidayRate: "24.00", // £24/hour (100% premium)
    overtimeMultiplier: "1.5", // 1.5x base rate
    nightStartHour: 22, // 10 PM
    nightEndHour: 6, // 6 AM
    dailyOvertimeThreshold: 480, // 8 hours
    weeklyOvertimeThreshold: 2400, // 40 hours
    isActive: true
  }).returning();
  
  return newRate;
}

/**
 * Add UK bank holidays for a company
 */
export async function addUKBankHolidays(companyId: number, year: number) {
  const holidays = [
    { name: "New Year's Day", date: new Date(year, 0, 1) },
    { name: "Good Friday", date: new Date(year, 3, 7) }, // Approximate - varies by year
    { name: "Easter Monday", date: new Date(year, 3, 10) }, // Approximate - varies by year
    { name: "Early May Bank Holiday", date: new Date(year, 4, 1) },
    { name: "Spring Bank Holiday", date: new Date(year, 4, 29) },
    { name: "Summer Bank Holiday", date: new Date(year, 7, 28) },
    { name: "Christmas Day", date: new Date(year, 11, 25) },
    { name: "Boxing Day", date: new Date(year, 11, 26) }
  ];
  
  for (const holiday of holidays) {
    await db.insert(bankHolidays).values({
      companyId,
      name: holiday.name,
      date: holiday.date,
      isRecurring: true
    });
  }
}
