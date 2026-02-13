import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { 
  Fuel,
  Clock,
  Filter,
  Download,
  Droplets,
  MapPin,
  X
} from "lucide-react";
import { VehicleDetailModal } from "@/components/VehicleDetailModal";

export default function ManagerFuelLog() {
  const company = session.getCompany();
  const companyId = company?.id;
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const { data: fuelEntries, isLoading } = useQuery({
    queryKey: ["manager-fuel", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/fuel/${companyId}?days=30`);
      if (!res.ok) throw new Error("Failed to fetch fuel entries");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
    enabled: !!companyId,
  });

  const vehicles = Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData?.vehicles || []);

  const { data: users } = useQuery({
    queryKey: ["users", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/users/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!companyId,
  });

  const getVehicleVrm = (vehicleId: number) => {
    const vehicle = vehicles?.find((v: any) => v.id === vehicleId);
    return vehicle?.vrm || "Unknown";
  };

  const getDriverName = (driverId: number) => {
    const user = users?.find((u: any) => u.id === driverId);
    return user?.name || "Unknown";
  };

  const totalDiesel = fuelEntries?.filter((e: any) => e.fuelType === 'DIESEL').reduce((sum: number, e: any) => sum + (e.litres || 0), 0) || 0;
  const totalAdBlue = fuelEntries?.filter((e: any) => e.fuelType === 'ADBLUE').reduce((sum: number, e: any) => sum + (e.litres || 0), 0) || 0;

  const filteredEntries = fuelEntries?.filter((entry: any) => {
    if (fuelTypeFilter === "ALL") return true;
    return entry.fuelType === fuelTypeFilter;
  }) || [];

  const exportToCSV = () => {
    if (!fuelEntries || fuelEntries.length === 0) {
      alert('No fuel entries to export');
      return;
    }

    // CSV header
    const headers = ['Date', 'Time', 'VRM', 'Driver', 'Mileage', 'Fuel Type', 'Litres', 'Location'];
    
    // CSV rows
    const rows = fuelEntries.map((entry: any) => {
      const date = new Date(entry.createdAt);
      return [
        date.toLocaleDateString('en-GB'),
        date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        getVehicleVrm(entry.vehicleId),
        getDriverName(entry.driverId),
        entry.odometer || '',
        entry.fuelType,
        entry.litres || '',
        entry.location || ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
    });

    // Combine header and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fuel-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ManagerLayout>
      <div className="space-y-6 titan-page-enter">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Fuel Log</h1>
            <p className="text-slate-500 mt-0.5">Diesel and AdBlue fill-ups (last 30 days)</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { console.log('Filter clicked!'); setShowFilters(!showFilters); }}
              className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`} 
              data-testid="button-fuel-filters"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {fuelTypeFilter !== "ALL" && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">1</span>
              )}
            </button>
            <button 
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors" 
              data-testid="button-fuel-export"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Fuel Type:</span>
              <select
                value={fuelTypeFilter}
                onChange={(e) => setFuelTypeFilter(e.target.value)}
                className="h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                data-testid="select-fuel-type-filter"
              >
                <option value="ALL">All Types</option>
                <option value="DIESEL">Diesel</option>
                <option value="ADBLUE">AdBlue</option>
              </select>
            </div>
            {fuelTypeFilter !== "ALL" && (
              <button
                onClick={() => setFuelTypeFilter("ALL")}
                className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Fuel className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Diesel</p>
                <p className="text-2xl font-bold text-slate-900">{totalDiesel.toLocaleString()}L</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total AdBlue</p>
                <p className="text-2xl font-bold text-slate-900">{totalAdBlue.toLocaleString()}L</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="table-fuel-log">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date/Time</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">VRM</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Driver</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mileage</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Litres</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-4"><div className="h-4 w-32 bg-slate-100 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-100 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-16 bg-slate-100 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-12 bg-slate-100 rounded animate-pulse" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></td>
                    </tr>
                  ))
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Fuel className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">{fuelTypeFilter !== "ALL" ? "No entries match filter" : "No fuel entries found"}</p>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {new Date(entry.createdAt).toLocaleDateString('en-GB', { 
                                day: '2-digit', 
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(entry.createdAt).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); if (entry.vehicleId) setSelectedVehicleId(entry.vehicleId); }}
                          className="font-mono font-semibold text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0"
                        >
                          {getVehicleVrm(entry.vehicleId)}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {getDriverName(entry.driverId)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm text-slate-900">
                          {entry.odometer?.toLocaleString() || '-'} mi
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {entry.fuelType === 'DIESEL' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                            <Fuel className="h-3 w-3" />
                            Diesel
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            <Droplets className="h-3 w-3" />
                            AdBlue
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-900">
                          {entry.litres ? `${entry.litres}L` : '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {entry.location ? (
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {entry.location}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedVehicleId && (
        <VehicleDetailModal vehicleId={selectedVehicleId} onClose={() => setSelectedVehicleId(null)} />
      )}
    </ManagerLayout>
  );
}
