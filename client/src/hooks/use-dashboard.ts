import { useQuery } from '@tanstack/react-query';

interface KPIs {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  pendingInspections: number;
  vehiclesTrend: number;
  driversTrend: number;
}

interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

export function useDashboardKPIs(companyId: number) {
  return useQuery<KPIs>({
    queryKey: ['dashboard-kpis', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/kpis?companyId=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      return response.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (more frequent for dashboard)
  });
}

export function useDashboardFleetOverview(companyId: number) {
  return useQuery<{ data: ChartData[] }>({
    queryKey: ['dashboard-fleet-overview', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/fleet-overview?companyId=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch fleet overview');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDashboardCostAnalysis(companyId: number) {
  return useQuery<{ data: ChartData[] }>({
    queryKey: ['dashboard-cost-analysis', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/cost-analysis?companyId=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch cost analysis');
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes (less frequent)
  });
}

export function useDashboardCompliance(companyId: number) {
  return useQuery<{ data: ChartData[] }>({
    queryKey: ['dashboard-compliance', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/compliance?companyId=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch compliance');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDashboardDriverActivity(companyId: number) {
  return useQuery<{ data: ChartData[] }>({
    queryKey: ['dashboard-driver-activity', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/driver-activity?companyId=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch driver activity');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDashboardDefectTrends(companyId: number) {
  return useQuery<{ data: ChartData[] }>({
    queryKey: ['dashboard-defect-trends', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/defect-trends?companyId=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch defect trends');
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useDashboardRecentActivity(companyId: number) {
  return useQuery<{ activities: any[] }>({
    queryKey: ['dashboard-recent-activity', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/recent-activity?companyId=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch recent activity');
      return response.json();
    },
    staleTime: 1000 * 60 * 1, // 1 minute (most frequent)
  });
}

// Convenience hook to fetch all dashboard data at once
export function useDashboardData(companyId: number) {
  const kpis = useDashboardKPIs(companyId);
  const fleetOverview = useDashboardFleetOverview(companyId);
  const costAnalysis = useDashboardCostAnalysis(companyId);
  const compliance = useDashboardCompliance(companyId);
  const driverActivity = useDashboardDriverActivity(companyId);
  const defectTrends = useDashboardDefectTrends(companyId);
  const recentActivity = useDashboardRecentActivity(companyId);

  return {
    kpis,
    fleetOverview,
    costAnalysis,
    compliance,
    driverActivity,
    defectTrends,
    recentActivity,
    isLoading: kpis.isLoading || fleetOverview.isLoading || costAnalysis.isLoading,
    isError: kpis.isError || fleetOverview.isError || costAnalysis.isError,
  };
}
