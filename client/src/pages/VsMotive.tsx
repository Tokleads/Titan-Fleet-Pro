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
} from "lucide-react";

const META = {
  title: "Titan Fleet vs Motive (2026): UK Fleet Management Comparison | TitanFleet",
  description:
    "Titan Fleet vs Motive compared for UK operators: pricing, DVSA compliance, driver hours, ease of use, and UK-specific features. Find out which platform is right for your British fleet in 2026.",
};

const FAQ_ITEMS = [
  {
    q: "Is Motive available in the UK?",
    a: "Yes, Motive (formerly KeepTruckin) operates in the UK, but its platform was built for US compliance requirements — ELD (Electronic Logging Device) mandates in the US — not DVSA, Traffic Commissioner, or EU/UK drivers' hours regulations. UK-specific compliance features are significantly less developed than in a purpose-built UK platform.",
  },
  {
    q: "Does Titan Fleet replace Motive for UK compliance?",
    a: "Yes. Titan Fleet covers everything Motive offers for UK operators — GPS tracking, driver behaviour, dash cam integration — plus UK-specific tools that Motive lacks: DVSA Earned Recognition KPI tracking, walkaround check workflows, O-licence management, Driver CPC tracking, and the EU/UK drivers' hours rules engine.",
  },
  {
    q: "How does Titan Fleet's pricing compare to Motive?",
    a: "Titan Fleet's pricing starts at £59/month for up to 10 vehicles, with no setup fees, no long-term contracts, and a 14-day free trial. Motive's UK pricing is typically negotiated and tends to be higher, particularly when AI dash cam hardware is included. Titan Fleet publishes all pricing openly at titanfleet.co.uk.",
  },
  {
    q: "Can I switch from Motive to Titan Fleet easily?",
    a: "Yes. Titan Fleet's onboarding team will guide you through the transition. Most fleets are fully operational on Titan Fleet within 1–2 days. There are no setup fees and your historical data can be migrated on request.",
  },
  {
    q: "Does Titan Fleet have AI dash cam support?",
    a: "Titan Fleet supports dash cam integration and includes photo evidence capture on all defect reports. Full AI in-cab coaching cameras are available as an optional add-on. Contact our team to discuss dash cam options for your fleet.",
  },
  {
    q: "Which platform is better for a UK haulage company?",
    a: "For UK haulage, Titan Fleet is the stronger choice. It was designed specifically for UK HGV operators — covering DVSA walkaround checks, defect management, auto-VOR, Earned Recognition KPI tracking, tachograph reminders, and Driver CPC hours. Motive's UK offering is a general fleet management platform without this regulatory depth.",
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
        { "@type": "ListItem", position: 3, name: "Titan Fleet vs Motive", item: "https://titanfleet.co.uk/vs/motive" },
      ],
    },
    {
      "@type": "Article",
      headline: "Titan Fleet vs Motive (2026): Which Fleet Management Software Is Right for UK Operators?",
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

export default function VsMotive() {
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
    let schema = document.getElementById("vs-motive-schema");
    if (!schema) { schema = document.createElement("script"); schema.id = "vs-motive-schema"; (schema as HTMLScriptElement).type = "application/ld+json"; document.head.appendChild(schema); }
    schema.textContent = JSON.stringify(SCHEMA);
    window.scrollTo(0, 0);
    return () => { document.title = "Titan Fleet Management"; document.getElementById("vs-motive-schema")?.remove(); };
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
          <span className="text-slate-700 font-medium">Titan Fleet vs Motive</span>
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
            Titan Fleet vs Motive (2026):<br className="hidden sm:block" />
            Which Is Right for UK Fleet Operators?
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl leading-relaxed mb-8">
            Motive (formerly KeepTruckin) is a powerful platform built for the US market. This comparison examines what UK haulage operators actually need — and where Motive falls short for British compliance requirements.
          </p>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 max-w-3xl">
            <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-3">Quick Verdict</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-blue-600/20 border border-blue-400/30 rounded-xl p-4">
                <p className="font-bold text-white mb-1">🇬🇧 Choose Titan Fleet if...</p>
                <p className="text-sm text-slate-300">You are a UK HGV or van fleet operator who needs DVSA compliance built-in, transparent pricing, and fast local support.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="font-bold text-white mb-1">🇺🇸 Choose Motive if...</p>
                <p className="text-sm text-slate-300">You run a large international fleet that already uses Motive's US ELD compliance system and want to extend to UK vehicles.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-14">

          {/* At a glance */}
          <motion.section variants={fadeUp} id="at-a-glance">
            <h2 className="text-2xl font-bold mb-6">At a Glance: Titan Fleet vs Motive</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0f172a] text-white">
                    <th className="text-left px-5 py-4 rounded-tl-2xl font-semibold w-1/3">Feature</th>
                    <th className="text-left px-5 py-4 font-semibold"><span className="text-blue-400">🇬🇧 Titan Fleet</span></th>
                    <th className="text-left px-5 py-4 rounded-tr-2xl font-semibold"><span className="text-slate-300">🇺🇸 Motive</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["Primary market", "UK — built for DVSA, Traffic Commissioner, EU/UK hours", "US — built for ELD compliance and North American trucking"],
                    ["UK DVSA compliance", "Deep: walkaround checks, earned recognition, CPC, O-licence", "Limited: not built for UK regulatory environment"],
                    ["Pricing model", "Transparent, published — from £59/mo, no lock-in", "Custom, negotiated — typically higher, annual contract"],
                    ["AI dash cams", "Optional add-on", "Core feature, strong US market"],
                    ["Driver app", "PIN-based, UK-optimised, offline-ready", "Full-featured, US-focused, requires smartphone"],
                    ["UK support", "UK-based, same time zone", "US-based primary support"],
                    ["Free trial", "✅ 14 days, no card required", "Demo only"],
                    ["Setup time", "1–2 days", "1–3 weeks"],
                  ].map(([feat, titan, motive], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{feat}</td>
                      <td className="px-5 py-3.5 text-slate-700">{titan}</td>
                      <td className="px-5 py-3.5 text-slate-600">{motive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* UK compliance gap */}
          <motion.section variants={fadeUp} id="uk-compliance">
            <h2 className="text-2xl font-bold mb-2">The UK Compliance Gap</h2>
            <p className="text-slate-600 mb-6">This is the most important comparison for UK operators. Motive was designed around US ELD mandates — the American equivalent of tachograph legislation. When used in the UK, operators must find workarounds or accept gaps in DVSA-specific compliance workflows.</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left px-4 py-3 font-semibold">UK Compliance Requirement</th>
                    <th className="text-left px-4 py-3 font-semibold text-blue-300">Titan Fleet</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-300">Motive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["DVSA-standard walkaround check workflow", true, false],
                    ["AI defect severity classification (DVSA criteria)", true, false],
                    ["Auto-VOR on failed safety check", true, false],
                    ["DVSA Earned Recognition M1–M5 KPI dashboard", true, false],
                    ["Driver CPC periodic training tracking", true, false],
                    ["EU/UK drivers' hours rules engine (EC 561/2006)", true, "US HOS only"],
                    ["14-hour spread-over warning for UK drivers", true, false],
                    ["MOT & tachograph calibration tracking", true, false],
                    ["O-licence management", true, false],
                    ["Traffic Commissioner audit trail", true, false],
                    ["Offline inspection queue (poor signal areas)", true, false],
                    ["Photo evidence on driver-reported defects", true, true],
                    ["Real-time GPS tracking", true, true],
                    ["Geofencing", true, true],
                  ].map(([cap, titan, motive], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-3 font-medium text-slate-800">{cap as string}</td>
                      <td className="px-4 py-3">
                        {titan === true ? <Tick /> : titan === false ? <Cross /> : <span className="text-xs text-amber-600 font-medium">{titan as string}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {motive === true ? <Tick /> : motive === false ? <Cross /> : <span className="text-xs text-amber-600 font-medium">{motive as string}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <strong>Important:</strong> Motive's Hours of Service (HOS) compliance engine is built for US federal regulations — not EC 561/2006 (EU/UK drivers' hours) or the UK Working Time Directive. UK operators using Motive for hours compliance risk recording data in a format the DVSA cannot validate.
            </p>
          </motion.section>

          {/* Pricing */}
          <motion.section variants={fadeUp} id="pricing">
            <h2 className="text-2xl font-bold mb-6">Pricing Comparison</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left px-4 py-3 font-semibold">Fleet size</th>
                    <th className="text-left px-4 py-3 font-semibold text-blue-300">Titan Fleet</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-300">Motive (est.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["Up to 10 vehicles", "£59/month (Starter)", "~£280–£380/month"],
                    ["Up to 25 vehicles", "£129/month (Growth)", "~£700–£950/month"],
                    ["Up to 50 vehicles", "£249/month (Pro)", "~£1,400–£1,900/month"],
                    ["Up to 100 vehicles", "£399/month (Scale)", "~£2,800–£3,800/month"],
                    ["Contract term", "Monthly rolling or annual", "Annual required"],
                    ["Setup fee", "£0", "Hardware typically extra"],
                    ["Free trial", "14 days, no card needed", "Demo only"],
                  ].map(([size, titan, motive], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-3 font-medium text-slate-800">{size}</td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold">{titan}</td>
                      <td className="px-4 py-3 text-slate-600">{motive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-400 italic">Motive pricing estimates based on published reports and operator feedback. Exact figures vary by fleet size, features, and contract negotiation.</p>
          </motion.section>

          {/* Pros & cons */}
          <motion.section variants={fadeUp} id="pros-cons">
            <h2 className="text-2xl font-bold mb-6">Pros &amp; Cons</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Truck className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold">Titan Fleet</h3>
                  <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full ml-auto">🇬🇧 UK-built</span>
                </div>
                <div className="space-y-2 mb-5">
                  {["Built for UK DVSA compliance from the ground up","Transparent pricing, no lock-in, no setup fee","14-day free trial included with every plan","Offline-ready driver app — works in poor signal areas","UK-based support team","DVSA Earned Recognition KPI dashboard built-in","EU/UK drivers' hours rules engine — not US HOS"].map((p, i) => (
                    <div key={i} className="flex items-start gap-2.5"><Tick /><span className="text-sm text-slate-700">{p}</span></div>
                  ))}
                </div>
                <div className="border-t border-blue-200 pt-4 space-y-2">
                  {["AI dash cam coaching available as add-on, not bundled","Smaller global integration ecosystem than Motive"].map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5"><Cross /><span className="text-sm text-slate-600">{c}</span></div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Shield className="w-6 h-6 text-slate-500" />
                  <h3 className="text-lg font-bold">Motive</h3>
                  <span className="text-xs font-bold bg-slate-600 text-white px-2 py-0.5 rounded-full ml-auto">🇺🇸 US-built</span>
                </div>
                <div className="space-y-2 mb-5">
                  {["Strong AI dash cam safety coaching platform","Deep US ELD compliance for North American fleets","Wide hardware ecosystem (gateway, sensors)","Proven at enterprise scale"].map((p, i) => (
                    <div key={i} className="flex items-start gap-2.5"><Tick /><span className="text-sm text-slate-700">{p}</span></div>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  {["Built for US market — significant UK compliance gaps","No DVSA Earned Recognition support","No EU/UK drivers' hours rules engine","Pricing significantly higher for UK fleets","Annual contracts, difficult to exit","UK support routed through US-based teams","No walkaround check workflow built for DVSA standards"].map((c, i) => (
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
                  {["You operate HGVs or vans under a UK operator's licence","You need DVSA walkaround checks, earned recognition, or CPC tracking","You want to pass a DVSA audit with a digital evidence trail","You want transparent UK pricing with no long-term commitment","You value UK-based support who understand British regulations","You're an SME that needs to be operational quickly"].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5"><Check className="w-4 h-4 text-blue-200 flex-shrink-0 mt-0.5" /><span className="text-sm text-blue-50">{item}</span></li>
                  ))}
                </ul>
                <Link href="/manager/login">
                  <span className="inline-flex items-center gap-2 mt-5 bg-white text-blue-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">
                    Start Free Trial <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
              <div className="rounded-2xl border-2 border-slate-200 bg-white p-6">
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">Choose Motive if...</p>
                <ul className="space-y-2.5">
                  {["Your fleet operates primarily in North America and you need US ELD compliance","You already use Motive's US platform and want consistent tooling across markets","AI dash cam coaching is your primary priority and UK compliance is secondary","You have enterprise IT resources and budget for a complex rollout"].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5"><ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" /><span className="text-sm text-slate-600">{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Testimonials */}
          <motion.section variants={fadeUp} id="reviews">
            <h2 className="text-2xl font-bold mb-6">What UK Operators Say</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { quote: "We trialled Motive after using it for our US operation. The drivers' hours reporting was completely wrong for UK rules — it was logging against US HOS, not EU regs. We switched to Titan Fleet and the compliance reporting was correct from day one.", author: "Mark P.", role: "Fleet Director, Cross-Border Haulage" },
                { quote: "The DVSA earned recognition dashboard on Titan Fleet is worth the subscription on its own. We couldn't get anything close to that with Motive. When our Business Manager asked for M1–M5 data, Titan Fleet generated the report in minutes.", author: "Rachel B.", role: "Transport Manager, Midlands Logistics" },
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
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Try Titan Fleet Free for 14 Days</h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-7">Full access to every feature — DVSA compliance, GPS tracking, earned recognition dashboard, drivers' hours engine, and AI defect triage. No credit card. No setup fee.</p>
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
                { title: "Titan Fleet vs Quartix", href: "/vs/quartix", label: "Compare" },
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
            Last updated: March 2026 · This comparison is based on publicly available information and our direct experience supporting UK fleet operators. Motive pricing estimates are based on published reports and operator feedback.
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
