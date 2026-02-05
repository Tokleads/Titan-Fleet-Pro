import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  UserX
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
    startTime: string;
    endTime?: string;
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
        <Label htmlFor={isEdit ? "edit-pin" : "pin"}>Driver PIN (4 digits) *</Label>
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowPinToggle(!showPinToggle)}
            data-testid={isEdit ? "button-toggle-edit-pin" : "button-toggle-pin"}
          >
            {showPinToggle ? (
              <EyeOff className="h-4 w-4 text-slate-400" />
            ) : (
              <Eye className="h-4 w-4 text-slate-400" />
            )}
          </Button>
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

export default function Drivers() {
  const company = session.getCompany();
  const companyId = company?.id;
  const queryClient = useQueryClient();
  
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
      const res = await fetch(`/api/drivers?companyId=${companyId}`);
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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

    const now = new Date();
    const shiftStart = new Date(driver.currentShift.startTime);
    const timeUntilShift = (shiftStart.getTime() - now.getTime()) / (1000 * 60);

    if (timeUntilShift > 0 && timeUntilShift <= 60) {
      return { status: "starting", label: "Starting Soon", color: "bg-amber-500" };
    }

    if (driver.currentShift.endTime) {
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
                  disabled={!newDriver.name || !newDriver.email || newDriver.pin.length !== 4 || addDriverMutation.isPending}
                  data-testid="button-submit-add-driver"
                >
                  {addDriverMutation.isPending ? "Adding..." : "Add Driver"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
        ) : filteredDrivers.length === 0 ? (
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
            {filteredDrivers.map((driver) => {
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
                          <h3 className="font-semibold text-slate-900">{driver.name}</h3>
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
                            {driver.assignedVehicle.vrm} • {driver.assignedVehicle.make}
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
                    {driver.currentShift && status.status !== "off" && status.status !== "inactive" && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          Shift: {new Date(driver.currentShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {driver.currentShift.endTime && ` - ${new Date(driver.currentShift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
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
    </ManagerLayout>
  );
}
