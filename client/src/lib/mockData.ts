
export type Role = "MANAGER" | "DRIVER";

export type Company = {
  id: string;
  name: string;
  settings: {
    poolFleet: boolean;
    showFuelPrices: boolean;
    requireFuelCardPhoto: boolean;
    enableEndOfShiftCheck: boolean;
    brand?: {
      primaryColor: string;
      secondaryColor: string;
      logoUrl?: string;
      borderRadius: number;
    };
  };
  googleDriveConnected: boolean;
};

export type User = {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
};

export type Vehicle = {
  id: string;
  companyId: string;
  reg: string;
  make: string;
  model: string;
  motDue: string;
  active: boolean;
  imageUrl?: string;
};

export type Inspection = {
  id: string;
  companyId: string;
  vehicleId: string;
  driverId: string;
  date: string;
  type: "DAILY" | "END_OF_SHIFT";
  status: "PASS" | "FAIL";
  defects: {
    category: string;
    description: string;
    photoUrl?: string;
  }[];
  driveFolderId?: string; // Mock Drive Link
};

export const MOCK_COMPANIES: Company[] = [
  {
    id: "comp-1",
    name: "DC European Haulage Ltd",
    settings: {
      poolFleet: true,
      showFuelPrices: false,
      requireFuelCardPhoto: true,
      enableEndOfShiftCheck: false,
      brand: {
        primaryColor: "#4169b2",
        secondaryColor: "#1e293b",
        logoUrl: "/dc-european-logo.png",
        borderRadius: 8,
      },
    },
    googleDriveConnected: true,
  },
  {
    id: "comp-2",
    name: "Swift Haulage",
    settings: {
      poolFleet: true,
      showFuelPrices: true,
      requireFuelCardPhoto: false,
      enableEndOfShiftCheck: true,
      brand: {
        primaryColor: "#ea580c", // Orange-600
        secondaryColor: "#0f172a", // Slate-900
        borderRadius: 0,
      },
    },
    googleDriveConnected: false,
  },
];

export const MOCK_USERS: User[] = [
  { id: "u-1", companyId: "comp-1", email: "manager@apex.com", name: "Sarah Connor", role: "MANAGER" },
  { id: "u-2", companyId: "comp-1", email: "driver1@apex.com", name: "John Doe", role: "DRIVER" },
  { id: "u-3", companyId: "comp-1", email: "driver2@apex.com", name: "Jane Smith", role: "DRIVER" },
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: "v-1", companyId: "comp-1", reg: "KX65 ABC", make: "DAF", model: "XF 530", motDue: "2025-11-20", active: true },
  { id: "v-2", companyId: "comp-1", reg: "LR19 XYZ", make: "Scania", model: "R450", motDue: "2025-06-15", active: true },
  { id: "v-3", companyId: "comp-1", reg: "MN22 OPA", make: "Mercedes", model: "Actros", motDue: "2025-08-01", active: true },
  { id: "v-4", companyId: "comp-1", reg: "GL70 EFH", make: "Volvo", model: "FH16", motDue: "2025-12-10", active: true },
  { id: "v-5", companyId: "comp-1", reg: "BD18 JKL", make: "MAN", model: "TGX", motDue: "2025-03-30", active: true },
];

export const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: "insp-1",
    companyId: "comp-1",
    vehicleId: "v-1",
    driverId: "u-2",
    date: "2024-05-10T07:30:00Z",
    type: "DAILY",
    status: "PASS",
    defects: [],
    driveFolderId: "folder-123",
  },
  {
    id: "insp-2",
    companyId: "comp-1",
    vehicleId: "v-2",
    driverId: "u-3",
    date: "2024-05-10T07:45:00Z",
    type: "DAILY",
    status: "FAIL",
    defects: [
      { category: "Tyres", description: "Cut in sidewall nearside front", photoUrl: "mock-url" }
    ],
    driveFolderId: "folder-124",
  },
];

// Helper to simulate API calls
export const api = {
  getCompany: (id: string) => MOCK_COMPANIES.find(c => c.id === id),
  getVehicles: (companyId: string) => MOCK_VEHICLES.filter(v => v.companyId === companyId),
  getInspections: (companyId: string) => MOCK_INSPECTIONS.filter(i => i.companyId === companyId),
  searchVehicles: (companyId: string, query: string) => {
    const q = query.toLowerCase();
    return MOCK_VEHICLES.filter(v => 
      v.companyId === companyId && 
      (v.reg.toLowerCase().includes(q) || v.make.toLowerCase().includes(q))
    );
  }
};
