import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, Download, Calendar, Users, AlertCircle, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Driver {
  id: number;
  name: string;
  email: string;
}

interface Timesheet {
  id: number;
  driverId: number;
  depotName: string;
  arrivalTime: string;
  departureTime: string | null;
  totalMinutes: number | null;
  status: 'ACTIVE' | 'COMPLETED';
  driver?: Driver;
}

interface WeeklySummary {
  driverId: number;
  driverName: string;
  totalHours: number;
  shifts: number;
  overtime: number;
  regularHours: number;
}

interface TimesheetsDashboardProps {
  companyId: number;
}

export default function TimesheetsDashboard({ companyId }: TimesheetsDashboardProps) {
  const [viewMode, setViewMode] = useState<'all' | 'weekly' | 'monthly'>('weekly');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'COMPLETED'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date();
    return {
      start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    };
  });

  // Fetch timesheets
  const { data: timesheets = [], isLoading, refetch } = useQuery<Timesheet[]>({
    queryKey: ['timesheets', companyId, statusFilter, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      
      const response = await fetch(`/api/timesheets/${companyId}?${params}`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to fetch timesheets');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Calculate weekly summary
  const weeklySummary: WeeklySummary[] = timesheets.reduce((acc, ts) => {
    if (ts.status !== 'COMPLETED' || !ts.totalMinutes) return acc;
    
    const existing = acc.find(s => s.driverId === ts.driverId);
    const hours = ts.totalMinutes / 60;
    
    if (existing) {
      existing.totalHours += hours;
      existing.shifts += 1;
    } else {
      acc.push({
        driverId: ts.driverId,
        driverName: ts.driver?.name || 'Unknown',
        totalHours: hours,
        shifts: 1,
        overtime: 0,
        regularHours: 0
      });
    }
    
    return acc;
  }, [] as WeeklySummary[]);

  // Calculate overtime (>40 hours/week)
  weeklySummary.forEach(summary => {
    if (summary.totalHours > 40) {
      summary.overtime = summary.totalHours - 40;
      summary.regularHours = 40;
    } else {
      summary.regularHours = summary.totalHours;
    }
  });

  const activeShifts = timesheets.filter(ts => ts.status === 'ACTIVE');
  const completedShifts = timesheets.filter(ts => ts.status === 'COMPLETED');
  const totalHours = completedShifts.reduce((sum, ts) => sum + (ts.totalMinutes || 0), 0) / 60;

  const handleViewModeChange = (mode: 'all' | 'weekly' | 'monthly') => {
    setViewMode(mode);
    const now = new Date();
    
    switch (mode) {
      case 'weekly':
        setDateRange({
          start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        });
        break;
      case 'monthly':
        setDateRange({
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        });
        break;
      case 'all':
        setDateRange({
          start: format(subMonths(now, 3), 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd')
        });
        break;
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/timesheets/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          companyId,
          startDate: dateRange.start,
          endDate: dateRange.end
        })
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timesheets-${dateRange.start}-to-${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export timesheets');
    }
  };

  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (timestamp: string | null): string => {
    if (!timestamp) return '-';
    return format(new Date(timestamp), 'HH:mm');
  };

  const formatDate = (timestamp: string): string => {
    return format(new Date(timestamp), 'dd MMM yyyy');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timesheet Management</h1>
          <p className="text-muted-foreground">Track driver hours and generate wage invoices</p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Shifts</p>
              <p className="text-2xl font-bold">{activeShifts.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Drivers</p>
              <p className="text-2xl font-bold">{weeklySummary.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overtime</p>
              <p className="text-2xl font-bold">
                {weeklySummary.reduce((sum, s) => sum + s.overtime, 0).toFixed(1)}h
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              onClick={() => handleViewModeChange('weekly')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              This Week
            </Button>
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'outline'}
              onClick={() => handleViewModeChange('monthly')}
            >
              This Month
            </Button>
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              onClick={() => handleViewModeChange('all')}
            >
              Last 3 Months
            </Button>
          </div>

          <div className="flex gap-2 md:ml-auto">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-40"
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-40"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Weekly Summary */}
      {viewMode === 'weekly' && weeklySummary.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Weekly Summary</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Shifts</TableHead>
                <TableHead className="text-right">Regular Hours</TableHead>
                <TableHead className="text-right">Overtime</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklySummary.map((summary) => (
                <TableRow key={summary.driverId}>
                  <TableCell className="font-medium">{summary.driverName}</TableCell>
                  <TableCell className="text-right">{summary.shifts}</TableCell>
                  <TableCell className="text-right">{summary.regularHours.toFixed(1)}h</TableCell>
                  <TableCell className="text-right">
                    {summary.overtime > 0 ? (
                      <span className="text-orange-600 font-semibold">
                        {summary.overtime.toFixed(1)}h
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {summary.totalHours.toFixed(1)}h
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Active Shifts */}
      {activeShifts.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold">Active Shifts</h2>
            <Badge variant="secondary" className="ml-2">{activeShifts.length} Active</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Depot</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeShifts.map((ts) => (
                <TableRow key={ts.id}>
                  <TableCell className="font-medium">{ts.driver?.name || 'Unknown'}</TableCell>
                  <TableCell>{ts.depotName}</TableCell>
                  <TableCell>{formatTime(ts.arrivalTime)}</TableCell>
                  <TableCell>
                    {formatDuration(
                      Math.floor((Date.now() - new Date(ts.arrivalTime).getTime()) / 60000)
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* All Timesheets */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Timesheets</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Depot</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timesheets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No timesheets found for the selected period
                </TableCell>
              </TableRow>
            ) : (
              timesheets.map((ts) => (
                <TableRow key={ts.id}>
                  <TableCell className="font-medium">{ts.driver?.name || 'Unknown'}</TableCell>
                  <TableCell>{formatDate(ts.arrivalTime)}</TableCell>
                  <TableCell>{ts.depotName}</TableCell>
                  <TableCell>{formatTime(ts.arrivalTime)}</TableCell>
                  <TableCell>{formatTime(ts.departureTime)}</TableCell>
                  <TableCell>{formatDuration(ts.totalMinutes)}</TableCell>
                  <TableCell>
                    {ts.status === 'ACTIVE' ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Completed</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
