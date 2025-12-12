import { useState, useEffect, useCallback, useMemo } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanInput } from "@/components/titan-ui/Input";
import { useLocation, useRoute, useSearch } from "wouter";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import type { Vehicle } from "@shared/schema";
import { Check, ChevronLeft, ChevronDown, ChevronUp, Camera, AlertTriangle, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";

type CheckStatus = "unchecked" | "pass" | "fail";

interface CheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  defectNote?: string;
  defectPhoto?: string;
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
    icon: "🛞",
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
    const baseSections = [...VEHICLE_SECTIONS];
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defectSheetItem, setDefectSheetItem] = useState<{ sectionId: string; itemId: string } | null>(null);
  const [defectNote, setDefectNote] = useState("");
  const [defectPhoto, setDefectPhoto] = useState<string | null>(null);

  const company = session.getCompany();
  const user = session.getUser();
  
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

  const loadVehicle = async (id: number) => {
    setIsLoading(true);
    try {
      const vehicleData = await api.getVehicle(id);
      setVehicle(vehicleData);
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
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        items: s.items.map(item => {
          if (item.id !== itemId) return item;
          // Tap cycles: unchecked -> pass -> unchecked
          if (item.status === "unchecked") return { ...item, status: "pass" as CheckStatus };
          if (item.status === "pass") return { ...item, status: "unchecked" as CheckStatus };
          return item; // fail stays fail until cleared via sheet
        })
      };
    }));
  };

  const handleItemLongPress = (sectionId: string, itemId: string) => {
    const section = sections.find(s => s.id === sectionId);
    const item = section?.items.find(i => i.id === itemId);
    setDefectNote(item?.defectNote || "");
    setDefectPhoto(item?.defectPhoto || null);
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
    setDefectPhoto(null);
  };

  // Progress calculation
  const allItems = sections.flatMap(s => s.items);
  const checkedItems = allItems.filter(i => i.status !== "unchecked");
  const failedItems = allItems.filter(i => i.status === "fail");
  const progress = Math.round((checkedItems.length / allItems.length) * 100);
  const canSubmit = !!odometer && checkedItems.length === allItems.length;

  const getSectionProgress = (section: Section) => {
    const checked = section.items.filter(i => i.status !== "unchecked").length;
    return { checked, total: section.items.length, complete: checked === section.items.length };
  };

  const handleSubmit = async () => {
    if (!company || !user || !vehicle) {
      toast({ variant: "destructive", title: "Error", description: "Session expired. Please log in again." });
      return;
    }

    setIsSubmitting(true);
    try {
      const checklist = sections.flatMap(s => 
        s.items.map(item => ({
          section: s.title,
          item: item.label,
          status: item.status,
          defectNote: item.defectNote || null,
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
        defects: failedItems.length > 0 ? failedItems.map(i => ({ item: i.label, note: i.defectNote })) : null,
        hasTrailer: hasTrailer,
      });

      toast({
        title: failedItems.length > 0 ? "Check Submitted with Defects" : "Safety Check Complete",
        description: failedItems.length > 0 
          ? `${failedItems.length} defect(s) reported. Manager notified.` 
          : "Vehicle passed. Safe to drive.",
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

  return (
    <DriverLayout>
      <div className="pb-28">
        {/* Sticky Header with Progress - Tighter Hierarchy */}
        <div className="sticky top-0 bg-white/95 backdrop-blur z-30 -mx-4 px-4 pt-2 pb-3 border-b border-slate-200/60">
          <div className="flex items-center gap-3 mb-3">
            <TitanButton variant="ghost" size="icon" onClick={() => setLocation(`/driver/vehicle/${vehicle.id}`)} className="h-9 w-9 -ml-2">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </TitanButton>
            <div className="flex-1 min-w-0">
              <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 truncate">{checkTitle}</h1>
              <p className="text-[13px] text-slate-500">{vehicle.vrm} · {checkDate}</p>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-semibold text-primary">{checkedItems.length} of {allItems.length}</div>
              <div className="text-[11px] text-slate-400">completed</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${failedItems.length > 0 ? 'bg-amber-500' : 'bg-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {failedItems.length > 0 && (
            <p className="text-[12px] text-amber-600 mt-1.5 font-medium">{failedItems.length} fault(s) recorded</p>
          )}
        </div>

        <div className="space-y-3 pt-4">
          {/* Mileage Card - Data Entry Control */}
          <div className="titan-card-elevated bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <label className="titan-section-label text-white/70 block mb-2">Mileage (miles)</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Enter current mileage"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl px-4 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              data-testid="input-odometer"
            />
          </div>

          {/* Collapsible Sections - Checkpoint Style */}
          {sections.map((section) => {
            const { checked, total, complete } = getSectionProgress(section);
            return (
              <div key={section.id}>
                {/* Section Header as Checkpoint */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="titan-card titan-tap w-full flex items-center gap-3 px-4 py-3"
                >
                  <div className="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center text-lg">
                    {section.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-slate-900">{section.title}</div>
                    <div className="titan-helper">{checked} of {total} checked</div>
                  </div>
                  <div className={`rounded-full text-[12px] font-semibold px-2 py-1 ${
                    complete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {complete ? <Check className="h-4 w-4" /> : checked}
                  </div>
                  {section.isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>

                {/* Section Items */}
                <AnimatePresence>
                  {section.isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-2">
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
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

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
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-8 shadow-2xl"
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
                    {defectPhoto ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm flex items-center gap-2">
                        <Check className="h-4 w-4" /> Photo captured
                      </div>
                    ) : (
                      <button
                        onClick={() => setDefectPhoto(`captured_${Date.now()}`)}
                        className="w-full p-4 border-2 border-dashed border-red-200 bg-red-50 rounded-lg text-red-600 hover:border-red-300 transition-colors flex items-center justify-center gap-2"
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
                      disabled={!defectNote.trim() || !defectPhoto}
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/60 bg-white/85 backdrop-blur px-4 py-3 pb-safe">
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

// Check Item Row - Industrial Checklist Plate with Hold Indicator
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
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdAnimationRef = useState<number | null>(null);

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleTouchStart = () => {
    setIsPressed(true);
    setHoldProgress(0);
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 500, 1);
      setHoldProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
    
    const timer = setTimeout(() => {
      triggerHaptic();
      onLongPress();
      setIsPressed(false);
      setHoldProgress(0);
    }, 500);
    setPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      if (isPressed && holdProgress < 1) {
        triggerHaptic();
        onTap();
      }
    }
    setIsPressed(false);
    setHoldProgress(0);
    setPressTimer(null);
  };

  const handleTouchCancel = () => {
    if (pressTimer) clearTimeout(pressTimer);
    setIsPressed(false);
    setHoldProgress(0);
    setPressTimer(null);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchCancel}
      className={`
        titan-tap-target rounded-2xl border px-4 py-3 flex items-center gap-3 cursor-pointer select-none transition-all
        ${isPressed ? 'scale-[0.98] bg-slate-50' : ''}
        ${item.status === 'pass' ? 'titan-check-pass' : ''}
        ${item.status === 'fail' ? 'titan-check-fail' : ''}
        ${item.status === 'unchecked' ? 'titan-check-unchecked' : ''}
      `}
    >
      <div className="relative">
        <div className={`
          h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all
          ${item.status === 'pass' ? 'bg-emerald-500 text-white shadow-sm' : ''}
          ${item.status === 'fail' ? 'bg-amber-500 text-white shadow-sm' : ''}
          ${item.status === 'unchecked' ? 'bg-slate-100 text-slate-400 border-2 border-dashed border-slate-300' : ''}
        `}>
          {item.status === 'pass' && <Check className="h-5 w-5" />}
          {item.status === 'fail' && <AlertTriangle className="h-5 w-5" />}
          {item.status === 'unchecked' && '?'}
        </div>
        
        {/* Hold Progress Ring */}
        {isPressed && holdProgress > 0 && item.status === 'unchecked' && (
          <svg className="absolute -inset-1 w-[52px] h-[52px]" viewBox="0 0 52 52">
            <circle
              cx="26"
              cy="26"
              r="23"
              fill="none"
              stroke="hsl(0 84% 60%)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${holdProgress * 144.5} 144.5`}
              transform="rotate(-90 26 26)"
              className="transition-none"
            />
          </svg>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`titan-body font-medium ${item.status === 'unchecked' ? 'text-slate-800' : item.status === 'pass' ? 'text-emerald-900' : 'text-amber-900'}`}>
          {item.label}
        </p>
        {item.status === 'unchecked' && (
          <p className="titan-micro mt-0.5">Tap to pass · Hold to log defect</p>
        )}
        {item.status === 'pass' && (
          <p className="titan-micro text-emerald-600 font-medium mt-0.5">Passed</p>
        )}
        {item.status === 'fail' && (
          <div className="flex items-center gap-2 mt-1">
            <span className="titan-pill titan-pill-warn">Defect logged</span>
            {item.defectNote && <span className="titan-micro text-amber-700 truncate">{item.defectNote}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
