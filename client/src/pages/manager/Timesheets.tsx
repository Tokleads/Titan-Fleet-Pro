import { useQuery } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { 
  Clock, 
  MapPin, 
  Calendar,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Signal,
  User,
  Building2
} from "lucide-react";
import { useState, useMemo } from "react";

interface Timesheet {
  id: number;
  driverId: number;
  depotId: number;
  depotName: string;
  arrivalTime: string;
  departureTime?: string;
  totalMinutes?: number;
  status: string;
  arrivalAccuracy?: number | null;
  departureAccuracy?: number | null;
  manualDepotSelection?: boolean;
  driver?: {
    name: string;
    email: string;
  };
}

interface Driver {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Geofence {
  id: number;
  name: string;
  companyId: number;
}

export default function Timesheets() {
  const company = session.getCompany();
  const companyId = company?.id;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [depotFilter, setDepotFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const { data: timesheets, isLoading } = useQuery<Timesheet[]>({
    queryKey: ["timesheets", companyId, statusFilter, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(statusFilter !== "all" && { status: statusFilter }),
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      const res = await fetch(`/api/timesheets/${companyId}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch timesheets");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: drivers } = useQuery<Driver[]>({
    queryKey: ["drivers", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/users/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch drivers");
      const users = await res.json();
      return users.filter((u: Driver) => u.role === "DRIVER");
    },
    enabled: !!companyId,
  });

  const { data: depots } = useQuery<Geofence[]>({
    queryKey: ["geofences", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/geofences/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch depots");
      return res.json();
    },
    enabled: !!companyId,
  });

  const filteredTimesheets = useMemo(() => {
    if (!timesheets) return [];
    return timesheets.filter((ts) => {
      if (driverFilter !== "all" && ts.driverId !== Number(driverFilter)) {
        return false;
      }
      if (depotFilter !== "all" && ts.depotId !== Number(depotFilter)) {
        return false;
      }
      return true;
    });
  }, [timesheets, driverFilter, depotFilter]);

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/timesheets/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          startDate: dateRange.start,
          endDate: dateRange.end
        })
      });
      
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timesheets-${dateRange.start}-to-${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export timesheets");
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "In Progress";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const totalHours = filteredTimesheets.reduce((sum, ts) => sum + (ts.totalMinutes || 0), 0);
  const completedCount = filteredTimesheets.filter(ts => ts.status === "COMPLETED").length;
  const activeCount = filteredTimesheets.filter(ts => ts.status === "ACTIVE").length;

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Timesheets</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Automated depot-based time tracking
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Entries</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{filteredTimesheets.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Now</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{activeCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Hours</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{Math.round(totalHours / 60)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Filters:</span>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="filter-status"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="filter-driver"
            >
              <option value="all">All Drivers</option>
              {drivers?.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>

            <select
              value={depotFilter}
              onChange={(e) => setDepotFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="filter-depot"
            >
              <option value="all">All Depots</option>
              {depots?.map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <span className="text-slate-400">to</span>
            
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Timesheets Table */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Depot
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Arrival
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Departure
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Flags
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Loading timesheets...
                    </td>
                  </tr>
                ) : filteredTimesheets.length > 0 ? (
                  filteredTimesheets.map((timesheet) => (
                    <tr key={timesheet.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {timesheet.driver?.name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <span className="font-medium text-slate-900">
                            {timesheet.driver?.name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {timesheet.depotName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(timesheet.arrivalTime).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {timesheet.departureTime 
                          ? new Date(timesheet.departureTime).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : <span className="text-blue-600 font-medium">In Progress</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {formatDuration(timesheet.totalMinutes)}
                      </td>
                      <td className="px-4 py-3">
                        {timesheet.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            <Clock className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {timesheet.manualDepotSelection && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700" title="Driver manually selected depot - not within geofence" data-testid={`flag-manual-${timesheet.id}`}>
                              <AlertTriangle className="h-3 w-3" />
                              Manual
                            </span>
                          )}
                          {timesheet.arrivalAccuracy && timesheet.arrivalAccuracy > 50 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700" title={`Clock-in GPS accuracy: ±${timesheet.arrivalAccuracy}m`} data-testid={`flag-arrival-accuracy-${timesheet.id}`}>
                              <Signal className="h-3 w-3" />
                              In: ±{timesheet.arrivalAccuracy}m
                            </span>
                          )}
                          {timesheet.departureAccuracy && timesheet.departureAccuracy > 50 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700" title={`Clock-out GPS accuracy: ±${timesheet.departureAccuracy}m`} data-testid={`flag-departure-accuracy-${timesheet.id}`}>
                              <Signal className="h-3 w-3" />
                              Out: ±{timesheet.departureAccuracy}m
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500 font-medium">No timesheets found</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Timesheets are automatically created when drivers enter depot geofences
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
