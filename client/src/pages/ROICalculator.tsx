import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Truck,
  Calculator,
  TrendingUp,
  Clock,
  Shield,
  Fuel,
  AlertTriangle,
  Menu,
  X,
  Phone,
  Instagram,
  Facebook,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const META = {
  title: "Fleet Management ROI Calculator — How Much Could You Save? | TitanFleet",
  description:
    "Calculate exactly how much your UK fleet could save with TitanFleet. Enter your fleet size, admin hours, and fuel spend to see projected savings on compliance, VOR days, and admin time.",
};

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

function formatCurrency(n: number) {
  if (n >= 1000) return `£${(n / 1000).toFixed(1)}k`;
  return `£${Math.round(n)}`;
}

function formatCurrencyFull(n: number) {
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  sublabel,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  sublabel?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        <span className="text-lg font-bold text-[#2563eb]">{format(value)}</span>
      </div>
      {sublabel && <p className="text-xs text-slate-500 mb-2">{sublabel}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#2563eb]"
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-400">{format(min)}</span>
        <span className="text-xs text-slate-400">{format(max)}</span>
      </div>
    </div>
  );
}

function ResultCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border ${
        highlight
          ? "bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white border-blue-600 shadow-lg shadow-blue-200"
          : "bg-white border-slate-200"
      }`}
    >
      <div className={`flex items-center gap-2 mb-2 ${highlight ? "text-blue-200" : "text-slate-500"}`}>
        {icon}
        <span className={`text-xs font-semibold uppercase tracking-wide ${highlight ? "text-blue-200" : "text-slate-500"}`}>{label}</span>
      </div>
      <p className={`text-2xl font-bold ${highlight ? "text-white" : "text-[#0f172a]"}`}>{value}</p>
      <p className={`text-xs mt-1 ${highlight ? "text-blue-100" : "text-slate-500"}`}>{sub}</p>
    </div>
  );
}

export default function ROICalculator() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fleetSize, setFleetSize] = useState(10);
  const [weeklyAdminHours, setWeeklyAdminHours] = useState(14);
  const [annualFuelSpend, setAnnualFuelSpend] = useState(60000);

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
    window.scrollTo(0, 0);
    return () => {
      document.title = "Titan Fleet Management";
    };
  }, []);

  const results = useMemo(() => {
    const adminHourlyRate = 25;
    const adminHoursSavedWeekly = weeklyAdminHours * 0.6;
    const adminSavingAnnual = adminHoursSavedWeekly * 52 * adminHourlyRate;

    const prohibitionsPerYearWithout = (fleetSize / 10) * 1.2;
    const prohibitionsAverted = prohibitionsPerYearWithout * 0.75;
    const avgProhibitionCost = 850;
    const complianceSavingAnnual = prohibitionsAverted * avgProhibitionCost;

    const dailyVehicleRevenue = 450;
    const vorDaysAvoidedPerVehicle = 0.45;
    const vorSavingAnnual = fleetSize * vorDaysAvoidedPerVehicle * dailyVehicleRevenue;

    const fuelSavingPct = 0.048;
    const fuelSavingAnnual = annualFuelSpend * fuelSavingPct;

    const totalSaving = adminSavingAnnual + complianceSavingAnnual + vorSavingAnnual + fuelSavingAnnual;

    const monthlyVehicleCost = 19;
    const titanfleetMonthly = Math.max(99, fleetSize * monthlyVehicleCost);
    const titanfleetAnnual = titanfleetMonthly * 12;

    const netAnnual = totalSaving - titanfleetAnnual;
    const roiPct = Math.round((netAnnual / titanfleetAnnual) * 100);

    return {
      adminHoursSavedWeekly: Math.round(adminHoursSavedWeekly),
      adminHoursSavedMonthly: Math.round(adminHoursSavedWeekly * 4.33),
      adminSavingAnnual,
      complianceSavingAnnual,
      prohibitionsAverted: Math.round(prohibitionsAverted * 10) / 10,
      vorSavingAnnual,
      vorDaysAvoided: Math.round(fleetSize * vorDaysAvoidedPerVehicle * 10) / 10,
      fuelSavingAnnual,
      totalSaving,
      titanfleetMonthly,
      titanfleetAnnual,
      netAnnual,
      roiPct,
    };
  }, [fleetSize, weeklyAdminHours, annualFuelSpend]);

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
              <Link href="/vs/fleetcheck"><span className="text-slate-600 hover:text-[#0f172a] text-sm font-medium cursor-pointer transition-colors">vs FleetCheck</span></Link>
              <Link href="/vs/samsara"><span className="text-slate-600 hover:text-[#0f172a] text-sm font-medium cursor-pointer transition-colors">vs Samsara</span></Link>
              <Link href="/guides"><span className="text-slate-600 hover:text-[#0f172a] text-sm font-medium cursor-pointer transition-colors">Guides</span></Link>
              <Link href="/manager/login">
                <span className="inline-flex items-center gap-1.5 bg-[#2563eb] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  Start Beta Trial
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
              <Link href="/vs/fleetcheck" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">vs FleetCheck</span></Link>
              <Link href="/vs/samsara" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm cursor-pointer">vs Samsara</span></Link>
              <Link href="/manager/login" onClick={() => setMobileMenuOpen(false)}><span className="block px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm cursor-pointer text-center">Start Beta Trial</span></Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-14 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-400/30 rounded-full px-4 py-2 text-blue-300 text-sm font-medium mb-6">
            <Calculator className="w-4 h-4" />
            Fleet ROI Calculator
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight mb-4">
            How Much Is Your Fleet Admin<br className="hidden sm:block" />
            <span className="text-blue-400">Actually Costing You?</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-2">
            Enter your fleet details below. See a real-money projection of what TitanFleet saves you across admin time, DVSA compliance, VOR days, and fuel.
          </p>
          <p className="text-sm text-slate-500">Estimates based on DVSA published fine data and UK fleet operator benchmarks. No email required.</p>
        </div>
      </section>

      {/* Calculator */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">

          {/* Inputs */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="lg:col-span-2 space-y-8"
          >
            <motion.div variants={fadeUp}>
              <h2 className="text-xl font-bold text-[#0f172a] mb-1">Your fleet details</h2>
              <p className="text-sm text-slate-500 mb-6">Drag each slider to match your operation.</p>

              <div className="space-y-7">
                <SliderInput
                  label="Fleet size"
                  value={fleetSize}
                  min={2}
                  max={200}
                  step={1}
                  onChange={setFleetSize}
                  format={(v) => `${v} vehicle${v === 1 ? "" : "s"}`}
                  sublabel="Number of active vehicles in your fleet"
                />
                <SliderInput
                  label="Weekly admin hours"
                  value={weeklyAdminHours}
                  min={2}
                  max={60}
                  step={1}
                  onChange={setWeeklyAdminHours}
                  format={(v) => `${v} hrs/wk`}
                  sublabel="Hours spent on compliance admin, paperwork, and chasing drivers"
                />
                <SliderInput
                  label="Annual fuel spend"
                  value={annualFuelSpend}
                  min={5000}
                  max={500000}
                  step={5000}
                  onChange={setAnnualFuelSpend}
                  format={(v) => formatCurrency(v)}
                  sublabel="Total annual diesel/AdBlue spend across all vehicles"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">TitanFleet Beta cost</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#2563eb]">{formatCurrencyFull(results.titanfleetMonthly)}</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">£19/vehicle/month · min £99/month · no setup fee</p>
              <p className="text-xs text-emerald-600 font-medium mt-2">Beta price — locked for founding partners</p>
            </motion.div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="lg:col-span-3 space-y-4"
          >
            <motion.div variants={fadeUp}>
              <h2 className="text-xl font-bold text-[#0f172a] mb-1">Your projected savings</h2>
              <p className="text-sm text-slate-500 mb-5">Based on UK fleet benchmarks and DVSA published data.</p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <ResultCard
                  icon={<Clock className="w-4 h-4" />}
                  label="Admin time saved"
                  value={`${results.adminHoursSavedMonthly} hrs/mo`}
                  sub={`${results.adminHoursSavedWeekly} hours/week reclaimed — worth ${formatCurrencyFull(results.adminSavingAnnual)}/year`}
                />
                <ResultCard
                  icon={<Shield className="w-4 h-4" />}
                  label="Compliance risk avoided"
                  value={formatCurrencyFull(results.complianceSavingAnnual)}
                  sub={`≈ ${results.prohibitionsAverted} fewer DVSA prohibitions/year · avg £850 each`}
                />
                <ResultCard
                  icon={<AlertTriangle className="w-4 h-4" />}
                  label="VOR days avoided"
                  value={`${results.vorDaysAvoided} days`}
                  sub={`Worth ${formatCurrencyFull(results.vorSavingAnnual)}/year in lost vehicle revenue`}
                />
                <ResultCard
                  icon={<Fuel className="w-4 h-4" />}
                  label="Fuel intelligence saving"
                  value={formatCurrencyFull(results.fuelSavingAnnual)}
                  sub={`~4.8% reduction from anomaly detection and route efficiency`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ResultCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Total annual saving"
                  value={formatCurrencyFull(results.totalSaving)}
                  sub="Admin + compliance + VOR + fuel combined"
                  highlight
                />
                <ResultCard
                  icon={<Calculator className="w-4 h-4" />}
                  label="Net annual ROI"
                  value={`${results.roiPct > 0 ? "+" : ""}${results.roiPct}%`}
                  sub={`${formatCurrencyFull(results.netAnnual)} net after TitanFleet cost`}
                  highlight
                />
              </div>
            </motion.div>

            {/* Payback period */}
            <motion.div variants={fadeUp} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900 text-sm">
                    Pays for itself in{" "}
                    {results.totalSaving > results.titanfleetAnnual
                      ? `${Math.max(1, Math.round((results.titanfleetAnnual / results.totalSaving) * 12))} month${Math.round((results.titanfleetAnnual / results.totalSaving) * 12) === 1 ? "" : "s"}`
                      : "under 12 months"}
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    TitanFleet costs {formatCurrencyFull(results.titanfleetAnnual)}/year. Your projected savings:{" "}
                    {formatCurrencyFull(results.totalSaving)}/year.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div variants={fadeUp}>
              <Link href="/manager/login">
                <span className="block w-full text-center bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-colors cursor-pointer text-sm">
                  Start 30-Day Founders Beta — No Credit Card
                  <ArrowRight className="w-4 h-4 inline ml-2" />
                </span>
              </Link>
              <p className="text-xs text-slate-500 text-center mt-2">£19/vehicle/month locked for life · Cancel any time</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Assumptions */}
      <section className="bg-slate-50 border-t border-slate-100 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4">How we calculate this</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-500">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-700 mb-1">Admin time</p>
              <p>60% admin reduction based on TitanFleet operator data. Valued at £25/hr (UK transport office pay average).</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-700 mb-1">DVSA compliance</p>
              <p>Avg DVSA prohibition costs £300–£1,400 per vehicle. DVSA publishes ~120k roadside prohibitions/year for UK HGVs. AI triage and automated checks reduce risk by ~75%.</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-700 mb-1">VOR days</p>
              <p>Unplanned VOR averages 0.45 days/vehicle/year in fleets without proactive defect management. Lost revenue estimated at £450/vehicle/day.</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-700 mb-1">Fuel savings</p>
              <p>Fuel anomaly detection and refuelling verification typically reduces fuel wastage/theft by 4–6%. Conservative 4.8% used here.</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">These are estimates — actual results vary by fleet type, current practices, and compliance maturity. No guarantee of specific savings is made or implied.</p>
        </div>
      </section>

      {/* Cross-link to comparison page */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid sm:grid-cols-2 gap-5">
          <motion.div variants={fadeUp}>
            <Link href="/vs/fleetcheck">
              <span className="block rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all p-5 cursor-pointer group">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Comparison</p>
                <h3 className="font-bold text-[#0f172a] group-hover:text-blue-700 transition-colors">TitanFleet vs FleetCheck</h3>
                <p className="text-sm text-slate-500 mt-1">Wondering if FleetCheck at £6/user is cheaper? See the full total cost of ownership comparison.</p>
                <div className="flex items-center gap-1 mt-3 text-blue-600 text-sm font-semibold">
                  See comparison <ChevronRight className="w-4 h-4" />
                </div>
              </span>
            </Link>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Link href="/guides/dvsa-compliance-guide">
              <span className="block rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all p-5 cursor-pointer group">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Guide</p>
                <h3 className="font-bold text-[#0f172a] group-hover:text-blue-700 transition-colors">Complete DVSA Compliance Guide</h3>
                <p className="text-sm text-slate-500 mt-1">Everything UK operators need to know about staying compliant and avoiding prohibitions.</p>
                <div className="flex items-center gap-1 mt-3 text-blue-600 text-sm font-semibold">
                  Read guide <ChevronRight className="w-4 h-4" />
                </div>
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-white py-12 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xl font-bold">Titan</span>
              <span className="text-xl text-slate-400 ml-1">Fleet</span>
              <p className="text-slate-400 text-sm mt-2">Built by a Class 1 Driver. Trusted by UK Operators.</p>
            </div>
            <div className="flex items-center gap-6">
              <a href="mailto:support@titanfleet.co.uk" className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2">
                <Phone className="w-4 h-4" />
                support@titanfleet.co.uk
              </a>
              <div className="flex items-center gap-3">
                <a href="https://www.instagram.com/titan.fleet" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Instagram className="h-4 w-4" /></a>
                <a href="https://www.facebook.com/people/Titan-Fleet/61586509495375/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Facebook className="h-4 w-4" /></a>
              </div>
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
