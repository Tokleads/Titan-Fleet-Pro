import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanButton } from "@/components/titan-ui/Button";
import { session } from "@/lib/session";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  Wrench,
  Filter,
  Truck
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700 border-red-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
  RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DEFERRED: "bg-slate-100 text-slate-600 border-slate-200",
};

const severityColors: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export default function ManagerDefects() {
  const company = session.getCompany();
  const companyId = company?.id;
  const queryClient = useQueryClient();

  const { data: defects, isLoading } = useQuery({
    queryKey: ["manager-defects", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/defects/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch defects");
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

  const updateDefectMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/manager/defects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update defect");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-defects"] });
    },
  });

  const getVehicleVrm = (vehicleId: number | null) => {
    if (!vehicleId) return "N/A";
    const vehicle = vehicles?.find((v: any) => v.id === vehicleId);
    return vehicle?.vrm || "Unknown";
  };

  const openDefects = defects?.filter((d: any) => d.status === 'OPEN') || [];
  const inProgressDefects = defects?.filter((d: any) => d.status === 'IN_PROGRESS') || [];
  const resolvedDefects = defects?.filter((d: any) => d.status === 'RESOLVED') || [];

  const DefectCard = ({ defect }: { defect: any }) => (
    <TitanCard className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-slate-400" />
          <span className="font-mono font-semibold text-sm">{getVehicleVrm(defect.vehicleId)}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColors[defect.severity] || severityColors.MEDIUM}`}>
          {defect.severity}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-900 mb-2">{defect.category}</p>
      <p className="text-sm text-slate-600 line-clamp-2">{defect.description}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          {new Date(defect.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </div>
        {defect.assignedTo && (
          <span className="text-xs text-slate-500">{defect.assignedTo}</span>
        )}
      </div>
    </TitanCard>
  );

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Defects</h1>
            <p className="text-slate-500 mt-1">Track and manage reported vehicle defects</p>
          </div>
          <TitanButton variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </TitanButton>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((col) => (
              <div key={col} className="space-y-4">
                <Skeleton className="h-6 w-32" />
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ))}
          </div>
        ) : defects?.length === 0 ? (
          <TitanCard className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No defects reported</h3>
            <p className="text-slate-500 mt-1">All vehicles are in good condition</p>
          </TitanCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Open Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h2 className="font-semibold text-slate-900">Open</h2>
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {openDefects.length}
                </span>
              </div>
              <div className="space-y-3">
                {openDefects.map((defect: any) => (
                  <DefectCard key={defect.id} defect={defect} />
                ))}
                {openDefects.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No open defects</p>
                )}
              </div>
            </div>

            {/* In Progress Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="h-5 w-5 text-amber-500" />
                <h2 className="font-semibold text-slate-900">In Progress</h2>
                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {inProgressDefects.length}
                </span>
              </div>
              <div className="space-y-3">
                {inProgressDefects.map((defect: any) => (
                  <DefectCard key={defect.id} defect={defect} />
                ))}
                {inProgressDefects.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No defects in progress</p>
                )}
              </div>
            </div>

            {/* Resolved Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h2 className="font-semibold text-slate-900">Resolved</h2>
                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {resolvedDefects.length}
                </span>
              </div>
              <div className="space-y-3">
                {resolvedDefects.slice(0, 5).map((defect: any) => (
                  <DefectCard key={defect.id} defect={defect} />
                ))}
                {resolvedDefects.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No resolved defects</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
