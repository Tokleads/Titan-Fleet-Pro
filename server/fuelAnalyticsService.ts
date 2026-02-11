/**
 * Fuel Analytics Service
 * 
 * AI-powered fuel intelligence system that analyzes:
 * - MPG per vehicle and driver
 * - Cost per mile
 * - Fuel card anomalies
 * - Driver performance rankings
 * - Cost-saving opportunities
 */

import { db } from "./db";
import { fuelEntries, vehicles, users, companies } from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

// Constants
const LITRES_TO_GALLONS = 0.219969; // UK gallons
const FRAUD_DISTANCE_THRESHOLD_MILES = 50; // Flag if fuel purchase >50 miles from last known location
const FRAUD_TIME_THRESHOLD_HOURS = 1; // Flag if multiple purchases within 1 hour
const EXCESSIVE_LITRES_MULTIPLIER = 1.3; // Flag if purchase >130% of typical tank size

export interface FuelEfficiencyData {
  vehicleId: number;
  vehicleVrm: string;
  driverId?: number;
  driverName?: string;
  totalLitres: number;
  totalMiles: number;
  totalCost: number; // in pence
  mpg: number;
  costPerMile: number; // in pence
  fuelEntryCount: number;
  averageLitresPerFill: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface DriverPerformance {
  driverId: number;
  driverName: string;
  totalMiles: number;
  totalLitres: number;
  totalCost: number;
  mpg: number;
  costPerMile: number;
  rank: number;
  percentile: number;
  savingsVsAverage: number; // in £, positive = saving, negative = wasting
  vehiclesUsed: number;
}

export interface VehiclePerformance {
  vehicleId: number;
  vehicleVrm: string;
  make: string;
  model: string;
  totalMiles: number;
  totalLitres: number;
  totalCost: number;
  mpg: number;
  costPerMile: number;
  rank: number;
  percentile: number;
  costVsAverage: number; // in £, positive = more expensive, negative = cheaper
  utilizationDays: number;
}

export interface FuelAnomaly {
  id: number;
  type: 'EXCESSIVE_LITRES' | 'UNUSUAL_TIME' | 'UNUSUAL_LOCATION' | 'MULTIPLE_PURCHASES' | 'HIGH_COST';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  fuelEntryId: number;
  vehicleVrm: string;
  driverName: string;
  date: Date;
  description: string;
  potentialFraud: boolean;
}

export interface CostSavingOpportunity {
  id: string;
  type: 'DRIVER_TRAINING' | 'VEHICLE_REPLACEMENT' | 'MAINTENANCE_CHECK' | 'FLEET_OPTIMIZATION';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  potentialSavingsPerMonth: number; // in £
  potentialSavingsPerYear: number; // in £
  actionItems: string[];
  affectedEntities: {
    vehicleIds?: number[];
    driverIds?: number[];
  };
}

export interface FleetSummary {
  totalVehicles: number;
  totalDrivers: number;
  totalMiles: number;
  totalLitres: number;
  totalCost: number; // in £
  averageMpg: number;
  averageCostPerMile: number; // in pence
  period: {
    start: Date;
    end: Date;
  };
  trends: {
    mpgChange: number; // % change from previous period
    costPerMileChange: number; // % change from previous period
  };
}

/**
 * Calculate MPG from litres and miles
 */
function calculateMPG(litres: number, miles: number): number {
  if (litres === 0 || miles === 0) return 0;
  const gallons = litres * LITRES_TO_GALLONS;
  return miles / gallons;
}

/**
 * Calculate cost per mile in pence
 */
function calculateCostPerMile(totalCostPence: number, miles: number): number {
  if (miles === 0) return 0;
  return totalCostPence / miles;
}

/**
 * Get fuel efficiency data for a vehicle over a date range
 */
export async function getVehicleFuelEfficiency(
  companyId: number,
  vehicleId: number,
  startDate: Date,
  endDate: Date
): Promise<FuelEfficiencyData | null> {
  const entries = await db
    .select({
      fuelEntry: fuelEntries,
      vehicle: vehicles,
      driver: users,
    })
    .from(fuelEntries)
    .leftJoin(vehicles, eq(fuelEntries.vehicleId, vehicles.id))
    .leftJoin(users, eq(fuelEntries.driverId, users.id))
    .where(
      and(
        eq(fuelEntries.companyId, companyId),
        eq(fuelEntries.vehicleId, vehicleId),
        gte(fuelEntries.date, startDate),
        lte(fuelEntries.date, endDate),
        eq(fuelEntries.fuelType, 'DIESEL') // Only count diesel for MPG
      )
    )
    .orderBy(fuelEntries.date);

  if (entries.length === 0) return null;

  // Calculate total litres and cost
  const totalLitres = entries.reduce((sum, e) => sum + (e.fuelEntry.litres || 0), 0);
  const totalCost = entries.reduce((sum, e) => sum + (e.fuelEntry.price || 0), 0);

  // Calculate miles driven (difference between first and last odometer reading)
  const firstOdometer = entries[0].fuelEntry.odometer;
  const lastOdometer = entries[entries.length - 1].fuelEntry.odometer;
  const totalMiles = lastOdometer - firstOdometer;

  if (totalMiles <= 0) return null;

  const mpg = calculateMPG(totalLitres, totalMiles);
  const costPerMile = calculateCostPerMile(totalCost, totalMiles);

  return {
    vehicleId,
    vehicleVrm: entries[0].vehicle?.vrm || 'Unknown',
    totalLitres,
    totalMiles,
    totalCost,
    mpg,
    costPerMile,
    fuelEntryCount: entries.length,
    averageLitresPerFill: totalLitres / entries.length,
    period: { start: startDate, end: endDate },
  };
}

/**
 * Get driver performance rankings
 */
export async function getDriverPerformanceRankings(
  companyId: number,
  startDate: Date,
  endDate: Date
): Promise<DriverPerformance[]> {
  // Get all fuel entries with driver and vehicle info
  const entries = await db
    .select({
      driverId: fuelEntries.driverId,
      driverName: users.name,
      vehicleId: fuelEntries.vehicleId,
      litres: fuelEntries.litres,
      price: fuelEntries.price,
      odometer: fuelEntries.odometer,
      date: fuelEntries.date,
    })
    .from(fuelEntries)
    .leftJoin(users, eq(fuelEntries.driverId, users.id))
    .where(
      and(
        eq(fuelEntries.companyId, companyId),
        gte(fuelEntries.date, startDate),
        lte(fuelEntries.date, endDate),
        eq(fuelEntries.fuelType, 'DIESEL')
      )
    )
    .orderBy(fuelEntries.driverId, fuelEntries.date);

  // Group by driver
  const driverMap = new Map<number, {
    name: string;
    entries: typeof entries;
    vehicleIds: Set<number>;
  }>();

  for (const entry of entries) {
    if (!driverMap.has(entry.driverId)) {
      driverMap.set(entry.driverId, {
        name: entry.driverName || 'Unknown',
        entries: [],
        vehicleIds: new Set(),
      });
    }
    const driver = driverMap.get(entry.driverId)!;
    driver.entries.push(entry);
    driver.vehicleIds.add(entry.vehicleId);
  }

  // Calculate performance for each driver
  const performances: DriverPerformance[] = [];

  for (const [driverId, data] of Array.from(driverMap.entries())) {
    if (data.entries.length < 2) continue; // Need at least 2 entries to calculate miles

    const totalLitres = data.entries.reduce((sum, e) => sum + (e.litres || 0), 0);
    const totalCost = data.entries.reduce((sum, e) => sum + (e.price || 0), 0);

    // Calculate miles (first to last odometer per vehicle)
    let totalMiles = 0;
    const vehicleEntries = new Map<number, typeof data.entries>();
    
    for (const entry of data.entries) {
      if (!vehicleEntries.has(entry.vehicleId)) {
        vehicleEntries.set(entry.vehicleId, []);
      }
      vehicleEntries.get(entry.vehicleId)!.push(entry);
    }

    for (const [_, vEntries] of Array.from(vehicleEntries.entries())) {
      if (vEntries.length >= 2) {
        const firstOdo = vEntries[0].odometer;
        const lastOdo = vEntries[vEntries.length - 1].odometer;
        totalMiles += (lastOdo - firstOdo);
      }
    }

    if (totalMiles <= 0) continue;

    const mpg = calculateMPG(totalLitres, totalMiles);
    const costPerMile = calculateCostPerMile(totalCost, totalMiles);

    performances.push({
      driverId,
      driverName: data.name,
      totalMiles,
      totalLitres,
      totalCost,
      mpg,
      costPerMile,
      rank: 0, // Will be set after sorting
      percentile: 0, // Will be set after sorting
      savingsVsAverage: 0, // Will be calculated after average
      vehiclesUsed: data.vehicleIds.size,
    });
  }

  // Sort by MPG (descending - higher is better)
  performances.sort((a, b) => b.mpg - a.mpg);

  // Assign ranks and percentiles
  performances.forEach((p, index) => {
    p.rank = index + 1;
    p.percentile = ((performances.length - index) / performances.length) * 100;
  });

  // Calculate average cost per mile
  const avgCostPerMile = performances.reduce((sum, p) => sum + p.costPerMile, 0) / performances.length;

  // Calculate savings vs average
  performances.forEach(p => {
    const costDiff = avgCostPerMile - p.costPerMile; // Positive = driver is cheaper than average
    p.savingsVsAverage = (costDiff * p.totalMiles) / 100; // Convert pence to £
  });

  return performances;
}

/**
 * Get vehicle performance rankings
 */
export async function getVehiclePerformanceRankings(
  companyId: number,
  startDate: Date,
  endDate: Date
): Promise<VehiclePerformance[]> {
  // Get all vehicles for the company
  const allVehicles = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.companyId, companyId));

  const performances: VehiclePerformance[] = [];

  for (const vehicle of allVehicles) {
    const efficiency = await getVehicleFuelEfficiency(companyId, vehicle.id, startDate, endDate);
    
    if (!efficiency || efficiency.totalMiles === 0) continue;

    // Calculate utilization (days with fuel entries)
    const entries = await db
      .select({ date: fuelEntries.date })
      .from(fuelEntries)
      .where(
        and(
          eq(fuelEntries.companyId, companyId),
          eq(fuelEntries.vehicleId, vehicle.id),
          gte(fuelEntries.date, startDate),
          lte(fuelEntries.date, endDate)
        )
      );

    const uniqueDays = new Set(entries.map(e => e.date.toDateString())).size;

    performances.push({
      vehicleId: vehicle.id,
      vehicleVrm: vehicle.vrm,
      make: vehicle.make,
      model: vehicle.model,
      totalMiles: efficiency.totalMiles,
      totalLitres: efficiency.totalLitres,
      totalCost: efficiency.totalCost,
      mpg: efficiency.mpg,
      costPerMile: efficiency.costPerMile,
      rank: 0,
      percentile: 0,
      costVsAverage: 0,
      utilizationDays: uniqueDays,
    });
  }

  // Sort by cost per mile (ascending - lower is better)
  performances.sort((a, b) => a.costPerMile - b.costPerMile);

  // Assign ranks and percentiles
  performances.forEach((p, index) => {
    p.rank = index + 1;
    p.percentile = ((performances.length - index) / performances.length) * 100;
  });

  // Calculate average cost per mile
  const avgCostPerMile = performances.reduce((sum, p) => sum + p.costPerMile, 0) / performances.length;

  // Calculate cost vs average
  performances.forEach(p => {
    const costDiff = p.costPerMile - avgCostPerMile; // Positive = more expensive than average
    p.costVsAverage = (costDiff * p.totalMiles) / 100; // Convert pence to £
  });

  return performances;
}

/**
 * Detect fuel anomalies and potential fraud
 */
export async function detectFuelAnomalies(
  companyId: number,
  startDate: Date,
  endDate: Date
): Promise<FuelAnomaly[]> {
  const anomalies: FuelAnomaly[] = [];

  // Get all fuel entries with vehicle and driver info
  const entries = await db
    .select({
      fuelEntry: fuelEntries,
      vehicle: vehicles,
      driver: users,
    })
    .from(fuelEntries)
    .leftJoin(vehicles, eq(fuelEntries.vehicleId, vehicles.id))
    .leftJoin(users, eq(fuelEntries.driverId, users.id))
    .where(
      and(
        eq(fuelEntries.companyId, companyId),
        gte(fuelEntries.date, startDate),
        lte(fuelEntries.date, endDate)
      )
    )
    .orderBy(fuelEntries.date);

  // Calculate average litres per vehicle for comparison
  const vehicleAverages = new Map<number, number>();
  const vehicleEntries = new Map<number, typeof entries>();

  for (const entry of entries) {
    if (!vehicleEntries.has(entry.fuelEntry.vehicleId)) {
      vehicleEntries.set(entry.fuelEntry.vehicleId, []);
    }
    vehicleEntries.get(entry.fuelEntry.vehicleId)!.push(entry);
  }

  for (const [vehicleId, vEntries] of Array.from(vehicleEntries.entries())) {
    const avgLitres = vEntries.reduce((sum, e) => sum + (e.fuelEntry.litres || 0), 0) / vEntries.length;
    vehicleAverages.set(vehicleId, avgLitres);
  }

  // Check each entry for anomalies
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const avgLitres = vehicleAverages.get(entry.fuelEntry.vehicleId) || 0;

    // 1. Excessive litres (>130% of average)
    if (entry.fuelEntry.litres && avgLitres > 0) {
      if (entry.fuelEntry.litres > avgLitres * EXCESSIVE_LITRES_MULTIPLIER) {
        anomalies.push({
          id: anomalies.length + 1,
          type: 'EXCESSIVE_LITRES',
          severity: 'MEDIUM',
          fuelEntryId: entry.fuelEntry.id,
          vehicleVrm: entry.vehicle?.vrm || 'Unknown',
          driverName: entry.driver?.name || 'Unknown',
          date: entry.fuelEntry.date,
          description: `Purchased ${entry.fuelEntry.litres}L (${Math.round((entry.fuelEntry.litres / avgLitres - 1) * 100)}% above average of ${Math.round(avgLitres)}L)`,
          potentialFraud: true,
        });
      }
    }

    // 2. Unusual time (outside 6 AM - 10 PM)
    const hour = entry.fuelEntry.date.getHours();
    if (hour < 6 || hour > 22) {
      anomalies.push({
        id: anomalies.length + 1,
        type: 'UNUSUAL_TIME',
        severity: 'LOW',
        fuelEntryId: entry.fuelEntry.id,
        vehicleVrm: entry.vehicle?.vrm || 'Unknown',
        driverName: entry.driver?.name || 'Unknown',
        date: entry.fuelEntry.date,
        description: `Fuel purchased at ${hour}:${entry.fuelEntry.date.getMinutes().toString().padStart(2, '0')} (outside normal hours)`,
        potentialFraud: false,
      });
    }

    // 3. Multiple purchases within 1 hour (same vehicle)
    if (i > 0 && entries[i - 1].fuelEntry.vehicleId === entry.fuelEntry.vehicleId) {
      const timeDiff = (entry.fuelEntry.date.getTime() - entries[i - 1].fuelEntry.date.getTime()) / (1000 * 60 * 60);
      if (timeDiff < FRAUD_TIME_THRESHOLD_HOURS) {
        anomalies.push({
          id: anomalies.length + 1,
          type: 'MULTIPLE_PURCHASES',
          severity: 'HIGH',
          fuelEntryId: entry.fuelEntry.id,
          vehicleVrm: entry.vehicle?.vrm || 'Unknown',
          driverName: entry.driver?.name || 'Unknown',
          date: entry.fuelEntry.date,
          description: `Two fuel purchases within ${Math.round(timeDiff * 60)} minutes`,
          potentialFraud: true,
        });
      }
    }

    // 4. High cost (>£200)
    if (entry.fuelEntry.price && entry.fuelEntry.price > 20000) { // 20000 pence = £200
      anomalies.push({
        id: anomalies.length + 1,
        type: 'HIGH_COST',
        severity: 'MEDIUM',
        fuelEntryId: entry.fuelEntry.id,
        vehicleVrm: entry.vehicle?.vrm || 'Unknown',
        driverName: entry.driver?.name || 'Unknown',
        date: entry.fuelEntry.date,
        description: `High cost: £${(entry.fuelEntry.price / 100).toFixed(2)}`,
        potentialFraud: false,
      });
    }
  }

  return anomalies;
}

/**
 * Generate cost-saving opportunities based on analytics
 */
export async function generateCostSavingOpportunities(
  companyId: number,
  startDate: Date,
  endDate: Date
): Promise<CostSavingOpportunity[]> {
  const opportunities: CostSavingOpportunity[] = [];

  // Get driver and vehicle performance
  const driverPerf = await getDriverPerformanceRankings(companyId, startDate, endDate);
  const vehiclePerf = await getVehiclePerformanceRankings(companyId, startDate, endDate);

  // 1. Identify drivers who need training (bottom 20%)
  const bottomDrivers = driverPerf.filter(d => d.percentile <= 20);
  if (bottomDrivers.length > 0) {
    const totalSavings = bottomDrivers.reduce((sum, d) => sum + Math.abs(d.savingsVsAverage), 0);
    opportunities.push({
      id: 'driver-training-1',
      type: 'DRIVER_TRAINING',
      priority: 'HIGH',
      title: `Train ${bottomDrivers.length} driver${bottomDrivers.length > 1 ? 's' : ''} on fuel-efficient driving`,
      description: `${bottomDrivers.length} driver${bottomDrivers.length > 1 ? 's are' : ' is'} performing below the fleet average. Eco-driving training could improve their fuel efficiency by 10-15%.`,
      potentialSavingsPerMonth: totalSavings * 0.12, // Assume 12% improvement
      potentialSavingsPerYear: totalSavings * 0.12 * 12,
      actionItems: bottomDrivers.map(d => `Train ${d.driverName} (currently ${d.mpg.toFixed(1)} MPG, fleet avg: ${(driverPerf.reduce((sum, p) => sum + p.mpg, 0) / driverPerf.length).toFixed(1)} MPG)`),
      affectedEntities: { driverIds: bottomDrivers.map(d => d.driverId) },
    });
  }

  // 2. Identify vehicles with poor fuel efficiency (bottom 20%)
  const bottomVehicles = vehiclePerf.filter(v => v.percentile <= 20);
  if (bottomVehicles.length > 0) {
    for (const vehicle of bottomVehicles) {
      if (vehicle.costVsAverage > 100) { // More than £100 over average
        opportunities.push({
          id: `vehicle-check-${vehicle.vehicleId}`,
          type: 'MAINTENANCE_CHECK',
          priority: vehicle.costVsAverage > 300 ? 'HIGH' : 'MEDIUM',
          title: `Investigate ${vehicle.vehicleVrm} for mechanical issues`,
          description: `This vehicle costs £${vehicle.costVsAverage.toFixed(0)} more than the fleet average. Poor fuel efficiency may indicate mechanical problems.`,
          potentialSavingsPerMonth: vehicle.costVsAverage,
          potentialSavingsPerYear: vehicle.costVsAverage * 12,
          actionItems: [
            'Schedule diagnostic check',
            'Check tire pressure and alignment',
            'Inspect air filter and fuel system',
            'Review service history',
          ],
          affectedEntities: { vehicleIds: [vehicle.vehicleId] },
        });
      }
    }
  }

  // 3. Identify underutilized vehicles
  const underutilized = vehiclePerf.filter(v => {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return v.utilizationDays < totalDays * 0.4; // Used less than 40% of days
  });

  if (underutilized.length > 0) {
    opportunities.push({
      id: 'fleet-optimization-1',
      type: 'FLEET_OPTIMIZATION',
      priority: 'MEDIUM',
      title: `${underutilized.length} vehicle${underutilized.length > 1 ? 's are' : ' is'} underutilized`,
      description: `These vehicles are used less than 40% of the time. Consider reducing fleet size or reassigning vehicles.`,
      potentialSavingsPerMonth: underutilized.length * 1000, // Estimate £1000/month per vehicle (insurance, depreciation, etc.)
      potentialSavingsPerYear: underutilized.length * 12000,
      actionItems: underutilized.map(v => `${v.vehicleVrm}: Used only ${v.utilizationDays} days`),
      affectedEntities: { vehicleIds: underutilized.map(v => v.vehicleId) },
    });
  }

  // Sort by potential savings (highest first)
  opportunities.sort((a, b) => b.potentialSavingsPerYear - a.potentialSavingsPerYear);

  return opportunities;
}

/**
 * Get fleet summary statistics
 */
export async function getFleetSummary(
  companyId: number,
  startDate: Date,
  endDate: Date
): Promise<FleetSummary> {
  const driverPerf = await getDriverPerformanceRankings(companyId, startDate, endDate);
  const vehiclePerf = await getVehiclePerformanceRankings(companyId, startDate, endDate);

  const totalMiles = vehiclePerf.reduce((sum, v) => sum + v.totalMiles, 0);
  const totalLitres = vehiclePerf.reduce((sum, v) => sum + v.totalLitres, 0);
  const totalCost = vehiclePerf.reduce((sum, v) => sum + v.totalCost, 0);
  const averageMpg = vehiclePerf.reduce((sum, v) => sum + v.mpg, 0) / vehiclePerf.length;
  const averageCostPerMile = vehiclePerf.reduce((sum, v) => sum + v.costPerMile, 0) / vehiclePerf.length;

  // Calculate previous period for trends (same duration before startDate)
  const periodDuration = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodDuration);
  const prevEndDate = new Date(startDate.getTime());

  const prevVehiclePerf = await getVehiclePerformanceRankings(companyId, prevStartDate, prevEndDate);
  const prevAverageMpg = prevVehiclePerf.length > 0 
    ? prevVehiclePerf.reduce((sum, v) => sum + v.mpg, 0) / prevVehiclePerf.length 
    : averageMpg;
  const prevAverageCostPerMile = prevVehiclePerf.length > 0
    ? prevVehiclePerf.reduce((sum, v) => sum + v.costPerMile, 0) / prevVehiclePerf.length
    : averageCostPerMile;

  const mpgChange = prevAverageMpg > 0 ? ((averageMpg - prevAverageMpg) / prevAverageMpg) * 100 : 0;
  const costPerMileChange = prevAverageCostPerMile > 0 
    ? ((averageCostPerMile - prevAverageCostPerMile) / prevAverageCostPerMile) * 100 
    : 0;

  return {
    totalVehicles: vehiclePerf.length,
    totalDrivers: driverPerf.length,
    totalMiles,
    totalLitres,
    totalCost: totalCost / 100, // Convert pence to £
    averageMpg,
    averageCostPerMile,
    period: { start: startDate, end: endDate },
    trends: {
      mpgChange,
      costPerMileChange,
    },
  };
}
