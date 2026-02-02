import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { VORDialog } from "@/components/VORDialog";
import { ServiceDialog } from "@/components/ServiceDialog";
import { ServiceHistoryDialog } from "@/components/ServiceHistoryDialog";
import { MultiCountdownBadge } from "@/components/CountdownBadge";
import { Pagination } from "@/components/Pagination";
import { useFleetVehicles, useCreateVehicle, useToggleVehicleActive } from "@/hooks/useFleetVehicles";
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
  Trash2,
  Wrench,
  FileText
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
  const [vorVehicle, setVorVehicle] = useState<any | null>(null);
  const [serviceVehicle, setServiceVehicle] = useState<any | null>(null);
  const [serviceHistoryVehicle, setServiceHistoryVehicle] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({ vrm: '', make: '', model: '', fleetNumber: '', vehicleCategory: 'HGV', motDue: '' });
  const [addError, setAddError] = useState<string | null>(null);
  const [motLookupResult, setMotLookupResult] = useState<{ motDue?: string; status?: string; error?: string } | null>(null);
  const [isLookingUpMot, setIsLookingUpMot] = useState(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const offset = (currentPage - 1) * itemsPerPage;

  // Fetch vehicles with pagination
  const { data: vehiclesData, isLoading } = useFleetVehicles({
    companyId,
    limit: itemsPerPage,
    offset,
  });

  const vehicles = vehiclesData?.vehicles || [];
  const totalVehicles = vehiclesData?.total || 0;
  const totalPages = Math.ceil(totalVehicles / itemsPerPage);

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

  // MOT lookup function
  const lookupMot = async () => {
    if (!addFormData.vrm || addFormData.vrm.length < 5) return;
    setIsLookingUpMot(true);
    setMotLookupResult(null);
    try {
      const res = await fetch(`/api/dvsa/mot/${addFormData.vrm.replace(/\s/g, '')}`);
      const data = await res.json();
      if (res.ok && data.motDue) {
        setMotLookupResult({ motDue: data.motDue, status: data.status });
        setAddFormData(d => ({ ...d, motDue: data.motDue }));
      } else {
        setMotLookupResult({ error: data.error || 'Vehicle not found in DVSA database' });
      }
    } catch (err) {
      setMotLookupResult({ error: 'Failed to lookup MOT status' });
    } finally {
      setIsLookingUpMot(false);
    }
  };

  // Create vehicle mutation
  const createVehicleMutation = useCreateVehicle();

  const handleCreateVehicle = () => {
    if (!companyId) return;
    createVehicleMutation.mutate(
      {
        companyId,
        vrm: addFormData.vrm.toUpperCase().replace(/\s/g, ''),
        make: addFormData.make,
        model: addFormData.model,
        fleetNumber: addFormData.fleetNumber || null,
        vehicleCategory: addFormData.vehicleCategory,
        motDue: addFormData.motDue || null,
        active: true,
      },
      {
        onSuccess: () => {
          setShowAddForm(false);
          setAddFormData({ vrm: '', make: '', model: '', fleetNumber: '', vehicleCategory: 'HGV', motDue: '' });
          setAddError(null);
          setMotLookupResult(null);
        },
        onError: (error: Error) => {
          setAddError(error.message);
        },
      }
    );
  };

  // Toggle vehicle active status
  const toggleActiveMutation = useToggleVehicleActive();

  const handleToggleActive = (id: number, active: boolean) => {
    if (!companyId) return;
    toggleActiveMutation.mutate(
      { id, active, companyId },
      {
        onSuccess: () => {
          setOpenMenuId(null);
        },
      }
    );
  };

  const { data: license } = useQuery<LicenseInfo>({
    queryKey: ["license", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/company/license/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch license info");
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

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
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
            onClick={() => { setShowAddForm(true); setAddError(null); }}
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

        {/* Add Vehicle Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4" data-testid="panel-add-vehicle">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Add New Vehicle</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Registration (VRM) *</label>
                <input
                  type="text"
                  value={addFormData.vrm}
                  onChange={(e) => setAddFormData(d => ({ ...d, vrm: e.target.value.toUpperCase() }))}
                  placeholder="e.g. AB12 CDE"
                  className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  data-testid="input-add-vrm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Make *</label>
                <input
                  type="text"
                  value={addFormData.make}
                  onChange={(e) => setAddFormData(d => ({ ...d, make: e.target.value }))}
                  placeholder="e.g. DAF"
                  className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  data-testid="input-add-make"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Model *</label>
                <input
                  type="text"
                  value={addFormData.model}
                  onChange={(e) => setAddFormData(d => ({ ...d, model: e.target.value }))}
                  placeholder="e.g. XF 530"
                  className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  data-testid="input-add-model"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Fleet Number</label>
                <input
                  type="text"
                  value={addFormData.fleetNumber}
                  onChange={(e) => setAddFormData(d => ({ ...d, fleetNumber: e.target.value }))}
                  placeholder="e.g. F016"
                  className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  data-testid="input-add-fleet-number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                <select
                  value={addFormData.vehicleCategory}
                  onChange={(e) => setAddFormData(d => ({ ...d, vehicleCategory: e.target.value }))}
                  className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  data-testid="select-add-category"
                >
                  <option value="HGV">HGV (10 min check)</option>
                  <option value="LGV">LGV (5 min check)</option>
                </select>
              </div>
            </div>
            {addError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{addError}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                data-testid="button-cancel-add"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVehicle}
                disabled={!addFormData.vrm || !addFormData.make || !addFormData.model || createVehicleMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                data-testid="button-submit-add"
              >
                {createVehicleMutation.isPending ? 'Adding...' : 'Add Vehicle'}
              </button>
            </div>
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
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                  <div className="h-5 bg-slate-200 rounded w-24 mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-28"></div>
                </div>
              ))
            ) : filteredVehicles.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No vehicles found</p>
              </div>
            ) : (
              filteredVehicles.map((vehicle: any) => (
                <div 
                  key={vehicle.id} 
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow relative group"
                  data-testid={`vehicle-card-${vehicle.id}`}
                >
                  {/* Vehicle Card Content - keeping existing implementation */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-lg">{vehicle.vrm}</h3>
                        {vehicle.vor && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                            VOR
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{vehicle.make} {vehicle.model}</p>
                      {vehicle.fleetNumber && (
                        <p className="text-xs text-slate-500 mt-1">Fleet #{vehicle.fleetNumber}</p>
                      )}
                    </div>
                    
                    {/* Actions Menu */}
                    <div className="relative" data-menu-id={vehicle.id}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        data-testid={`button-vehicle-menu-${vehicle.id}`}
                      >
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </button>
                      
                      {openMenuId === vehicle.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                          <button
                            onClick={() => {
                              navigate(`/manager/vehicle/${vehicle.id}`);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              setEditingVehicle(vehicle);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setServiceVehicle(vehicle);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Wrench className="h-4 w-4" />
                            Log Service
                          </button>
                          <button
                            onClick={() => {
                              setVorVehicle(vehicle);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            {vehicle.vor ? 'Resolve VOR' : 'Mark as VOR'}
                          </button>
                          <button
                            onClick={() => handleToggleActive(vehicle.id, !vehicle.active)}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Power className="h-4 w-4" />
                            {vehicle.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => {
                              setDeletingVehicle(vehicle);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Countdown Badges */}
                  <MultiCountdownBadge
                    motDue={vehicle.motDue}
                    taxDue={vehicle.taxDue}
                    serviceDue={vehicle.serviceDue}
                  />

                  {/* MOT Status */}
                  {vehicle.motDue && (
                    <div className={`mt-3 flex items-center gap-2 text-sm ${
                      isMotOverdue(vehicle.motDue) ? 'text-red-600' :
                      isMotDueSoon(vehicle.motDue) ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {isMotOverdue(vehicle.motDue) ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <span className="text-xs">
                        MOT {isMotOverdue(vehicle.motDue) ? 'expired' : 'due'} {new Date(vehicle.motDue).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {!isLoading && filteredVehicles.length > 0 && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalVehicles}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          )}
        </div>

        {/* Trailers Section - keeping existing implementation */}
        {trailers && trailers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Trailers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {trailers.map((trailer: any) => (
                <div key={trailer.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{trailer.registration}</h3>
                  <p className="text-sm text-slate-600">{trailer.type}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {vorVehicle && (
        <VORDialog
          vehicle={vorVehicle}
          onClose={() => setVorVehicle(null)}
        />
      )}

      {serviceVehicle && (
        <ServiceDialog
          vehicle={serviceVehicle}
          onClose={() => setServiceVehicle(null)}
        />
      )}

      {serviceHistoryVehicle && (
        <ServiceHistoryDialog
          vehicle={serviceHistoryVehicle}
          onClose={() => setServiceHistoryVehicle(null)}
        />
      )}
    </ManagerLayout>
  );
}
