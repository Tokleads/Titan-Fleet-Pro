# FleetCheck Lite Drive

## Overview

FleetCheck Lite Drive is a premium, multi-tenant fleet management application designed to streamline operations for both drivers and managers. It offers distinct, mobile-optimized workflows to enhance efficiency and compliance in fleet management. The project aims to provide a comprehensive solution for vehicle inspections, defect reporting, fuel management, and regulatory compliance, with ambitious plans for white-label branding and advanced automation features.

**Key Capabilities:**
- **Driver Portal**: Mobile-first vehicle inspections, defect reporting, and fuel entry.
- **Manager Console**: Centralized dashboard for fleet overview, settings, and advanced management features.
- **DVSA Integration**: Real-time MOT status lookups for compliance.
- **Agentic Automation**: Proactive features like auto-VOR, defect escalation, and fuel anomaly detection.
- **Proof of Delivery (POD) System**: Comprehensive delivery capture with signatures, photos, and GPS.
- **Subscription Management**: Integrated Stripe for subscription billing and account management.

## User Preferences

- Mobile-first driver experience (56px tap targets)
- Premium visual quality with motion, depth, glass effects
- Typography: Inter (UI) + Oswald (headings)
- "Industry titan" quality design system

## System Architecture

FleetCheck Lite Drive is built as a full-stack application with a clear separation of concerns.

**Technical Stack:**
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Custom "Titan Fleet" design system, ensuring a consistent and premium user experience.

**Server Route Architecture:**
Routes are split across focused files registered via `register...Routes(app)` pattern:
- `routes.ts` (~2977 lines): Auth middleware, login endpoints, inspections, defects, fuel, vehicle CRUD, fleet hierarchy, referrals
- `complianceRoutes.ts`: Reminders, DVLA license verification, operator licences, company car register, GDPR
- `operationsRoutes.ts`: Shift checks, GPS tracking, geofencing, stagnation alerts, delivery/POD
- `financialRoutes.ts`: Timesheets, pay rates, wage calculations, CSV exports
- `settingsRoutes.ts`: 2FA/TOTP, company feature settings, Google Drive, logo upload
- `coreRoutes.ts`: Audit logs, documents, driver messages, PDF report generation, Titan Command notifications, report endpoints
- `complianceCopilotRoutes.ts`: POST /api/compliance/query — RAG-powered DVSA compliance Q&A (vector search + GPT-4o)
- Plus existing: `vehicleManagementRoutes.ts`, `fuelIntelligenceRoutes.ts`, `apiHealthRoutes.ts`, `driverRoutes.ts`, `authRoutes.ts`, `adminRoutes.ts`, `dashboardRoutes.ts`, `fleetDocumentsRoutes.ts`, `notificationPreferencesRoutes.ts`, `userRolesRoutes.ts`

**Design Principles:**
- **Multi-tenancy**: Designed from the ground up to support multiple companies with isolated data and configurable branding.
- **Mobile-first**: All driver-facing functionalities are optimized for mobile devices, prioritizing ease of use and accessibility.
- **Scalability**: Utilizing a robust tech stack and architectural patterns to support future growth and feature expansion.
- **Compliance Automation**: Integration of agentic systems for automated compliance checks, notifications, and proactive management.
- **GPS Tracking Persistence**: Tracking lifecycle managed in DriverLayout (AppShell.tsx) via `useDriverGPSTracking` hook — persists across all driver pages, syncs with active timesheet every 30s.
- **Clock-in from anywhere**: No geofence restriction. Out-of-geofence clock-ins flagged for manager review.

**Core Features & Implementations:**
- **Authentication**: PIN-based login for drivers only (quick access on shared tablets). Managers use email/password exclusively (no PIN option) with optional 2FA. Secure account setup and password reset flows. JWT tokens stored in httpOnly cookies (cookie name: `tf_token`, 24h expiry, secure in production, sameSite: lax). Client-side fully migrated — global fetch interceptor adds `credentials: "include"`, no more localStorage token storage. Bearer token header fallback still accepted server-side.
- **Role-Based Access**: ADMIN (full access + approval authority), TRANSPORT_MANAGER (standard management), PLANNER (view-only: on-duty drivers, no clock in/out), OFFICE (read-only dashboard view), DRIVER, MECHANIC, AUDITOR.
- **Timesheet Approval Workflow**: Time adjustments by transport managers require ADMIN approval. Pending/Approved/Rejected states with server-side role enforcement.
- **Company Car Register**: Drivers log which company car they're using (number plate, date/time) for fine attribution. Located at /driver/car-register.
- **Data Models**: Comprehensive schema for Companies, Users, Vehicles, Inspections, Fuel Entries, Defects, Deliveries, Subscriptions, and CompanyCarRegister.
- **Manager Dashboard**: Provides KPIs, recent inspections, defect tracking (Kanban), fuel logs, fleet management, and settings. Attention Required section shows overdue MOTs (red, links to fleet), 14-hour driver limit warnings (red pulsing, links to timesheets), missed inspections, critical defects, unread messages, and expiring docs.
- **Advanced Analytics Dashboard**: Fleet utilization rate (active/idle/VOR breakdown), cost-per-mile estimates, top drivers by MPG, defect trend analysis, compliance status charts, driver activity trends, cost analysis, all with recharts visualizations.
- **Fleet Management**: Vehicle list with O-licence filtering, geofence management (10m minimum radius). All 49 ABTSO vehicles enriched with DVSA MOT data (expiry dates, make, model).
- **Per-Driver Wage System**: Individual hourly rates, night/weekend/holiday premiums, overtime threshold (14hr default), CSV export. 2026 UK bank holidays loaded for ABTSO.
- **Driver Self-Registration**: Managers generate invite links (`POST /api/drivers/invites`). Drivers self-register at `/join/:token` with name/email/phone, auto-assigned PIN. Invite links support max-uses and expiry. `driver_invites` table tracks usage. Public endpoints (no auth required for invite validation and registration).
- **Messaging System**: In-app communication between drivers and transport managers.
- **PDF Generation**: Dynamic generation of inspection reports and Proof of Delivery documents with embedded photos.
- **14-Hour Working Limit**: Red highlight warning when driver hours reach/exceed 14h (840 minutes) in timesheets and TM app.
- **VIN Auto-Populate**: DVSA lookup auto-fills VIN, make, and model when adding vehicles by registration.
- **End-of-Shift Inspections**: Visible in manager Inspections tab via dedicated "End of Shift Checks" sub-tab.
- **Titan Command Message History**: Sent message history with recipient, priority, and read status displayed below compose form.
- **RAG Compliance Pipeline**: pgvector-powered Retrieval-Augmented Generation using DVSA Guide to Roadworthiness. `complianceSearchService.ts` generates embeddings via `text-embedding-3-large` (2000 dims, truncated from 3072 to fit pgvector HNSW index limit), performs cosine similarity search on `compliance_knowledge` table (HNSW index, 26 seeded chunks with keywords). Uses `TitanFleetOpenai` secret for direct OpenAI API access (embeddings endpoint not supported by Replit AI proxy). AI triage in `aiTriageService.ts` retrieves top-3 relevant DVSA sections before GPT-4o analysis to ensure legally grounded defect classification. Seed script: `npx tsx scripts/seed-compliance-knowledge.ts ./data/dvsa`.
- **Admin Impersonation**: Platform admin can log in as any company's manager from `/admin/companies` via "Login as" button. Creates a JWT cookie for the target company's manager, shows an amber banner across the manager dashboard/mobile app with "Return to Admin" button. Exit flow calls `POST /api/admin/exit-impersonation` to clear the impersonated cookie. All impersonation actions are audit-logged. JWT is not exposed in response body — relies solely on httpOnly cookie.
- **Driver Stop Detection**: Automatic logging of 10+ minute stationary periods during shifts. GPS pings analyzed on each submission — if driver stays within 50m for 10+ minutes, a stop is recorded with start/end times, duration, and coordinates. Stored in `driver_stops` table linked to timesheets. Stops under 10 minutes are auto-deleted.
- **Shift Trail Map**: Manager Live Tracking page includes "Shift Trail" section — select a driver and shift to see their GPS route plotted on a map with numbered stop markers. Shows start (green), latest position (red), route line (blue), and stops (amber numbered squares) with click-to-view duration/times. Summary stats: GPS points, stop count, total stop time.
- **GPS Clock-In Override**: Drivers can clock in even when geolocation is denied (permission denied). Button shows "Clock In (No GPS)" with amber warning. Clock-in is flagged as `locationOverride` for manager review. Manual depot selection is shown automatically when GPS is unavailable.
- **Browser Push Notifications**: Native Web Push API via service worker (`sw.js`). Managers can enable/disable in Notification Preferences. Shows desktop notifications for fleet alerts even when app is in background. No Firebase dependency.
- **Environmental Variables**: Secure management of API keys and database connections.

**UI/UX Decisions:**
- **Branding**: Configurable white-label branding via `client/src/config/tenant.ts` for company name, logo, primary colors, and feature toggles.
- **Typography**: Inter for UI elements and Oswald for headings to maintain a professional and clean aesthetic.
- **Visuals**: Emphasis on premium quality with motion, depth, and glass effects.

## External Dependencies

- **PostgreSQL**: Primary database for all application data.
- **DVSA API**: Used for real-time MOT status lookups and comprehensive vehicle data.
- **Stripe**: Integrated for subscription management, payment processing, and customer billing portals.
- **Resend**: Email service for transactional emails such as account setup, password resets, and notifications.
- **Google Drive API**: Optional integration for per-company PDF upload and storage.
- **node-cron**: Used for scheduling agentic automation tasks (e.g., defect escalation, compliance score updates).