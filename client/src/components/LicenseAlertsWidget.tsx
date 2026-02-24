import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  CheckCircle,
  Loader2,
  ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface LicenseAlertsWidgetProps {
  companyId: number;
}

export function LicenseAlertsWidget({ companyId }: LicenseAlertsWidgetProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [companyId]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/manager/license/alerts?companyId=${companyId}`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Error fetching license alerts:", error);
    } finally {
      setLoading(false);
    }
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'warning':
        return 'border-amber-500 bg-amber-50 dark:bg-amber-950/20';
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            License Alerts
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          License Alerts
        </CardTitle>
        <CardDescription>
          {alerts.length === 0 ? (
            "All driver licenses are compliant"
          ) : (
            `${criticalAlerts.length} critical, ${warningAlerts.length} warnings`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-sm text-muted-foreground">
              No active license alerts
            </p>
          </div>
        ) : (
          <>
            {/* Alert Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-red-50 dark:bg-red-950/20">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-amber-600">{warningAlerts.length}</p>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </div>
              </div>
            </div>

            {/* Alert List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 border-l-4 rounded-lg ${getSeverityColor(alert.severity)} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => navigate('/manager/drivers')}
                >
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold truncate">{alert.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {alert.alertType.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(alert.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            {alerts.length > 10 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/manager/drivers')}
              >
                View All {alerts.length} Alerts
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
