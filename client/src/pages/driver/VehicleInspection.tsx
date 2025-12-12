import { useState } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanSegmentedControl } from "@/components/titan-ui/SegmentedControl";
import { TitanCaptureTile } from "@/components/titan-ui/CaptureTile";
import { TitanInput } from "@/components/titan-ui/Input";
import { useLocation, useRoute } from "wouter";
import { MOCK_VEHICLES } from "@/lib/mockData";
import { CheckCircle2, ChevronLeft, ChevronRight, UploadCloud, AlertTriangle, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";

const WIZARD_STEPS = [
  {
    id: "odometer",
    title: "Start Check",
    items: []
  },
  {
    id: "external",
    title: "External",
    items: ["Lights & Indicators", "Mirrors & Glass", "Tyres & Wheels", "Bodywork & Doors"]
  },
  {
    id: "fluids",
    title: "Fluids",
    items: ["Engine Oil", "Coolant", "Screen Wash", "AdBlue Level"]
  },
  {
    id: "cab",
    title: "In Cab",
    items: ["Wipers", "Horn", "Seatbelts", "Dashboard Warning Lights"]
  },
  {
    id: "review",
    title: "Review",
    items: []
  }
];

export default function VehicleInspection() {
  const [, params] = useRoute("/driver/inspection/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const vehicle = MOCK_VEHICLES.find(v => v.id === params?.id);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [checks, setChecks] = useState<Record<string, "pass" | "fail">>({});
  const [defects, setDefects] = useState<Record<string, { note: string, photo?: string }>>({});
  const [odometer, setOdometer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!vehicle) return <div>Vehicle not found</div>;

  const currentStep = WIZARD_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;

  // Validation for current step
  const canProceed = () => {
    if (currentStep.id === "odometer") return !!odometer;
    if (currentStep.id === "review") return true;
    
    // For checklist steps, ensure all items are checked
    return currentStep.items.every(item => checks[item] !== undefined);
  };

  const handleNext = () => {
    if (canProceed()) {
      setCurrentStepIndex(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      setLocation("/driver");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsSubmitting(false);
    
    const hasFailures = Object.values(checks).some(v => v === "fail");
    
    toast({
      title: "Inspection Submitted",
      description: hasFailures ? "Defects logged. Manager notified." : "Vehicle passed. Safe to drive.",
      className: hasFailures ? "border-amber-500 bg-amber-50" : "border-green-500 bg-green-50",
    });
    setLocation("/driver");
  };

  const progress = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;

  return (
    <DriverLayout>
      <div className="flex flex-col min-h-[calc(100vh-80px)]">
        {/* Header with Progress */}
        <div className="sticky top-0 bg-slate-50/95 backdrop-blur z-20 pt-2 pb-4 border-b border-slate-200/50 mb-6">
            <div className="flex items-center gap-3 mb-3">
                <TitanButton variant="ghost" size="icon" onClick={handleBack} className="h-10 w-10 -ml-2">
                    <ChevronLeft className="h-6 w-6 text-slate-600" />
                </TitanButton>
                <div>
                    <h2 className="font-heading font-bold text-lg leading-none">{vehicle.reg}</h2>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                        {currentStep.title} • Step {currentStepIndex + 1}/{WIZARD_STEPS.length}
                    </p>
                </div>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden w-full">
                <motion.div 
                    className="h-full bg-primary" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </div>

        {/* Wizard Content */}
        <div className="flex-1 pb-24">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    {currentStep.id === "odometer" && (
                        <div className="space-y-6 pt-4">
                            <div className="text-center space-y-2 mb-8">
                                <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-primary mb-4 ring-8 ring-blue-50/50">
                                    <Gauge className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Check Odometer</h3>
                                <p className="text-slate-500">Please enter the current mileage to begin.</p>
                            </div>
                            
                            <TitanInput 
                                label="Current Odometer (km)"
                                type="number" 
                                placeholder="e.g. 125400" 
                                className="text-2xl h-16 text-center font-mono tracking-widest"
                                value={odometer}
                                onChange={(e) => setOdometer(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Checklist Steps */}
                    {currentStep.items.length > 0 && (
                        <div className="space-y-6">
                            {currentStep.items.map((item) => (
                                <TitanCard key={item} className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <label className="text-base font-bold text-slate-800">{item}</label>
                                        {checks[item] === "pass" && <CheckCircle2 className="text-green-500 h-5 w-5" />}
                                    </div>
                                    
                                    <TitanSegmentedControl 
                                        value={checks[item] || ""}
                                        onChange={(val) => setChecks(prev => ({ ...prev, [item]: val as "pass" | "fail" }))}
                                        options={[
                                            { label: "Pass", value: "pass", variant: "success" },
                                            { label: "Fail", value: "fail", variant: "danger" }
                                        ]}
                                    />

                                    {/* Defect Capture if Failed */}
                                    <AnimatePresence>
                                        {checks[item] === "fail" && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="pt-2 space-y-3 overflow-hidden"
                                            >
                                                <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-red-800 text-sm flex gap-2">
                                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                                    Please describe the defect and take a photo.
                                                </div>
                                                <Textarea 
                                                    placeholder="Describe defect..." 
                                                    className="bg-white"
                                                    value={defects[item]?.note || ""}
                                                    onChange={(e) => setDefects(prev => ({ 
                                                        ...prev, 
                                                        [item]: { ...prev[item], note: e.target.value } 
                                                    }))}
                                                />
                                                <TitanCaptureTile 
                                                    label="Take Photo" 
                                                    required 
                                                    onCapture={() => {}} // Hook up camera later
                                                    value={defects[item]?.photo}
                                                    icon={<UploadCloud className="h-6 w-6" />}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </TitanCard>
                            ))}
                        </div>
                    )}

                    {currentStep.id === "review" && (
                        <div className="space-y-6 pt-4">
                            <div className="text-center space-y-2 mb-6">
                                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-600 mb-4">
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Ready to Submit</h3>
                                <p className="text-slate-500">Review your inspection details below.</p>
                            </div>

                            <TitanCard className="divide-y divide-slate-100">
                                <div className="p-4 flex justify-between">
                                    <span className="text-slate-500">Odometer</span>
                                    <span className="font-mono font-bold">{odometer} km</span>
                                </div>
                                <div className="p-4 flex justify-between">
                                    <span className="text-slate-500">Defects Found</span>
                                    <span className={`font-bold ${Object.values(checks).includes("fail") ? "text-red-600" : "text-green-600"}`}>
                                        {Object.values(checks).filter(v => v === "fail").length}
                                    </span>
                                </div>
                            </TitanCard>
                            
                            {Object.values(checks).some(v => v === "fail") && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
                                    <h4 className="font-bold text-red-900 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" /> Attention Required
                                    </h4>
                                    <p className="text-sm text-red-700">
                                        This vehicle has reported defects. The transport manager will be notified immediately upon submission.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Floating Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur border-t border-slate-200 z-50 pb-safe">
            <div className="max-w-md mx-auto w-full">
                {currentStep.id === "review" ? (
                    <TitanButton 
                        size="lg" 
                        className="w-full shadow-titan-lg" 
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        variant={Object.values(checks).some(v => v === "fail") ? "destructive" : "primary"}
                    >
                        Submit Inspection
                    </TitanButton>
                ) : (
                    <TitanButton 
                        size="lg" 
                        className="w-full shadow-titan-lg" 
                        onClick={handleNext}
                        disabled={!canProceed()}
                    >
                        Next Step <ChevronRight className="ml-2 h-4 w-4" />
                    </TitanButton>
                )}
            </div>
        </div>
      </div>
    </DriverLayout>
  );
}
