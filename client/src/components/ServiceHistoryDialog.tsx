import { X, Wrench, Calendar, Gauge, DollarSign, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ServiceHistoryDialogProps {
  vehicle: any;
  onClose: () => void;
}

export function ServiceHistoryDialog({ vehicle, onClose }: ServiceHistoryDialogProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['service-history', vehicle.id],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/${vehicle.id}/service-history`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch service history");
      return res.json();
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Service History</h2>
              <p className="text-sm text-slate-500">{vehicle.vrm} - {vehicle.make} {vehicle.model}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-4">
              {history.map((service: any) => (
                <div
                  key={service.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{service.serviceType}</h3>
                      {service.serviceProvider && (
                        <p className="text-sm text-slate-500">{service.serviceProvider}</p>
                      )}
                    </div>
                    {service.cost && (
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <DollarSign className="h-4 w-4" />
                        £{(service.cost / 100).toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      {new Date(service.serviceDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Gauge className="h-4 w-4" />
                      {service.serviceMileage.toLocaleString()} miles
                    </div>
                  </div>

                  {service.workPerformed && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-sm text-slate-600">{service.workPerformed}</p>
                    </div>
                  )}

                  {(service.nextServiceDue || service.nextServiceMileage) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
                      {service.nextServiceDue && (
                        <div>
                          Next service due:{" "}
                          {new Date(service.nextServiceDue).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                      {service.nextServiceMileage && (
                        <div>
                          or {service.nextServiceMileage.toLocaleString()} miles
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No service history recorded</p>
              <p className="text-sm text-slate-400 mt-1">Services will appear here once logged</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
