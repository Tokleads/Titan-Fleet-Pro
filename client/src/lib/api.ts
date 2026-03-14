import type { Company, Vehicle, Inspection, FuelEntry } from "@shared/schema";
import { session } from "./session";
import { addToQueue, isOnline } from "./offlineQueue";

const BASE_URL = "";

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    offlineConfig?: { type: 'inspection' | 'defect' | 'fuel'; displayLabel: string }
  ): Promise<T> {
    const authHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = session.getToken();
    if (token) {
      authHeaders["Authorization"] = `Bearer ${token}`;
    }

    if (!isOnline() && offlineConfig && options.method === 'POST') {
      const id = await addToQueue({
        type: offlineConfig.type,
        endpoint: `${BASE_URL}${endpoint}`,
        method: options.method,
        body: options.body ? JSON.parse(options.body as string) : {},
        displayLabel: offlineConfig.displayLabel,
      });
      window.dispatchEvent(new CustomEvent('offline-queue-update'));
      return { id, queued: true, offlineId: id } as any;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  }

  // Company
  async getCompanyByCode(code: string): Promise<Company> {
    return this.request(`/api/company/${code}`);
  }

  // Vehicles
  async searchVehicles(companyId: number, query: string): Promise<Vehicle[]> {
    return this.request(`/api/vehicles/search?companyId=${companyId}&query=${encodeURIComponent(query)}`);
  }

  async getVehicles(companyId: number): Promise<Vehicle[]> {
    return this.request(`/api/vehicles?companyId=${companyId}`);
  }

  async getRecentVehicles(companyId: number, driverId: number, limit = 5): Promise<Vehicle[]> {
    return this.request(`/api/vehicles/recent?companyId=${companyId}&driverId=${driverId}&limit=${limit}`);
  }

  async getVehicle(id: number): Promise<Vehicle> {
    return this.request(`/api/vehicles/${id}`);
  }

  // Inspections
  async createInspection(inspection: {
    companyId: number;
    vehicleId: number;
    driverId: number;
    type: string;
    odometer: number;
    status: string;
    checklist: any;
    defects?: any;
    hasTrailer?: boolean;
    cabPhotos?: string[];
    startedAt?: string;
    completedAt?: string;
    durationSeconds?: number;
    vehicleCategory?: string;
  }): Promise<Inspection> {
    return this.request(`/api/inspections`, {
      method: "POST",
      body: JSON.stringify(inspection),
    }, { type: 'inspection', displayLabel: `${inspection.type} check — Vehicle #${inspection.vehicleId}` });
  }

  async getInspections(companyId: number, driverId: number, days = 7): Promise<Inspection[]> {
    return this.request(`/api/inspections?companyId=${companyId}&driverId=${driverId}&days=${days}`);
  }

  // Fuel
  async createFuelEntry(entry: {
    companyId: number;
    vehicleId: number;
    driverId: number;
    fuelType: string;
    odometer: number;
    litres?: number;
    price?: number;
    location?: string;
  }): Promise<FuelEntry> {
    return this.request(`/api/fuel`, {
      method: "POST",
      body: JSON.stringify(entry),
    }, { type: 'fuel', displayLabel: `Fuel entry — ${entry.litres || 0}L` });
  }

  async getFuelEntries(companyId: number, driverId: number, days = 7): Promise<FuelEntry[]> {
    return this.request(`/api/fuel?companyId=${companyId}&driverId=${driverId}&days=${days}`);
  }

  // Defects
  async createDefect(defect: {
    companyId: number;
    vehicleId: number;
    reportedBy: number;
    description: string;
    photo?: string | null;
    category?: string;
    severity?: string;
    status?: string;
  }): Promise<any> {
    return this.request(`/api/defects`, {
      method: "POST",
      body: JSON.stringify(defect),
    }, { type: 'defect', displayLabel: `Defect — ${defect.description.substring(0, 40)}` });
  }

  // DVSA API
  async getMotStatus(registration: string): Promise<{
    valid: boolean;
    expiryDate: string | null;
    lastTestDate: string | null;
    lastTestResult: string | null;
    lastOdometer: number | null;
  } | null> {
    try {
      return await this.request(`/api/dvsa/mot/${encodeURIComponent(registration)}`);
    } catch {
      return null;
    }
  }

  async getDVSAVehicle(registration: string): Promise<{
    registration: string;
    make: string;
    model: string;
    primaryColour: string;
    fuelType: string;
  } | null> {
    try {
      return await this.request(`/api/dvsa/vehicle/${encodeURIComponent(registration)}`);
    } catch {
      return null;
    }
  }
}

export const api = new ApiClient();
