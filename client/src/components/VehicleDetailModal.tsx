import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Save,
  LayoutGrid,
  Info,
  Truck,
  Calendar,
  Wrench,
  Gauge,
  Users,
  Package,
  ListChecks,
  AlertTriangle,
  ClipboardList,
  Ban,
  Minus,
  Plus,
  ChevronDown,
  Upload,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface VehicleDetailModalProps {
  vehicleId: number;
  onClose: () => void;
}

type SidebarTab =
  | "overview"
  | "vehicle-details"
  | "hgv"
  | "key-dates"
  | "service-intervals"
  | "odometer"
  | "drivers"
  | "assets"
  | "maintenance"
  | "safety-checks"
  | "defects"
  | "hgv-inspections"
  | "vor-history";

const SIDEBAR_TABS: { id: SidebarTab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "vehicle-details", label: "Vehicle Details", icon: Info },
  { id: "hgv", label: "HGV", icon: Truck },
  { id: "key-dates", label: "Key Dates", icon: Calendar },
  { id: "service-intervals", label: "Service Intervals", icon: Wrench },
  { id: "odometer", label: "Odometer", icon: Gauge },
  { id: "drivers", label: "Drivers", icon: Users },
  { id: "assets", label: "Assets", icon: Package },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "safety-checks", label: "Safety Checks", icon: ListChecks },
  { id: "defects", label: "Defects", icon: AlertTriangle },
  { id: "hgv-inspections", label: "HGV Inspections", icon: ClipboardList },
  { id: "vor-history", label: "VOR History", icon: Ban },
];

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase() || "";
  let cls = "px-2.5 py-1 rounded-full text-xs font-medium ";
  if (["PASS", "ACTIVE", "COMPLETED", "CLOSED", "RECTIFIED", "VERIFIED"].includes(s)) {
    cls += "bg-green-100 text-green-700";
  } else if (["FAIL", "OVERDUE", "CRITICAL", "HIGH", "REJECTED"].includes(s)) {
    cls += "bg-red-100 text-red-700";
  } else if (["PENDING", "IN_PROGRESS", "ASSIGNED", "OPEN", "DEFERRED", "AMBER", "SCHEDULED"].includes(s)) {
    cls += "bg-amber-100 text-amber-700";
  } else {
    cls += "bg-slate-100 text-slate-600";
  }
  return <span className={cls} data-testid={`badge-status-${s.toLowerCase()}`}>{status}</span>;
}

function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200/80 rounded-xl mb-4 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 text-left transition-colors ${open ? 'rounded-t-xl border-b border-slate-200/80' : 'rounded-xl'}`}
        data-testid={`toggle-section-${title.toLowerCase().replace(/\s/g, "-")}`}
      >
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        {open ? <Minus className="h-4 w-4 text-slate-500" /> : <Plus className="h-4 w-4 text-slate-500" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", readonly = false, placeholder = "", testId }: {
  label: string; value: string; onChange?: (v: string) => void; type?: string; readonly?: boolean; placeholder?: string; testId?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readonly}
        placeholder={placeholder}
        className={`w-full h-10 px-3 border border-slate-200 rounded-xl text-sm ${readonly ? "bg-slate-100" : "bg-slate-50 focus:bg-white"} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
        data-testid={testId || `input-${label.toLowerCase().replace(/\s/g, "-")}`}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, testId }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; testId?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
        data-testid={testId || `select-${label.toLowerCase().replace(/\s/g, "-")}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({ label, checked, onChange, testId }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; testId?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer" data-testid={testId || `checkbox-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded-lg border-slate-200" />
      {label}
    </label>
  );
}

function OverviewTabContent({ data }: { data: any }) {
  const openDefects = data.defects?.filter((d: any) => d.status === "OPEN" || d.status === "ASSIGNED" || d.status === "IN_PROGRESS").length || 0;
  const lastInspection = data.inspections?.[0];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4" data-testid="kpi-total-inspections">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Inspections</p>
          <p className="text-2xl font-bold text-blue-600">{data.inspections?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4" data-testid="kpi-open-defects">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Open Defects</p>
          <p className="text-2xl font-bold text-red-600">{openDefects}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4" data-testid="kpi-vor-status">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">VOR Status</p>
          <p className={`text-2xl font-bold ${data.vorStatus ? "text-red-600" : "text-green-600"}`}>
            {data.vorStatus ? "Off Road" : "Active"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4" data-testid="kpi-last-inspection">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Last Inspection</p>
          <p className="text-lg font-bold text-slate-700">
            {lastInspection ? new Date(lastInspection.createdAt).toLocaleDateString("en-GB") : "None"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4" data-testid="kpi-mot-due">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">MOT Due</p>
          <p className="text-lg font-bold text-slate-700">
            {data.motDue ? new Date(data.motDue).toLocaleDateString("en-GB") : "Not Set"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4" data-testid="kpi-tax-due">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Tax Due</p>
          <p className="text-lg font-bold text-slate-700">
            {data.taxDue ? new Date(data.taxDue).toLocaleDateString("en-GB") : "Not Set"}
          </p>
        </div>
      </div>
      {data.assignedDriver && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Assigned Driver</h3>
          <p className="text-sm text-slate-700" data-testid="text-assigned-driver">{data.assignedDriver.name} ({data.assignedDriver.email})</p>
        </div>
      )}
      {data.inspections?.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Recent Inspections</h3>
          <div className="space-y-2">
            {data.inspections.slice(0, 5).map((insp: any) => (
              <div key={insp.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <StatusBadge status={insp.status} />
                  <span className="text-sm text-slate-700">{insp.type}</span>
                </div>
                <span className="text-xs text-slate-400">{new Date(insp.createdAt).toLocaleDateString("en-GB")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VehicleDetailsTabContent({ data, formData, setFormData, categories, costCentres, departments }: { data: any; formData: any; setFormData: (fn: (prev: any) => any) => void; categories?: any[]; costCentres?: any[]; departments?: any[] }) {
  const set = (key: string, value: any) => setFormData((prev: any) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4">
      <CollapsibleSection title="Vehicle Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <button className="text-blue-600 text-sm font-medium hover:underline" data-testid="button-upload-image">
              <Upload className="h-4 w-4 inline mr-1" />Click To Upload Image
            </button>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Registration</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.vrm || ""}
                  readOnly
                  className="flex-1 h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl text-sm"
                  data-testid="input-registration"
                />
                <button className="px-3 h-10 text-xs font-medium bg-white border border-slate-200 rounded-xl hover:bg-slate-50" data-testid="button-edit-registration">Edit Registration</button>
                <button className="px-3 h-10 text-xs font-medium bg-white border border-slate-200 rounded-xl hover:bg-slate-50" data-testid="button-view-history">View History</button>
              </div>
            </div>
            <InputField label="Simplified Model" value={formData.simplifiedModel || ""} onChange={(v) => set("simplifiedModel", v)} />
            <InputField label="Make" value={formData.make || ""} onChange={(v) => set("make", v)} />
            <InputField label="Model" value={formData.model || ""} onChange={(v) => set("model", v)} />
            <InputField label="VIN" value={formData.vin || ""} onChange={(v) => set("vin", v)} />
            <InputField label="Engine Number" value={formData.engineNumber || ""} onChange={(v) => set("engineNumber", v)} />
            <InputField label="Engine Size (cc)" value={formData.engineSize || ""} onChange={(v) => set("engineSize", v)} />
          </div>
          <div className="space-y-4">
            <InputField label="Registration Date" value={formData.registrationDate || ""} onChange={(v) => set("registrationDate", v)} type="date" />
            <SelectField
              label="Vehicle Type"
              value={formData.vehicleType || ""}
              onChange={(v) => set("vehicleType", v)}
              options={[
                { value: "", label: "Select..." },
                { value: "HGV Tractor Unit", label: "HGV Tractor Unit" },
                { value: "Rigid", label: "Rigid" },
                { value: "Van", label: "Van" },
                { value: "Car", label: "Car" },
                { value: "Trailer", label: "Trailer" },
                { value: "Plant", label: "Plant" },
              ]}
            />
            <SelectField
              label="Odometer Unit"
              value={formData.odometerUnit || "Miles"}
              onChange={(v) => set("odometerUnit", v)}
              options={[
                { value: "Miles", label: "Miles" },
                { value: "Kilometers", label: "Kilometers" },
              ]}
            />
            <InputField label="Current Odometer" value={formData.currentOdometer || ""} onChange={(v) => set("currentOdometer", v)} />
            <InputField label="Current Odometer Date" value={formData.currentOdometerDate || ""} onChange={(v) => set("currentOdometerDate", v)} type="date" />
            <SelectField
              label="Registration Country"
              value={formData.registrationCountry || "United Kingdom"}
              onChange={(v) => set("registrationCountry", v)}
              options={[
                { value: "United Kingdom", label: "United Kingdom" },
                { value: "Ireland", label: "Ireland" },
                { value: "Other", label: "Other" },
              ]}
            />
            <InputField label="CO2" value={formData.co2 || ""} onChange={(v) => set("co2", v)} />
            <InputField label="Van Type" value={formData.vanType || ""} onChange={(v) => set("vanType", v)} />
            <InputField label="Body Type" value={formData.bodyType || ""} onChange={(v) => set("bodyType", v)} />
            <InputField label="Transmission" value={formData.transmission || ""} onChange={(v) => set("transmission", v)} />
            <InputField label="Colour" value={formData.colour || ""} onChange={(v) => set("colour", v)} />
            <InputField label="Fleet Number" value={formData.fleetNumber || ""} onChange={(v) => set("fleetNumber", v)} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <CheckboxField label="High Roof" checked={formData.highRoof || false} onChange={(v) => set("highRoof", v)} />
          <CheckboxField label="CC Zone Auto-pay Registered" checked={formData.ccZoneAutopay || false} onChange={(v) => set("ccZoneAutopay", v)} />
          <CheckboxField label="Dartford Crossing" checked={formData.dartfordCrossing || false} onChange={(v) => set("dartfordCrossing", v)} />
          <CheckboxField label="Mersey Crossing" checked={formData.merseyCrossing || false} onChange={(v) => set("merseyCrossing", v)} />
          <CheckboxField label="Tyne Tunnel" checked={formData.tyneTunnel || false} onChange={(v) => set("tyneTunnel", v)} />
          <CheckboxField label="Conspicuity Markings" checked={formData.conspicuityMarkings || false} onChange={(v) => set("conspicuityMarkings", v)} />
          <CheckboxField label="CCTV Installed" checked={formData.cctvInstalled || false} onChange={(v) => set("cctvInstalled", v)} />
          <CheckboxField label="Has Towbar" checked={formData.hasTowbar || false} onChange={(v) => set("hasTowbar", v)} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Hierarchy">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <SelectField
              label="Status"
              value={formData.hierarchyStatus || ""}
              onChange={(v) => set("hierarchyStatus", v)}
              options={[
                { value: "", label: "None" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
            <SelectField
              label="Category"
              value={formData.categoryId || ""}
              onChange={(v) => set("categoryId", v)}
              options={[
                { value: "", label: "Select a Category" },
                ...(categories || []).map((c: any) => ({ value: String(c.id), label: c.name })),
              ]}
              testId="select-category"
            />
            <InputField label="Division" value={formData.division || ""} onChange={(v) => set("division", v)} />
            <SelectField
              label="Department"
              value={formData.departmentId || ""}
              onChange={(v) => set("departmentId", v)}
              options={[
                { value: "", label: "Select a Department" },
                ...(departments || []).map((d: any) => ({ value: String(d.id), label: d.name })),
              ]}
              testId="select-department"
            />
          </div>
          <div className="space-y-4">
            <SelectField
              label="Cost Centre"
              value={formData.costCentreId || ""}
              onChange={(v) => {
                set("costCentreId", v);
                const selected = (costCentres || []).find((cc: any) => String(cc.id) === v);
                set("costCentreManager", selected?.managerName || "");
              }}
              options={[
                { value: "", label: "Select a Cost Centre" },
                ...(costCentres || []).map((cc: any) => ({ value: String(cc.id), label: `${cc.code} - ${cc.name}` })),
              ]}
              testId="select-cost-centre"
            />
            <InputField label="Cost Centre Manager" value={formData.costCentreManager || ""} readonly />
            <InputField label="Parking Site" value={formData.parkingSite || ""} onChange={(v) => set("parkingSite", v)} />
            <InputField label="Overnight Parking Site" value={formData.overnightParkingSite || ""} onChange={(v) => set("overnightParkingSite", v)} />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600 mb-1">Status Message</label>
          <textarea
            value={formData.statusMessage || ""}
            onChange={(e) => set("statusMessage", e.target.value)}
            className="w-full h-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            data-testid="textarea-status-message"
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CheckboxField label="Prevent MOT History Online Checks" checked={formData.preventMotHistory || false} onChange={(v) => set("preventMotHistory", v)} />
          <CheckboxField label="Prevent MOT & RFL Due Date Online Checks" checked={formData.preventMotRfl || false} onChange={(v) => set("preventMotRfl", v)} />
          <CheckboxField label="Prevent Cambelt & Servicing Information From Autodata" checked={formData.preventCambelt || false} onChange={(v) => set("preventCambelt", v)} />
          <CheckboxField label="Prevent New Alerts" checked={formData.preventAlerts || false} onChange={(v) => set("preventAlerts", v)} />
          <CheckboxField label="Driver Managed" checked={formData.driverManaged || false} onChange={(v) => set("driverManaged", v)} />
          <CheckboxField label="On Contract Maintenance" checked={formData.onContractMaintenance || false} onChange={(v) => set("onContractMaintenance", v)} />
          <CheckboxField label="Has Tachograph" checked={formData.hasTachograph || false} onChange={(v) => set("hasTachograph", v)} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Further Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <SelectField
              label="Euro Rating"
              value={formData.euroRating || ""}
              onChange={(v) => set("euroRating", v)}
              options={[
                { value: "", label: "Select..." },
                { value: "Euro 1", label: "Euro 1" },
                { value: "Euro 2", label: "Euro 2" },
                { value: "Euro 3", label: "Euro 3" },
                { value: "Euro 4", label: "Euro 4" },
                { value: "Euro 5", label: "Euro 5" },
                { value: "Euro 6", label: "Euro 6" },
              ]}
            />
            <CheckboxField label="RDE2 Certified" checked={formData.rde2Certified || false} onChange={(v) => set("rde2Certified", v)} />
            <InputField label="Limited Speed" value={formData.limitedSpeed || ""} onChange={(v) => set("limitedSpeed", v)} />
            <InputField label="Radio Code" value={formData.radioCode || ""} onChange={(v) => set("radioCode", v)} />
            <InputField label="Key Code" value={formData.keyCode || ""} onChange={(v) => set("keyCode", v)} />
            <InputField label="Alarm Code" value={formData.alarmCode || ""} onChange={(v) => set("alarmCode", v)} />
            <InputField label="Asset Code" value={formData.assetCode || ""} onChange={(v) => set("assetCode", v)} />
            <InputField label="Payload Weight" value={formData.payloadWeight || ""} onChange={(v) => set("payloadWeight", v)} />
            <InputField label="Gross Weight (GVW)" value={formData.grossWeightGVW || ""} onChange={(v) => set("grossWeightGVW", v)} />
            <InputField label="Axle Weight" value={formData.axleWeight || ""} onChange={(v) => set("axleWeight", v)} />
            <InputField label="Gross Weight (GTW)" value={formData.grossWeightGTW || ""} onChange={(v) => set("grossWeightGTW", v)} />
          </div>
          <div className="space-y-4">
            <InputField label="Roof Height" value={formData.roofHeight || ""} onChange={(v) => set("roofHeight", v)} />
            <InputField label="Oil Type" value={formData.oilType || ""} onChange={(v) => set("oilType", v)} />
            <InputField label="Oil Specification" value={formData.oilSpecification || ""} onChange={(v) => set("oilSpecification", v)} />
            <InputField label="Warranty Mileage" value={formData.warrantyMileage || ""} onChange={(v) => set("warrantyMileage", v)} />
            <InputField label="Seating" value={formData.seating || ""} onChange={(v) => set("seating", v)} />
            <InputField label="Main Keys/Documents" value={formData.mainKeys || ""} onChange={(v) => set("mainKeys", v)} />
            <InputField label="Spare Keys/Documents" value={formData.spareKeys || ""} onChange={(v) => set("spareKeys", v)} />
            <InputField label="V5 Location" value={formData.v5Location || ""} onChange={(v) => set("v5Location", v)} />
            <SelectField
              label="Recovery Contract"
              value={formData.recoveryContract || ""}
              onChange={(v) => set("recoveryContract", v)}
              options={[
                { value: "", label: "Select..." },
                { value: "AA", label: "AA" },
                { value: "RAC", label: "RAC" },
                { value: "Green Flag", label: "Green Flag" },
                { value: "Other", label: "Other" },
              ]}
            />
            <InputField label="Phone Serial" value={formData.phoneSerial || ""} onChange={(v) => set("phoneSerial", v)} />
            <InputField label="Safe Serial" value={formData.safeSerial || ""} onChange={(v) => set("safeSerial", v)} />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function KeyDatesTabContent({ data, formData, setFormData }: { data: any; formData: any; setFormData: (fn: (prev: any) => any) => void }) {
  const set = (key: string, value: any) => setFormData((prev: any) => ({ ...prev, [key]: value }));
  return (
    <div className="space-y-4">
      <CollapsibleSection title="Key Dates">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InputField label="MOT Due" value={formData.motDue || ""} onChange={(v) => set("motDue", v)} type="date" />
            <InputField label="Tax Due" value={formData.taxDue || ""} onChange={(v) => set("taxDue", v)} type="date" />
            <InputField label="Next Service Due" value={formData.nextServiceDue || ""} onChange={(v) => set("nextServiceDue", v)} type="date" />
          </div>
          <div className="space-y-4">
            <InputField label="Insurance Due" value={formData.insuranceDue || ""} onChange={(v) => set("insuranceDue", v)} type="date" />
            <InputField label="Tachograph Calibration Due" value={formData.tachoDue || ""} onChange={(v) => set("tachoDue", v)} type="date" />
            <InputField label="Speed Limiter Due" value={formData.speedLimiterDue || ""} onChange={(v) => set("speedLimiterDue", v)} type="date" />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function ServiceIntervalsTabContent({ data, formData, setFormData }: { data: any; formData: any; setFormData: (fn: (prev: any) => any) => void }) {
  const set = (key: string, value: any) => setFormData((prev: any) => ({ ...prev, [key]: value }));
  return (
    <div className="space-y-4">
      <CollapsibleSection title="Service Intervals">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InputField label="Service Interval (Miles)" value={formData.serviceIntervalMiles || ""} onChange={(v) => set("serviceIntervalMiles", v)} />
            <InputField label="Service Interval (Months)" value={formData.serviceIntervalMonths || ""} onChange={(v) => set("serviceIntervalMonths", v)} />
          </div>
          <div className="space-y-4">
            <InputField label="Last Service Date" value={formData.lastServiceDate || ""} onChange={(v) => set("lastServiceDate", v)} type="date" />
            <InputField label="Last Service Mileage" value={formData.lastServiceMileage || ""} onChange={(v) => set("lastServiceMileage", v)} />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function SafetyChecksTabContent({ data }: { data: any }) {
  const inspectionsList = data.inspections || [];
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="table-safety-checks">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Driver</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Odometer</th>
            </tr>
          </thead>
          <tbody>
            {inspectionsList.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-sm">No safety checks recorded</td></tr>
            ) : (
              inspectionsList.map((insp: any) => (
                <tr key={insp.id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`row-inspection-${insp.id}`}>
                  <td className="px-4 py-3 text-slate-700">{new Date(insp.createdAt).toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-3 text-slate-700">{insp.driverName || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={insp.status} /></td>
                  <td className="px-4 py-3 text-slate-700">{insp.type}</td>
                  <td className="px-4 py-3 text-slate-700">{insp.odometer?.toLocaleString() || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DefectsTabContent({ data }: { data: any }) {
  const defectsList = data.defects || [];
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="table-defects">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Description</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Severity</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Days Open</th>
            </tr>
          </thead>
          <tbody>
            {defectsList.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-sm">No defects recorded</td></tr>
            ) : (
              defectsList.map((d: any) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`row-defect-${d.id}`}>
                  <td className="px-4 py-3 text-slate-700">{new Date(d.createdAt).toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-3 text-slate-700">{d.category}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{d.description}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.severity} /></td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-slate-700">{d.daysOpen}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VORHistoryTabContent({ data }: { data: any }) {
  const hasVor = data.vorStatus || data.vorStartDate;
  return (
    <div className="space-y-4">
      {hasVor ? (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Current / Recent VOR</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <StatusBadge status={data.vorStatus ? "VOR" : "Resolved"} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Start Date</p>
              <p className="text-sm text-slate-700" data-testid="text-vor-start">{data.vorStartDate ? new Date(data.vorStartDate).toLocaleDateString("en-GB") : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Reason</p>
              <p className="text-sm text-slate-700" data-testid="text-vor-reason">{data.vorReason || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Resolved Date</p>
              <p className="text-sm text-slate-700" data-testid="text-vor-resolved">{data.vorResolvedDate ? new Date(data.vorResolvedDate).toLocaleDateString("en-GB") : "—"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700" data-testid="text-vor-notes">{data.vorNotes || "—"}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <Ban className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No VOR history for this vehicle</p>
        </div>
      )}
    </div>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-slate-400 text-sm" data-testid="text-coming-soon">Coming soon — {label}</p>
    </div>
  );
}

export function VehicleDetailModal({ vehicleId, onClose }: VehicleDetailModalProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("vehicle-details");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["vehicle-full-profile", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/${vehicleId}/full-profile`);
      if (!res.ok) throw new Error("Failed to fetch vehicle");
      return res.json();
    },
    enabled: !!vehicleId,
  });

  const companyId = data?.companyId;

  const { data: categoriesData } = useQuery({
    queryKey: ["hierarchy-categories", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/hierarchy/categories?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: costCentresData } = useQuery({
    queryKey: ["hierarchy-cost-centres", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/hierarchy/cost-centres?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch cost centres");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["hierarchy-departments", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/hierarchy/departments?companyId=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
    enabled: !!companyId,
  });

  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (data) {
      setFormData({
        vrm: data.vrm || "",
        make: data.make || "",
        model: data.model || "",
        fleetNumber: data.fleetNumber || "",
        vehicleCategory: data.vehicleCategory || "",
        currentOdometer: data.currentMileage?.toString() || "",
        motDue: data.motDue ? data.motDue.split("T")[0] : "",
        taxDue: data.taxDue ? data.taxDue.split("T")[0] : "",
        nextServiceDue: data.nextServiceDue ? data.nextServiceDue.split("T")[0] : "",
        lastServiceDate: data.lastServiceDate ? data.lastServiceDate.split("T")[0] : "",
        lastServiceMileage: data.lastServiceMileage?.toString() || "",
        serviceIntervalMiles: data.serviceIntervalMiles?.toString() || "",
        serviceIntervalMonths: data.serviceIntervalMonths?.toString() || "",
        hierarchyStatus: data.active ? "Active" : "Inactive",
        odometerUnit: "Miles",
        registrationCountry: "United Kingdom",
        categoryId: data.categoryId ? String(data.categoryId) : "",
        costCentreId: data.costCentreId ? String(data.costCentreId) : "",
        departmentId: data.departmentId ? String(data.departmentId) : "",
        costCentreManager: "",
      });
    }
  }, [data]);

  useEffect(() => {
    if (formData.costCentreId && costCentresData) {
      const selected = costCentresData.find((cc: any) => String(cc.id) === formData.costCentreId);
      if (selected) {
        setFormData((prev: any) => ({ ...prev, costCentreManager: selected.managerName || "" }));
      }
    }
  }, [costCentresData]);

  const saveMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await apiRequest("PATCH", `/api/manager/vehicles/${vehicleId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-full-profile", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-mgmt-list"] });
      queryClient.invalidateQueries({ queryKey: ["fleet-vehicles"] });
    },
  });

  const vorMutation = useMutation({
    mutationFn: async (action: "set" | "resolve") => {
      const url = action === "set"
        ? `/api/manager/vehicles/${vehicleId}/vor`
        : `/api/manager/vehicles/${vehicleId}/vor/resolve`;
      const res = await apiRequest("POST", url, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-full-profile", vehicleId] });
    },
  });

  const handleSave = () => {
    const updates: any = {};
    if (formData.make) updates.make = formData.make;
    if (formData.model) updates.model = formData.model;
    if (formData.fleetNumber !== undefined) updates.fleetNumber = formData.fleetNumber;
    if (formData.currentOdometer) updates.currentMileage = parseInt(formData.currentOdometer) || undefined;
    if (formData.motDue) updates.motDue = formData.motDue;
    if (formData.taxDue) updates.taxDue = formData.taxDue;
    if (formData.serviceIntervalMiles) updates.serviceIntervalMiles = parseInt(formData.serviceIntervalMiles) || undefined;
    if (formData.serviceIntervalMonths) updates.serviceIntervalMonths = parseInt(formData.serviceIntervalMonths) || undefined;
    if (formData.lastServiceDate) updates.lastServiceDate = formData.lastServiceDate;
    if (formData.lastServiceMileage) updates.lastServiceMileage = parseInt(formData.lastServiceMileage) || undefined;
    if (formData.nextServiceDue) updates.nextServiceDue = formData.nextServiceDue;
    updates.categoryId = formData.categoryId ? parseInt(formData.categoryId) : null;
    updates.costCentreId = formData.costCentreId ? parseInt(formData.costCentreId) : null;
    updates.departmentId = formData.departmentId ? parseInt(formData.departmentId) : null;
    saveMutation.mutate(updates);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      );
    }
    if (error || !data) {
      return (
        <div className="text-center py-16">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 text-sm">Failed to load vehicle data</p>
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        return <OverviewTabContent data={data} />;
      case "vehicle-details":
        return <VehicleDetailsTabContent data={data} formData={formData} setFormData={setFormData} categories={categoriesData} costCentres={costCentresData} departments={departmentsData} />;
      case "key-dates":
        return <KeyDatesTabContent data={data} formData={formData} setFormData={setFormData} />;
      case "service-intervals":
        return <ServiceIntervalsTabContent data={data} formData={formData} setFormData={setFormData} />;
      case "safety-checks":
        return <SafetyChecksTabContent data={data} />;
      case "defects":
        return <DefectsTabContent data={data} />;
      case "vor-history":
        return <VORHistoryTabContent data={data} />;
      case "hgv":
        return <PlaceholderTab label="HGV" />;
      case "odometer":
        return <PlaceholderTab label="Odometer" />;
      case "drivers":
        return <PlaceholderTab label="Drivers" />;
      case "assets":
        return <PlaceholderTab label="Assets" />;
      case "maintenance":
        return <PlaceholderTab label="Maintenance" />;
      case "hgv-inspections":
        return <PlaceholderTab label="HGV Inspections" />;
      default:
        return <PlaceholderTab label={activeTab} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto" data-testid="modal-vehicle-detail">
      <div className="bg-white border-b border-slate-200/80 flex items-center justify-between px-4 h-16 sticky top-0 z-[10000]">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            data-testid="button-logo-home"
          >
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm bg-slate-900">
              TF
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-lg tracking-tight">
                <span className="font-bold text-slate-900">Titan</span>
                <span className="font-normal text-slate-600 ml-1">Fleet</span>
              </span>
            </div>
          </button>
          <div className="w-px h-8 bg-slate-200 mx-1" />
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-900">Vehicle Details</h1>
            {data && <span className="text-slate-500 text-sm">— {data.vrm}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            data-testid="button-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            data-testid="button-save"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-slate-200/80">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          data-testid="button-recheck-alerts"
        >
          <RefreshCw className="h-4 w-4" />
          Recheck Alerts
        </button>
        <button
          onClick={() => vorMutation.mutate(data?.vorStatus ? "resolve" : "set")}
          disabled={vorMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          data-testid="button-set-vor"
        >
          {data?.vorStatus ? "Resolve VOR" : "Set As VOR"}
        </button>
        <button
          className="px-4 py-2 bg-white border border-slate-200 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          data-testid="button-sorn"
        >
          Set Vehicle SORN
        </button>
        <button
          className="px-4 py-2 bg-white border border-slate-200 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          data-testid="button-disposal"
        >
          Vehicle Disposal
        </button>
      </div>

      <div className="flex min-h-[calc(100vh-7.5rem)]">
        {sidebarOpen && (
          <div className="w-56 bg-white border-r border-slate-200/80 shrink-0 relative" data-testid="sidebar-tabs">
            <nav className="p-3 space-y-1">
              {SIDEBAR_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-xl transition-all duration-150 ${
                      isActive
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute -right-3 top-4 h-6 w-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
              data-testid="button-toggle-sidebar"
            >
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 -rotate-90" />
            </button>
          </div>
        )}

        <div className="flex-1 p-6 bg-slate-100/50 overflow-y-auto">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="mb-4 h-8 w-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
              data-testid="button-toggle-sidebar"
            >
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 rotate-90" />
            </button>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default VehicleDetailModal;
