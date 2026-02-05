import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Check,
  Phone,
  Instagram,
  Facebook,
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
  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-900">Titan</span>
                <span className="text-xl text-slate-500">Fleet</span>
              </div>
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full">
                BETA
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">
                Platform
              </a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">
                Pricing
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <Link href="/manager/login">
                <span className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium cursor-pointer">
                  Login
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
          </div>
        </div>
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
                One Subscription. Total Control. Zero Complexity.
              </motion.p>

              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6"
              >
                The Ultimate{" "}
                <span className="text-[#5B6CFF] underline decoration-[#5B6CFF] decoration-4 underline-offset-4">Command Center</span>
                {" "}for Modern Fleets
              </motion.h1>

              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-lg text-slate-600 mb-8 max-w-lg"
              >
                Why pay for three separate subscriptions? Titan Fleet consolidates compliance, GPS tracking, and automated timesheets into one powerful platform.
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
                <a
                  href="#features"
                  className="inline-flex items-center justify-center h-14 px-8 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  See how it works
                </a>
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
              <span className="font-medium">SaaS-Free Compliance</span>
            </div>
          </motion.div>
          <p className="text-center text-sm text-slate-500 mt-4">
            Used by UK operators before launch · Built with transport managers, not sales teams
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
                title: "Intelligence Hub",
                subtitle: "Live GPS & Risk Monitoring",
                description: "Real-time coordinates, speed, and heading data with 5-minute telemetry updates. Our 30-minute stagnation alert flags stationary vehicles for driver safety checks.",
                icon: "📡",
              },
              {
                title: "Automated Payroll",
                subtitle: "Depot Geofencing",
                description: "High-precision geofencing at your sites for automatic clock-in/out. Generate payroll-ready CSV exports for instant invoicing and receipting.",
                icon: "⏱️",
              },
              {
                title: "Titan Command",
                subtitle: "Two-Way Dispatch",
                description: "Push urgent traffic or site updates to the entire fleet simultaneously. Send 1-to-1 encrypted instructions with instant delivery confirmation.",
                icon: "📲",
              },
              {
                title: "Professional Compliance",
                subtitle: "DVSA-Ready Framework",
                description: "Digital walk-around checks, automated MOT/service alerts, and centralized management for vehicles, drivers, assets, and fuel cards.",
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

      {/* Pricing Section */}
      <PricingSection />

      {/* Founder Section */}
      <section className="py-16 lg:py-20 bg-white">
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
                  src="/images/founder.jpg" 
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Logo & Tagline */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold text-white">Titan</span>
                <span className="text-xl text-slate-400">Fleet</span>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                UK-built compliance for transport operators.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  data-testid="link-instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  data-testid="link-facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-sm hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-sm hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm hover:text-white transition-colors">FAQs</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm hover:text-white transition-colors">Our Story</a></li>
                <li><a href="#" className="text-sm hover:text-white transition-colors">Our Principles</a></li>
                <li><a href="#" className="text-sm hover:text-white transition-colors">No Lock-In</a></li>
                <li><a href="#" className="text-sm hover:text-white transition-colors">Why Not Us</a></li>
                <li><a href="#" className="text-sm hover:text-white transition-colors">Sales Presentation</a></li>
                <li><a href="#" className="text-sm hover:text-white transition-colors">Affiliate</a></li>
                <li><a href="#" className="text-sm hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-3">
                <li><a href="mailto:support@titanfleet.co.uk" className="text-sm hover:text-white transition-colors">support@titanfleet.co.uk</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center space-y-4">
            <div className="flex justify-center gap-6 text-sm">
              <Link href="/privacy">
                <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              </Link>
              <Link href="/terms">
                <span className="hover:text-white transition-colors cursor-pointer">Terms & Conditions</span>
              </Link>
              <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
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
