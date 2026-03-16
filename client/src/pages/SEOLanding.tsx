import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Shield,
  Truck,
  ClipboardCheck,
  AlertTriangle,
  BarChart3,
  MapPin,
  Clock,
  Wrench,
  Menu,
  X,
  Instagram,
  Facebook,
  Zap,
  Target,
  Users,
  FileText,
  Gauge,
  PoundSterling,
} from "lucide-react";

interface FAQ {
  q: string;
  a: string;
}

interface LandingPage {
  slug: string;
  keyword: string;
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  problemTitle: string;
  problemBody: string;
  whyMattersTitle: string;
  whyMattersBody: string;
  solutionTitle: string;
  solutionBody: string;
  features: { title: string; desc: string; icon: string }[];
  whoTitle: string;
  whoBody: string;
  comparisonTitle: string;
  comparisonBody: string;
  comparisonPoints: string[];
  faqs: FAQ[];
  ctaTitle: string;
  ctaBody: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  shield: <Shield className="h-6 w-6" />,
  truck: <Truck className="h-6 w-6" />,
  clipboard: <ClipboardCheck className="h-6 w-6" />,
  alert: <AlertTriangle className="h-6 w-6" />,
  chart: <BarChart3 className="h-6 w-6" />,
  map: <MapPin className="h-6 w-6" />,
  clock: <Clock className="h-6 w-6" />,
  wrench: <Wrench className="h-6 w-6" />,
  zap: <Zap className="h-6 w-6" />,
  target: <Target className="h-6 w-6" />,
  users: <Users className="h-6 w-6" />,
  file: <FileText className="h-6 w-6" />,
  gauge: <Gauge className="h-6 w-6" />,
  pound: <PoundSterling className="h-6 w-6" />,
};

const pages: LandingPage[] = [
  {
    slug: "fleet-management-software-uk",
    keyword: "Fleet Management Software UK",
    metaTitle: "Fleet Management Software UK | DVSA Compliance & GPS Tracking | TitanFleet",
    metaDescription: "TitanFleet is UK fleet management software built for transport operators. DVSA walkaround checks, GPS tracking, defect reporting, timesheets & compliance dashboard. Start free.",
    heroTitle: "Fleet Management Software Built for UK Transport Operators",
    heroSubtitle: "TitanFleet gives transport managers a single platform for DVSA compliance, vehicle inspections, GPS tracking, defect management, and driver timesheets — purpose-built for UK haulage and logistics.",
    problemTitle: "The Problem with Managing a UK Fleet Today",
    problemBody: "Most UK fleet operators still rely on a patchwork of paper forms, spreadsheets, and disconnected tools to manage their vehicles and drivers. Walkaround check sheets get lost. Defect reports sit in WhatsApp groups. MOT expiry dates are tracked in notebooks. When DVSA turn up for an audit, pulling together evidence becomes a scramble.\n\nThis fragmented approach wastes time, increases compliance risk, and makes it almost impossible to get a clear picture of fleet health. Transport managers spend hours every week chasing paperwork instead of managing operations.",
    whyMattersTitle: "Why This Matters for Your O-Licence",
    whyMattersBody: "The Traffic Commissioner expects operators to demonstrate a robust maintenance and compliance regime. If you cannot produce inspection records, defect resolution timelines, or driver hours data on demand, you risk prohibition notices, fixed penalty fines starting at £300 per offence, and ultimately O-licence revocation.\n\nDVSA roadside checks are increasing, and the Earned Recognition scheme rewards operators who can prove compliance digitally. Without proper fleet management software, meeting these standards is significantly harder.",
    solutionTitle: "How TitanFleet Solves This",
    solutionBody: "TitanFleet is a digital fleet management platform designed specifically for UK transport operators. It replaces paper processes with a connected system that covers vehicle inspections, defect tracking, MOT monitoring, GPS tracking, driver timesheets, and compliance reporting — all accessible from a single dashboard.\n\nBuilt by a Class 1 HGV driver who understands the daily realities of fleet management, TitanFleet is designed to be practical, not over-engineered.",
    features: [
      { title: "DVSA Walkaround Check App", desc: "Drivers complete digital inspections on their phone. Fully aligned with DVSA guidelines, with photo evidence and PDF reports.", icon: "clipboard" },
      { title: "Defect Reporting & AI Triage", desc: "Defects reported instantly with photos. AI categorises severity using the DVSA Guide to Roadworthiness. Kanban workflow from reported to resolved.", icon: "alert" },
      { title: "Live GPS Tracking", desc: "Real-time driver locations, geofencing, stagnation alerts, and full shift trail maps with automatic stop detection.", icon: "map" },
      { title: "Compliance Dashboard", desc: "Fleet health score, MOT expiry tracking, missed inspection alerts, and DVSA Earned Recognition KPIs — all in one view.", icon: "shield" },
      { title: "Driver Timesheets & Wages", desc: "Automated clock-in/out, individual pay rates, overtime calculation, night and weekend premiums, and CSV export for payroll.", icon: "clock" },
      { title: "Fleet & MOT Management", desc: "Live DVSA MOT data for every vehicle, automated expiry alerts, service interval tracking, and bulk vehicle upload.", icon: "truck" },
    ],
    whoTitle: "Who Is TitanFleet For?",
    whoBody: "TitanFleet is designed for UK fleet operators running 5 to 500+ vehicles. Whether you operate HGVs, vans, or mixed fleets, the platform scales to your needs.\n\nIt is particularly well-suited for haulage companies, logistics firms, courier fleets, construction transport, and waste management operators — any business that needs DVSA compliance and real-time fleet visibility.",
    comparisonTitle: "How TitanFleet Differs from Generic Fleet Tools",
    comparisonBody: "Many fleet management tools are built for global markets and bolt on UK compliance as an afterthought. TitanFleet is different:",
    comparisonPoints: [
      "Built specifically for UK transport operators and DVSA requirements",
      "AI defect triage uses the DVSA Guide to Roadworthiness — not generic categories",
      "Walkaround checks aligned to DVSA standards, not US DOT inspections",
      "Earned Recognition KPIs built in, not available as a paid add-on",
      "Driver-first mobile experience designed for use in a cab, not at a desk",
      "No setup fees, no contracts — £59/month per vehicle",
    ],
    faqs: [
      { q: "Is TitanFleet suitable for small fleets?", a: "Yes. TitanFleet works for operators with as few as 5 vehicles. The platform scales as your fleet grows, with no minimum commitments or long-term contracts." },
      { q: "Does TitanFleet work with DVSA Earned Recognition?", a: "Yes. TitanFleet tracks the KPIs required for the DVSA Earned Recognition scheme, including MOT pass rates, inspection completion rates, defect resolution times, and CPC compliance." },
      { q: "Can drivers use TitanFleet on their personal phones?", a: "Yes. The driver app works on any modern smartphone — iPhone or Android — through a web browser. No app store download is required. Drivers log in with a company code and PIN." },
      { q: "How does TitanFleet handle MOT tracking?", a: "TitanFleet pulls live MOT data directly from the DVSA database for every vehicle in your fleet. You get automated alerts for upcoming expiries and a clear dashboard showing MOT status across all vehicles." },
      { q: "What support do you offer?", a: "All plans include email support and access to our help centre. We also offer onboarding assistance to help you set up your fleet, import vehicles, and train your drivers." },
    ],
    ctaTitle: "Ready to Manage Your Fleet Properly?",
    ctaBody: "Start your free trial today. No setup fees, no contracts. See why UK transport operators are switching to TitanFleet.",
  },
  {
    slug: "dvsa-walkaround-check-app",
    keyword: "DVSA Walkaround Check App",
    metaTitle: "DVSA Walkaround Check App | Digital Vehicle Inspections | TitanFleet",
    metaDescription: "Replace paper walkaround checks with TitanFleet's DVSA-aligned digital inspection app. Photo evidence, instant defect alerts, PDF reports. Used by UK haulage operators.",
    heroTitle: "DVSA Walkaround Check App for UK Fleet Operators",
    heroSubtitle: "TitanFleet replaces paper walkaround check sheets with a digital inspection app your drivers can use on any smartphone. Fully aligned with DVSA guidelines, with photo evidence and instant defect reporting.",
    problemTitle: "Paper Walkaround Checks Are a Compliance Risk",
    problemBody: "Paper walkaround check sheets are the standard across most UK fleets, but they create serious problems. Sheets get lost, damaged, or filled in incorrectly. Defects are noted but not escalated to the right person. When DVSA request inspection records during an audit, producing a complete, organised paper trail is difficult.\n\n43% of DVSA prohibition notices result from walkaround check failures. The average cost of a roadside prohibition is £1,500 when you factor in fines, vehicle downtime, and recovery costs.",
    whyMattersTitle: "Why Digital Walkaround Checks Matter",
    whyMattersBody: "The DVSA expects operators to maintain a systematic approach to vehicle inspections. While they do not mandate digital checks, they strongly recommend digital systems because they provide a clear audit trail, timestamped evidence, and automatic escalation of defects.\n\nOperators using digital walkaround checks are better positioned for DVSA audits, Earned Recognition applications, and Traffic Commissioner reviews. A digital system also reduces the risk of missed checks, which is one of the most common compliance failures found during DVSA inspections.",
    solutionTitle: "How TitanFleet's Walkaround Check App Works",
    solutionBody: "TitanFleet provides a mobile-first walkaround check app that drivers access on their smartphone — no app download required. Drivers select their vehicle, work through a structured DVSA-aligned checklist, attach photos of any issues, and submit the completed inspection in under 3 minutes.\n\nCompleted checks are immediately visible to transport managers on the dashboard. Any defects flagged during the check are automatically created as defect reports and triaged by AI using the DVSA Guide to Roadworthiness.",
    features: [
      { title: "DVSA-Aligned Checklists", desc: "Inspection checklists follow DVSA walkaround check guidance. Covers all vehicle areas including tyres, lights, mirrors, load security, and fluid levels.", icon: "clipboard" },
      { title: "Photo Evidence", desc: "Drivers attach photos to any check item. Photos are timestamped and GPS-tagged, providing clear evidence for audits.", icon: "file" },
      { title: "Instant Defect Escalation", desc: "Any defect found during a walkaround check is automatically created as a defect report and sent to the transport manager in real-time.", icon: "alert" },
      { title: "PDF Inspection Reports", desc: "Every completed inspection generates a downloadable PDF report, ready for DVSA audits or internal compliance reviews.", icon: "file" },
      { title: "Inspection History", desc: "Full inspection history for every vehicle, searchable by date, driver, vehicle, and result. No more lost paperwork.", icon: "clock" },
      { title: "End-of-Shift Checks", desc: "Optional end-of-shift inspections for operators who require drivers to check vehicles at the end of their working day.", icon: "shield" },
    ],
    whoTitle: "Which Fleets Need a Digital Walkaround Check App?",
    whoBody: "Any fleet operating commercial vehicles in the UK should be using a digital walkaround check system. This includes HGV operators, van fleets, coach and bus operators, construction vehicle fleets, and any business holding an O-licence.\n\nFleets preparing for DVSA Earned Recognition or those who have received compliance warnings from the Traffic Commissioner will benefit particularly from the structured audit trail TitanFleet provides.",
    comparisonTitle: "TitanFleet vs Paper Walkaround Checks",
    comparisonBody: "Switching from paper to digital walkaround checks eliminates the most common compliance gaps:",
    comparisonPoints: [
      "Paper checks get lost — digital checks are stored permanently and searchable",
      "Paper defects are not escalated — TitanFleet creates instant defect reports with AI triage",
      "Paper checks have no photo evidence — TitanFleet captures timestamped, GPS-tagged photos",
      "Paper audits take hours — TitanFleet generates instant PDF reports for DVSA",
      "Paper checks cannot be monitored — managers see completion rates in real-time",
      "No app download needed — works on any smartphone browser",
    ],
    faqs: [
      { q: "Are digital walkaround checks DVSA compliant?", a: "Yes. The DVSA accepts digital walkaround checks provided they cover the required inspection areas and create a clear audit trail. TitanFleet's checklists are aligned with DVSA guidance and produce timestamped, evidenced records." },
      { q: "How long does a digital walkaround check take?", a: "Most drivers complete a TitanFleet walkaround check in 2-3 minutes. The structured checklist format is faster than filling in a paper form, and the digital submission eliminates the need to hand in sheets to the office." },
      { q: "Do drivers need to download an app?", a: "No. TitanFleet works as a web app that drivers access through their phone's browser. They log in with a company code and PIN. This means it works on any smartphone without IT involvement." },
      { q: "What happens when a driver reports a defect during a check?", a: "The defect is automatically created in TitanFleet's defect management system. AI triages the severity based on the DVSA Guide to Roadworthiness. The transport manager receives an instant notification and can assign the defect for repair." },
      { q: "Can I see which drivers have not completed their checks?", a: "Yes. The compliance dashboard shows missed inspections and highlights vehicles that are overdue for a walkaround check. You can also set up automated reminders." },
    ],
    ctaTitle: "Replace Paper Checks Today",
    ctaBody: "Start your free trial and digitise your walkaround checks in under 10 minutes. No setup fees, no contracts.",
  },
  {
    slug: "fleet-compliance-software",
    keyword: "Fleet Compliance Software",
    metaTitle: "Fleet Compliance Software UK | DVSA Ready | TitanFleet",
    metaDescription: "Fleet compliance software for UK transport operators. DVSA walkaround checks, MOT tracking, defect management, Earned Recognition KPIs. No setup fees. Start free.",
    heroTitle: "Fleet Compliance Software That Keeps You DVSA-Ready",
    heroSubtitle: "TitanFleet helps UK transport managers maintain continuous compliance with DVSA standards. Track inspections, MOTs, defects, driver hours, and Earned Recognition KPIs from one dashboard.",
    problemTitle: "Compliance Is Getting Harder to Manage",
    problemBody: "UK fleet compliance requirements are increasing. The DVSA is conducting more targeted inspections, the Traffic Commissioner is issuing more public inquiries, and the Earned Recognition scheme is raising the bar for what good compliance looks like.\n\nMost transport managers are managing compliance across multiple disconnected systems — spreadsheets for MOTs, paper for walkaround checks, email for defect tracking. This creates gaps that only become visible when DVSA arrive for an audit.",
    whyMattersTitle: "The Cost of Non-Compliance",
    whyMattersBody: "A single DVSA prohibition can cost £1,500 or more in fines and downtime. Repeated failures lead to Traffic Commissioner hearings where your O-licence is at risk. Beyond the financial cost, compliance failures damage your reputation with customers and make it harder to win contracts.\n\nThe operators who thrive are those who can demonstrate compliance proactively — not those who scramble to produce evidence when asked.",
    solutionTitle: "How TitanFleet Keeps You Compliant",
    solutionBody: "TitanFleet is built around a compliance-first approach. Every feature — from walkaround checks to defect management to fleet tracking — feeds into a central compliance dashboard that gives you a real-time view of your fleet's compliance status.\n\nYou can see which vehicles have overdue MOTs, which drivers have missed inspections, which defects are unresolved, and how your fleet measures against DVSA Earned Recognition benchmarks — all without leaving the dashboard.",
    features: [
      { title: "Compliance Dashboard", desc: "Real-time fleet compliance score based on MOT status, inspection completion, defect resolution, and CPC compliance across your fleet.", icon: "gauge" },
      { title: "MOT & Tax Tracking", desc: "Live DVSA MOT data for every vehicle. Automated alerts for upcoming expiries. Never be caught with an expired MOT.", icon: "shield" },
      { title: "DVSA Walkaround Checks", desc: "Digital inspections aligned with DVSA guidance. Photo evidence, instant defect escalation, and full audit trail.", icon: "clipboard" },
      { title: "Earned Recognition KPIs", desc: "Track the specific KPIs required for the DVSA Earned Recognition scheme, including MOT pass rate, inspection rates, and defect resolution times.", icon: "target" },
      { title: "Defect Resolution Tracking", desc: "Every defect has a clear workflow from reported to resolved. AI triage categorises severity. Managers can track resolution timelines.", icon: "wrench" },
      { title: "Audit-Ready Reports", desc: "Generate compliance reports instantly. PDF inspection records, defect histories, and fleet status reports ready for DVSA audits.", icon: "file" },
    ],
    whoTitle: "Who Needs Fleet Compliance Software?",
    whoBody: "Any UK operator holding a standard or restricted O-licence needs to demonstrate a robust compliance regime. TitanFleet is designed for operators running 5 to 500+ vehicles who want to move beyond paper-based compliance.\n\nIt is particularly valuable for operators who have received compliance warnings, those preparing for DVSA Earned Recognition, and businesses tendering for contracts that require evidence of compliance systems.",
    comparisonTitle: "TitanFleet vs Spreadsheet-Based Compliance",
    comparisonBody: "Spreadsheets and paper-based compliance tracking create risks that a purpose-built system eliminates:",
    comparisonPoints: [
      "Spreadsheets do not alert you to overdue MOTs — TitanFleet sends automated notifications",
      "Paper checks cannot prove when an inspection was completed — TitanFleet timestamps everything",
      "Manual defect tracking misses escalation — TitanFleet uses AI to categorise defect severity",
      "Spreadsheets cannot calculate Earned Recognition KPIs — TitanFleet calculates them automatically",
      "Generating audit reports from spreadsheets takes hours — TitanFleet produces instant PDFs",
      "Built specifically for UK DVSA compliance, not adapted from a generic global platform",
    ],
    faqs: [
      { q: "What is fleet compliance software?", a: "Fleet compliance software is a digital platform that helps transport operators track and manage their legal obligations. This includes vehicle inspections, MOT status, defect management, driver hours, and regulatory reporting. TitanFleet is designed specifically for UK DVSA compliance." },
      { q: "Does TitanFleet support DVSA Earned Recognition?", a: "Yes. TitanFleet tracks the key performance indicators required for the DVSA Earned Recognition scheme, including MOT first-time pass rates, inspection completion percentages, defect resolution times, and CPC compliance rates." },
      { q: "How quickly can I set up TitanFleet?", a: "Most operators are fully set up within a day. You can import your vehicle fleet via bulk upload, invite drivers by sharing a link, and start capturing walkaround checks immediately. No IT infrastructure is required." },
      { q: "Can I use TitanFleet to prepare for a DVSA audit?", a: "Yes. TitanFleet generates instant compliance reports, inspection histories, and defect resolution records in PDF format. These are exactly the documents DVSA examiners request during an audit." },
    ],
    ctaTitle: "Get Compliant Today",
    ctaBody: "Start your free trial and see your fleet's compliance status in real-time. No setup fees, no contracts.",
  },
  {
    slug: "driver-defect-reporting-app",
    keyword: "Driver Defect Reporting App",
    metaTitle: "Driver Defect Reporting App | Instant Alerts & AI Triage | TitanFleet",
    metaDescription: "Digital defect reporting app for UK fleet drivers. Photo evidence, AI severity triage using DVSA standards, instant manager alerts. Replace paper defect sheets.",
    heroTitle: "Driver Defect Reporting App with AI Triage",
    heroSubtitle: "TitanFleet lets drivers report vehicle defects instantly from their phone. AI categorises severity using the DVSA Guide to Roadworthiness. Transport managers receive real-time alerts and track repairs through a Kanban workflow.",
    problemTitle: "Paper Defect Reports Create Dangerous Gaps",
    problemBody: "When a driver spots a defect — a cracked mirror, a worn tyre, a leaking fluid — the standard process is to write it on a paper form and leave it in the cab or hand it to the office at the end of the shift. This delay can be hours or even days.\n\nDuring that time, the vehicle may continue operating with an unresolved safety defect. The transport manager has no visibility. If DVSA stop the vehicle, the operator faces a prohibition notice and the driver faces enforcement action.",
    whyMattersTitle: "Why Fast Defect Reporting Saves Money and Licences",
    whyMattersBody: "The DVSA expects operators to have a system where drivers can report defects and those defects are acted upon promptly. A delayed or missing defect report is one of the clearest indicators of a poor maintenance system — exactly what Traffic Commissioners look for during public inquiries.\n\nBeyond compliance, unreported defects lead to more expensive repairs. A minor brake issue caught early costs a fraction of what it costs after it causes a roadside breakdown or, worse, an accident.",
    solutionTitle: "How TitanFleet Handles Defect Reporting",
    solutionBody: "TitanFleet provides a dedicated defect reporting function that drivers access on their phone. They select the vehicle, describe the defect, attach photos, and submit the report in under a minute. The report is instantly visible to the transport manager.\n\nTitanFleet's AI then analyses the defect description and photos against the DVSA Guide to Roadworthiness, automatically categorising the severity. Critical defects trigger immediate alerts. All defects flow into a Kanban-style workflow where managers track progress from 'Open' through 'In Progress' to 'Resolved'.",
    features: [
      { title: "Instant Defect Submission", desc: "Drivers report defects from their phone in under 60 seconds. No paper forms, no waiting until end of shift.", icon: "alert" },
      { title: "Photo Evidence", desc: "Attach photos to every defect report. Photos are timestamped and stored permanently for audit purposes.", icon: "file" },
      { title: "AI Severity Triage", desc: "AI analyses defect descriptions against the DVSA Guide to Roadworthiness and automatically categorises severity as critical, major, or minor.", icon: "zap" },
      { title: "Kanban Defect Workflow", desc: "Track every defect from reported to resolved with a visual Kanban board. Open, In Progress, and Resolved columns give instant visibility.", icon: "chart" },
      { title: "Real-Time Manager Alerts", desc: "Transport managers receive instant notifications for new defects. Critical defects trigger priority alerts.", icon: "target" },
      { title: "Defect History per Vehicle", desc: "Full defect history for every vehicle, showing patterns and recurring issues. Useful for maintenance planning and fleet decisions.", icon: "clock" },
    ],
    whoTitle: "Which Fleets Need a Digital Defect Reporting System?",
    whoBody: "Any fleet operating commercial vehicles needs a reliable defect reporting process. TitanFleet is designed for haulage operators, logistics companies, van fleets, and any O-licence holder who needs to demonstrate that defects are reported and resolved promptly.\n\nOperators with multiple depots or remote drivers benefit particularly, as paper-based systems break down when drivers are not physically returning to a central office.",
    comparisonTitle: "TitanFleet vs Paper Defect Sheets",
    comparisonBody: "Digital defect reporting solves the fundamental problems with paper-based systems:",
    comparisonPoints: [
      "Paper defect sheets are delayed — TitanFleet reports are instant",
      "Paper cannot triage severity — TitanFleet AI categorises using DVSA standards",
      "Paper reports have no photos — TitanFleet captures timestamped photo evidence",
      "Paper offers no tracking — TitanFleet provides a Kanban workflow from report to resolution",
      "Managers cannot monitor paper in real-time — TitanFleet sends instant alerts",
      "Paper defect histories are hard to compile — TitanFleet maintains a searchable database per vehicle",
    ],
    faqs: [
      { q: "How do drivers report vehicle defects digitally?", a: "Drivers open TitanFleet on their phone, select their vehicle, describe the issue, attach a photo, and submit. The entire process takes less than 60 seconds. No app download is required — it works through the phone's browser." },
      { q: "What does AI triage mean for defect reports?", a: "TitanFleet's AI analyses each defect report against the DVSA Guide to Roadworthiness. It automatically categorises the defect severity — for example, a worn tyre is flagged as a safety-critical issue requiring immediate action, while a minor cosmetic issue is categorised accordingly." },
      { q: "Can I track defect resolution times?", a: "Yes. Every defect has a clear timeline from when it was reported to when it was resolved. This data feeds into your compliance dashboard and Earned Recognition KPIs." },
      { q: "Does TitanFleet work for multi-depot fleets?", a: "Yes. TitanFleet is cloud-based, so drivers at any location can report defects instantly. Transport managers see all defects across all depots in a single dashboard." },
    ],
    ctaTitle: "Digitise Your Defect Reporting",
    ctaBody: "Start your free trial. Drivers can report defects in under 60 seconds and your team gets instant visibility.",
  },
  {
    slug: "fleet-maintenance-software",
    keyword: "Fleet Maintenance Software",
    metaTitle: "Fleet Maintenance Software UK | MOT Tracking & Defect Management | TitanFleet",
    metaDescription: "Fleet maintenance software for UK transport operators. MOT tracking, service schedules, defect management, predictive analytics. DVSA compliant. No setup fees.",
    heroTitle: "Fleet Maintenance Software for UK Transport Operators",
    heroSubtitle: "TitanFleet helps transport managers stay on top of fleet maintenance with MOT tracking, service interval monitoring, defect management, and predictive analytics — all in one platform.",
    problemTitle: "Reactive Maintenance Is Costing You Money",
    problemBody: "Most fleet operators are stuck in a reactive maintenance cycle. Vehicles break down, get prohibited at the roadside, or fail MOTs because issues were not caught early enough. Paper-based maintenance records make it almost impossible to spot patterns or plan ahead.\n\nThe result is higher repair costs, more vehicle downtime, unhappy drivers, and compliance risk. Every unplanned breakdown costs an average of £750 in direct costs — plus the indirect cost of missed deliveries and customer complaints.",
    whyMattersTitle: "Why Proactive Maintenance Matters",
    whyMattersBody: "The DVSA expects operators to have a planned preventative maintenance system. This is a condition of your O-licence. If you cannot demonstrate that vehicles are maintained to schedule, with defects resolved promptly, you are at risk during DVSA audits.\n\nProactive maintenance also saves money. Catching a brake issue during a walkaround check costs a fraction of what it costs after a roadside breakdown. Operators who move from reactive to proactive maintenance typically see a 15-25% reduction in total maintenance spend.",
    solutionTitle: "How TitanFleet Manages Fleet Maintenance",
    solutionBody: "TitanFleet combines real-time vehicle data with maintenance tracking to give transport managers complete visibility. MOT and tax status is pulled directly from DVSA. Walkaround checks and defect reports feed into maintenance planning. Predictive analytics identify vehicles at risk before they fail.\n\nThe platform does not replace your workshop or your mechanics — it gives you the data and tools to manage maintenance proactively rather than reactively.",
    features: [
      { title: "MOT & Tax Status Tracking", desc: "Live DVSA data for every vehicle. Automated alerts for upcoming expiries. Dashboard view of fleet-wide MOT status.", icon: "shield" },
      { title: "Defect-to-Repair Workflow", desc: "Defects reported by drivers flow directly into the maintenance workflow. Track resolution from report to completion.", icon: "wrench" },
      { title: "Predictive Analytics", desc: "AI-powered fleet health scoring identifies vehicles at risk based on defect frequency, inspection patterns, and maintenance history.", icon: "chart" },
      { title: "Vehicle Service History", desc: "Complete maintenance history for every vehicle, including inspections, defects, MOTs, and services. Exportable for audits.", icon: "file" },
      { title: "Fleet Health Dashboard", desc: "Real-time fleet health score broken down by compliance, maintenance, and inspection metrics. Identify problem areas instantly.", icon: "gauge" },
      { title: "Cost Projections", desc: "30-day maintenance cost projections based on current fleet health. Identify potential savings and budget for upcoming work.", icon: "pound" },
    ],
    whoTitle: "Who Benefits from Fleet Maintenance Software?",
    whoBody: "Any operator running commercial vehicles in the UK benefits from a systematic approach to maintenance. TitanFleet is designed for fleets of 5 to 500+ vehicles across haulage, logistics, courier, construction, and waste management sectors.\n\nOperators who are currently managing maintenance with spreadsheets or paper records will see the biggest improvement in efficiency and compliance.",
    comparisonTitle: "TitanFleet vs Spreadsheet Maintenance Tracking",
    comparisonBody: "Purpose-built fleet maintenance software provides capabilities that spreadsheets simply cannot:",
    comparisonPoints: [
      "Spreadsheets do not pull live MOT data — TitanFleet connects directly to DVSA",
      "Spreadsheets cannot predict failures — TitanFleet uses AI for fleet health scoring",
      "Manual tracking misses defect patterns — TitanFleet analyses defect frequency per vehicle",
      "Spreadsheets provide no automated alerts — TitanFleet notifies you before deadlines",
      "Paper maintenance records are hard to audit — TitanFleet generates instant reports",
      "Purpose-built for UK transport, not adapted from a generic maintenance tool",
    ],
    faqs: [
      { q: "What software helps transport managers track inspections?", a: "TitanFleet provides a complete inspection tracking system. Transport managers can see all walkaround checks, their results, and any defects found — searchable by vehicle, driver, and date. Missed inspections are flagged on the compliance dashboard." },
      { q: "Does TitanFleet replace our workshop management system?", a: "No. TitanFleet is designed to complement your existing workshop processes. It provides the data — defect reports, inspection results, MOT status — that helps you plan and prioritise maintenance work." },
      { q: "Can TitanFleet predict vehicle failures?", a: "TitanFleet uses predictive analytics to identify vehicles at higher risk of issues based on defect frequency, inspection patterns, and maintenance history. This is not a replacement for physical inspections, but it helps you prioritise attention." },
      { q: "How does MOT tracking work?", a: "TitanFleet pulls live MOT data directly from the DVSA database. When you add a vehicle by registration, the system automatically retrieves MOT expiry dates, make, model, and VIN. Alerts are sent as expiry dates approach." },
    ],
    ctaTitle: "Take Control of Fleet Maintenance",
    ctaBody: "Start your free trial. See your fleet's maintenance status in minutes, not hours. No setup fees, no contracts.",
  },
  {
    slug: "fleetcheck-alternative",
    keyword: "FleetCheck Alternative",
    metaTitle: "FleetCheck Alternative | TitanFleet — UK Fleet Compliance Software",
    metaDescription: "Looking for a FleetCheck alternative? TitanFleet offers DVSA walkaround checks, AI defect triage, GPS tracking & compliance dashboard. No setup fees. Built for UK operators.",
    heroTitle: "Looking for a FleetCheck Alternative?",
    heroSubtitle: "TitanFleet offers everything you need for UK fleet compliance — DVSA walkaround checks, defect management, GPS tracking, and a real-time compliance dashboard — at a straightforward price with no setup fees.",
    problemTitle: "Why Operators Look for Alternatives",
    problemBody: "Fleet compliance platforms vary significantly in how they are priced, what features are included, and how well they fit UK-specific requirements. Some operators find that their current platform is over-complicated for their needs, charges for features they do not use, or lacks capabilities they require.\n\nCommon reasons operators evaluate alternatives include pricing complexity, poor mobile experience for drivers, limited DVSA-specific features, and slow customer support.",
    whyMattersTitle: "What to Look for in Fleet Compliance Software",
    whyMattersBody: "When evaluating fleet compliance software, UK operators should prioritise: DVSA-aligned walkaround checks, live MOT tracking, defect management with proper escalation, GPS tracking, and a compliance dashboard that gives a clear picture of fleet status.\n\nEqually important is the driver experience. If your drivers find the app difficult to use, adoption will be poor and the data will be incomplete — which defeats the purpose of the system.",
    solutionTitle: "Why Operators Choose TitanFleet",
    solutionBody: "TitanFleet is built specifically for UK fleet operators by someone who understands the industry — a Class 1 HGV driver. The platform focuses on practical compliance tools that drivers actually use, rather than complex features that look good in demos but go unused in practice.\n\nThe pricing is straightforward: £59/month per vehicle, no setup fees, no contracts. Every feature is included — there are no paid tiers or add-ons for essential compliance functionality.",
    features: [
      { title: "DVSA Walkaround Checks", desc: "Digital inspections aligned with DVSA guidance. Photo evidence, instant defect escalation, and full audit trail.", icon: "clipboard" },
      { title: "AI Defect Triage", desc: "Defects categorised automatically using the DVSA Guide to Roadworthiness. Not generic categories — actual UK compliance standards.", icon: "zap" },
      { title: "Live GPS Tracking", desc: "Real-time driver locations, geofencing, stagnation alerts, and shift trail maps. Know where every vehicle is.", icon: "map" },
      { title: "Compliance Dashboard", desc: "Fleet health score, MOT tracking, missed inspection alerts, and Earned Recognition KPIs in one view.", icon: "gauge" },
      { title: "Driver Timesheets", desc: "Automated clock-in/out, individual pay rates, overtime, and CSV export. Not available in many compliance-only platforms.", icon: "clock" },
      { title: "No Setup Fees", desc: "£59/month per vehicle. No setup fees, no contracts, cancel anytime. All features included from day one.", icon: "pound" },
    ],
    whoTitle: "Who Switches to TitanFleet?",
    whoBody: "Operators who switch to TitanFleet typically run 10 to 200 vehicles and want a simpler, more focused compliance platform. They value practical features over feature lists, clear pricing over sales calls, and a mobile experience their drivers will actually use.\n\nTitanFleet is not trying to be everything to everyone. It focuses on doing UK fleet compliance well.",
    comparisonTitle: "How TitanFleet Compares",
    comparisonBody: "Here is how TitanFleet differs from other fleet compliance platforms:",
    comparisonPoints: [
      "All features included at one price — no paid tiers or add-ons",
      "AI defect triage using DVSA Guide to Roadworthiness",
      "Built-in GPS tracking and driver timesheets — not separate products",
      "No setup fees and no minimum contract length",
      "Driver app works on any smartphone browser — no app store download",
      "Built by a Class 1 HGV driver who understands UK transport operations",
    ],
    faqs: [
      { q: "How does TitanFleet pricing compare?", a: "TitanFleet charges £59/month per vehicle with all features included. There are no setup fees, no contracts, and no paid add-ons. This includes walkaround checks, defect management, GPS tracking, timesheets, and compliance dashboard." },
      { q: "Can I migrate my data from another platform?", a: "Yes. TitanFleet supports bulk vehicle upload and can import your fleet data. Our team can assist with the migration process to ensure a smooth transition." },
      { q: "Is there a minimum fleet size?", a: "TitanFleet works for fleets as small as 5 vehicles. There is no minimum commitment — you can start with a few vehicles and add more as you grow." },
      { q: "What if my drivers are not tech-savvy?", a: "TitanFleet's driver app is deliberately simple. Drivers log in with a company code and PIN, and the walkaround check process is a guided checklist. Most drivers are comfortable with it after one use." },
    ],
    ctaTitle: "Try TitanFleet Free",
    ctaBody: "Start your free trial today. No sales calls, no setup fees. See if TitanFleet is the right fit for your fleet.",
  },
  {
    slug: "webfleet-alternative",
    keyword: "Webfleet Alternative",
    metaTitle: "Webfleet Alternative | TitanFleet — UK Fleet Management Software",
    metaDescription: "Looking for a Webfleet alternative? TitanFleet offers GPS tracking, DVSA compliance, defect management & driver timesheets. No hardware required. £59/mo per vehicle.",
    heroTitle: "Looking for a Webfleet Alternative?",
    heroSubtitle: "TitanFleet provides GPS tracking, DVSA compliance, defect management, and driver timesheets in one platform — without requiring dedicated tracking hardware or long-term contracts.",
    problemTitle: "When Telematics Is Not Enough",
    problemBody: "Telematics platforms like Webfleet provide excellent vehicle tracking and driver behaviour data. However, many UK transport operators find that telematics alone does not solve their compliance challenges. Walkaround checks, defect management, MOT tracking, and driver timesheets often require separate tools or manual processes.\n\nThe result is a fragmented system where tracking data sits in one platform and compliance data sits somewhere else — or nowhere at all.",
    whyMattersTitle: "Why Compliance and Tracking Need to Work Together",
    whyMattersBody: "DVSA compliance is not just about knowing where your vehicles are. It is about proving that vehicles are inspected, defects are resolved, MOTs are current, and drivers are working within legal hours.\n\nA platform that combines GPS tracking with compliance tools gives transport managers a complete picture. When a driver clocks in, their location is tracked. When they complete a walkaround check, the inspection is linked to their shift. When they report a defect, it is immediately escalated.",
    solutionTitle: "Why Operators Choose TitanFleet",
    solutionBody: "TitanFleet combines fleet tracking with compliance management in a single platform. GPS tracking uses the driver's smartphone — no dedicated hardware to install or maintain. Walkaround checks, defect reports, and timesheets are all integrated.\n\nThis approach means fewer systems to manage, lower costs, and a more complete view of your fleet operations.",
    features: [
      { title: "GPS Tracking via Smartphone", desc: "Real-time driver tracking using their smartphone. No dedicated hardware required. Includes geofencing, stagnation alerts, and shift trail maps.", icon: "map" },
      { title: "DVSA Walkaround Checks", desc: "Digital inspections that drivers complete on the same device. Fully integrated with tracking and compliance.", icon: "clipboard" },
      { title: "Defect Management", desc: "Instant defect reporting with AI triage. Defects flow into a Kanban workflow for resolution tracking.", icon: "alert" },
      { title: "Driver Timesheets", desc: "Automated clock-in/out with GPS location. Individual pay rates, overtime, and CSV export for payroll.", icon: "clock" },
      { title: "Compliance Dashboard", desc: "MOT tracking, inspection completion rates, defect resolution times, and Earned Recognition KPIs.", icon: "gauge" },
      { title: "No Hardware Required", desc: "Everything runs on the driver's smartphone. No hardware to purchase, install, or maintain. No vehicle downtime for installation.", icon: "zap" },
    ],
    whoTitle: "Who Is TitanFleet For?",
    whoBody: "TitanFleet suits operators who want tracking and compliance in one platform without the cost and complexity of dedicated telematics hardware. It is ideal for fleets of 5 to 200 vehicles, particularly haulage, logistics, and courier operators.\n\nOperators currently using telematics for tracking but managing compliance separately will see the biggest benefit from consolidating onto TitanFleet.",
    comparisonTitle: "TitanFleet vs Hardware-Based Telematics",
    comparisonBody: "TitanFleet takes a different approach to fleet management:",
    comparisonPoints: [
      "No hardware to purchase or install — tracking uses the driver's smartphone",
      "Compliance tools built in — not a separate product or paid add-on",
      "DVSA walkaround checks integrated with tracking, not a bolt-on",
      "No long-term hardware contracts — cancel anytime",
      "Lower total cost — no hardware fees, installation costs, or maintenance charges",
      "All features included at £59/month per vehicle",
    ],
    faqs: [
      { q: "Is smartphone GPS tracking accurate enough?", a: "Modern smartphones provide GPS accuracy of 3-5 metres in open areas. For fleet management purposes — knowing which depot, site, or road a driver is on — this is more than adequate. TitanFleet updates locations every 30 seconds." },
      { q: "What happens if a driver's phone battery dies?", a: "TitanFleet records the last known location and flags the driver as having lost GPS. Transport managers can see when tracking was last active. Drivers are encouraged to keep their phones charged, but the system handles interruptions gracefully." },
      { q: "Can TitanFleet replace our telematics system?", a: "For many operators, yes. If your primary needs are driver location tracking, compliance management, and timesheets, TitanFleet covers all of these. If you require vehicle diagnostics data (OBD/CAN bus), you may still need dedicated hardware." },
      { q: "Is there a long-term contract?", a: "No. TitanFleet is month-to-month at £59 per vehicle. There are no setup fees, no hardware contracts, and no minimum term. You can cancel at any time." },
    ],
    ctaTitle: "Try a Different Approach",
    ctaBody: "Start your free trial. GPS tracking, compliance, and timesheets in one platform — no hardware required.",
  },
  {
    slug: "fleet-software-haulage-companies",
    keyword: "Fleet Software for Haulage Companies",
    metaTitle: "Fleet Software for Haulage Companies | DVSA Compliance | TitanFleet",
    metaDescription: "Fleet management software built for UK haulage companies. DVSA walkaround checks, MOT tracking, defect management, GPS tracking, driver timesheets. No setup fees.",
    heroTitle: "Fleet Software Built for UK Haulage Companies",
    heroSubtitle: "TitanFleet is designed for haulage operators who need practical tools for DVSA compliance, vehicle management, and driver operations — not a bloated enterprise platform.",
    problemTitle: "Haulage Operators Face Unique Challenges",
    problemBody: "Running a haulage fleet means managing DVSA compliance, O-licence conditions, driver hours, MOT schedules, and vehicle maintenance — all while keeping vehicles on the road and customers satisfied.\n\nMost fleet software is designed for car fleets or global logistics companies. It does not address the specific needs of UK haulage operators: DVSA walkaround checks, Traffic Commissioner requirements, Earned Recognition preparation, and the practical reality of drivers who spend most of their time in a cab, not at a desk.",
    whyMattersTitle: "Why Haulage Companies Need Purpose-Built Software",
    whyMattersBody: "Generic fleet management tools require haulage operators to adapt their processes to fit the software. This leads to poor adoption, incomplete data, and compliance gaps.\n\nHaulage operators need software that understands the DVSA inspection process, supports O-licence compliance evidence, and provides a driver experience designed for someone completing a walkaround check in a lorry park — not filling in forms at a desk.",
    solutionTitle: "How TitanFleet Works for Haulage",
    solutionBody: "TitanFleet was built by a Class 1 HGV driver who spent years dealing with the exact problems haulage operators face. The platform is designed around the daily workflow of a haulage operation: drivers clock in, complete their walkaround check, report any defects, and get on the road — all from their phone.\n\nTransport managers get a dashboard that shows fleet compliance status, vehicle locations, defect workload, and driver timesheets in one place.",
    features: [
      { title: "HGV Walkaround Checks", desc: "Inspection checklists designed for HGV operations. Covers cab, engine, coupling, trailer, and load security checks.", icon: "clipboard" },
      { title: "O-Licence Compliance", desc: "Track the evidence required to demonstrate O-licence compliance, including inspection records, MOT status, and driver management.", icon: "shield" },
      { title: "Live Vehicle Tracking", desc: "Know where every vehicle is in real-time. Geofencing for depots and customer sites. Shift trail maps for route visibility.", icon: "map" },
      { title: "Driver Timesheets", desc: "Automated clock-in/out with GPS. Individual pay rates, overtime, night premiums, and bank holiday rates. CSV export for payroll.", icon: "clock" },
      { title: "Defect Management", desc: "Instant defect reporting from the cab. AI triage using DVSA standards. Kanban workflow for repair tracking.", icon: "wrench" },
      { title: "Fleet Health Analytics", desc: "Predictive fleet health scoring, maintenance cost projections, and compliance trend analysis across your haulage fleet.", icon: "chart" },
    ],
    whoTitle: "Which Haulage Companies Use TitanFleet?",
    whoBody: "TitanFleet is used by UK haulage companies running 5 to 200+ HGVs. This includes general haulage, pallet networks, bulk transport, container haulage, and specialist heavy transport.\n\nWhether you run rigid vehicles, artics, or a mix of both, TitanFleet adapts to your fleet structure.",
    comparisonTitle: "TitanFleet vs Enterprise Fleet Platforms",
    comparisonBody: "Enterprise fleet platforms are designed for large corporate fleets. TitanFleet is designed for working haulage operations:",
    comparisonPoints: [
      "Built by a Class 1 HGV driver — not by a software company that has never seen a loading bay",
      "DVSA-specific features — not US DOT or generic international compliance",
      "Driver app designed for use in a cab — large buttons, PIN login, 3-minute checks",
      "Straightforward pricing — no enterprise sales process or custom quotes",
      "All features included — walkaround checks, GPS, timesheets, and compliance",
      "No minimum fleet size or long-term contract",
    ],
    faqs: [
      { q: "Is TitanFleet suitable for small haulage companies?", a: "Yes. TitanFleet works for operators with as few as 5 vehicles. Many of our users are owner-operators or small haulage companies running 10-30 HGVs." },
      { q: "Does TitanFleet handle trailer inspections?", a: "Yes. Drivers can complete walkaround checks that include trailer-specific items such as coupling, kingpin, landing legs, and trailer body condition." },
      { q: "Can I track subcontractor vehicles?", a: "TitanFleet is designed for vehicles and drivers within your own operation. Subcontractor tracking would require those drivers to use TitanFleet as well." },
      { q: "How does the driver timesheet system work?", a: "Drivers clock in and out through the app. Their GPS location is recorded at clock-in. Individual pay rates, overtime thresholds, and premium rates are configurable per driver. Timesheets can be exported as CSV for payroll." },
    ],
    ctaTitle: "Built for Haulage. Try It Free.",
    ctaBody: "Start your free trial today. No setup fees, no contracts. See why haulage operators choose TitanFleet.",
  },
  {
    slug: "fleet-software-logistics-companies",
    keyword: "Fleet Software for Logistics Companies",
    metaTitle: "Fleet Software for Logistics Companies | TitanFleet",
    metaDescription: "Fleet management software for UK logistics companies. DVSA compliance, GPS tracking, driver timesheets, defect management, Proof of Delivery. No setup fees.",
    heroTitle: "Fleet Software Designed for UK Logistics Companies",
    heroSubtitle: "TitanFleet helps logistics operators manage compliance, track drivers, and streamline operations with DVSA walkaround checks, GPS tracking, defect management, and Proof of Delivery — all in one platform.",
    problemTitle: "Logistics Operations Need More Than Just Tracking",
    problemBody: "Logistics companies manage complex daily operations: multiple drivers, varying routes, tight delivery windows, and strict compliance requirements. Most fleet software focuses on either tracking or compliance — rarely both.\n\nThe result is that logistics managers juggle multiple systems, losing visibility and wasting time switching between platforms for tracking, inspections, timesheets, and delivery records.",
    whyMattersTitle: "Why Integrated Fleet Software Matters for Logistics",
    whyMattersBody: "Logistics customers increasingly require proof of compliance as a condition of contracts. If you cannot demonstrate that your vehicles are inspected, your drivers are qualified, and your fleet is properly maintained, you risk losing business.\n\nAn integrated platform that combines tracking, compliance, and delivery management gives logistics managers a single source of truth and makes it easier to meet customer audit requirements.",
    solutionTitle: "How TitanFleet Supports Logistics Operations",
    solutionBody: "TitanFleet brings together the tools logistics companies need in one platform. Drivers start their day by clocking in and completing a walkaround check. Their location is tracked throughout the shift. Deliveries are recorded with Proof of Delivery — including signatures, photos, and GPS coordinates. Defects are reported instantly and tracked to resolution.\n\nTransport managers see everything on a single dashboard: who is on shift, where they are, what has been delivered, and what needs attention.",
    features: [
      { title: "Proof of Delivery", desc: "Capture delivery evidence including customer signatures, photos, GPS location, and timestamps. Generate PDF delivery records.", icon: "file" },
      { title: "Live GPS Tracking", desc: "Real-time driver locations with geofencing and stagnation alerts. See all active drivers on a single map.", icon: "map" },
      { title: "DVSA Walkaround Checks", desc: "Digital vehicle inspections aligned with DVSA guidance. Photo evidence and instant defect escalation.", icon: "clipboard" },
      { title: "Driver Timesheets", desc: "Automated time tracking with GPS-verified clock-in/out. Individual pay rates and CSV export.", icon: "clock" },
      { title: "Defect Management", desc: "Instant defect reporting with AI triage. Kanban workflow for tracking repairs to resolution.", icon: "wrench" },
      { title: "Compliance Dashboard", desc: "MOT tracking, inspection rates, and defect resolution metrics. Meet customer audit requirements with instant reports.", icon: "gauge" },
    ],
    whoTitle: "Which Logistics Companies Use TitanFleet?",
    whoBody: "TitanFleet is used by UK logistics companies running mixed fleets of HGVs and vans. This includes distribution, warehousing and transport, third-party logistics providers, and parcel delivery operations.\n\nCompanies running 10 to 200 vehicles who need compliance, tracking, and delivery management in one platform see the best fit.",
    comparisonTitle: "TitanFleet vs Separate Tracking and Compliance Tools",
    comparisonBody: "Running tracking and compliance as separate systems creates problems that an integrated platform solves:",
    comparisonPoints: [
      "One login for tracking, compliance, timesheets, and deliveries",
      "Driver clock-in triggers tracking automatically — no separate setup",
      "Walkaround checks linked to shifts and vehicles — complete audit trail",
      "Proof of Delivery with GPS, signatures, and photos in the same platform",
      "Single compliance dashboard covering inspections, MOTs, and defects",
      "One monthly cost — no separate subscriptions for each function",
    ],
    faqs: [
      { q: "Does TitanFleet include Proof of Delivery?", a: "Yes. Drivers can capture delivery evidence including customer signatures, photos, GPS coordinates, and timestamps. Each delivery generates a PDF record that can be shared with customers." },
      { q: "Can I use TitanFleet for both HGVs and vans?", a: "Yes. TitanFleet supports mixed fleets. You can manage HGVs, vans, and other vehicle types within a single account with appropriate inspection checklists for each." },
      { q: "How does TitanFleet help with customer audits?", a: "TitanFleet generates instant compliance reports covering inspection histories, defect resolution, MOT status, and driver records. These reports are formatted for audit purposes and can be exported as PDFs." },
      { q: "Is there an API for integration with our WMS?", a: "TitanFleet is focused on providing a complete fleet management solution. API integrations for warehouse management systems and other logistics platforms are on our development roadmap." },
    ],
    ctaTitle: "Streamline Your Logistics Fleet",
    ctaBody: "Start your free trial. Compliance, tracking, and delivery management in one platform. No setup fees.",
  },
  {
    slug: "fleet-software-xero",
    keyword: "Fleet Software Xero Integration",
    metaTitle: "Fleet Software with Xero Integration | TitanFleet",
    metaDescription: "Fleet management software that works alongside Xero. Export driver timesheets and wage calculations as CSV for seamless Xero payroll import. DVSA compliance included.",
    heroTitle: "Fleet Software That Works with Xero",
    heroSubtitle: "TitanFleet's driver timesheet system produces CSV exports formatted for easy import into Xero payroll. Manage fleet compliance and driver wages in one platform, then send the numbers to Xero for processing.",
    problemTitle: "Fleet Data and Accounting Should Not Be Separate Worlds",
    problemBody: "Transport operators using Xero for accounting often find that fleet management data — particularly driver timesheets and wage calculations — exists in a completely separate system. Someone has to manually transfer hours, overtime, and pay rates from timesheets into Xero.\n\nThis manual process is slow, error-prone, and wastes time every pay period. It also makes it difficult to reconcile fleet costs with accounting records.",
    whyMattersTitle: "Why Payroll Accuracy Matters",
    whyMattersBody: "Payroll errors cost money and damage driver trust. When timesheets are transferred manually between systems, mistakes happen — missed overtime, incorrect night premiums, wrong bank holiday rates. These errors lead to pay disputes, correction payments, and wasted admin time.\n\nA fleet platform that calculates wages accurately and exports data in a format Xero can import eliminates these problems.",
    solutionTitle: "How TitanFleet Works with Xero",
    solutionBody: "TitanFleet includes a comprehensive driver timesheet system with individual pay rates, overtime thresholds, night premiums, weekend rates, and bank holiday rates. The system calculates wages automatically based on clock-in/out times and GPS data.\n\nWhen it is time to process payroll, transport managers export the calculated wages as a CSV file. This file is formatted for import into Xero, transferring accurate pay data without manual re-entry.",
    features: [
      { title: "Automated Timesheets", desc: "Drivers clock in/out through the app. Hours are calculated automatically including breaks, overtime, and premium rates.", icon: "clock" },
      { title: "Individual Pay Rates", desc: "Set hourly rates, overtime thresholds, night premiums, weekend rates, and bank holiday rates per driver.", icon: "pound" },
      { title: "CSV Export for Xero", desc: "Export calculated wages as CSV files formatted for import into Xero payroll. No manual data re-entry.", icon: "file" },
      { title: "GPS-Verified Time", desc: "Clock-in and clock-out times are GPS-verified, providing evidence for any timesheet queries.", icon: "map" },
      { title: "14-Hour Working Limit", desc: "Automatic warnings when drivers approach the 14-hour working time limit. Highlighted in timesheets for manager review.", icon: "alert" },
      { title: "Full Fleet Compliance", desc: "Timesheets are just one part of TitanFleet. You also get walkaround checks, defect management, GPS tracking, and MOT monitoring.", icon: "shield" },
    ],
    whoTitle: "Who Benefits from Fleet Software with Xero?",
    whoBody: "Transport operators who use Xero for accounting and need accurate driver wage data will benefit from TitanFleet's timesheet system. This is particularly useful for operators with complex pay structures involving overtime, night shifts, and varying rates.\n\nSmall to medium haulage companies and logistics firms that want to avoid the cost of enterprise payroll integration will find the CSV export approach practical and reliable.",
    comparisonTitle: "TitanFleet vs Manual Timesheet Processing",
    comparisonBody: "Automating the timesheet-to-payroll process eliminates common problems:",
    comparisonPoints: [
      "Automated hour calculation removes manual addition errors",
      "Individual pay rates are applied automatically — no lookup tables",
      "Overtime and premium rates calculated based on configured rules",
      "CSV export eliminates manual data entry into Xero",
      "GPS-verified times reduce timesheet disputes",
      "14-hour working limit warnings prevent compliance breaches",
    ],
    faqs: [
      { q: "Does TitanFleet integrate directly with Xero?", a: "TitanFleet provides CSV exports of calculated wage data that can be imported into Xero. This is not a live API integration — it is a practical export/import process that works reliably without complex setup." },
      { q: "Can I set different pay rates for different drivers?", a: "Yes. TitanFleet supports individual hourly rates, overtime thresholds, night premiums, weekend rates, and bank holiday rates. Each driver can have a completely different pay configuration." },
      { q: "How are bank holidays handled?", a: "TitanFleet is pre-loaded with UK bank holidays. Drivers who work on bank holidays automatically receive the configured premium rate. You can also add custom holidays if needed." },
      { q: "What if a driver disputes their hours?", a: "Every clock-in and clock-out is timestamped and GPS-tagged. Managers can review the exact time and location of each timesheet entry, providing clear evidence for any disputes." },
    ],
    ctaTitle: "Simplify Fleet Payroll",
    ctaBody: "Start your free trial. Accurate driver timesheets with CSV export for Xero. No setup fees, no contracts.",
  },
];

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden" data-testid={`faq-item-${faq.q.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
        data-testid="button-faq-toggle"
      >
        <span className="font-semibold text-[#0f172a] text-base pr-4">{faq.q}</span>
        {open ? <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-5 text-slate-600 leading-relaxed text-[15px]">
          {faq.a}
        </div>
      )}
    </div>
  );
}

function PageContent({ page }: { page: LandingPage }) {
  useEffect(() => {
    document.title = page.metaTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', page.metaDescription);
    else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = page.metaDescription;
      document.head.appendChild(meta);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', page.metaTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', page.metaDescription);
    window.scrollTo(0, 0);
    return () => { document.title = "Titan Fleet Management"; };
  }, [page]);

  return (
    <>
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6" data-testid="text-hero-title">
            {page.heroTitle}
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto" data-testid="text-hero-subtitle">
            {page.heroSubtitle}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <span className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold px-8 py-4 rounded-xl transition-colors cursor-pointer text-base" data-testid="button-hero-demo">
                Request a Demo <ArrowRight className="h-5 w-5" />
              </span>
            </Link>
            <Link href="/manager/login">
              <span className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors cursor-pointer text-base border border-white/20" data-testid="button-hero-login">
                Sign In
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-6" data-testid="text-problem-title">{page.problemTitle}</h2>
          {page.problemBody.split('\n\n').map((p, i) => (
            <p key={i} className="text-slate-600 leading-relaxed text-[16px] mb-4">{p}</p>
          ))}
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-6" data-testid="text-why-title">{page.whyMattersTitle}</h2>
          {page.whyMattersBody.split('\n\n').map((p, i) => (
            <p key={i} className="text-slate-600 leading-relaxed text-[16px] mb-4">{p}</p>
          ))}
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-6" data-testid="text-solution-title">{page.solutionTitle}</h2>
          {page.solutionBody.split('\n\n').map((p, i) => (
            <p key={i} className="text-slate-600 leading-relaxed text-[16px] mb-4">{p}</p>
          ))}
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-10 text-center" data-testid="text-features-title">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {page.features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow" data-testid={`card-feature-${i}`}>
                <div className="w-12 h-12 rounded-xl bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center mb-4">
                  {ICON_MAP[f.icon] || <Shield className="h-6 w-6" />}
                </div>
                <h3 className="font-bold text-[#0f172a] text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-[15px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-6" data-testid="text-who-title">{page.whoTitle}</h2>
          {page.whoBody.split('\n\n').map((p, i) => (
            <p key={i} className="text-slate-600 leading-relaxed text-[16px] mb-4">{p}</p>
          ))}
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-4" data-testid="text-comparison-title">{page.comparisonTitle}</h2>
          <p className="text-slate-600 leading-relaxed text-[16px] mb-6">{page.comparisonBody}</p>
          <div className="space-y-3">
            {page.comparisonPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#2563eb] shrink-0 mt-0.5" />
                <span className="text-slate-700 text-[15px]">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-8 text-center" data-testid="text-faq-title">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {page.faqs.map((faq, i) => (
              <FAQItem key={i} faq={faq} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" data-testid="text-cta-title">{page.ctaTitle}</h2>
          <p className="text-slate-300 text-lg mb-8">{page.ctaBody}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <span className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold px-8 py-4 rounded-xl transition-colors cursor-pointer text-base" data-testid="button-cta-demo">
                Request a Demo <ArrowRight className="h-5 w-5" />
              </span>
            </Link>
          </div>
          <p className="text-slate-400 text-sm mt-6">No setup fees. No contracts. Cancel anytime.</p>
        </div>
      </section>
    </>
  );
}

function LandingIndex() {
  useEffect(() => {
    document.title = "Solutions | Titan Fleet — UK Fleet Management Software";
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4 text-center" data-testid="text-solutions-title">Fleet Management Solutions</h1>
        <p className="text-slate-500 text-center mb-12 text-lg">Explore how TitanFleet helps UK transport operators.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {pages.map((p) => (
            <Link key={p.slug} href={`/solutions/${p.slug}`}>
              <div className="border border-slate-200 rounded-2xl p-6 hover:border-[#2563eb] hover:shadow-md transition-all cursor-pointer group" data-testid={`card-solution-${p.slug}`}>
                <h3 className="font-bold text-[#0f172a] text-lg mb-2 group-hover:text-[#2563eb] transition-colors">{p.keyword}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.metaDescription}</p>
                <span className="inline-flex items-center gap-1 text-[#2563eb] text-sm font-medium mt-4">
                  Read more <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function SEOLanding() {
  const [, params] = useRoute("/solutions/:slug");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const page = params?.slug ? pages.find(p => p.slug === params.slug) : null;

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <span className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
                <span className="text-xl font-bold text-[#0f172a]">Titan</span>
                <span className="text-xl text-slate-500">Fleet</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/"><span className="text-slate-600 hover:text-[#0f172a] transition-colors text-sm font-medium cursor-pointer" data-testid="link-nav-home">Home</span></Link>
              <Link href="/solutions"><span className="text-[#2563eb] font-medium text-sm cursor-pointer" data-testid="link-nav-solutions">Solutions</span></Link>
              <Link href="/blog"><span className="text-slate-600 hover:text-[#0f172a] transition-colors text-sm font-medium cursor-pointer" data-testid="link-nav-blog">Blog</span></Link>
              <Link href="/help"><span className="text-slate-600 hover:text-[#0f172a] transition-colors text-sm font-medium cursor-pointer" data-testid="link-nav-help">Help</span></Link>
            </nav>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors" data-testid="button-mobile-menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Home</span></Link>
              <Link href="/solutions" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-[#2563eb] bg-blue-50 font-medium text-sm cursor-pointer">Solutions</span></Link>
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Blog</span></Link>
              <Link href="/help" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Help</span></Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {page ? <PageContent page={page} /> : <LandingIndex />}
      </main>

      <footer className="bg-[#0f172a] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xl font-bold">Titan</span>
              <span className="text-xl text-slate-400 ml-1">Fleet</span>
              <p className="text-slate-400 text-sm mt-2">Built by a Class 1 Driver. Trusted by UK Operators.</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/titan.fleet" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" data-testid="link-social-instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/people/Titan-Fleet/61586509495375/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" data-testid="link-social-facebook">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Titan Fleet. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export { pages as seoPages };
