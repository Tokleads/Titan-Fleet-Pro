import { useQuery } from "@tanstack/react-query";
import { Wrench, Calendar, Gauge, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ServiceDueWidgetProps {
  companyId: number;
}

export function ServiceDueWidget({ companyId }: ServiceDueWidgetProps) {
  const [, navigate] = useLocation();

  const { data: serviceDueVehicles, isLoading } = useQuery({
    queryKey: ['service-due', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/service-due?companyId=${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch service due vehicles");
      return res.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const calculateDaysUntilService = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateMilesUntilService = (vehicle: any) => {
    if (!vehicle.nextServiceMileage || !vehicle.currentMileage) return null;
    return vehicle.nextServiceMileage - vehicle.currentMileage;
  };

  const getUrgencyColor = (daysUntil: number | null, milesUntil: number | null) => {
    if (daysUntil !== null && daysUntil < 0) return "text-red-600 bg-red-50";
    if (milesUntil !== null && milesUntil < 0) return "text-red-600 bg-red-50";
    if (daysUntil !== null && daysUntil <= 7) return "text-amber-600 bg-amber-50";
    if (milesUntil !== null && milesUntil <= 200) return "text-amber-600 bg-amber-50";
    return "text-blue-600 bg-blue-50";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Wrench className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Service Due</h3>
            <p className="text-sm text-slate-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const vehicleCount = serviceDueVehicles?.length || 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Wrench className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Service Due</h3>
            <p className="text-sm text-slate-500">
              {vehicleCount} {vehicleCount === 1 ? 'vehicle' : 'vehicles'} due soon
            </p>
          </div>
        </div>
        {vehicleCount > 0 && (
          <button
            onClick={() => navigate("/manager/fleet")}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        )}
      </div>

      {/* Vehicle List */}
      {vehicleCount > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {serviceDueVehicles.map((vehicle: any) => {
            const daysUntil = calculateDaysUntilService(vehicle.nextServiceDue);
            const milesUntil = calculateMilesUntilService(vehicle);
            const urgencyColor = getUrgencyColor(daysUntil, milesUntil);

            return (
              <div
                key={vehicle.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer hover:border-blue-300 ${urgencyColor}`}
                onClick={() => navigate("/manager/fleet")}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-slate-900">{vehicle.vrm}</div>
                    <div className="text-sm text-slate-600">
                      {vehicle.make} {vehicle.model}
                    </div>
                  </div>
                  {(daysUntil !== null && daysUntil < 0) || (milesUntil !== null && milesUntil < 0) ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : null}
                </div>

                <div className="space-y-1">
                  {daysUntil !== null && (
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {daysUntil < 0 ? (
                          <span className="font-medium">Overdue by {Math.abs(daysUntil)} days</span>
                        ) : daysUntil === 0 ? (
                          <span className="font-medium">Due today</span>
                        ) : (
                          <span>Due in {daysUntil} days</span>
                        )}
                      </span>
                    </div>
                  )}
                  {milesUntil !== null && (
                    <div className="flex items-center gap-2 text-xs">
                      <Gauge className="h-3.5 w-3.5" />
                      <span>
                        {milesUntil < 0 ? (
                          <span className="font-medium">Overdue by {Math.abs(milesUntil).toLocaleString()} miles</span>
                        ) : (
                          <span>{milesUntil.toLocaleString()} miles remaining</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No services due</p>
          <p className="text-slate-400 text-xs mt-1">All vehicles are up to date</p>
        </div>
      )}
    </div>
  );
}
