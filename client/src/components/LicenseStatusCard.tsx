import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  History,
  Loader2,
  FileText
} from "lucide-react";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface LicenseStatusCardProps {
  driverId: number;
  driverName: string;
  onVerifyClick: () => void;
}

interface VerificationHistoryItem {
  id: number;
  verifiedAt: string;
  status: string;
  licenseStatus: string;
  penaltyPoints: number;
  verifiedBy?: string;
}

export function LicenseStatusCard({ driverId, driverName, onVerifyClick }: LicenseStatusCardProps) {
  const [license, setLicense] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistoryItem[]>([]);

  const fetchLicenseData = async () => {
    try {
      // Fetch license data
      const licenseResponse = await fetch(`/api/manager/drivers/${driverId}/license`, { headers: authHeaders() });
      if (licenseResponse.ok) {
        const licenseData = await licenseResponse.json();
        setLicense(licenseData);
      } else {
        setLicense(null);
      }

      // Fetch alerts
      const alertsResponse = await fetch(`/api/manager/drivers/${driverId}/license/alerts`, { headers: authHeaders() });
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData);
      }
    } catch (error) {
      console.error("Error fetching license data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLicenseData();
  }, [driverId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLicenseData();
  };

  const fetchVerificationHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/manager/drivers/${driverId}/license/history`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        setVerificationHistory(data);
      } else {
        setVerificationHistory([]);
      }
    } catch (error) {
      console.error("Error fetching verification history:", error);
      setVerificationHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryDialog = () => {
    setHistoryDialogOpen(true);
    fetchVerificationHistory();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'Valid': 'bg-green-500',
      'Expired': 'bg-red-500',
      'Suspended': 'bg-orange-500',
      'Revoked': 'bg-red-600'
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-500'}>
        {status}
      </Badge>
    );
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            License Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!license) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            License Status
          </CardTitle>
          <CardDescription>DVLA license verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No license data available. Click below to verify this driver's license with DVLA.
            </AlertDescription>
          </Alert>
          <Button onClick={onVerifyClick} className="w-full">
            <Shield className="mr-2 h-4 w-4" />
            Verify License
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            License Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>Last verified {formatDate(license.lastVerifiedAt)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* License Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          {getStatusBadge(license.licenseStatus)}
        </div>

        {/* License Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">License Number</p>
            <p className="font-mono font-medium">{license.licenseNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium">{license.licenseType}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Expiry Date</p>
            <p className="font-medium">{formatDate(license.expiryDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Penalty Points</p>
            <p className={`font-medium ${license.totalPenaltyPoints >= 9 ? 'text-red-500' : ''}`}>
              {license.totalPenaltyPoints || 0}
            </p>
          </div>
        </div>

        {/* Driving Categories */}
        {license.entitlements && license.entitlements.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Driving Categories</p>
            <div className="flex flex-wrap gap-2">
              {license.entitlements.map((ent: any, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {ent.categoryCode}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Active Alerts</p>
            {alerts.slice(0, 3).map((alert) => (
              <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                {getSeverityIcon(alert.severity)}
                <AlertDescription className="text-xs">
                  <strong>{alert.title}</strong>
                  <br />
                  {alert.message}
                </AlertDescription>
              </Alert>
            ))}
            {alerts.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{alerts.length - 3} more alert{alerts.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Disqualification Warning */}
        {license.isDisqualified && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Driver is currently disqualified</strong>
              <br />
              This driver is not legally allowed to drive.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={onVerifyClick} variant="outline" className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Re-verify
          </Button>
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={openHistoryDialog}
            data-testid="button-license-history"
          >
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
        </div>

        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                License Verification History
              </DialogTitle>
              <DialogDescription>
                Past verification records for {driverName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="max-h-[400px] overflow-y-auto">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : verificationHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No verification history available yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    History will appear after license verifications are performed.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {verificationHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="border rounded-lg p-3 space-y-2"
                      data-testid={`history-item-${item.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {formatDate(item.verifiedAt)}
                        </span>
                        <Badge className={
                          item.licenseStatus === 'Valid' ? 'bg-green-500' :
                          item.licenseStatus === 'Expired' ? 'bg-red-500' :
                          item.licenseStatus === 'Suspended' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }>
                          {item.licenseStatus}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Status: </span>
                          <span className={item.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                            {item.status === 'success' ? 'Verified' : 'Failed'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Points: </span>
                          <span className={item.penaltyPoints >= 9 ? 'text-red-500 font-medium' : ''}>
                            {item.penaltyPoints}
                          </span>
                        </div>
                      </div>
                      {item.verifiedBy && (
                        <div className="text-xs text-muted-foreground">
                          Verified by: {item.verifiedBy}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
