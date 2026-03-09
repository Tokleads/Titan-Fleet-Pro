import { useState, useEffect, useRef } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { useLocation, useRoute } from "wouter";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import type { Vehicle } from "@shared/schema";
import { ChevronLeft, Camera, Loader2, AlertTriangle, X, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function DefectReport() {
  const [, params] = useRoute("/driver/defect/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defectNote, setDefectNote] = useState("");
  const [photos, setPhotos] = useState<{ objectPath: string; preview: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const company = session.getCompany();
  const user = session.getUser();

  useEffect(() => {
    if (params?.id) {
      loadVehicle(Number(params.id));
    }
  }, [params?.id]);

  useEffect(() => {
    return () => {
      photos.forEach(p => URL.revokeObjectURL(p.preview));
    };
  }, []);

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

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    const previewUrl = URL.createObjectURL(file);
    setIsUploading(true);

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

      if (!response.ok) throw new Error("Failed to get upload URL");

      const { uploadURL, objectPath } = await response.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      setPhotos(prev => [...prev, { objectPath, preview: previewUrl }]);
      toast({ title: "Photo uploaded", description: "Photo evidence captured successfully" });
    } catch (error) {
      console.error("Photo upload failed:", error);
      URL.revokeObjectURL(previewUrl);
      toast({ variant: "destructive", title: "Upload failed", description: "Could not upload photo. Please try again." });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
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
      const res = await fetch("/api/defects", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        credentials: "include",
        body: JSON.stringify({
          companyId: company.id,
          vehicleId: vehicle.id,
          reportedBy: user.id,
          description: defectNote,
          category: "VEHICLE",
          severity: "MEDIUM",
          status: "OPEN",
          photo: photos.length > 0 ? photos[0].objectPath : null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to submit defect");
      }

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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
              data-testid="input-defect-photo-file"
            />

            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo, idx) => (
                <div key={idx} className="aspect-square rounded-xl border-2 border-emerald-200 relative overflow-hidden">
                  <img
                    src={photo.preview}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                    data-testid={`img-defect-photo-${idx}`}
                  />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 shadow flex items-center justify-center"
                    data-testid={`button-remove-photo-${idx}`}
                  >
                    <X className="h-4 w-4 text-slate-600" />
                  </button>
                </div>
              ))}

              {photos.length < 2 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                  data-testid="button-add-photo"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-8 w-8 text-slate-400 mb-1 animate-spin" />
                      <span className="text-xs text-slate-500 font-medium">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500 font-medium">
                        {photos.length === 0 ? "Add Photo" : "Add Photo 2"}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-3 text-center">Tap to capture photo evidence (up to 2 photos)</p>
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
              disabled={!defectNote.trim() || isUploading}
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
