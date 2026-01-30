/**
 * Report Generation System
 * 
 * Generates various fleet management reports with data from the database.
 * Supports CSV and PDF export formats.
 */

import { db } from "./db";
import { 
  vehicles, 
  users, 
  fuelEntries, 
  defects, 
  inspections,
  serviceHistory,
  timesheets
} from "../shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface ReportFilter {
  companyId: number;
  startDate?: string;
  endDate?: string;
  vehicleId?: number;
  driverId?: number;
}

export interface ReportData {
  title: string;
  description: string;
  generatedAt: string;
  filters: ReportFilter;
  columns: string[];
  rows: any[][];
  summary?: Record<string, any>;
}

/**
 * Vehicle List Report
 * Lists all vehicles with key details
 */
export async function generateVehicleListReport(filter: ReportFilter): Promise<ReportData> {
  let query = db
    .select()
    .from(vehicles)
    .where(eq(vehicles.companyId, filter.companyId));

  if (filter.vehicleId) {
    query = query.where(eq(vehicles.id, filter.vehicleId)) as any;
  }

  const data = await query;

  const rows = data.map(v => [
    v.vrm,
    v.make,
    v.model,
    v.type,
    v.motDue ? new Date(v.motDue).toLocaleDateString('en-GB') : 'N/A',
    v.taxDue ? new Date(v.taxDue).toLocaleDateString('en-GB') : 'N/A',
    v.currentMileage || 'N/A',
    v.active ? 'Active' : 'Inactive',
    v.vorStatus ? 'Off Road' : 'In Service'
  ]);

  return {
    title: 'Vehicle List Report',
    description: 'Complete list of all vehicles in the fleet',
    generatedAt: new Date().toISOString(),
    filters: filter,
    columns: ['VRM', 'Make', 'Model', 'Type', 'MOT Due', 'Tax Due', 'Mileage', 'Status', 'VOR Status'],
    rows,
    summary: {
      totalVehicles: data.length,
      activeVehicles: data.filter(v => v.active).length,
      vorVehicles: data.filter(v => v.vorStatus).length
    }
  };
}

/**
 * Driver List Report
 * Lists all drivers with license information
 */
export async function generateDriverListReport(filter: ReportFilter): Promise<ReportData> {
  const data = await db
    .select()
    .from(users)
    .where(and(
      eq(users.companyId, filter.companyId),
      eq(users.role, 'driver')
    ));

  const rows = data.map(d => [
    d.name,
    d.email,
    d.phone || 'N/A',
    d.licenseNumber || 'N/A',
    d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString('en-GB') : 'N/A',
    d.active ? 'Active' : 'Inactive'
  ]);

  return {
    title: 'Driver List Report',
    description: 'Complete list of all drivers',
    generatedAt: new Date().toISOString(),
    filters: filter,
    columns: ['Name', 'Email', 'Phone', 'License Number', 'License Expiry', 'Status'],
    rows,
    summary: {
      totalDrivers: data.length,
      activeDrivers: data.filter(d => d.active).length
    }
  };
}

/**
 * Fuel Purchase Report
 * Lists all fuel purchases with costs and consumption
 */
export async function generateFuelPurchaseReport(filter: ReportFilter): Promise<ReportData> {
  let query = db
    .select({
      date: fuelEntries.date,
      vrm: vehicles.vrm,
      driverName: users.name,
      liters: fuelEntries.liters,
      costPerLiter: fuelEntries.costPerLiter,
      totalCost: fuelEntries.totalCost,
      mileage: fuelEntries.mileage,
      location: fuelEntries.location
    })
    .from(fuelEntries)
    .leftJoin(vehicles, eq(fuelEntries.vehicleId, vehicles.id))
    .leftJoin(users, eq(fuelEntries.driverId, users.id))
    .where(eq(fuelEntries.companyId, filter.companyId))
    .orderBy(desc(fuelEntries.date));

  if (filter.startDate) {
    query = query.where(gte(fuelEntries.date, filter.startDate)) as any;
  }
  if (filter.endDate) {
    query = query.where(lte(fuelEntries.date, filter.endDate)) as any;
  }
  if (filter.vehicleId) {
    query = query.where(eq(fuelEntries.vehicleId, filter.vehicleId)) as any;
  }

  const data = await query;

  const rows = data.map(f => [
    new Date(f.date).toLocaleDateString('en-GB'),
    f.vrm || 'N/A',
    f.driverName || 'N/A',
    f.liters?.toFixed(2) || 'N/A',
    f.costPerLiter ? `£${f.costPerLiter.toFixed(2)}` : 'N/A',
    f.totalCost ? `£${f.totalCost.toFixed(2)}` : 'N/A',
    f.mileage || 'N/A',
    f.location || 'N/A'
  ]);

  const totalLiters = data.reduce((sum, f) => sum + (f.liters || 0), 0);
  const totalCost = data.reduce((sum, f) => sum + (f.totalCost || 0), 0);

  return {
    title: 'Fuel Purchase Report',
    description: 'All fuel purchases with costs and consumption',
    generatedAt: new Date().toISOString(),
    filters: filter,
    columns: ['Date', 'Vehicle', 'Driver', 'Liters', 'Cost/Liter', 'Total Cost', 'Mileage', 'Location'],
    rows,
    summary: {
      totalEntries: data.length,
      totalLiters: totalLiters.toFixed(2),
      totalCost: `£${totalCost.toFixed(2)}`,
      avgCostPerLiter: data.length > 0 ? `£${(totalCost / totalLiters).toFixed(2)}` : 'N/A'
    }
  };
}

/**
 * Defect Report
 * Lists all reported defects by vehicle
 */
export async function generateDefectReport(filter: ReportFilter): Promise<ReportData> {
  let query = db
    .select({
      reportedAt: defects.reportedAt,
      vrm: vehicles.vrm,
      driverName: users.name,
      defectType: defects.defectType,
      severity: defects.severity,
      description: defects.description,
      status: defects.status
    })
    .from(defects)
    .leftJoin(vehicles, eq(defects.vehicleId, vehicles.id))
    .leftJoin(users, eq(defects.reportedBy, users.id))
    .where(eq(defects.companyId, filter.companyId))
    .orderBy(desc(defects.reportedAt));

  if (filter.startDate) {
    query = query.where(gte(defects.reportedAt, filter.startDate)) as any;
  }
  if (filter.endDate) {
    query = query.where(lte(defects.reportedAt, filter.endDate)) as any;
  }
  if (filter.vehicleId) {
    query = query.where(eq(defects.vehicleId, filter.vehicleId)) as any;
  }

  const data = await query;

  const rows = data.map(d => [
    new Date(d.reportedAt).toLocaleDateString('en-GB'),
    d.vrm || 'N/A',
    d.driverName || 'N/A',
    d.defectType,
    d.severity,
    d.description,
    d.status
  ]);

  return {
    title: 'Defect Report',
    description: 'All reported defects by vehicle',
    generatedAt: new Date().toISOString(),
    filters: filter,
    columns: ['Date', 'Vehicle', 'Reported By', 'Type', 'Severity', 'Description', 'Status'],
    rows,
    summary: {
      totalDefects: data.length,
      openDefects: data.filter(d => d.status === 'open').length,
      criticalDefects: data.filter(d => d.severity === 'critical').length
    }
  };
}

/**
 * Service Due Report
 * Lists vehicles due for service
 */
export async function generateServiceDueReport(filter: ReportFilter): Promise<ReportData> {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const data = await db
    .select()
    .from(vehicles)
    .where(and(
      eq(vehicles.companyId, filter.companyId),
      lte(vehicles.nextServiceDue, thirtyDaysFromNow.toISOString())
    ))
    .orderBy(vehicles.nextServiceDue);

  const rows = data.map(v => {
    const serviceDue = v.nextServiceDue ? new Date(v.nextServiceDue) : null;
    const daysUntil = serviceDue ? Math.ceil((serviceDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    return [
      v.vrm,
      v.make,
      v.model,
      serviceDue ? serviceDue.toLocaleDateString('en-GB') : 'N/A',
      daysUntil !== null ? (daysUntil < 0 ? `Overdue by ${Math.abs(daysUntil)} days` : `${daysUntil} days`) : 'N/A',
      v.currentMileage || 'N/A',
      v.nextServiceMileage || 'N/A',
      v.lastServiceDate ? new Date(v.lastServiceDate).toLocaleDateString('en-GB') : 'Never'
    ];
  });

  return {
    title: 'Service Due Report',
    description: 'Vehicles due for service in the next 30 days',
    generatedAt: new Date().toISOString(),
    filters: filter,
    columns: ['VRM', 'Make', 'Model', 'Service Due', 'Days Until Due', 'Current Mileage', 'Service Mileage', 'Last Service'],
    rows,
    summary: {
      totalVehicles: data.length,
      overdue: data.filter(v => v.nextServiceDue && new Date(v.nextServiceDue) < today).length
    }
  };
}

/**
 * MOT Expiry Report
 * Lists vehicles with MOT expiry dates
 */
export async function generateMOTExpiryReport(filter: ReportFilter): Promise<ReportData> {
  const data = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.companyId, filter.companyId))
    .orderBy(vehicles.motDue);

  const today = new Date();

  const rows = data.map(v => {
    const motDue = v.motDue ? new Date(v.motDue) : null;
    const daysUntil = motDue ? Math.ceil((motDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    return [
      v.vrm,
      v.make,
      v.model,
      motDue ? motDue.toLocaleDateString('en-GB') : 'N/A',
      daysUntil !== null ? (daysUntil < 0 ? `Overdue by ${Math.abs(daysUntil)} days` : `${daysUntil} days`) : 'N/A',
      v.active ? 'Active' : 'Inactive'
    ];
  });

  return {
    title: 'MOT Expiry Report',
    description: 'All vehicles with MOT expiry dates',
    generatedAt: new Date().toISOString(),
    filters: filter,
    columns: ['VRM', 'Make', 'Model', 'MOT Due', 'Days Until Due', 'Status'],
    rows,
    summary: {
      totalVehicles: data.length,
      overdue: data.filter(v => v.motDue && new Date(v.motDue) < today).length,
      dueSoon: data.filter(v => {
        if (!v.motDue) return false;
        const due = new Date(v.motDue);
        const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 30;
      }).length
    }
  };
}

/**
 * VOR Analysis Report
 * Analyzes vehicle off-road statistics
 */
export async function generateVORAnalysisReport(filter: ReportFilter): Promise<ReportData> {
  const data = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.companyId, filter.companyId));

  const today = new Date();

  const rows = data
    .filter(v => v.vorStatus || v.vorResolvedDate)
    .map(v => {
      const startDate = v.vorStartDate ? new Date(v.vorStartDate) : null;
      const endDate = v.vorResolvedDate ? new Date(v.vorResolvedDate) : today;
      const daysOffRoad = startDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      return [
        v.vrm,
        v.make,
        v.model,
        v.vorStatus ? 'Currently Off Road' : 'Resolved',
        v.vorReason || 'N/A',
        startDate ? startDate.toLocaleDateString('en-GB') : 'N/A',
        v.vorResolvedDate ? new Date(v.vorResolvedDate).toLocaleDateString('en-GB') : 'Ongoing',
        daysOffRoad,
        v.vorNotes || 'N/A'
      ];
    });

  const currentlyVOR = data.filter(v => v.vorStatus).length;
  const totalVOREvents = rows.length;
  const avgDaysOffRoad = rows.length > 0 
    ? (rows.reduce((sum, r) => sum + (r[7] as number), 0) / rows.length).toFixed(1)
    : '0';

  return {
    title: 'VOR Analysis Report',
    description: 'Vehicle off-road statistics and analysis',
    generatedAt: new Date().toISOString(),
    filters: filter,
    columns: ['VRM', 'Make', 'Model', 'Status', 'Reason', 'Start Date', 'End Date', 'Days Off Road', 'Notes'],
    rows,
    summary: {
      currentlyVOR,
      totalVOREvents,
      avgDaysOffRoad
    }
  };
}

/**
 * Safety Inspection Report
 * Lists all safety inspections
 */
export async function generateSafetyInspectionReport(filter: ReportFilter): Promise<ReportData> {
  let query = db
    .select({
      inspectionDate: inspections.inspectionDate,
      vrm: vehicles.vrm,
      driverName: users.name,
      passed: inspections.passed,
      faultsFound: inspections.faultsFound,
      notes: inspections.notes
    })
    .from(inspections)
    .leftJoin(vehicles, eq(inspections.vehicleId, vehicles.id))
    .leftJoin(users, eq(inspections.driverId, users.id))
    .where(eq(inspections.companyId, filter.companyId))
    .orderBy(desc(inspections.inspectionDate));

  if (filter.startDate) {
    query = query.where(gte(inspections.inspectionDate, filter.startDate)) as any;
  }
  if (filter.endDate) {
    query = query.where(lte(inspections.inspectionDate, filter.endDate)) as any;
  }
  if (filter.vehicleId) {
    query = query.where(eq(inspections.vehicleId, filter.vehicleId)) as any;
  }

  const data = await query;

  const rows = data.map(i => [
    new Date(i.inspectionDate).toLocaleDateString('en-GB'),
    i.vrm || 'N/A',
    i.driverName || 'N/A',
    i.passed ? 'Pass' : 'Fail',
    i.faultsFound || 0,
    i.notes || 'N/A'
  ]);

  return {
    title: 'Safety Inspection Report',
    description: 'All safety inspections with pass/fail status',
    generatedAt: new Date().toISOString(),
    filters: filter,
    columns: ['Date', 'Vehicle', 'Driver', 'Result', 'Faults Found', 'Notes'],
    rows,
    summary: {
      totalInspections: data.length,
      passed: data.filter(i => i.passed).length,
      failed: data.filter(i => !i.passed).length
    }
  };
}

/**
 * Mileage Report
 * Shows mileage by vehicle
 */
export async function generateMileageReport(filter: ReportFilter): Promise<ReportData> {
  const data = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.companyId, filter.companyId))
    .orderBy(desc(vehicles.currentMileage));

  const rows = data.map(v => [
    v.vrm,
    v.make,
    v.model,
    v.currentMileage || 0,
    v.lastServiceMileage || 'N/A',
    v.nextServiceMileage || 'N/A',
    v.active ? 'Active' : 'Inactive'
  ]);

  const totalMileage = data.reduce((sum, v) => sum + (v.currentMileage || 0), 0);
  const avgMileage = data.length > 0 ? (totalMileage / data.length).toFixed(0) : '0';

  return {
    title: 'Mileage Report',
    description: 'Current mileage for all vehicles',
    generatedAt: new Date().toISOString(),
    filters: filter,
    columns: ['VRM', 'Make', 'Model', 'Current Mileage', 'Last Service Mileage', 'Next Service Mileage', 'Status'],
    rows,
    summary: {
      totalVehicles: data.length,
      totalMileage,
      avgMileage
    }
  };
}

/**
 * Cost Analysis Report
 * Analyzes total costs by vehicle
 */
export async function generateCostAnalysisReport(filter: ReportFilter): Promise<ReportData> {
  // Get all vehicles
  const vehicleData = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.companyId, filter.companyId));

  // Get fuel costs per vehicle
  const fuelCosts = await db
    .select({
      vehicleId: fuelEntries.vehicleId,
      totalCost: sql<number>`SUM(${fuelEntries.totalCost})`.as('totalCost')
    })
    .from(fuelEntries)
    .where(eq(fuelEntries.companyId, filter.companyId))
    .groupBy(fuelEntries.vehicleId);

  // Get service costs per vehicle
  const serviceCosts = await db
    .select({
      vehicleId: serviceHistory.vehicleId,
      totalCost: sql<number>`SUM(${serviceHistory.cost})`.as('totalCost')
    })
    .from(serviceHistory)
    .where(eq(serviceHistory.companyId, filter.companyId))
    .groupBy(serviceHistory.vehicleId);

  const fuelCostMap = new Map(fuelCosts.map(f => [f.vehicleId, f.totalCost || 0]));
  const serviceCostMap = new Map(serviceCosts.map(s => [s.vehicleId, s.totalCost || 0]));

  const rows = vehicleData.map(v => {
    const fuelCost = fuelCostMap.get(v.id) || 0;
    const serviceCost = serviceCostMap.get(v.id) || 0;
    const totalCost = fuelCost + serviceCost;
    
    return [
      v.vrm,
      v.make,
      v.model,
      `£${fuelCost.toFixed(2)}`,
      `£${serviceCost.toFixed(2)}`,
      `£${totalCost.toFixed(2)}`,
      v.currentMileage || 0,
      v.currentMileage && totalCost > 0 ? `£${(totalCost / v.currentMileage).toFixed(3)}` : 'N/A'
    ];
  });

  const totalFuelCost = Array.from(fuelCostMap.values()).reduce((sum, cost) => sum + cost, 0);
  const totalServiceCost = Array.from(serviceCostMap.values()).reduce((sum, cost) => sum + cost, 0);
  const grandTotal = totalFuelCost + totalServiceCost;

  return {
    title: 'Cost Analysis Report',
    description: 'Total costs by vehicle (fuel + service)',
    generatedAt: new Date().toISOString(),
    filters: filter,
    columns: ['VRM', 'Make', 'Model', 'Fuel Cost', 'Service Cost', 'Total Cost', 'Mileage', 'Cost per Mile'],
    rows,
    summary: {
      totalVehicles: vehicleData.length,
      totalFuelCost: `£${totalFuelCost.toFixed(2)}`,
      totalServiceCost: `£${totalServiceCost.toFixed(2)}`,
      grandTotal: `£${grandTotal.toFixed(2)}`
    }
  };
}

// Export all report generators
export const reportGenerators = {
  'vehicle-list': generateVehicleListReport,
  'driver-list': generateDriverListReport,
  'fuel-purchase': generateFuelPurchaseReport,
  'defect': generateDefectReport,
  'service-due': generateServiceDueReport,
  'mot-expiry': generateMOTExpiryReport,
  'vor-analysis': generateVORAnalysisReport,
  'safety-inspection': generateSafetyInspectionReport,
  'mileage': generateMileageReport,
  'cost-analysis': generateCostAnalysisReport
};

export type ReportType = keyof typeof reportGenerators;
