import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanButton } from "@/components/titan-ui/Button";
import { session } from "@/lib/session";
import { 
  Truck,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  Search,
  MoreVertical
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManagerFleet() {
  const company = session.getCompany();
  const companyId = company?.id;
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: trailers } = useQuery({
    queryKey: ["trailers", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/trailers/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch trailers");
      return res.json();
    },
    enabled: !!companyId,
  });

  const filteredVehicles = vehicles?.filter((v: any) => 
    v.vrm.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const isMotDueSoon = (motDue: string | null) => {
    if (!motDue) return false;
    const dueDate = new Date(motDue);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return dueDate < thirtyDaysFromNow;
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Fleet</h1>
            <p className="text-slate-500 mt-1">Manage vehicles and trailers</p>
          </div>
          <TitanButton size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </TitanButton>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by VRM, make, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            data-testid="input-vehicle-search"
          />
        </div>

        {/* Vehicles Grid */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Vehicles ({filteredVehicles.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))
            ) : filteredVehicles.length === 0 ? (
              <TitanCard className="col-span-full p-8 text-center">
                <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No vehicles found</p>
              </TitanCard>
            ) : (
              filteredVehicles.map((vehicle: any) => (
                <TitanCard key={vehicle.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Truck className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-slate-900">{vehicle.vrm}</p>
                        <p className="text-xs text-slate-500">{vehicle.fleetNumber}</p>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-slate-100 rounded">
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-3">{vehicle.make} {vehicle.model}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      {vehicle.active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                    {vehicle.motDue && (
                      <div className={`flex items-center gap-1 text-xs ${isMotDueSoon(vehicle.motDue) ? 'text-amber-600' : 'text-slate-500'}`}>
                        <Calendar className="h-3 w-3" />
                        MOT: {new Date(vehicle.motDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </div>
                </TitanCard>
              ))
            )}
          </div>
        </div>

        {/* Trailers Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Trailers ({trailers?.length || 0})</h2>
            <TitanButton variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Trailer
            </TitanButton>
          </div>
          {trailers?.length === 0 ? (
            <TitanCard className="p-8 text-center border-2 border-dashed">
              <p className="text-slate-500">No trailers registered yet</p>
              <TitanButton variant="outline" size="sm" className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Add your first trailer
              </TitanButton>
            </TitanCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {trailers?.map((trailer: any) => (
                <TitanCard key={trailer.id} className="p-4">
                  <p className="font-mono font-bold text-slate-900">{trailer.trailerId}</p>
                  <p className="text-sm text-slate-600">{trailer.type}</p>
                  {trailer.make && <p className="text-xs text-slate-400">{trailer.make} {trailer.model}</p>}
                </TitanCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}
