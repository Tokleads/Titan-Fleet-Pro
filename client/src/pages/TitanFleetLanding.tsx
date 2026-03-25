import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Check,
  Phone,
  Instagram,
  Facebook,
  Menu,
  X,
  Truck,
  Quote,
  Mail,
  Sparkles,
  Bot,
  MapPin,
  AlertTriangle,
  Clock,
  FileCheck,
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

const COPILOT_DEMOS = [
  {
    question: "Who is driving DE22NNX right now?",
    answer: "**Tomasz Czyzewski** is currently driving **DE22NNX** (MAN TGX, MY2018). He clocked in at 06:14 this morning and is currently 12 km north of Doncaster, travelling at 56 mph.",
    delay: 1200,
  },
  {
    question: "Show me all open defects",
    answer: "There are **2 open defects**, both on **A25DTP** (MAN TGX 26.460):\n\n• **Nearside indicator flickering** — AMBER — reported 5 Mar by Adam Oman\n• **Test defect check** — AMBER — reported 5 Mar by Adam Oman\n\nBoth require attention before next dispatch.",
    delay: 1400,
  },
  {
    question: "Did Tomasz record mileage on 17 March?",
    answer: "Yes — Tomasz completed a walkaround check on **DE22NNX** on 17 March 2026 at 09:09. He recorded an odometer reading of **573,944 miles**. The check passed with no defects.",
    delay: 1300,
  },
  {
    question: "Which vehicles have MOT due soon?",
    answer: "**3 vehicles** have MOT due within 30 days:\n\n• **A25DTP** — due 31 Mar 2026 (11 days)\n• **BT71TVM** — due 31 Dec 2026\n• **BT71TVN** — due 31 Jan 2027\n\nBook A25DTP immediately to stay compliant.",
    delay: 1200,
  },
  {
    question: "How many hours can a driver work before a break?",
    answer: "Under **EU drivers' hours rules**, a driver must take a **45-minute break** after **4 hours 30 minutes** of driving. The break can be split — 15 min first, then 30 min — taken within the driving period. Breaks must be uninterrupted with no other work.",
    delay: 1500,
  },
];

function TypedText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    idx.current = 0;
    const timer = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(timer);
        setDone(true);
        onDone?.();
      }
    }, 18);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />}
    </span>
  );
}

function FormattedAnswer({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} className="text-white">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

function CopilotDemo() {
  const [demoIdx, setDemoIdx] = useState(0);
  const [phase, setPhase] = useState<"typing-q" | "waiting" | "typing-a" | "done">("typing-q");
  const [showAnswer, setShowAnswer] = useState(false);
  const demo = COPILOT_DEMOS[demoIdx];

  useEffect(() => {
    setPhase("typing-q");
    setShowAnswer(false);
  }, [demoIdx]);

  const handleQuestionDone = () => {
    setPhase("waiting");
    setTimeout(() => {
      setShowAnswer(true);
      setPhase("typing-a");
    }, demo.delay);
  };

  const handleAnswerDone = () => {
    setPhase("done");
    setTimeout(() => {
      setDemoIdx(i => (i + 1) % COPILOT_DEMOS.length);
    }, 3500);
  };

  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-4 bg-[#5B6CFF]/10 rounded-3xl blur-2xl" />

      <div className="relative bg-gray-950 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800 bg-gray-900">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex items-center gap-2 ml-2">
            <div className="w-6 h-6 rounded-full bg-[#5B6CFF] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Fleet Copilot</span>
            <div className="flex items-center gap-1 ml-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">Live fleet data</span>
            </div>
          </div>
          {/* Demo indicator */}
          <div className="ml-auto flex gap-1">
            {COPILOT_DEMOS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDemoIdx(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === demoIdx ? "bg-[#5B6CFF]" : "bg-gray-600"}`}
              />
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="p-5 space-y-4 min-h-[280px]">
          {/* Intro message */}
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#5B6CFF] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-300 max-w-xs">
              Hi — I have live access to your fleet. Ask me anything.
            </div>
          </div>

          {/* Animated Q */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`q-${demoIdx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-end"
            >
              <div className="bg-[#5B6CFF] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white max-w-xs">
                {phase === "typing-q"
                  ? <TypedText text={demo.question} onDone={handleQuestionDone} />
                  : demo.question}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Thinking indicator */}
          {phase === "waiting" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-[#5B6CFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}

          {/* Animated A */}
          {showAnswer && (
            <AnimatePresence>
              <motion.div
                key={`a-${demoIdx}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex gap-2.5"
              >
                <div className="w-7 h-7 rounded-full bg-[#5B6CFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-300 max-w-sm whitespace-pre-line leading-relaxed">
                  {(phase === "typing-a")
                    ? <TypedText text={demo.answer} onDone={handleAnswerDone} />
                    : <FormattedAnswer text={demo.answer} />}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Input bar */}
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
            <span className="text-gray-500 text-sm flex-1">Ask anything about your fleet...</span>
            <div className="w-7 h-7 bg-[#5B6CFF] rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TitanFleetLandingPage() {
  const [, setLocation] = useLocation();
  const [redirecting, setRedirecting] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAnnouncementBar, setShowAnnouncementBar] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

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

  const hasTopBanner = referrerName || showAnnouncementBar;
  const topBannerHeight = referrerName ? "top-[72px]" : showAnnouncementBar ? "top-[44px]" : "top-0";

  if (redirecting) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {showAnnouncementBar && !referrerName && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] bg-slate-900 text-white text-center py-2 px-4 cursor-pointer border-b border-slate-700"
          onClick={scrollToPricing}
          data-testid="banner-founding-partner"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 relative">
            <span className="flex flex-col leading-tight">
              <span className="text-xs sm:text-sm font-bold tracking-wide uppercase">Founding Partner Offer</span>
              <span className="text-[10px] sm:text-xs font-normal text-slate-300">First 10 operators get <span className="text-emerald-400 font-bold">50% off</span> lifetime pricing</span>
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowAnnouncementBar(false); }}
              className="absolute right-0 p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Close announcement"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {referrerName && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] bg-[#5B6CFF] text-white text-center py-2 text-sm font-medium"
          data-testid="banner-referral"
        >
          Referred by {referrerName} — your free trial awaits!
        </div>
      )}

      <header className={`fixed ${hasTopBanner ? topBannerHeight : "top-0"} left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">Titan</span>
              <span className="text-xl text-slate-500">Fleet</span>
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
      <section className={`${hasTopBanner ? "pt-36" : "pt-32"} pb-20 lg:pb-28 bg-gradient-to-b from-white to-slate-50`}>
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
                className="text-xs sm:text-sm font-medium text-[#5B6CFF] mb-3 sm:mb-4"
              >
                Built by a Class 1 Driver. Live on 100+ UK trucks. DVSA-ready today.
              </motion.p>

              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="text-2xl sm:text-4xl lg:text-6xl font-bold text-slate-900 leading-tight mb-4 sm:mb-6"
              >
                UK Operators Save 14+ Hours/Week{" "}
                <span className="text-[#5B6CFF] underline decoration-[#5B6CFF] decoration-4 underline-offset-4">on Fleet Admin</span>
              </motion.h1>

              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-6 sm:mb-8 max-w-lg"
              >
                {[
                  "GPS Tracking",
                  "DVSA Walkaround Checks",
                  "Driver Timesheets",
                  "Wage Calculations",
                  "Defect Management",
                  "Fuel Logging",
                  "Proof of Delivery",
                  "Geofencing",
                  "AI Compliance",
                  "Live on 100+ UK Trucks",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="text-xs sm:text-sm text-slate-600">{feature}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3 bg-slate-50 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-slate-200"
              >
                <span className="text-[#00b67a] text-xs sm:text-sm shrink-0">★★★★★</span>
                <p className="text-xs sm:text-sm text-slate-600 italic leading-snug">
                  "TitanFleet saves us around 14 hours per week. Finally, software that works."
                  <span className="not-italic font-medium text-slate-800"> — Thomas, Abtso Ltd (45 trucks)</span>
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className="flex flex-col">
                  <button
                    onClick={scrollToPricing}
                    className="inline-flex items-center justify-center h-14 px-8 bg-[#5B6CFF] hover:bg-[#4A5AE8] text-white font-semibold rounded-xl transition-colors text-center leading-tight"
                    data-testid="button-view-pricing"
                  >
                    <span className="flex flex-col">
                      <span>Start 14-Day Free Trial &rarr;</span>
                      <span className="text-xs font-normal opacity-90">Founders deal — from £12/vehicle</span>
                    </span>
                  </button>
                  <p className="text-xs text-amber-500 font-semibold mt-2 text-center">🔥 7/10 spots remaining</p>
                </div>
                <button
                  onClick={() => setShowVideo(true)}
                  className="inline-flex items-center justify-center h-14 px-8 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
                  data-testid="button-watch-demo"
                >
                  ▶ Watch Demo Video
                </button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-6"
              >
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>No setup fee (save £300+)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>No card required</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>30-day money-back guarantee</span>
                </div>
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
                <div className="absolute top-6 -left-2 sm:top-8 sm:-left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-slate-200">
                  <p className="text-xs font-bold text-slate-900">14+ hrs/week saved</p>
                </div>
                <div className="absolute bottom-16 -right-2 sm:bottom-20 sm:-right-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-600">DVSA Compliant ✓</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof — Trusted by UK Operators */}
      <section className="py-6 lg:py-16 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="text-lg sm:text-3xl font-bold text-slate-900 text-center mb-4 sm:mb-10"
            >
              Trusted by UK Operators
            </motion.h2>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-10 border border-slate-200 relative"
              data-testid="testimonial-card"
            >
              <Quote className="h-6 w-6 sm:h-10 sm:w-10 text-[#5B6CFF]/20 absolute top-3 left-3 sm:top-6 sm:left-6" />
              <div className="relative">
                <p className="text-sm sm:text-xl text-slate-700 italic leading-relaxed mb-3 sm:mb-6 pl-4 sm:pl-8">
                  "As a business owner running a fleet, I needed something that worked for me and my drivers. TitanFleet saves us around 14 hours per week on compliance and my drivers actually use it without complaints — that's a first."
                </p>
                <div className="flex items-center gap-2.5 sm:gap-4 pl-4 sm:pl-8">
                  <div className="h-8 w-8 sm:h-14 sm:w-14 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm sm:text-2xl">A</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs sm:text-base">Thomas</p>
                    <p className="text-[11px] sm:text-sm text-slate-600">Abtso Ltd</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">Owner-Operator (45 Trucks)</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-12 text-center mt-10"
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
                <span className="font-medium">100+ Trucks in Beta</span>
              </div>
            </motion.div>
          </motion.div>
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
                icon: "\u{1F4E1}",
              },
              {
                title: "Automated Timesheets",
                subtitle: "Geofence Clock In/Out",
                description: "Drivers clock in and out automatically when entering or leaving your depots. Generate payroll-ready CSV exports with hours, overtime, and mileage. No more paper timesheets.",
                icon: "\u23F1\uFE0F",
              },
              {
                title: "Proof of Delivery",
                subtitle: "Digital Signatures & Photos",
                description: "Capture customer signatures, photos, and GPS coordinates at every drop. Generate professional POD PDFs instantly. Bulk status updates and full delivery audit trail.",
                icon: "\u{1F4E6}",
              },
              {
                title: "DVSA-Ready Compliance",
                subtitle: "Inspections, Defects & Automation",
                description: "Digital walk-around checks with timed inspections, photo defect reporting, and auto-VOR. MOT, tax, and service alerts run automatically. Compliance scores grade your fleet A to F.",
                icon: "\u2705",
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

          {/* 6-capability grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            {[
              {
                icon: "🔍",
                title: "AI Photo Triage",
                description: "Every defect photo is analysed by GPT-4o Vision the moment a driver submits it. The AI classifies severity (Low → Critical), identifies the defect type, and cites the relevant DVSA roadworthiness section — all before a manager has opened their laptop.",
                tag: "Real-Time · GPT-4o Vision",
                tagColor: "bg-violet-100 text-violet-700",
                stat: "< 3 seconds",
                statLabel: "from photo to DVSA classification",
              },
              {
                icon: "⚡",
                title: "Auto Defect Escalation",
                description: "If a defect is raised and nobody acts on it, the AI escalates it automatically every 4 hours — raising the severity and firing alerts to managers until it's resolved. Nothing sits ignored.",
                tag: "Every 4 hours",
                tagColor: "bg-orange-100 text-orange-700",
                stat: "Zero",
                statLabel: "defects fall through the cracks",
              },
              {
                icon: "🔎",
                title: "Inspection Chasing",
                description: "Every vehicle is supposed to have a daily walkaround. The AI checks at regular intervals — if a vehicle hasn't been inspected in 24 hours, managers are alerted automatically. No spreadsheet required.",
                tag: "Every 4 hours",
                tagColor: "bg-blue-100 text-blue-700",
                stat: "24h",
                statLabel: "maximum gap before auto-alert fires",
              },
              {
                icon: "⛽",
                title: "Fuel Anomaly Detection",
                description: "The agent compares every fuel entry against fleet averages. Unusually large fills or outliers are flagged immediately — catching misfuelling, data errors, and potential fraud before the month-end review.",
                tag: "Every 4 hours",
                tagColor: "bg-yellow-100 text-yellow-700",
                stat: "Instant",
                statLabel: "flag on anomalous fuel entry",
              },
              {
                icon: "🛡️",
                title: "MOT & Tax Monitoring",
                description: "Every morning the AI checks every vehicle's MOT, road tax, and service dates. If anything is expiring — or already expired — managers are alerted. Operating with an expired MOT is a criminal offence. The AI makes sure it never happens.",
                tag: "Daily at 08:00",
                tagColor: "bg-red-100 text-red-700",
                stat: "Daily",
                statLabel: "automated compliance scan",
              },
              {
                icon: "📋",
                title: "One-Click AI Audit Report",
                description: "Press one button. In under 30 seconds, the AI assesses your entire fleet across 6 compliance dimensions, assigns a letter grade (A–F), and tells you exactly what to fix to improve it — with a projected grade after actions. The kind of report that used to take a consultant half a day.",
                tag: "On Demand",
                tagColor: "bg-emerald-100 text-emerald-700",
                stat: "A–F grade",
                statLabel: "with projected uplift path",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="relative bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group flex flex-col"
                data-testid={`ai-feature-${index}`}
              >
                <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  {item.icon}
                </div>
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 w-fit ${item.tagColor}`}>
                  {item.tag}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm flex-1">{item.description}</p>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <span className="text-2xl font-black text-[#5B6CFF]">{item.stat}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{item.statLabel}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Live agent status + CTA row */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="bg-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-lg">Your compliance agent is always working</p>
                <p className="text-slate-400 text-sm">
                  MOT · Tax · Defects · Inspections · Fuel · Driver Hours — monitored 24/7 with zero manual input
                </p>
              </div>
            </div>
            <a
              href="#pricing"
              className="flex-shrink-0 bg-[#5B6CFF] hover:bg-[#4338ca] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap shadow-lg shadow-[#5B6CFF]/30"
            >
              See AI Pro pricing →
            </a>
          </motion.div>
        </div>
      </section>

      {/* Fleet Copilot Showcase */}
      <section className="py-20 lg:py-28 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="inline-flex items-center gap-2 bg-[#5B6CFF]/10 text-[#5B6CFF] px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                NEW — Fleet Copilot
              </motion.div>
              <motion.h2 variants={fadeUp} transition={{ duration: 0.5, delay: 0.05 }} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                Ask your fleet anything.<br />
                <span className="text-[#5B6CFF]">Get answers instantly.</span>
              </motion.h2>
              <motion.p variants={fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="text-lg text-slate-600 mb-8 leading-relaxed">
                Fleet Copilot is an AI assistant built into every transport manager's dashboard. It has live access to your fleet data and deep DVSA compliance knowledge — so you can ask plain-English questions and get accurate answers in seconds.
              </motion.p>
              <motion.div variants={staggerContainer} className="space-y-4 mb-10">
                {[
                  { icon: MapPin, text: "\"Who is near Sheffield right now?\" — shows live GPS locations instantly" },
                  { icon: FileCheck, text: "\"Did DE22NNX have mileage logged on 17 March?\" — pulls walkaround data" },
                  { icon: AlertTriangle, text: "\"Show me all open defects\" — instant fleet-wide defect summary" },
                  { icon: Clock, text: "\"How many hours can a driver work before a break?\" — DVSA rules on demand" },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} transition={{ duration: 0.4, delay: i * 0.08 }} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#5B6CFF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-[#5B6CFF]" />
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{item.text}</p>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div variants={fadeUp} transition={{ duration: 0.4, delay: 0.4 }} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-slate-700 font-medium">Saves transport managers <span className="text-slate-900 font-bold">hours every week</span> — no more digging through reports, chasing drivers, or switching between screens.</p>
              </motion.div>
            </motion.div>

            {/* Right: animated chat demo */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <CopilotDemo />
            </motion.div>
          </div>
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
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="shrink-0 self-center sm:self-start">
                <img 
                  src="/images/founder-headshot.png" 
                  alt="Jon - Founder" 
                  className="w-20 h-20 rounded-full object-cover border-4 border-slate-100"
                  data-testid="founder-image"
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  Questions? Talk to the Founder.
                </h3>
                <p className="text-slate-600 mb-5 leading-relaxed">
                  Hi, I'm Jon. I spent 6 months driving HGV Class 1 and got frustrated by fleet software that felt like it was built for offices, not cabs. So I built TitanFleet — simple, practical, and designed around how operators actually work. I'm still learning, still iterating, and I read every piece of feedback. If you have questions, you're talking to me.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="tel:07496188541"
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#5B6CFF] hover:bg-[#4A5AE8] text-white font-semibold rounded-xl transition-colors"
                    data-testid="button-call-jon"
                  >
                    <Phone className="h-5 w-5" />
                    Call Jon
                  </a>
                  <a
                    href="mailto:jon@titanfleet.co.uk"
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl transition-colors"
                    data-testid="button-book-call"
                  >
                    <Mail className="h-5 w-5" />
                    Book a 10-min Call with Jon
                  </a>
                </div>
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
                  <li><a href="https://wa.me/447496188541" target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm hover:text-white transition-colors">WhatsApp Us</a></li>
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

      {showVideo && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
          data-testid="video-modal-overlay"
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors"
              data-testid="button-close-video"
            >
              <X className="h-8 w-8" />
            </button>
            <video
              src="/titan_fleet_ad.mp4"
              controls
              autoPlay
              className="w-full rounded-2xl shadow-2xl"
              data-testid="video-demo"
            />
          </div>
        </div>
      )}
    </div>
  );
}
