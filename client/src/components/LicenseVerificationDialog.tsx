import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";

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
  driverId,
  driverName,
  companyId,
  managerId
}: LicenseVerificationDialogProps) {
  const [licenseNumber, setLicenseNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!licenseNumber || licenseNumber.length !== 16) {
      setError("Please enter a valid 16-character UK driving license number");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      const response = await fetch(`/api/manager/drivers/${driverId}/verify-license`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseNumber: licenseNumber.toUpperCase(),
          companyId,
          initiatedBy: managerId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setVerificationResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify license");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setLicenseNumber("");
    setVerificationResult(null);
    setError(null);
    onOpenChange(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Verify Driver License
          </DialogTitle>
          <DialogDescription>
            Verify {driverName}'s UK driving license with DVLA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* License Number Input */}
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">UK Driving License Number</Label>
            <Input
              id="licenseNumber"
              placeholder="e.g., TCAEU610267NO9EK"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
              maxLength={16}
              disabled={isVerifying}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Enter the 16-character license number (format: 5 letters + 6 digits + 2 letters + 2 digits + 1 letter)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              {verificationResult.success ? (
                <>
                  {/* Success Header */}
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">License Verified Successfully</h3>
                  </div>

                  {/* Driver Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Full Name</Label>
                      <p className="font-medium">
                        {verificationResult.dvlaData?.driver.firstNames} {verificationResult.dvlaData?.driver.lastName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                      <p className="font-medium">
                        {formatDate(verificationResult.dvlaData?.driver.dateOfBirth)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">License Type</Label>
                      <p className="font-medium">{verificationResult.dvlaData?.licence.type}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">License Status</Label>
                      <Badge
                        variant={
                          verificationResult.dvlaData?.licence.status === 'Valid'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {verificationResult.dvlaData?.licence.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Valid From</Label>
                      <p className="font-medium">
                        {formatDate(verificationResult.dvlaData?.licence.validFrom)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Expires</Label>
                      <p className="font-medium">
                        {formatDate(verificationResult.dvlaData?.licence.validTo)}
                      </p>
                    </div>
                  </div>

                  {/* Entitlements */}
                  {verificationResult.dvlaData?.entitlements && verificationResult.dvlaData.entitlements.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Driving Categories</Label>
                      <div className="flex flex-wrap gap-2">
                        {verificationResult.dvlaData.entitlements.map((ent: any, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {ent.categoryCode}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Endorsements */}
                  {verificationResult.dvlaData?.endorsements && verificationResult.dvlaData.endorsements.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Endorsements</Label>
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            {verificationResult.dvlaData.endorsements.map((end: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <strong>{end.offenceCode}</strong> - {end.offenceLiteral}
                                <br />
                                <span className="text-xs">
                                  {end.penaltyPoints} points | {formatDate(end.offenceDate)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Disqualifications */}
                  {verificationResult.dvlaData?.disqualifications && verificationResult.dvlaData.disqualifications.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Disqualifications</Label>
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            {verificationResult.dvlaData.disqualifications.map((dis: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <strong>Disqualified</strong> - {dis.reason}
                                <br />
                                <span className="text-xs">
                                  From {formatDate(dis.disqualificationDate)} to {formatDate(dis.disqualificationEndDate)} ({dis.disqualificationPeriod} months)
                                </span>
                              </div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* CPC */}
                  {verificationResult.dvlaData?.cpc && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">CPC Number</Label>
                        <p className="font-medium">{verificationResult.dvlaData.cpc.certificateNumber}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">CPC Expiry</Label>
                        <p className="font-medium">{formatDate(verificationResult.dvlaData.cpc.expiryDate)}</p>
                      </div>
                    </div>
                  )}

                  {/* Tachograph */}
                  {verificationResult.dvlaData?.tachograph && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Tachograph Card</Label>
                        <p className="font-medium">{verificationResult.dvlaData.tachograph.cardNumber}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Tachograph Expiry</Label>
                        <p className="font-medium">{formatDate(verificationResult.dvlaData.tachograph.expiryDate)}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Failure Header */}
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold">Verification Failed</h3>
                  </div>
                  <Alert variant="destructive">
                    <AlertDescription>{verificationResult.error}</AlertDescription>
                  </Alert>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isVerifying}>
              Close
            </Button>
            {!verificationResult && (
              <Button onClick={handleVerify} disabled={isVerifying || !licenseNumber}>
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify License
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
