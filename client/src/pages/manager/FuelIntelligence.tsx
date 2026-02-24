import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Fuel, 
  DollarSign, 
  AlertTriangle,
  Trophy,
  Target,
  Calendar,
  Download
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { session } from "@/lib/session";
import { ManagerLayout } from "./ManagerLayout";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import { VehicleDetailModal } from "@/components/VehicleDetailModal";

// Date range selector component
function DateRangeSelector({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}) {
  const presets = [
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "Last 90 Days", days: 90 },
  ];

  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onStartDateChange(start.toISOString().split('T')[0]);
    onEndDateChange(end.toISOString().split('T')[0]);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="px-3 py-2 border rounded-md"
        />
        <span className="text-muted-foreground">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="px-3 py-2 border rounded-md"
        />
      </div>
      <div className="flex gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.days}
            variant="outline"
            size="sm"
            onClick={() => setPreset(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function FuelIntelligence() {
  const company = session.getCompany();
  const companyId = company?.id;
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  const { data: allVehiclesData } = useQuery({
    queryKey: ["all-vehicles-lookup", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles?companyId=${companyId}`, { headers: authHeaders() });
      if (!res.ok) return { vehicles: [] };
      return res.json();
    },
    enabled: !!companyId,
  });
  const vrmToIdMap = new Map(((allVehiclesData as any)?.vehicles || (Array.isArray(allVehiclesData) ? allVehiclesData : [])).map((v: any) => [v.vrm, v.id]));

  // Default to last 30 days
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Fetch data
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["fuel-intelligence-summary", companyId, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/fuel-intelligence/summary?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`, {
        credentials: "include",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: driverPerformance, isLoading: driverLoading } = useQuery({
    queryKey: ["fuel-intelligence-drivers", companyId, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/fuel-intelligence/driver-performance?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`, {
        credentials: "include",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch driver performance");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: vehiclePerformance, isLoading: vehicleLoading } = useQuery({
    queryKey: ["fuel-intelligence-vehicles", companyId, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/fuel-intelligence/vehicle-performance?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`, {
        credentials: "include",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch vehicle performance");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: anomalies, isLoading: anomaliesLoading } = useQuery({
    queryKey: ["fuel-intelligence-anomalies", companyId, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/fuel-intelligence/anomalies?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`, {
        credentials: "include",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch anomalies");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery({
    queryKey: ["fuel-intelligence-opportunities", companyId, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/fuel-intelligence/opportunities?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`, {
        credentials: "include",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch opportunities");
      return res.json();
    },
    enabled: !!companyId,
  });

  const isLoading = summaryLoading || driverLoading || vehicleLoading || anomaliesLoading || opportunitiesLoading;

  // Calculate total potential savings
  const totalSavings = opportunities?.reduce((sum: number, opp: any) => sum + opp.potentialSavingsPerYear, 0) || 0;

  return (
    <ManagerLayout>
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fuel Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered fuel analytics and cost optimization
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fuel Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : `£${summary?.totalCost?.toFixed(0) || 0}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.totalLitres?.toFixed(0) || 0} litres consumed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average MPG</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : summary?.averageMpg?.toFixed(1) || 0}
            </div>
            <div className="flex items-center text-xs mt-1">
              {summary?.trends?.mpgChange > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+{summary.trends.mpgChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">{summary?.trends?.mpgChange?.toFixed(1) || 0}%</span>
                </>
              )}
              <span className="text-muted-foreground ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Per Mile</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : `${summary?.averageCostPerMile?.toFixed(1) || 0}p`}
            </div>
            <div className="flex items-center text-xs mt-1">
              {summary?.trends?.costPerMileChange < 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">{summary.trends.costPerMileChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">+{summary?.trends?.costPerMileChange?.toFixed(1) || 0}%</span>
                </>
              )}
              <span className="text-muted-foreground ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? "..." : `£${totalSavings.toFixed(0)}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              per year identified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="opportunities">Savings Opportunities</TabsTrigger>
          <TabsTrigger value="drivers">Driver Performance</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicle Performance</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        {/* Savings Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost-Saving Opportunities</CardTitle>
              <CardDescription>
                AI-identified opportunities to reduce fuel costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading opportunities...</p>
              ) : opportunities?.length === 0 ? (
                <p className="text-muted-foreground">No opportunities identified. Your fleet is running efficiently!</p>
              ) : (
                <div className="space-y-4">
                  {opportunities?.map((opp: any) => (
                    <div key={opp.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{opp.title}</h3>
                            <Badge variant={opp.priority === 'HIGH' ? 'destructive' : opp.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                              {opp.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{opp.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            £{opp.potentialSavingsPerYear.toFixed(0)}
                          </div>
                          <p className="text-xs text-muted-foreground">per year</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Action Items:</p>
                        <ul className="text-sm space-y-1">
                          {opp.actionItems.map((item: string, idx: number) => {
                            const colonIdx = item.indexOf(':');
                            const possibleVrm = colonIdx > 0 ? item.slice(0, colonIdx).trim() : null;
                            const vrmId = possibleVrm ? vrmToIdMap.get(possibleVrm) : undefined;
                            return (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-muted-foreground">•</span>
                                <span>
                                  {vrmId ? (
                                    <>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedVehicleId(vrmId); }}
                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
                                      >
                                        {possibleVrm}
                                      </button>
                                      {item.slice(colonIdx)}
                                    </>
                                  ) : item}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Driver Performance Tab */}
        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Driver Performance Rankings</CardTitle>
              <CardDescription>
                Fuel efficiency by driver
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading driver performance...</p>
              ) : (
                <div className="space-y-2">
                  {driverPerformance?.map((driver: any, idx: number) => (
                    <div key={driver.driverId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                          {idx < 3 ? (
                            <Trophy className={`h-4 w-4 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-amber-600'}`} />
                          ) : (
                            <span className="text-sm font-medium">{idx + 1}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{driver.driverName}</p>
                          <p className="text-sm text-muted-foreground">
                            {driver.totalMiles.toFixed(0)} miles • {driver.vehiclesUsed} vehicle{driver.vehiclesUsed > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{driver.mpg.toFixed(1)} MPG</p>
                        <p className="text-sm text-muted-foreground">{driver.costPerMile.toFixed(1)}p/mile</p>
                        {driver.savingsVsAverage !== 0 && (
                          <p className={`text-sm ${driver.savingsVsAverage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {driver.savingsVsAverage > 0 ? '+' : ''}£{driver.savingsVsAverage.toFixed(0)} vs avg
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicle Performance Tab */}
        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Performance Rankings</CardTitle>
              <CardDescription>
                Fuel efficiency by vehicle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading vehicle performance...</p>
              ) : (
                <div className="space-y-2">
                  {vehiclePerformance?.map((vehicle: any, idx: number) => (
                    <div key={vehicle.vehicleId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                          <span className="text-sm font-medium">{idx + 1}</span>
                        </div>
                        <div>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (vehicle.vehicleId) setSelectedVehicleId(vehicle.vehicleId); }}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer bg-transparent border-none p-0 text-left"
                          >
                            {vehicle.vehicleVrm}
                          </button>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.make} {vehicle.model} • {vehicle.totalMiles.toFixed(0)} miles
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{vehicle.mpg.toFixed(1)} MPG</p>
                        <p className="text-sm text-muted-foreground">{vehicle.costPerMile.toFixed(1)}p/mile</p>
                        {vehicle.costVsAverage !== 0 && (
                          <p className={`text-sm ${vehicle.costVsAverage < 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {vehicle.costVsAverage > 0 ? '+' : ''}£{vehicle.costVsAverage.toFixed(0)} vs avg
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Anomalies</CardTitle>
              <CardDescription>
                Unusual fuel purchases and potential fraud
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading anomalies...</p>
              ) : anomalies?.length === 0 ? (
                <p className="text-muted-foreground">No anomalies detected. All fuel purchases look normal.</p>
              ) : (
                <div className="space-y-2">
                  {anomalies?.map((anomaly: any) => (
                    <div key={anomaly.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        anomaly.severity === 'HIGH' ? 'text-red-500' : 
                        anomaly.severity === 'MEDIUM' ? 'text-yellow-500' : 
                        'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            <button
                              onClick={(e) => { e.stopPropagation(); const id = vrmToIdMap.get(anomaly.vehicleVrm); if (id) setSelectedVehicleId(id); }}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
                            >
                              {anomaly.vehicleVrm}
                            </button>
                            {' - '}{anomaly.driverName}
                          </p>
                          <Badge variant={anomaly.potentialFraud ? 'destructive' : 'secondary'}>
                            {anomaly.type.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{anomaly.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(anomaly.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    {selectedVehicleId && (
      <VehicleDetailModal vehicleId={selectedVehicleId} onClose={() => setSelectedVehicleId(null)} />
    )}
    </ManagerLayout>
  );
}
