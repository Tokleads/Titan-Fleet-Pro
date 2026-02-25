import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  ClipboardCheck,
  Loader2,
  Truck,
  User,
  Timer,
  AlertTriangle,
  Gauge
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VehicleDetailModal } from "@/components/VehicleDetailModal";

export default function ManagerInspections() {
  const company = session.getCompany();
  const companyId = company?.id;
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterDriver, setFilterDriver] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [inspectionTab, setInspectionTab] = useState<"vehicle" | "endOfShift">("vehicle");
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  const { data: shiftChecks, isLoading: shiftChecksLoading } = useQuery<any[]>({
    queryKey: ["shift-checks", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/shift-checks/${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch shift checks");
      return res.json();
    },
    enabled: !!companyId && inspectionTab === "endOfShift",
  });

  const { data: inspectionsData, isLoading } = useQuery<{ inspections: any[]; total: number }>({
    queryKey: ["manager-inspections", companyId, page, filterStatus, filterVehicle, filterDriver, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(page * pageSize),
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterVehicle !== 'all' && { vehicleId: filterVehicle }),
        ...(filterDriver !== 'all' && { driverId: filterDriver })
      });
      const res = await fetch(`/api/manager/inspections/${companyId}?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch inspections");
      return res.json();
    },
    enabled: !!companyId,
  });

  const inspections = inspectionsData?.inspections || [];
  const totalInspections = inspectionsData?.total || 0;

  const { data: vehiclesData } = useQuery<{ vehicles: any[] }>({
    queryKey: ["vehicles", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles?companyId=${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
    enabled: !!companyId,
  });

  const vehicles = vehiclesData?.vehicles || [];

  const { data: users } = useQuery({
    queryKey: ["users", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/users/${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!companyId,
  });

  const getVehicleVrm = (vehicleId: number) => {
    const vehicle = vehicles?.find((v: any) => v.id === vehicleId);
    return vehicle?.vrm || "Unknown";
  };

  const getVehicleName = (vehicleId: number) => {
    const vehicle = vehicles?.find((v: any) => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model}` : "";
  };

  const getDriverName = (driverId: number) => {
    const user = users?.find((u: any) => u.id === driverId);
    return user?.name || "Unknown";
  };

  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = async () => {
    if (!companyId) return;
    
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        limit: '10000',
        offset: '0',
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterVehicle !== 'all' && { vehicleId: filterVehicle }),
        ...(filterDriver !== 'all' && { driverId: filterDriver })
      });
      const res = await fetch(`/api/manager/inspections/${companyId}?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch inspections");
      const data = await res.json();
      const allInspections = data.inspections || [];
      
      if (allInspections.length === 0) {
        alert('No inspections to export');
        return;
      }

      // CSV header
      const headers = ['Date', 'Time', 'Vehicle VRM', 'Vehicle Name', 'Driver', 'Type', 'Mileage', 'Result'];
      
      // CSV rows
      const rows = allInspections.map((inspection: any) => {
        const date = new Date(inspection.createdAt);
        return [
          date.toLocaleDateString('en-GB'),
          date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          getVehicleVrm(inspection.vehicleId),
          getVehicleName(inspection.vehicleId),
          getDriverName(inspection.driverId),
          inspection.type.replace('_', ' ').toLowerCase(),
          inspection.odometer || '',
          inspection.status
        ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
      });

      // Combine header and rows
      const csvContent = [headers.join(','), ...rows].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inspections-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert('Failed to export inspections');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ManagerLayout>
      <div className="space-y-6 titan-page-enter">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inspections</h1>
            <p className="text-slate-500 mt-0.5">Vehicle and end-of-shift inspection records</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              data-testid="button-inspections-filters"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
            <button 
              onClick={exportToCSV}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              data-testid="button-inspections-export"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4" data-testid="panel-filters">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Status:</label>
              <select 
                value={filterStatus} 
                onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                data-testid="select-filter-status"
              >
                <option value="all">All</option>
                <option value="PASS">Pass</option>
                <option value="FAIL">Defects</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Vehicle:</label>
              <select 
                value={filterVehicle} 
                onChange={(e) => { setFilterVehicle(e.target.value); setPage(0); }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                data-testid="select-filter-vehicle"
              >
                <option value="all">All Vehicles</option>
                {vehicles?.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.vrm} - {v.make} {v.model}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Driver:</label>
              <select 
                value={filterDriver} 
                onChange={(e) => { setFilterDriver(e.target.value); setPage(0); }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                data-testid="select-filter-driver"
              >
                <option value="all">All Drivers</option>
                {users?.filter((u: any) => u.role === 'DRIVER').map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Date:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => { setDateRange({ ...dateRange, start: e.target.value }); setPage(0); }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                data-testid="input-filter-start-date"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => { setDateRange({ ...dateRange, end: e.target.value }); setPage(0); }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                data-testid="input-filter-end-date"
              />
            </div>
            <button 
              onClick={() => { 
                setFilterStatus('all'); 
                setFilterVehicle('all'); 
                setFilterDriver('all'); 
                setDateRange({
                  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  end: new Date().toISOString().split('T')[0]
                });
                setPage(0); 
              }}
              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              data-testid="button-reset-filters"
            >
              Reset
            </button>
          </div>
        )}

        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setInspectionTab("vehicle")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              inspectionTab === "vehicle"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            data-testid="tab-vehicle-inspections"
          >
            <ClipboardCheck className="h-4 w-4 inline mr-1.5" />
            Vehicle Inspections
          </button>
          <button
            onClick={() => setInspectionTab("endOfShift")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              inspectionTab === "endOfShift"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            data-testid="tab-end-of-shift"
          >
            <Timer className="h-4 w-4 inline mr-1.5" />
            End of Shift Checks
          </button>
        </div>

        {inspectionTab === "endOfShift" ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-shift-checks">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date/Time</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Driver</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shiftChecksLoading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                      </td>
                    </tr>
                  ) : (!shiftChecks || shiftChecks.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                        No end-of-shift checks found
                      </td>
                    </tr>
                  ) : (
                    shiftChecks.map((check: any) => (
                      <tr key={check.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-900">
                            {new Date(check.completedAt || check.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(check.completedAt || check.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {check.driver?.name || getDriverName(check.driverId)}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 font-mono">
                          {check.vehicle?.vrm || getVehicleVrm(check.vehicleId)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            check.status === 'COMPLETED' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {check.status === 'COMPLETED' ? (
                              <><CheckCircle2 className="h-3 w-3" /> Completed</>
                            ) : (
                              <><Clock className="h-3 w-3" /> {check.status}</>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
        <>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="table-inspections">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date/Time</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Driver</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mileage</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Result</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-4"><div className="h-4 w-32 bg-slate-100 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-100 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-16 bg-slate-100 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-8 w-8 bg-slate-100 rounded animate-pulse" /></td>
                    </tr>
                  ))
                ) : inspections.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <ClipboardCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No inspections found</p>
                      </td>
                    </tr>
                  ) : (
                    inspections.map((inspection: any) => (
                    <tr key={inspection.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {new Date(inspection.createdAt).toLocaleDateString('en-GB', { 
                                day: '2-digit', 
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(inspection.createdAt).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); if (inspection.vehicleId) setSelectedVehicleId(inspection.vehicleId); }}
                          className="font-mono font-semibold text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
                        >
                          {getVehicleVrm(inspection.vehicleId)}
                        </button>
                        <p className="text-xs text-slate-500">{getVehicleName(inspection.vehicleId)}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {getDriverName(inspection.driverId)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600 capitalize">{inspection.type.replace('_', ' ').toLowerCase()}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm text-slate-900">
                          {inspection.odometer?.toLocaleString() || '-'} mi
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {inspection.status === 'PASS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                            <XCircle className="h-3 w-3" />
                            Defects
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => { setSelectedInspection(inspection); setShowDetailsModal(true); }}
                            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors" 
                            data-testid={`button-view-inspection-${inspection.id}`}
                          >
                            <Eye className="h-4 w-4 text-slate-400" />
                          </button>
                          <a 
                            href={`/api/inspections/${inspection.id}/pdf`}
                            download
                            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                            data-testid={`button-download-pdf-${inspection.id}`}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4 text-slate-400" />
                          </a>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Showing {totalInspections === 0 ? 0 : page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalInspections)} of {totalInspections} results
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="button-inspections-prev-page"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              <span className="text-sm text-slate-600 px-3">Page {page + 1} of {Math.max(1, Math.ceil(totalInspections / pageSize))}</span>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * pageSize >= totalInspections}
                className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="button-inspections-next-page"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </>
      )}
      </div>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0" data-testid="modal-inspection-details">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
                Inspection Details
              </DialogTitle>
              {selectedInspection && (
                <a
                  href={`/api/inspections/${selectedInspection.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  data-testid="button-download-pdf-modal"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </a>
              )}
            </div>
          </DialogHeader>
          
          {selectedInspection && (
            <ScrollArea className="max-h-[calc(90vh-120px)]">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Truck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vehicle</p>
                        <p className="font-mono font-semibold text-slate-900">{getVehicleVrm(selectedInspection.vehicleId)}</p>
                        <p className="text-sm text-slate-500">{getVehicleName(selectedInspection.vehicleId)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Driver</p>
                        <p className="font-medium text-slate-900">{getDriverName(selectedInspection.driverId)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date & Time</p>
                        <p className="font-medium text-slate-900">
                          {new Date(selectedInspection.createdAt).toLocaleDateString('en-GB', { 
                            day: '2-digit', month: 'short', year: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(selectedInspection.createdAt).toLocaleTimeString('en-GB', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Gauge className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Odometer</p>
                        <p className="font-mono font-medium text-slate-900">
                          {selectedInspection.odometer?.toLocaleString() || '-'} miles
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedInspection.durationSeconds && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Timer className="h-4 w-4 text-slate-500" />
                    <div>
                      <span className="text-sm font-medium text-slate-700">Duration: </span>
                      <span className="text-sm text-slate-600">
                        {Math.floor(selectedInspection.durationSeconds / 60)} min {selectedInspection.durationSeconds % 60} sec
                      </span>
                    </div>
                    {selectedInspection.vehicleCategory && (
                      <span className="ml-auto text-xs px-2 py-1 bg-white rounded-md border border-slate-200 text-slate-500">
                        {selectedInspection.vehicleCategory}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">Result:</span>
                  {selectedInspection.status === 'PASS' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                      <XCircle className="h-4 w-4" />
                      Defects Found
                    </span>
                  )}
                  <span className="ml-auto text-sm text-slate-500 capitalize">
                    {selectedInspection.type.replace('_', ' ').toLowerCase()}
                  </span>
                </div>

                {selectedInspection.checklist && Array.isArray(selectedInspection.checklist) && selectedInspection.checklist.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Checklist Items</h4>
                    <div className="space-y-2">
                      {selectedInspection.checklist.map((item: any, index: number) => (
                        <div 
                          key={index}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            item.passed === false 
                              ? 'bg-red-50 border-red-100' 
                              : 'bg-white border-slate-100'
                          }`}
                          data-testid={`checklist-item-${index}`}
                        >
                          {item.passed === false ? (
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${item.passed === false ? 'text-red-700' : 'text-slate-700'}`}>
                            {item.name || item.label || item.item || `Item ${index + 1}`}
                          </span>
                          {item.passed === false ? (
                            <span className="ml-auto text-xs font-medium text-red-600">FAIL</span>
                          ) : (
                            <span className="ml-auto text-xs font-medium text-emerald-600">PASS</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedInspection.defects && Array.isArray(selectedInspection.defects) && selectedInspection.defects.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Defects Reported
                    </h4>
                    <div className="space-y-2">
                      {selectedInspection.defects.map((defect: any, index: number) => (
                        <div 
                          key={index}
                          className="p-3 bg-amber-50 border border-amber-100 rounded-lg"
                          data-testid={`defect-item-${index}`}
                        >
                          <p className="text-sm font-medium text-amber-900">
                            {defect.item || defect.category || defect.name || `Defect ${index + 1}`}
                          </p>
                          {(defect.note || defect.notes || defect.description) && (
                            <p className="text-sm text-amber-700 mt-1">
                              {defect.note || defect.notes || defect.description}
                            </p>
                          )}
                          {defect.photo && (
                            <div className="mt-2">
                              <img 
                                src={defect.photo.startsWith("/objects/") ? defect.photo : `/objects/${defect.photo}`}
                                alt={`Defect photo ${index + 1}`}
                                className="rounded-lg border border-amber-200 object-cover h-40 max-w-full cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setEnlargedPhoto(defect.photo.startsWith("/objects/") ? defect.photo : `/objects/${defect.photo}`)}
                                data-testid={`img-defect-photo-${index}`}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedInspection.cabPhotos && Array.isArray(selectedInspection.cabPhotos) && selectedInspection.cabPhotos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Cab Photos</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedInspection.cabPhotos.map((photo: string, idx: number) => {
                        const imgSrc = photo.startsWith("/objects/") ? photo : `/objects/${photo}`;
                        return (
                          <img 
                            key={idx} 
                            src={imgSrc} 
                            alt={`Cab photo ${idx + 1}`} 
                            className="rounded-lg border border-slate-200 object-cover h-32 w-full cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setEnlargedPhoto(imgSrc)}
                            data-testid={`img-cab-photo-${idx}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedInspection.hasTrailer && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                    <Truck className="h-4 w-4" />
                    Trailer was attached during this inspection
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
      {selectedVehicleId && (
        <VehicleDetailModal vehicleId={selectedVehicleId} onClose={() => setSelectedVehicleId(null)} />
      )}

      <Dialog open={!!enlargedPhoto} onOpenChange={() => setEnlargedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-2" data-testid="modal-photo-enlarge">
          {enlargedPhoto && (
            <img
              src={enlargedPhoto}
              alt="Enlarged inspection photo"
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              data-testid="img-enlarged-photo"
            />
          )}
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  );
}
