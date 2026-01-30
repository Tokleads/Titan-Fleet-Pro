/**
 * Advanced Dashboard API Routes
 * 
 * Provides KPIs, charts, and analytics data for the advanced dashboard
 */

import { Router, Request, Response } from 'express';
import { db } from './db.js';
import { vehicles, users, inspections, defects, fuelEntries, serviceHistory } from '../shared/schema.js';
import { eq, and, sql, desc, gte, lte, count } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/dashboard/kpis
 * Get KPI metrics with trends
 */
router.get('/kpis', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const dateRange = parseInt(req.query.dateRange as string) || 30; // days
    
    const now = new Date();
    const startDate = new Date(now.getTime() - dateRange * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(startDate.getTime() - dateRange * 24 * 60 * 60 * 1000);
    
    // Total Vehicles
    const [totalVehiclesResult] = await db.select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(eq(vehicles.companyId, companyId));
    const totalVehicles = Number(totalVehiclesResult.count);
    
    // Active Drivers (users with role DRIVER who have logged in recently)
    const [activeDriversResult] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        eq(users.companyId, companyId),
        eq(users.role, 'DRIVER')
      ));
    const activeDrivers = Number(activeDriversResult.count);
    
    // Inspections MTD (Month to Date)
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [inspectionsMTDResult] = await db.select({ count: sql<number>`count(*)` })
      .from(inspections)
      .where(and(
        eq(inspections.companyId, companyId),
        gte(inspections.createdAt, firstDayOfMonth)
      ));
    const inspectionsMTD = Number(inspectionsMTDResult.count);
    
    // Previous month inspections for trend
    const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const [inspectionsPrevMonthResult] = await db.select({ count: sql<number>`count(*)` })
      .from(inspections)
      .where(and(
        eq(inspections.companyId, companyId),
        gte(inspections.createdAt, firstDayOfPreviousMonth),
        lte(inspections.createdAt, lastDayOfPreviousMonth)
      ));
    const inspectionsPrevMonth = Number(inspectionsPrevMonthResult.count);
    const inspectionsTrend = inspectionsPrevMonth > 0 
      ? ((inspectionsMTD - inspectionsPrevMonth) / inspectionsPrevMonth) * 100 
      : 0;
    
    // Compliance Rate (vehicles with valid MOT, Tax, and Service)
    const [vehiclesWithMOT] = await db.select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        gte(vehicles.motDue, now)
      ));
    
    const [vehiclesWithTax] = await db.select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        gte(vehicles.taxDue, now)
      ));
    
    const motCompliance = totalVehicles > 0 ? (Number(vehiclesWithMOT.count) / totalVehicles) * 100 : 0;
    const taxCompliance = totalVehicles > 0 ? (Number(vehiclesWithTax.count) / totalVehicles) * 100 : 0;
    const complianceRate = (motCompliance + taxCompliance) / 2;
    
    res.json({
      totalVehicles: {
        value: totalVehicles,
        trend: 0 // Could calculate based on historical data
      },
      activeDrivers: {
        value: activeDrivers,
        trend: 0
      },
      inspectionsMTD: {
        value: inspectionsMTD,
        trend: Math.round(inspectionsTrend)
      },
      complianceRate: {
        value: Math.round(complianceRate),
        trend: 0
      }
    });
  } catch (error) {
    console.error('Get KPIs error:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

/**
 * GET /api/dashboard/fleet-overview
 * Get fleet status breakdown for pie chart
 */
router.get('/fleet-overview', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    
    // Get vehicles by status
    const [operational] = await db.select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(vehicles.vorStatus, false)
      ));
    
    const [vor] = await db.select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(vehicles.vorStatus, true)
      ));
    
    res.json({
      data: [
        { name: 'Operational', value: Number(operational.count), color: '#10b981' },
        { name: 'VOR', value: Number(vor.count), color: '#ef4444' },
        { name: 'In Service', value: 0, color: '#f59e0b' }, // TODO: Track service status
        { name: 'Maintenance', value: 0, color: '#6366f1' }
      ]
    });
  } catch (error) {
    console.error('Get fleet overview error:', error);
    res.status(500).json({ error: 'Failed to fetch fleet overview' });
  }
});

/**
 * GET /api/dashboard/cost-analysis
 * Get cost breakdown for bar chart
 */
router.get('/cost-analysis', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const period = req.query.period as string || 'monthly';
    
    // Get last 6 months of data
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      // Get fuel costs
      const [fuelCost] = await db.select({ 
        total: sql<number>`COALESCE(SUM(${fuelEntries.price}), 0)` 
      })
        .from(fuelEntries)
        .where(and(
          eq(fuelEntries.companyId, companyId),
          gte(fuelEntries.createdAt, month),
          lte(fuelEntries.createdAt, monthEnd)
        ));
      
      // Get service costs
      const [serviceCost] = await db.select({ 
        total: sql<number>`COALESCE(SUM(${serviceHistory.cost}), 0)` 
      })
        .from(serviceHistory)
        .where(and(
          eq(serviceHistory.companyId, companyId),
          gte(serviceHistory.serviceDate, month),
          lte(serviceHistory.serviceDate, monthEnd)
        ));
      
      months.push({
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        fuel: Math.round(Number(fuelCost.total) / 100), // Convert pence to pounds
        service: Math.round(Number(serviceCost.total) / 100),
        insurance: 0 // TODO: Track insurance costs
      });
    }
    
    res.json({ data: months });
  } catch (error) {
    console.error('Get cost analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch cost analysis' });
  }
});

/**
 * GET /api/dashboard/compliance
 * Get compliance status for stacked bar chart
 */
router.get('/compliance', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const now = new Date();
    
    // MOT Compliance
    const [motCompliant] = await db.select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        gte(vehicles.motDue, now)
      ));
    
    const [motNonCompliant] = await db.select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        sql`${vehicles.motDue} < ${now}`
      ));
    
    // Tax Compliance
    const [taxCompliant] = await db.select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        gte(vehicles.taxDue, now)
      ));
    
    const [taxNonCompliant] = await db.select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        sql`${vehicles.taxDue} < ${now}`
      ));
    
    // Service Compliance (due within 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [serviceCompliant] = await db.select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        gte(vehicles.nextServiceDue, thirtyDaysFromNow)
      ));
    
    const [serviceNonCompliant] = await db.select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(and(
        eq(vehicles.companyId, companyId),
        sql`${vehicles.nextServiceDue} < ${thirtyDaysFromNow}`
      ));
    
    res.json({
      data: [
        { 
          category: 'MOT', 
          compliant: Number(motCompliant.count), 
          nonCompliant: Number(motNonCompliant.count) 
        },
        { 
          category: 'Tax', 
          compliant: Number(taxCompliant.count), 
          nonCompliant: Number(taxNonCompliant.count) 
        },
        { 
          category: 'Service', 
          compliant: Number(serviceCompliant.count), 
          nonCompliant: Number(serviceNonCompliant.count) 
        }
      ]
    });
  } catch (error) {
    console.error('Get compliance error:', error);
    res.status(500).json({ error: 'Failed to fetch compliance data' });
  }
});

/**
 * GET /api/dashboard/driver-activity
 * Get driver activity for line chart
 */
router.get('/driver-activity', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const days = parseInt(req.query.days as string) || 7;
    
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      
      // Get inspections count
      const [inspectionsCount] = await db.select({ count: sql<number>`count(*)` })
        .from(inspections)
        .where(and(
          eq(inspections.companyId, companyId),
          gte(inspections.createdAt, day),
          lte(inspections.createdAt, dayEnd)
        ));
      
      // Get defects count
      const [defectsCount] = await db.select({ count: sql<number>`count(*)` })
        .from(defects)
        .where(and(
          eq(defects.companyId, companyId),
          gte(defects.createdAt, day),
          lte(defects.createdAt, dayEnd)
        ));
      
      data.push({
        day: day.toLocaleDateString('en-US', { weekday: 'short' }),
        inspections: Number(inspectionsCount.count),
        defects: Number(defectsCount.count)
      });
    }
    
    res.json({ data });
  } catch (error) {
    console.error('Get driver activity error:', error);
    res.status(500).json({ error: 'Failed to fetch driver activity' });
  }
});

/**
 * GET /api/dashboard/defect-trends
 * Get defect trends for area chart
 */
router.get('/defect-trends', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const days = parseInt(req.query.days as string) || 30;
    
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      
      // Get defects by severity
      const [minor] = await db.select({ count: sql<number>`count(*)` })
        .from(defects)
        .where(and(
          eq(defects.companyId, companyId),
          eq(defects.severity, 'MINOR'),
          gte(defects.createdAt, day),
          lte(defects.createdAt, dayEnd)
        ));
      
      const [major] = await db.select({ count: sql<number>`count(*)` })
        .from(defects)
        .where(and(
          eq(defects.companyId, companyId),
          eq(defects.severity, 'MAJOR'),
          gte(defects.createdAt, day),
          lte(defects.createdAt, dayEnd)
        ));
      
      const [dangerous] = await db.select({ count: sql<number>`count(*)` })
        .from(defects)
        .where(and(
          eq(defects.companyId, companyId),
          eq(defects.severity, 'DANGEROUS'),
          gte(defects.createdAt, day),
          lte(defects.createdAt, dayEnd)
        ));
      
      data.push({
        date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minor: Number(minor.count),
        major: Number(major.count),
        dangerous: Number(dangerous.count)
      });
    }
    
    res.json({ data });
  } catch (error) {
    console.error('Get defect trends error:', error);
    res.status(500).json({ error: 'Failed to fetch defect trends' });
  }
});

/**
 * GET /api/dashboard/recent-activity
 * Get recent activity feed
 */
router.get('/recent-activity', async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get recent inspections
    const recentInspections = await db.select({
      id: inspections.id,
      type: sql<string>`'inspection'`,
      description: sql<string>`CONCAT('Inspection completed for vehicle ', (SELECT vrm FROM vehicles WHERE id = ${inspections.vehicleId}))`,
      timestamp: inspections.createdAt,
      user: sql<string>`(SELECT name FROM users WHERE id = ${inspections.driverId})`
    })
      .from(inspections)
      .where(eq(inspections.companyId, companyId))
      .orderBy(desc(inspections.createdAt))
      .limit(limit);
    
    // Get recent defects
    const recentDefects = await db.select({
      id: defects.id,
      type: sql<string>`'defect'`,
      description: sql<string>`CONCAT('Defect reported: ', ${defects.category})`,
      timestamp: defects.createdAt,
      user: sql<string>`(SELECT name FROM users WHERE id = ${defects.reportedBy})`
    })
      .from(defects)
      .where(eq(defects.companyId, companyId))
      .orderBy(desc(defects.createdAt))
      .limit(limit);
    
    // Combine and sort
    const activities = [...recentInspections, ...recentDefects]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    
    res.json({ activities });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

export default router;
