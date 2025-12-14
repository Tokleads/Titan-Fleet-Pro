import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { 
  Truck,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  Search,
  MoreVertical,
  AlertTriangle,
  ArrowUpRight,
  Pencil,
  Power,
  Trash2
} from "lucide-react";

interface LicenseInfo {
  tier: string;
  tierDisplay: string;
  activeVehicleCount: number;
  allowance: number;
  graceOverage: number;
  softLimit: number;
  hardLimit: number;
  state: 'ok' | 'at_limit' | 'in_grace' | 'over_hard_limit';
  remainingToSoft: number;
  remainingToHard: number;
  percentUsed: number;
}

export default function ManagerFleet() {
  const company = session.getCompany();
  const companyId = company?.id;
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<any | null>(null);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Close dropdown when clicking outside - uses pointerdown on capture phase
  useEffect(() => {
    if (openMenuId === null) return;
    
    function handleClickOutside(event: PointerEvent) {
      const target = event.target as HTMLElement;
      // Check if click is inside the menu container
      if (!target.closest(`[data-menu-id="${openMenuId}"]`)) {
        setOpenMenuId(null);
      }
    }
    
    // Use pointerdown on capture phase and add immediately
    // The opening click has already happened by the time this effect runs
    document.addEventListener('pointerdown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [openMenuId]);

  // Toggle vehicle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await fetch(`/api/manager/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error('Failed to update vehicle');
      // Handle 204 No Content or JSON response
      if (res.status === 204) return null;
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', companyId] });
      setOpenMenuId(null);
    },
  });

  const { data: license } = useQuery<LicenseInfo>({
    queryKey: ["license", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/company/license/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch license info");
      return res.json();
    },
    enabled: !!companyId,
  });

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

  const isMotOverdue = (motDue: string | null) => {
    if (!motDue) return false;
    return new Date(motDue) < new Date();
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Fleet</h1>
            <p className="text-slate-500 mt-0.5">Manage vehicles and trailers</p>
          </div>
          <button 
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm ${
              license?.state === 'over_hard_limit' 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={license?.state === 'over_hard_limit'}
            data-testid="button-add-vehicle"
          >
            <Plus className="h-4 w-4" />
            Add Vehicle
          </button>
        </div>

        {/* License Warning Banners */}
        {license?.state === 'over_hard_limit' && (
          <div className="flex items-center justify-between gap-4 p-4 bg-red-50 border border-red-100 rounded-xl" data-testid="banner-over-limit">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Vehicle capacity exceeded</p>
                <p className="text-sm text-red-600 mt-0.5">You can't add more vehicles until you upgrade your license.</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/manager/license')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex-shrink-0"
              data-testid="button-request-upgrade-fleet"
            >
              Request upgrade
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {(license?.state === 'at_limit' || license?.state === 'in_grace') && (
          <div className="flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl" data-testid="banner-grace-warning">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {license?.state === 'at_limit' 
                    ? "You've reached your vehicle allowance" 
                    : `Grace active: ${(license?.activeVehicleCount || 0) - (license?.allowance || 0)} of ${license?.graceOverage || 0} grace vehicles used`
                  }
                </p>
                <p className="text-sm text-amber-600 mt-0.5">
                  You have {license?.remainingToHard || 0} slot{(license?.remainingToHard || 0) !== 1 ? 's' : ''} remaining before adding vehicles is blocked.
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/manager/license')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
              data-testid="button-view-license-fleet"
            >
              View license
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by VRM, make, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            data-testid="input-vehicle-search"
          />
        </div>

        {/* Vehicles Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Vehicles</h2>
            <span className="text-sm text-slate-500">{filteredVehicles.length} vehicles</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
              ))
            ) : filteredVehicles.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
                <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No vehicles found</p>
              </div>
            ) : (
              filteredVehicles.map((vehicle: any) => (
                <div 
                  key={vehicle.id} 
                  className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <Truck className="h-5 w-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-slate-900">{vehicle.vrm}</p>
                        <p className="text-xs text-slate-500">{vehicle.fleetNumber || 'No fleet #'}</p>
                      </div>
                    </div>
                    <div className="relative" data-menu-id={vehicle.id}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id);
                        }}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-opacity" 
                        data-testid={`button-vehicle-menu-${vehicle.id}`}
                      >
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </button>
                      
                      {openMenuId === vehicle.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1 overflow-hidden">
                          <button
                            onClick={() => {
                              setEditingVehicle(vehicle);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            data-testid={`button-edit-vehicle-${vehicle.id}`}
                          >
                            <Pencil className="h-4 w-4 text-slate-400" />
                            Edit vehicle
                          </button>
                          <button
                            onClick={() => toggleActiveMutation.mutate({ id: vehicle.id, active: !vehicle.active })}
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            data-testid={`button-toggle-vehicle-${vehicle.id}`}
                          >
                            <Power className="h-4 w-4 text-slate-400" />
                            {vehicle.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => {
                              setDeletingVehicle(vehicle);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            data-testid={`button-delete-vehicle-${vehicle.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete vehicle
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-4">{vehicle.make} {vehicle.model}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {vehicle.active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <XCircle className="h-3.5 w-3.5" />
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    {vehicle.motDue && (
                      <div className="flex items-center gap-1.5">
                        {isMotOverdue(vehicle.motDue) ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            MOT Overdue
                          </span>
                        ) : isMotDueSoon(vehicle.motDue) ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <Calendar className="h-3.5 w-3.5" />
                            MOT Due
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(vehicle.motDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trailers */}
        {trailers && trailers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Trailers</h2>
              <span className="text-sm text-slate-500">{trailers.length} trailers</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {trailers.map((trailer: any) => (
                <div 
                  key={trailer.id} 
                  className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-11 w-11 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Truck className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-slate-900">{trailer.registration}</p>
                      <p className="text-xs text-slate-500">{trailer.type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Vehicle Modal */}
        {editingVehicle && (
          <EditVehicleModal
            vehicle={editingVehicle}
            companyId={companyId}
            onClose={() => setEditingVehicle(null)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deletingVehicle && (
          <DeleteVehicleModal
            vehicle={deletingVehicle}
            companyId={companyId}
            onClose={() => setDeletingVehicle(null)}
          />
        )}
      </div>
    </ManagerLayout>
  );
}

function EditVehicleModal({ 
  vehicle, 
  companyId,
  onClose 
}: { 
  vehicle: any; 
  companyId: number | undefined;
  onClose: () => void; 
}) {
  const [vrm, setVrm] = useState(vehicle.vrm);
  const [make, setMake] = useState(vehicle.make);
  const [model, setModel] = useState(vehicle.model);
  const [fleetNumber, setFleetNumber] = useState(vehicle.fleetNumber || '');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: { vrm: string; make: string; model: string; fleetNumber: string | null }) => {
      const res = await fetch(`/api/manager/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to update vehicle' }));
        throw new Error(errData.message || 'Failed to update vehicle');
      }
      // Handle 204 No Content
      if (res.status === 204) return null;
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', companyId] });
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    updateMutation.mutate({ vrm, make, model, fleetNumber: fleetNumber || null });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Edit Vehicle</h2>
          <p className="text-sm text-slate-500">Update vehicle details</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Registration (VRM)</label>
            <input
              type="text"
              value={vrm}
              onChange={(e) => setVrm(e.target.value.toUpperCase())}
              className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
              data-testid="input-edit-vrm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Make</label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
                data-testid="input-edit-make"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
                data-testid="input-edit-model"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fleet Number</label>
            <input
              type="text"
              value={fleetNumber}
              onChange={(e) => setFleetNumber(e.target.value)}
              placeholder="Optional"
              className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              data-testid="input-edit-fleet-number"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="flex-1 h-11 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              data-testid="button-cancel-edit"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 h-11 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              data-testid="button-save-vehicle"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteVehicleModal({ 
  vehicle, 
  companyId,
  onClose 
}: { 
  vehicle: any; 
  companyId: number | undefined;
  onClose: () => void; 
}) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/manager/vehicles/${vehicle.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to delete vehicle' }));
        throw new Error(errData.message || 'Failed to delete vehicle');
      }
      // Handle 204 No Content
      if (res.status === 204) return null;
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', companyId] });
      queryClient.invalidateQueries({ queryKey: ['license', companyId] });
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Delete Vehicle</h2>
              <p className="text-sm text-slate-500">This action cannot be undone</p>
            </div>
          </div>
          
          <p className="text-sm text-slate-600 mb-4">
            Are you sure you want to delete <span className="font-mono font-semibold">{vehicle.vrm}</span>? 
            All associated inspection and fuel records will remain in the system.
          </p>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 mb-4">
              {error}
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={deleteMutation.isPending}
              className="flex-1 h-11 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              data-testid="button-cancel-delete"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex-1 h-11 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
