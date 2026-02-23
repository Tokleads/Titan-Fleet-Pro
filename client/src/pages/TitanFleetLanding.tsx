import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Check,
  Phone,
  Instagram,
  Facebook,
  Menu,
  X,
} from "lucide-react";
import PricingSection from "@/components/PricingSection";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export default function TitanFleetLandingPage() {
  const [, setLocation] = useLocation();
  const [redirecting, setRedirecting] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("marketing") === "true") {
      setRedirecting(false);
      return;
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    if (isStandalone) {
      const lastRole = localStorage.getItem("titanfleet_last_role");
      if (lastRole === "manager") {
        setLocation("/manager/login");
      } else {
        setLocation("/app");
      }
      return;
    }

    setRedirecting(false);
  }, [setLocation]);

  useEffect(() => {
    const stored = sessionStorage.getItem("referralCode");
    if (stored) {
      setReferralCode(stored);
      const storedName = sessionStorage.getItem("referrerName");
      if (storedName) setReferrerName(storedName);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      fetch(`/api/referral/validate/${encodeURIComponent(ref)}`, { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            sessionStorage.setItem("referralCode", data.referralCode);
            sessionStorage.setItem("referrerName", data.referrerCompanyName);
            setReferralCode(data.referralCode);
            setReferrerName(data.referrerCompanyName);
          }
        })
        .catch(() => {});
    }
  }, []);

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  if (redirecting) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {referrerName && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] bg-[#5B6CFF] text-white text-center py-2 text-sm font-medium"
          data-testid="banner-referral"
        >
          Referred by {referrerName} — your free trial awaits!
        </div>
      )}
      {/* Header */}
      <header className={`fixed ${referrerName ? "top-9" : "top-0"} left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">Titan</span>
              <span className="text-xl text-slate-500">Fleet</span>
              <span className="hidden sm:inline-flex items-center gap-1 bg-gradient-to-r from-slate-800 to-slate-700 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded ml-2 shadow-sm border border-slate-600/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Early Access
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">
                Platform
              </a>
              <a href="#ai-agent" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">
                AI Agent
              </a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">
                Pricing
              </a>
              <a href="/help" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">
                Help
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/app">
                <span className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium cursor-pointer">
                  Driver Login
                </span>
              </Link>
              <Link href="/manager/login">
                <span className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium cursor-pointer">
                  Manager Login
                </span>
              </Link>
              <Link href="/demo">
                <span
                  className="bg-[#5B6CFF] hover:bg-[#4A5AE8] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer inline-block"
                  data-testid="button-view-demo"
                >
                  View demo
                </span>
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-slate-100 shadow-lg"
          >
            <div className="px-4 py-4 space-y-1">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
              >
                Platform
              </a>
              <a
                href="#ai-agent"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
              >
                AI Agent
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
              >
                Pricing
              </a>
              <a
                href="/help"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
              >
                Help
              </a>
              <div className="border-t border-slate-100 my-2" />
              <Link href="/app" onClick={() => setMobileMenuOpen(false)}>
                <span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer transition-colors">
                  Driver Login
                </span>
              </Link>
              <Link href="/manager/login" onClick={() => setMobileMenuOpen(false)}>
                <span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer transition-colors">
                  Manager Login
                </span>
              </Link>
              <Link href="/demo" onClick={() => setMobileMenuOpen(false)}>
                <span
                  className="block mt-2 bg-[#5B6CFF] hover:bg-[#4A5AE8] text-white text-sm font-medium px-4 py-3 rounded-xl transition-colors cursor-pointer text-center"
                  data-testid="button-view-demo-mobile"
                >
                  View demo
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pb-28 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="text-sm font-medium text-[#5B6CFF] mb-4"
              >
                Built by a Class 1 Driver. Trusted by UK Operators.
              </motion.p>

              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6"
              >
                GPS. Compliance. Timesheets. POD.{" "}
                <span className="text-[#5B6CFF] underline decoration-[#5B6CFF] decoration-4 underline-offset-4">One Platform.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-lg text-slate-600 mb-8 max-w-lg"
              >
                Stop juggling separate apps for tracking, walk-around checks, driver hours, and proof of delivery. Titan Fleet replaces them all — from £59/month.
              </motion.p>

              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={scrollToPricing}
                  className="inline-flex items-center justify-center h-14 px-8 bg-[#5B6CFF] hover:bg-[#4A5AE8] text-white font-semibold rounded-xl transition-colors"
                  data-testid="button-view-pricing"
                >
                  View Pricing Plans
                </button>
                <Link href="/tour">
                  <span
                    className="inline-flex items-center justify-center h-14 px-8 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
                    data-testid="link-see-how-it-works"
                  >
                    See how it works
                  </span>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-lg">
                <img
                  src="/images/phone-mockup.png"
                  alt="Titan Fleet app on mobile devices"
                  className="w-full h-auto drop-shadow-2xl"
                  data-testid="hero-phone-mockup"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-white py-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-12 text-center"
          >
            <div className="flex items-center gap-2 text-slate-700">
              <Check className="h-5 w-5 text-[#5B6CFF]" />
              <span className="font-medium">Built by a Class 1 Driver</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Check className="h-5 w-5 text-[#5B6CFF]" />
              <span className="font-medium">DVSA-Aligned Framework</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Check className="h-5 w-5 text-[#5B6CFF]" />
              <span className="font-medium">From £59/month — No Setup Fee</span>
            </div>
          </motion.div>
          <p className="text-center text-sm text-slate-500 mt-4">
            Designed on the road, not in a boardroom. Every feature tested in real cabs.
          </p>
        </div>
      </section>

      {/* Built for UK operators */}
      <section id="features" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
            >
              Built for UK operators
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-slate-600"
            >
              A system drivers actually use.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                image: "/images/fleet-owner.jpg",
                title: "Fleet Owner",
                subtitle: "Sleep-at-night audit trail",
              },
              {
                image: "/images/transport-manager.jpg",
                title: "Transport Manager",
                subtitle: "Real-time defect visibility",
              },
              {
                image: "/images/hgv-driver.jpg",
                title: "HGV Driver",
                subtitle: "Checks done properly, every time",
              },
            ].map((persona, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative rounded-2xl overflow-hidden group cursor-pointer h-72"
                data-testid={`persona-card-${index}`}
              >
                <img
                  src={persona.image}
                  alt={persona.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-xl font-bold mb-1">{persona.title}</h3>
                  <p className="text-sm text-slate-200">{persona.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4 Pillars Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
            >
              Everything You Need in One Platform
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-slate-600 max-w-2xl mx-auto"
            >
              Replace your compliance software, tracking provider, and HR tool with one powerful subscription.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8"
          >
            {[
              {
                title: "Live GPS Tracking",
                subtitle: "Real-Time Fleet Visibility",
                description: "Track every vehicle in real-time with 5-minute telemetry updates. 30-minute stagnation alerts flag stationary vehicles automatically. Full route history and live map view.",
                icon: "📡",
              },
              {
                title: "Automated Timesheets",
                subtitle: "Geofence Clock In/Out",
                description: "Drivers clock in and out automatically when entering or leaving your depots. Generate payroll-ready CSV exports with hours, overtime, and mileage. No more paper timesheets.",
                icon: "⏱️",
              },
              {
                title: "Proof of Delivery",
                subtitle: "Digital Signatures & Photos",
                description: "Capture customer signatures, photos, and GPS coordinates at every drop. Generate professional POD PDFs instantly. Bulk status updates and full delivery audit trail.",
                icon: "📦",
              },
              {
                title: "DVSA-Ready Compliance",
                subtitle: "Inspections, Defects & Automation",
                description: "Digital walk-around checks with timed inspections, photo defect reporting, and auto-VOR. MOT, tax, and service alerts run automatically. Compliance scores grade your fleet A to F.",
                icon: "✅",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-shadow"
                data-testid={`feature-card-${index}`}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{feature.title}</h3>
                <p className="text-sm font-medium text-[#5B6CFF] mb-3">{feature.subtitle}</p>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Sleep at night compliance */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              <span className="underline decoration-[#5B6CFF] decoration-4 underline-offset-8">Sleep at night compliance.</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              When DVSA asks questions, your records already have answers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Autonomous Compliance Agent */}
      <section id="ai-agent" className="py-20 lg:py-28 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(91,108,255,0.05)_0%,_transparent_60%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5B6CFF]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-[#5B6CFF]/10 text-[#5B6CFF] text-sm font-semibold px-4 py-2 rounded-full mb-6"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5B6CFF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#5B6CFF]"></span>
              </span>
              AI-Powered
            </motion.div>
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6"
            >
              Beyond Software:{" "}
              <span className="text-[#5B6CFF]">Your Autonomous<br className="hidden sm:block" /> Compliance Agent</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-slate-600 max-w-2xl mx-auto"
            >
              Most platforms are just digital filing cabinets. Titan Fleet is different. Our built-in AI Agent works in the background to protect your fleet — 24/7, without being asked.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: "🔍",
                title: "Auto-Triage Defects",
                description: "Instantly recognises safety-critical issues from driver photos. A cracked windscreen or bald tyre gets escalated before your morning coffee — not buried in a spreadsheet.",
                tag: "Real-Time",
              },
              {
                icon: "⚡",
                title: "Predictive Maintenance",
                description: "Flags patterns that lead to breakdowns before the VOR light hits the dash. Recurring defects, overdue services, and mileage trends are surfaced automatically.",
                tag: "Proactive",
              },
              {
                icon: "🛡️",
                title: "Active Compliance",
                description: "It doesn't just record data — it hunts for gaps in your audit trail so you don't have to. Missing inspections, expiring MOTs, and unsigned checks are caught before DVSA asks.",
                tag: "Always-On",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative bg-slate-50 rounded-2xl p-8 border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group"
                data-testid={`ai-feature-${index}`}
              >
                <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 bg-[#5B6CFF]/10 text-[#5B6CFF]">
                  {item.tag}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3.5 rounded-xl text-sm font-medium shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              Your compliance agent is always working — even when you're not
            </div>
          </motion.div>
        </div>
      </section>

      {/* More Built-In Features */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
            >
              And That's Not All
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-slate-600 max-w-2xl mx-auto"
            >
              Every feature below is already live and working. No roadmap promises.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { title: "Driver-to-Manager Messaging", desc: "Drivers send priority messages directly to transport managers. Unread badges and 30-second auto-polling." },
              { title: "Auto-VOR on Failed Inspections", desc: "Vehicles are automatically flagged as off-road when an inspection fails. No manual intervention needed." },
              { title: "Defect Escalation", desc: "Unresolved defects automatically escalate in severity every 24 hours until someone acts on them." },
              { title: "Fuel Anomaly Detection", desc: "Unusual fuel entries are flagged automatically against the vehicle's rolling average. Configurable sensitivity per company." },
              { title: "Compliance Score", desc: "Real-time fleet health score graded A to F. Tracks inspections, defects, MOT status, and VOR ratio." },
              { title: "MOT, Tax & Service Alerts", desc: "Automated daily checks flag upcoming expiries and send notifications to managers before deadlines hit." },
              { title: "White-Label Branding", desc: "Your logo, your colours, your domain. Each company gets their own branded experience." },
              { title: "Notification Bell & History", desc: "Real-time in-app notifications for both drivers and managers. Mark as read, filter by priority." },
              { title: "PDF Reports & CSV Export", desc: "Generate inspection PDFs, delivery PODs, timesheet exports, and delivery CSV files on demand." },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-slate-50 rounded-xl p-6 border border-slate-100"
                data-testid={`extra-feature-${index}`}
              >
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection referralCode={referralCode || undefined} />

      {/* Integrations Section */}
      <section id="integrations" className="py-16 lg:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-sm font-medium text-slate-500 mb-8 tracking-wide uppercase">
              Integrates with the tools you already use
            </p>

            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16 mb-10">
              {[
                { name: 'Stripe', src: '/integrations/stripe-logo.png' },
                { name: 'Xero', src: '/integrations/xero-logo.png' },
                { name: 'QuickBooks', src: '/integrations/quickbooks-logo.png' },
                { name: 'OpenStreetMap', src: '/integrations/openstreetmap-logo.png' },
                { name: 'Resend', src: '/integrations/resend-logo.svg' },
              ].map((logo) => (
                <div
                  key={logo.name}
                  className="flex items-center justify-center w-24 h-12 sm:w-28 sm:h-14"
                  data-testid={`logo-integration-${logo.name.toLowerCase()}`}
                >
                  <img
                    src={logo.src}
                    alt={`${logo.name} logo`}
                    className="max-h-10 sm:max-h-12 max-w-full object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>

            <div className="max-w-xl mx-auto">
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Full REST API available to connect TitanFleet with your existing software.
                Link your accounting, mapping, and communication tools in minutes.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Founder Section */}
      <section id="founder" className="py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-8 sm:p-10 shadow-lg border border-slate-200"
          >
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="shrink-0">
                <img 
                  src="/images/founder-headshot.png" 
                  alt="Jon - Founder" 
                  className="w-20 h-20 rounded-full object-cover border-4 border-slate-100"
                  data-testid="founder-image"
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Questions? Talk to the Founder.
                </h3>
                <p className="text-slate-600 mb-4">
                  Jon is a Class 1 Driver who built this. No bots, just direct help.
                </p>
                <a
                  href="tel:07496188541"
                  className="inline-flex items-center gap-2 h-12 px-6 bg-[#5B6CFF] hover:bg-[#4A5AE8] text-white font-semibold rounded-xl transition-colors"
                  data-testid="button-call-jon"
                >
                  <Phone className="h-5 w-5" />
                  Call Jon
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-xl font-bold text-white">Titan</span>
              <span className="text-xl text-slate-400">Fleet</span>
            </a>
            <p className="text-sm text-slate-500 mb-4">
              UK-built compliance for transport operators.
            </p>
            <div className="flex gap-3 mb-8">
              <a
                href="https://www.instagram.com/titan.fleet"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Titan Fleet on Instagram"
                className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white hover:scale-110 transition-all duration-200"
                data-testid="link-instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/people/Titan-Fleet/61586509495375/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Titan Fleet on Facebook"
                className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:scale-110 transition-all duration-200"
                data-testid="link-facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-xs sm:text-sm hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }}>Features</a></li>
                  <li><a href="#pricing" className="text-xs sm:text-sm hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" }); }}>Pricing</a></li>
                  <li><Link href="/help"><span className="text-xs sm:text-sm hover:text-white transition-colors cursor-pointer">Help Centre</span></Link></li>
                  <li><a href="/procurement-faq" className="text-xs sm:text-sm hover:text-white transition-colors">FAQs</a></li>
                  <li><Link href="/blog"><span className="text-xs sm:text-sm hover:text-white transition-colors cursor-pointer">Blog</span></Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#founder" className="text-xs sm:text-sm hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById("founder")?.scrollIntoView({ behavior: "smooth" }); }}>Our Story</a></li>
                  <li><a href="#features" className="text-xs sm:text-sm hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }}>Our Principles</a></li>
                  <li><a href="#pricing" className="text-xs sm:text-sm hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" }); }}>No Lock-In</a></li>
                  <li><a href="/demo" className="text-xs sm:text-sm hover:text-white transition-colors">View Demo</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Contact</h4>
                <ul className="space-y-2">
                  <li><a href="mailto:support@titanfleet.co.uk" className="text-xs sm:text-sm hover:text-white transition-colors break-all">support@<br className="sm:hidden" />titanfleet.co.uk</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center space-y-4">
            <div className="flex justify-center gap-6 text-sm">
              <Link href="/privacy-policy"><span className="hover:text-white transition-colors cursor-pointer" data-testid="link-privacy-policy">Privacy Policy</span></Link>
              <Link href="/terms"><span className="hover:text-white transition-colors cursor-pointer" data-testid="link-terms">Terms & Conditions</span></Link>
              <Link href="/refund-policy"><span className="hover:text-white transition-colors cursor-pointer" data-testid="link-refund-policy">Refund Policy</span></Link>
            </div>
            <p className="text-sm text-slate-400">
              &copy; 2026 <span className="text-white font-medium">Titan</span> Fleet. All rights reserved.
            </p>
            <p className="text-xs text-slate-500">
              Built in line with DVSA Guide to Maintaining Roadworthiness (2024)
            </p>
            <p className="text-xs text-slate-600">
              CLOVER 44 LTD t/a Titan Fleet · Company Number 15940100 · Unit 12, North Storage, Bankwood Lane, Doncaster, South Yorkshire, DN11 0PS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
