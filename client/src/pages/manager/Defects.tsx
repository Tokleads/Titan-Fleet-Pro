import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  Wrench,
  Filter,
  Truck,
  ChevronRight,
  X,
  MapPin,
  Gauge,
  Save,
  ChevronDown,
  Plus
} from "lucide-react";
import { VehicleDetailModal } from "@/components/VehicleDetailModal";

const statusColors: Record<string, string> = {
  OPEN: "bg-red-50 text-red-700 border-red-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const severityColors: Record<string, string> = {
  LOW: "bg-blue-50 text-blue-600",
  MEDIUM: "bg-amber-50 text-amber-600",
  HIGH: "bg-orange-50 text-orange-600",
  CRITICAL: "bg-red-50 text-red-600",
};

const severityBorderColors: Record<string, string> = {
  LOW: "border-l-blue-400",
  MEDIUM: "border-l-amber-400",
  HIGH: "border-l-orange-400",
  CRITICAL: "border-l-red-500",
};

const columnConfig = [
  { status: "OPEN", label: "Open", icon: AlertTriangle, color: "text-red-600" },
  { status: "IN_PROGRESS", label: "In Progress", icon: Wrench, color: "text-amber-600" },
  { status: "RESOLVED", label: "Resolved", icon: CheckCircle2, color: "text-emerald-600" },
];

function DefectDetailModal({ defect, vehicles, allDefects, onClose, onUpdate, onViewVehicle }: {
  defect: any;
  vehicles: any[];
  allDefects: any[];
  onClose: () => void;
  onUpdate: (id: number, data: any) => void;
  onViewVehicle: (id: number) => void;
}) {
  const [status, setStatus] = useState(defect.status);
  const [actionedNotes, setActionedNotes] = useState(defect.actionedNotes || "");
  const [resolutionNotes, setResolutionNotes] = useState(defect.resolutionNotes || "");
  const [supplier, setSupplier] = useState(defect.supplier || "");
  const [site, setSite] = useState(defect.site || "");
  const [cost, setCost] = useState(defect.cost || "0.00");
  const [hasChanges, setHasChanges] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [customSupplier, setCustomSupplier] = useState("");

  const existingSuppliers = [...new Set(
    (allDefects || [])
      .map((d: any) => d.supplier)
      .filter((s: string | null) => s && s.trim().length > 0)
  )] as string[];

  const vehicle = vehicles?.find((v: any) => v.id === defect.vehicleId);
  const vrm = vehicle?.vrm || "Unknown";
  const daysOpen = defect.resolvedAt 
    ? Math.ceil((new Date(defect.resolvedAt).getTime() - new Date(defect.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : Math.ceil((Date.now() - new Date(defect.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  const handleSave = () => {
    onUpdate(defect.id, {
      status,
      actionedNotes: actionedNotes || null,
      resolutionNotes: resolutionNotes || null,
      supplier: supplier || null,
      site: site || null,
      cost: cost || "0.00",
      ...(status === "COMPLETED" || status === "RESOLVED" ? { resolvedAt: new Date().toISOString() } : {}),
    });
    onClose();
  };

  const markChanged = () => setHasChanges(true);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" data-testid="modal-defect-detail">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="sticky top-0 bg-white border-b border-slate-200 rounded-t-2xl px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              defect.severity === "CRITICAL" ? "bg-red-100" : defect.severity === "HIGH" ? "bg-orange-100" : "bg-amber-100"
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                defect.severity === "CRITICAL" ? "text-red-600" : defect.severity === "HIGH" ? "text-orange-600" : "text-amber-600"
              }`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Defect #{defect.id}</h2>
              <p className="text-xs text-slate-500">{defect.category} - {defect.severity}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors" data-testid="button-close-defect">
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Vehicle</p>
              <button
                onClick={() => { if (defect.vehicleId) { onClose(); onViewVehicle(defect.vehicleId); } }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                data-testid="link-defect-vehicle"
              >
                {vrm}
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Severity</p>
              <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-semibold ${severityColors[defect.severity] || severityColors.MEDIUM}`}>
                {defect.severity}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Reported</p>
              <p className="text-sm font-medium text-slate-800">{new Date(defect.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Days Open</p>
              <p className={`text-sm font-bold ${daysOpen > 14 ? "text-red-600" : daysOpen > 7 ? "text-amber-600" : "text-slate-800"}`}>{daysOpen} days</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Description</h3>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700">{defect.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Site</div>
              </label>
              <input
                type="text"
                value={site}
                onChange={(e) => { setSite(e.target.value); markChanged(); }}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. Main Depot"
                data-testid="input-defect-site"
              />
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                <div className="flex items-center gap-1"><Wrench className="h-3 w-3" /> Assigned To (Garage/Mechanic)</div>
              </label>
              <button
                type="button"
                onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                data-testid="button-defect-supplier"
              >
                <span className={supplier ? "text-slate-800" : "text-slate-400"}>{supplier || "Select garage or mechanic..."}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {showSupplierDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    {existingSuppliers.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">Saved Suppliers</div>
                        {existingSuppliers.map((s) => (
                          <button
                            key={s}
                            onClick={() => { setSupplier(s); setShowSupplierDropdown(false); markChanged(); }}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 ${supplier === s ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"}`}
                          >
                            <Wrench className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {s}
                          </button>
                        ))}
                      </>
                    )}
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-t border-slate-100">Add New</div>
                    <div className="p-2 flex gap-2">
                      <input
                        type="text"
                        value={customSupplier}
                        onChange={(e) => setCustomSupplier(e.target.value)}
                        placeholder="Enter new supplier..."
                        className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        data-testid="input-custom-supplier"
                      />
                      <button
                        onClick={() => {
                          if (customSupplier.trim()) {
                            setSupplier(customSupplier.trim());
                            setCustomSupplier("");
                            setShowSupplierDropdown(false);
                            markChanged();
                          }
                        }}
                        className="h-9 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
                        data-testid="button-add-supplier"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                  </div>
                  {supplier && (
                    <button
                      onClick={() => { setSupplier(""); setShowSupplierDropdown(false); markChanged(); }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 border-t border-slate-100 font-medium"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                <div className="flex items-center gap-1"><span className="text-xs font-bold">£</span> Cost</div>
              </label>
              <input
                type="text"
                value={cost}
                onChange={(e) => { setCost(e.target.value); markChanged(); }}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="0.00"
                data-testid="input-defect-cost"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                <div className="flex items-center gap-1"><Gauge className="h-3 w-3" /> Odometer</div>
              </label>
              <p className="h-10 px-3 flex items-center bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                {defect.odometer ? defect.odometer.toLocaleString() : "—"}
              </p>
            </div>
          </div>

          {(defect.fleetReference || defect.imReference || defect.requiredBy) && (
            <div className="grid grid-cols-3 gap-4">
              {defect.fleetReference && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Fleet Ref</p>
                  <p className="text-sm font-medium text-slate-800">{defect.fleetReference}</p>
                </div>
              )}
              {defect.imReference && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">IM Ref</p>
                  <p className="text-sm font-medium text-slate-800">{defect.imReference}</p>
                </div>
              )}
              {defect.requiredBy && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Required By</p>
                  <p className="text-sm font-medium text-slate-800">{new Date(defect.requiredBy).toLocaleDateString("en-GB")}</p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); markChanged(); }}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              data-testid="select-defect-status"
            >
              <option value="OPEN">Open</option>
              <option value="MONITOR">Monitor</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Action Notes</label>
            <textarea
              value={actionedNotes}
              onChange={(e) => { setActionedNotes(e.target.value); markChanged(); }}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              placeholder="Add notes about actions taken..."
              data-testid="textarea-defect-action-notes"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Resolution Notes</label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => { setResolutionNotes(e.target.value); markChanged(); }}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              placeholder="Add resolution details..."
              data-testid="textarea-defect-resolution-notes"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 rounded-b-2xl px-6 py-4 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium" data-testid="button-cancel-defect">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              hasChanges 
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
            data-testid="button-save-defect"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManagerDefects() {
  const company = session.getCompany();
  const companyId = company?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedDefect, setSelectedDefect] = useState<any | null>(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("");

  useEffect(() => {
    if (!showFilters) return;
    
    function handleClickOutside(event: PointerEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-filter-dropdown]')) {
        setShowFilters(false);
      }
    }
    
    document.addEventListener('pointerdown', handleClickOutside, true);
    return () => document.removeEventListener('pointerdown', handleClickOutside, true);
  }, [showFilters]);

  const { data: defects, isLoading } = useQuery({
    queryKey: ["manager-defects", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/defects/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch defects");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
    enabled: !!companyId,
  });

  const vehicles = Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData?.vehicles || []);

  const updateDefectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/manager/defects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update defect");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-defects"] });
      toast({ title: "Defect updated", description: "Changes have been saved successfully." });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Could not save changes. Please try again.", variant: "destructive" });
    },
  });

  const handleUpdateDefect = (id: number, data: any) => {
    updateDefectMutation.mutate({ id, data });
  };

  const getVehicleVrm = (vehicleId: number | null) => {
    if (!vehicleId) return "N/A";
    const vehicle = vehicles?.find((v: any) => v.id === vehicleId);
    return vehicle?.vrm || "Unknown";
  };

  const filteredDefects = defects?.filter((d: any) => {
    if (severityFilter && d.severity !== severityFilter) return false;
    if (vehicleFilter && d.vehicleId !== parseInt(vehicleFilter)) return false;
    return true;
  }) || [];

  const getDefectsByStatus = (status: string) => 
    filteredDefects.filter((d: any) => d.status === status);
  
  const activeFiltersCount = (severityFilter ? 1 : 0) + (vehicleFilter ? 1 : 0);
  
  const clearFilters = () => {
    setSeverityFilter("");
    setVehicleFilter("");
  };

  return (
    <ManagerLayout>
      <div className="space-y-6 titan-page-enter">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Defects</h1>
            <p className="text-slate-500 mt-0.5">Track and manage reported vehicle defects</p>
          </div>
          <div className="relative" data-filter-dropdown>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm font-medium transition-colors ${
                activeFiltersCount > 0 
                  ? 'border-blue-300 text-blue-700 bg-blue-50' 
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              data-testid="button-defects-filters"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <button 
                      onClick={clearFilters}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Severity</label>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      data-testid="select-severity-filter"
                    >
                      <option value="">All severities</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Vehicle</label>
                    <select
                      value={vehicleFilter}
                      onChange={(e) => setVehicleFilter(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      data-testid="select-vehicle-filter"
                    >
                      <option value="">All vehicles</option>
                      {vehicles?.map((v: any) => (
                        <option key={v.id} value={v.id}>{v.vrm}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full h-10 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                    data-testid="button-apply-filters"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((col) => (
              <div key={col} className="space-y-4">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
                {[1, 2].map((i) => (
                  <div key={i} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {columnConfig.map(({ status, label, icon: Icon, color }) => {
              const columnDefects = getDefectsByStatus(status);
              return (
                <div key={status} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${color}`} />
                    <h2 className="font-semibold text-slate-900">{label}</h2>
                    <span className="ml-auto text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {columnDefects.length}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {columnDefects.length === 0 ? (
                      <div className="bg-slate-50 rounded-2xl p-6 text-center border-2 border-dashed border-slate-200">
                        <p className="text-sm text-slate-400">No defects</p>
                      </div>
                    ) : (
                      columnDefects.map((defect: any) => (
                        <button
                          key={defect.id}
                          onClick={() => setSelectedDefect(defect)}
                          className={`w-full text-left bg-white rounded-2xl border border-slate-200/60 border-l-4 ${severityBorderColors[defect.severity] || "border-l-slate-300"} shadow-sm p-4 hover:shadow-md transition-all cursor-pointer group`}
                          data-testid={`card-defect-${defect.id}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Truck className="h-4 w-4 text-slate-500" />
                              </div>
                              <span
                                className="font-mono font-semibold text-sm text-blue-600"
                              >
                                {getVehicleVrm(defect.vehicleId)}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColors[defect.severity] || severityColors.MEDIUM}`}>
                              {defect.severity}
                            </span>
                          </div>
                          
                          <p className="text-sm font-medium text-slate-900 mb-1">{defect.category}</p>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{defect.description}</p>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              {new Date(defect.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedDefect && (
        <DefectDetailModal
          defect={selectedDefect}
          vehicles={vehicles}
          allDefects={defects || []}
          onClose={() => setSelectedDefect(null)}
          onUpdate={handleUpdateDefect}
          onViewVehicle={(id) => { setSelectedDefect(null); setSelectedVehicleId(id); }}
        />
      )}

      {selectedVehicleId && (
        <VehicleDetailModal vehicleId={selectedVehicleId} onClose={() => setSelectedVehicleId(null)} />
      )}
    </ManagerLayout>
  );
}
