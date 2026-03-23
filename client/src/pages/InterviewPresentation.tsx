import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Monitor, Maximize2 } from "lucide-react";

const slides = [
  {
    panel: "PANEL Q1",
    question: "Tell me about a time you worked effectively as part of a team.",
    screenshot: "/screenshot-vehicle-vor.png",
    screenshotCaption: "Chris submits a failed safety check on BT71TVM → the vehicle is auto-flagged Off Road (VOR) and an open defect is raised — Robert sees it without a phone call",
    star: {
      situation: "TitanFleet required balancing Thomas (Owner), Robert (Transport Manager), mechanics, and drivers like Chris — all with conflicting priorities and no shared language for what \"good\" looked like.",
      task: "Create a unified workflow where data flows seamlessly from a driver's phone check through to the mechanic's defect queue and the manager's compliance dashboard.",
      action: "Ran \"show and tell\" sessions bringing Robert and Chris together around the same live prototype — not separate sessions. Listened to Chris's frustration with small touch targets at the same time as Robert's need for auditable legal records.",
      result: "100% driver adoption within 30 days, with no training required. Built by valuing collaboration over hierarchy — the tool was shaped by the people who use it, not imposed on them.",
    },
    improvements: null,
  },
  {
    panel: "PANEL Q2",
    question: "How do you communicate design decisions to non-design stakeholders?",
    screenshot: "/screenshot-copilot-defects.png",
    screenshotCaption: "Robert asks \"Show me all open defects\" — the Copilot returns vehicle, defect type, severity, and reporter in seconds. This was the prototype I sat Thomas in front of instead of a Figma deck",
    star: {
      situation: "Debate arose about whether the driver app should include detailed mechanical jargon in its check items — Thomas (Owner) wanted specificity; my research showed it caused abandonment in the field.",
      task: "Communicate why a simplified, guided interface produces better compliance outcomes than a complex, jargon-heavy one — without it becoming a design lecture.",
      action: "Instead of a document or a Figma deck, I built two working prototypes and sat with Thomas for 20 minutes. Framed it as business risk: \"This version causes check abandonment in poor light — that's a DVSA liability.\" Live code made the argument for me.",
      result: "Consensus reached in one session. Thomas adopted the guided approach. Compliance score went up. No DVSA enforcement issues since go-live.",
    },
    improvements: {
      label: "WCAG 2.2 applied here",
      items: [
        { before: "Jargon-heavy form fields causing abandonment", after: "Guided one-thing-per-screen flow — cognitive load eliminated" },
        { before: "Static Figma deck used to justify decisions", after: "Live functional prototype — Thomas could click, not just look" },
      ],
    },
  },
  {
    panel: "PANEL Q3",
    question: "How have you used research to inform your designs?",
    screenshot: "/screenshot-mileage-prefill.png",
    screenshotCaption: "Mileage pre-filled from last inspection — the app eliminates redundant entry (WCAG 2.2, criterion 3.3.7). Research revealed drivers were re-entering the same number every morning",
    star: {
      situation: "Initial assumptions suggested drivers just needed a digital version of their paper form. The client expected a straightforward digitisation — no one thought to question the form itself.",
      task: "Validate whether a digitised form would actually solve the compliance failure problem — or whether the problem was something else entirely.",
      action: "Contextual inquiry at 6 AM — shadowing Chris during live shift starts. Observed oily hands, direct sun glare, and two critical gaps: drivers didn't know if the MOT was current (they assumed it was fine), and every morning they re-typed the same mileage figure they'd entered the day before.",
      result: "Research led to two direct design changes: the DVSA MOT API integration (the app shows live status instead of asking drivers to know it), and mileage pre-filled from the previous inspection — eliminating redundant entry every single shift. Zero DVSA compliance failures since go-live.",
    },
    improvements: {
      label: "Research-driven WCAG changes",
      items: [
        { before: "Touch targets: standard form size (~20px) — drivers missed on first tap", after: "Touch targets: 56px minimum — designed for cold-weather gloves (exceeds 44px GDS standard)" },
        { before: "maximum-scale=1 blocked pinch-zoom on driver phones", after: "Zoom restriction removed — low-vision drivers can now scale freely (WCAG 1.4.4)" },
      ],
    },
  },
  {
    panel: "PANEL Q4",
    question: "Tell me about a time you led a team through a difficult challenge to help deliver a positive outcome.",
    screenshot: "/screenshot-defect-photo.png",
    screenshotCaption: "Defect #18 — BT71TVM tyre condition / wear, severity HIGH. Photo taken by the driver at the roadside. AI re-analysis on demand. The mechanic could no longer claim it 'wasn't there'",
    star: {
      situation: "After go-live, mechanics found the defect reports from drivers too vague to act on — no photos, no location, just text. This created an \"us vs them\" dynamic threatening the safety feedback loop at the heart of the product.",
      task: "Resolve the conflict between drivers and mechanics before it eroded trust in the system, without slipping the broader roadmap.",
      action: "Facilitated a joint session between Robert and the mechanics, then designed a Photo Evidence feature — drivers photograph defects in-app and the image attaches directly to the open defect record. Reprioritised the sprint, managed Thomas's timeline expectations, and shipped within the week.",
      result: "Photo evidence became the most-used feature in the app. A point of conflict became a point of collaboration — and contributed directly to zero unresolved safety defects in the first quarter.",
    },
    improvements: null,
  },
  {
    panel: "BEFORE / AFTER",
    question: "Demonstrable WCAG 2.2 improvements made during development",
    screenshot: "/screenshot-mot-dates.png",
    screenshotCaption: "Key compliance dates tracked automatically — MOT, Tax, Tachograph calibration. No more spreadsheets or manual reminders",
    star: null,
    improvements: null,
    isBeforeAfter: true,
    beforeAfterItems: [
      {
        criterion: "1.4.4 — Resize Text",
        before: { label: "BLOCKED", detail: "viewport meta had maximum-scale=1 — pinch zoom disabled site-wide on all mobile devices" },
        after: { label: "FIXED", detail: "maximum-scale removed. Low-vision users can zoom freely on every page, driver and manager" },
      },
      {
        criterion: "3.3.7 — Redundant Entry (new in WCAG 2.2)",
        before: { label: "FAILING", detail: "Driver completed signup, saw company code on screen, then had to type it again on the login page" },
        after: { label: "FIXED", detail: "Company code passes through the URL (?code=XXXX). Login pre-fills it automatically with a confirmation message" },
      },
      {
        criterion: "1.3.5 — Identify Input Purpose",
        before: { label: "MISSING", detail: "Registration and signup forms had no autocomplete attributes — browsers couldn't assist users" },
        after: { label: "ADDED", detail: "autocomplete=\"name\", \"organization\", \"email\", \"tel\", \"new-password\" on all relevant fields" },
      },
      {
        criterion: "2.5.3 — Target Size (driver app)",
        before: { label: "RISK", detail: "Standard form inputs ~32px — drivers in gloves regularly missed targets, causing abandonment" },
        after: { label: "56px", detail: "All driver-facing interactive elements raised to 56px minimum — exceeds WCAG 2.2 AA 24px and GDS 44px" },
      },
    ],
  },
];

const COLORS = {
  situation: { dot: "bg-amber-400", label: "text-amber-400", border: "border-amber-400/20 bg-amber-400/5" },
  task: { dot: "bg-blue-400", label: "text-blue-400", border: "border-blue-400/20 bg-blue-400/5" },
  action: { dot: "bg-orange-400", label: "text-orange-400", border: "border-orange-400/20 bg-orange-400/5" },
  result: { dot: "bg-indigo-400", label: "text-indigo-400", border: "border-indigo-400/20 bg-indigo-400/5" },
};

function StarCard({ label, text, color }: { label: string; text: string; color: keyof typeof COLORS }) {
  const c = COLORS[color];
  return (
    <div className={`border rounded-xl p-4 ${c.border}`}>
      <p className={`text-xs font-bold tracking-widest mb-2 ${c.label}`}>{label.toUpperCase()}</p>
      <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
    </div>
  );
}

export default function InterviewPresentation() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = useCallback((idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  const prev = useCallback(() => { if (current > 0) go(current - 1); }, [current, go]);
  const next = useCallback(() => { if (current < slides.length - 1) go(current + 1); }, [current, go]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  const slide = slides[current];

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#5B6CFF] flex items-center justify-center text-xs font-bold">TF</div>
          <span className="text-sm text-slate-400 font-medium">TitanFleet — Senior Interaction Designer Interview</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Dot navigation */}
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                title={s.panel}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-6 h-2.5 bg-[#5B6CFF]"
                    : "w-2.5 h-2.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500 font-mono">{current + 1} / {slides.length}</span>
          <a
            href="https://titanfleet.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Monitor className="w-3.5 h-3.5" />
            titanfleet.co.uk
          </a>
        </div>
      </div>

      {/* Slide area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col"
          >
            {slide.isBeforeAfter ? (
              <BeforeAfterSlide slide={slide} />
            ) : (
              <MainSlide slide={slide} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between px-8 py-4 border-t border-white/10">
        <button
          onClick={prev}
          disabled={current === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <div className="flex gap-1">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
                i === current
                  ? "bg-[#5B6CFF] text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {s.panel}
            </button>
          ))}
        </div>
        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function MainSlide({ slide }: { slide: typeof slides[0] }) {
  return (
    <div className="flex-1 grid lg:grid-cols-2 gap-0 overflow-hidden">
      {/* Left: content */}
      <div className="flex flex-col justify-center px-10 py-8 overflow-y-auto">
        <div className="mb-5">
          <span className="inline-block bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full tracking-wider mb-4">
            {slide.panel}
          </span>
          <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
            {slide.question}
          </h1>
        </div>

        {slide.star && (
          <div className="space-y-3">
            <StarCard label="Situation" text={slide.star.situation} color="situation" />
            <StarCard label="Task" text={slide.star.task} color="task" />
            <StarCard label="Action" text={slide.star.action} color="action" />
            <StarCard label="Result" text={slide.star.result} color="result" />
          </div>
        )}

        {slide.improvements && (
          <div className="mt-4 p-4 rounded-xl border border-[#5B6CFF]/30 bg-[#5B6CFF]/5">
            <p className="text-xs font-bold text-[#5B6CFF] tracking-wider mb-3">{slide.improvements.label.toUpperCase()}</p>
            <div className="space-y-2">
              {slide.improvements.items.map((item, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-start gap-2 text-red-400/80">
                    <span className="mt-0.5 flex-shrink-0">✕</span>
                    <span>{item.before}</span>
                  </div>
                  <div className="flex items-start gap-2 text-emerald-400">
                    <span className="mt-0.5 flex-shrink-0">✓</span>
                    <span>{item.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: screenshot */}
      <div className="relative bg-slate-900/50 border-l border-white/10 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full rounded-xl shadow-2xl border border-white/10 bg-black/20">
          <img
            src={slide.screenshot!}
            alt={slide.panel}
            className="w-full object-contain"
          />
        </div>
        {slide.screenshotCaption && (
          <p className="mt-3 text-xs text-slate-500 text-center italic max-w-sm">
            {slide.screenshotCaption}
          </p>
        )}
      </div>
    </div>
  );
}

function BeforeAfterSlide({ slide }: { slide: typeof slides[0] }) {
  return (
    <div className="flex-1 grid lg:grid-cols-[3fr_2fr] overflow-hidden">
      {/* Left: table */}
      <div className="flex flex-col px-10 py-8 overflow-y-auto">
        <div className="mb-6">
          <span className="inline-block bg-[#5B6CFF] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider mb-4">
            {slide.panel}
          </span>
          <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
            {slide.question}
          </h1>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 mb-3 px-1">
            <p className="text-xs font-bold text-slate-400 tracking-wider">WCAG 2.2 CRITERION</p>
            <p className="text-xs font-bold text-red-400 tracking-wider">BEFORE</p>
            <p className="text-xs font-bold text-emerald-400 tracking-wider">AFTER</p>
          </div>

          <div className="space-y-2.5">
            {slide.beforeAfterItems?.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="grid grid-cols-[2fr_1fr_1fr] gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <p className="text-sm font-bold text-white leading-snug">{item.criterion}</p>
                <div className="border-l border-red-400/20 pl-3">
                  <span className="inline-block text-xs font-bold bg-red-400/10 text-red-400 px-2 py-0.5 rounded-full mb-1">
                    {item.before.label}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.before.detail}</p>
                </div>
                <div className="border-l border-emerald-400/20 pl-3">
                  <span className="inline-block text-xs font-bold bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full mb-1">
                    {item.after.label}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.after.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-5 p-4 rounded-xl bg-[#5B6CFF]/10 border border-[#5B6CFF]/30">
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="font-bold text-white">Senior takeaway: </span>
              These weren't retrofitted for compliance. Each came from a real user need observed in the field — oily hands, glare, drivers who couldn't zoom, a signup flow that made people re-type what they'd just been shown. WCAG 2.2 gave the framework; research gave the reason.
            </p>
          </div>
        </div>
      </div>

      {/* Right: supporting screenshot */}
      <div className="bg-slate-900/50 border-l border-white/10 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full rounded-xl shadow-2xl border border-white/10 bg-black/20">
          <img
            src={slide.screenshot!}
            alt="Key compliance dates"
            className="w-full object-contain"
          />
        </div>
        {slide.screenshotCaption && (
          <p className="mt-3 text-xs text-slate-500 text-center italic max-w-xs">
            {slide.screenshotCaption}
          </p>
        )}
      </div>
    </div>
  );
}
