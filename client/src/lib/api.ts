import type { Company, Vehicle, Inspection, FuelEntry } from "@shared/schema";

const BASE_URL = "";

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
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
    startedAt?: string; // ISO timestamp when check started
    completedAt?: string; // ISO timestamp when submitted
    durationSeconds?: number; // Total duration
    vehicleCategory?: string; // HGV | LGV
  }): Promise<Inspection> {
    return this.request(`/api/inspections`, {
      method: "POST",
      body: JSON.stringify(inspection),
    });
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
    });
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
    hasPhoto?: boolean;
  }): Promise<any> {
    return this.request(`/api/defects`, {
      method: "POST",
      body: JSON.stringify(defect),
    });
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
