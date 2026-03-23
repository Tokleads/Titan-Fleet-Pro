import { useEffect } from "react";
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
} from "lucide-react";
import { useState } from "react";

const META = {
  title: "Titan Fleet vs Samsara (2026): Which Is Right for UK Fleets? | TitanFleet",
  description:
    "Titan Fleet vs Samsara compared: pricing, features, DVSA compliance, ease of use, and UK support. Independent comparison to help UK fleet operators choose the right software in 2026.",
};

const FAQ_ITEMS = [
  {
    q: "Does Titan Fleet integrate with Samsara hardware?",
    a: "No — Titan Fleet uses its own GPS tracking and dash cam integrations. If you're switching from Samsara, our team will guide you through hardware transition with no setup fee.",
  },
  {
    q: "Is Titan Fleet compliant with UK driver hours regulations?",
    a: "Yes. Titan Fleet includes a built-in drivers' hours rules engine covering EU/UK regulations (EC 561/2006), automatic infringement detection, and DVSA Earned Recognition KPI tracking — all designed specifically for UK operators.",
  },
  {
    q: "Can Samsara match Titan Fleet's pricing for a 20-vehicle fleet?",
    a: "In most cases, no. Titan Fleet's Growth plan covers up to 25 vehicles at £129/month with no setup fee and no long-term contract. Samsara's pricing is typically higher and requires annual contract negotiation. Request quotes from both to compare for your specific fleet size.",
  },
  {
    q: "Which platform is easier to set up?",
    a: "Titan Fleet is designed for rapid adoption — most operators are fully onboarded within 1–2 days with no IT resources required. Samsara's platform, while powerful, typically requires 1–4 weeks of professional onboarding and dedicated IT support.",
  },
  {
    q: "Does Titan Fleet offer a free trial?",
    a: "Yes. Every Titan Fleet plan includes a 14-day free trial with full platform access — no credit card required, no setup fee, no commitment.",
  },
  {
    q: "What UK compliance features does Titan Fleet include that Samsara lacks?",
    a: "Titan Fleet includes DVSA Earned Recognition dashboard with M1–M5 KPI tracking, Traffic Commissioner audit trail, Driver CPC hour tracking, UK-specific walkaround check workflows, tachograph download reminders, and O-licence management — all built specifically for UK HGV and PSV operators.",
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
        { "@type": "ListItem", position: 3, name: "Titan Fleet vs Samsara", item: "https://titanfleet.co.uk/vs/samsara" },
      ],
    },
    {
      "@type": "Article",
      headline: "Titan Fleet vs Samsara (2026): Which Fleet Management Software Is Right for Your UK Business?",
      description: META.description,
      datePublished: "2026-03-01",
      dateModified: "2026-03-23",
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

export default function VsSamsara() {
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

    let schema = document.getElementById("vs-samsara-schema");
    if (!schema) {
      schema = document.createElement("script");
      schema.id = "vs-samsara-schema";
      (schema as HTMLScriptElement).type = "application/ld+json";
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify(SCHEMA);

    window.scrollTo(0, 0);
    return () => {
      document.title = "Titan Fleet Management";
      document.getElementById("vs-samsara-schema")?.remove();
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
              <Link href="/guides"><span className="text-slate-600 hover:text-[#0f172a] text-sm font-medium cursor-pointer transition-colors">Guides</span></Link>
              <Link href="/solutions"><span className="text-slate-600 hover:text-[#0f172a] text-sm font-medium cursor-pointer transition-colors">Solutions</span></Link>
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
              <Link href="/guides" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">Guides</span></Link>
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
          <span className="text-slate-700 font-medium">Titan Fleet vs Samsara</span>
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
            Titan Fleet vs Samsara (2026):<br className="hidden sm:block" />
            Which Is Right for Your UK Fleet?
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl leading-relaxed mb-8">
            An independent comparison of two fleet management platforms — covering pricing, DVSA compliance, ease of use, UK support, and the features that matter most to British operators.
          </p>

          {/* Quick verdict box */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 max-w-3xl">
            <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-3">Quick Verdict</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-blue-600/20 border border-blue-400/30 rounded-xl p-4">
                <p className="font-bold text-white mb-1">🇬🇧 Choose Titan Fleet if...</p>
                <p className="text-sm text-slate-300">You run a UK fleet and want transparent pricing, no long-term contracts, fast local support, and built-in DVSA compliance tools.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="font-bold text-white mb-1">🌍 Choose Samsara if...</p>
                <p className="text-sm text-slate-300">You manage a large enterprise fleet, AI dash cam safety is your top priority, and you have the IT resources and budget for a complex platform.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-14"
        >

          {/* At a Glance table */}
          <motion.section variants={fadeUp} id="at-a-glance">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-6">At a Glance: Titan Fleet vs Samsara</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0f172a] text-white">
                    <th className="text-left px-5 py-4 rounded-tl-2xl font-semibold w-1/3">Feature</th>
                    <th className="text-left px-5 py-4 font-semibold">
                      <span className="text-blue-400">🇬🇧 Titan Fleet</span>
                    </th>
                    <th className="text-left px-5 py-4 rounded-tr-2xl font-semibold">
                      <span className="text-slate-300">🌍 Samsara</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["Primary focus", "UK fleet compliance, DVSA automation, driver safety", "Global enterprise, AI dash cams, IoT ecosystem"],
                    ["Pricing model", "Transparent monthly from £59/mo — no lock-in", "Custom enterprise pricing, typically higher upfront"],
                    ["Best for", "UK SMEs: vans, HGVs, logistics, delivery", "Large enterprises with mixed asset types"],
                    ["DVSA compliance", "Built-in: walkaround checks, earned recognition, driver hours engine, CPC tracking", "Available, but not UK-specific by design"],
                    ["UK support", "UK-based team, same time zone", "Global support, can be less responsive for UK SMEs"],
                    ["Setup time", "1–2 days, no IT resources needed", "1–4 weeks, professional services often required"],
                    ["Contract term", "Monthly rolling or annual — no lock-in", "Annual contract required"],
                    ["Free trial", "✅ 14-day free trial, no credit card", "Demo only (custom)"],
                    ["Setup fee", "£0", "Hardware + professional services often extra"],
                  ].map(([feature, titan, samsara], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{feature}</td>
                      <td className="px-5 py-3.5 text-slate-700">{titan}</td>
                      <td className="px-5 py-3.5 text-slate-600">{samsara}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* Detailed comparison */}
          <motion.section variants={fadeUp} id="detailed-comparison">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-8">Detailed Feature Comparison</h2>
            <div className="space-y-8">

              {/* Tracking */}
              <div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-3">1. Fleet Tracking &amp; Telematics</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="text-left px-4 py-3 font-semibold">Capability</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-300">Titan Fleet</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-300">Samsara</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ["Real-time GPS tracking", true, true],
                        ["Live map with driver names", true, true],
                        ["Geofencing & clock-in boundary alerts", true, true],
                        ["Shift trail replay (GPS history)", true, true],
                        ["Driver stop detection", true, true],
                        ["Vehicle diagnostics (OBD)", true, true],
                        ["Heavy-duty vehicle deep integration", "Partial", true],
                        ["Non-vehicle asset tracking (equipment)", false, true],
                      ].map(([cap, titan, samsara], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 font-medium text-slate-800">{cap as string}</td>
                          <td className="px-4 py-3">
                            {titan === true ? <CheckIcon /> : titan === false ? <CrossIcon /> : <span className="text-xs text-amber-600 font-medium">{titan as string}</span>}
                          </td>
                          <td className="px-4 py-3">
                            {samsara === true ? <CheckIcon /> : samsara === false ? <CrossIcon /> : <span className="text-xs text-amber-600 font-medium">{samsara as string}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <strong>Our take:</strong> Both platforms provide solid real-time tracking. Titan Fleet's shift trail maps and driver stop detection are particularly strong for UK operations audited by the DVSA. Samsara offers deeper integration with mixed asset types (temperature sensors, equipment gateways) that most UK SMEs simply don't need.
                </p>
              </div>

              {/* Safety & compliance */}
              <div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-3">2. Safety &amp; DVSA Compliance</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="text-left px-4 py-3 font-semibold">Capability</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-300">Titan Fleet</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-300">Samsara</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ["Digital walkaround checks (DVSA-standard)", true, "Basic"],
                        ["AI defect severity classification", true, false],
                        ["Photo evidence on defect reports", true, true],
                        ["Auto-VOR (vehicle off road on fail)", true, false],
                        ["DVSA Earned Recognition KPI dashboard (M1–M5)", true, false],
                        ["Driver CPC hour tracking", true, false],
                        ["EU/UK drivers' hours rules engine", true, "Partial"],
                        ["MOT & tachograph expiry tracking", true, "Limited"],
                        ["O-licence management", true, false],
                        ["AI dash cam coaching", "Optional", true],
                        ["Traffic Commissioner audit trail", true, false],
                      ].map(([cap, titan, samsara], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 font-medium text-slate-800">{cap as string}</td>
                          <td className="px-4 py-3">
                            {titan === true ? <CheckIcon /> : titan === false ? <CrossIcon /> : <span className="text-xs text-amber-600 font-medium">{titan as string}</span>}
                          </td>
                          <td className="px-4 py-3">
                            {samsara === true ? <CheckIcon /> : samsara === false ? <CrossIcon /> : <span className="text-xs text-amber-600 font-medium">{samsara as string}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <strong>Our take:</strong> This is where the platforms diverge most sharply. Titan Fleet was built from the ground up for UK DVSA compliance — every feature maps to a specific regulatory requirement. Samsara's safety focus is AI dash cam coaching (genuinely best-in-class), but it lacks the depth of UK-specific compliance tooling that operators need to pass a DVSA audit or achieve Earned Recognition.
                </p>
              </div>

              {/* Ease of use */}
              <div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-3">3. Ease of Use &amp; Onboarding</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="text-left px-4 py-3 font-semibold">Aspect</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-300">Titan Fleet</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-300">Samsara</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ["Setup time", "1–2 days", "1–4 weeks"],
                        ["Driver mobile app", "PIN-based, designed for oily hands & glare", "Feature-rich, steeper learning curve"],
                        ["Manager console", "Clean, web-based, no app install", "Complex, powerful, requires training"],
                        ["Onboarding support", "Free, UK-based, included", "Paid professional services often required"],
                        ["Works offline", "✅ Offline inspection queue (IndexedDB)", "Limited"],
                        ["IT resources needed", "None", "Recommended"],
                      ].map(([aspect, titan, samsara], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 font-medium text-slate-800">{aspect}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{titan}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{samsara}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <strong>Our take:</strong> Titan Fleet was designed specifically with the HGV driver's working environment in mind — 56px touch targets, PIN-based login (no typing with work gloves), offline support for areas with poor signal. Samsara is a powerful platform, but its complexity suits enterprise IT teams, not depot managers setting up their first digital system.
                </p>
              </div>

              {/* Pricing */}
              <div id="pricing">
                <h3 className="text-lg font-bold text-[#0f172a] mb-3">4. Pricing Comparison</h3>
                <p className="text-sm text-slate-500 mb-4 italic">Samsara pricing is based on publicly reported figures. Exact quotes vary by fleet size and negotiation. Titan Fleet pricing is published openly at titanfleet.co.uk.</p>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="text-left px-4 py-3 font-semibold">Plan</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-300">Titan Fleet</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-300">Samsara (est.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        ["Up to 10 vehicles", "£59/month (Starter)", "~£240–£320/month"],
                        ["Up to 25 vehicles", "£129/month (Growth)", "~£600–£800/month"],
                        ["Up to 50 vehicles", "£249/month (Pro)", "~£1,200–£1,600/month"],
                        ["Up to 100 vehicles", "£399/month (Scale)", "~£2,400–£3,200/month"],
                        ["Setup fee", "£0", "Hardware + install often extra"],
                        ["Contract", "Monthly rolling or annual", "Annual contract required"],
                        ["Free trial", "14 days, no card needed", "Demo only"],
                      ].map(([plan, titan, samsara], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 font-medium text-slate-800">{plan}</td>
                          <td className="px-4 py-3 text-emerald-700 font-semibold">{titan}</td>
                          <td className="px-4 py-3 text-slate-600">{samsara}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <strong>Our take:</strong> Titan Fleet's pricing is transparent, published, and designed for UK SMEs. There are no setup fees, no hardware costs, and no lock-in. For a 20-vehicle fleet, the difference typically amounts to £4,000–£8,000 per year — enough to justify a careful comparison before signing an annual Samsara contract.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Pros & cons */}
          <motion.section variants={fadeUp} id="pros-cons">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-6">Pros &amp; Cons</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Titan Fleet */}
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Truck className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-[#0f172a]">Titan Fleet</h3>
                  <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full ml-auto">🇬🇧 UK-built</span>
                </div>
                <div className="space-y-2 mb-5">
                  {[
                    "UK-based support — same time zone, no outsourcing",
                    "Lowest total cost of ownership for UK fleets",
                    "No long-term contracts, no setup fees",
                    "Built-in DVSA compliance: walkaround checks, earned recognition, driver hours, CPC",
                    "Fastest onboarding — live in 1–2 days",
                    "Offline inspection queue — works with poor signal",
                    "14-day free trial, no credit card required",
                  ].map((pro, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckIcon />
                      <span className="text-sm text-slate-700">{pro}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-blue-200 pt-4 space-y-2">
                  {[
                    "Fewer advanced IoT sensors for non-vehicle assets",
                    "Smaller third-party integration ecosystem than Samsara",
                  ].map((con, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CrossIcon />
                      <span className="text-sm text-slate-600">{con}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Samsara */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Shield className="w-6 h-6 text-slate-500" />
                  <h3 className="text-lg font-bold text-[#0f172a]">Samsara</h3>
                  <span className="text-xs font-bold bg-slate-600 text-white px-2 py-0.5 rounded-full ml-auto">🌍 Global</span>
                </div>
                <div className="space-y-2 mb-5">
                  {[
                    "Industry-leading AI dash cam coaching system",
                    "Wide range of environmental and equipment sensors",
                    "Strong REST API for custom enterprise integrations",
                    "Scales to very large, diverse fleets globally",
                  ].map((pro, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckIcon />
                      <span className="text-sm text-slate-700">{pro}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  {[
                    "Significantly higher cost, especially for UK SMEs",
                    "Annual contracts required — difficult to exit",
                    "Steeper learning curve, often needs dedicated IT",
                    "Global support model — less responsive for UK-specific issues",
                    "DVSA compliance tools not built for UK specifics",
                    "Professional services fees can add thousands upfront",
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

          {/* Which should you choose */}
          <motion.section variants={fadeUp} id="which-to-choose">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-6">Which One Should You Choose?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6">
                <p className="text-xs font-bold tracking-widest uppercase text-blue-200 mb-3">Choose Titan Fleet if...</p>
                <ul className="space-y-2.5">
                  {[
                    "You operate a UK-based fleet of vans, HGVs, or light trucks",
                    "You want transparent pricing with no long-term contracts",
                    "You need DVSA compliance tools built for UK regulations",
                    "You value fast local support and same-day response",
                    "You want to achieve or maintain DVSA Earned Recognition status",
                    "You're an SME and need fast, simple onboarding",
                    "You want a 14-day free trial before committing",
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
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">Choose Samsara if...</p>
                <ul className="space-y-2.5">
                  {[
                    "You manage a large enterprise fleet (200+ vehicles)",
                    "AI dash cam safety coaching is your absolute top priority",
                    "You need to track mixed assets — vehicles, trailers, equipment",
                    "You have a dedicated IT team and flexible enterprise budget",
                    "You operate globally across multiple markets",
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
                  quote: "We switched from Samsara to Titan Fleet. The UK support alone saved us hours of frustration every month. For our 30-van fleet, Titan Fleet does everything we need at a fraction of the price — and the DVSA compliance tools are built the way we actually work.",
                  author: "James T.",
                  role: "Logistics Manager, Manchester",
                },
                {
                  quote: "Samsara's camera system is impressive, but it was overkill for our 12 delivery vans and the pricing reflected that. Titan Fleet gave us real-time tracking, driver behaviour monitoring, and walkaround checks that our team actually use every day. Onboarding took two days.",
                  author: "Sarah L.",
                  role: "Fleet Owner, London Couriers",
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
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Try Titan Fleet Free for 14 Days</h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-2">No credit card required. No setup fee. No long-term commitment. Full platform access from day one.</p>
              <p className="text-slate-400 text-sm mb-7">All plans include every feature — walkaround checks, DVSA compliance, GPS tracking, driver hours, fuel intelligence, and AI-powered defect triage.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/manager/login">
                  <span className="inline-flex items-center gap-2 bg-white text-[#1e3a8a] font-bold px-7 py-3.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-sm">
                    Start 14-Day Free Trial
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
                <a href="mailto:support@titanfleet.co.uk" className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm">
                  <Phone className="w-4 h-4" />
                  Email our UK team
                </a>
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
            <h2 className="text-lg font-bold text-[#0f172a] mb-4">Related Guides</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: "DVSA Earned Recognition: Complete Guide", href: "/guides/dvsa-earned-recognition-guide", label: "Guide" },
                { title: "Complete DVSA Compliance Guide", href: "/guides/dvsa-compliance-guide", label: "Guide" },
                { title: "Fleet Maintenance Best Practices", href: "/guides/fleet-maintenance-guide", label: "Guide" },
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
            Last updated: March 2026 · This comparison is based on publicly available information and our direct experience supporting UK fleet operators. Samsara pricing estimates are based on published reports and operator feedback — exact figures vary by fleet size and contract negotiation.
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
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Titan Fleet. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
