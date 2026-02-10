import { useState, useEffect, useRef } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanButton } from "@/components/titan-ui/Button";
import { SignaturePad } from "@/components/SignaturePad";
import { session } from "@/lib/session";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";
import { api } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Camera, ChevronLeft, MapPin, Check, Loader2, X, Trash2, Package, Clock } from "lucide-react";
import { HelpTooltip } from "@/components/titan-ui/HelpTooltip";
import type { Vehicle } from "@shared/schema";

export default function CompleteDelivery() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();

  const urlParams = new URLSearchParams(searchString);
  const vehicleIdParam = urlParams.get("vehicleId");

  const user = session.getUser();
  const company = session.getCompany();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const [photos, setPhotos] = useState<{ objectPath: string; preview: string }[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [signatureObjectPath, setSignatureObjectPath] = useState<string | null>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [arrivedAt, setArrivedAt] = useState<Date | null>(null);
  const [departedAt, setDepartedAt] = useState<Date | null>(null);
  const [isOnSite, setIsOnSite] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkDate = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    if (!user || !company) {
      setLocation("/app");
      return;
    }
    if (vehicleIdParam) {
      loadVehicle(Number(vehicleIdParam));
    } else {
      loadRecentVehicle();
    }
  }, [vehicleIdParam]);

  const loadRecentVehicle = async () => {
    if (!user || !company) return;
    setIsLoadingVehicle(true);
    try {
      const vehicles = await api.getRecentVehicles(company.id, user.id, 5);
      setRecentVehicles(vehicles);
      if (vehicles.length > 0) {
        setVehicle(vehicles[0]);
      }
    } catch {
      // If recent vehicles fails, try fetching all vehicles
      try {
        const result = await api.getVehicles(company.id);
        if (result && result.length > 0) {
          setRecentVehicles(result);
          setVehicle(result[0]);
        }
      } catch {}
    } finally {
      setIsLoadingVehicle(false);
    }
  };

  useEffect(() => {
    if (!arrivedAt || departedAt) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - arrivedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [arrivedAt, departedAt]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
    if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
    return `${s}s`;
  };

  const formatTimeUK = (date: Date) => {
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const handleLogArrival = () => {
    setArrivedAt(new Date());
    setIsOnSite(true);
  };

  const handleLogDeparture = () => {
    const now = new Date();
    setDepartedAt(now);
    setIsOnSite(false);
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsAccuracy(position.coords.accuracy);
        setGpsError(null);
      },
      (error) => {
        setGpsError(error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const loadVehicle = async (id: number) => {
    setIsLoadingVehicle(true);
    try {
      const v = await api.getVehicle(id);
      setVehicle(v);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load vehicle" });
    } finally {
      setIsLoadingVehicle(false);
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    if (photos.length >= 5) {
      toast({ variant: "destructive", title: "Maximum reached", description: "You can add up to 5 photos" });
      return;
    }

    setIsUploadingPhoto(true);
    setUploadProgress(10);

    try {
      const res = await fetch("/api/deliveries/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          filename: `photo-${Date.now()}.jpg`,
          contentType: "image/jpeg",
          type: "photo",
        }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await res.json();
      setUploadProgress(40);

      await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: file,
      });
      setUploadProgress(90);

      const preview = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, { objectPath, preview }]);
      setUploadProgress(100);
    } catch {
      toast({ variant: "destructive", title: "Upload failed", description: "Could not upload photo" });
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress(0);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSignatureChange = async (dataUrl: string | null) => {
    if (!dataUrl || !company) {
      setSignatureObjectPath(null);
      return;
    }

    setIsUploadingSignature(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();

      const res = await fetch("/api/deliveries/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          filename: `signature-${Date.now()}.png`,
          contentType: "image/png",
          type: "signature",
        }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await res.json();

      await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        body: blob,
      });

      setSignatureObjectPath(objectPath);
    } catch {
      toast({ variant: "destructive", title: "Upload failed", description: "Could not upload signature" });
      setSignatureObjectPath(null);
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const canSubmit =
    customerName.trim().length > 0 &&
    photos.length >= 1 &&
    !!signatureObjectPath &&
    !!vehicle &&
    !isUploadingPhoto &&
    !isUploadingSignature;

  const handleSubmit = async () => {
    if (!canSubmit || !company || !user || !vehicle) return;

    setIsSubmitting(true);
    try {
      const body = {
        companyId: company.id,
        driverId: user.id,
        vehicleId: vehicle.id,
        customerName: customerName.trim(),
        deliveryAddress: deliveryAddress.trim(),
        referenceNumber: referenceNumber.trim(),
        signatureUrl: signatureObjectPath,
        photoUrls: photos.map((p) => p.objectPath),
        deliveryNotes: deliveryNotes.trim(),
        gpsLatitude: gpsLocation ? String(gpsLocation.lat) : null,
        gpsLongitude: gpsLocation ? String(gpsLocation.lng) : null,
        gpsAccuracy: gpsAccuracy,
        arrivedAt: arrivedAt ? arrivedAt.toISOString() : null,
        departedAt: departedAt ? departedAt.toISOString() : null,
        completedAt: new Date().toISOString(),
        status: "completed",
      };

      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to submit delivery");

      toast({
        title: "Delivery Sent to Manager",
        description: `POD for ${customerName} sent. Your manager has been notified and can download the PDF.`,
        className: "border-green-500 bg-green-50",
      });
      setLocation("/driver");
    } catch {
      toast({ variant: "destructive", title: "Submission Failed", description: "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !company) return null;

  return (
    <DriverLayout>
      <div className="pb-28 titan-page-enter">
        <div className="flex items-center gap-3 mb-4">
          <TitanButton
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/driver")}
            className="h-9 w-9 -ml-2"
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </TitanButton>
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 truncate">
              Complete Delivery <HelpTooltip term="POD" />
            </h1>
            <p className="text-[13px] text-slate-500">{checkDate}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
        </div>

        {isLoadingVehicle ? (
          <div className="titan-card p-5 flex items-center justify-center mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : vehicle ? (
          <div className="titan-card p-4 mb-4" data-testid="card-vehicle">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900" data-testid="text-vehicle-vrm">{vehicle.vrm}</p>
                <p className="text-[13px] text-slate-500">{vehicle.make} {vehicle.model}</p>
              </div>
              {recentVehicles.length > 1 && (
                <select
                  value={vehicle.id}
                  onChange={(e) => {
                    const v = recentVehicles.find(rv => rv.id === Number(e.target.value));
                    if (v) setVehicle(v);
                  }}
                  className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  data-testid="select-vehicle"
                >
                  {recentVehicles.map(rv => (
                    <option key={rv.id} value={rv.id}>
                      {rv.vrm} — {rv.make} {rv.model}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ) : (
          <div className="titan-card p-5 text-center mb-4">
            <p className="text-slate-500 text-sm" data-testid="text-no-vehicle">
              No recent vehicles found
            </p>
            <TitanButton
              variant="outline"
              onClick={() => setLocation("/driver")}
              className="mt-3"
            >
              Go to Dashboard
            </TitanButton>
          </div>
        )}

        <div className="space-y-4">
          <div className="titan-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="titan-section">Delivery Timing</h2>
            </div>

            {!arrivedAt ? (
              <button
                type="button"
                onClick={handleLogArrival}
                className="w-full flex items-center justify-center gap-3 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-base transition-colors"
                style={{ minHeight: 56 }}
                data-testid="button-log-arrival"
              >
                <Clock className="h-5 w-5" />
                Log Arrival
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-[13px] font-medium text-green-700">Arrived at {formatTimeUK(arrivedAt)}</span>
                </div>

                {!departedAt && (
                  <div className="flex items-center gap-2 text-[13px] text-slate-600" data-testid="text-time-on-site-live">
                    <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                    <span>Time on site: <span className="font-semibold text-slate-900">{formatDuration(elapsedSeconds)}</span></span>
                  </div>
                )}

                {departedAt && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-600" />
                      <span className="text-[13px] font-medium text-amber-700">Departed at {formatTimeUK(departedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-slate-600" data-testid="text-on-site-duration">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>On site: <span className="font-semibold text-slate-900">{formatDuration(Math.floor((departedAt.getTime() - arrivedAt.getTime()) / 1000))}</span></span>
                    </div>
                  </div>
                )}

                {!departedAt && (
                  <button
                    type="button"
                    onClick={handleLogDeparture}
                    className="w-full flex items-center justify-center gap-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-base transition-colors"
                    style={{ minHeight: 56 }}
                    data-testid="button-log-departure"
                  >
                    <Clock className="h-5 w-5" />
                    Log Departure
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="titan-card p-4">
            <h2 className="titan-section mb-3">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[13px] font-medium text-slate-700 mb-1 block">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-slate-700 mb-1 block">
                  Delivery Address
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  data-testid="input-delivery-address"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-slate-700 mb-1 block">
                  Reference / Job Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Enter reference number"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  data-testid="input-reference"
                />
              </div>
            </div>
          </div>

          <div className="titan-card p-4">
            <h2 className="titan-section mb-3">Delivery Notes</h2>
            <Textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Left with receptionist, goods inspected OK"
              rows={3}
              className="rounded-xl border-slate-200 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              data-testid="input-delivery-notes"
            />
          </div>

          <div className="titan-card p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="titan-section">Delivery Photos</h2>
              <span className="text-[12px] text-slate-400 font-medium">{photos.length}/5</span>
            </div>
            <p className="text-[13px] text-slate-500 mb-3">
              Photograph goods at delivery point (min 1, max 5)
            </p>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden aspect-square bg-slate-100">
                    <img
                      src={photo.preview}
                      alt={`Delivery photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      data-testid={`img-photo-${idx}`}
                    />
                    <button
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      data-testid={`button-delete-photo-${idx}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isUploadingPhoto && (
              <div className="mb-3">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[12px] text-slate-400 mt-1">Uploading photo...</p>
              </div>
            )}

            {photos.length < 5 && (
              <TitanButton
                variant="outline"
                className="w-full"
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                data-testid="button-add-photo"
              >
                <Camera className="h-4 w-4 mr-2" />
                {photos.length === 0 ? "Take Photo" : "Add Another Photo"}
              </TitanButton>
            )}
          </div>

          <div className="titan-card p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="titan-section">Customer Signature</h2>
              {signatureObjectPath && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-[12px] font-medium">Captured</span>
                </div>
              )}
            </div>
            <p className="text-[13px] text-slate-500 mb-3">
              Customer must sign to confirm receipt
            </p>
            <SignaturePad onSignatureChange={handleSignatureChange} />
            {isUploadingSignature && (
              <div className="flex items-center gap-2 mt-2 text-[13px] text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading signature...
              </div>
            )}
          </div>

          <div className="titan-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="titan-section">GPS Location</h2>
            </div>
            {gpsError ? (
              <p className="text-[13px] text-amber-600" data-testid="text-gps-error">
                Location unavailable: {gpsError}
              </p>
            ) : gpsLocation ? (
              <div>
                <p className="text-[13px] text-slate-600" data-testid="text-gps-location">
                  Location: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                </p>
                {gpsAccuracy !== null && (
                  <p className={`text-[12px] mt-0.5 ${gpsAccuracy > 100 ? "text-amber-600" : "text-slate-400"}`} data-testid="text-gps-accuracy">
                    Accuracy: ±{Math.round(gpsAccuracy)}m
                    {gpsAccuracy > 100 && " (weak signal)"}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[13px] text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Acquiring location...
              </div>
            )}
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/60 bg-white/85 backdrop-blur px-4 py-3 pb-safe">
          <div className="max-w-md mx-auto space-y-2">
            <TitanButton
              size="lg"
              className="w-full titan-btn-press"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!canSubmit}
              data-testid="button-submit"
            >
              {!vehicle
                ? "Select a vehicle first"
                : !customerName.trim()
                  ? "Enter customer name"
                  : photos.length === 0
                    ? "Add at least 1 photo"
                    : !signatureObjectPath
                      ? "Capture signature"
                      : "Submit to Manager"}
            </TitanButton>
            {canSubmit && (
              <p className="text-center text-[12px] text-slate-500">
                POD will be sent to your transport manager
              </p>
            )}
          </div>
        </div>
      </div>
    </DriverLayout>
  );
}
