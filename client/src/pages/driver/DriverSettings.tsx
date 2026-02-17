import { useState } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { session } from "@/lib/session";
import { useLocation } from "wouter";
import { User, Building2, LogOut, Bell, Shield, ChevronRight, KeyRound } from "lucide-react";
import { TitanButton } from "@/components/titan-ui/Button";
import { useBrand } from "@/hooks/use-brand";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DriverSettings() {
  const [, setLocation] = useLocation();
  const user = session.getUser();
  const company = session.getCompany();
  const { currentCompany } = useBrand();
  const { toast } = useToast();

  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const handleLogout = () => {
    session.clear();
    setLocation("/app");
  };

  const resetPinForm = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  };

  const handleChangePin = async () => {
    if (!/^\d{4}$/.test(currentPin)) {
      toast({ title: "Invalid PIN", description: "Current PIN must be exactly 4 digits.", variant: "destructive" });
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      toast({ title: "Invalid PIN", description: "New PIN must be exactly 4 digits.", variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: "PINs don't match", description: "New PIN and confirmation must match.", variant: "destructive" });
      return;
    }
    if (currentPin === newPin) {
      toast({ title: "Same PIN", description: "New PIN must be different from your current PIN.", variant: "destructive" });
      return;
    }

    setPinLoading(true);
    try {
      const verifyRes = await fetch("/api/drivers/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: user?.id,
          companyId: company?.id,
          pin: currentPin,
        }),
      });

      if (!verifyRes.ok) {
        toast({ title: "Error", description: "Failed to verify current PIN.", variant: "destructive" });
        return;
      }

      const { valid } = await verifyRes.json();
      if (!valid) {
        toast({ title: "Wrong PIN", description: "Your current PIN is incorrect.", variant: "destructive" });
        return;
      }

      const updateRes = await fetch(`/api/drivers/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company?.id,
          pin: newPin,
        }),
      });

      if (!updateRes.ok) {
        const data = await updateRes.json();
        toast({ title: "Error", description: data.error || "Failed to update PIN.", variant: "destructive" });
        return;
      }

      toast({ title: "PIN Updated", description: "Your PIN has been changed successfully." });
      setPinDialogOpen(false);
      resetPinForm();
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <DriverLayout>
      <div className="pb-4">
        <h1 className="text-xl font-bold text-slate-900 mb-4">Settings</h1>

        <div className="titan-card p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 text-lg" data-testid="text-user-name">
                {user?.name || "Driver"}
              </p>
              <p className="text-sm text-slate-500" data-testid="text-user-role">
                {user?.role === "MANAGER" ? "Manager" : "Driver"}
              </p>
            </div>
          </div>
        </div>

        <div className="titan-card overflow-hidden mb-4">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-slate-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Company</p>
              <p className="text-xs text-slate-500">{currentCompany?.name || company?.companyCode || "—"}</p>
            </div>
          </div>
          <button
            onClick={() => setLocation("/driver/notifications")}
            className="w-full p-4 border-b border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors"
            data-testid="button-notification-settings"
          >
            <Bell className="h-5 w-5 text-slate-500" />
            <span className="flex-1 text-sm font-medium text-slate-900 text-left">Notifications</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
          <button
            onClick={() => setPinDialogOpen(true)}
            className="w-full p-4 border-b border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors"
            data-testid="button-change-pin"
          >
            <KeyRound className="h-5 w-5 text-slate-500" />
            <span className="flex-1 text-sm font-medium text-slate-900 text-left">Change PIN</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
          <div className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-slate-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">App Version</p>
              <p className="text-xs text-slate-500">Titan Fleet v1.0</p>
            </div>
          </div>
        </div>

        <TitanButton
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </TitanButton>
      </div>

      <Dialog open={pinDialogOpen} onOpenChange={(open) => { setPinDialogOpen(open); if (!open) resetPinForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change PIN</DialogTitle>
            <DialogDescription>
              Enter your current PIN and choose a new 4-digit PIN.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="current-pin">Current PIN</Label>
              <Input
                id="current-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                data-testid="input-current-pin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pin">New PIN</Label>
              <Input
                id="new-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                data-testid="input-new-pin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pin">Confirm New PIN</Label>
              <Input
                id="confirm-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                data-testid="input-confirm-pin"
              />
            </div>
          </div>
          <DialogFooter>
            <TitanButton variant="outline" onClick={() => { setPinDialogOpen(false); resetPinForm(); }} data-testid="button-cancel-pin">
              Cancel
            </TitanButton>
            <TitanButton onClick={handleChangePin} disabled={pinLoading} data-testid="button-save-pin">
              {pinLoading ? "Saving..." : "Update PIN"}
            </TitanButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DriverLayout>
  );
}
