/**
 * Advanced Dashboard
 * 
 * Enhanced dashboard with KPIs, charts, and analytics for fleet management.
 */

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
  Activity
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

// Mock data for charts
const fleetStatusData = [
  { name: 'Active', value: 45, color: '#10b981' },
  { name: 'VOR', value: 5, color: '#ef4444' },
  { name: 'Inactive', value: 10, color: '#6b7280' }
];

const costAnalysisData = [
  { month: 'Jan', fuel: 12000, service: 8000, insurance: 5000 },
  { month: 'Feb', fuel: 15000, service: 7500, insurance: 5000 },
  { month: 'Mar', fuel: 13000, service: 9000, insurance: 5000 },
  { month: 'Apr', fuel: 14000, service: 8500, insurance: 5000 },
  { month: 'May', fuel: 16000, service: 7000, insurance: 5000 },
  { month: 'Jun', fuel: 15500, service: 8200, insurance: 5000 }
];

const complianceData = [
  { category: 'MOT', valid: 42, expiring: 5, expired: 3 },
  { category: 'Tax', valid: 45, expiring: 3, expired: 2 },
  { category: 'Service', valid: 38, expiring: 8, expired: 4 }
];

const defectTrendData = [
  { week: 'W1', critical: 2, high: 5, medium: 12, low: 8 },
  { week: 'W2', critical: 1, high: 4, medium: 15, low: 10 },
  { week: 'W3', critical: 3, high: 6, medium: 10, low: 7 },
  { week: 'W4', critical: 1, high: 3, medium: 14, low: 9 }
];

const driverActivityData = [
  { day: 'Mon', inspections: 15, defects: 3 },
  { day: 'Tue', inspections: 18, defects: 2 },
  { day: 'Wed', inspections: 12, defects: 5 },
  { day: 'Thu', inspections: 20, defects: 1 },
  { day: 'Fri', inspections: 16, defects: 4 },
  { day: 'Sat', inspections: 8, defects: 2 },
  { day: 'Sun', inspections: 5, defects: 1 }
];

export default function AdvancedDashboard() {
  return (
    <ManagerLayout>
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Advanced Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive fleet analytics and insights
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select defaultValue="7days">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Vehicles
              <Truck className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">60</span>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>+5%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              45 active, 5 VOR, 10 inactive
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Active Drivers
              <Users className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">52</span>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>+2%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              48 on duty, 4 off duty
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Inspections (MTD)
              <FileText className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">284</span>
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <TrendingDown className="h-4 w-4" />
                <span>-8%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              12 failed, 272 passed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Compliance Rate
              <CheckCircle2 className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">92%</span>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>+3%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              MOT, Tax, Service up to date
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Fleet Overview Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet Overview</CardTitle>
            <CardDescription>Vehicles by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fleetStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fleetStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Cost Analysis Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Analysis</CardTitle>
            <CardDescription>Monthly costs breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costAnalysisData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `£${value}`} />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>MOT, Tax, and Service status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="valid" fill="#10b981" name="Valid" stackId="a" />
                <Bar dataKey="expiring" fill="#f59e0b" name="Expiring Soon" stackId="a" />
                <Bar dataKey="expired" fill="#ef4444" name="Expired" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Driver Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Driver Activity</CardTitle>
            <CardDescription>Inspections and defects this week</CardDescription>
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
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Defect Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Defect Trend Analysis</CardTitle>
            <CardDescription>Defects by severity over the last 4 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={defectTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="critical" stackId="1" stroke="#dc2626" fill="#dc2626" name="Critical" />
                <Area type="monotone" dataKey="high" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="High" />
                <Area type="monotone" dataKey="medium" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Medium" />
                <Area type="monotone" dataKey="low" stackId="1" stroke="#10b981" fill="#10b981" name="Low" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Truck className="h-4 w-4 mr-2" />
              Add New Vehicle
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Add New Driver
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Service
            </Button>
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest fleet updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Inspection completed - AB12 CDE</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Defect reported - XY34 FGH</p>
                  <p className="text-sm text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Service completed - CD56 HIJ</p>
                  <p className="text-sm text-muted-foreground">Yesterday</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">MOT expiring soon - KL78 MNO</p>
                  <p className="text-sm text-muted-foreground">2 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </ManagerLayout>
  );
}
