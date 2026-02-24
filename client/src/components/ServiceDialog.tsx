import { useState } from "react";
import { X, Wrench, Calendar, Gauge, DollarSign } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ServiceDialogProps {
  vehicle: any;
  onClose: () => void;
}

const SERVICE_TYPES = [
  "Annual Service",
  "Interim Service",
  "Major Service",
  "Oil Change",
  "Brake Service",
  "Tyre Replacement",
  "MOT Preparation",
  "Transmission Service",
  "Coolant System Service",
  "Air Filter Replacement",
  "Fuel Filter Replacement",
  "Spark Plug Replacement",
  "Battery Replacement",
  "Suspension Service",
  "Exhaust Repair",
  "Other"
];

export function ServiceDialog({ vehicle, onClose }: ServiceDialogProps) {
  const queryClient = useQueryClient();
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceMileage, setServiceMileage] = useState(vehicle.currentMileage || 0);
  const [serviceType, setServiceType] = useState("Annual Service");
  const [serviceProvider, setServiceProvider] = useState("");
  const [cost, setCost] = useState("");
  const [workPerformed, setWorkPerformed] = useState("");

  const logServiceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/manager/vehicles/${vehicle.id}/service`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          serviceDate,
          serviceMileage: Number(serviceMileage),
          serviceType,
          serviceProvider,
          cost: cost ? Math.round(parseFloat(cost) * 100) : undefined, // Convert to pence
          workPerformed,
          performedBy: 1 // TODO: Get from session
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to log service");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['service-history', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['service-due'] });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logServiceMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Log Service</h2>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Service Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Service Date
              </div>
            </label>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Service Mileage */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Service Mileage
              </div>
            </label>
            <input
              type="number"
              value={serviceMileage}
              onChange={(e) => setServiceMileage(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 45000"
              required
              min="0"
            />
            {vehicle.currentMileage && (
              <p className="text-xs text-slate-500 mt-1">Current mileage: {vehicle.currentMileage.toLocaleString()} miles</p>
            )}
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Service Type
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Service Provider */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Service Provider (Optional)
            </label>
            <input
              type="text"
              value={serviceProvider}
              onChange={(e) => setServiceProvider(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., ABC Motors"
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cost (Optional)
              </div>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">£</span>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Work Performed */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Work Performed (Optional)
            </label>
            <textarea
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe the work performed..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={logServiceMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={logServiceMutation.isPending}
            >
              {logServiceMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4" />
                  Log Service
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {logServiceMutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                {logServiceMutation.error instanceof Error ? logServiceMutation.error.message : "Failed to log service"}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
