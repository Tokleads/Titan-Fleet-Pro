/**
 * Advanced Dashboard
 * 
 * Enhanced dashboard with KPIs, charts, and analytics for fleet management.
 */

import { useState, useEffect } from 'react';
import { ManagerLayout } from './ManagerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Truck, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Calendar,
  Activity,
  Loader2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { session } from '@/lib/session';
import { useToast } from '@/hooks/use-toast';

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface KPIs {
  totalVehicles: number;
  totalVehiclesTrend: number;
  activeDrivers: number;
  activeDriversTrend: number;
  inspectionsMTD: number;
  inspectionsMTDTrend: number;
  complianceRate: number;
  complianceRateTrend: number;
  avgMpg: number;
  avgMpgTrend: number;
  fuelCostMTD: number;
  fuelCostTrend: number;
}

interface ChartData {
  name?: string;
  value?: number;
  color?: string;
  [key: string]: any;
}

export default function AdvancedDashboard() {
  const { toast } = useToast();
  const companyId = session.getCompany()?.id || 1;
  
  // State
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [fleetStatusData, setFleetStatusData] = useState<ChartData[]>([]);
  const [costAnalysisData, setCostAnalysisData] = useState<ChartData[]>([]);
  const [complianceData, setComplianceData] = useState<ChartData[]>([]);
  const [defectTrendData, setDefectTrendData] = useState<ChartData[]>([]);
  const [driverActivityData, setDriverActivityData] = useState<ChartData[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topDriversMpg, setTopDriversMpg] = useState<ChartData[]>([]);
  
  // Fetch all dashboard data
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        // Calculate date range for fuel intelligence (last 30 days)
        const endDate = new Date().toISOString().split('T')[0];
        const startDateObj = new Date();
        startDateObj.setDate(startDateObj.getDate() - 30);
        const startDate = startDateObj.toISOString().split('T')[0];

        const [
          kpisRes,
          fleetRes,
          costRes,
          complianceRes,
          driverRes,
          defectRes,
          activityRes,
          fuelSummaryRes,
          driverMpgRes
        ] = await Promise.all([
          fetch(`/api/dashboard/kpis?companyId=${companyId}`, { signal: controller.signal, headers: authHeaders() }),
          fetch(`/api/dashboard/fleet-overview?companyId=${companyId}`, { signal: controller.signal, headers: authHeaders() }),
          fetch(`/api/dashboard/cost-analysis?companyId=${companyId}`, { signal: controller.signal, headers: authHeaders() }),
          fetch(`/api/dashboard/compliance?companyId=${companyId}`, { signal: controller.signal, headers: authHeaders() }),
          fetch(`/api/dashboard/driver-activity?companyId=${companyId}`, { signal: controller.signal, headers: authHeaders() }),
          fetch(`/api/dashboard/defect-trends?companyId=${companyId}`, { signal: controller.signal, headers: authHeaders() }),
          fetch(`/api/dashboard/recent-activity?companyId=${companyId}`, { signal: controller.signal, headers: authHeaders() }),
          fetch(`/api/fuel-intelligence/summary?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`, { signal: controller.signal, headers: authHeaders() }),
          fetch(`/api/fuel-intelligence/driver-performance?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`, { signal: controller.signal, headers: authHeaders() })
        ]);
        
        // Parse responses
        const kpisData = await kpisRes.json();
        const fleetData = await fleetRes.json();
        const costData = await costRes.json();
        const complianceDataRes = await complianceRes.json();
        const driverData = await driverRes.json();
        const defectData = await defectRes.json();
        const activityData = await activityRes.json();
        const fuelSummary = fuelSummaryRes.ok ? await fuelSummaryRes.json() : null;
        const driverMpgData = driverMpgRes.ok ? await driverMpgRes.json() : [];
        
        // Transform nested KPI structure to flat structure
        const transformedKpis: KPIs = {
          totalVehicles: Number(kpisData.totalVehicles?.value) || 0,
          totalVehiclesTrend: Number(kpisData.totalVehicles?.trend) || 0,
          activeDrivers: Number(kpisData.activeDrivers?.value) || 0,
          activeDriversTrend: Number(kpisData.activeDrivers?.trend) || 0,
          inspectionsMTD: Number(kpisData.inspectionsMTD?.value) || 0,
          inspectionsMTDTrend: Number(kpisData.inspectionsMTD?.trend) || 0,
          complianceRate: Number(kpisData.complianceRate?.value) || 0,
          complianceRateTrend: Number(kpisData.complianceRate?.trend) || 0,
          avgMpg: Number(fuelSummary?.avgMpg) || 0,
          avgMpgTrend: 0,
          fuelCostMTD: Number(fuelSummary?.totalCost) || 0,
          fuelCostTrend: 0,
        };

        // Transform driver MPG data for chart
        const topDrivers = Array.isArray(driverMpgData) 
          ? driverMpgData.slice(0, 5).map((d: any) => ({
              name: d.driverName || 'Unknown',
              mpg: Number(d.avgMpg) || 0,
            }))
          : [];
        
        // Set state
        setKpis(transformedKpis);
        setFleetStatusData(fleetData.data || []);
        setCostAnalysisData(costData.data || []);
        setComplianceData(complianceDataRes.data || []);
        setDriverActivityData(driverData.data || []);
        setDefectTrendData(defectData.data || []);
        setRecentActivity(activityData.activities || []);
        setTopDriversMpg(topDrivers);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          toast({
            title: 'Error',
            description: 'Failed to load dashboard data',
            variant: 'destructive'
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    return () => controller.abort();
  }, [companyId]);

  if (loading) {
    return (
      <ManagerLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive fleet insights and performance metrics
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select defaultValue="7days">
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Total Vehicles */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Vehicles
                </CardTitle>
                <Truck className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalVehicles}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  {kpis.totalVehiclesTrend >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={kpis.totalVehiclesTrend >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(kpis.totalVehiclesTrend).toFixed(1)}%
                  </span>
                  <span>vs last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Active Drivers */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Drivers
                </CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.activeDrivers}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  {kpis.activeDriversTrend >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={kpis.activeDriversTrend >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(kpis.activeDriversTrend).toFixed(1)}%
                  </span>
                  <span>vs last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Inspections MTD */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inspections MTD
                </CardTitle>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.inspectionsMTD}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  {kpis.inspectionsMTDTrend >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={kpis.inspectionsMTDTrend >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(kpis.inspectionsMTDTrend).toFixed(1)}%
                  </span>
                  <span>vs last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Compliance Rate
                </CardTitle>
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.complianceRate.toFixed(1)}%</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  {kpis.complianceRateTrend >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={kpis.complianceRateTrend >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(kpis.complianceRateTrend).toFixed(1)}%
                  </span>
                  <span>vs last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Average MPG */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fleet Avg MPG
                </CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.avgMpg.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Last 30 days average
                </div>
              </CardContent>
            </Card>

            {/* Fuel Cost MTD */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fuel Cost MTD
                </CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{kpis.fuelCostMTD.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Last 30 days spend
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fleet Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Fleet Overview</CardTitle>
              <CardDescription>Vehicle status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fleetStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {fleetStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cost Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>6-month cost breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="fuel" fill="#3b82f6" name="Fuel" />
                  <Bar dataKey="service" fill="#10b981" name="Service" />
                  <Bar dataKey="insurance" fill="#f59e0b" name="Insurance" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compliance Status */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>MOT, Tax, and Service compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={complianceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="valid" stackId="a" fill="#10b981" name="Valid" />
                  <Bar dataKey="expiring" stackId="a" fill="#f59e0b" name="Expiring" />
                  <Bar dataKey="expired" stackId="a" fill="#ef4444" name="Expired" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Driver Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Driver Activity</CardTitle>
              <CardDescription>7-day inspection and defect trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={driverActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="inspections" stroke="#3b82f6" strokeWidth={2} name="Inspections" />
                  <Line type="monotone" dataKey="defects" stroke="#ef4444" strokeWidth={2} name="Defects" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Defect Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Defect Trend Analysis</CardTitle>
              <CardDescription>30-day defect severity breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={defectTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="#ef4444" name="Critical" />
                  <Area type="monotone" dataKey="high" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="High" />
                  <Area type="monotone" dataKey="medium" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Medium" />
                  <Area type="monotone" dataKey="low" stackId="1" stroke="#10b981" fill="#10b981" name="Low" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest inspections and defects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                ) : (
                  recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'inspection' ? 'bg-blue-500' : 'bg-red-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <Badge variant={activity.type === 'inspection' ? 'default' : 'destructive'}>
                            {activity.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.vehicle} • {new Date(activity.timestamp).toLocaleString('en-GB')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Drivers by MPG */}
        {topDriversMpg.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Drivers by Fuel Efficiency</CardTitle>
              <CardDescription>Best performing drivers by average MPG (last 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topDriversMpg} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 'auto']} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)} MPG`, 'Efficiency']} />
                  <Bar dataKey="mpg" fill="#10b981" name="Avg MPG" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common fleet management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto flex-col py-4">
                <Truck className="w-6 h-6 mb-2" />
                <span>Add Vehicle</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col py-4">
                <Users className="w-6 h-6 mb-2" />
                <span>Add Driver</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col py-4">
                <FileText className="w-6 h-6 mb-2" />
                <span>New Inspection</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col py-4">
                <AlertTriangle className="w-6 h-6 mb-2" />
                <span>Report Defect</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ManagerLayout>
  );
}
