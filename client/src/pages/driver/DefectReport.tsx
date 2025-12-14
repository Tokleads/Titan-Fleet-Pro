import { useState, useEffect } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { useLocation, useRoute } from "wouter";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import type { Vehicle } from "@shared/schema";
import { ChevronLeft, Camera, Loader2, AlertTriangle, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function DefectReport() {
  const [, params] = useRoute("/driver/defect/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defectNote, setDefectNote] = useState("");
  const [photo1, setPhoto1] = useState<string | null>(null);
  const [photo2, setPhoto2] = useState<string | null>(null);

  const company = session.getCompany();
  const user = session.getUser();

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

  const handleSubmit = async () => {
    if (!company || !user || !vehicle) {
      toast({ variant: "destructive", title: "Error", description: "Session expired. Please log in again." });
      return;
    }

    if (!defectNote.trim()) {
      toast({ variant: "destructive", title: "Description Required", description: "Please describe the fault." });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createDefect({
        companyId: company.id,
        vehicleId: vehicle.id,
        reportedBy: user.id,
        description: defectNote,
        hasPhoto: !!(photo1 || photo2),
      });

      toast({
        title: "Fault Reported",
        description: "Manager has been notified of the issue.",
        className: "border-amber-500 bg-amber-50",
      });

      setLocation(`/driver/vehicle/${vehicle.id}`);
    } catch (error) {
      console.error("Failed to submit defect:", error);
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
          <TitanButton variant="outline" onClick={() => setLocation("/driver")} className="mt-4">
            Back to Dashboard
          </TitanButton>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="pb-28">
        <div className="flex items-center gap-3 mb-6">
          <TitanButton variant="ghost" size="icon" onClick={() => setLocation(`/driver/vehicle/${vehicle.id}`)} className="h-9 w-9 -ml-2">
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </TitanButton>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">Report Fault</h1>
            <p className="text-sm text-slate-500">{vehicle.vrm} · {vehicle.make} {vehicle.model}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
        </div>

        <div className="space-y-4">
          <TitanCard className="p-4">
            <label className="titan-section-label block mb-2">Fault Description</label>
            <Textarea
              placeholder="Describe the fault in detail..."
              value={defectNote}
              onChange={(e) => setDefectNote(e.target.value)}
              className="min-h-[120px] text-base"
              data-testid="input-defect-description"
            />
          </TitanCard>

          <TitanCard className="p-4">
            <label className="titan-section-label block mb-3">Photo Evidence</label>
            <div className="grid grid-cols-2 gap-3">
              {photo1 ? (
                <div className="aspect-square rounded-xl bg-emerald-50 border-2 border-emerald-200 flex flex-col items-center justify-center relative">
                  <Check className="h-8 w-8 text-emerald-600 mb-1" />
                  <span className="text-xs text-emerald-700 font-medium">Photo 1</span>
                  <button 
                    onClick={() => setPhoto1(null)}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white shadow flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPhoto1(`captured_${Date.now()}`)}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                  data-testid="button-photo-1"
                >
                  <Camera className="h-8 w-8 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500 font-medium">Photo 1</span>
                </button>
              )}
              
              {photo2 ? (
                <div className="aspect-square rounded-xl bg-emerald-50 border-2 border-emerald-200 flex flex-col items-center justify-center relative">
                  <Check className="h-8 w-8 text-emerald-600 mb-1" />
                  <span className="text-xs text-emerald-700 font-medium">Photo 2</span>
                  <button 
                    onClick={() => setPhoto2(null)}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white shadow flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPhoto2(`captured_${Date.now()}`)}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                  data-testid="button-photo-2"
                >
                  <Camera className="h-8 w-8 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500 font-medium">Photo 2</span>
                </button>
              )}
            </div>
            <p className="titan-micro mt-3 text-center">Tap to capture photo evidence</p>
          </TitanCard>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/60 bg-white/85 backdrop-blur px-4 py-3 pb-safe">
          <div className="max-w-md mx-auto flex gap-3">
            <TitanButton 
              variant="outline" 
              className="flex-1"
              onClick={() => setLocation(`/driver/vehicle/${vehicle.id}`)}
            >
              Cancel
            </TitanButton>
            <TitanButton 
              variant="destructive"
              className="flex-1"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!defectNote.trim()}
              data-testid="button-submit-defect"
            >
              Submit Fault
            </TitanButton>
          </div>
        </div>
      </div>
    </DriverLayout>
  );
}
