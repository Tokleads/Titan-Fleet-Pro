import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { 
  UserPlus, 
  Search,
  MapPin,
  Clock,
  Truck,
  Phone,
  Mail,
  Edit2,
  Trash2,
  MoreVertical,
  Eye,
  EyeOff,
  UserX,
  X,
  Shield,
  LogOut,
  Activity,
  User,
  Download,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { VehicleDetailModal } from "@/components/VehicleDetailModal";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

interface Driver {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  pin?: string;
  phone?: string;
  licenseNumber?: string;
  currentLocation?: {
    latitude: string;
    longitude: string;
    timestamp: string;
  };
  assignedVehicle?: {
    id: number;
    vrm: string;
    make: string;
    model: string;
  };
  currentShift?: {
    id: number;
    depotName: string;
    arrivalTime: string;
    status: string;
  };
}

interface DriverFormData {
  name: string;
  email: string;
  phone: string;
  pin: string;
  licenseNumber: string;
  role: string;
  active: boolean;
}

const ROLE_OPTIONS = [
  { value: "DRIVER", label: "Driver" },
  { value: "TRANSPORT_MANAGER", label: "Transport Manager" },
  { value: "ADMIN", label: "Admin" },
];

function DriverForm({ 
  data, 
  setData, 
  showPinToggle, 
  setShowPinToggle,
  isEdit = false 
}: { 
  data: DriverFormData; 
  setData: (data: DriverFormData) => void;
  showPinToggle: boolean;
  setShowPinToggle: (show: boolean) => void;
  isEdit?: boolean;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-name" : "name"}>Full Name *</Label>
        <Input
          id={isEdit ? "edit-name" : "name"}
          data-testid={isEdit ? "input-edit-driver-name" : "input-driver-name"}
          placeholder="John Smith"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-email" : "email"}>Email Address *</Label>
        <Input
          id={isEdit ? "edit-email" : "email"}
          data-testid={isEdit ? "input-edit-driver-email" : "input-driver-email"}
          type="email"
          placeholder="john.smith@example.com"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-phone" : "phone"}>Phone Number</Label>
        <Input
          id={isEdit ? "edit-phone" : "phone"}
          data-testid={isEdit ? "input-edit-driver-phone" : "input-driver-phone"}
          type="tel"
          placeholder="+44 7700 900000"
          value={data.phone}
          onChange={(e) => setData({ ...data, phone: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-role" : "role"}>Role *</Label>
        <Select
          value={data.role}
          onValueChange={(value) => setData({ ...data, role: value })}
        >
          <SelectTrigger data-testid={isEdit ? "select-edit-driver-role" : "select-driver-role"}>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-pin" : "pin"}>Driver PIN (4 digits) {isEdit ? "*" : "(auto-generated if blank)"}</Label>
        <div className="relative">
          <Input
            id={isEdit ? "edit-pin" : "pin"}
            data-testid={isEdit ? "input-edit-driver-pin" : "input-driver-pin"}
            type={showPinToggle ? "text" : "password"}
            maxLength={4}
            placeholder="••••"
            value={data.pin}
            onChange={(e) => setData({ ...data, pin: e.target.value.replace(/\D/g, '') })}
            className="pr-10"
          />
          <button
            type="button"
            className="absolute right-0 top-0 h-full px-3 flex items-center justify-center cursor-pointer z-10"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPinToggle(!showPinToggle); }}
            data-testid={isEdit ? "button-toggle-edit-pin" : "button-toggle-pin"}
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            {showPinToggle ? (
              <EyeOff className="h-5 w-5 text-slate-500" />
            ) : (
              <Eye className="h-5 w-5 text-slate-500" />
            )}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-license" : "license"}>License Number</Label>
        <Input
          id={isEdit ? "edit-license" : "license"}
          data-testid={isEdit ? "input-edit-driver-license" : "input-driver-license"}
          placeholder="SMITH123456AB7CD"
          value={data.licenseNumber}
          onChange={(e) => setData({ ...data, licenseNumber: e.target.value })}
        />
      </div>
      {isEdit && (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div>
            <Label htmlFor="active-toggle" className="font-medium">Active Status</Label>
            <p className="text-sm text-slate-500">Inactive drivers cannot log in</p>
          </div>
          <Switch
            id="active-toggle"
            data-testid="switch-driver-active"
            checked={data.active}
            onCheckedChange={(checked) => setData({ ...data, active: checked })}
          />
        </div>
      )}
    </div>
  );
}

interface ActiveTimesheet {
  id: number;
  driverId: number;
  depotName: string;
  arrivalTime: string;
  departureTime: string | null;
  status: string;
  totalMinutes: number | null;
}

function DriverProfileModal({
  driver,
  onClose,
  companyId,
  onVehicleClick,
}: {
  driver: Driver;
  onClose: () => void;
  companyId: number;
  onVehicleClick: (vehicleId: number) => void;
}) {
  const queryClient = useQueryClient();

  const { data: timesheetData } = useQuery<{ timesheet: ActiveTimesheet | null }>({
    queryKey: ["active-timesheet", driver.id],
    queryFn: async () => {
      const res = await fetch(`/api/timesheets/active/${driver.id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch timesheet");
      return res.json();
    },
  });

  const [showClockInForm, setShowClockInForm] = useState(false);
  const [selectedDepotId, setSelectedDepotId] = useState<number | undefined>();
  const [manualDepotName, setManualDepotName] = useState("Manual Clock-In");

  const { data: depots } = useQuery<any[]>({
    queryKey: ["geofences", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/geofences/${companyId}`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/manager/clock-out-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ driverId: driver.id, companyId, managerId: session.getUser()?.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to clock out driver");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(`${driver.name} has been clocked out`);
      queryClient.invalidateQueries({ queryKey: ["active-timesheet", driver.id] });
      queryClient.invalidateQueries({ queryKey: ["drivers", companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async (data: { depotId?: number; depotName?: string }) => {
      const res = await fetch("/api/manager/clock-in-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ 
          driverId: driver.id, 
          companyId,
          managerId: session.getUser()?.id,
          depotId: data.depotId,
          depotName: data.depotName || "Manual Clock-In"
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to clock in driver");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(`${driver.name} has been clocked in`);
      queryClient.invalidateQueries({ queryKey: ["active-timesheet", driver.id] });
      queryClient.invalidateQueries({ queryKey: ["drivers", companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const activeTimesheet = timesheetData?.timesheet;
  const isOnShift = !!activeTimesheet && activeTimesheet.status === "ACTIVE";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" data-testid="driver-profile-modal">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl border border-slate-200/80 shadow-2xl overflow-hidden">
        <div className={`h-2 ${isOnShift ? "bg-emerald-500" : "bg-slate-400"}`} />

        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900" data-testid="modal-driver-name">{driver.name}</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${isOnShift ? "bg-emerald-500" : "bg-slate-400"}`}>
                  <div className={`h-1.5 w-1.5 rounded-full bg-white ${isOnShift ? "animate-pulse" : ""}`} />
                  {isOnShift ? "On Shift" : "Off Shift"}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" data-testid="button-close-profile-modal">
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-700" data-testid="modal-driver-email">{driver.email}</span>
            </div>
            {driver.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-700" data-testid="modal-driver-phone">{driver.phone}</span>
              </div>
            )}
            {driver.licenseNumber && (
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-700" data-testid="modal-driver-license">License: {driver.licenseNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs" data-testid="modal-driver-role">
                {ROLE_OPTIONS.find(r => r.value === driver.role)?.label || driver.role}
              </span>
            </div>
          </div>

          {isOnShift && activeTimesheet && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-4" data-testid="modal-shift-info">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">Current Shift</span>
              </div>
              <div className="space-y-1 text-sm text-emerald-700">
                <p>Started: {new Date(activeTimesheet.arrivalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                <p>Depot: {activeTimesheet.depotName}</p>
              </div>
            </div>
          )}

          {driver.assignedVehicle && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 mb-4" data-testid="modal-assigned-vehicle">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Assigned Vehicle</span>
              </div>
              <button
                onClick={() => { onClose(); onVehicleClick(driver.assignedVehicle!.id); }}
                className="mt-1 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                data-testid="modal-vehicle-vrm"
              >
                {driver.assignedVehicle.vrm}
              </button>
              <span className="text-sm text-slate-500 ml-2">{driver.assignedVehicle.make} {driver.assignedVehicle.model}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 mb-5" data-testid="modal-recent-activity">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Recent Activity</span>
            </div>
            <p className="text-xs text-slate-400">Activity summary coming soon</p>
          </div>

          {isOnShift ? (
            <Button
              onClick={() => {
                if (confirm(`Are you sure you want to clock out ${driver.name}?`)) {
                  clockOutMutation.mutate();
                }
              }}
              disabled={clockOutMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-clock-out-driver"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {clockOutMutation.isPending ? "Clocking Out..." : "Clock Out Driver"}
            </Button>
          ) : driver.active && (
            <div className="space-y-3">
              {!showClockInForm ? (
                <Button
                  onClick={() => setShowClockInForm(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  data-testid="button-clock-in-driver"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Clock In Driver
                </Button>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">Manual Clock In</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">Select Depot (optional)</label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={selectedDepotId || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setSelectedDepotId(Number(val));
                          const depot = depots?.find((d: any) => d.id === Number(val));
                          if (depot) setManualDepotName(depot.name);
                        } else {
                          setSelectedDepotId(undefined);
                          setManualDepotName("Manual Clock-In");
                        }
                      }}
                      data-testid="select-clock-in-depot"
                    >
                      <option value="">No depot (Manual Clock-In)</option>
                      {depots?.map((depot: any) => (
                        <option key={depot.id} value={depot.id}>{depot.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        clockInMutation.mutate({
                          depotId: selectedDepotId,
                          depotName: manualDepotName,
                        });
                        setShowClockInForm(false);
                      }}
                      disabled={clockInMutation.isPending}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      data-testid="button-confirm-clock-in"
                    >
                      {clockInMutation.isPending ? "Clocking In..." : "Confirm Clock In"}
                    </Button>
                    <Button
                      onClick={() => setShowClockInForm(false)}
                      variant="outline"
                      className="px-4"
                      data-testid="button-cancel-clock-in"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Drivers() {
  const company = session.getCompany();
  const companyId = company?.id;
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [profileDriver, setProfileDriver] = useState<Driver | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [showEditPin, setShowEditPin] = useState(false);
  
  const [newDriver, setNewDriver] = useState<DriverFormData>({
    name: "",
    email: "",
    phone: "",
    pin: "",
    licenseNumber: "",
    role: "DRIVER",
    active: true,
  });

  const [editDriver, setEditDriver] = useState<DriverFormData>({
    name: "",
    email: "",
    phone: "",
    pin: "",
    licenseNumber: "",
    role: "DRIVER",
    active: true,
  });

  // Fetch drivers
  const { data: drivers, isLoading } = useQuery<Driver[]>({
    queryKey: ["drivers", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/drivers?companyId=${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch drivers");
      return res.json();
    },
    enabled: !!companyId,
  });

  // Add driver mutation
  const addDriverMutation = useMutation({
    mutationFn: async (driver: DriverFormData) => {
      const payload = {
        ...driver,
        companyId,
      };
      console.log("Adding driver with payload:", payload);
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add driver");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers", companyId] });
      setIsAddDialogOpen(false);
      setNewDriver({ name: "", email: "", phone: "", pin: "", licenseNumber: "", role: "DRIVER", active: true });
      setShowPin(false);
      toast.success("Driver added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add driver");
    },
  });

  // Update driver mutation
  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, driver }: { id: number; driver: Partial<DriverFormData> }) => {
      const res = await fetch(`/api/drivers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          ...driver,
          companyId,
        }),
      });
      if (!res.ok) throw new Error("Failed to update driver");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers", companyId] });
      setIsEditDialogOpen(false);
      setEditingDriver(null);
      setShowEditPin(false);
      toast.success("Driver updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update driver");
    },
  });

  // Delete driver mutation
  const deleteDriverMutation = useMutation({
    mutationFn: async (driverId: number) => {
      const res = await fetch(`/api/drivers/${driverId}?companyId=${companyId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete driver");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers", companyId] });
      toast.success("Driver deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete driver");
    },
  });

  // Open edit dialog
  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setEditDriver({
      name: driver.name,
      email: driver.email,
      phone: driver.phone || "",
      pin: driver.pin || "",
      licenseNumber: driver.licenseNumber || "",
      role: driver.role,
      active: driver.active,
    });
    setShowEditPin(false);
    setIsEditDialogOpen(true);
  };

  // Determine driver status
  const getDriverStatus = (driver: Driver) => {
    if (!driver.active) {
      return { status: "inactive", label: "Inactive", color: "bg-red-400" };
    }
    
    if (!driver.currentShift) {
      return { status: "off", label: "Off Shift", color: "bg-slate-400" };
    }

    if (driver.currentShift.status === "COMPLETED") {
      return { status: "off", label: "Off Shift", color: "bg-slate-400" };
    }

    return { status: "active", label: "On Shift", color: "bg-emerald-500" };
  };

  // Filter drivers by search query
  const filteredDrivers = drivers?.filter((driver) =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Group drivers by status
  const activeDrivers = filteredDrivers.filter(d => getDriverStatus(d).status === "active");
  const startingSoonDrivers = filteredDrivers.filter(d => getDriverStatus(d).status === "starting");
  const offShiftDrivers = filteredDrivers.filter(d => getDriverStatus(d).status === "off");
  const inactiveDrivers = filteredDrivers.filter(d => getDriverStatus(d).status === "inactive");

  const sortedDrivers = [
    ...activeDrivers,
    ...startingSoonDrivers,
    ...offShiftDrivers,
    ...inactiveDrivers,
  ];

  const [isExporting, setIsExporting] = useState(false);

  const downloadPinsCsv = async () => {
    const user = session.getUser();
    if (!companyId || !user?.id || !user?.pin) {
      toast.error("Manager verification required");
      return;
    }
    setIsExporting(true);
    try {
      const res = await fetch("/api/drivers/export-pins", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ companyId, managerId: user.id, pin: user.pin }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to export");
      }
      const data: { name: string; email: string; pin: string; role: string; active: boolean }[] = await res.json();
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
      const rows = [
        ["Name", "Email", "PIN", "Role", "Active"],
        ...sorted.map((d) => [
          d.name,
          d.email,
          d.pin || "",
          ROLE_OPTIONS.find((r) => r.value === d.role)?.label || d.role,
          d.active ? "Yes" : "No",
        ]),
      ];
      const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `driver-pins-${session.getCompany()?.companyCode || "company"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Driver PINs exported successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to export PINs");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Drivers</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Manage your driver team and monitor their status
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadPinsCsv} disabled={isExporting} data-testid="button-download-pins">
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Download PINs"}
            </Button>
            <Button variant="outline" onClick={() => navigate('/manager/bulk-upload')} data-testid="button-bulk-upload-drivers">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
          {/* Add Driver Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              setShowPin(false);
              setNewDriver({ name: "", email: "", phone: "", pin: "", licenseNumber: "", role: "DRIVER", active: true });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-driver">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Driver</DialogTitle>
                <DialogDescription>
                  Create a new driver account. They'll be able to log in and start tracking immediately.
                </DialogDescription>
              </DialogHeader>
              <DriverForm 
                data={newDriver} 
                setData={setNewDriver} 
                showPinToggle={showPin}
                setShowPinToggle={setShowPin}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  data-testid="button-cancel-add-driver"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => addDriverMutation.mutate(newDriver)}
                  disabled={!newDriver.name || !newDriver.email || (newDriver.pin.length > 0 && newDriver.pin.length !== 4) || addDriverMutation.isPending}
                  data-testid="button-submit-add-driver"
                >
                  {addDriverMutation.isPending ? "Adding..." : "Add Driver"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Edit Driver Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingDriver(null);
            setShowEditPin(false);
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Driver</DialogTitle>
              <DialogDescription>
                Update driver information and settings.
              </DialogDescription>
            </DialogHeader>
            <DriverForm 
              data={editDriver} 
              setData={setEditDriver} 
              showPinToggle={showEditPin}
              setShowPinToggle={setShowEditPin}
              isEdit
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                data-testid="button-cancel-edit-driver"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingDriver) {
                    updateDriverMutation.mutate({ 
                      id: editingDriver.id, 
                      driver: editDriver 
                    });
                  }
                }}
                disabled={!editDriver.name || !editDriver.email || editDriver.pin.length !== 4 || updateDriverMutation.isPending}
                data-testid="button-submit-edit-driver"
              >
                {updateDriverMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">On Shift</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{activeDrivers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Starting Soon</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{startingSoonDrivers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Off Shift</p>
                <p className="text-2xl font-bold text-slate-600 mt-1">{offShiftDrivers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Inactive</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{inactiveDrivers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search drivers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-drivers"
          />
        </div>

        {/* Driver Cards */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Loading drivers...</div>
        ) : sortedDrivers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200/60">
            <UserPlus className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">No drivers found</p>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-driver">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Your First Driver
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDrivers.map((driver) => {
              const status = getDriverStatus(driver);
              const isInactive = !driver.active;
              return (
                <div
                  key={driver.id}
                  data-testid={`card-driver-${driver.id}`}
                  className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
                    isInactive ? 'border-red-200 opacity-75' : 'border-slate-200/60'
                  }`}
                >
                  {/* Status Bar */}
                  <div className={`h-2 ${status.color}`} />
                  
                  {/* Card Content */}
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                            onClick={() => setProfileDriver(driver)}
                            data-testid={`link-driver-name-${driver.id}`}
                          >{driver.name}</h3>
                          {isInactive && (
                            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${status.color}`}>
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            {status.label}
                          </span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {ROLE_OPTIONS.find(r => r.value === driver.role)?.label || driver.role}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-driver-menu-${driver.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleEditDriver(driver)}
                            data-testid={`button-edit-driver-${driver.id}`}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Driver
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${driver.name}?`)) {
                                deleteDriverMutation.mutate(driver.id);
                              }
                            }}
                            data-testid={`button-delete-driver-${driver.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Driver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{driver.email}</span>
                      </div>
                      {driver.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span>{driver.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Vehicle */}
                    {driver.assignedVehicle && (
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg mb-3">
                        <Truck className="h-4 w-4 text-slate-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-600">Assigned Vehicle</p>
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            <button
                              onClick={(e) => { e.stopPropagation(); if (driver.assignedVehicle?.id) setSelectedVehicleId(driver.assignedVehicle.id); }}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer bg-transparent border-none p-0"
                            >
                              {driver.assignedVehicle.vrm}
                            </button>
                            {' • '}{driver.assignedVehicle.make}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Current Location */}
                    {driver.currentLocation && status.status === "active" && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        <span>
                          Last seen {new Date(driver.currentLocation.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    )}

                    {/* Shift Time */}
                    {driver.currentShift && status.status === "active" && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          Since: {new Date(driver.currentShift.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {driver.currentShift.depotName && driver.currentShift.depotName !== "GPS Location" && ` at ${driver.currentShift.depotName}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {selectedVehicleId && (
        <VehicleDetailModal vehicleId={selectedVehicleId} onClose={() => setSelectedVehicleId(null)} />
      )}
      {profileDriver && companyId && (
        <DriverProfileModal
          driver={profileDriver}
          onClose={() => setProfileDriver(null)}
          companyId={companyId}
          onVehicleClick={(vehicleId) => setSelectedVehicleId(vehicleId)}
        />
      )}
    </ManagerLayout>
  );
}
