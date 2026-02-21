import { db } from "./db";
import { companies, users, vehicles } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create demo company with Core tier (15 vehicle allowance + 3 grace)
  const [company] = await db.insert(companies).values({
    companyCode: "APEX",
    name: "DC European Haulage Ltd",
    logoUrl: "/dc-european-logo.png",
    primaryColor: "#4169b2",
    licenseTier: "core",
    vehicleAllowance: 15,
    graceOverage: 3,
    enforcementMode: "soft_block",
    settings: {
      poolFleet: true,
      showFuelPrices: false,
      requireFuelCardPhoto: true,
      enableEndOfShiftCheck: false,
      fuelEnabled: true,
      adblueEnabled: true,
      collisionsEnabled: true,
      driverHistoryDays: 7
    },
    googleDriveConnected: true
  }).returning();

  console.log(`✅ Created company: ${company.name}`);

  // Create manager
  const [manager] = await db.insert(users).values({
    companyId: company.id,
    email: "manager@apex.com",
    name: "Sarah Connor",
    role: "MANAGER",
    pin: "7429"
  }).returning();

  // Create drivers
  const [driver1] = await db.insert(users).values({
    companyId: company.id,
    email: "driver1@apex.com",
    name: "John Doe",
    role: "DRIVER",
    pin: "1234"
  }).returning();

  const [driver2] = await db.insert(users).values({
    companyId: company.id,
    email: "driver2@apex.com",
    name: "Jane Smith",
    role: "DRIVER",
    pin: "5678"
  }).returning();

  console.log(`✅ Created users: ${manager.name}, ${driver1.name}, ${driver2.name}`);

  // Create 16 vehicles (1 over allowance of 15, demonstrating grace mode)
  // Mix of HGV (10 min check) and LGV (5 min check) for DVSA timing compliance
  const vehicleData = [
    { vrm: "KX65ABC", make: "DAF", model: "XF 530", fleetNumber: "F001", vehicleCategory: "HGV", motDue: new Date("2025-11-20") },
    { vrm: "LR19XYZ", make: "Scania", model: "R450", fleetNumber: "F002", vehicleCategory: "HGV", motDue: new Date("2025-06-15") },
    { vrm: "MN22OPA", make: "Mercedes", model: "Actros", fleetNumber: "F003", vehicleCategory: "HGV", motDue: new Date("2025-08-01") },
    { vrm: "GL70EFH", make: "Volvo", model: "FH16", fleetNumber: "F004", vehicleCategory: "HGV", motDue: new Date("2025-12-10") },
    { vrm: "BD18JKL", make: "MAN", model: "TGX", fleetNumber: "F005", vehicleCategory: "HGV", motDue: new Date("2025-03-30") },
    { vrm: "PO21GHT", make: "Iveco", model: "S-WAY", fleetNumber: "F006", vehicleCategory: "HGV", motDue: new Date("2025-09-15") },
    { vrm: "RT68FGH", make: "DAF", model: "CF", fleetNumber: "F007", vehicleCategory: "HGV", motDue: new Date("2025-07-22") },
    { vrm: "YU19KLM", make: "Scania", model: "G410", fleetNumber: "F008", vehicleCategory: "HGV", motDue: new Date("2025-10-05") },
    { vrm: "DF22NPQ", make: "Mercedes", model: "Arocs", fleetNumber: "F009", vehicleCategory: "HGV", motDue: new Date("2025-04-18") },
    { vrm: "WE20RST", make: "Volvo", model: "FM", fleetNumber: "F010", vehicleCategory: "HGV", motDue: new Date("2025-05-28") },
    { vrm: "SA18UVW", make: "MAN", model: "TGL", fleetNumber: "F011", vehicleCategory: "LGV", motDue: new Date("2025-08-14") },
    { vrm: "QW21XYZ", make: "Renault", model: "T High", fleetNumber: "F012", vehicleCategory: "HGV", motDue: new Date("2025-11-03") },
    { vrm: "ZX19ABC", make: "DAF", model: "LF", fleetNumber: "F013", vehicleCategory: "LGV", motDue: new Date("2025-06-30") },
    { vrm: "CV22DEF", make: "Scania", model: "P320", fleetNumber: "F014", vehicleCategory: "LGV", motDue: new Date("2025-09-20") },
    { vrm: "BN20GHI", make: "Iveco", model: "Eurocargo", fleetNumber: "F015", vehicleCategory: "LGV", motDue: new Date("2025-12-25") },
    { vrm: "HJ23KLM", make: "DAF", model: "XG+", fleetNumber: "F016", vehicleCategory: "HGV", motDue: new Date("2026-01-15") }
  ];

  for (const v of vehicleData) {
    await db.insert(vehicles).values({
      companyId: company.id,
      ...v
    });
  }

  console.log(`✅ Created ${vehicleData.length} vehicles (1 in grace - over 15 allowance)`);
  console.log("\n🎉 Seed completed!");
  console.log(`\n📋 Seed accounts created for company APEX`);
  console.log(`\n📊 License info:`);
  console.log(`   Tier: Core (15 vehicles + 3 grace)`);
  console.log(`   Active vehicles: 16 (in grace mode)`);
  
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
