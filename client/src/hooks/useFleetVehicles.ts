import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Vehicle {
  id: number;
  companyId: number;
  vrm: string;
  make: string;
  model: string;
  fleetNumber: string | null;
  vehicleCategory: string;
  motDue: string | null;
  taxDue: string | null;
  serviceDue: string | null;
  mileage: number | null;
  lastServiceMileage: number | null;
  serviceIntervalMiles: number | null;
  active: boolean;
  vor: boolean;
  vorReason: string | null;
  vorNotes: string | null;
  vorStartDate: string | null;
  createdAt: string;
}

export interface VehiclesResponse {
  vehicles: Vehicle[];
  total: number;
}

export interface UseFleetVehiclesOptions {
  companyId: number | undefined;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useFleetVehicles({ companyId, limit = 20, offset = 0, enabled = true }: UseFleetVehiclesOptions) {
  return useQuery<VehiclesResponse>({
    queryKey: ["fleet-vehicles", companyId, limit, offset],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID is required");
      const res = await fetch(`/api/vehicles?companyId=${companyId}&limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
    enabled: enabled && !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export interface CreateVehicleData {
  companyId: number;
  vrm: string;
  make: string;
  model: string;
  fleetNumber?: string | null;
  vehicleCategory: string;
  motDue?: string | null;
  active: boolean;
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateVehicleData) => {
      const res = await fetch('/api/manager/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create vehicle');
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate all vehicle queries for this company
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles', variables.companyId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', variables.companyId] });
      queryClient.invalidateQueries({ queryKey: ['license', variables.companyId] });
    },
  });
}

export interface ToggleVehicleActiveData {
  id: number;
  active: boolean;
  companyId: number;
}

export function useToggleVehicleActive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, active }: ToggleVehicleActiveData) => {
      const res = await fetch(`/api/manager/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error('Failed to update vehicle');
      if (res.status === 204) return null;
      return res.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate all vehicle queries for this company
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles', variables.companyId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', variables.companyId] });
    },
  });
}
