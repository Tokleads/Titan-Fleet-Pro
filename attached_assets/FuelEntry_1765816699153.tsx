import { useState } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useRoute } from "wouter";
import { MOCK_VEHICLES } from "@/lib/mockData";
import { Camera, ChevronLeft, Fuel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FuelEntry() {
  const [, params] = useRoute("/driver/fuel/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const vehicle = MOCK_VEHICLES.find(v => v.id === params?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    toast({ title: "Fuel Entry Saved", description: "Receipt uploaded to Drive." });
    setLocation("/driver");
  };

  if (!vehicle) return <div>Vehicle not found</div>;

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/driver")}>
                <ChevronLeft />
            </Button>
            <div>
                <h2 className="font-heading font-bold text-xl">Fuel Entry</h2>
                <p className="text-sm text-slate-500">{vehicle.reg}</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="space-y-2">
                    <Label>Current Odometer (km)</Label>
                    <Input type="number" placeholder="e.g. 125000" required className="text-lg h-12" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Diesel (Litres)</Label>
                        <Input type="number" placeholder="0" className="text-lg h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label>AdBlue (Litres)</Label>
                        <Input type="number" placeholder="0" className="text-lg h-12" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <Label>Receipts & Evidence</Label>
                <div className="grid grid-cols-2 gap-4">
                    <Button type="button" variant="outline" className="h-32 flex flex-col gap-3 border-dashed border-2">
                        <Camera className="h-8 w-8 text-slate-400" />
                        <span className="text-xs text-slate-500">Fuel Receipt</span>
                    </Button>
                    <Button type="button" variant="outline" className="h-32 flex flex-col gap-3 border-dashed border-2">
                        <Camera className="h-8 w-8 text-slate-400" />
                        <span className="text-xs text-slate-500">Pump/Card</span>
                    </Button>
                </div>
            </div>

            <Button size="lg" className="w-full h-12 text-lg" disabled={isSubmitting}>
                {isSubmitting ? "Uploading..." : "Save Entry"}
            </Button>
        </form>
      </div>
    </DriverLayout>
  );
}
