import { useState, useEffect, useRef } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useRoute } from "wouter";
import { ChevronLeft, Fuel, Droplets, MapPin, Loader2, Camera, X, Receipt, CreditCard, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { session } from "@/lib/session";
import { TitanButton } from "@/components/titan-ui/Button";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import type { Vehicle } from "@shared/schema";

interface PhotoUploadProps {
  label: string;
  icon: React.ReactNode;
  photoPreview: string | null;
  onCapture: (file: File) => void;
  onRemove: () => void;
  uploading: boolean;
  uploaded: boolean;
  testId: string;
}

function PhotoUploadCard({ label, icon, photoPreview, onCapture, onRemove, uploading, uploaded, testId }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      {photoPreview ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <img src={photoPreview} alt={label} className="w-full h-40 object-cover" />
          <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/40 to-transparent">
            {uploaded && (
              <span className="flex items-center gap-1 text-xs text-white font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                Uploaded
              </span>
            )}
            {uploading && (
              <span className="flex items-center gap-1 text-xs text-white font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading…
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            data-testid={`${testId}-remove`}
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-28 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 group"
          data-testid={`${testId}-tap`}
        >
          <Camera className="h-7 w-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
          <span className="text-sm text-slate-500 group-hover:text-blue-600 transition-colors">Tap to take photo</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        data-testid={`${testId}-input`}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onCapture(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function FuelEntry() {
  const [, params] = useRoute("/driver/fuel/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fuelType, setFuelType] = useState<"DIESEL" | "ADBLUE">("DIESEL");
  const [odometer, setOdometer] = useState("");
  const [litres, setLitres] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocationVal] = useState("");

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);

  const [fuelCardFile, setFuelCardFile] = useState<File | null>(null);
  const [fuelCardPreview, setFuelCardPreview] = useState<string | null>(null);
  const [fuelCardUrl, setFuelCardUrl] = useState<string | null>(null);
  const [fuelCardUploading, setFuelCardUploading] = useState(false);

  const company = session.getCompany();
  const user = session.getUser();

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!params?.id || !company?.id) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/vehicles?companyId=${company.id}`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          const vehicles: Vehicle[] = Array.isArray(data) ? data : (data.vehicles || []);
          const found = vehicles.find(v => v.id === Number(params.id));
          setVehicle(found || null);
        }
      } catch (err) {
        console.error("Failed to fetch vehicle:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [params?.id, company?.id]);

  async function uploadPhoto(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("photo", file);
    const res = await fetch("/api/fuel/upload-photo", { method: "POST", headers: authHeaders(), body: fd });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
    }
    const data = await res.json();
    return data.url as string;
  }

  async function handleReceiptCapture(file: File) {
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setReceiptUrl(null);
    setReceiptUploading(true);
    try {
      const url = await uploadPhoto(file);
      setReceiptUrl(url);
    } catch (err: any) {
      toast({ title: "Receipt upload failed", description: err.message, variant: "destructive" });
      setReceiptFile(null);
      setReceiptPreview(null);
    } finally {
      setReceiptUploading(false);
    }
  }

  function handleReceiptRemove() {
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptUrl(null);
  }

  async function handleFuelCardCapture(file: File) {
    setFuelCardFile(file);
    setFuelCardPreview(URL.createObjectURL(file));
    setFuelCardUrl(null);
    setFuelCardUploading(true);
    try {
      const url = await uploadPhoto(file);
      setFuelCardUrl(url);
    } catch (err: any) {
      toast({ title: "Fuel card upload failed", description: err.message, variant: "destructive" });
      setFuelCardFile(null);
      setFuelCardPreview(null);
    } finally {
      setFuelCardUploading(false);
    }
  }

  function handleFuelCardRemove() {
    setFuelCardFile(null);
    setFuelCardPreview(null);
    setFuelCardUrl(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !company || !user) return;

    if ((receiptFile && !receiptUrl) || (fuelCardFile && !fuelCardUrl)) {
      toast({ title: "Please wait", description: "Photos are still uploading", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          companyId: company.id,
          vehicleId: vehicle.id,
          driverId: user.id,
          fuelType,
          odometer: Number(odometer),
          litres: litres ? Number(litres) : null,
          price: price ? Math.round(Number(price) * 100) : null,
          location: location || null,
          receiptPhotoUrl: receiptUrl || null,
          fuelCardPhotoUrl: fuelCardUrl || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save fuel entry");
      }

      toast({
        title: "Fuel Entry Saved",
        description: `${litres ? litres + "L " : ""}${fuelType.charAt(0) + fuelType.slice(1).toLowerCase()} recorded for ${vehicle.vrm}`,
        className: "border-green-500 bg-green-50",
      });
      setLocation("/driver");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save fuel entry", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </DriverLayout>
    );
  }

  if (!vehicle) {
    return (
      <DriverLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-slate-500">Vehicle not found</p>
          <TitanButton variant="outline" onClick={() => setLocation("/driver")}>
            Back to Dashboard
          </TitanButton>
        </div>
      </DriverLayout>
    );
  }

  const isPhotosUploading = receiptUploading || fuelCardUploading;

  return (
    <DriverLayout>
      <div className="space-y-6 pb-32">
        <div className="flex items-center gap-2 mb-4">
          <TitanButton variant="ghost" size="icon" onClick={() => setLocation(`/driver/vehicle/${vehicle.id}`)} className="h-9 w-9 -ml-2">
            <ChevronLeft className="h-5 w-5" />
          </TitanButton>
          <div>
            <h2 className="font-heading font-bold text-xl">Fuel Entry</h2>
            <p className="text-sm text-slate-500">{vehicle.vrm} &middot; {vehicle.make} {vehicle.model}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fuel details card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 space-y-4">
            <div>
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Fuel Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFuelType("DIESEL")}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${fuelType === "DIESEL" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  data-testid="button-fuel-diesel"
                >
                  <Fuel className={`h-5 w-5 ${fuelType === "DIESEL" ? "text-blue-600" : "text-slate-400"}`} />
                  <span className={`font-medium ${fuelType === "DIESEL" ? "text-blue-700" : "text-slate-700"}`}>Diesel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFuelType("ADBLUE")}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${fuelType === "ADBLUE" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  data-testid="button-fuel-adblue"
                >
                  <Droplets className={`h-5 w-5 ${fuelType === "ADBLUE" ? "text-blue-600" : "text-slate-400"}`} />
                  <span className={`font-medium ${fuelType === "ADBLUE" ? "text-blue-700" : "text-slate-700"}`}>AdBlue</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Odometer (miles)</Label>
              <Input
                type="number"
                placeholder="e.g. 125000"
                required
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="text-lg h-12"
                data-testid="input-odometer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Litres</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={litres}
                  onChange={(e) => setLitres(e.target.value)}
                  className="text-lg h-12"
                  data-testid="input-litres"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Cost (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="text-lg h-12"
                  data-testid="input-price"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                <MapPin className="h-3.5 w-3.5 inline mr-1" />
                Location (optional)
              </Label>
              <Input
                type="text"
                placeholder="e.g. BP Northampton Services"
                value={location}
                onChange={(e) => setLocationVal(e.target.value)}
                className="h-12"
                data-testid="input-location"
              />
            </div>
          </div>

          {/* Photo uploads card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 space-y-5">
            <div>
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Evidence Photos</h3>
              <p className="text-xs text-slate-400">Take a photo of your receipt and fuel card for records</p>
            </div>

            <PhotoUploadCard
              label="Receipt"
              icon={<Receipt className="h-3.5 w-3.5" />}
              photoPreview={receiptPreview}
              onCapture={handleReceiptCapture}
              onRemove={handleReceiptRemove}
              uploading={receiptUploading}
              uploaded={!!receiptUrl}
              testId="receipt-photo"
            />

            <PhotoUploadCard
              label="Fuel Card"
              icon={<CreditCard className="h-3.5 w-3.5" />}
              photoPreview={fuelCardPreview}
              onCapture={handleFuelCardCapture}
              onRemove={handleFuelCardRemove}
              uploading={fuelCardUploading}
              uploaded={!!fuelCardUrl}
              testId="fuelcard-photo"
            />
          </div>

          <div className="fixed inset-x-0 bottom-16 z-40 border-t border-slate-200/60 bg-white/85 backdrop-blur px-4 py-3">
            <div className="max-w-md mx-auto">
              <TitanButton
                size="lg"
                className="w-full"
                type="submit"
                disabled={!odometer || isSubmitting || isPhotosUploading}
                isLoading={isSubmitting}
                data-testid="button-submit-fuel"
              >
                {isPhotosUploading ? "Uploading photos…" : isSubmitting ? "Saving…" : "Save Fuel Entry"}
              </TitanButton>
            </div>
          </div>
        </form>
      </div>
    </DriverLayout>
  );
}
