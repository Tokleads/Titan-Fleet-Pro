/**
 * Pay Rates Schema
 * 
 * Defines flexible pay rate structures for wage calculations
 * Supports different rates for time of day, weekends, and bank holidays
 */

import { pgTable, serial, integer, varchar, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { companies, users } from "./schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Pay Rates - Flexible wage calculation
export const payRates = pgTable("pay_rates", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  driverId: integer("driver_id").references(() => users.id), // null = company default
  
  // Base rates (£/hour)
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull().default("12.00"),
  nightRate: decimal("night_rate", { precision: 10, scale: 2 }).notNull().default("15.00"), // 10 PM - 6 AM
  weekendRate: decimal("weekend_rate", { precision: 10, scale: 2 }).notNull().default("18.00"), // Saturday/Sunday
  bankHolidayRate: decimal("bank_holiday_rate", { precision: 10, scale: 2 }).notNull().default("24.00"),
  overtimeMultiplier: decimal("overtime_multiplier", { precision: 10, scale: 2 }).notNull().default("1.5"), // 1.5x base rate
  
  // Time thresholds
  nightStartHour: integer("night_start_hour").notNull().default(22), // 10 PM
  nightEndHour: integer("night_end_hour").notNull().default(6), // 6 AM
  dailyOvertimeThreshold: integer("daily_overtime_threshold").notNull().default(480), // 8 hours in minutes
  weeklyOvertimeThreshold: integer("weekly_overtime_threshold").notNull().default(2400), // 40 hours in minutes
  
  // Settings
  isActive: boolean("is_active").notNull().default(true),
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertPayRateSchema = createInsertSchema(payRates).omit({ id: true, createdAt: true, updatedAt: true });
export type PayRate = typeof payRates.$inferSelect;
export type InsertPayRate = z.infer<typeof insertPayRateSchema>;

// Bank Holidays - UK public holidays
export const bankHolidays = pgTable("bank_holidays", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  date: timestamp("date").notNull(),
  isRecurring: boolean("is_recurring").notNull().default(false), // e.g., Christmas Day
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertBankHolidaySchema = createInsertSchema(bankHolidays).omit({ id: true, createdAt: true });
export type BankHoliday = typeof bankHolidays.$inferSelect;
export type InsertBankHoliday = z.infer<typeof insertBankHolidaySchema>;

// Wage Calculations - Cached wage breakdowns for timesheets
export const wageCalculations = pgTable("wage_calculations", {
  id: serial("id").primaryKey(),
  timesheetId: integer("timesheet_id").notNull().unique(), // One calculation per timesheet
  companyId: integer("company_id").references(() => companies.id).notNull(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  payRateId: integer("pay_rate_id").references(() => payRates.id).notNull(),
  
  // Hours breakdown (in minutes)
  regularMinutes: integer("regular_minutes").notNull().default(0),
  nightMinutes: integer("night_minutes").notNull().default(0),
  weekendMinutes: integer("weekend_minutes").notNull().default(0),
  bankHolidayMinutes: integer("bank_holiday_minutes").notNull().default(0),
  overtimeMinutes: integer("overtime_minutes").notNull().default(0),
  
  // Wage breakdown (in £)
  regularPay: decimal("regular_pay", { precision: 10, scale: 2 }).notNull().default("0.00"),
  nightPay: decimal("night_pay", { precision: 10, scale: 2 }).notNull().default("0.00"),
  weekendPay: decimal("weekend_pay", { precision: 10, scale: 2 }).notNull().default("0.00"),
  bankHolidayPay: decimal("bank_holiday_pay", { precision: 10, scale: 2 }).notNull().default("0.00"),
  overtimePay: decimal("overtime_pay", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalPay: decimal("total_pay", { precision: 10, scale: 2 }).notNull().default("0.00"),
  
  // Metadata
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertWageCalculationSchema = createInsertSchema(wageCalculations).omit({ id: true, createdAt: true, updatedAt: true });
export type WageCalculation = typeof wageCalculations.$inferSelect;
export type InsertWageCalculation = z.infer<typeof insertWageCalculationSchema>;
