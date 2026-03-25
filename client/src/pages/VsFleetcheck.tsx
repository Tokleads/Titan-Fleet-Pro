import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Check,
  X,
  ChevronRight,
  Star,
  Truck,
  Shield,
  Clock,
  Phone,
  BookOpen,
  Menu,
  Instagram,
  Facebook,
  Calculator,
} from "lucide-react";

const META = {
  title: "TitanFleet vs FleetCheck (2026): Full Comparison for UK Operators | TitanFleet",
  description:
    "TitanFleet vs FleetCheck compared: Is £6/user FleetCheck really cheaper? We break down total cost of ownership, feature gaps (GPS, AI triage, timesheet, O-licence), and why growing fleets outgrow FleetCheck.",
};

const FAQ_ITEMS = [
  {
    q: "Is FleetCheck cheaper than TitanFleet for a small fleet?",
    a: "On the surface, FleetCheck's £6/user/month headline looks lower. But for a 10-vehicle fleet with 12 drivers and 2 managers (14 users), that's £84/month. Add a separate GPS system (~£10–15/vehicle = £100–150/month) and you're already past TitanFleet's £190/month — with only a fraction of the features. TitanFleet includes GPS, AI defect triage, timesheets, fuel intelligence, and O-licence management all-in.",
  },
  {
    q: "Does FleetCheck include GPS live tracking?",
    a: "No. FleetCheck is primarily a vehicle inspection and compliance management tool. It does not include real-time GPS tracking, live map views, geofencing, shift trail replay, or driver stop detection. UK operators who use FleetCheck typically need a separate telematics or GPS system.",
  },
  {
    q: "Can FleetCheck help with DVSA Earned Recognition?",
    a: "FleetCheck can support evidence gathering for Earned Recognition through its inspection records. However, it does not include an Earned Recognition dashboard with automated M1–M5 KPI tracking, the built-in EU/UK drivers' hours rules engine, or the Traffic Commissioner audit trail that TitanFleet provides natively.",
  },
  {
    q: "Does TitanFleet replace FleetCheck completely?",
    a: "Yes — for the vast majority of UK SME operators. TitanFleet covers all FleetCheck functionality (walkaround checks, defect management, vehicle compliance, documents) plus GPS tracking, AI defect triage, timesheets/payroll, fuel intelligence, working time compliance, O-licence management, and Driver CPC tracking. You eliminate the need for multiple tools.",
  },
  {
    q: "What happens when I grow past FleetCheck's limitations?",
    a: "Many operators find FleetCheck sufficient for pure inspection management up to 10–15 vehicles. As you grow, you need GPS, driver hours monitoring, fuel intelligence, and compliance automation. Adding those integrations piecemeal costs more and creates data silos. TitanFleet is designed to scale from 5 to 200+ vehicles with no tool-switching or data migration.",
  },
  {
    q: "Does TitanFleet offer a free trial?",
    a: "Yes. Founding beta partners get 30 days full platform access at £19/vehicle/month — no credit card required at sign-up, no setup fee, and no long-term commitment. The beta price is locked for life if you stay.",
  },
];

const SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://titanfleet.co.uk" },
        { "@type": "ListItem", position: 2, name: "Compare", item: "https://titanfleet.co.uk/vs" },
        { "@type": "ListItem", position: 3, name: "TitanFleet vs FleetCheck", item: "https://titanfleet.co.uk/vs/fleetcheck" },
      ],
    },
    {
      "@type": "Article",
      headline: "TitanFleet vs FleetCheck (2026): Which Fleet Software Is Right for Your UK Business?",
      description: META.description,
      datePublished: "2026-03-01",
      dateModified: "2026-03-25",
      author: { "@type": "Organization", name: "TitanFleet" },
      publisher: { "@type": "Organization", name: "TitanFleet" },
    },
  ],
};

function CheckIcon() {
  return <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />;
}
function CrossIcon() {
  return <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />;
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

export default function VsFleetcheck() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = META.title;
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = META.description;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", META.title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", META.description);

    let schema = document.getElementById("vs-fleetcheck-schema");
    if (!schema) {
      schema = document.createElement("script");
      schema.id = "vs-fleetcheck-schema";
      (schema as HTMLScriptElement).type = "application/ld+json";
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify(SCHEMA);

    window.scrollTo(0, 0);
    return () => {
      document.title = "Titan Fleet Management";
      document.getElementById("vs-fleetcheck-schema")?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white font-['Inter'] text-[#0f172a]">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <span className="flex items-center gap-2 cursor-pointer">
                <Truck className="w-5 h-5 text-[#2563eb]" />
                <span className="text-xl font-bold text-[#0f172a]">Titan</span>
                <span className="text-xl text-slate-500">Fleet</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/"><span className="text-slate-600 hover:text-[#0f172a] text-sm font-medium cursor-pointer transition-colors">Home</span></Link>
              <Link href="/roi"><span className="text-slate-600 hover:text-[#0f172a] text-sm font-medium cursor-pointer transition-colors">ROI Calculator</span></Link>
              <Link href="/guides"><span className="text-slate-600 hover:text-[#0f172a] text-sm font-medium cursor-pointer transition-colors">Guides</span></Link>
              <Link href="/manager/login">
                <span className="inline-flex items-center gap-1.5 bg-[#2563eb] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  Start Free Trial
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </nav>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Home</span></Link>
              <Link href="/roi" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">ROI Calculator</span></Link>
              <Link href="/manager/login" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm cursor-pointer text-center">Start Free Trial</span></Link>
            </div>
          </div>
        )}
      </header>

      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/"><span className="hover:text-slate-900 cursor-pointer transition-colors">Home</span></Link>
          <ChevronRight className="w-3 h-3" />
          <span>Compare</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-700 font-medium">TitanFleet vs FleetCheck</span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-14 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-5">
            <BookOpen className="h-4 w-4" />
            <span>Software Comparison</span>
            <span className="text-slate-500">•</span>
            <span>Updated March 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight mb-5">
            TitanFleet vs FleetCheck (2026):<br className="hidden sm:block" />
            Is £6/User Really Cheaper?
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl leading-relaxed mb-8">
            FleetCheck's per-user pricing looks attractive until you add the GPS system, timesheet tool, and compliance add-ons you'll still need. This comparison gives you the honest total cost of ownership.
          </p>

          {/* Quick verdict box */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 max-w-3xl">
            <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-3">Quick Verdict</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-blue-600/20 border border-blue-400/30 rounded-xl p-4">
                <p className="font-bold text-white mb-1">🇬🇧 Choose TitanFleet if...</p>
                <p className="text-sm text-slate-300">You want GPS, AI defect triage, fuel intelligence, timesheets, and DVSA compliance in one platform at a transparent per-vehicle price.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="font-bold text-white mb-1">📋 Choose FleetCheck if...</p>
                <p className="text-sm text-slate-300">You need only basic digital walkaround checks and defect records, already have GPS and payroll tools, and your fleet is under 10 vehicles.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-14">

          {/* At a glance */}
          <motion.section variants={fadeUp} id="at-a-glance">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-6">At a Glance: TitanFleet vs FleetCheck</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0f172a] text-white">
                    <th className="text-left px-5 py-4 rounded-tl-2xl font-semibold w-1/3">Feature</th>
                    <th className="text-left px-5 py-4 font-semibold"><span className="text-blue-400">🇬🇧 TitanFleet</span></th>
                    <th className="text-left px-5 py-4 rounded-tr-2xl font-semibold"><span className="text-slate-300">📋 FleetCheck</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["Primary focus", "All-in-one fleet ops: compliance, GPS, AI, payroll", "Vehicle inspections and compliance documents"],
                    ["Pricing model", "£19/vehicle/month — transparent, all-in", "£6/user/month — inspection module only"],
                    ["GPS live tracking", "✅ Built-in", "❌ Separate tool required"],
                    ["AI defect triage", "✅ DVSA-grounded severity scoring", "❌ Manual classification only"],
                    ["Timesheet / payroll", "✅ Included, per-driver wage rates", "❌ Not included"],
                    ["Fuel intelligence", "✅ Anomaly detection, cost-per-mile", "❌ Not included"],
                    ["Working time compliance engine", "✅ EU/UK rules, infringement alerts", "❌ Not included"],
                    ["O-licence management", "✅ Included", "❌ Not included"],
                    ["Driver CPC tracking", "✅ Included", "❌ Not included"],
                    ["DVSA Earned Recognition", "✅ M1–M5 KPI dashboard, audit trail", "Partial — manual evidence only"],
                    ["Offline inspection queue", "✅ Works without signal", "Limited"],
                    ["Mobile app for drivers", "✅ PIN-based, designed for HGV environment", "✅ App available"],
                    ["UK support", "✅ UK-based team", "✅ UK-based"],
                    ["Free trial", "✅ 30-day beta, no card", "✅ 30-day trial"],
                  ].map(([feature, titan, fc], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{feature}</td>
                      <td className="px-5 py-3.5 text-slate-700">{titan}</td>
                      <td className="px-5 py-3.5 text-slate-600">{fc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* Pricing deep-dive */}
          <motion.section variants={fadeUp} id="pricing">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-2">The Pricing Reality: Total Cost of Ownership</h2>
            <p className="text-slate-600 mb-6">FleetCheck's per-user model sounds cheaper — until you add the tools you'll still need to run a compliant UK fleet.</p>

            <div className="grid md:grid-cols-3 gap-5 mb-6">
              {[
                { vehicles: 5, drivers: 7, managers: 1 },
                { vehicles: 10, drivers: 12, managers: 2 },
                { vehicles: 25, drivers: 30, managers: 3 },
              ].map(({ vehicles, drivers, managers }) => {
                const fcUsers = drivers + managers;
                const fcBase = fcUsers * 6;
                const gps = vehicles * 12;
                const hours = vehicles * 5;
                const fcTotal = fcBase + gps + hours;
                const titanTotal = Math.max(99, vehicles * 19);
                const saving = fcTotal - titanTotal;
                return (
                  <div key={vehicles} className="rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-800 text-white px-4 py-3">
                      <p className="font-bold text-sm">{vehicles}-vehicle fleet</p>
                      <p className="text-xs text-slate-400">{drivers} drivers + {managers} manager{managers > 1 ? "s" : ""}</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">FleetCheck stack</p>
                        <div className="space-y-1 text-xs text-slate-600">
                          <div className="flex justify-between"><span>FleetCheck ({fcUsers} users × £6)</span><span className="font-medium">£{fcBase}/mo</span></div>
                          <div className="flex justify-between"><span>GPS telematics (separate)</span><span className="font-medium">~£{gps}/mo</span></div>
                          <div className="flex justify-between"><span>Working time / hours tool</span><span className="font-medium">~£{hours}/mo</span></div>
                          <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-800"><span>Total</span><span>£{fcTotal}/mo</span></div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">TitanFleet — all-in</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-600"><span>GPS + inspections + AI + payroll</span><span className="font-medium">£{titanTotal}/mo</span></div>
                          <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200 pt-1">
                            <span>You save</span>
                            <span>£{saving}/mo</span>
                          </div>
                          <p className="text-emerald-600 font-semibold text-xs">£{saving * 12}/year extra with FleetCheck stack</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>Note on GPS estimates:</strong> FleetCheck does not include GPS. Typical UK telematics costs £10–15/vehicle/month (Webfleet, Quartix, Teletrac Navman). Working time / drivers' hours tools (Tachomaster, Tachograph Analysis) add £4–7/vehicle/month. Our illustration uses £12 + £5 per vehicle. Your exact costs may vary — request quotes to compare.
            </div>
          </motion.section>

          {/* Feature matrix */}
          <motion.section variants={fadeUp} id="feature-matrix">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-8">Detailed Feature Comparison</h2>
            <div className="space-y-8">

              {/* Inspections & Defects */}
              <div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-3">1. Inspections &amp; Defect Management</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="text-left px-4 py-3 font-semibold">Capability</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-300">TitanFleet</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-300">FleetCheck</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ["DVSA-standard walkaround checks", true, true],
                        ["Custom inspection templates", true, true],
                        ["Photo evidence on defects", true, true],
                        ["Defect reporting by driver", true, true],
                        ["AI defect severity classification", true, false],
                        ["Auto-VOR on critical defect fail", true, false],
                        ["Kanban defect workflow (manager)", true, false],
                        ["DVSA Guide to Roadworthiness RAG", true, false],
                        ["Offline inspection queue (no signal)", true, "Limited"],
                        ["Digital signatures on sign-off", true, true],
                      ].map(([cap, titan, fc], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 font-medium text-slate-800">{cap as string}</td>
                          <td className="px-4 py-3">{titan === true ? <CheckIcon /> : titan === false ? <CrossIcon /> : <span className="text-xs text-amber-600 font-medium">{titan as string}</span>}</td>
                          <td className="px-4 py-3">{fc === true ? <CheckIcon /> : fc === false ? <CrossIcon /> : <span className="text-xs text-amber-600 font-medium">{fc as string}</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <strong>Our take:</strong> Both platforms cover the inspection basics well. TitanFleet's AI triage — grounded in the DVSA Guide to Roadworthiness — adds a layer FleetCheck cannot match: severity scoring, automatic VOR assignment on critical fails, and a Kanban workflow for mechanic resolution. This isn't a luxury; it's what makes the difference between a paper-passing exercise and a system that genuinely prevents prohibitions.
                </p>
              </div>

              {/* GPS & Tracking */}
              <div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-3">2. GPS Tracking &amp; Live Operations</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="text-left px-4 py-3 font-semibold">Capability</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-300">TitanFleet</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-300">FleetCheck</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ["Real-time GPS live map", true, false],
                        ["Driver identity on live map", true, false],
                        ["Geofencing & boundary alerts", true, false],
                        ["Shift trail replay (GPS history)", true, false],
                        ["Driver stop detection & logging", true, false],
                        ["Clock-in / clock-out with GPS", true, false],
                        ["Out-of-geofence clock-in flagging", true, false],
                        ["Proof of Delivery (POD) with GPS stamp", true, false],
                      ].map(([cap, titan, fc], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 font-medium text-slate-800">{cap as string}</td>
                          <td className="px-4 py-3">{titan === true ? <CheckIcon /> : <CrossIcon />}</td>
                          <td className="px-4 py-3">{fc === true ? <CheckIcon /> : <CrossIcon />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <strong>Our take:</strong> This is the biggest feature gap. FleetCheck is not a telematics platform. If you need real-time visibility of where your vehicles are — and every DVSA-audited operator effectively does — you're paying for a separate GPS system on top of FleetCheck. TitanFleet includes all of this natively, with the GPS data informing compliance records, timesheet verification, and geofence-based clock-in.
                </p>
              </div>

              {/* Compliance */}
              <div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-3">3. DVSA Compliance &amp; Driver Hours</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="text-left px-4 py-3 font-semibold">Capability</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-300">TitanFleet</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-300">FleetCheck</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ["MOT & tachograph expiry tracking", true, true],
                        ["O-licence management", true, false],
                        ["Driver CPC hours tracking", true, false],
                        ["EU/UK drivers' hours rules engine", true, false],
                        ["Infringement detection & alerts", true, false],
                        ["14-hour working limit warnings", true, false],
                        ["DVSA Earned Recognition M1–M5 KPIs", true, "Partial"],
                        ["Traffic Commissioner audit trail", true, false],
                        ["FORS compliance checklist", true, false],
                        ["Tachograph download reminders", true, true],
                        ["Licence verification (DVLA check prompt)", true, "Limited"],
                      ].map(([cap, titan, fc], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 font-medium text-slate-800">{cap as string}</td>
                          <td className="px-4 py-3">{titan === true ? <CheckIcon /> : titan === false ? <CrossIcon /> : <span className="text-xs text-amber-600 font-medium">{titan as string}</span>}</td>
                          <td className="px-4 py-3">{fc === true ? <CheckIcon /> : fc === false ? <CrossIcon /> : <span className="text-xs text-amber-600 font-medium">{fc as string}</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <strong>Our take:</strong> FleetCheck is a compliance document manager. TitanFleet is a compliance enforcement system. The drivers' hours rules engine, infringement detection, and O-licence management are not optional extras for operators subject to DVSA audit — they're requirements. Without them, you're managing compliance manually and hoping for the best.
                </p>
              </div>

              {/* Finance & Payroll */}
              <div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-3">4. Timesheets, Fuel &amp; Financial Intelligence</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="text-left px-4 py-3 font-semibold">Capability</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-300">TitanFleet</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-300">FleetCheck</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ["Digital timesheets with GPS verification", true, false],
                        ["Per-driver hourly rates & overtime", true, false],
                        ["Timesheet approval workflow", true, false],
                        ["Wage calculation & CSV export", true, false],
                        ["Fuel log per vehicle", true, "Limited"],
                        ["Fuel anomaly detection (theft/waste)", true, false],
                        ["Cost-per-mile analytics", true, false],
                        ["MPG monitoring & trends", true, false],
                        ["Fleet utilisation analytics", true, false],
                        ["Company car register (fine attribution)", true, false],
                      ].map(([cap, titan, fc], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 font-medium text-slate-800">{cap as string}</td>
                          <td className="px-4 py-3">{titan === true ? <CheckIcon /> : titan === false ? <CrossIcon /> : <span className="text-xs text-amber-600 font-medium">{titan as string}</span>}</td>
                          <td className="px-4 py-3">{fc === true ? <CheckIcon /> : fc === false ? <CrossIcon /> : <span className="text-xs text-amber-600 font-medium">{fc as string}</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <strong>Our take:</strong> FleetCheck is not a financial intelligence platform. For operators who want to understand true cost-per-mile, catch fuel card fraud, or automate payroll prep — TitanFleet is a fundamentally different product in this category.
                </p>
              </div>

            </div>
          </motion.section>

          {/* Pros & Cons */}
          <motion.section variants={fadeUp} id="pros-cons">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-6">Pros &amp; Cons</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Truck className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-[#0f172a]">TitanFleet</h3>
                  <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full ml-auto">All-in-one</span>
                </div>
                <div className="space-y-2 mb-5">
                  {[
                    "GPS, compliance, AI triage, timesheets, fuel — one platform",
                    "Per-vehicle pricing — costs don't escalate as you hire more drivers",
                    "AI defect classification grounded in DVSA Guide to Roadworthiness",
                    "Drivers' hours rules engine with infringement detection",
                    "Earned Recognition dashboard with M1–M5 KPI tracking",
                    "Fuel anomaly detection catches waste and fraud",
                    "Offline inspection queue — works in low-signal depots",
                    "30-day beta with founding partner pricing locked for life",
                  ].map((pro, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckIcon />
                      <span className="text-sm text-slate-700">{pro}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-blue-200 pt-4 space-y-2">
                  {[
                    "More features than a pure inspection-only tool — requires initial setup",
                    "Premium plan; not the cheapest option if you truly only need inspections",
                  ].map((con, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CrossIcon />
                      <span className="text-sm text-slate-600">{con}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Shield className="w-6 h-6 text-slate-500" />
                  <h3 className="text-lg font-bold text-[#0f172a]">FleetCheck</h3>
                  <span className="text-xs font-bold bg-slate-600 text-white px-2 py-0.5 rounded-full ml-auto">Inspection-first</span>
                </div>
                <div className="space-y-2 mb-5">
                  {[
                    "Clean, focused inspection and defect management tool",
                    "Established UK product with good industry reputation",
                    "Simple per-user pricing with no vehicle count involved",
                    "30-day free trial available",
                  ].map((pro, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckIcon />
                      <span className="text-sm text-slate-700">{pro}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  {[
                    "No GPS tracking — you must buy and integrate a separate telematics system",
                    "No drivers' hours rules engine or infringement detection",
                    "No O-licence management or Driver CPC tracking",
                    "No fuel intelligence or cost-per-mile analytics",
                    "No timesheet or wage calculation tools",
                    "Per-user pricing scales unfavourably as you hire more drivers",
                    "Multiple tool subscriptions mean multiple contracts and data silos",
                  ].map((con, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CrossIcon />
                      <span className="text-sm text-slate-600">{con}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Which to choose */}
          <motion.section variants={fadeUp} id="which-to-choose">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-6">Which One Should You Choose?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6">
                <p className="text-xs font-bold tracking-widest uppercase text-blue-200 mb-3">Choose TitanFleet if...</p>
                <ul className="space-y-2.5">
                  {[
                    "You need GPS tracking alongside inspections",
                    "You have 10+ vehicles and want to avoid per-user cost escalation",
                    "You need drivers' hours compliance and infringement detection",
                    "You want fuel anomaly detection and cost-per-mile analytics",
                    "You're targeting or maintaining DVSA Earned Recognition",
                    "You want timesheets and payroll in the same system as compliance",
                    "You want to replace 3–4 tools with one unified platform",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-blue-200 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-blue-50">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/manager/login">
                  <span className="inline-flex items-center gap-2 mt-5 bg-white text-blue-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">
                    Start Free Trial
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
              <div className="rounded-2xl border-2 border-slate-200 bg-white p-6">
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">FleetCheck may be enough if...</p>
                <ul className="space-y-2.5">
                  {[
                    "You manage fewer than 10 vehicles and the maths genuinely works out",
                    "You already have a GPS telematics contract (e.g. Webfleet) you're locked into",
                    "Your primary need is purely digital walkaround records",
                    "Payroll and hours are handled by a dedicated HR system",
                    "You're a sole trader or owner-driver with minimal compliance overhead",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Testimonials */}
          <motion.section variants={fadeUp} id="user-reviews">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-6">What UK Fleet Operators Say</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                {
                  quote: "We started on FleetCheck for our walkaround checks and it did the job. But when we hit 15 vehicles we realised we were paying for three separate systems — FleetCheck, a GPS tracker, and a tachograph analysis service. TitanFleet replaced all three. We're now saving around £280 a month and everything talks to each other.",
                  author: "Dave K.",
                  role: "Owner, K&M Transport, Yorkshire",
                },
                {
                  quote: "The FleetCheck comparison was honestly what sold us. We mapped out our current costs and saw we were already spending more on bits and pieces than TitanFleet would cost. The AI defect triage alone has saved us two potential prohibition notices in four months — that's a DVSA improvement notice avoided and the stress that comes with it.",
                  author: "Rachel M.",
                  role: "Transport Manager, Midlands haulage operator",
                },
              ].map((t, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-4 italic">"{t.quote}"</p>
                  <div>
                    <p className="font-bold text-sm text-[#0f172a]">{t.author}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section variants={fadeUp} id="free-trial">
            <div className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] text-white p-8 md:p-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Try TitanFleet Free — 30 Days, No Card</h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-2">Full platform access from day one. GPS, AI triage, timesheets, fuel intelligence — everything included at £19/vehicle/month.</p>
              <p className="text-slate-400 text-sm mb-7">Founding beta partners lock the price for life. First 20 operators only.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/manager/login">
                  <span className="inline-flex items-center gap-2 bg-white text-[#1e3a8a] font-bold px-7 py-3.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-sm">
                    Start Beta Trial
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
                <Link href="/roi">
                  <span className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-sm">
                    <Calculator className="w-4 h-4" />
                    Calculate your ROI first
                  </span>
                </Link>
              </div>
              <p className="text-slate-500 text-xs mt-5">support@titanfleet.co.uk · UK-based · Mon–Fri 8am–6pm</p>
            </div>
          </motion.section>

          {/* FAQ */}
          <motion.section variants={fadeUp} id="faq">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
                    aria-expanded={openFaq === i}
                  >
                    <span className="font-semibold text-sm text-[#0f172a] pr-4">{item.q}</span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed bg-slate-50 border-t border-slate-200">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.section>

          {/* Related */}
          <motion.section variants={fadeUp}>
            <h2 className="text-lg font-bold text-[#0f172a] mb-4">Related Comparisons &amp; Guides</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: "TitanFleet vs Samsara", href: "/vs/samsara", label: "Comparison" },
                { title: "Fleet Management ROI Calculator", href: "/roi", label: "Free Tool" },
                { title: "DVSA Earned Recognition Guide", href: "/guides/dvsa-earned-recognition-guide", label: "Guide" },
              ].map((link, i) => (
                <Link key={i} href={link.href}>
                  <span className="block p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer group">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{link.label}</span>
                    <p className="text-sm font-semibold text-slate-800 mt-1 group-hover:text-blue-700 transition-colors">{link.title}</p>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-2 group-hover:text-blue-500 transition-colors" />
                  </span>
                </Link>
              ))}
            </div>
          </motion.section>

          <p className="text-xs text-slate-400 text-center border-t border-slate-100 pt-6">
            Last updated: March 2026 · FleetCheck pricing sourced from publicly available information at fleetcheck.co.uk. GPS and hours management estimates based on typical UK market rates. TitanFleet is not affiliated with FleetCheck Ltd. This comparison is for informational purposes only.
          </p>

        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-white py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xl font-bold">Titan</span>
              <span className="text-xl text-slate-400 ml-1">Fleet</span>
              <p className="text-slate-400 text-sm mt-2">Built by a Class 1 Driver. Trusted by UK Operators.</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/titan.fleet" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="https://www.facebook.com/people/Titan-Fleet/61586509495375/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-sm">
            <span>&copy; {new Date().getFullYear()} Titan Fleet. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a href="mailto:support@titanfleet.co.uk" className="flex items-center gap-1.5 hover:text-white transition-colors"><Phone className="w-3.5 h-3.5" /> support@titanfleet.co.uk</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
