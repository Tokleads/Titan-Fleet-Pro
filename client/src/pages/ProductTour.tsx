import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

function useParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handler = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      setOffset((center - viewCenter) * 0.06);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return { ref, offset };
}

function BrowserFrame({ src, alt }: { src: string; alt: string }) {
  const { ref, offset } = useParallax();
  return (
    <div ref={ref} style={{ transform: `translateY(${offset}px)` }} className="w-full max-w-[900px] mx-auto">
      <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10">
        <div className="bg-[#1e293b] px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-[#0f172a] rounded-md px-3 py-1 text-xs text-slate-400 text-center truncate">app.titanfleet.co.uk</div>
          </div>
        </div>
        <img src={src} alt={alt} className="w-full block" loading="lazy" />
      </div>
    </div>
  );
}

function PhoneFrame({ src, alt }: { src: string; alt: string }) {
  const { ref, offset } = useParallax();
  return (
    <div ref={ref} style={{ transform: `translateY(${offset}px)` }} className="w-full max-w-[320px] mx-auto">
      <div className="rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border-[6px] border-slate-700 bg-black relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-10" />
        <img src={src} alt={alt} className="w-full block" loading="lazy" />
      </div>
    </div>
  );
}

interface TourSection {
  id: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  type: "browser" | "phone";
  features?: string[];
}

const sections: TourSection[] = [
  {
    id: "dashboard",
    title: "Your Fleet Command Centre",
    description: "A single dashboard with live KPIs, compliance scores, real-time alerts, and an interactive driver map. Everything your transport manager needs — at a glance.",
    image: "/images/tour/dashboard_main.png",
    imageAlt: "Manager dashboard with KPIs and live driver map",
    type: "browser",
    features: ["Live compliance score", "Instant alerts & notifications", "Interactive driver map", "Key fleet KPIs"],
  },
  {
    id: "tracking",
    title: "Track Every Vehicle, Live",
    description: "Real-time GPS tracking with stagnation alerts, route history, and geofence triggers. Know exactly where every driver and vehicle is, right now.",
    image: "/images/tour/dashboard_map.png",
    imageAlt: "Live GPS tracking with real map and driver locations",
    type: "browser",
    features: ["Real-time GPS positions", "Stagnation detection", "Geofence-based alerts", "Route history playback"],
  },
  {
    id: "drivers",
    title: "188 Drivers, One View",
    description: "View every driver's status, shift hours, licence expiry, and compliance at a glance. Filter, search, and take action from a single powerful grid.",
    image: "/images/tour/dashboard_drivers.png",
    imageAlt: "Driver grid with 188 drivers and status cards",
    type: "browser",
    features: ["Driver status cards", "Shift & hours tracking", "Licence expiry alerts", "Bulk actions"],
  },
  {
    id: "inspections",
    title: "DVSA-Aligned Walk-Around Checks",
    description: "Digital vehicle inspections aligned with DVSA standards. Drivers submit checks from their phone; managers see results instantly with pass/defect breakdowns.",
    image: "/images/tour/dashboard_inspections.png",
    imageAlt: "Inspection records with pass and defect results",
    type: "browser",
    features: ["DVSA-compliant checklists", "Photo evidence capture", "Instant defect flagging", "Full audit trail"],
  },
  {
    id: "defects",
    title: "AI-Powered Defect Management",
    description: "A visual kanban board to track every defect from report to resolution. AI classifies severity, assigns priority, and keeps your fleet roadworthy.",
    image: "/images/tour/dashboard_defects.png",
    imageAlt: "Defect kanban board showing Open, In Progress, and Resolved",
    type: "browser",
    features: ["Kanban workflow", "AI severity classification", "Photo & notes attachments", "Resolution tracking"],
  },
  {
    id: "timesheets",
    title: "Automated Time Tracking",
    description: "Geofence-based arrival and departure timestamps generate accurate timesheets automatically. Export to payroll with one click — no more paper sheets.",
    image: "/images/tour/dashboard_timesheets.png",
    imageAlt: "Automated timesheets with hours and geofence data",
    type: "browser",
    features: ["Geofence clock-in/out", "Automated hour calculations", "One-click payroll export", "Overtime & break tracking"],
  },
  {
    id: "driver-app",
    title: "Built for Drivers",
    description: "A mobile-first app designed for drivers who don't want complexity. Log in with a company code and 4-digit PIN. Complete inspections, report defects, and log deliveries in seconds.",
    image: "/images/tour/driver_app_home.png",
    imageAlt: "Mobile driver app login screen",
    type: "phone",
    features: ["PIN-based login", "Walk-around checks", "Proof of delivery", "One-tap defect reports"],
  },
];

export default function ProductTour() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => {
      document.documentElement.style.scrollBehavior = "";
      window.removeEventListener("scroll", handler);
    };
  }, []);

  return (
    <div className="bg-[#0b1121] text-white min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        .tour-heading { font-family: 'Oswald', sans-serif; }
        @keyframes tour-fade-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tour-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tour-slide-left { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes tour-slide-right { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes tour-scale-in { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        .animate-tour-fade-up { animation: tour-fade-up 0.8s ease-out forwards; }
        .animate-tour-fade-in { animation: tour-fade-in 0.6s ease-out forwards; }
        .animate-tour-slide-left { animation: tour-slide-left 0.8s ease-out forwards; }
        .animate-tour-slide-right { animation: tour-slide-right 0.8s ease-out forwards; }
        .animate-tour-scale-in { animation: tour-scale-in 0.8s ease-out forwards; }
        .tour-hidden { opacity: 0; }
      `}</style>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-[#0b1121]/95 backdrop-blur-md shadow-lg shadow-black/20 border-b border-white/5" : "bg-transparent"
        }`}
        data-testid="tour-header"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" data-testid="link-home">
            <span className="tour-heading text-xl font-bold tracking-wider text-white cursor-pointer">
              TITAN<span className="text-[#5B6CFF]">FLEET</span>
            </span>
          </Link>
          <Link href="/manager/login" data-testid="link-start-trial-header">
            <span className="inline-flex items-center px-5 py-2 bg-[#5B6CFF] hover:bg-[#4A5AE8] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
              Start Free Trial
            </span>
          </Link>
        </div>
      </header>

      <HeroSection />

      {sections.map((section, i) => (
        <FeatureSection key={section.id} section={section} index={i} />
      ))}

      <CTASection />
    </div>
  );
}

function HeroSection() {
  const { ref, isVisible } = useInView(0.1);
  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      data-testid="tour-hero"
    >
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#5B6CFF]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
      </div>
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className={`${isVisible ? "animate-tour-fade-up" : "tour-hidden"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5B6CFF]/10 border border-[#5B6CFF]/20 text-[#8B9AFF] text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-[#5B6CFF] animate-pulse" />
            Interactive Product Tour
          </div>
        </div>
        <h1
          className={`tour-heading text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6 tracking-tight ${
            isVisible ? "animate-tour-fade-up" : "tour-hidden"
          }`}
          style={{ animationDelay: "0.15s" }}
          data-testid="text-hero-title"
        >
          See Titan Fleet
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B6CFF] to-[#818CF8]">in Action</span>
        </h1>
        <p
          className={`text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed ${
            isVisible ? "animate-tour-fade-up" : "tour-hidden"
          }`}
          style={{ animationDelay: "0.3s" }}
          data-testid="text-hero-subtitle"
        >
          Take a guided tour through the platform trusted by UK haulage operators
          to manage drivers, vehicles, compliance, and timesheets — all from one dashboard.
        </p>
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center ${isVisible ? "animate-tour-fade-up" : "tour-hidden"}`}
          style={{ animationDelay: "0.45s" }}
        >
          <a
            href="#dashboard"
            className="inline-flex items-center justify-center h-14 px-8 bg-[#5B6CFF] hover:bg-[#4A5AE8] text-white font-semibold rounded-xl transition-colors text-lg"
            data-testid="button-start-tour"
          >
            Start the Tour ↓
          </a>
          <Link href="/manager/login" data-testid="link-try-free-hero">
            <span className="inline-flex items-center justify-center h-14 px-8 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors text-lg cursor-pointer">
              Try It Free
            </span>
          </Link>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
        </svg>
      </div>
    </section>
  );
}

function FeatureSection({ section, index }: { section: TourSection; index: number }) {
  const { ref, isVisible } = useInView(0.12);
  const isEven = index % 2 === 0;
  const isPhone = section.type === "phone";

  return (
    <section
      ref={ref}
      id={section.id}
      className="min-h-screen flex items-center py-20 sm:py-24 relative overflow-hidden"
      data-testid={`tour-section-${section.id}`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute w-[300px] h-[300px] rounded-full blur-[100px] ${
            isEven ? "bg-[#5B6CFF]/5 top-1/3 right-0" : "bg-indigo-500/5 bottom-1/3 left-0"
          }`}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className={`flex flex-col ${isPhone ? "items-center" : isEven ? "lg:flex-row" : "lg:flex-row-reverse"} gap-12 lg:gap-16 items-center`}>
          <div className={`flex-1 ${isPhone ? "text-center max-w-xl" : ""}`}>
            <div className={`${isVisible ? (isEven ? "animate-tour-slide-right" : "animate-tour-slide-left") : "tour-hidden"}`}>
              <span className="text-[#5B6CFF] text-sm font-semibold tracking-widest uppercase mb-3 block">
                {String(index + 1).padStart(2, "0")} / {String(sections.length).padStart(2, "0")}
              </span>
              <h2
                className="tour-heading text-4xl sm:text-5xl font-bold mb-5 tracking-tight"
                data-testid={`text-title-${section.id}`}
              >
                {section.title}
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg" data-testid={`text-desc-${section.id}`}>
                {section.description}
              </p>
              {section.features && (
                <ul className={`space-y-3 ${isPhone ? "inline-block text-left" : ""}`}>
                  {section.features.map((f, fi) => (
                    <li
                      key={fi}
                      className={`flex items-center gap-3 text-slate-300 ${isVisible ? "animate-tour-fade-up" : "tour-hidden"}`}
                      style={{ animationDelay: `${0.3 + fi * 0.1}s` }}
                    >
                      <span className="w-6 h-6 rounded-full bg-[#5B6CFF]/15 flex items-center justify-center flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5B6CFF" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={`${isPhone ? "w-full max-w-[320px]" : "flex-1 w-full"}`}>
            <div className={`${isVisible ? "animate-tour-scale-in" : "tour-hidden"}`} style={{ animationDelay: "0.2s" }}>
              {isPhone ? (
                <PhoneFrame src={section.image} alt={section.imageAlt} />
              ) : (
                <BrowserFrame src={section.image} alt={section.imageAlt} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { ref, isVisible } = useInView(0.15);
  return (
    <section
      ref={ref}
      className="min-h-[70vh] flex items-center justify-center py-20 relative overflow-hidden"
      data-testid="tour-cta"
    >
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5B6CFF]/8 rounded-full blur-[150px]" />
      </div>
      <div className={`relative z-10 text-center px-4 max-w-3xl mx-auto ${isVisible ? "animate-tour-fade-up" : "tour-hidden"}`}>
        <h2 className="tour-heading text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight" data-testid="text-cta-title">
          Ready to Transform
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B6CFF] to-[#818CF8]">Your Fleet?</span>
        </h2>
        <p className="text-slate-400 text-lg sm:text-xl mb-4 leading-relaxed">
          Join hundreds of UK haulage operators already using Titan Fleet to cut admin,
          stay compliant, and keep drivers happy.
        </p>
        <p className="text-slate-500 text-base mb-10">
          Plans from <span className="text-white font-semibold">£59/month</span> · No setup fees · Cancel anytime
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/manager/login" data-testid="link-start-trial-cta">
            <span className="inline-flex items-center justify-center h-14 px-10 bg-[#5B6CFF] hover:bg-[#4A5AE8] text-white font-semibold rounded-xl transition-colors text-lg cursor-pointer">
              Start Your Free Trial
            </span>
          </Link>
          <Link href="/demo" data-testid="link-demo-cta">
            <span className="inline-flex items-center justify-center h-14 px-10 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors text-lg cursor-pointer">
              View Live Demo
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
