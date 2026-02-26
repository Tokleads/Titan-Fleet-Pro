import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface VORDialogProps {
  vehicle: any;
  onClose: () => void;
}

const VOR_REASONS = [
  "Awaiting Maintenance",
  "Awaiting Parts",
  "In Workshop",
  "Accident Damage",
  "Failed Inspection",
  "MOT Failure",
  "Insurance Claim",
  "Mechanical Breakdown",
  "Electrical Fault",
  "Bodywork Repair",
  "Tyre Replacement",
  "Brake Repair",
  "Engine Repair",
  "Transmission Issues",
  "Other"
];

export function VORDialog({ vehicle, onClose }: VORDialogProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const setVORMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/manager/vehicles/${vehicle.id}/vor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ reason, notes })
      });
      if (!res.ok) throw new Error('Failed to set VOR status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vor-vehicles'] });
      onClose();
    }
  });

  const resolveVORMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/manager/vehicles/${vehicle.id}/vor/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() }
      });
      if (!res.ok) throw new Error('Failed to resolve VOR status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vor-vehicles'] });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vehicle.vorStatus) {
      resolveVORMutation.mutate();
    } else {
      if (!reason) return;
      setVORMutation.mutate();
    }
  };

  const isVOR = vehicle.vorStatus;
  const vorDuration = isVOR && vehicle.vorStartDate 
    ? Math.floor((Date.now() - new Date(vehicle.vorStartDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            {isVOR ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                {isVOR ? 'Return to Service' : 'Set Vehicle Off Road'}
              </h2>
              <p className="text-sm text-slate-400">{vehicle.vrm}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isVOR ? (
            /* Return to Service View */
            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-amber-400 font-medium">Off Road</span>
                </div>
                {vehicle.vorStartDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">VOR Since:</span>
                    <span className="text-slate-300">
                      {new Date(vehicle.vorStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                      {new Date(vehicle.vorStartDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Duration:</span>
                  <span className="text-slate-300">{vorDuration} day{vorDuration !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Reason:</span>
                  <span className="text-slate-300">{vehicle.vorReason}</span>
                </div>
                {vehicle.vorNotes && (
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Notes:</p>
                    <p className="text-sm text-slate-300">{vehicle.vorNotes}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  This vehicle will be returned to active service and will appear in driver vehicle searches.
                </p>
              </div>
            </div>
          ) : (
            /* Set VOR View */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason for VOR <span className="text-red-400">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a reason...</option>
                  {VOR_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Enter any additional details..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-sm text-amber-300">
                  This vehicle will be removed from active service and will not appear in driver vehicle searches.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={setVORMutation.isPending || resolveVORMutation.isPending || (!isVOR && !reason)}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                isVOR
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {(setVORMutation.isPending || resolveVORMutation.isPending) ? (
                'Processing...'
              ) : isVOR ? (
                'Return to Service'
              ) : (
                'Set Off Road'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
