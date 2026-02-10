import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, TrendingUp, TrendingDown, Clock, AlertTriangle, RefreshCw, Download } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  slowRequestPercentage: number;
  endpointStats: Record<string, {
    count: number;
    avgDuration: number;
    maxDuration: number;
    slowCount: number;
  }>;
  recentRequests: Array<{
    endpoint: string;
    method: string;
    duration: number;
    statusCode: number;
    timestamp: string;
  }>;
}

interface SlowQuery {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: string;
}

export default function Performance() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, slowQueriesRes] = await Promise.all([
        fetch("/api/performance/stats"),
        fetch("/api/performance/slow-queries?limit=20"),
      ]);

      const statsData = await statsRes.json();
      const slowQueriesData = await slowQueriesRes.json();

      setStats(statsData);
      setSlowQueries(slowQueriesData);
    } catch (error) {
      console.error("Failed to fetch performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      stats,
      slowQueries,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No performance data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data for endpoint performance
  const endpointChartData = Object.entries(stats.endpointStats || {})
    .map(([endpoint, data]) => ({
      endpoint: endpoint.length > 30 ? endpoint.substring(0, 30) + "..." : endpoint,
      avgDuration: Math.round(data.avgDuration),
      maxDuration: Math.round(data.maxDuration),
      count: data.count,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);

  // Prepare chart data for recent requests
  const recentRequestsChartData = (stats.recentRequests || [])
    .slice()
    .reverse()
    .map((req, idx) => ({
      index: idx + 1,
      duration: req.duration,
      endpoint: req.endpoint,
    }));

  const getPerformanceGrade = () => {
    const { averageResponseTime, slowRequestPercentage } = stats;
    
    if (averageResponseTime < 500 && slowRequestPercentage < 0.1) return { grade: "A+", color: "text-green-600" };
    if (averageResponseTime < 750 && slowRequestPercentage < 0.5) return { grade: "A", color: "text-green-500" };
    if (averageResponseTime < 1000 && slowRequestPercentage < 1) return { grade: "B", color: "text-yellow-500" };
    if (averageResponseTime < 1500 && slowRequestPercentage < 2) return { grade: "C", color: "text-orange-500" };
    return { grade: "F", color: "text-red-500" };
  };

  const performanceGrade = getPerformanceGrade();

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
          <p className="text-muted-foreground">Real-time application performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 1000 requests tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              {stats.averageResponseTime < 500 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Excellent
                </span>
              ) : stats.averageResponseTime < 1000 ? (
                <span className="text-yellow-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Good
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Needs optimization
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.slowRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.slowRequestPercentage.toFixed(2)}% of total requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${performanceGrade.color}`}>
              {performanceGrade.grade}
            </div>
            <p className="text-xs text-muted-foreground">Based on response times</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Endpoint Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Slowest Endpoints</CardTitle>
            <CardDescription>Average and maximum response times</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={endpointChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis label={{ value: "Duration (ms)", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgDuration" fill="#3b82f6" name="Avg Duration" />
                <Bar dataKey="maxDuration" fill="#ef4444" name="Max Duration" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Requests Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>Last 10 request response times</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={recentRequestsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" label={{ value: "Request #", position: "insideBottom", offset: -5 }} />
                <YAxis label={{ value: "Duration (ms)", angle: -90, position: "insideLeft" }} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-lg">
                        <p className="font-semibold">{data.endpoint}</p>
                        <p className="text-sm">Duration: {data.duration}ms</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Area type="monotone" dataKey="duration" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Statistics</CardTitle>
          <CardDescription>Detailed performance metrics for all endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Avg Duration</TableHead>
                <TableHead className="text-right">Max Duration</TableHead>
                <TableHead className="text-right">Slow Count</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(stats.endpointStats)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([endpoint, data]) => (
                  <TableRow key={endpoint}>
                    <TableCell className="font-mono text-sm">{endpoint}</TableCell>
                    <TableCell className="text-right">{data.count}</TableCell>
                    <TableCell className="text-right">{Math.round(data.avgDuration)}ms</TableCell>
                    <TableCell className="text-right">{Math.round(data.maxDuration)}ms</TableCell>
                    <TableCell className="text-right">{data.slowCount}</TableCell>
                    <TableCell className="text-right">
                      {data.avgDuration < 500 ? (
                        <Badge variant="default" className="bg-green-600">Fast</Badge>
                      ) : data.avgDuration < 1000 ? (
                        <Badge variant="default" className="bg-yellow-600">OK</Badge>
                      ) : (
                        <Badge variant="destructive">Slow</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Slow Queries Table */}
      {slowQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Slow Queries (&gt;1000ms)</CardTitle>
            <CardDescription>Requests that took longer than 1 second</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slowQueries.map((query, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge variant="outline">{query.method}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{query.endpoint}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {query.duration}ms
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={query.statusCode >= 400 ? "destructive" : "default"}>
                        {query.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(query.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
