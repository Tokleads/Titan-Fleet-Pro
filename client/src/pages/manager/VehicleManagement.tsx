import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { apiRequest } from "@/lib/queryClient";
import {
  CarFront,
  Truck,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Wrench,
  FileText,
  Calendar,
  Plus,
  CircleDot,
  BarChart3,
  ListChecks,
  Ban,
  Car,
  PoundSterling,
  Gavel,
  Loader2,
  Fuel,
  Download,
  Trash2,
  ChevronDown,
  Menu,
  Save,
  X,
  Minus,
} from "lucide-react";

type TabId =
  | "overview"
  | "list"
  | "safety-checks"
  | "defects"
  | "pending-defects"
  | "maintenance"
  | "services-due"
  | "mots-due"
  | "vor"
  | "tax-due"
  | "sorn"
  | "collisions"
  | "penalties"
  | "fuel-purchases";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "list", label: "Vehicle List", icon: Truck },
  { id: "safety-checks", label: "Safety Checks", icon: ListChecks },
  { id: "defects", label: "Defects", icon: AlertTriangle },
  { id: "pending-defects", label: "Pending Defects", icon: Clock },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "services-due", label: "Services Due", icon: Calendar },
  { id: "mots-due", label: "MOTs Due", icon: Shield },
  { id: "vor", label: "VOR", icon: Ban },
  { id: "tax-due", label: "Tax Due", icon: PoundSterling },
  { id: "sorn", label: "SORN", icon: Car },
  { id: "collisions", label: "Collisions", icon: CircleDot },
  { id: "penalties", label: "Penalties", icon: Gavel },
  { id: "fuel-purchases", label: "Fuel Purchases", icon: Fuel },
];

function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 text-sm" data-testid="text-empty-state">{message}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase() || "";
  let cls = "px-2.5 py-1 rounded-full text-xs font-medium ";
  if (["PASS", "ACTIVE", "COMPLETED", "CLOSED", "RECTIFIED", "VERIFIED", "PAID"].includes(s)) {
    cls += "bg-green-100 text-green-700";
  } else if (["FAIL", "OVERDUE", "CRITICAL", "HIGH", "REJECTED"].includes(s)) {
    cls += "bg-red-100 text-red-700";
  } else if (["PENDING", "IN_PROGRESS", "ASSIGNED", "OPEN", "DEFERRED", "AMBER", "SCHEDULED", "BOOKED"].includes(s)) {
    cls += "bg-amber-100 text-amber-700";
  } else {
    cls += "bg-slate-100 text-slate-600";
  }
  return <span className={cls} data-testid={`badge-status-${s.toLowerCase()}`}>{status}</span>;
}

function KpiCard({ label, value, color = "blue" }: { label: string; value: number | string; color?: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    amber: "text-amber-600",
    slate: "text-slate-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4" data-testid={`kpi-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors[color] || colors.blue}`}>{value}</p>
    </div>
  );
}

function OverviewTab({ companyId }: { companyId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-mgmt-overview", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/overview?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch overview");
      return res.json();
    },
    enabled: !!companyId,
  });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (!data) return <EmptyState message="No overview data available" />;

  const k = data.kpis;
  const dist = data.odometerAgeDistribution;
  const maxDist = Math.max(dist.lessThan1Week, dist.lessThan2Weeks, dist.lessThan4Weeks, dist.older, 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <KpiCard label="Total Vehicles" value={k.totalVehicles} color="slate" />
        <KpiCard label="Active" value={k.activeVehicles} color="green" />
        <KpiCard label="VOR" value={k.vorVehicles} color="red" />
        <KpiCard label="SORN" value={k.sornVehicles} color="amber" />
        <KpiCard label="Unassigned" value={k.unassignedVehicles} color="amber" />
        <KpiCard label="Without Daily Check" value={k.withoutDailyCheck} color="red" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Open Defects" value={k.openDefects} color="red" />
        <KpiCard label="Pending Defects" value={k.pendingDefects} color="amber" />
        <KpiCard label="Tax Due (30d)" value={k.taxDueNextMonth} color="amber" />
        <KpiCard label="Services Due (30d)" value={k.servicesDueNextMonth} color="amber" />
        <KpiCard label="MOTs Due (30d)" value={k.motsDueNextMonth} color="amber" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Odometer Age Distribution</h3>
        <div className="space-y-3">
          {[
            { label: "< 1 Week", value: dist.lessThan1Week, color: "bg-green-500" },
            { label: "1–2 Weeks", value: dist.lessThan2Weeks, color: "bg-blue-500" },
            { label: "2–4 Weeks", value: dist.lessThan4Weeks, color: "bg-amber-500" },
            { label: "> 4 Weeks", value: dist.older, color: "bg-red-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 w-24 shrink-0">{item.label}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                <div
                  className={`${item.color} h-full rounded-full transition-all`}
                  style={{ width: `${(item.value / maxDist) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-700 w-8 text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Recently Added</h3>
          {data.recentlyAdded?.length > 0 ? (
            <div className="space-y-2">
              {data.recentlyAdded.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <span className="font-medium text-slate-900 text-sm">{v.vrm}</span>
                    <span className="text-slate-500 text-sm ml-2">{v.make} {v.model}</span>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(v.createdAt).toLocaleDateString("en-GB")}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No vehicles added recently</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Recently Discarded</h3>
          {data.recentlyDiscarded?.length > 0 ? (
            <div className="space-y-2">
              {data.recentlyDiscarded.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <span className="font-medium text-slate-900 text-sm">{v.vrm}</span>
                    <span className="text-slate-500 text-sm ml-2">{v.make} {v.model}</span>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(v.createdAt).toLocaleDateString("en-GB")}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No vehicles discarded recently</p>
          )}
        </div>
      </div>
    </div>
  );
}

function VehicleListTab({ companyId }: { companyId: number }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const perPage = 25;
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({ vrm: '', make: '', model: '', fleetNumber: '', vehicleCategory: 'HGV', motDue: '' });
  const [addError, setAddError] = useState<string | null>(null);
  const [motLookupResult, setMotLookupResult] = useState<{ motDue?: string; status?: string; error?: string } | null>(null);
  const [isLookingUpMot, setIsLookingUpMot] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-mgmt-list", companyId, page, search],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/list?companyId=${companyId}&page=${page}&perPage=${perPage}&search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async (vehicleData: any) => {
      const res = await fetch('/api/manager/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create vehicle');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-mgmt-list'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-mgmt-overview'] });
      setShowAddForm(false);
      setAddFormData({ vrm: '', make: '', model: '', fleetNumber: '', vehicleCategory: 'HGV', motDue: '' });
      setAddError(null);
      setMotLookupResult(null);
    },
    onError: (error: Error) => {
      setAddError(error.message);
    },
  });

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
    } catch {
      setMotLookupResult({ error: 'Failed to lookup MOT status' });
    } finally {
      setIsLookingUpMot(false);
    }
  };

  const handleCreate = () => {
    if (!addFormData.vrm || !addFormData.make || !addFormData.model) {
      setAddError('VRM, Make, and Model are required');
      return;
    }
    createMutation.mutate({
      companyId,
      vrm: addFormData.vrm.toUpperCase().replace(/\s/g, ''),
      make: addFormData.make,
      model: addFormData.model,
      fleetNumber: addFormData.fleetNumber || null,
      vehicleCategory: addFormData.vehicleCategory,
      motDue: addFormData.motDue || null,
      active: true,
    });
  };

  const vehicles = data?.vehicles || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search VRM, make, model..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            data-testid="input-vehicle-list-search"
          />
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          data-testid="button-add-vehicle"
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Add New Vehicle</h4>
          {addError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" data-testid="text-add-vehicle-error">
              {addError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">VRM (Registration) *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={addFormData.vrm}
                  onChange={(e) => setAddFormData(d => ({ ...d, vrm: e.target.value.toUpperCase() }))}
                  placeholder="e.g. AB12 CDE"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                  data-testid="input-add-vrm"
                />
                <button
                  onClick={lookupMot}
                  disabled={isLookingUpMot || !addFormData.vrm || addFormData.vrm.length < 5}
                  className="px-3 py-2 bg-slate-700 text-white text-xs font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  data-testid="button-mot-lookup"
                >
                  {isLookingUpMot ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "DVSA Lookup"}
                </button>
              </div>
              {motLookupResult && (
                <p className={`text-xs mt-1.5 ${motLookupResult.error ? 'text-red-600' : 'text-green-600'}`} data-testid="text-mot-lookup-result">
                  {motLookupResult.error || `MOT ${motLookupResult.status} — Due: ${motLookupResult.motDue}`}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Make *</label>
              <input
                type="text"
                value={addFormData.make}
                onChange={(e) => setAddFormData(d => ({ ...d, make: e.target.value }))}
                placeholder="e.g. DAF"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                data-testid="input-add-make"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Model *</label>
              <input
                type="text"
                value={addFormData.model}
                onChange={(e) => setAddFormData(d => ({ ...d, model: e.target.value }))}
                placeholder="e.g. XF 480"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                data-testid="input-add-model"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Fleet Number</label>
              <input
                type="text"
                value={addFormData.fleetNumber}
                onChange={(e) => setAddFormData(d => ({ ...d, fleetNumber: e.target.value }))}
                placeholder="e.g. V001"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                data-testid="input-add-fleet-number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Vehicle Category</label>
              <select
                value={addFormData.vehicleCategory}
                onChange={(e) => setAddFormData(d => ({ ...d, vehicleCategory: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                data-testid="select-add-category"
              >
                <option value="HGV">HGV</option>
                <option value="LGV">LGV</option>
                <option value="Van">Van</option>
                <option value="Car">Car</option>
                <option value="Trailer">Trailer</option>
                <option value="Plant">Plant</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">MOT Due Date</label>
              <input
                type="date"
                value={addFormData.motDue}
                onChange={(e) => setAddFormData(d => ({ ...d, motDue: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                data-testid="input-add-mot-due"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="button-submit-vehicle"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Vehicle
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddError(null); setMotLookupResult(null); }}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              data-testid="button-cancel-add-vehicle"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-vehicle-list">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">VRM</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Make/Model</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Fleet No</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Mileage</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Assigned Drivers</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8"><LoadingSkeleton rows={5} /></td></tr>
              ) : vehicles.length === 0 ? (
                <tr><td colSpan={7}><EmptyState message="No vehicles found" /></td></tr>
              ) : (
                vehicles.map((v: any) => (
                  <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`row-vehicle-${v.id}`}>
                    <td className="px-4 py-3 font-medium text-slate-900">{v.vrm}</td>
                    <td className="px-4 py-3 text-slate-600">{v.make} {v.model}</td>
                    <td className="px-4 py-3 text-slate-600">{v.vehicleCategory}</td>
                    <td className="px-4 py-3 text-slate-600">{v.fleetNumber || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{v.currentMileage?.toLocaleString() || "—"}</td>
                    <td className="px-4 py-3">
                      {v.vorStatus ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">VOR</span>
                      ) : v.active ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {v.assignedDrivers?.length > 0 ? v.assignedDrivers.map((d: any) => d.name).join(", ") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages}
                className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                data-testid="button-next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SafetyChecksTab({ companyId }: { companyId: number }) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-mgmt-safety-checks", companyId, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/safety-checks?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch safety checks");
      return res.json();
    },
    enabled: !!companyId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/inspections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete inspection");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-mgmt-safety-checks"] });
      setConfirmDelete(null);
    },
  });

  const viewInspection = async (id: number) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/inspections/${id}`);
      if (!res.ok) throw new Error("Failed to fetch inspection");
      const detail = await res.json();
      setSelectedInspection(detail);
    } catch {
      setSelectedInspection(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const downloadPdf = (id: number) => {
    window.open(`/api/inspections/${id}/pdf`, "_blank");
  };

  const allRows = data || [];
  const filtered = search
    ? allRows.filter((r: any) =>
        r.registration?.toLowerCase().includes(search.toLowerCase()) ||
        r.driverName?.toLowerCase().includes(search.toLowerCase()) ||
        r.driverEmail?.toLowerCase().includes(search.toLowerCase()) ||
        r.checksheetTitle?.toLowerCase().includes(search.toLowerCase())
      )
    : allRows;
  const displayed = filtered.slice(0, perPage);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Inspections</h3>

        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Between</label>
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                data-testid="input-safety-start-date" />
              <span className="text-sm text-slate-500">And</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                data-testid="input-safety-end-date" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              data-testid="select-safety-per-page">
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-sm text-slate-500">entries per page</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-56"
              data-testid="input-safety-search" />
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : displayed.length === 0 ? (
          <EmptyState message="No safety checks found for this period" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-safety-checks">
              <thead>
                <tr className="bg-slate-700 text-white">
                  <th className="px-3 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Inspection Date</th>
                  <th className="px-3 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Registration</th>
                  <th className="px-3 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Driver Name</th>
                  <th className="px-3 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Email Address</th>
                  <th className="px-3 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Checksheet Title</th>
                  <th className="px-3 py-2.5 text-center font-medium text-xs uppercase tracking-wider">Faults</th>
                  <th className="px-3 py-2.5 text-center font-medium text-xs uppercase tracking-wider">Remaining Faults</th>
                  <th className="px-3 py-2.5 text-center font-medium text-xs uppercase tracking-wider w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((r: any) => (
                  <tr key={r.id} className="hover:bg-blue-50/50 transition-colors cursor-pointer group" data-testid={`row-safety-check-${r.id}`}>
                    <td className="px-3 py-3 text-slate-700" onClick={() => viewInspection(r.id)}>{r.inspectionDate}</td>
                    <td className="px-3 py-3 font-medium text-slate-900" onClick={() => viewInspection(r.id)}>{r.registration}</td>
                    <td className="px-3 py-3 text-slate-700" onClick={() => viewInspection(r.id)}>{r.driverName}</td>
                    <td className="px-3 py-3 text-slate-500" onClick={() => viewInspection(r.id)}>{r.driverEmail}</td>
                    <td className="px-3 py-3 text-slate-700" onClick={() => viewInspection(r.id)}>{r.checksheetTitle}</td>
                    <td className="px-3 py-3 text-center text-slate-700" onClick={() => viewInspection(r.id)}>{r.faultsCount}</td>
                    <td className="px-3 py-3 text-center text-slate-700" onClick={() => viewInspection(r.id)}>{r.remainingFaults}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => downloadPdf(r.id)} title="Download PDF"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                          data-testid={`button-download-inspection-${r.id}`}>
                          <Download className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(r.id)} title="Delete inspection"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 transition-colors"
                          data-testid={`button-delete-inspection-${r.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > perPage && (
          <p className="text-xs text-slate-500 mt-3">Showing {displayed.length} of {filtered.length} entries</p>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Delete Inspection</h4>
            <p className="text-sm text-slate-600 mb-5">Are you sure you want to permanently delete this inspection record? This cannot be undone.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                data-testid="button-cancel-delete">
                Cancel
              </button>
              <button onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                data-testid="button-confirm-delete">
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {(selectedInspection || loadingDetail) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedInspection(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : selectedInspection ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">
                      {selectedInspection.type} — {selectedInspection.vehicleVrm}
                    </h4>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {selectedInspection.driverName} · {new Date(selectedInspection.createdAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => downloadPdf(selectedInspection.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      data-testid="button-detail-download-pdf">
                      <Download className="h-4 w-4" /> Download PDF
                    </button>
                    <button onClick={() => setSelectedInspection(null)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      data-testid="button-close-detail">
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Status</p>
                    <StatusBadge status={selectedInspection.status} />
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Odometer</p>
                    <p className="text-sm font-medium text-slate-900">{selectedInspection.odometer?.toLocaleString() || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Vehicle</p>
                    <p className="text-sm font-medium text-slate-900">{selectedInspection.vehicleMake} {selectedInspection.vehicleModel}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Duration</p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedInspection.durationSeconds
                        ? `${Math.floor(selectedInspection.durationSeconds / 60)}m ${selectedInspection.durationSeconds % 60}s`
                        : "—"}
                    </p>
                  </div>
                </div>

                {selectedInspection.checklist && Array.isArray(selectedInspection.checklist) && selectedInspection.checklist.length > 0 && (
                  <div className="mb-5">
                    <h5 className="text-sm font-semibold text-slate-900 mb-2">Checklist Items</h5>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Item</th>
                            <th className="text-center px-3 py-2 font-medium text-slate-600 w-24">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedInspection.checklist.map((item: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-slate-700">{item.label || item.id || `Item ${idx + 1}`}</td>
                              <td className="px-3 py-2 text-center">
                                {item.result === "pass" || item.value === "pass" ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                ) : item.result === "fail" || item.value === "fail" ? (
                                  <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                                ) : item.result === "na" || item.value === "na" ? (
                                  <span className="text-xs text-slate-400">N/A</span>
                                ) : (
                                  <span className="text-xs text-slate-500">{item.result || item.value || "—"}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedInspection.defects && Array.isArray(selectedInspection.defects) && selectedInspection.defects.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900 mb-2">Defects Reported</h5>
                    <div className="space-y-2">
                      {selectedInspection.defects.map((d: any, idx: number) => (
                        <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-800 font-medium">{d.description || d.note || d}</p>
                          {d.category && <p className="text-xs text-red-600 mt-1">Category: {d.category}</p>}
                          {d.severity && <p className="text-xs text-red-600">Severity: {d.severity}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedInspection.cabPhotos && Array.isArray(selectedInspection.cabPhotos) && selectedInspection.cabPhotos.length > 0 && (
                  <div className="mt-5">
                    <h5 className="text-sm font-semibold text-slate-900 mb-2">Photos</h5>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedInspection.cabPhotos.map((url: string, idx: number) => (
                        <img key={idx} src={url} alt={`Photo ${idx + 1}`} className="rounded-lg border border-slate-200 object-cover h-32 w-full" />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function DefectsTab({ companyId }: { companyId: number }) {
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [supplierFilter, setSupplierFilter] = useState("ALL");
  const [siteFilter, setSiteFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState("OPEN");
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [editDefectId, setEditDefectId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-mgmt-defects", companyId, statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/defects?companyId=${companyId}&status=${statusFilter}`);
      if (!res.ok) throw new Error("Failed to fetch defects");
      return res.json();
    },
    enabled: !!companyId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (defectId: number) => {
      await apiRequest("DELETE", `/api/manager/defects/${defectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-mgmt-defects"] });
      setDeleteConfirmId(null);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/manager/vehicles/defects/bulk-status", { defectIds: selectedIds, status: bulkStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-mgmt-defects"] });
      setSelectedIds([]);
      setShowBulkDropdown(false);
    },
  });

  const toggleId = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const defects: any[] = data || [];

  const filtered = defects.filter((d: any) => {
    if (supplierFilter !== "ALL" && (d.supplier || "") !== supplierFilter) return false;
    if (siteFilter !== "ALL" && (d.site || "") !== siteFilter) return false;
    if (dateFrom && d.reportedDateISO) {
      const rDate = d.reportedDateISO.split("T")[0];
      if (rDate < dateFrom) return false;
    }
    if (dateTo && d.reportedDateISO) {
      const rDate = d.reportedDateISO.split("T")[0];
      if (rDate > dateTo) return false;
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const match = [d.reference, d.registration, d.faultDescription, d.supplier, d.site, d.status]
        .filter(Boolean).some((v: any) => String(v).toLowerCase().includes(s));
      if (!match) return false;
    }
    return true;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
  const startIdx = (page - 1) * perPage;
  const paged = filtered.slice(startIdx, startIdx + perPage);
  const showingFrom = totalFiltered === 0 ? 0 : startIdx + 1;
  const showingTo = Math.min(startIdx + perPage, totalFiltered);

  const uniqueSuppliers = Array.from(new Set(defects.map((d: any) => d.supplier).filter(Boolean)));
  const uniqueSites = Array.from(new Set(defects.map((d: any) => d.site).filter(Boolean)));

  const exportCsv = () => {
    const headers = ["Reference", "Registration", "Reported Date", "Required By", "Days Open", "Supplier", "Fault", "Site", "Status"];
    const rows = filtered.map((d: any) => [
      d.reference, d.registration, d.reportedDate, d.requiredBy || "", d.daysOpen, d.supplier || "", d.faultDescription || "", d.site || "", d.status
    ]);
    const csv = [headers.join(","), ...rows.map((r: any[]) => r.map((c: any) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "defects-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (editDefectId !== null) {
    return <EditDefectModal defectId={editDefectId} companyId={companyId} onClose={() => setEditDefectId(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Show:</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 bg-white border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            data-testid="select-defect-status">
            <option value="OPEN">Open</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="MONITOR">Monitor</option>
            <option value="ALL">All</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Supplier:</label>
          <select value={supplierFilter} onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 bg-white border border-slate-300 rounded text-sm"
            data-testid="select-defect-supplier">
            <option value="ALL">All Suppliers</option>
            {uniqueSuppliers.map((s: any) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Site:</label>
          <select value={siteFilter} onChange={(e) => { setSiteFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 bg-white border border-slate-300 rounded text-sm"
            data-testid="select-defect-site">
            <option value="ALL">All Sites</option>
            {uniqueSites.map((s: any) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Reported between:</label>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="h-9 px-2 bg-white border border-slate-300 rounded text-sm"
              data-testid="input-defect-date-from" />
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="h-9 px-2 bg-white border border-slate-300 rounded text-sm"
              data-testid="input-defect-date-to" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setSelectedIds(paged.map((d: any) => d.reference))}
          className="bg-slate-700 text-white text-sm px-3 py-1.5 rounded hover:bg-slate-800"
          data-testid="button-select-all-defects">Select all</button>
        <button onClick={() => setSelectedIds([])}
          className="bg-slate-700 text-white text-sm px-3 py-1.5 rounded hover:bg-slate-800"
          data-testid="button-deselect-all-defects">Deselect all</button>
        <div className="relative">
          <button onClick={() => setShowBulkDropdown(!showBulkDropdown)}
            className="bg-slate-700 text-white text-sm px-3 py-1.5 rounded hover:bg-slate-800 flex items-center gap-1"
            data-testid="button-change-status">
            Change Status <ChevronDown className="h-3 w-3" />
          </button>
          {showBulkDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-20 min-w-[160px]">
              {["OPEN", "COMPLETED", "CANCELLED", "MONITOR"].map((s) => (
                <button key={s} onClick={() => { setBulkStatus(s); if (selectedIds.length > 0) { bulkMutation.mutate(); } else { setShowBulkDropdown(false); } }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                  data-testid={`button-bulk-status-${s.toLowerCase()}`}>{s}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={exportCsv}
          className="bg-slate-700 text-white text-sm px-3 py-1.5 rounded hover:bg-slate-800 flex items-center gap-1"
          data-testid="button-export-csv">
          <Download className="h-3.5 w-3.5" /> Export As CSV
        </button>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-defects">
            <thead>
              <tr className="bg-slate-700 text-white">
                <th className="px-3 py-2.5 w-10"><span className="sr-only">Select</span></th>
                <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Reference</th>
                <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Registration</th>
                <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Reported Date</th>
                <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Required By</th>
                <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Days Open</th>
                <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Supplier</th>
                <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Fault</th>
                <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Site</th>
                <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Status</th>
                <th className="px-3 py-2.5 w-10"><span className="sr-only">Delete</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} className="px-4 py-8"><LoadingSkeleton /></td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={11}><EmptyState message="No defects found" /></td></tr>
              ) : (
                paged.map((d: any) => (
                  <tr key={d.reference} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    data-testid={`row-defect-${d.reference}`}
                    onClick={(e) => {
                      const t = e.target as HTMLElement;
                      if (t.tagName === "INPUT" || t.closest("button")) return;
                      setEditDefectId(d.reference);
                    }}>
                    <td className="px-3 py-2.5">
                      <input type="checkbox" checked={selectedIds.includes(d.reference)}
                        onChange={() => toggleId(d.reference)}
                        className="rounded border-slate-300"
                        data-testid={`checkbox-defect-${d.reference}`} />
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{d.reference}</td>
                    <td className="px-3 py-2.5 text-slate-600">{d.registration}</td>
                    <td className="px-3 py-2.5 text-slate-600">{d.reportedDate}</td>
                    <td className="px-3 py-2.5 text-slate-600">{d.requiredBy || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600">{d.daysOpen}</td>
                    <td className="px-3 py-2.5 text-slate-600">{d.supplier || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate">{d.faultDescription || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600">{d.site || "—"}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={d.status} /></td>
                    <td className="px-3 py-2.5">
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(d.reference); }}
                        className="text-red-500 hover:text-red-700"
                        data-testid={`button-delete-defect-${d.reference}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="h-8 px-2 border border-slate-300 rounded text-sm bg-white"
              data-testid="select-defect-per-page">
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} entries per page</option>)}
            </select>
            <span>Showing {showingFrom} to {showingTo} of {totalFiltered} entries</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Search..."
                className="h-8 pl-8 pr-3 border border-slate-300 rounded text-sm bg-white w-48"
                data-testid="input-defect-search" />
            </div>
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40"
              data-testid="button-defect-prev-page">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 5) {
                if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
              }
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded text-sm font-medium ${page === p ? "bg-slate-700 text-white" : "hover:bg-slate-200 text-slate-600"}`}
                  data-testid={`button-defect-page-${p}`}>{p}</button>
              );
            })}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40"
              data-testid="button-defect-next-page">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" data-testid="modal-delete-defect">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirm Delete</h3>
            <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete defect #{deleteConfirmId}? This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded"
                data-testid="button-cancel-delete">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                data-testid="button-confirm-delete">
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditDefectModal({ defectId, companyId, onClose }: { defectId: number; companyId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [activeDefectId, setActiveDefectId] = useState(defectId);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(true);
  const [existingOpen, setExistingOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [dirty, setDirty] = useState(false);
  const [existingSearch, setExistingSearch] = useState("");
  const [existingPage, setExistingPage] = useState(1);
  const [existingPerPage, setExistingPerPage] = useState(10);
  const [existingStatusFilter, setExistingStatusFilter] = useState("ALL");
  const [existingSelectedIds, setExistingSelectedIds] = useState<number[]>([]);
  const [docFilter, setDocFilter] = useState("ALL");

  const switchToDefect = (newDefectId: number) => {
    setActiveDefectId(newDefectId);
    setDirty(false);
    setFormData({});
    setDetailsOpen(true);
    setActionsOpen(true);
    setTimeout(() => {
      const el = document.getElementById("defect-modal-scroll");
      if (el) el.scrollTop = 0;
    }, 50);
  };

  const { data: detail, isLoading } = useQuery({
    queryKey: ["defect-detail", activeDefectId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/defects/detail/${activeDefectId}`);
      if (!res.ok) throw new Error("Failed to fetch defect detail");
      return res.json();
    },
    enabled: !!activeDefectId,
  });

  useEffect(() => {
    if (detail && !dirty) {
      setFormData({
        supplier: detail.supplier || "",
        description: detail.faultDescription || detail.description || "",
        odometer: detail.odometer || "",
        fleetReference: detail.fleetReference || detail.vehicleFleetNumber || "",
        imReference: detail.imReference || "",
        reportedDate: detail.createdAt ? detail.createdAt.split("T")[0] : "",
        reportedBy: detail.reportedByName || "",
        requiredBy: detail.requiredBy ? detail.requiredBy.split("T")[0] : "",
        cost: detail.cost || "0.00",
        site: detail.site || "",
        status: detail.status || "OPEN",
        actionedNotes: detail.actionedNotes || "",
      });
    }
  }, [detail, activeDefectId]);

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/manager/defects/${activeDefectId}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["defect-detail"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-mgmt-defects"] });
      setDirty(false);
    },
  });

  const vehicleDefects: any[] = detail?.vehicleDefects || [];
  const filteredExisting = vehicleDefects.filter((d: any) => {
    if (existingStatusFilter !== "ALL" && d.status !== existingStatusFilter) return false;
    if (existingSearch) {
      const s = existingSearch.toLowerCase();
      return [d.reference, d.registration, d.faultDescription, d.supplier, d.site, d.status]
        .filter(Boolean).some((v: any) => String(v).toLowerCase().includes(s));
    }
    return true;
  });
  const existingTotalPages = Math.max(1, Math.ceil(filteredExisting.length / existingPerPage));
  const existingPaged = filteredExisting.slice((existingPage - 1) * existingPerPage, existingPage * existingPerPage);

  const documents: any[] = detail?.documents || [];
  const filteredDocs = docFilter === "ALL" ? documents : documents.filter((d: any) => d.type === docFilter);

  const descRemaining = 1536 - (formData.description || "").length;
  const notesRemaining = 4000 - (formData.actionedNotes || "").length;

  const CollapsibleHeader = ({ title, isOpen, toggle }: { title: string; isOpen: boolean; toggle: () => void }) => (
    <button onClick={toggle} className="w-full flex items-center justify-between bg-slate-100 border border-slate-200 px-4 py-3 rounded-t text-sm font-semibold text-slate-800 hover:bg-slate-200"
      data-testid={`button-toggle-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <span>{title}</span>
      {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
    </button>
  );

  return (
    <div id="defect-modal-scroll" className="fixed inset-0 bg-white z-50 overflow-y-auto" data-testid="modal-edit-defect">
      <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Menu className="h-5 w-5" />
          <span className="font-semibold text-lg">Edit Defect</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 rounded"
            data-testid="button-cancel-edit-defect">Cancel</button>
          <button onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !dirty}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 flex items-center gap-1.5"
            data-testid="button-save-defect">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8"><LoadingSkeleton rows={8} /></div>
      ) : (
        <div className="max-w-6xl mx-auto p-4 space-y-4">
          <div className="flex items-center justify-center gap-2 py-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-red-600">Pending Defect</span>
          </div>

          {detail?.vehicleVorStatus && (
            <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 text-sm text-blue-800" data-testid="banner-vor-status">
              This vehicle is VOR {detail.vehicleVorStartDate ? new Date(detail.vehicleVorStartDate).toLocaleDateString("en-GB") : ""}: {detail.vehicleVorReason || "No reason specified"} -
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded shadow-sm">
            <CollapsibleHeader title="Defect Details" isOpen={detailsOpen} toggle={() => setDetailsOpen(!detailsOpen)} />
            {detailsOpen && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Supplier</label>
                    <input type="text" value={formData.supplier || ""} onChange={(e) => updateField("supplier", e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                      data-testid="input-defect-supplier" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                    <textarea value={formData.description || ""} onChange={(e) => { if (e.target.value.length <= 1536) updateField("description", e.target.value); }}
                      rows={4} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white resize-none"
                      data-testid="textarea-defect-description" />
                    <span className="text-xs text-slate-400">{descRemaining} characters remaining</span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Odometer</label>
                    <input type="text" value={formData.odometer || ""} onChange={(e) => updateField("odometer", e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                      data-testid="input-defect-odometer" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fleet Reference</label>
                    <input type="text" value={formData.fleetReference || ""} onChange={(e) => updateField("fleetReference", e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                      data-testid="input-defect-fleet-ref" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">IM Reference</label>
                    <input type="text" value={formData.imReference || ""} onChange={(e) => updateField("imReference", e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                      data-testid="input-defect-im-ref" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Reported Date</label>
                    <input type="date" value={formData.reportedDate || ""} onChange={(e) => updateField("reportedDate", e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                      data-testid="input-defect-reported-date" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Reported By</label>
                    <input type="text" value={formData.reportedBy || ""} onChange={(e) => updateField("reportedBy", e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                      data-testid="input-defect-reported-by" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Required By</label>
                    <input type="date" value={formData.requiredBy || ""} onChange={(e) => updateField("requiredBy", e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                      data-testid="input-defect-required-by" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cost</label>
                    <div className="flex items-center">
                      <span className="bg-slate-100 border border-r-0 border-slate-300 rounded-l px-3 py-2 text-sm text-slate-600">£</span>
                      <input type="text" value={formData.cost || ""} onChange={(e) => updateField("cost", e.target.value)}
                        className="flex-1 border border-slate-300 rounded-r px-3 py-2 text-sm bg-white"
                        data-testid="input-defect-cost" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Site</label>
                    <select value={formData.site || ""} onChange={(e) => updateField("site", e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                      data-testid="select-defect-site-edit">
                      <option value="">Please select...</option>
                      <option value="Main Depot">Main Depot</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded shadow-sm">
            <CollapsibleHeader title="Actions" isOpen={actionsOpen} toggle={() => setActionsOpen(!actionsOpen)} />
            {actionsOpen && (
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Defect Status</label>
                  <select value={formData.status || "OPEN"} onChange={(e) => updateField("status", e.target.value)}
                    className="w-full md:w-64 border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                    data-testid="select-defect-status-edit">
                    <option value="OPEN">Open</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="MONITOR">Monitor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Actioned Notes</label>
                  <textarea value={formData.actionedNotes || ""} onChange={(e) => { if (e.target.value.length <= 4000) updateField("actionedNotes", e.target.value); }}
                    rows={4} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white resize-none"
                    data-testid="textarea-defect-actioned-notes" />
                  <span className="text-xs text-slate-400">{notesRemaining} characters remaining</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded shadow-sm">
            <CollapsibleHeader title="Existing Defects" isOpen={existingOpen} toggle={() => setExistingOpen(!existingOpen)} />
            {existingOpen && (
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="bg-slate-600 text-white text-sm px-3 py-1.5 rounded hover:bg-slate-700"
                    data-testid="button-existing-change-status">Change Status</button>
                  <button className="bg-slate-700 text-white text-sm px-3 py-1.5 rounded hover:bg-slate-800 flex items-center gap-1"
                    data-testid="button-existing-export-csv">
                    <Download className="h-3.5 w-3.5" /> Export As CSV
                  </button>
                  <button className="bg-green-600 text-white text-sm px-3 py-1.5 rounded hover:bg-green-700 flex items-center gap-1"
                    data-testid="button-existing-add-defect">
                    <Plus className="h-3.5 w-3.5" /> Add Defect
                  </button>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Show:</label>
                    <select value={existingStatusFilter} onChange={(e) => { setExistingStatusFilter(e.target.value); setExistingPage(1); }}
                      className="h-9 px-3 bg-white border border-slate-300 rounded text-sm"
                      data-testid="select-existing-status">
                      <option value="ALL">All</option>
                      <option value="OPEN">Open</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="MONITOR">Monitor</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setExistingSelectedIds(existingPaged.map((d: any) => d.reference))}
                    className="bg-slate-700 text-white text-sm px-3 py-1.5 rounded"
                    data-testid="button-existing-select-all">Select all</button>
                  <button onClick={() => setExistingSelectedIds([])}
                    className="bg-slate-700 text-white text-sm px-3 py-1.5 rounded"
                    data-testid="button-existing-deselect-all">Deselect all</button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-sm" data-testid="table-existing-defects">
                    <thead>
                      <tr className="bg-slate-700 text-white">
                        <th className="px-3 py-2.5 w-10"><span className="sr-only">Select</span></th>
                        <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Reference</th>
                        <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Registration</th>
                        <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Reported Date</th>
                        <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Required By</th>
                        <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Days Open</th>
                        <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Supplier</th>
                        <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Fault</th>
                        <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Site</th>
                        <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Status</th>
                        <th className="px-3 py-2.5 w-10"><span className="sr-only">Delete</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {existingPaged.length === 0 ? (
                        <tr><td colSpan={11} className="px-4 py-6 text-center text-sm text-slate-400">No existing defects</td></tr>
                      ) : (
                        existingPaged.map((d: any) => (
                          <tr key={d.reference}
                            className={`border-b border-slate-100 cursor-pointer transition-colors ${d.reference === activeDefectId ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-slate-50"}`}
                            onClick={(e) => {
                              const target = e.target as HTMLElement;
                              if (target.closest("input") || target.closest("button")) return;
                              switchToDefect(d.reference);
                            }}
                            data-testid={`row-existing-defect-${d.reference}`}>
                            <td className="px-3 py-2.5">
                              <input type="checkbox" checked={existingSelectedIds.includes(d.reference)}
                                onChange={() => setExistingSelectedIds((prev) => prev.includes(d.reference) ? prev.filter((x) => x !== d.reference) : [...prev, d.reference])}
                                className="rounded border-slate-300"
                                data-testid={`checkbox-existing-defect-${d.reference}`} />
                            </td>
                            <td className="px-3 py-2.5 font-medium text-blue-700 underline">{d.reference}</td>
                            <td className="px-3 py-2.5 text-slate-600">{d.registration}</td>
                            <td className="px-3 py-2.5 text-slate-600">{d.reportedDate}</td>
                            <td className="px-3 py-2.5 text-slate-600">{d.requiredBy || "—"}</td>
                            <td className="px-3 py-2.5 text-slate-600">{d.daysOpen}</td>
                            <td className="px-3 py-2.5 text-slate-600">{d.supplier || "—"}</td>
                            <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate">{d.faultDescription || "—"}</td>
                            <td className="px-3 py-2.5 text-slate-600">{d.site || "—"}</td>
                            <td className="px-3 py-2.5"><StatusBadge status={d.status} /></td>
                            <td className="px-3 py-2.5">
                              <button className="text-red-500 hover:text-red-700" data-testid={`button-delete-existing-${d.reference}`}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <select value={existingPerPage} onChange={(e) => { setExistingPerPage(Number(e.target.value)); setExistingPage(1); }}
                      className="h-8 px-2 border border-slate-300 rounded text-sm bg-white"
                      data-testid="select-existing-per-page">
                      {[10, 25, 50].map((n) => <option key={n} value={n}>{n} entries per page</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input type="text" value={existingSearch} onChange={(e) => { setExistingSearch(e.target.value); setExistingPage(1); }}
                        placeholder="Search..."
                        className="h-8 pl-8 pr-3 border border-slate-300 rounded text-sm bg-white w-40"
                        data-testid="input-existing-search" />
                    </div>
                    <button onClick={() => setExistingPage(Math.max(1, existingPage - 1))} disabled={existingPage <= 1}
                      className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40"
                      data-testid="button-existing-prev-page">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs">Page {existingPage} of {existingTotalPages}</span>
                    <button onClick={() => setExistingPage(Math.min(existingTotalPages, existingPage + 1))} disabled={existingPage >= existingTotalPages}
                      className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40"
                      data-testid="button-existing-next-page">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded shadow-sm">
            <CollapsibleHeader title="Documents" isOpen={documentsOpen} toggle={() => setDocumentsOpen(!documentsOpen)} />
            {documentsOpen && (
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Show:</label>
                    <select value={docFilter} onChange={(e) => setDocFilter(e.target.value)}
                      className="h-9 px-3 bg-white border border-slate-300 rounded text-sm"
                      data-testid="select-doc-filter">
                      <option value="ALL">All</option>
                    </select>
                  </div>
                  <button className="bg-green-600 text-white text-sm px-3 py-1.5 rounded hover:bg-green-700 flex items-center gap-1 mt-5"
                    data-testid="button-add-document">
                    <Plus className="h-3.5 w-3.5" /> Add Document
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-sm" data-testid="table-documents">
                    <thead>
                      <tr className="bg-slate-700 text-white">
                        <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Document Type</th>
                        <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">File Name</th>
                        <th className="text-left px-3 py-2.5 font-medium text-xs uppercase">Document Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocs.length === 0 ? (
                        <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-400">No documents found</td></tr>
                      ) : (
                        filteredDocs.map((doc: any, i: number) => (
                          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`row-document-${i}`}>
                            <td className="px-3 py-2.5 text-slate-600">{doc.type || "—"}</td>
                            <td className="px-3 py-2.5 text-slate-600">{doc.fileName || "—"}</td>
                            <td className="px-3 py-2.5 text-slate-600">{doc.date || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PendingDefectsTab({ companyId }: { companyId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-mgmt-pending-defects", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/pending-defects?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch pending defects");
      return res.json();
    },
    enabled: !!companyId,
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="table-pending-defects">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Check Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Driver</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Registration</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Vehicle Type</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Fleet No</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Description</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8"><LoadingSkeleton /></td></tr>
            ) : !data || data.length === 0 ? (
              <tr><td colSpan={6}><EmptyState message="No pending defects" /></td></tr>
            ) : (
              data.map((d: any, i: number) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{d.checkDate}</td>
                  <td className="px-4 py-3 text-slate-600">{d.driverName}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{d.registration}</td>
                  <td className="px-4 py-3 text-slate-600">{d.vehicleType}</td>
                  <td className="px-4 py-3 text-slate-600">{d.fleetNumber || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{typeof d.description === "string" ? d.description : JSON.stringify(d.description)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MaintenanceTab({ companyId }: { companyId: number }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", companyId: companyId, category: "", supplier: "", bookingDate: "", endDate: "", status: "BOOKED", description: "", costEstimate: "", actualCost: "", notes: "" });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-mgmt-maintenance", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/maintenance?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch maintenance");
      return res.json();
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/manager/vehicles/maintenance", {
        ...form,
        vehicleId: Number(form.vehicleId),
        companyId,
        costEstimate: form.costEstimate ? Number(form.costEstimate) : null,
        actualCost: form.actualCost ? Number(form.actualCost) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-mgmt-maintenance"] });
      setShowForm(false);
      setForm({ vehicleId: "", companyId, category: "", supplier: "", bookingDate: "", endDate: "", status: "BOOKED", description: "", costEstimate: "", actualCost: "", notes: "" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
          data-testid="button-add-maintenance">
          <Plus className="h-4 w-4" /> Add Booking
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">New Maintenance Booking</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input type="number" placeholder="Vehicle ID" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-maint-vehicle-id" />
            <input type="text" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-maint-category" />
            <input type="text" placeholder="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-maint-supplier" />
            <input type="date" placeholder="Booking Date" value={form.bookingDate} onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-maint-booking-date" />
            <input type="date" placeholder="End Date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-maint-end-date" />
            <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-maint-description" />
            <input type="number" placeholder="Cost Estimate (£)" value={form.costEstimate} onChange={(e) => setForm({ ...form, costEstimate: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-maint-cost-estimate" />
            <input type="number" placeholder="Actual Cost (£)" value={form.actualCost} onChange={(e) => setForm({ ...form, actualCost: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-maint-actual-cost" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50" data-testid="button-cancel-maintenance">Cancel</button>
            <button onClick={() => createMutation.mutate()} disabled={!form.vehicleId || !form.bookingDate || createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              data-testid="button-submit-maintenance">
              {createMutation.isPending ? "Saving..." : "Save Booking"}
            </button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-maintenance">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Registration</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Supplier</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Booking Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">End Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Cost Est.</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Actual Cost</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-8"><LoadingSkeleton /></td></tr>
              ) : !data || data.length === 0 ? (
                <tr><td colSpan={9}><EmptyState message="No maintenance bookings" /></td></tr>
              ) : (
                data.map((m: any) => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{m.vehicleVrm}</td>
                    <td className="px-4 py-3 text-slate-600">{m.category || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{m.supplier || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{m.bookingDateFormatted}</td>
                    <td className="px-4 py-3 text-slate-600">{m.endDateFormatted || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-4 py-3 text-slate-600">{m.costEstimate ? `£${Number(m.costEstimate).toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{m.actualCost ? `£${Number(m.actualCost).toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{m.description || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ServicesDueTab({ companyId }: { companyId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-mgmt-services-due", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/services-due?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch services due");
      return res.json();
    },
    enabled: !!companyId,
  });

  const isOverdue = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return false;
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    return d < new Date();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="table-services-due">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600">VRM</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Make/Model</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Mileage</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Last Service Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Last Service Miles</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Next Service Due</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Next Service Miles</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Miles Until Service</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="px-4 py-8"><LoadingSkeleton /></td></tr>
            ) : !data || data.length === 0 ? (
              <tr><td colSpan={9}><EmptyState message="No services due" /></td></tr>
            ) : (
              data.map((v: any) => {
                const overdue = isOverdue(v.nextServiceDue) || (v.milesUntilService !== null && v.milesUntilService < 0);
                return (
                  <tr key={v.id} className={`border-b border-slate-100 hover:bg-slate-50 ${overdue ? "bg-red-50" : ""}`}>
                    <td className={`px-4 py-3 font-medium ${overdue ? "text-red-700" : "text-slate-900"}`}>{v.vrm}</td>
                    <td className="px-4 py-3 text-slate-600">{v.make} {v.model}</td>
                    <td className="px-4 py-3 text-slate-600">{v.vehicleCategory}</td>
                    <td className="px-4 py-3 text-slate-600">{v.currentMileage?.toLocaleString() || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{v.lastServiceDate || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{v.lastServiceMileage?.toLocaleString() || "—"}</td>
                    <td className={`px-4 py-3 ${overdue ? "text-red-700 font-medium" : "text-slate-600"}`}>{v.nextServiceDue || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{v.nextServiceMileage?.toLocaleString() || "—"}</td>
                    <td className={`px-4 py-3 font-medium ${v.milesUntilService !== null && v.milesUntilService < 0 ? "text-red-700" : "text-slate-600"}`}>
                      {v.milesUntilService !== null ? v.milesUntilService.toLocaleString() : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MotsDueTab({ companyId }: { companyId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-mgmt-mots-due", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/mots-due?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch MOTs due");
      return res.json();
    },
    enabled: !!companyId,
  });

  const getUrgencyClass = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("/");
    if (parts.length !== 3) return "";
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays < 14) return "bg-red-50 text-red-700";
    if (diffDays < 30) return "bg-amber-50 text-amber-700";
    return "text-green-700";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="table-mots-due">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Registration</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">MOT Due Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Assigned Driver</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8"><LoadingSkeleton /></td></tr>
            ) : !data || data.length === 0 ? (
              <tr><td colSpan={4}><EmptyState message="No MOTs due" /></td></tr>
            ) : (
              data.map((v: any) => (
                <tr key={v.id} className={`border-b border-slate-100 hover:bg-slate-50 ${getUrgencyClass(v.motDueDate).includes("bg-") ? getUrgencyClass(v.motDueDate).split(" ")[0] : ""}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">{v.registration}</td>
                  <td className="px-4 py-3 text-slate-600">{v.category}</td>
                  <td className={`px-4 py-3 font-medium ${getUrgencyClass(v.motDueDate).split(" ").pop()}`}>{v.motDueDate}</td>
                  <td className="px-4 py-3 text-slate-600">{v.assignedDriver}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VorTab({ companyId }: { companyId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-mgmt-vor", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/vor?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch VOR");
      return res.json();
    },
    enabled: !!companyId,
  });

  if (isLoading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Current VOR ({data?.current?.length || 0})</h3>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-vor-current">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">VRM</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Make/Model</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Reason</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Start Date</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Notes</th>
                </tr>
              </thead>
              <tbody>
                {!data?.current || data.current.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState message="No vehicles currently VOR" /></td></tr>
                ) : (
                  data.current.map((v: any) => (
                    <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{v.vrm}</td>
                      <td className="px-4 py-3 text-slate-600">{v.make} {v.model}</td>
                      <td className="px-4 py-3 text-slate-600">{v.vorReason || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{v.vorStartDate || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{v.vorNotes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">VOR History ({data?.history?.length || 0})</h3>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-vor-history">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">VRM</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Make/Model</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Reason</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Start Date</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Resolved Date</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Notes</th>
                </tr>
              </thead>
              <tbody>
                {!data?.history || data.history.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState message="No VOR history" /></td></tr>
                ) : (
                  data.history.map((v: any) => (
                    <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{v.vrm}</td>
                      <td className="px-4 py-3 text-slate-600">{v.make} {v.model}</td>
                      <td className="px-4 py-3 text-slate-600">{v.vorReason || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{v.vorStartDate || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{v.vorResolvedDate || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{v.vorNotes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaxDueTab({ companyId }: { companyId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-mgmt-tax-due", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/tax-due?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch tax due");
      return res.json();
    },
    enabled: !!companyId,
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="table-tax-due">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Registration</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Tax Due Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className="px-4 py-8"><LoadingSkeleton /></td></tr>
            ) : !data || data.length === 0 ? (
              <tr><td colSpan={3}><EmptyState message="No vehicles with tax due" /></td></tr>
            ) : (
              data.map((v: any) => (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{v.registration}</td>
                  <td className="px-4 py-3 text-slate-600">{v.category}</td>
                  <td className="px-4 py-3 text-slate-600">{v.taxDueDate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SornTab({ companyId }: { companyId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-mgmt-sorn", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/sorn?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch SORN");
      return res.json();
    },
    enabled: !!companyId,
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="table-sorn">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Registration</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Make/Model</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">VOR Reason</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Start Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Notes</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8"><LoadingSkeleton /></td></tr>
            ) : !data || data.length === 0 ? (
              <tr><td colSpan={6}><EmptyState message="No SORN vehicles" /></td></tr>
            ) : (
              data.map((v: any) => (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{v.registration}</td>
                  <td className="px-4 py-3 text-slate-600">{v.make} {v.model}</td>
                  <td className="px-4 py-3 text-slate-600">{v.vehicleCategory}</td>
                  <td className="px-4 py-3 text-slate-600">{v.vorReason || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{v.vorStartDate || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{v.vorNotes || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CollisionsTab({ companyId }: { companyId: number }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", driverId: "", companyId: companyId, collisionDate: "", status: "REPORTED", fault: "", description: "", insurer: "", insurerReference: "" });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-mgmt-collisions", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/collisions?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch collisions");
      return res.json();
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/manager/vehicles/collisions", {
        ...form,
        vehicleId: Number(form.vehicleId),
        driverId: form.driverId ? Number(form.driverId) : null,
        companyId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-mgmt-collisions"] });
      setShowForm(false);
      setForm({ vehicleId: "", driverId: "", companyId, collisionDate: "", status: "REPORTED", fault: "", description: "", insurer: "", insurerReference: "" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
          data-testid="button-add-collision">
          <Plus className="h-4 w-4" /> Add Collision
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">New Collision Record</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input type="number" placeholder="Vehicle ID" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-collision-vehicle-id" />
            <input type="number" placeholder="Driver ID (optional)" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-collision-driver-id" />
            <input type="date" value={form.collisionDate} onChange={(e) => setForm({ ...form, collisionDate: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-collision-date" />
            <input type="text" placeholder="Fault" value={form.fault} onChange={(e) => setForm({ ...form, fault: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-collision-fault" />
            <input type="text" placeholder="Insurer" value={form.insurer} onChange={(e) => setForm({ ...form, insurer: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-collision-insurer" />
            <input type="text" placeholder="Insurer Reference" value={form.insurerReference} onChange={(e) => setForm({ ...form, insurerReference: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-collision-ref" />
            <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm col-span-full" data-testid="input-collision-description" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50" data-testid="button-cancel-collision">Cancel</button>
            <button onClick={() => createMutation.mutate()} disabled={!form.vehicleId || !form.collisionDate || createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              data-testid="button-submit-collision">
              {createMutation.isPending ? "Saving..." : "Save Collision"}
            </button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-collisions">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Registration</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Driver</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Fault</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Insurer</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Ref</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8"><LoadingSkeleton /></td></tr>
              ) : !data || data.length === 0 ? (
                <tr><td colSpan={8}><EmptyState message="No collisions recorded" /></td></tr>
              ) : (
                data.map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{c.collisionDateFormatted}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{c.vehicleVrm}</td>
                    <td className="px-4 py-3 text-slate-600">{c.driverName || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-slate-600">{c.fault || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.insurer || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.insurerReference || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{c.description || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PenaltiesTab({ companyId }: { companyId: number }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", driverId: "", companyId: companyId, pcnReference: "", penaltyType: "", penaltyDate: "", amount: "", penaltyStatus: "ISSUED", paid: false, authority: "", notes: "" });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-mgmt-penalties", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/penalties?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch penalties");
      return res.json();
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/manager/vehicles/penalties", {
        ...form,
        vehicleId: Number(form.vehicleId),
        driverId: form.driverId ? Number(form.driverId) : null,
        companyId,
        amount: form.amount ? Number(form.amount) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-mgmt-penalties"] });
      setShowForm(false);
      setForm({ vehicleId: "", driverId: "", companyId, pcnReference: "", penaltyType: "", penaltyDate: "", amount: "", penaltyStatus: "ISSUED", paid: false, authority: "", notes: "" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
          data-testid="button-add-penalty">
          <Plus className="h-4 w-4" /> Add Penalty
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">New Penalty Record</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input type="number" placeholder="Vehicle ID" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-penalty-vehicle-id" />
            <input type="number" placeholder="Driver ID (optional)" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-penalty-driver-id" />
            <input type="text" placeholder="PCN Reference" value={form.pcnReference} onChange={(e) => setForm({ ...form, pcnReference: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-penalty-pcn-ref" />
            <input type="text" placeholder="Penalty Type" value={form.penaltyType} onChange={(e) => setForm({ ...form, penaltyType: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-penalty-type" />
            <input type="date" value={form.penaltyDate} onChange={(e) => setForm({ ...form, penaltyDate: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-penalty-date" />
            <input type="number" placeholder="Amount (£)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-penalty-amount" />
            <input type="text" placeholder="Authority" value={form.authority} onChange={(e) => setForm({ ...form, authority: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-penalty-authority" />
            <input type="text" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" data-testid="input-penalty-notes" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50" data-testid="button-cancel-penalty">Cancel</button>
            <button onClick={() => createMutation.mutate()} disabled={!form.vehicleId || !form.penaltyDate || createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              data-testid="button-submit-penalty">
              {createMutation.isPending ? "Saving..." : "Save Penalty"}
            </button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-penalties">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Registration</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Driver</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">PCN Ref</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Paid</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Authority</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-8"><LoadingSkeleton /></td></tr>
              ) : !data || data.length === 0 ? (
                <tr><td colSpan={9}><EmptyState message="No penalties recorded" /></td></tr>
              ) : (
                data.map((p: any) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{p.penaltyDateFormatted}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{p.vehicleVrm}</td>
                    <td className="px-4 py-3 text-slate-600">{p.driverName || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.pcnReference || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.penaltyType || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.amount ? `£${Number(p.amount).toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.penaltyStatus} /></td>
                    <td className="px-4 py-3">
                      {p.paid ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Yes</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.authority || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FuelPurchasesTab({ companyId }: { companyId: number }) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [includeDiscarded, setIncludeDiscarded] = useState(false);

  const params = new URLSearchParams({ companyId: String(companyId), page: String(page), perPage: String(perPage) });
  if (search) params.set("search", search);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (includeDiscarded) params.set("includeDiscarded", "true");

  const { data, isLoading } = useQuery({
    queryKey: ["fuel-purchases", companyId, page, perPage, search, startDate, endDate, includeDiscarded],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/fuel-purchases?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch fuel purchases");
      return res.json();
    },
    enabled: !!companyId,
  });

  const exportCsv = () => {
    if (!data?.purchases?.length) return;
    const headers = ["Card Number", "Transaction Date", "Card Registration", "Transaction Registration", "Transaction Odometer", "Product", "Quantity", "Gross", "VAT", "Net"];
    const rows = data.purchases.map((p: any) => [
      "", p.transactionDate, p.cardRegistration, p.transactionRegistration, p.transactionOdometer, p.product, p.quantity, p.gross, p.vat, p.net,
    ]);
    const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuel-purchases-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const purchases = data?.purchases || [];
  const pagination = data?.pagination || { page: 1, perPage: 10, total: 0, totalPages: 0 };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Fuel Purchases</h3>
          <button
            onClick={exportCsv}
            disabled={!purchases.length}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4" />
            Export As CSV
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Transactions between</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="dd/mm/yyyy"
                data-testid="input-fuel-start-date"
              />
              <span className="text-sm text-slate-500">and</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="dd/mm/yyyy"
                data-testid="input-fuel-end-date"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer pb-2">
            <input
              type="checkbox"
              checked={includeDiscarded}
              onChange={(e) => { setIncludeDiscarded(e.target.checked); setPage(1); }}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              data-testid="checkbox-include-discarded"
            />
            Include purchases on discarded vehicles
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              data-testid="select-fuel-per-page"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-sm text-slate-500">entries per page</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-56"
              data-testid="input-fuel-search"
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : purchases.length === 0 ? (
          <EmptyState message="No fuel purchases found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-fuel-purchases">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th className="px-3 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Card Number</th>
                    <th className="px-3 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Transaction Date</th>
                    <th className="px-3 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Card Registration</th>
                    <th className="px-3 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Transaction Registration</th>
                    <th className="px-3 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Transaction Odometer</th>
                    <th className="px-3 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Product</th>
                    <th className="px-3 py-2.5 text-right font-medium text-xs uppercase tracking-wider">Quantity</th>
                    <th className="px-3 py-2.5 text-right font-medium text-xs uppercase tracking-wider">Gross</th>
                    <th className="px-3 py-2.5 text-right font-medium text-xs uppercase tracking-wider">VAT</th>
                    <th className="px-3 py-2.5 text-right font-medium text-xs uppercase tracking-wider">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.map((p: any, idx: number) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50 transition-colors" data-testid={`row-fuel-purchase-${p.id || idx}`}>
                      <td className="px-3 py-3 text-slate-500"></td>
                      <td className="px-3 py-3 text-slate-700">{p.transactionDate}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">{p.cardRegistration}</td>
                      <td className="px-3 py-3 text-slate-700">{p.transactionRegistration}</td>
                      <td className="px-3 py-3 text-slate-700">{p.transactionOdometer?.toLocaleString()}</td>
                      <td className="px-3 py-3 text-slate-700">{p.product}</td>
                      <td className="px-3 py-3 text-right text-slate-700">{p.quantity}</td>
                      <td className="px-3 py-3 text-right text-slate-700">{p.gross}</td>
                      <td className="px-3 py-3 text-right text-slate-700">{p.vat}</td>
                      <td className="px-3 py-3 text-right text-slate-700">{p.net}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Showing {(pagination.page - 1) * pagination.perPage + 1} to {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} entries
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-fuel-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-slate-600 px-3">Page {pagination.page} of {pagination.totalPages}</span>
                  <button
                    onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                    disabled={page >= pagination.totalPages}
                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-fuel-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function VehicleManagement() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const company = session.getCompany();
  const companyId = company?.id;

  if (!companyId) {
    return (
      <ManagerLayout>
        <div className="text-center py-16">
          <p className="text-slate-500">Please log in to access vehicle management.</p>
        </div>
      </ManagerLayout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab companyId={companyId} />;
      case "list": return <VehicleListTab companyId={companyId} />;
      case "safety-checks": return <SafetyChecksTab companyId={companyId} />;
      case "defects": return <DefectsTab companyId={companyId} />;
      case "pending-defects": return <PendingDefectsTab companyId={companyId} />;
      case "maintenance": return <MaintenanceTab companyId={companyId} />;
      case "services-due": return <ServicesDueTab companyId={companyId} />;
      case "mots-due": return <MotsDueTab companyId={companyId} />;
      case "vor": return <VorTab companyId={companyId} />;
      case "tax-due": return <TaxDueTab companyId={companyId} />;
      case "sorn": return <SornTab companyId={companyId} />;
      case "collisions": return <CollisionsTab companyId={companyId} />;
      case "penalties": return <PenaltiesTab companyId={companyId} />;
      case "fuel-purchases": return <FuelPurchasesTab companyId={companyId} />;
      default: return null;
    }
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <CarFront className="h-7 w-7 text-slate-700" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-vehicle-management-title">Vehicle Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Comprehensive fleet vehicle oversight</p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 px-6 scrollbar-hide" data-testid="tab-bar">
          <div className="flex gap-1 min-w-max border-b border-slate-200 pb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-white text-blue-600 border border-slate-200 border-b-white -mb-px shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div data-testid={`tab-content-${activeTab}`}>
          {renderTabContent()}
        </div>
      </div>
    </ManagerLayout>
  );
}