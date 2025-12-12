import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanButton } from "@/components/titan-ui/Button";
import { session } from "@/lib/session";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Download,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManagerInspections() {
  const company = session.getCompany();
  const companyId = company?.id;
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data: inspections, isLoading } = useQuery({
    queryKey: ["manager-inspections", companyId, page],
    queryFn: async () => {
      const res = await fetch(`/api/manager/inspections/${companyId}?limit=${pageSize}&offset=${page * pageSize}`);
      if (!res.ok) throw new Error("Failed to fetch inspections");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
    enabled: !!companyId,
  });

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

  const getVehicleName = (vehicleId: number) => {
    const vehicle = vehicles?.find((v: any) => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model}` : "";
  };

  const getDriverName = (driverId: number) => {
    const user = users?.find((u: any) => u.id === driverId);
    return user?.name || "Unknown";
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inspections</h1>
            <p className="text-slate-500 mt-1">All vehicle inspection records</p>
          </div>
          <div className="flex items-center gap-3">
            <TitanButton variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </TitanButton>
            <TitanButton variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </TitanButton>
          </div>
        </div>

        <TitanCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="table-inspections">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date/Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Driver</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mileage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Result</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-16" /></td>
                    </tr>
                  ))
                ) : inspections?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      No inspections found
                    </td>
                  </tr>
                ) : (
                  inspections?.map((inspection: any) => (
                    <tr key={inspection.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
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
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold text-sm text-slate-900">
                          {getVehicleVrm(inspection.vehicleId)}
                        </p>
                        <p className="text-xs text-slate-500">{getVehicleName(inspection.vehicleId)}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {getDriverName(inspection.driverId)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{inspection.type.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-slate-900">
                          {inspection.odometer?.toLocaleString()} mi
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {inspection.status === 'PASS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <XCircle className="h-3 w-3" />
                            Defects
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TitanButton variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </TitanButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, inspections?.length || 0)} results
            </p>
            <div className="flex items-center gap-2">
              <TitanButton 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </TitanButton>
              <span className="text-sm text-slate-600">Page {page + 1}</span>
              <TitanButton 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => p + 1)}
                disabled={(inspections?.length || 0) < pageSize}
              >
                <ChevronRight className="h-4 w-4" />
              </TitanButton>
            </div>
          </div>
        </TitanCard>
      </div>
    </ManagerLayout>
  );
}
