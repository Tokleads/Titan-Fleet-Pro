# FleetCheck Lite Drive

## Overview

FleetCheck Lite Drive is a premium, multi-tenant fleet management application designed to optimize operations for drivers and managers. It provides mobile-optimized workflows for vehicle inspections, defect reporting, fuel management, and regulatory compliance. The project aims to offer a comprehensive solution with capabilities for white-label branding and advanced agentic automation, ultimately enhancing efficiency and ensuring compliance in fleet operations.

**Key Capabilities:**
- **Driver Portal**: Mobile-first vehicle inspections, defect reporting, and fuel entry.
- **Manager Console**: Centralized dashboard for fleet overview and advanced management.
- **DVSA Integration**: Real-time MOT status lookups.
- **Agentic Automation**: Proactive features like auto-VOR, defect escalation, and fuel anomaly detection.
- **Proof of Delivery (POD)**: Comprehensive delivery capture with signatures, photos, and GPS.
- **Subscription Management**: Integrated Stripe for billing.

## User Preferences

- Mobile-first driver experience (56px tap targets)
- Premium visual quality with motion, depth, glass effects
- Typography: Inter (UI) + Oswald (headings)
- "Industry titan" quality design system

## System Architecture

FleetCheck Lite Drive is a full-stack application built with a clear separation of concerns, emphasizing scalability, compliance automation, and a mobile-first approach.

**Technical Stack:**
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Custom "Titan Fleet" design system.

**Server Route Architecture:**
Routes are organized by feature area (e.g., authentication, inspections, compliance, operations, finance, settings) and are registered using a `register...Routes(app)` pattern. Key areas include:
- `routes.ts`: Auth, inspections, defects, fuel, vehicle CRUD, fleet hierarchy.
- `complianceRoutes.ts`: Reminders, DVLA checks, operator licences, Driver CPC, scheduled reports.
- `operationsRoutes.ts`: Shift checks, GPS tracking, geofencing, delivery/POD.
- `financialRoutes.ts`: Timesheets, pay rates, wage calculations.
- `settingsRoutes.ts`: 2FA/TOTP, company features, Google Drive integration.
- `coreRoutes.ts`: Audit logs, documents, driver messages, PDF generation, notifications.
- `complianceCopilotRoutes.ts`: RAG-powered DVSA compliance Q&A.

**Design Principles:**
- **Multi-tenancy**: Supports multiple companies with isolated data and configurable branding.
- **Mobile-first**: Driver-facing functionalities optimized for mobile.
- **Scalability**: Robust tech stack and patterns for future growth.
- **Compliance Automation**: Agentic systems for automated checks and notifications.
- **GPS Tracking Persistence**: Managed via a `useDriverGPSTracking` hook in `DriverLayout`.
- **Clock-in from anywhere**: Out-of-geofence clock-ins are flagged for review.

**Core Features & Implementations:**
- **Authentication**: PIN-based for drivers, email/password with optional 2FA for managers. JWT tokens in httpOnly cookies.
- **Role-Based Access**: Granular roles including ADMIN, TRANSPORT_MANAGER, DRIVER, MECHANIC, etc.
- **Timesheet Approval Workflow**: Manager adjustments require ADMIN approval.
- **Company Car Register**: Drivers log company car usage for fine attribution.
- **Data Models**: Comprehensive schemas for all entities (Companies, Users, Vehicles, Inspections, etc.).
- **Manager Dashboard**: KPIs, defect tracking (Kanban), fuel logs, and an "Attention Required" section for critical alerts.
- **Advanced Analytics**: Fleet utilization, cost-per-mile, MPG, defect trends, compliance status using recharts.
- **Fleet Management**: Vehicle list with O-licence filtering and geofence management.
- **Per-Driver Wage System**: Individual hourly rates, premiums, overtime, and CSV export.
- **Driver Self-Registration**: Managers generate invite links for drivers to self-register.
- **Messaging System**: In-app communication between drivers and managers.
- **PDF Generation**: Dynamic generation of inspection and POD reports.
- **14-Hour Working Limit**: Visual warnings for drivers exceeding working limits.
- **VIN Auto-Populate**: DVSA lookup for vehicle details.
- **RAG Compliance Pipeline**: `pgvector`-powered Retrieval-Augmented Generation using DVSA Guide to Roadworthiness, with `text-embedding-3-large` and GPT-4o for legally grounded defect classification.
- **Admin Impersonation**: Platform admins can impersonate company managers for support, with audit logging.
- **Driver Stop Detection**: Automatic logging of stationary periods during shifts.
- **Shift Trail Map**: Managers can view GPS routes and stop markers for driver shifts.
- **GPS Clock-In Override**: Allows clock-in without GPS, flagged for review.
- **Browser Push Notifications**: Native Web Push API for manager alerts.
- **Email Delivery**: Resend integration for transactional emails.
- **Offline Inspection Queue**: IndexedDB-powered queue for offline data submission, with service worker caching.
- **Driver CPC Tracking**: Manager page to track Certificate of Professional Competence hours.
- **Driver Hours & Working Time**: Manager page with EU/UK rules engine for compliance and infringement detection.
- **Scheduled Report Emails**: Managers can configure automated weekly/monthly report emails.
- **FORS & Earned Recognition**: Tracking of DVSA Earned Recognition KPIs and FORS compliance checklists.

**SEO Content Moat:**
A 4-layer strategy including Pillar Guides, Supporting Articles, Product Pages, and Free Tools, all interconnected with internal linking and a comprehensive sitemap for topical authority and traffic acquisition.

**UI/UX Decisions:**
- **Branding**: Configurable white-label branding (company name, logo, colors, feature toggles).
- **Typography**: Inter for UI, Oswald for headings.
- **Visuals**: Premium quality with motion, depth, and glass effects.

## External Dependencies

- **PostgreSQL**: Primary database.
- **DVSA API**: Real-time MOT status and vehicle data.
- **Stripe**: Subscription management and payment processing.
- **Resend**: Transactional email delivery.
- **Google Drive API**: Optional integration for PDF storage.
- **node-cron**: Scheduling agentic automation tasks.