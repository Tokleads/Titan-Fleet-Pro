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
  Menu,
  Phone,
  BookOpen,
  Instagram,
  Facebook,
  AlertTriangle,
} from "lucide-react";

const META = {
  title: "Titan Fleet vs Quartix (2026): Beyond Basic GPS Tracking | TitanFleet",
  description:
    "Titan Fleet vs Quartix compared for UK fleet operators: pricing, DVSA compliance depth, driver management, defect reporting, and the features Quartix doesn't offer. Updated March 2026.",
};

const FAQ_ITEMS = [
  {
    q: "Is Quartix good enough for DVSA compliance?",
    a: "Quartix provides GPS vehicle tracking and basic utilisation reports, but it does not include DVSA walkaround check workflows, defect reporting, driver hours compliance, O-licence management, or DVSA Earned Recognition KPI tracking. For operators subject to DVSA enforcement, Traffic Commissioner scrutiny, or wanting Earned Recognition status, Quartix alone is insufficient.",
  },
  {
    q: "How does Titan Fleet's pricing compare to Quartix?",
    a: "Quartix typically charges £14–£18 per vehicle per month for basic GPS tracking, but this covers tracking only — no compliance tools, no driver app, no defect management. Titan Fleet's Starter plan is £59/month for up to 10 vehicles (not per vehicle), including everything: compliance tools, driver app, walkaround checks, defect management, GPS tracking, and AI defect triage. For fleets of 5+ vehicles, Titan Fleet typically costs less per vehicle while doing significantly more.",
  },
  {
    q: "Does Quartix have a driver mobile app?",
    a: "Quartix does not offer a dedicated driver-facing mobile app for walkaround checks, defect reporting, or fuel entry. Its platform is manager-facing only. Titan Fleet includes a full driver portal — PIN-based login, guided walkaround checks, defect reporting with photos, fuel entry, delivery and POD capture, and in-app messaging.",
  },
  {
    q: "Can Titan Fleet replace Quartix completely?",
    a: "Yes. Everything Quartix offers — GPS tracking, live map, geofencing, mileage reports, vehicle utilisation — is included in Titan Fleet, alongside the compliance, driver management, and AI features Quartix does not provide. Most operators switching from Quartix are operational on Titan Fleet within 1–2 days.",
  },
  {
    q: "Does Titan Fleet work offline like Quartix hardware trackers?",
    a: "Titan Fleet uses the driver's smartphone for GPS tracking (with optional hardware integration). The driver app includes an offline inspection queue — completed walkaround checks are stored locally and submitted automatically when the connection returns. This is essential for depots or rural routes with poor mobile signal.",
  },
  {
    q: "What is the difference between a fleet tracker and fleet management software?",
    a: "A fleet tracker (like Quartix) records where vehicles go and generates mileage/utilisation reports. Fleet management software (like Titan Fleet) additionally manages the people operating those vehicles — walkaround checks, defect reporting, driver hours, compliance records, shift management, fuel intelligence, and regulatory reporting. For operators with DVSA obligations, the latter is what compliance actually requires.",
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
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://titanfleet.co.uk" },
        { "@type": "ListItem", position: 2, name: "Compare", item: "https://titanfleet.co.uk/vs" },
        { "@type": "ListItem", position: 3, name: "Titan Fleet vs Quartix", item: "https://titanfleet.co.uk/vs/quartix" },
      ],
    },
    {
      "@type": "Article",
      headline: "Titan Fleet vs Quartix (2026): Full Fleet Management vs Basic GPS Tracking",
      description: META.description,
      datePublished: "2026-03-01",
      dateModified: "2026-03-23",
      author: { "@type": "Organization", name: "TitanFleet" },
      publisher: { "@type": "Organization", name: "TitanFleet" },
    },
  ],
};

function Tick() { return <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />; }
function Cross() { return <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />; }

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

export default function VsQuartix() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = META.title;
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = META.description;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", META.title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", META.description);
    let schema = document.getElementById("vs-quartix-schema");
    if (!schema) { schema = document.createElement("script"); schema.id = "vs-quartix-schema"; (schema as HTMLScriptElement).type = "application/ld+json"; document.head.appendChild(schema); }
    schema.textContent = JSON.stringify(SCHEMA);
    window.scrollTo(0, 0);
    return () => { document.title = "Titan Fleet Management"; document.getElementById("vs-quartix-schema")?.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-white font-['Inter'] text-[#0f172a]">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/"><span className="flex items-center gap-2 cursor-pointer"><Truck className="w-5 h-5 text-[#2563eb]" /><span className="text-xl font-bold">Titan</span><span className="text-xl text-slate-500">Fleet</span></span></Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/guides"><span className="text-slate-600 hover:text-[#0f172a] text-sm font-medium cursor-pointer transition-colors">Guides</span></Link>
              <Link href="/vs/samsara"><span className="text-slate-600 hover:text-[#0f172a] text-sm font-medium cursor-pointer transition-colors">vs Samsara</span></Link>
              <Link href="/manager/login"><span className="inline-flex items-center gap-1.5 bg-[#2563eb] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">Start Free Trial <ChevronRight className="w-3.5 h-3.5" /></span></Link>
            </nav>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Home</span></Link>
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
          <span className="text-slate-700 font-medium">Titan Fleet vs Quartix</span>
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
            Titan Fleet vs Quartix (2026):<br className="hidden sm:block" />
            Full Fleet Management vs GPS Tracking
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl leading-relaxed mb-8">
            Quartix is one of the UK's most popular vehicle trackers — but tracking where your vehicles go is only the beginning. For operators with DVSA obligations, a GPS tracker alone leaves significant compliance gaps.
          </p>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 max-w-3xl">
            <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-3">Quick Verdict</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-blue-600/20 border border-blue-400/30 rounded-xl p-4">
                <p className="font-bold text-white mb-1">🇬🇧 Choose Titan Fleet if...</p>
                <p className="text-sm text-slate-300">You need more than GPS tracking — driver compliance, walkaround checks, defect management, and DVSA-ready audit trails.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="font-bold text-white mb-1">📍 Quartix may suit you if...</p>
                <p className="text-sm text-slate-300">You only need basic vehicle location tracking and mileage reporting, with no DVSA compliance obligations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-14">

          {/* Warning banner */}
          <motion.div variants={fadeUp} className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 flex gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 mb-1">Important for DVSA-regulated operators</p>
              <p className="text-sm text-amber-800 leading-relaxed">
                Quartix is a vehicle tracker. If you hold an HGV or PSV operator's licence, the DVSA expects much more than location data — walkaround checks, defect records, driver hours data, and maintenance documentation. Using Quartix alone will leave significant compliance gaps that an enforcement officer or Traffic Commissioner will identify.
              </p>
            </div>
          </motion.div>

          {/* At a glance */}
          <motion.section variants={fadeUp} id="at-a-glance">
            <h2 className="text-2xl font-bold mb-6">At a Glance: Titan Fleet vs Quartix</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0f172a] text-white">
                    <th className="text-left px-5 py-4 rounded-tl-2xl font-semibold w-1/3">Feature</th>
                    <th className="text-left px-5 py-4 font-semibold"><span className="text-blue-400">🇬🇧 Titan Fleet</span></th>
                    <th className="text-left px-5 py-4 rounded-tr-2xl font-semibold"><span className="text-slate-300">📍 Quartix</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["Product type", "Full fleet management platform", "Vehicle GPS tracker"],
                    ["Driver app", "✅ PIN-based, walkaround checks, defect reporting, fuel, POD", "❌ None"],
                    ["DVSA compliance tools", "✅ Deep — walkaround checks, earned recognition, CPC, hours", "❌ None"],
                    ["Defect management", "✅ With photo evidence, AI triage, auto-VOR", "❌ None"],
                    ["Driver hours monitoring", "✅ EU/UK rules engine, infringement detection", "❌ None"],
                    ["Pricing model", "£59/mo for 10 vehicles (all features)", "~£14–£18 per vehicle/month (tracking only)"],
                    ["Best for", "Regulated fleets: HGV, PSV, logistics, delivery", "Basic mileage reporting, small unregulated fleets"],
                    ["Free trial", "✅ 14 days, full access, no card", "Available"],
                  ].map(([feat, titan, quartix], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{feat}</td>
                      <td className="px-5 py-3.5 text-slate-700">{titan}</td>
                      <td className="px-5 py-3.5 text-slate-600">{quartix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* Full feature comparison */}
          <motion.section variants={fadeUp} id="feature-comparison">
            <h2 className="text-2xl font-bold mb-2">Full Feature Comparison</h2>
            <p className="text-slate-600 mb-6">The table below shows every capability UK fleet operators typically need. Features marked ❌ for Quartix are not available on any Quartix plan — they are simply outside the product's scope.</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left px-4 py-3 font-semibold">Capability</th>
                    <th className="text-left px-4 py-3 font-semibold text-blue-300">Titan Fleet</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-300">Quartix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Tracking */}
                  <tr className="bg-slate-100"><td colSpan={3} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Tracking & Telematics</td></tr>
                  {[
                    ["Real-time GPS tracking", true, true],
                    ["Live fleet map", true, true],
                    ["Geofencing & boundary alerts", true, true],
                    ["Mileage & utilisation reports", true, true],
                    ["Journey history & route replay", true, true],
                    ["Shift trail map with stop markers", true, false],
                    ["Driver stop detection", true, false],
                    ["Vehicle diagnostics (OBD)", true, false],
                  ].map(([cap, titan, quartix], i) => (
                    <tr key={`track-${i}`} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-3 font-medium text-slate-800">{cap as string}</td>
                      <td className="px-4 py-3">{titan ? <Tick /> : <Cross />}</td>
                      <td className="px-4 py-3">{quartix ? <Tick /> : <Cross />}</td>
                    </tr>
                  ))}
                  {/* Driver */}
                  <tr className="bg-slate-100"><td colSpan={3} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Driver Management</td></tr>
                  {[
                    ["Driver-facing mobile app", true, false],
                    ["PIN-based driver login", true, false],
                    ["DVSA-standard walkaround checks", true, false],
                    ["Offline inspection queue", true, false],
                    ["Defect reporting with photo evidence", true, false],
                    ["AI defect severity classification", true, false],
                    ["Fuel entry & mpg tracking", true, false],
                    ["Proof of delivery (signature + GPS)", true, false],
                    ["In-app driver messaging", true, false],
                    ["Driver CPC hour tracking", true, false],
                  ].map(([cap, titan, quartix], i) => (
                    <tr key={`driver-${i}`} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-3 font-medium text-slate-800">{cap as string}</td>
                      <td className="px-4 py-3">{titan ? <Tick /> : <Cross />}</td>
                      <td className="px-4 py-3">{quartix ? <Tick /> : <Cross />}</td>
                    </tr>
                  ))}
                  {/* Compliance */}
                  <tr className="bg-slate-100"><td colSpan={3} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">DVSA Compliance</td></tr>
                  {[
                    ["EU/UK drivers' hours rules engine", true, false],
                    ["14-hour spread-over warning", true, false],
                    ["Auto-VOR on failed safety check", true, false],
                    ["DVSA Earned Recognition M1–M5 KPIs", true, false],
                    ["MOT & tachograph expiry tracking", true, false],
                    ["O-licence management", true, false],
                    ["Traffic Commissioner audit trail", true, false],
                    ["Timesheet & shift management", true, false],
                  ].map(([cap, titan, quartix], i) => (
                    <tr key={`comp-${i}`} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-3 font-medium text-slate-800">{cap as string}</td>
                      <td className="px-4 py-3">{titan ? <Tick /> : <Cross />}</td>
                      <td className="px-4 py-3">{quartix ? <Tick /> : <Cross />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* Pricing */}
          <motion.section variants={fadeUp} id="pricing">
            <h2 className="text-2xl font-bold mb-2">Pricing: More Than It Looks</h2>
            <p className="text-slate-600 mb-6">Quartix's per-vehicle price looks lower — but it only covers GPS tracking. To match Titan Fleet's compliance capabilities, operators would need to add separate tools for walkaround checks, defect management, driver hours, and compliance reporting. The true cost comparison is Titan Fleet vs Quartix plus those additional systems.</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left px-4 py-3 font-semibold">Fleet size</th>
                    <th className="text-left px-4 py-3 font-semibold text-blue-300">Titan Fleet (all features)</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-300">Quartix (tracking only)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["5 vehicles", "£59/month (Starter)", "~£70–£90/month"],
                    ["10 vehicles", "£59/month (Starter)", "~£140–£180/month"],
                    ["25 vehicles", "£129/month (Growth)", "~£350–£450/month"],
                    ["50 vehicles", "£249/month (Pro)", "~£700–£900/month"],
                    ["What's included", "GPS + driver app + DVSA compliance + AI + hours engine", "GPS tracking + mileage reports only"],
                    ["Contract", "Monthly rolling or annual", "Annual typically required"],
                    ["Free trial", "14 days, full access, no card", "Available"],
                  ].map(([size, titan, quartix], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-3 font-medium text-slate-800">{size}</td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold">{titan}</td>
                      <td className="px-4 py-3 text-slate-600">{quartix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-400 italic">Quartix pricing based on publicly reported figures. Exact quotes vary by fleet size and contract.</p>
          </motion.section>

          {/* Pros & cons */}
          <motion.section variants={fadeUp} id="pros-cons">
            <h2 className="text-2xl font-bold mb-6">Pros &amp; Cons</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Truck className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold">Titan Fleet</h3>
                  <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full ml-auto">Full Platform</span>
                </div>
                <div className="space-y-2 mb-5">
                  {["Real GPS tracking + full DVSA compliance in one platform","Driver app with walkaround checks, defect reporting, and POD","DVSA Earned Recognition M1–M5 KPI dashboard","EU/UK drivers' hours rules engine built-in","AI defect triage — DVSA criteria, photo evidence","Auto-VOR on failed safety checks","Offline-ready — works in poor signal depots","Transparent per-fleet pricing — not per vehicle"].map((p, i) => (
                    <div key={i} className="flex items-start gap-2.5"><Tick /><span className="text-sm text-slate-700">{p}</span></div>
                  ))}
                </div>
                <div className="border-t border-blue-200 pt-4 space-y-2">
                  {["More features may require onboarding time for new users","Driver smartphone required for app-based features"].map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5"><Cross /><span className="text-sm text-slate-600">{c}</span></div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Shield className="w-6 h-6 text-slate-500" />
                  <h3 className="text-lg font-bold">Quartix</h3>
                  <span className="text-xs font-bold bg-slate-600 text-white px-2 py-0.5 rounded-full ml-auto">Tracker Only</span>
                </div>
                <div className="space-y-2 mb-5">
                  {["Simple to install and use","UK-based company with local support","Good vehicle utilisation and mileage reports","Established reputation for basic tracking"].map((p, i) => (
                    <div key={i} className="flex items-start gap-2.5"><Tick /><span className="text-sm text-slate-700">{p}</span></div>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  {["No driver-facing app — tracking only","No walkaround checks or defect reporting","No drivers' hours compliance monitoring","No DVSA Earned Recognition support","No AI features","No POD or delivery management","Not a complete fleet management solution for regulated operators"].map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5"><Cross /><span className="text-sm text-slate-600">{c}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Which to choose */}
          <motion.section variants={fadeUp} id="which-to-choose">
            <h2 className="text-2xl font-bold mb-6">Which One Should You Choose?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6">
                <p className="text-xs font-bold tracking-widest uppercase text-blue-200 mb-3">Choose Titan Fleet if...</p>
                <ul className="space-y-2.5">
                  {["You hold an HGV or PSV operator's licence","You are subject to DVSA roadside checks or Traffic Commissioner oversight","You need walkaround checks, defect management, or driver hours compliance","You want to achieve DVSA Earned Recognition status","You manage drivers as well as vehicles","You want tracking plus compliance in one monthly subscription"].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5"><Check className="w-4 h-4 text-blue-200 flex-shrink-0 mt-0.5" /><span className="text-sm text-blue-50">{item}</span></li>
                  ))}
                </ul>
                <Link href="/manager/login">
                  <span className="inline-flex items-center gap-2 mt-5 bg-white text-blue-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">Start Free Trial <ChevronRight className="w-4 h-4" /></span>
                </Link>
              </div>
              <div className="rounded-2xl border-2 border-slate-200 bg-white p-6">
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">Quartix may suit you if...</p>
                <ul className="space-y-2.5">
                  {["You run a small, unregulated vehicle fleet (e.g., company cars)","Your only requirement is mileage reporting for expense or tax purposes","You have no DVSA obligations — no HGV operator's licence","You already have separate compliance tools and need tracking only"].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5"><ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" /><span className="text-sm text-slate-600">{item}</span></li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-800"><strong>Note:</strong> If you hold an operator's licence and are using only a GPS tracker for compliance, speak to your transport manager or compliance consultant. A DVSA enforcement visit or Traffic Commissioner inquiry will likely identify the gap.</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Testimonials */}
          <motion.section variants={fadeUp} id="reviews">
            <h2 className="text-2xl font-bold mb-6">What UK Operators Say</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { quote: "We used Quartix for three years and thought we were covered. Then our DVSA roadside check officer asked for our walkaround check records and we had nothing. Switched to Titan Fleet the following month. We now have a complete digital audit trail — inspections, defects, driver hours. The earned recognition dashboard alone justifies the switch.", author: "David W.", role: "Transport Manager, East Midlands Distribution" },
                { quote: "Quartix told us where our vans were. Titan Fleet tells us whether our drivers did their checks, what defects they found, whether the vehicle is road-legal, and whether anyone is breaching their hours. It is not even the same category of product.", author: "Lisa T.", role: "Operations Director, Northern Haulage" },
              ].map((t, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <div className="flex gap-1 mb-4">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}</div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-4 italic">"{t.quote}"</p>
                  <div><p className="font-bold text-sm">{t.author}</p><p className="text-xs text-slate-500">{t.role}</p></div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section variants={fadeUp}>
            <div className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] text-white p-8 md:p-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Go Beyond GPS Tracking</h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-7">Try Titan Fleet free for 14 days — full access to every compliance, tracking, and driver management feature. No credit card. No setup fee. No long-term commitment.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/manager/login">
                  <span className="inline-flex items-center gap-2 bg-white text-[#1e3a8a] font-bold px-7 py-3.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-sm">Start 14-Day Free Trial <ChevronRight className="w-4 h-4" /></span>
                </Link>
                <a href="mailto:support@titanfleet.co.uk" className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm">
                  <Phone className="w-4 h-4" />Email our UK team
                </a>
              </div>
              <p className="text-slate-500 text-xs mt-5">support@titanfleet.co.uk · UK-based · Mon–Fri 8am–6pm</p>
            </div>
          </motion.section>

          {/* FAQ */}
          <motion.section variants={fadeUp} id="faq">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors" aria-expanded={openFaq === i}>
                    <span className="font-semibold text-sm pr-4">{item.q}</span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                  </button>
                  {openFaq === i && <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed bg-slate-50 border-t border-slate-200">{item.a}</div>}
                </div>
              ))}
            </div>
          </motion.section>

          {/* Related */}
          <motion.section variants={fadeUp}>
            <h2 className="text-lg font-bold mb-4">More Comparisons &amp; Guides</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: "Titan Fleet vs Samsara", href: "/vs/samsara", label: "Compare" },
                { title: "Titan Fleet vs Motive", href: "/vs/motive", label: "Compare" },
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
            Last updated: March 2026 · Quartix pricing based on publicly available data. Features confirmed against Quartix's published product documentation. This comparison is produced independently by TitanFleet.
          </p>
        </motion.div>
      </div>

      <footer className="bg-[#0f172a] text-white py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div><span className="text-xl font-bold">Titan</span><span className="text-xl text-slate-400 ml-1">Fleet</span><p className="text-slate-400 text-sm mt-2">Built by a Class 1 Driver. Trusted by UK Operators.</p></div>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/titan.fleet" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="https://www.facebook.com/people/Titan-Fleet/61586509495375/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} Titan Fleet. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
