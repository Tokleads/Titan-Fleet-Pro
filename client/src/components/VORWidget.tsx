import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface VORWidgetProps {
  companyId: number;
}

export function VORWidget({ companyId }: VORWidgetProps) {
  const { data: vorVehicles, isLoading } = useQuery({
    queryKey: ['vor-vehicles', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/vor?companyId=${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch VOR vehicles');
      return res.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const vorCount = vorVehicles?.length || 0;

  // Calculate average VOR duration
  const avgDuration = vorVehicles?.length > 0
    ? Math.floor(
        vorVehicles.reduce((sum: number, v: any) => {
          const days = Math.floor((Date.now() - new Date(v.vorStartDate).getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / vorVehicles.length
      )
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Vehicles Off Road
        </h2>
        <Link href="/manager/fleet" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : vorCount === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-slate-900">All Vehicles Operational</p>
          <p className="text-xs text-slate-500 mt-1">No vehicles are currently off road</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div>
              <p className="text-xs text-amber-700 font-medium">Off Road</p>
              <p className="text-2xl font-bold text-amber-900">{vorCount}</p>
            </div>
            <div>
              <p className="text-xs text-amber-700 font-medium">Avg Duration</p>
              <p className="text-2xl font-bold text-amber-900">{avgDuration}d</p>
            </div>
          </div>

          {/* VOR Vehicle List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {vorVehicles.map((vehicle: any) => {
              const daysOffRoad = Math.floor((Date.now() - new Date(vehicle.vorStartDate).getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div
                  key={vehicle.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-mono font-semibold text-sm text-slate-900">{vehicle.vrm}</p>
                        <span className="text-xs text-slate-500">•</span>
                        <p className="text-xs text-slate-600">{vehicle.make} {vehicle.model}</p>
                      </div>
                      <p className="text-xs text-amber-700 font-medium mb-1">{vehicle.vorReason}</p>
                      {vehicle.vorNotes && (
                        <p className="text-xs text-slate-500 line-clamp-1">{vehicle.vorNotes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 ml-3">
                      <Clock className="h-3 w-3" />
                      <span>{daysOffRoad}d</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {vorCount > 3 && (
            <Link href="/manager/fleet" className="block mt-3 text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all {vorCount} off-road vehicles →
            </Link>
          )}
        </>
      )}
    </div>
  );
}
