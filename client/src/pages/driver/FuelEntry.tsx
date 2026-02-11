import { useState, useEffect } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useRoute } from "wouter";
import { ChevronLeft, Fuel, Droplets, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { session } from "@/lib/session";
import { TitanButton } from "@/components/titan-ui/Button";
import type { Vehicle } from "@shared/schema";

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

  const company = session.getCompany();
  const user = session.getUser();

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!params?.id || !company?.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/vehicles?companyId=${company.id}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !company || !user) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          vehicleId: vehicle.id,
          driverId: user.id,
          fuelType,
          odometer: Number(odometer),
          litres: litres ? Number(litres) : null,
          price: price ? Math.round(Number(price) * 100) : null,
          location: location || null,
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
      toast({
        title: "Error",
        description: err.message || "Failed to save fuel entry",
        variant: "destructive",
      });
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 space-y-4">
            <div>
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Fuel Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFuelType("DIESEL")}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    fuelType === "DIESEL"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  data-testid="button-fuel-diesel"
                >
                  <Fuel className={`h-5 w-5 ${fuelType === "DIESEL" ? "text-blue-600" : "text-slate-400"}`} />
                  <span className={`font-medium ${fuelType === "DIESEL" ? "text-blue-700" : "text-slate-700"}`}>Diesel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFuelType("ADBLUE")}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    fuelType === "ADBLUE"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
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

          <div className="fixed inset-x-0 bottom-16 z-40 border-t border-slate-200/60 bg-white/85 backdrop-blur px-4 py-3">
            <div className="max-w-md mx-auto">
              <TitanButton
                size="lg"
                className="w-full"
                type="submit"
                disabled={!odometer || isSubmitting}
                isLoading={isSubmitting}
                data-testid="button-submit-fuel"
              >
                {isSubmitting ? "Saving..." : "Save Fuel Entry"}
              </TitanButton>
            </div>
          </div>
        </form>
      </div>
    </DriverLayout>
  );
}
