import { useState, useRef, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanButton } from "@/components/titan-ui/Button";
import { session } from "@/lib/session";
import { api } from "@/lib/api";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import { useToast } from "@/hooks/use-toast";
import { Camera, Check, ChevronLeft, Loader2, CheckCircle2, AlertCircle, ClipboardCheck, X, Filter } from "lucide-react";
import { motion } from "framer-motion";
import type { Vehicle } from "@shared/schema";

type CheckItemType = 'pass_fail' | 'photo' | 'checkbox_photo' | 'text';

interface CheckItemDef {
  id: string;
  label: string;
  type: CheckItemType;
}

const END_OF_SHIFT_ITEMS: CheckItemDef[] = [
  { id: "cab_clean", label: "Is the cab clean and tidy?", type: "pass_fail" },
  { id: "no_litter", label: "Are there no litter or dirt on the dashboard or floor?", type: "pass_fail" },
  { id: "floor_mats", label: "Are the floor mats clean?", type: "pass_fail" },
  { id: "cab_interior_1", label: "Upload photo(s) of cab interior", type: "photo" },
  { id: "cab_interior_2", label: "Upload photo(s) of cab interior", type: "photo" },
  { id: "door_pocket_1", label: "Door pocket picture", type: "photo" },
  { id: "door_pocket_2", label: "Door pocket picture", type: "photo" },
  { id: "cab_interior_3", label: "Upload photo(s) of cab interior", type: "photo" },
  { id: "adblue_level", label: "Ad blue level", type: "photo" },
  { id: "reg_plate_in_cab", label: "Is there a registration plate inside the cab? Take a picture", type: "checkbox_photo" },
  { id: "fuel_card_photo", label: "Photo of Fuel Card", type: "photo" },
  { id: "driver_comments", label: "Driver comments", type: "text" },
  { id: "outside_right", label: "Outside picture - right side", type: "photo" },
  { id: "outside_front", label: "Outside picture - front", type: "photo" },
  { id: "outside_left", label: "Outside picture - left side", type: "photo" },
  { id: "outside_back", label: "Outside picture - back", type: "photo" },
];

interface AnswerState {
  passFail?: 'pass' | 'fail';
  checked?: boolean;
  photo?: string;
  photoFile?: File;
  text?: string;
}

export default function EndOfShiftCheck() {
  const [, params] = useRoute("/driver/end-of-shift/:vehicleId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<'instructions' | 'checklist'>('instructions');
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const company = session.getCompany();
  const user = session.getUser();
  const vehicleId = params?.vehicleId ? Number(params.vehicleId) : null;

  useEffect(() => {
    if (vehicleId) {
      setIsLoading(true);
      api.getVehicle(vehicleId)
        .then((v) => setVehicle(v))
        .catch((err) => {
          console.error("Failed to load vehicle:", err);
          toast({ variant: "destructive", title: "Error", description: "Failed to load vehicle data" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [vehicleId]);

  const updateAnswer = (id: string, patch: Partial<AnswerState>) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const handlePhotoCapture = (itemId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      updateAnswer(itemId, { photo: reader.result as string, photoFile: file });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!company || !user || !vehicleId) {
      toast({ variant: "destructive", title: "Error", description: "Session expired. Please log in again." });
      return;
    }

    setIsSubmitting(true);
    try {
      const shiftCheckRes = await fetch("/api/shift-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          companyId: company.id,
          driverId: user.id,
          vehicleId,
          type: "end_of_shift",
        }),
      });

      if (!shiftCheckRes.ok) throw new Error("Failed to create shift check");
      const shiftCheck = await shiftCheckRes.json();

      for (const item of END_OF_SHIFT_ITEMS) {
        const answer = answers[item.id];
        if (!answer) continue;

        const formData = new FormData();
        formData.append("shiftCheckId", shiftCheck.id.toString());
        formData.append("itemId", item.id);
        formData.append("label", item.label);
        formData.append("itemType", item.type);

        if (item.type === "pass_fail") {
          formData.append("status", answer.passFail === "pass" ? "passed" : answer.passFail === "fail" ? "failed" : "pending");
        }
        if (item.type === "checkbox_photo") {
          formData.append("status", answer.checked ? "passed" : "pending");
        }
        if (answer.text) {
          formData.append("notes", answer.text);
        }
        if (answer.photoFile) {
          formData.append("photo", answer.photoFile);
        }

        const itemRes = await fetch(`/api/shift-checks/${shiftCheck.id}/item`, {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        });
        if (!itemRes.ok) {
          console.error(`Failed to save item ${item.id}`);
        }
      }

      if (!isDraft) {
        let latitude = "0";
        let longitude = "0";
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          latitude = pos.coords.latitude.toString();
          longitude = pos.coords.longitude.toString();
        } catch {}

        await fetch(`/api/shift-checks/${shiftCheck.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ latitude, longitude }),
        });
      }

      toast({
        title: isDraft ? "Draft Saved" : "Inspection Submitted",
        description: isDraft ? "Your inspection has been saved as a draft." : "End of shift inspection completed successfully.",
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

  if (step === "instructions") {
    return (
      <DriverLayout>
        <div className="flex flex-col min-h-[calc(100vh-12rem)]">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setLocation("/driver")}
              className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
              data-testid="button-back-instructions"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <h1 className="text-lg font-bold text-slate-900" data-testid="text-instructions-header">Inspection Instructions</h1>
          </div>

          <TitanCard className="p-5 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-slate-900">Before you begin</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line" data-testid="text-instructions-body">
              Drivers must complete this checklist after each shift, following these steps:
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>Inspect the cab area.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>Answer all questions below.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>Upload photos showing the current condition.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>Add comments if any issues or damage are found.</span>
              </li>
            </ul>
          </TitanCard>

          <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-30">
            <div className="max-w-md mx-auto flex gap-3">
              <TitanButton
                variant="outline"
                className="flex-1"
                onClick={() => setLocation("/driver")}
                data-testid="button-instructions-back"
              >
                Back
              </TitanButton>
              <TitanButton
                className="flex-1"
                onClick={() => setStep("checklist")}
                data-testid="button-instructions-next"
              >
                Next
              </TitanButton>
            </div>
          </div>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="pb-24">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setStep("instructions")}
            className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
            data-testid="button-back-checklist"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 truncate" data-testid="text-checklist-header">
              End of shift inspection {vehicle?.vrm ? `| ${vehicle.vrm}` : ""}
            </h1>
          </div>
          <button className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors">
            <Filter className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="space-y-3">
          {END_OF_SHIFT_ITEMS.map((item, index) => {
            const answer = answers[item.id] || {};

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <TitanCard className="p-4" data-testid={`check-item-${item.id}`}>
                  {item.type === "pass_fail" && (
                    <div className="flex items-center justify-between min-h-[56px]">
                      <p className="text-sm font-medium text-slate-800 flex-1 pr-3">{item.label}</p>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => updateAnswer(item.id, { passFail: "pass" })}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            answer.passFail === "pass"
                              ? "bg-green-100 text-green-700 ring-2 ring-green-500"
                              : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                          }`}
                          data-testid={`button-pass-${item.id}`}
                        >
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            answer.passFail === "pass" ? "border-green-500 bg-green-500" : "border-slate-300"
                          }`}>
                            {answer.passFail === "pass" && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          Pass
                        </button>
                        <button
                          onClick={() => updateAnswer(item.id, { passFail: "fail" })}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            answer.passFail === "fail"
                              ? "bg-red-100 text-red-700 ring-2 ring-red-500"
                              : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                          }`}
                          data-testid={`button-fail-${item.id}`}
                        >
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            answer.passFail === "fail" ? "border-red-500 bg-red-500" : "border-slate-300"
                          }`}>
                            {answer.passFail === "fail" && <X className="h-2.5 w-2.5 text-white" />}
                          </div>
                          Fail
                        </button>
                      </div>
                    </div>
                  )}

                  {item.type === "photo" && (
                    <div className="flex items-center justify-between min-h-[56px]">
                      <div className="flex-1 pr-3">
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        {answer.photo && (
                          <div className="mt-2 relative inline-block">
                            <img
                              src={answer.photo}
                              alt={item.label}
                              className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                            />
                            <button
                              onClick={() => updateAnswer(item.id, { photo: undefined, photoFile: undefined })}
                              className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        <input
                          ref={(el) => { fileInputRefs.current[item.id] = el; }}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoCapture(item.id, file);
                          }}
                          data-testid={`input-photo-${item.id}`}
                        />
                        <button
                          onClick={() => fileInputRefs.current[item.id]?.click()}
                          className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                            answer.photo
                              ? "bg-green-100 text-green-600"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }`}
                          data-testid={`button-camera-${item.id}`}
                        >
                          {answer.photo ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Camera className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {item.type === "checkbox_photo" && (
                    <div className="flex items-center justify-between min-h-[56px]">
                      <p className="text-sm font-medium text-slate-800 flex-1 pr-3">{item.label}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          ref={(el) => { fileInputRefs.current[item.id] = el; }}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoCapture(item.id, file);
                          }}
                          data-testid={`input-photo-${item.id}`}
                        />
                        <button
                          onClick={() => fileInputRefs.current[item.id]?.click()}
                          className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                            answer.photo
                              ? "bg-green-100 text-green-600"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }`}
                          data-testid={`button-camera-${item.id}`}
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateAnswer(item.id, { checked: !answer.checked })}
                          className={`h-10 w-10 rounded-lg flex items-center justify-center border-2 transition-colors ${
                            answer.checked
                              ? "bg-primary border-primary text-white"
                              : "border-slate-300 bg-white hover:border-slate-400"
                          }`}
                          data-testid={`button-checkbox-${item.id}`}
                        >
                          {answer.checked && <Check className="h-4 w-4" />}
                        </button>
                      </div>
                      {answer.photo && (
                        <div className="mt-2 relative inline-block ml-0">
                          <img
                            src={answer.photo}
                            alt={item.label}
                            className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                          />
                          <button
                            onClick={() => updateAnswer(item.id, { photo: undefined, photoFile: undefined })}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {item.type === "text" && (
                    <div className="min-h-[56px]">
                      <input
                        type="text"
                        placeholder={item.label}
                        value={answer.text || ""}
                        onChange={(e) => updateAnswer(item.id, { text: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 placeholder:text-slate-400"
                        data-testid={`input-text-${item.id}`}
                      />
                    </div>
                  )}
                </TitanCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-30">
        <div className="max-w-md mx-auto flex gap-3">
          <TitanButton
            variant="outline"
            className="flex-1"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            data-testid="button-save-draft"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save as Draft
          </TitanButton>
          <TitanButton
            className="flex-1"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            data-testid="button-submit"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit
          </TitanButton>
        </div>
      </div>
    </DriverLayout>
  );
}
