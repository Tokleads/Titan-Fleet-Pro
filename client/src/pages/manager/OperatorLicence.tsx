import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { Truck, Plus, X, Trash2, AlertTriangle, ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { VehicleDetailModal } from "@/components/VehicleDetailModal";

const TRAFFIC_AREAS = [
  "North Eastern",
  "North Western",
  "West Midlands",
  "East of England",
  "Western",
  "South Eastern & Metropolitan",
  "Scottish",
  "Welsh",
];

const LICENCE_TYPES = [
  "Standard National",
  "Standard International",
  "Restricted",
];

interface OperatorLicenceData {
  id: number;
  companyId: number;
  licenceNumber: string;
  trafficArea: string;
  licenceType: string;
  vehicleCategory: string;
  inForceFrom: string | null;
  reviewDate: string | null;
  authorisedVehicles: number;
  authorisedTrailers: number;
  safetyInspectionFrequency: string | null;
  notes: string | null;
  active: boolean;
  actualVehicles: number;
  actualTrailers: number;
}

interface LicenceFormData {
  licenceNumber: string;
  trafficArea: string;
  licenceType: string;
  vehicleCategory: string;
  inForceFrom: string;
  reviewDate: string;
  authorisedVehicles: number;
  authorisedTrailers: number;
}

interface VehicleAssignment {
  id: number;
  vehicleId: number;
  assignedAt: string;
  vrm: string;
  make: string;
  model: string;
}

const emptyForm: LicenceFormData = {
  licenceNumber: "",
  trafficArea: "",
  licenceType: "",
  vehicleCategory: "HGV",
  inForceFrom: "",
  reviewDate: "",
  authorisedVehicles: 0,
  authorisedTrailers: 0,
};

function LicenceFormFields({ data, setData }: { data: LicenceFormData; setData: (d: LicenceFormData) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Licence Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="licenceNumber">Licence Number *</Label>
            <Input
              id="licenceNumber"
              data-testid="input-licence-number"
              placeholder="e.g. OD1234567"
              value={data.licenceNumber}
              onChange={(e) => setData({ ...data, licenceNumber: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Traffic Area *</Label>
            <Select value={data.trafficArea} onValueChange={(v) => setData({ ...data, trafficArea: v })}>
              <SelectTrigger data-testid="select-traffic-area">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {TRAFFIC_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Licence Type *</Label>
            <Select value={data.licenceType} onValueChange={(v) => setData({ ...data, licenceType: v })}>
              <SelectTrigger data-testid="select-licence-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {LICENCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Vehicle Category *</Label>
            <Select value={data.vehicleCategory} onValueChange={(v) => setData({ ...data, vehicleCategory: v })}>
              <SelectTrigger data-testid="select-vehicle-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HGV">HGV</SelectItem>
                <SelectItem value="PSV">PSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inForceFrom">In Force From</Label>
            <Input
              id="inForceFrom"
              data-testid="input-in-force-from"
              type="date"
              value={data.inForceFrom}
              onChange={(e) => setData({ ...data, inForceFrom: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reviewDate">Review Date</Label>
            <Input
              id="reviewDate"
              data-testid="input-review-date"
              type="date"
              value={data.reviewDate}
              onChange={(e) => setData({ ...data, reviewDate: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Assignment Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="authorisedVehicles">Authorised Vehicles</Label>
            <Input
              id="authorisedVehicles"
              data-testid="input-authorised-vehicles"
              type="number"
              min={0}
              value={data.authorisedVehicles}
              onChange={(e) => setData({ ...data, authorisedVehicles: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="authorisedTrailers">Authorised Trailers</Label>
            <Input
              id="authorisedTrailers"
              data-testid="input-authorised-trailers"
              type="number"
              min={0}
              value={data.authorisedTrailers}
              onChange={(e) => setData({ ...data, authorisedTrailers: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleAssignmentPanel({
  licenceId,
  companyId,
  onVehicleClick,
}: {
  licenceId: number;
  companyId: number;
  onVehicleClick: (id: number) => void;
}) {
  const queryClient = useQueryClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  const { data: assignments = [] } = useQuery<VehicleAssignment[]>({
    queryKey: ["licence-vehicles", licenceId],
    queryFn: async () => {
      const res = await fetch(`/api/operator-licences/${licenceId}/vehicles`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
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

  const allVehicles = Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData?.vehicles || []);
  const assignedIds = new Set(assignments.map((a) => a.vehicleId));
  const availableVehicles = allVehicles.filter((v: any) => v.active && !assignedIds.has(v.id));

  const assignMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      const res = await fetch(`/api/operator-licences/${licenceId}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });
      if (!res.ok) throw new Error("Failed to assign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licence-vehicles", licenceId] });
      queryClient.invalidateQueries({ queryKey: ["operator-licences"] });
      queryClient.invalidateQueries({ queryKey: ["unassigned-count"] });
      setSelectedVehicleId("");
      toast.success("Vehicle assigned to licence");
    },
    onError: () => toast.error("Failed to assign vehicle"),
  });

  const removeMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      const res = await fetch(`/api/operator-licence-vehicles/${assignmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licence-vehicles", licenceId] });
      queryClient.invalidateQueries({ queryKey: ["operator-licences"] });
      queryClient.invalidateQueries({ queryKey: ["unassigned-count"] });
      toast.success("Vehicle removed from licence");
    },
    onError: () => toast.error("Failed to remove vehicle"),
  });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">Assigned Vehicles ({assignments.length})</h3>
      <div className="flex gap-2">
        <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
          <SelectTrigger className="flex-1" data-testid="select-assign-vehicle">
            <SelectValue placeholder="Select a vehicle to assign..." />
          </SelectTrigger>
          <SelectContent>
            {availableVehicles.map((v: any) => (
              <SelectItem key={v.id} value={String(v.id)}>
                {v.vrm} — {v.make} {v.model}
              </SelectItem>
            ))}
            {availableVehicles.length === 0 && (
              <SelectItem value="none" disabled>No available vehicles</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!selectedVehicleId || assignMutation.isPending}
          onClick={() => assignMutation.mutate(Number(selectedVehicleId))}
          data-testid="button-assign-vehicle"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {assignments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No vehicles assigned to this licence</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/60" data-testid={`vehicle-assignment-${a.vehicleId}`}>
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-slate-400" />
                <div>
                  <button
                    onClick={() => onVehicleClick(a.vehicleId)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    data-testid={`link-vehicle-${a.vehicleId}`}
                  >
                    {a.vrm}
                  </button>
                  <p className="text-xs text-slate-500">{a.make} {a.model}</p>
                </div>
              </div>
              <button
                onClick={() => removeMutation.mutate(a.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                data-testid={`button-remove-vehicle-${a.vehicleId}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OperatorLicence() {
  const company = session.getCompany();
  const companyId = company?.id;
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLicence, setEditingLicence] = useState<OperatorLicenceData | null>(null);
  const [selectedLicenceId, setSelectedLicenceId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const assignmentsPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedLicenceId && assignmentsPanelRef.current) {
      setTimeout(() => {
        assignmentsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedLicenceId]);
  const [formData, setFormData] = useState<LicenceFormData>({ ...emptyForm });

  const { data: licences = [], isLoading } = useQuery<OperatorLicenceData[]>({
    queryKey: ["operator-licences", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/operator-licences/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: unassignedData } = useQuery<{ count: number; total: number }>({
    queryKey: ["unassigned-count", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/operator-licences/unassigned-count/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: LicenceFormData) => {
      const payload: any = {
        companyId,
        licenceNumber: data.licenceNumber,
        trafficArea: data.trafficArea,
        licenceType: data.licenceType,
        vehicleCategory: data.vehicleCategory,
        authorisedVehicles: data.authorisedVehicles,
        authorisedTrailers: data.authorisedTrailers,
      };
      if (data.inForceFrom) payload.inForceFrom = new Date(data.inForceFrom).toISOString();
      if (data.reviewDate) payload.reviewDate = new Date(data.reviewDate).toISOString();

      const res = await fetch("/api/operator-licences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator-licences"] });
      queryClient.invalidateQueries({ queryKey: ["unassigned-count"] });
      setIsAddOpen(false);
      setFormData({ ...emptyForm });
      toast.success("Operator licence created");
    },
    onError: () => toast.error("Failed to create licence"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: LicenceFormData }) => {
      const payload: any = {
        licenceNumber: data.licenceNumber,
        trafficArea: data.trafficArea,
        licenceType: data.licenceType,
        vehicleCategory: data.vehicleCategory,
        authorisedVehicles: data.authorisedVehicles,
        authorisedTrailers: data.authorisedTrailers,
      };
      if (data.inForceFrom) payload.inForceFrom = new Date(data.inForceFrom).toISOString();
      if (data.reviewDate) payload.reviewDate = new Date(data.reviewDate).toISOString();

      const res = await fetch(`/api/operator-licences/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator-licences"] });
      setEditingLicence(null);
      setFormData({ ...emptyForm });
      toast.success("Licence updated");
    },
    onError: () => toast.error("Failed to update licence"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/operator-licences/${id}?companyId=${companyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator-licences"] });
      queryClient.invalidateQueries({ queryKey: ["unassigned-count"] });
      setSelectedLicenceId(null);
      toast.success("Licence deleted");
    },
    onError: () => toast.error("Failed to delete licence"),
  });

  const openEdit = (licence: OperatorLicenceData) => {
    setEditingLicence(licence);
    setFormData({
      licenceNumber: licence.licenceNumber,
      trafficArea: licence.trafficArea,
      licenceType: licence.licenceType,
      vehicleCategory: licence.vehicleCategory,
      inForceFrom: licence.inForceFrom ? new Date(licence.inForceFrom).toISOString().split("T")[0] : "",
      reviewDate: licence.reviewDate ? new Date(licence.reviewDate).toISOString().split("T")[0] : "",
      authorisedVehicles: licence.authorisedVehicles,
      authorisedTrailers: licence.authorisedTrailers,
    });
  };

  const isFormValid = formData.licenceNumber && formData.trafficArea && formData.licenceType;

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Operator Licence</h1>
          <p className="mt-0.5 text-sm text-slate-500">Manage your operator licences and vehicle assignments</p>
        </div>

        {unassignedData && unassignedData.count > 0 && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl" data-testid="alert-unassigned-vehicles">
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <Truck className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">
                {unassignedData.count} Vehicle{unassignedData.count !== 1 ? "s" : ""} without an Operator Licence or Operating Centre
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {unassignedData.count} of {unassignedData.total} active vehicles are not assigned to any operator licence
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200/60 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900" data-testid="text-licences-heading">Operator Licences</h2>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => { setFormData({ ...emptyForm }); setIsAddOpen(true); }}
              data-testid="button-add-licence"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Licence
            </Button>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-slate-500 mt-3">Loading licences...</p>
            </div>
          ) : licences.length === 0 ? (
            <div className="p-12 text-center" data-testid="empty-licences">
              <AlertTriangle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">No operator licences found</p>
              <p className="text-xs text-slate-400 mt-1">Add your first operator licence to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-licences">
                <thead>
                  <tr className="bg-red-700 text-white">
                    <th className="text-left text-xs font-semibold uppercase tracking-wider px-5 py-3">Licence Number</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider px-5 py-3">Area</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider px-5 py-3">Type</th>
                    <th className="text-center text-xs font-semibold uppercase tracking-wider px-5 py-3">Auth. Vehicles</th>
                    <th className="text-center text-xs font-semibold uppercase tracking-wider px-5 py-3">Actual Vehicles</th>
                    <th className="text-center text-xs font-semibold uppercase tracking-wider px-5 py-3">Auth. Trailers</th>
                    <th className="text-center text-xs font-semibold uppercase tracking-wider px-5 py-3">Actual Trailers</th>
                    <th className="text-center text-xs font-semibold uppercase tracking-wider px-5 py-3">OCRS</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {licences.map((licence) => {
                    const isOverVehicles = licence.actualVehicles > licence.authorisedVehicles;
                    const isOverTrailers = licence.actualTrailers > licence.authorisedTrailers;
                    return (
                      <tr
                        key={licence.id}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedLicenceId === licence.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""}`}
                        onClick={() => setSelectedLicenceId(selectedLicenceId === licence.id ? null : licence.id)}
                        data-testid={`row-licence-${licence.id}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {selectedLicenceId === licence.id
                              ? <ChevronDown className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              : <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            }
                            <span className="text-sm font-semibold text-slate-900">{licence.licenceNumber}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(licence); }}
                              className="ml-1 p-1 rounded-md hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Edit licence"
                              data-testid={`button-inline-edit-${licence.id}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{licence.trafficArea}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                            {licence.licenceType}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-sm font-medium text-slate-700">{licence.authorisedVehicles}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`text-sm font-semibold ${isOverVehicles ? "text-red-600" : "text-emerald-600"}`}>
                            {licence.actualVehicles}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-sm font-medium text-slate-700">{licence.authorisedTrailers}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`text-sm font-semibold ${isOverTrailers ? "text-red-600" : "text-emerald-600"}`}>
                            {licence.actualTrailers}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            Green
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); openEdit(licence); }}
                              data-testid={`button-edit-licence-${licence.id}`}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Delete this licence and all vehicle assignments?")) {
                                  deleteMutation.mutate(licence.id);
                                }
                              }}
                              data-testid={`button-delete-licence-${licence.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedLicenceId && companyId && (
          <div ref={assignmentsPanelRef} className="bg-white rounded-xl border border-blue-200 shadow-md p-5 ring-2 ring-blue-100" data-testid="panel-vehicle-assignments">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Vehicle Assignments — {licences.find((l) => l.id === selectedLicenceId)?.licenceNumber}
              </h2>
              <button
                onClick={() => setSelectedLicenceId(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                data-testid="button-close-assignments"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <VehicleAssignmentPanel
              licenceId={selectedLicenceId}
              companyId={companyId}
              onVehicleClick={(id) => setSelectedVehicleId(id)}
            />
          </div>
        )}

        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) setFormData({ ...emptyForm }); }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Operator Licence</DialogTitle>
            </DialogHeader>
            <LicenceFormFields data={formData} setData={setFormData} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)} data-testid="button-cancel-add">Cancel</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!isFormValid || createMutation.isPending}
                onClick={() => createMutation.mutate(formData)}
                data-testid="button-submit-add"
              >
                {createMutation.isPending ? "Creating..." : "Create Licence"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingLicence} onOpenChange={(open) => { if (!open) { setEditingLicence(null); setFormData({ ...emptyForm }); } }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Operator Licence</DialogTitle>
            </DialogHeader>
            <LicenceFormFields data={formData} setData={setFormData} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingLicence(null)} data-testid="button-cancel-edit">Cancel</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!isFormValid || updateMutation.isPending}
                onClick={() => editingLicence && updateMutation.mutate({ id: editingLicence.id, data: formData })}
                data-testid="button-submit-edit"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedVehicleId && (
          <VehicleDetailModal
            vehicleId={selectedVehicleId}
            onClose={() => setSelectedVehicleId(null)}
          />
        )}
      </div>
    </ManagerLayout>
  );
}
