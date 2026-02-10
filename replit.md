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
- **Inspections**: Daily/end-of-shift vehicle checks with cab photos
- **FuelEntries**: Diesel/AdBlue fuel logs
- **VehicleUsage**: Track recent vehicles per driver
- **Deliveries**: Proof of Delivery records with signature, photos, GPS

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

### Messaging API Endpoints
- `POST /api/messages` - Driver sends message to transport manager (validated sender/company)
- `GET /api/manager/messages/:companyId` - Get messages for company (paginated, sender sanitized)
- `GET /api/manager/messages/:companyId/unread-count` - Unread message count
- `PATCH /api/manager/messages/:id/read` - Mark message as read (company-scoped)

### Delivery/POD API Endpoints
- `POST /api/deliveries` - Create delivery with signature, photos, GPS
- `GET /api/deliveries/driver` - Get driver's deliveries (paginated)
- `GET /api/deliveries/:id` - Get single delivery
- `GET /api/deliveries/:id/pdf` - Download POD PDF
- `GET /api/manager/deliveries/:companyId` - All company deliveries (paginated, filterable)
- `PATCH /api/manager/deliveries/:id/status` - Update delivery status
- `POST /api/manager/deliveries/bulk-status` - Bulk status update
- `GET /api/manager/deliveries/:companyId/csv` - Export deliveries as CSV
- `GET /api/manager/deliveries/:companyId/stats` - Delivery statistics

### Auth & Onboarding API Endpoints
- `GET /api/auth/verify-setup-token?token=` - Verify account setup token
- `POST /api/auth/setup-account` - Complete account setup (company name, password, etc.)
- `POST /api/auth/login` - Email + password login with 2FA support
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-reset-token?token=` - Verify password reset token

### Stripe API Endpoints
- `GET /api/stripe/publishable-key` - Get Stripe publishable key
- `GET /api/stripe/products` - List active products with prices
- `POST /api/stripe/checkout` - Create checkout session (14-day trial)
- `POST /api/stripe/portal` - Create customer billing portal
- `POST /api/stripe/webhook` - Stripe webhook receiver

## Recent Changes

### 2026-02-10 (Latest)
- **Stripe Payment Integration**: Full subscription billing system
  - 4 tiers: Starter £59, Growth £129, Pro £249, Scale £399 (monthly, GBP)
  - Stripe checkout with 14-day free trial on all plans
  - Products synced to database via stripe-replit-sync
  - Webhook handling for payment events
  - Customer billing portal for subscription management
  - "Start Free Trial" buttons on pricing page connected to Stripe checkout
- **Post-Purchase Account Setup**: Automated onboarding email flow
  - After Stripe checkout, welcome email sent from support@titanfleet.co.uk
  - Setup link with 48-hour expiry token
  - Account setup page: company name, contact name, password selection
  - Auto-generates unique company code from company name
  - Creates company + transport manager user with hashed password (bcrypt)
  - Stripe webhook signature verification for security
- **Password Reset System**: Full forgot/reset password flow
  - "Forgot Password?" sends reset email from support@titanfleet.co.uk
  - 1-hour expiry reset tokens
  - Secure password reset page with validation
  - Email enumeration prevention (always returns success)
- **Email/Password Manager Login**: Alternative to PIN-based login
  - Manager login page now has tabbed "Company Code" / "Email Login" modes
  - Email+password login with full 2FA (TOTP) support
  - "Forgot your password?" link on email login mode
- **Email Service Updated**: From address changed to `Titan Fleet <support@titanfleet.co.uk>`
  - Uses TITAN_RESEND_KEY secret
  - Branded HTML email templates for setup and password reset
- Files: server/authRoutes.ts, server/stripeClient.ts, server/webhookHandlers.ts, server/seedStripeProducts.ts, SetupAccount.tsx, ForgotPassword.tsx, ResetPassword.tsx

### 2026-02-09
- **Agentic Automation System**: Proactive fleet compliance automation
  - Auto-VOR: Vehicles automatically flagged as VOR when inspection fails (vorStatus, vorReason, vorStartDate set)
  - Defect Escalation: Open defects auto-escalate severity after 24h (LOW→MEDIUM→HIGH→CRITICAL) with manager notifications
  - Fuel Anomaly Detection: Flags fuel entries >2.5x above vehicle's rolling 30-entry average, notifies managers
  - Compliance Score Widget: Real-time fleet health score (0-100) on manager dashboard with A-F grading
    - Weighted: inspections 30%, defects 25%, MOT 25%, VOR 20%
    - Circular SVG progress, breakdown bars, color-coded (green/amber/red)
  - Scheduler: Daily 8am (MOT/Tax/Service) + 4-hourly (defect escalation, fuel anomalies) via node-cron
  - Guards against notification spam: only escalates non-CRITICAL defects, skips unchanged severity
  - API: GET /api/manager/compliance-score/:companyId
- **Driver-to-Manager Messaging**: In-app messaging system for fleet communication
  - Driver: "Message Transport" card on dashboard with compose modal (subject, message, priority)
  - Manager: "Driver Messages" panel on dashboard with unread count badge, read/unread styling, inline expand
  - Messages table with sender, subject, content, priority, readAt tracking
  - Multi-tenant security: sender verified against company, company-scoped reads, sanitized sender data
  - 30-second auto-polling for new messages on manager dashboard
  - API: POST /api/messages, GET/PATCH manager message endpoints

### 2026-02-07
- **Proof of Delivery (POD) System**: Complete delivery capture and management
  - Driver: Mobile-first POD capture with customer name, address, reference, signature pad, up to 5 photos, GPS auto-capture
  - Driver: Delivery history page with status badges and detail view
  - Manager: Full deliveries dashboard with stats cards, table, filters, detail modal with signature/photo preview
  - Manager: Bulk status updates, individual status changes, CSV export, PDF generation per delivery
  - SignaturePad component using react-signature-canvas
  - Photos/signatures uploaded to Object Storage
  - GDPR: 18-month retention for delivery records
  - Files: CompleteDelivery.tsx, DriverDeliveries.tsx, manager/Deliveries.tsx, podPdfService.ts, SignaturePad.tsx

### 2025-12-14
- **Team Management**: Full user CRUD in Settings page
  - Add new drivers and managers with name, email, role, PIN
  - Edit existing user profiles
  - Deactivate users (soft delete) with confirmation
  - Multi-tenant security: company ownership verification on all operations
  - Audit logging for all user changes
  - API endpoints: POST/PATCH/DELETE /api/manager/users
  - UI: Team Management section in Settings.tsx

### 2025-12-14 (Earlier)
- **Google Drive Integration**: Per-company PDF upload to Google Drive
  - Manager Settings page has Google Drive configuration UI
  - Each company configures their own OAuth refresh token and folder ID
  - Inspection PDFs auto-upload to Google Drive after submission
  - Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables
  - API endpoints: PATCH/POST /api/manager/company/:id/gdrive
  - Files: server/googleDriveService.ts, updated Settings.tsx
- **PDF Generation**: Inspection reports downloadable as PDF
  - GET /api/inspections/:id/pdf - Download inspection PDF
  - Includes company info, vehicle, driver, checklist, defects, timing evidence
  - Download button on Manager Inspections page

### 2025-12-14 (Earlier)
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
