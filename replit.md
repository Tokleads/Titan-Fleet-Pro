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

**Design Principles:**
- **Multi-tenancy**: Designed from the ground up to support multiple companies with isolated data and configurable branding.
- **Mobile-first**: All driver-facing functionalities are optimized for mobile devices, prioritizing ease of use and accessibility.
- **Scalability**: Utilizing a robust tech stack and architectural patterns to support future growth and feature expansion.
- **Compliance Automation**: Integration of agentic systems for automated compliance checks, notifications, and proactive management.

**Core Features & Implementations:**
- **Authentication**: PIN-based login for drivers, email/password with 2FA for managers, secure account setup and password reset flows.
- **Data Models**: Comprehensive schema for Companies, Users (Drivers/Managers), Vehicles, Inspections, Fuel Entries, Defects, Deliveries, and Subscriptions.
- **Manager Dashboard**: Provides KPIs, recent inspections, defect tracking (Kanban), fuel logs, fleet management, and settings.
- **Messaging System**: In-app communication between drivers and transport managers.
- **PDF Generation**: Dynamic generation of inspection reports and Proof of Delivery documents.
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