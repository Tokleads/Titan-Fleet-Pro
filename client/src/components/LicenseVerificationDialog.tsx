import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield, Crown, Lock } from "lucide-react";

interface LicenseVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverId: number;
  driverName: string;
  companyId: number;
  managerId: number;
}

export function LicenseVerificationDialog({
  open,
  onOpenChange,
  driverName,
}: LicenseVerificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <DialogTitle>License Verification — {driverName}</DialogTitle>
          </div>
          <DialogDescription>
            Manual verification required. Live DVLA lookup not yet active.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-900">
              <strong>Live DVLA lookup is not yet active.</strong> You must verify this
              driver&apos;s licence manually using the official DVLA service.
            </AlertDescription>
          </Alert>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-600" />
              How to verify manually
            </p>
            <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
              <li>
                Ask the driver to share their licence check code via{" "}
                <a
                  href="https://www.gov.uk/view-driving-licence"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline font-medium"
                >
                  gov.uk/view-driving-licence
                </a>
              </li>
              <li>
                Use the code at{" "}
                <a
                  href="https://www.gov.uk/check-driving-information"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline font-medium"
                >
                  gov.uk/check-driving-information
                </a>
              </li>
              <li>
                Record the outcome in the driver&apos;s file and update their record in the
                driver profile
              </li>
            </ol>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Live verification coming soon
            </p>
            <p className="text-xs text-blue-700">
              Automated DVLA lookup with penalty points, endorsements, and entitlement data
              will be available in a future release. Licence records can be recorded manually
              in the driver profile in the meantime.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
