import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanInput } from "@/components/titan-ui/Input";
import { useLocation, useRoute, useSearch } from "wouter";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import type { Vehicle } from "@shared/schema";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import { Check, ChevronLeft, ChevronDown, ChevronUp, Camera, AlertTriangle, Loader2, X, Play, Clock, Timer, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

// DVSA minimum check times in seconds
const MIN_CHECK_TIME_HGV = 10 * 60; // 10 minutes for HGV
const MIN_CHECK_TIME_LGV = 5 * 60;  // 5 minutes for LGV

type CheckStatus = "unchecked" | "pass" | "fail" | "na";

interface CheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  defectNote?: string;
  defectPhoto?: string;
  allowNA?: boolean; // Whether this item can be marked as N/A
}

interface Section {
  id: string;
  title: string;
  icon: string;
  items: CheckItem[];
  isExpanded: boolean;
}

const VEHICLE_SECTIONS: Omit<Section, "isExpanded">[] = [
  {
    id: "lights",
    title: "Lights & Signals",
    icon: "💡",
    items: [
      { id: "lamps", label: "Lamps / indicators / side repeaters / stoplamps", status: "unchecked" },
      { id: "reflectors", label: "Reflectors / markers / warning devices", status: "unchecked" },
    ]
  },
  {
    id: "exterior",
    title: "Exterior",
    icon: "🚛",
    items: [
      { id: "mirrors", label: "Mirrors / windscreen / glass condition", status: "unchecked" },
      { id: "body", label: "Body / wings", status: "unchecked" },
      { id: "doors", label: "Doors", status: "unchecked" },
      { id: "exhaust", label: "Exhaust condition", status: "unchecked" },
    ]
  },
  {
    id: "tyres",
    title: "Tyres & Wheels",
    icon: "🔘",
    items: [
      { id: "tyres", label: "Tyre condition / wear", status: "unchecked" },
      { id: "wheels", label: "Wheels condition", status: "unchecked" },
    ]
  },
  {
    id: "cab",
    title: "In Cab",
    icon: "💺",
    items: [
      { id: "seatbelts", label: "Seat belts", status: "unchecked" },
      { id: "horn", label: "Horn / wipers / washers", status: "unchecked" },
      { id: "instruments", label: "Instrument panel (warning lights etc)", status: "unchecked" },
      { id: "speedometer", label: "Speedometer operation", status: "unchecked" },
      { id: "controls", label: "Driving controls / steering operation", status: "unchecked" },
    ]
  },
  {
    id: "fluids",
    title: "Fluids & Mechanical",
    icon: "🛢️",
    items: [
      { id: "fluids", label: "Oil / coolant / fluid levels", status: "unchecked" },
      { id: "leaks", label: "Fuel / oils / fluid leaks", status: "unchecked" },
      { id: "brakes", label: "Brakes", status: "unchecked" },
      { id: "battery", label: "Battery condition", status: "unchecked" },
    ]
  },
  {
    id: "load",
    title: "Load & Security",
    icon: "📦",
    items: [
      { id: "load", label: "Load security", status: "unchecked" },
    ]
  },
];

const TRAILER_SECTIONS: Omit<Section, "isExpanded">[] = [
  {
    id: "coupling",
    title: "Coupling",
    icon: "🔗",
    items: [
      { id: "fifth_wheel", label: "Fifth wheel / coupling secure", status: "unchecked" },
      { id: "air_lines", label: "Air lines / electrical connections", status: "unchecked" },
      { id: "landing_gear", label: "Landing gear / props", status: "unchecked" },
    ]
  },
  {
    id: "trailer_lights",
    title: "Trailer Lights",
    icon: "💡",
    items: [
      { id: "trailer_lamps", label: "Trailer lamps / indicators / stoplamps", status: "unchecked" },
      { id: "trailer_reflectors", label: "Trailer reflectors / markers", status: "unchecked" },
    ]
  },
  {
    id: "trailer_body",
    title: "Trailer Body",
    icon: "📦",
    items: [
      { id: "trailer_body", label: "Trailer body / curtains / doors", status: "unchecked" },
      { id: "trailer_floor", label: "Trailer floor condition", status: "unchecked" },
      { id: "trailer_roof", label: "Trailer roof condition", status: "unchecked" },
    ]
  },
  {
    id: "trailer_tyres",
    title: "Trailer Tyres & Wheels",
    icon: "🔘",
    items: [
      { id: "trailer_tyres", label: "Trailer tyre condition / wear", status: "unchecked" },
      { id: "trailer_wheels", label: "Trailer wheels condition", status: "unchecked" },
    ]
  },
  {
    id: "trailer_brakes",
    title: "Trailer Brakes",
    icon: "⚙️",
    items: [
      { id: "trailer_brakes", label: "Trailer brakes operation", status: "unchecked" },
      { id: "abs_warning", label: "ABS warning light", status: "unchecked" },
    ]
  },
];

export default function VehicleInspection() {
  const [, params] = useRoute("/driver/inspection/:id");
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();

  // Parse URL params
  const urlParams = new URLSearchParams(searchString);
  const inspectionType = urlParams.get("type") || "safety";
  const hasTrailer = urlParams.get("trailer") === "true";

  // Build the sections based on type and trailer
  const initialSections = useMemo(() => {
    const baseSections = VEHICLE_SECTIONS.map(section => {
      if (section.id === "load" && !hasTrailer) {
        return {
          ...section,
          items: section.items.map(item => ({
            ...item,
            allowNA: true,
            label: item.id === "load" ? "Load security (N/A if no load)" : item.label
          }))
        };
      }
      return section;
    });
    if (hasTrailer) {
      return [...baseSections, ...TRAILER_SECTIONS];
    }
    return baseSections;
  }, [hasTrailer]);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>(
    initialSections.map((s, i) => ({ ...s, isExpanded: i === 0 }))
  );
  const [odometer, setOdometer] = useState("");
  const [odometerPreFilled, setOdometerPreFilled] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defectSheetItem, setDefectSheetItem] = useState<{ sectionId: string; itemId: string } | null>(null);
  const [defectNote, setDefectNote] = useState("");
  const [defectPhoto, setDefectPhoto] = useState<string | null>(null);
  const [defectPhotoPreview, setDefectPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [cabPhotos, setCabPhotos] = useState<{objectPath: string, preview: string}[]>([]);
  const [isUploadingCabPhoto, setIsUploadingCabPhoto] = useState(false);
  const cabPhotoInputRef = useRef<HTMLInputElement>(null);
  
  // DVSA Auditable Timing State
  const [checkStarted, setCheckStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showMinTimeWarning, setShowMinTimeWarning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const company = session.getCompany();
  const user = session.getUser();
  
  // Determine minimum time based on vehicle category
  const vehicleCategory = (vehicle as any)?.vehicleCategory || "HGV";
  const minCheckTime = vehicleCategory === "LGV" ? MIN_CHECK_TIME_LGV : MIN_CHECK_TIME_HGV;
  const minCheckTimeMinutes = Math.floor(minCheckTime / 60);
  const hasMetMinTime = elapsedSeconds >= minCheckTime;
  
  // Format title based on inspection type
  const checkTitle = inspectionType === "end_of_shift" ? "End of Shift Check" : "Safety Check";
  const checkDate = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  useEffect(() => {
    if (params?.id) {
      loadVehicle(Number(params.id));
    }
  }, [params?.id]);
  
  // Timer effect - updates every second when check is started
  useEffect(() => {
    if (checkStarted && startedAt) {
      timerRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [checkStarted, startedAt]);
  
  // Format elapsed time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start the check - records startedAt timestamp
  const handleStartCheck = () => {
    const now = new Date();
    setStartedAt(now);
    setCheckStarted(true);
    toast({
      title: "Check Started",
      description: `Timer running. DVSA recommends minimum ${minCheckTimeMinutes} minutes for ${vehicleCategory} vehicles.`,
    });
  };

  const loadVehicle = async (id: number) => {
    setIsLoading(true);
    try {
      const vehicleData = await api.getVehicle(id);
      setVehicle(vehicleData);
      try {
        const mileageRes = await fetch(`/api/vehicles/${id}/last-mileage`, { headers: authHeaders() });
        const mileageData = await mileageRes.json();
        if (mileageData.lastMileage) {
          setOdometer(String(mileageData.lastMileage));
          setOdometerPreFilled(true);
        }
      } catch (e) {
        // Silent fail - mileage prefill is a convenience, not critical
      }
    } catch (error) {
      console.error("Failed to load vehicle:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load vehicle data" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
    ));
  };

  const handleItemTap = (sectionId: string, itemId: string) => {
    const section = sections.find(s => s.id === sectionId);
    const item = section?.items.find(i => i.id === itemId);
    if (item?.status === "fail") {
      handleItemLongPress(sectionId, itemId);
      return;
    }
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        items: s.items.map(item => {
          if (item.id !== itemId) return item;
          if (item.allowNA) {
            if (item.status === "unchecked") return { ...item, status: "pass" as CheckStatus };
            if (item.status === "pass") return { ...item, status: "na" as CheckStatus };
            if (item.status === "na") return { ...item, status: "unchecked" as CheckStatus };
          } else {
            if (item.status === "unchecked") return { ...item, status: "pass" as CheckStatus };
            if (item.status === "pass") return { ...item, status: "unchecked" as CheckStatus };
          }
          return item;
        })
      };
    }));
  };

  const handleItemLongPress = (sectionId: string, itemId: string) => {
    const section = sections.find(s => s.id === sectionId);
    const item = section?.items.find(i => i.id === itemId);
    setDefectNote(item?.defectNote || "");
    setDefectPhoto(item?.defectPhoto || null);
    setDefectPhotoPreview(null);
    setDefectSheetItem({ sectionId, itemId });
  };

  const saveDefect = () => {
    if (!defectSheetItem) return;
    setSections(prev => prev.map(s => {
      if (s.id !== defectSheetItem.sectionId) return s;
      return {
        ...s,
        items: s.items.map(item => {
          if (item.id !== defectSheetItem.itemId) return item;
          return { ...item, status: "fail" as CheckStatus, defectNote, defectPhoto: defectPhoto || undefined };
        })
      };
    }));
    setDefectSheetItem(null);
    setDefectNote("");
    setDefectPhoto(null);
    if (defectPhotoPreview) {
      URL.revokeObjectURL(defectPhotoPreview);
      setDefectPhotoPreview(null);
    }
    toast({ title: "Defect recorded", description: "Item marked as failed" });
  };

  const clearDefect = () => {
    if (!defectSheetItem) return;
    setSections(prev => prev.map(s => {
      if (s.id !== defectSheetItem.sectionId) return s;
      return {
        ...s,
        items: s.items.map(item => {
          if (item.id !== defectSheetItem.itemId) return item;
          return { ...item, status: "unchecked" as CheckStatus, defectNote: undefined, defectPhoto: undefined };
        })
      };
    }));
    setDefectSheetItem(null);
    setDefectNote("");
    removePhoto();
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    const previewUrl = URL.createObjectURL(file);
    setDefectPhotoPreview(previewUrl);
    setIsUploadingPhoto(true);
    setUploadProgress(10);

    try {
      const response = await fetch("/api/defect-photos/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          companyId: company.id,
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadURL, objectPath } = await response.json();
      setUploadProgress(30);

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload photo");
      }

      setUploadProgress(100);
      setDefectPhoto(objectPath);
      toast({ title: "Photo uploaded", description: "Defect photo captured successfully" });
    } catch (error) {
      console.error("Photo upload failed:", error);
      toast({ variant: "destructive", title: "Upload failed", description: "Could not upload photo. Please try again." });
      URL.revokeObjectURL(previewUrl);
      setDefectPhotoPreview(null);
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress(0);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  const removePhoto = () => {
    if (defectPhotoPreview) {
      URL.revokeObjectURL(defectPhotoPreview);
    }
    setDefectPhoto(null);
    setDefectPhotoPreview(null);
  };

  const handleCabPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    if (cabPhotos.length >= 3) return;

    const previewUrl = URL.createObjectURL(file);
    setIsUploadingCabPhoto(true);

    try {
      const response = await fetch("/api/defect-photos/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          companyId: company.id,
          filename: `cab-${file.name}`,
          contentType: file.type,
        }),
      });

      if (!response.ok) throw new Error("Failed to get upload URL");

      const { uploadURL, objectPath } = await response.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload photo");

      setCabPhotos(prev => [...prev, { objectPath, preview: previewUrl }]);
      toast({ title: "Photo uploaded", description: "Cab photo captured successfully" });
    } catch (error) {
      console.error("Cab photo upload failed:", error);
      toast({ variant: "destructive", title: "Upload failed", description: "Could not upload photo. Please try again." });
      URL.revokeObjectURL(previewUrl);
    } finally {
      setIsUploadingCabPhoto(false);
      if (cabPhotoInputRef.current) {
        cabPhotoInputRef.current.value = "";
      }
    }
  };

  const removeCabPhoto = (index: number) => {
    setCabPhotos(prev => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Progress calculation
  const allItems = sections.flatMap(s => s.items);
  const checkedItems = allItems.filter(i => i.status !== "unchecked");
  const failedItems = allItems.filter(i => i.status === "fail");
  const progress = Math.round((checkedItems.length / allItems.length) * 100);
  const allItemsChecked = checkedItems.length === allItems.length;
  const canSubmit = !!odometer && allItemsChecked;

  const getSectionProgress = (section: Section) => {
    const checked = section.items.filter(i => i.status !== "unchecked").length;
    return { checked, total: section.items.length, complete: checked === section.items.length };
  };

  const handleSubmit = async () => {
    if (!company || !user || !vehicle) {
      toast({ variant: "destructive", title: "Error", description: "Session expired. Please log in again." });
      return;
    }
    
    // Check if minimum time is met - show warning if not
    if (!hasMetMinTime && !showMinTimeWarning) {
      setShowMinTimeWarning(true);
      toast({
        variant: "destructive",
        title: "DVSA Time Warning",
        description: `Checks should take at least ${minCheckTimeMinutes} minutes. Continue anyway?`,
      });
      return; // User must tap submit again to confirm
    }

    setIsSubmitting(true);
    try {
      const completedAt = new Date();
      const durationSeconds = startedAt ? Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000) : 0;
      
      const checklist = sections.flatMap(s => 
        s.items.map(item => ({
          section: s.title,
          item: item.label,
          status: item.status,
          defectNote: item.defectNote || null,
          defectPhoto: item.defectPhoto || null,
          hasPhoto: !!item.defectPhoto,
        }))
      );

      // Map inspection type to database value
      const dbType = inspectionType === "end_of_shift" ? "END_OF_SHIFT" : "SAFETY_CHECK";

      await api.createInspection({
        companyId: company.id,
        vehicleId: vehicle.id,
        driverId: user.id,
        type: dbType,
        odometer: Number(odometer),
        status: failedItems.length > 0 ? "FAIL" : "PASS",
        checklist,
        defects: failedItems.length > 0 ? failedItems.map(i => ({ 
          item: i.label, 
          note: i.defectNote,
          photo: i.defectPhoto || null
        })) : null,
        hasTrailer: hasTrailer,
        cabPhotos: cabPhotos.map(p => p.objectPath),
        // DVSA Auditable Timing
        startedAt: startedAt?.toISOString(),
        completedAt: completedAt.toISOString(),
        durationSeconds,
        vehicleCategory,
      });

      const timeNote = durationSeconds < minCheckTime 
        ? ` (Completed in ${formatTime(durationSeconds)} - under recommended time)`
        : ` (Duration: ${formatTime(durationSeconds)})`;

      toast({
        title: failedItems.length > 0 ? "Check Submitted with Defects" : "Safety Check Complete",
        description: failedItems.length > 0 
          ? `${failedItems.length} defect(s) reported. Manager notified.${timeNote}` 
          : `Vehicle passed. Safe to drive.${timeNote}`,
        className: failedItems.length > 0 ? "border-amber-500 bg-amber-50" : "border-green-500 bg-green-50",
      });

      setLocation("/driver");
    } catch (error) {
      console.error("Failed to submit:", error);
      toast({ variant: "destructive", title: "Submission Failed", description: "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DriverLayout>
    );
  }

  if (!vehicle) {
    return (
      <DriverLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">Vehicle not found</p>
          <TitanButton variant="outline" onClick={() => setLocation("/driver")} className="mt-4">Back to Dashboard</TitanButton>
        </div>
      </DriverLayout>
    );
  }

  // Start Check Screen - shown before inspection begins
  if (!checkStarted) {
    return (
      <DriverLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="titan-card p-5 text-center max-w-md w-full">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Timer className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">{checkTitle}</h1>
            <p className="text-slate-600 text-sm mb-2">{vehicle.vrm} · {vehicle.make} {vehicle.model}</p>
            
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-4 ${
              vehicleCategory === 'HGV' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Clock className="h-3 w-3" />
              {vehicleCategory} · Min {minCheckTimeMinutes} min
            </div>
            
            <TitanButton
              size="lg"
              className="w-full mb-3"
              onClick={handleStartCheck}
              data-testid="button-start-check"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Check
            </TitanButton>
            
            <p className="text-[11px] text-slate-400 mb-2">
              Timed for DVSA compliance evidence
            </p>
            
            <button
              onClick={() => setLocation(`/driver/vehicle/${vehicle.id}`)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="pb-40">
        {/* Sticky Header with Progress and Timer */}
        <div className="sticky top-0 bg-white/95 backdrop-blur z-30 -mx-4 px-4 pt-2 pb-3 border-b border-slate-200/60">
          <div className="flex items-center gap-3 mb-3">
            <TitanButton variant="ghost" size="icon" onClick={() => setLocation(`/driver/vehicle/${vehicle.id}`)} className="h-9 w-9 -ml-2">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </TitanButton>
            <div className="flex-1 min-w-0">
              <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 truncate">{checkTitle}</h1>
              <p className="text-[13px] text-slate-500">{vehicle.vrm} · {checkDate}</p>
            </div>
            {/* Live Timer Display */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${
              hasMetMinTime ? 'bg-emerald-100' : 'bg-amber-100'
            }`} data-testid="timer-display">
              <Timer className={`h-4 w-4 ${hasMetMinTime ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className={`font-mono font-bold text-lg ${hasMetMinTime ? 'text-emerald-700' : 'text-amber-700'}`}>
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>
          
          {/* Min Time Progress Bar */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${hasMetMinTime ? 'bg-emerald-500' : 'bg-amber-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (elapsedSeconds / minCheckTime) * 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-[11px] text-slate-500 whitespace-nowrap">
              {hasMetMinTime ? '✓ Min time met' : `${minCheckTimeMinutes}min req`}
            </span>
          </div>
          
          {/* Check Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${failedItems.length > 0 ? 'bg-amber-500' : 'bg-primary'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-[11px] text-slate-500 whitespace-nowrap">
              {checkedItems.length}/{allItems.length} items
            </span>
          </div>
          {failedItems.length > 0 && (
            <p className="text-[12px] text-amber-600 mt-1.5 font-medium">{failedItems.length} fault(s) recorded</p>
          )}
        </div>

        <div className="space-y-3 pt-4 titan-page-enter">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 px-1 mb-2">
            {Array.from({ length: sections.length + 1 }).map((_, i) => {
              const isComplete = i === 0 
                ? !!odometer 
                : getSectionProgress(sections[i - 1]).complete;
              const isCurrent = i === currentStep;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    isCurrent ? 'bg-primary scale-y-125' : isComplete ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                  data-testid={`step-indicator-${i}`}
                />
              );
            })}
          </div>
          
          <div className="text-xs text-slate-500 px-1 mb-1">
            Step {currentStep + 1} of {sections.length + 1}
          </div>

          {/* Step 0: Mileage */}
          {currentStep === 0 && (
            <motion.div
              key="mileage"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="titan-card p-4">
                <label className="titan-section-label block mb-2">Mileage (miles)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={odometerPreFilled ? `Last: ${odometer} miles` : "Enter current mileage"}
                  value={odometer}
                  onChange={(e) => { setOdometer(e.target.value); setOdometerPreFilled(false); }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 h-12 rounded-xl px-4 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  data-testid="input-odometer"
                />
                {odometerPreFilled && odometer && (
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-500" />
                    Pre-filled from last inspection
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Checklist sections - one at a time */}
          {currentStep > 0 && currentStep <= sections.length && (() => {
            const section = sections[currentStep - 1];
            const { checked, total, complete } = getSectionProgress(section);
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="titan-card px-4 py-3 mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center text-xl">
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-lg">{section.title}</div>
                    <div className="text-sm text-slate-500">{checked} of {total} checked</div>
                  </div>
                  {complete && (
                    <div className="bg-emerald-100 text-emerald-700 rounded-full p-1.5">
                      <Check className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {section.items.map((item, idx) => (
                    <CheckItemRow
                      key={item.id}
                      item={item}
                      isLast={idx === section.items.length - 1}
                      onTap={() => handleItemTap(section.id, item.id)}
                      onLongPress={() => handleItemLongPress(section.id, item.id)}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })()}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-4">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors titan-btn-press"
                data-testid="button-prev-step"
              >
                Previous
              </button>
            )}
            {currentStep < sections.length && (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex-1 h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors titan-btn-press"
                data-testid="button-next-step"
              >
                {currentStep === 0 ? (odometer ? 'Start Check' : 'Skip Mileage') : 'Next Section'}
              </button>
            )}
          </div>
        </div>

        {/* Cab Condition Photos Section - appears when all items checked */}
        <AnimatePresence>
          {allItemsChecked && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="titan-card p-4 mt-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 grid place-items-center">
                    <Camera className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">Cab Condition Photos</div>
                    <div className="text-[12px] text-slate-500">Take photos showing cab is clean and tidy</div>
                  </div>
                  <span className="text-[11px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full" data-testid="badge-recommended">Recommended</span>
                </div>

                <input
                  ref={cabPhotoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCabPhotoSelect}
                  className="hidden"
                  data-testid="input-cab-photo"
                />

                {cabPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {cabPhotos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-green-200">
                        <img
                          src={photo.preview}
                          alt={`Cab photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                          data-testid={`img-cab-photo-${idx}`}
                        />
                        <button
                          onClick={() => removeCabPhoto(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                          data-testid={`button-remove-cab-photo-${idx}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-green-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isUploadingCabPhoto ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-blue-700 text-sm font-medium">Uploading photo...</span>
                    </div>
                  </div>
                ) : cabPhotos.length < 3 ? (
                  <button
                    onClick={() => cabPhotoInputRef.current?.click()}
                    className="w-full p-3 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-lg text-blue-600 hover:border-blue-300 transition-colors flex items-center justify-center gap-2"
                    data-testid="button-capture-cab-photo"
                  >
                    <Camera className="h-5 w-5" />
                    <span>{cabPhotos.length === 0 ? 'Take Cab Photo' : `Add Photo (${cabPhotos.length}/3)`}</span>
                  </button>
                ) : (
                  <div className="text-center text-[12px] text-slate-500">Maximum 3 photos reached</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Defect Bottom Sheet */}
        <AnimatePresence>
          {defectSheetItem && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setDefectSheetItem(null)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="fixed bottom-16 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Report Defect</h3>
                  <button onClick={() => setDefectSheetItem(null)} className="p-2 -mr-2">
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Defect Description</label>
                    <Textarea
                      placeholder="Describe the issue..."
                      value={defectNote}
                      onChange={(e) => setDefectNote(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Photo Evidence (Required)</label>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      data-testid="input-defect-photo"
                    />
                    
                    {isUploadingPhoto ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          <span className="text-blue-700 text-sm font-medium">Uploading photo...</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    ) : defectPhoto && defectPhotoPreview ? (
                      <div className="relative">
                        <img
                          src={defectPhotoPreview}
                          alt="Defect photo"
                          className="w-full h-40 object-cover rounded-lg border border-green-200"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            onClick={removePhoto}
                            className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                            data-testid="button-remove-photo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Photo captured
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="w-full p-4 border-2 border-dashed border-red-200 bg-red-50 rounded-lg text-red-600 hover:border-red-300 transition-colors flex items-center justify-center gap-2"
                        data-testid="button-capture-photo"
                      >
                        <Camera className="h-5 w-5" />
                        <span>Capture Photo</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <TitanButton variant="outline" className="flex-1" onClick={clearDefect}>
                      Clear / Cancel
                    </TitanButton>
                    <TitanButton 
                      variant="destructive" 
                      className="flex-1" 
                      onClick={saveDefect}
                      disabled={!defectNote.trim() || !defectPhoto || isUploadingPhoto}
                      data-testid="button-save-defect"
                    >
                      Save Defect
                    </TitanButton>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Premium Bottom Submit Bar */}
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-slate-200/60 bg-white/85 backdrop-blur px-4 py-3 pb-safe">
          <div className="max-w-md mx-auto space-y-2">
            <TitanButton 
              size="lg" 
              className="w-full" 
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!canSubmit}
              variant={failedItems.length > 0 ? "destructive" : "primary"}
              data-testid="button-submit"
            >
              {!odometer 
                ? "Enter mileage to continue"
                : !canSubmit 
                  ? `Complete all checks (${checkedItems.length}/${allItems.length})`
                  : failedItems.length > 0 
                    ? `Submit with ${failedItems.length} defect(s)`
                    : `Submit inspection`
              }
            </TitanButton>
            {canSubmit && failedItems.length === 0 && (
              <p className="text-center text-[12px] text-slate-500">Signed off to Transport Manager</p>
            )}
          </div>
        </div>
      </div>
    </DriverLayout>
  );
}

function CheckItemRow({ 
  item, 
  isLast, 
  onTap, 
  onLongPress 
}: { 
  item: CheckItem;
  isLast: boolean;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const didLongPressRef = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const triggerHaptic = (intensity: number = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(intensity);
    }
  };

  const startPress = (x: number, y: number) => {
    didLongPressRef.current = false;
    touchStartPos.current = { x, y };

    pressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      triggerHaptic(30);
      onLongPress();
    }, 1500);
  };

  const endPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (!didLongPressRef.current) {
      triggerHaptic(10);
      onTap();
    }
    didLongPressRef.current = false;
    touchStartPos.current = null;
  };

  const cancelPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    didLongPressRef.current = false;
    touchStartPos.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPress(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) {
      cancelPress();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    endPress();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startPress(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    endPress();
  };

  const helperText = (() => {
    if (item.status === 'unchecked') {
      return item.allowNA ? 'Tap OK · Again for N/A · Hold 1.5s for defect' : 'Tap to mark OK · Hold 1.5s for defect';
    }
    if (item.status === 'pass') {
      return item.allowNA ? 'Tap for N/A' : 'Passed ✓';
    }
    if (item.status === 'na') return 'Not Applicable';
    if (item.status === 'fail') return 'Tap to edit defect';
    return '';
  })();

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={cancelPress}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={cancelPress}
      className={`
        titan-tap-target rounded-2xl border px-4 py-3 flex items-center gap-3 cursor-pointer select-none transition-all active:scale-[0.98]
        ${item.status === 'pass' ? 'titan-check-pass' : ''}
        ${item.status === 'fail' ? 'titan-check-fail' : ''}
        ${item.status === 'na' ? 'bg-slate-50 border-slate-300' : ''}
        ${item.status === 'unchecked' ? 'titan-check-unchecked' : ''}
      `}
      data-testid={`check-item-${item.id}`}
    >
      <div className={`
        h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all
        ${item.status === 'pass' ? 'bg-emerald-500 text-white shadow-sm' : ''}
        ${item.status === 'fail' ? 'bg-amber-500 text-white shadow-sm' : ''}
        ${item.status === 'na' ? 'bg-slate-400 text-white shadow-sm' : ''}
        ${item.status === 'unchecked' ? 'bg-slate-100 text-slate-400 border-2 border-dashed border-slate-300' : ''}
      `}>
        {item.status === 'pass' && <Check className="h-5 w-5" />}
        {item.status === 'fail' && <AlertTriangle className="h-5 w-5" />}
        {item.status === 'na' && <span className="text-xs">N/A</span>}
        {item.status === 'unchecked' && '?'}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`titan-body font-medium ${item.status === 'unchecked' ? 'text-slate-800' : item.status === 'pass' ? 'text-emerald-900' : item.status === 'na' ? 'text-slate-700' : 'text-amber-900'}`}>
          {item.label}
        </p>
        {item.status === 'fail' ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="titan-pill titan-pill-warn">Defect logged</span>
            {item.defectNote && <span className="titan-micro text-amber-700 truncate">{item.defectNote}</span>}
          </div>
        ) : (
          <p className={`titan-micro mt-0.5 ${item.status === 'pass' ? 'text-emerald-600 font-medium' : item.status === 'na' ? 'text-slate-500 font-medium' : ''}`}>
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
}
