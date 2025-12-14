# FleetCheck Lite Drive

A premium, multi-tenant fleet management application with separate mobile-optimized workflows for Drivers and Managers.

## Overview

FleetCheck Lite Drive provides:
- **Driver Portal**: Vehicle inspections, defect reporting, fuel entry with mobile-first UX
- **Manager Console**: Dashboard, settings, white-label branding (in development)
- **DVSA Integration**: Real-time MOT status lookup via official API

## Quick Start

### Demo Credentials
- **Company Code**: APEX
- **Driver PIN**: 1234

### Test Vehicles
15 vehicles are seeded with registration numbers like KX65ABC, LR19XYZ, MN22OPA

## Project Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Custom "Titan Fleet" design system
- **Styling**: Mobile-first, Inter + Oswald fonts, premium feel

### Key Files
```
shared/schema.ts       - Database models (Companies, Users, Vehicles, etc.)
server/routes.ts       - API endpoints
server/storage.ts      - Database operations
server/dvsa.ts         - DVSA API integration
client/src/lib/api.ts  - Frontend API client
client/src/lib/session.ts - Session management
client/src/pages/      - React pages
client/src/components/titan-ui/ - Custom UI components
```

### Database Models
- **Companies**: Multi-tenant root with branding settings
- **Users**: Drivers and Managers with PIN authentication
- **Vehicles**: Fleet with VRM, make/model, MOT dates
- **Inspections**: Daily/end-of-shift vehicle checks
- **FuelEntries**: Diesel/AdBlue fuel logs
- **VehicleUsage**: Track recent vehicles per driver

## Environment Variables

### Secrets (encrypted)
- `DVSA_CLIENT_ID` - DVSA OAuth client ID
- `DVSA_CLIENT_SECRET` - DVSA OAuth client secret
- `DVSA_API_KEY` - DVSA API key

### Environment Variables
- `DVSA_TOKEN_URL` - OAuth token endpoint
- `DVSA_SCOPE_URL` - OAuth scope
- `DATABASE_URL` - PostgreSQL connection string

## API Endpoints

### Core
- `GET /api/company/:code` - Get company by code
- `GET /api/vehicles?companyId=` - List vehicles
- `GET /api/vehicles/search?companyId=&query=` - Search vehicles
- `GET /api/vehicles/recent?companyId=&driverId=` - Recent vehicles
- `POST /api/inspections` - Create inspection
- `GET /api/inspections` - Get driver inspections
- `POST /api/fuel` - Create fuel entry
- `GET /api/fuel` - Get driver fuel entries

### DVSA Integration
- `GET /api/dvsa/mot/:registration` - Get MOT status
- `GET /api/dvsa/vehicle/:registration` - Get full DVSA vehicle data

## Manager Dashboard

Access at `/manager/login` with:
- **Company Code**: APEX
- **Manager PIN**: 0000

### Manager Pages
- **Dashboard** (`/manager`) - KPI cards, recent inspections, quick stats
- **Inspections** (`/manager/inspections`) - All vehicle inspections with pagination
- **Defects** (`/manager/defects`) - Kanban-style defect tracking (Open/In Progress/Resolved)
- **Fuel Log** (`/manager/fuel`) - Diesel and AdBlue entries for past 30 days
- **Fleet** (`/manager/fleet`) - Vehicle and trailer management grid
- **Settings** (`/manager/settings`) - Company branding and Google Drive integration

### Manager API Endpoints
- `POST /api/manager/login` - Manager authentication
- `GET /api/manager/stats/:companyId` - Dashboard KPIs
- `GET /api/manager/inspections/:companyId` - All inspections (paginated)
- `GET /api/manager/defects/:companyId` - All defects
- `PATCH /api/manager/defects/:id` - Update defect status
- `GET /api/manager/fuel/:companyId` - Fuel entries by company
- `GET /api/manager/users/:companyId` - All users
- `GET /api/manager/trailers/:companyId` - All trailers
- `POST/PATCH/DELETE /api/manager/vehicles` - Vehicle CRUD

## Recent Changes

### 2025-12-14 (Latest)
- **Load Security N/A Option**: When driver selects "no trailer", Load & Security section allows N/A
  - Tap cycles: unchecked -> pass -> N/A -> unchecked
  - Shows clear visual state for N/A items (gray badge)
  - Helpful hints guide driver through the options
  - N/A is recorded in checklist for audit trail
- **DVSA Auditable Timer**: Added timed inspection workflow for DVSA compliance
  - Records start and end timestamps for every inspection
  - Shows live timer during checks with MM:SS display
  - Minimum time enforcement: 10 minutes for HGV, 5 minutes for LGV
  - Warning confirmation if driver submits before minimum time
  - Stores duration in database for compliance evidence
- Added vehicleCategory field (HGV/LGV) to vehicles for timing requirements
- **License Enforcement System**: Soft-block vehicle capacity with grace period
  - Fleet page shows warning when at/over vehicle allowance
  - Add Vehicle button disabled when over hard limit
  - License page for viewing usage and requesting upgrades

### 2025-12-12
- Built complete Transport Manager Dashboard with desktop-optimized layout
- Added manager API endpoints for auth, stats, inspections, defects, fuel, users, trailers
- Extended database schema with defects and trailers tables
- Added manager user to seed data (PIN: 0000)
- Created manager pages: Dashboard, Inspections, Defects, FuelLog, Fleet, Settings
- Fixed mileage input visibility in light mode
- Added tenant configuration system (client/src/config/tenant.ts) for white-label branding
- DC European Haulage Ltd branding with custom logo

### 2025-12-12
- Connected frontend to PostgreSQL database (replaced mock data)
- Added DVSA API integration with OAuth2 authentication
- Created seed script with demo company and 15 vehicles
- Updated driver dashboard to use real API data
- Stored DVSA credentials securely as Replit secrets

## White-Label Configuration

Edit `client/src/config/tenant.ts` to rebrand for different transport companies:
- `companyName` - Display name shown in header and login
- `logoUrl` - Path to logo image in public folder
- `colors.primary` - Primary hex color for branding
- `colors.primaryHsl` - HSL version for CSS variables
- `features` - Enable/disable fuel, AdBlue, trailers, DVSA integration

## User Preferences
- Mobile-first driver experience (56px tap targets)
- Premium visual quality with motion, depth, glass effects
- Typography: Inter (UI) + Oswald (headings)
- "Industry titan" quality design system
