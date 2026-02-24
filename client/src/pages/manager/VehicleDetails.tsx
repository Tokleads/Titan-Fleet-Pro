import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Truck, Calendar, Gauge, Wrench, AlertTriangle, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Vehicle {
  id: number;
  companyId: number;
  vrm: string;
  make: string;
  model: string;
  fleetNumber: string | null;
  vehicleCategory: string;
  motDue: string | null;
  taxDue: string | null;
  active: boolean;
  vorStatus: boolean;
  vorReason: string | null;
  vorStartDate: string | null;
  vorNotes: string | null;
  vorResolvedDate: string | null;
  currentMileage: number;
  lastServiceDate: string | null;
  lastServiceMileage: number | null;
  serviceIntervalMiles: number | null;
  serviceIntervalMonths: number | null;
  nextServiceDue: string | null;
  nextServiceMileage: number | null;
  createdAt: string;
}

interface ServiceRecord {
  id: number;
  vehicleId: number;
  serviceDate: string;
  serviceMileage: number;
  serviceType: string;
  serviceProvider: string | null;
  cost: number | null;
  workPerformed: string | null;
  createdAt: string;
}

export default function VehicleDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const { data: vehicle, isLoading: vehicleLoading } = useQuery<Vehicle>({
    queryKey: ["/api/vehicles", id],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/${id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch vehicle");
      return res.json();
    },
  });

  const { data: serviceHistory = [] } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/manager/vehicles", id, "service-history"],
    queryFn: async () => {
      const res = await fetch(`/api/manager/vehicles/${id}/service-history`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  if (vehicleLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900">Vehicle not found</h2>
          <Button onClick={() => navigate("/manager/fleet")} className="mt-4">
            Back to Fleet
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    return format(new Date(dateStr), "dd MMM yyyy");
  };

  const isExpiringSoon = (dateStr: string | null, days: number = 30) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return diff > 0 && diff < days * 24 * 60 * 60 * 1000;
  };

  const isExpired = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/manager/fleet")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{vehicle.vrm}</h1>
            <p className="text-sm text-slate-500">{vehicle.make} {vehicle.model}</p>
          </div>
          {vehicle.vorStatus && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              VOR
            </Badge>
          )}
          {!vehicle.active && (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Fleet Number</p>
                  <p className="font-semibold text-slate-900">{vehicle.fleetNumber || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Gauge className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Current Mileage</p>
                  <p className="font-semibold text-slate-900">
                    {vehicle.currentMileage?.toLocaleString() || 0} mi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isExpired(vehicle.motDue) ? "bg-red-100" :
                  isExpiringSoon(vehicle.motDue) ? "bg-amber-100" : "bg-slate-100"
                }`}>
                  <Calendar className={`h-5 w-5 ${
                    isExpired(vehicle.motDue) ? "text-red-600" :
                    isExpiringSoon(vehicle.motDue) ? "text-amber-600" : "text-slate-600"
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">MOT Due</p>
                  <p className={`font-semibold ${
                    isExpired(vehicle.motDue) ? "text-red-600" :
                    isExpiringSoon(vehicle.motDue) ? "text-amber-600" : "text-slate-900"
                  }`}>
                    {formatDate(vehicle.motDue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isExpired(vehicle.taxDue) ? "bg-red-100" :
                  isExpiringSoon(vehicle.taxDue) ? "bg-amber-100" : "bg-slate-100"
                }`}>
                  <FileText className={`h-5 w-5 ${
                    isExpired(vehicle.taxDue) ? "text-red-600" :
                    isExpiringSoon(vehicle.taxDue) ? "text-amber-600" : "text-slate-600"
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Tax Due</p>
                  <p className={`font-semibold ${
                    isExpired(vehicle.taxDue) ? "text-red-600" :
                    isExpiringSoon(vehicle.taxDue) ? "text-amber-600" : "text-slate-900"
                  }`}>
                    {formatDate(vehicle.taxDue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Registration</p>
                  <p className="font-medium text-slate-900">{vehicle.vrm}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <p className="font-medium text-slate-900">{vehicle.vehicleCategory || "HGV"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Make</p>
                  <p className="font-medium text-slate-900">{vehicle.make}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Model</p>
                  <p className="font-medium text-slate-900">{vehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge variant={vehicle.active ? "default" : "secondary"}>
                    {vehicle.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Added</p>
                  <p className="font-medium text-slate-900">{formatDate(vehicle.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Service Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Last Service</p>
                  <p className="font-medium text-slate-900">{formatDate(vehicle.lastServiceDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Last Service Mileage</p>
                  <p className="font-medium text-slate-900">
                    {vehicle.lastServiceMileage?.toLocaleString() || "—"} mi
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Service Interval</p>
                  <p className="font-medium text-slate-900">
                    {vehicle.serviceIntervalMiles?.toLocaleString() || 10000} mi / {vehicle.serviceIntervalMonths || 12} months
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Next Service Due</p>
                  <p className={`font-medium ${
                    isExpired(vehicle.nextServiceDue) ? "text-red-600" :
                    isExpiringSoon(vehicle.nextServiceDue) ? "text-amber-600" : "text-slate-900"
                  }`}>
                    {formatDate(vehicle.nextServiceDue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {vehicle.vorStatus && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Vehicle Off Road (VOR)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-red-700">Reason</p>
                  <p className="font-medium text-red-900">{vehicle.vorReason || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-red-700">Since</p>
                  <p className="font-medium text-red-900">{formatDate(vehicle.vorStartDate)}</p>
                </div>
              </div>
              {vehicle.vorNotes && (
                <div>
                  <p className="text-sm text-red-700">Notes</p>
                  <p className="font-medium text-red-900">{vehicle.vorNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Service History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serviceHistory.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No service records yet</p>
            ) : (
              <div className="space-y-3">
                {serviceHistory.map((record) => (
                  <div key={record.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{record.serviceType}</p>
                      <p className="text-sm text-slate-500">
                        {formatDate(record.serviceDate)} • {record.serviceMileage?.toLocaleString()} mi
                      </p>
                      {record.serviceProvider && (
                        <p className="text-sm text-slate-500">{record.serviceProvider}</p>
                      )}
                    </div>
                    {record.cost && (
                      <p className="font-medium text-slate-900">£{record.cost.toFixed(2)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
