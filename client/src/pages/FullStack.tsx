import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Database,
  Server,
  Globe,
  Brain,
  Shield,
  MapPin,
  Bell,
  CreditCard,
  Wifi,
  WifiOff,
  Search,
  Layers,
  Cpu,
  FileText,
  Users,
  Truck,
  Zap,
  Lock,
  BarChart3,
  Code2,
  GitBranch,
  Package,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

type BadgeColor = "blue" | "violet" | "emerald" | "amber" | "rose" | "slate" | "cyan" | "orange";

interface StackSection {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  color: BadgeColor;
  label: string;
  title: string;
  summary: string;
  items: { name: string; detail: string }[];
  badge?: string;
}

const COLOR_MAP: Record<BadgeColor, { bg: string; border: string; text: string; icon: string; badge: string }> = {
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400",    icon: "text-blue-400",    badge: "bg-blue-500/20 text-blue-300" },
  violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/20",  text: "text-violet-400",  icon: "text-violet-400",  badge: "bg-violet-500/20 text-violet-300" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-300" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   icon: "text-amber-400",   badge: "bg-amber-500/20 text-amber-300" },
  rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/20",    text: "text-rose-400",    icon: "text-rose-400",    badge: "bg-rose-500/20 text-rose-300" },
  slate:   { bg: "bg-slate-500/10",   border: "border-slate-500/20",   text: "text-slate-400",   icon: "text-slate-400",   badge: "bg-slate-500/20 text-slate-300" },
  cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    text: "text-cyan-400",    icon: "text-cyan-400",    badge: "bg-cyan-500/20 text-cyan-300" },
  orange:  { bg: "bg-orange-500/10",  border: "border-orange-500/20",  text: "text-orange-400",  icon: "text-orange-400",  badge: "bg-orange-500/20 text-orange-300" },
};

const sections: StackSection[] = [
  {
    id: "frontend",
    icon: Globe,
    color: "blue",
    label: "Client Layer",
    title: "Frontend",
    summary: "A fully typed React SPA built for speed, mobile drivers, and a premium manager console — two distinct UX modes from one codebase.",
    badge: "React 18 + TypeScript + Vite",
    items: [
      { name: "React 18 + TypeScript", detail: "Strict typing end-to-end. Lazy-loaded routes keep initial bundle under 250 KB." },
      { name: "Vite", detail: "Sub-second HMR in development. Code-splitting by route for production." },
      { name: "TailwindCSS", detail: "Utility-first styling with a custom Titan Fleet design token layer — color, spacing, elevation." },
      { name: "Framer Motion", detail: "Page transitions, card reveals, typewriter animations, and progress indicators throughout both portals." },
      { name: "Recharts", detail: "Fleet utilisation, cost-per-mile, MPG trend, and defect frequency charts in the manager analytics dashboard." },
      { name: "Wouter", detail: "Lightweight client-side router — 2 KB vs React Router's 50 KB. Route-level code splitting via React.lazy()." },
      { name: "Titan Fleet Design System", detail: "Custom component library: TitanButton, TitanCard, SegmentedControl, CaptureTile. Inter (UI) + Oswald (headings). 56 px mobile tap targets throughout." },
      { name: "TanStack Query", detail: "Server state management: cache, background refetch, optimistic updates, and suspense-ready data fetching." },
    ],
  },
  {
    id: "backend",
    icon: Server,
    color: "violet",
    label: "API Layer",
    title: "Backend",
    summary: "A modular Express API organised by domain — auth, inspections, compliance, operations, finance, and settings — each in its own route file.",
    badge: "Node.js + Express + TypeScript",
    items: [
      { name: "Express + TypeScript", detail: "Typed request/response handlers. Zod schema validation on every inbound payload before it touches storage." },
      { name: "tsx runtime", detail: "Runs TypeScript directly in production — no compile step or dist/ folder required." },
      { name: "Route architecture", detail: "routes.ts · complianceRoutes.ts · operationsRoutes.ts · financialRoutes.ts · settingsRoutes.ts · coreRoutes.ts · complianceCopilotRoutes.ts — each registered via a register*Routes(app) pattern." },
      { name: "node-cron scheduler", detail: "Background jobs: MOT expiry checks, defect escalation (every 4 hours), fuel anomaly detection, and driver hours infringement sweeps — all at startup and on schedule." },
      { name: "PDF generation", detail: "Dynamic inspection PDFs and Proof of Delivery reports generated server-side with pdfkit and streamed directly to the client." },
      { name: "Zod validation", detail: "Every API route validates its request body against the drizzle-zod insert schema. Invalid payloads never reach the database layer." },
      { name: "JWT + httpOnly cookies", detail: "Auth tokens are stored in httpOnly, SameSite=strict cookies — inaccessible to JavaScript and protected from XSS." },
      { name: "Multi-tenant isolation", detail: "Every query is scoped by companyId. No cross-tenant data leakage is possible at the ORM layer." },
    ],
  },
  {
    id: "database",
    icon: Database,
    color: "emerald",
    label: "Data Layer",
    title: "Database & ORM",
    summary: "PostgreSQL with Drizzle ORM for type-safe queries, and the pgvector extension powering the RAG compliance pipeline.",
    badge: "PostgreSQL + Drizzle + pgvector",
    items: [
      { name: "PostgreSQL", detail: "Primary relational store. Tables for companies, users, vehicles, inspections, defects, fuel entries, timesheets, GPS tracks, geofences, documents, and more." },
      { name: "Drizzle ORM", detail: "Schema-first: types flow from shared/schema.ts to both the API and the client. createInsertSchema() from drizzle-zod generates Zod validators directly from the table definitions." },
      { name: "pgvector extension", detail: "Enables vector similarity search for the RAG compliance pipeline. DVSA Guide to Roadworthiness is chunked, embedded, and stored as float vectors." },
      { name: "Atomic transactions", detail: "Multi-step operations (e.g., clock-in + GPS log, inspection + defect creation) wrapped in database transactions to prevent partial state." },
      { name: "Schema design", detail: "vehicles (vrm, mot_due, vor_status), inspections (odometer, status, started_at/completed_at), defects (severity, status, photo_url), timesheets (arrival_time, departure_time, ACTIVE/COMPLETED), driver_locations (lat, lon, timestamp)." },
      { name: "db:push workflow", detail: "Schema changes applied with npm run db:push — no manual SQL migrations. Drizzle introspects the live DB and applies only the diff." },
    ],
  },
  {
    id: "ai",
    icon: Brain,
    color: "cyan",
    label: "Intelligence Layer",
    title: "AI & Agentic Automation",
    summary: "Three distinct AI systems: a live fleet Copilot, a RAG compliance engine grounded in DVSA documentation, and automated severity classification for defects.",
    badge: "GPT-4o · text-embedding-3-large · RAG",
    items: [
      { name: "Fleet Copilot", detail: "POST /api/copilot/chat — multi-turn conversation with full fleet context injected per message. Answers live defect, driver, MOT, fuel, and hours questions in natural language. Built into the manager dashboard." },
      { name: "RAG Compliance Pipeline", detail: "DVSA Guide to Roadworthiness chunked into ~500-token passages, embedded with text-embedding-3-large, stored in pgvector. At query time, the top-k relevant passages are retrieved and injected into a GPT-4o prompt for legally grounded answers." },
      { name: "Defect AI triage", detail: "When a driver reports a defect, GPT-4o classifies severity (LOW / MEDIUM / HIGH / CRITICAL) using DVSA defect criteria. Managers can trigger AI Re-analyze from the defect detail panel." },
      { name: "Auto-VOR", detail: "Agentic: when a FAIL inspection is submitted, the system automatically sets the vehicle's vor_status to OFF_ROAD and notifies the transport manager — no human step required." },
      { name: "Fuel anomaly detection", detail: "Scheduled cron checks fuel entries against expected MPG ranges per vehicle. Entries outside tolerance are flagged automatically and surfaced in the Fuel Intelligence dashboard." },
      { name: "Defect escalation agent", detail: "Open defects older than a configurable threshold are automatically escalated in severity and a push notification is sent to the transport manager." },
      { name: "Predictive maintenance", detail: "Maintenance schedules predicted from historical inspection data, mileage patterns, and defect frequency per vehicle. Surfaced in the Predictive Analytics dashboard." },
      { name: "OpenAI integration", detail: "Uses AI_INTEGRATIONS_OPENAI_API_KEY + AI_INTEGRATIONS_OPENAI_BASE_URL via the Replit AI integration — model: gpt-4o, embeddings: text-embedding-3-large." },
    ],
  },
  {
    id: "auth",
    icon: Shield,
    color: "rose",
    label: "Security Layer",
    title: "Auth & Access Control",
    summary: "Two distinct authentication flows for two distinct user types, with granular role-based access and a full audit trail.",
    badge: "JWT · TOTP · RBAC",
    items: [
      { name: "Driver PIN auth", detail: "Drivers enter a 4-digit PIN + company code. Fast, glove-friendly, no keyboard required. JWT issued into httpOnly cookie on success." },
      { name: "Manager email + password + 2FA", detail: "Email/password with optional TOTP (time-based one-time password) second factor. QR code provisioning built into the Settings page." },
      { name: "Role-based access control", detail: "Roles: ADMIN · TRANSPORT_MANAGER · DRIVER · MECHANIC · OFFICE. Each route is gated by role middleware. Managers cannot access driver-only routes and vice versa." },
      { name: "Admin impersonation", detail: "Platform admins (TitanFleet staff) can impersonate any company manager for support. Every impersonated action is written to the audit log with the impersonator's ID." },
      { name: "Audit log", detail: "Immutable record of every sensitive action: logins, impersonations, data exports, defect status changes, timesheet approvals." },
      { name: "Driver self-registration", detail: "Managers generate single-use invite links. Drivers click the link, set their PIN, and are added to the company. Company code is pre-filled via the URL — WCAG 3.3.7 compliant." },
    ],
  },
  {
    id: "gps",
    icon: MapPin,
    color: "amber",
    label: "Operations Layer",
    title: "GPS & Fleet Operations",
    summary: "Real-time location tracking, geofence enforcement, shift trail replay, and automatic stop detection — all running from within the driver's browser.",
    badge: "Web Geolocation API · PostGIS patterns",
    items: [
      { name: "Real-time GPS tracking", detail: "useDriverGPSTracking hook in DriverLayout streams location to the server every 10 seconds during an active shift. Persisted to driver_locations table." },
      { name: "Shift trail map", detail: "Managers open any completed shift and view the full route on a map — GPS breadcrumbs connected chronologically with stop markers where the driver was stationary." },
      { name: "Driver stop detection", detail: "Server-side logic detects when a driver is stationary for more than 3 minutes and creates a stop record with timestamp, duration, and coordinates." },
      { name: "Geofencing", detail: "Managers define geofences (polygon or radius) around depots. Clock-ins outside the boundary are flagged for review — not blocked, but recorded and surfaced in the dashboard." },
      { name: "GPS clock-in override", detail: "Drivers without GPS signal can clock in with an override flag. The event is recorded as GPS_OVERRIDE and reviewed by the manager." },
      { name: "Live tracking dashboard", detail: "Manager Live Tracking page shows all active drivers on a map with their current VRM, speed, and last-updated timestamp — refreshed every 15 seconds." },
      { name: "Proof of Delivery", detail: "Drivers capture delivery confirmation with GPS coordinates, signature (canvas), and photo evidence. All three are bundled into a timestamped PDF and optionally synced to Google Drive." },
    ],
  },
  {
    id: "notifications",
    icon: Bell,
    color: "orange",
    label: "Comms Layer",
    title: "Notifications & Messaging",
    summary: "Push to browser, push to email, and in-app messaging — all triggered automatically by fleet events.",
    badge: "Web Push · Resend · In-App",
    items: [
      { name: "Web Push API", detail: "Native browser push notifications for managers — no app install required. Service worker handles background delivery when the tab is closed." },
      { name: "Resend email", detail: "Transactional emails for: driver invitations, MOT expiry warnings, defect escalations, timesheet approval requests, and scheduled weekly/monthly report digests." },
      { name: "Scheduled report emails", detail: "Managers configure automated fleet summary emails (weekly or monthly). Reports are generated server-side and emailed as HTML with an attached PDF." },
      { name: "In-app driver messaging", detail: "Two-way messaging between managers and drivers inside the app. Drivers receive messages in their notification centre; managers compose from the Drivers page." },
      { name: "Notification history", detail: "Full log of every notification sent — type, recipient, trigger event, and delivery status — paginated and searchable in the manager console." },
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    color: "emerald",
    label: "Revenue Layer",
    title: "Payments & Billing",
    summary: "Stripe-powered subscription management with webhook sync, multi-tier plans, and per-company billing isolation.",
    badge: "Stripe Subscriptions + Webhooks",
    items: [
      { name: "Stripe subscriptions", detail: "Companies subscribe to a tiered plan (Starter / Growth / Enterprise). Billing is per-company, not per-user." },
      { name: "Webhook sync", detail: "Stripe webhooks update subscription status in real-time. Expired or cancelled subscriptions lock the manager console immediately." },
      { name: "Managed webhooks", detail: "The server self-registers and self-cleans Stripe webhook endpoints on startup — no manual configuration in the Stripe dashboard required." },
      { name: "Feature gating", detail: "Company feature flags (GPS, AI copilot, advanced analytics) are toggled per subscription tier. The company_features table controls what each tenant can access." },
    ],
  },
  {
    id: "offline",
    icon: WifiOff,
    color: "slate",
    label: "Resilience Layer",
    title: "Offline & PWA",
    summary: "Drivers in poor signal areas can complete inspections and defect reports offline. Data syncs automatically when connectivity returns.",
    badge: "IndexedDB · Service Worker · PWA",
    items: [
      { name: "Offline inspection queue", detail: "Completed inspections are written to IndexedDB when the API call fails. A background sync job retries submission when the connection is restored." },
      { name: "Service worker caching", detail: "Static assets, fonts, and the app shell are precached on install. Drivers can open the app without any network connection." },
      { name: "PWA install prompt", detail: "Custom install prompt shown to drivers on mobile — adds the app to the home screen with a custom icon and splash screen, no app store required." },
      { name: "Optimistic UI", detail: "Driver-facing actions (check submissions, fuel entries) show immediate success states. Background sync resolves any server conflicts silently." },
    ],
  },
  {
    id: "compliance",
    icon: FileText,
    color: "blue",
    label: "Regulatory Layer",
    title: "Compliance Automation",
    summary: "Automated DVSA, DVLA, and EU hours compliance — reminders, infringement detection, earned recognition KPIs, and CPC tracking.",
    badge: "DVSA · EU Drivers' Hours · FORS",
    items: [
      { name: "MOT & tax expiry tracking", detail: "Vehicles approaching MOT/tax expiry generate automatic alerts at 30, 14, and 7 days. Transport managers receive push and email notifications." },
      { name: "DVSA API integration", detail: "Real-time MOT status lookup by VRM. VIN auto-populate on new vehicle creation pulls make, model, and year from DVSA records." },
      { name: "Driver CPC tracking", detail: "Transport managers log Certificate of Professional Competence hours per driver. The system flags drivers approaching or past the 35-hour periodic training requirement." },
      { name: "EU/UK drivers' hours engine", detail: "Rules engine calculates daily and weekly driving time, rest periods, and breaks per driver. Infringements (e.g., insufficient rest) are flagged automatically in the Driver Hours dashboard." },
      { name: "14-hour working limit warning", detail: "Drivers see a visual warning banner when their shift approaches or exceeds the 14-hour spread-over limit — surfaced in the driver portal in real time." },
      { name: "FORS & Earned Recognition", detail: "DVSA Earned Recognition KPI tracking and FORS compliance checklists — both maintained in the manager console with evidence upload support." },
      { name: "Operator licence management", detail: "O-licence details stored per company. Vehicles can be filtered by O-licence. Licence expiry tracked alongside other key compliance dates." },
    ],
  },
  {
    id: "seo",
    icon: Search,
    color: "violet",
    label: "Growth Layer",
    title: "SEO Content Strategy",
    summary: "A 4-layer content moat designed for topical authority in UK fleet management — pillar guides, supporting articles, product pages, and free tools, all interconnected.",
    badge: "4-Layer Topical Authority",
    items: [
      { name: "Layer 1 — Pillar Guides", detail: "Long-form, comprehensive guides on topics like 'UK Fleet Management Compliance 2024', 'DVSA Roadworthiness Standards Explained', and 'Driver Hours Rules UK'. 3,000–6,000 words each with full schema markup." },
      { name: "Layer 2 — Supporting Articles", detail: "Satellite articles linking back to pillar pages. Topics: daily walkaround check requirements, MOT exemptions for HGVs, tachograph rules, FORS accreditation benefits. Builds topical clusters." },
      { name: "Layer 3 — Product Pages", detail: "Feature-specific landing pages for: fleet inspection software, digital walkaround checks, defect reporting app, driver hours tracking, MOT reminder software. Conversion-optimised with testimonials and trial CTAs." },
      { name: "Layer 4 — Free Tools", detail: "Interactive tools that capture organic traffic and email leads: MOT due date calculator, driver hours checker, fleet compliance audit template download, DVSA defect category lookup." },
      { name: "Internal linking architecture", detail: "Every article links to at least one product page and one pillar guide. Free tools link to the relevant product page. Sitemap covers all layers for full crawl coverage." },
      { name: "Open Graph + Twitter Card", detail: "All pages have bespoke og:title, og:description, and og:image. Meta tags updated programmatically per route for social sharing and link previews." },
      { name: "Structured data", detail: "FAQ schema on compliance guides. SoftwareApplication schema on product pages. BreadcrumbList on article pages. Article schema with datePublished and author for EEAT signals." },
    ],
  },
  {
    id: "multitenancy",
    icon: Users,
    color: "cyan",
    label: "Architecture Layer",
    title: "Multi-Tenancy & White Label",
    summary: "Every company operates in complete isolation — separate branding, separate data, separate feature sets — from a single deployment.",
    badge: "Shared DB · Row-level Isolation",
    items: [
      { name: "Shared database, isolated data", detail: "All tables have a companyId foreign key. Every query is filtered by the authenticated user's companyId — no cross-company reads are possible at the ORM level." },
      { name: "White-label branding", detail: "Companies configure their own name, logo, and primary colour. The driver portal and manager console render the company's brand, not TitanFleet's." },
      { name: "Feature flags per company", detail: "The company_features table controls which modules are active per tenant: GPS tracking, AI copilot, advanced analytics, Google Drive integration, scheduled reports." },
      { name: "Configurable fleet hierarchy", detail: "Companies define their own fleet groups, sub-fleets, and depot structures. Vehicles are assigned to groups; reports and analytics filter by group." },
      { name: "Driver self-registration flow", detail: "Invite link contains an encoded company code. Drivers register themselves — manager approves. No admin bottleneck." },
      { name: "Platform admin layer", detail: "TitanFleet platform admins can view all companies, impersonate any manager, and access cross-tenant analytics — gated behind the PLATFORM_ADMIN role." },
    ],
  },
];

const stats = [
  { value: "12", label: "Domain modules" },
  { value: "40+", label: "API route files" },
  { value: "30+", label: "Database tables" },
  { value: "3", label: "AI systems" },
  { value: "4", label: "SEO content layers" },
  { value: "2", label: "Auth flows" },
];

function SectionCard({ section, index }: { section: StackSection; index: number }) {
  const c = COLOR_MAP[section.color];
  const Icon = section.icon;
  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-2xl border ${c.border} ${c.bg} p-6 md:p-8`}
    >
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-bold tracking-widest uppercase ${c.text}`}>{section.label}</span>
            {section.badge && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>{section.badge}</span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{section.title}</h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">{section.summary}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {section.items.map((item, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <ChevronRight className={`w-4 h-4 mt-0.5 flex-shrink-0 ${c.text}`} />
            <div>
              <p className="text-sm font-semibold text-white mb-0.5">{item.name}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function FullStack() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-2 text-white font-bold text-lg hover:opacity-80 transition-opacity cursor-pointer">
              <Truck className="w-5 h-5 text-[#5B6CFF]" />
              <span className="font-['Oswald'] tracking-wide">Titan Fleet</span>
            </span>
          </Link>
          <Link href="/presentation">
            <span className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ExternalLink className="w-3.5 h-3.5" />
              Interview Presentation
            </span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5B6CFF]/10 via-transparent to-cyan-500/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-4xl"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-[#5B6CFF] uppercase">
                <Layers className="w-3.5 h-3.5" />
                Full Stack Architecture
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-['Oswald'] text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            >
              TitanFleet Pro
              <br />
              <span className="text-[#5B6CFF]">Technical Depth</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-slate-400 max-w-3xl leading-relaxed mb-8"
            >
              A production-grade, multi-tenant fleet management SaaS for UK transport operators.
              Built for DVSA compliance, real-time GPS, AI defect triage, timesheet management,
              and fuel intelligence — from a single TypeScript monorepo.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-10">
              {["Multi-tenant SaaS", "UK transport compliance", "RAG AI pipeline", "PWA + offline", "4-layer SEO", "April 2026 launch"].map((tag) => (
                <span key={tag} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                  {tag}
                </span>
              ))}
            </motion.div>

            {/* Stats bar */}
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-3 md:grid-cols-6 gap-4"
            >
              {stats.map((s) => (
                <div key={s.label} className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-2xl md:text-3xl font-bold text-white font-['Oswald']">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-tight">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stack at a glance */}
      <section className="border-b border-white/10 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs font-bold tracking-widest text-slate-500 uppercase mr-2">Core stack</span>
            {[
              { icon: Globe, label: "React 18 + Vite + TypeScript" },
              { icon: Server, label: "Node.js + Express" },
              { icon: Database, label: "PostgreSQL + Drizzle + pgvector" },
              { icon: Brain, label: "GPT-4o + RAG" },
              { icon: CreditCard, label: "Stripe" },
              { icon: MapPin, label: "Web Geolocation" },
              { icon: Bell, label: "Web Push + Resend" },
              { icon: WifiOff, label: "IndexedDB + Service Worker" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-sm text-slate-300 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Icon className="w-3.5 h-3.5 text-[#5B6CFF]" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* All sections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid gap-6"
        >
          {sections.map((section, i) => (
            <SectionCard key={section.id} section={section} index={i} />
          ))}
        </motion.div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/10 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-['Oswald'] text-3xl md:text-4xl font-bold text-white mb-4">
            Built to production standard.
            <span className="text-[#5B6CFF]"> Launching April 2026.</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-8">
            Live with ABTSO (companyId 2) — 12+ drivers, real vehicles, real inspections, real defect photos.
            Every feature described on this page is in production.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/manager/login">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-[#5B6CFF] text-white text-sm font-bold rounded-xl hover:bg-[#4a5ce0] transition-colors cursor-pointer">
                Manager Console
                <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/presentation">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/15 transition-colors cursor-pointer border border-white/10">
                Interview Presentation
              </span>
            </Link>
            <Link href="/">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 text-slate-400 text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors cursor-pointer border border-white/10">
                <ArrowLeft className="w-4 h-4" />
                Landing Page
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
