import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Truck, Shield, Zap, Bot, Star, ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";

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

interface Plan {
  name: string;
  pricePerVehicle: number;          // monthly
  annualPricePerVehicle: number;    // monthly billed annually (~17% off)
  tagline: string;
  icon: React.ElementType;
  highlight?: boolean;
  badge?: string;
  features: string[];
  aiFeatures?: string[];
}

const plans: Plan[] = [
  {
    name: "Core",
    pricePerVehicle: 12,
    annualPricePerVehicle: 10,
    tagline: "Full DVSA compliance, zero paper",
    icon: Shield,
    features: [
      "DVSA-compliant daily walkarounds",
      "Photo defect reporting & tracking",
      "Fuel & AdBlue logging",
      "Driver PIN authentication",
      "MOT / Tax / Service auto-alerts",
      "Auto-VOR on failed inspections",
      "Driver-to-manager messaging",
      "PDF & CSV export",
      "14-day free trial",
    ],
  },
  {
    name: "Professional",
    pricePerVehicle: 18,
    annualPricePerVehicle: 15,
    tagline: "Operations command centre",
    icon: Zap,
    badge: "Most Popular",
    features: [
      "Everything in Core",
      "Live GPS tracking",
      "Driver clock-in / timesheets",
      "Geofence auto clock-in",
      "Proof of Delivery (POD)",
      "Digital signatures & photos",
      "Fleet analytics & reports",
      "White-label branding",
      "Operator licence management",
    ],
  },
  {
    name: "AI Pro",
    pricePerVehicle: 25,
    annualPricePerVehicle: 21,
    tagline: "Autonomous compliance — 24/7 AI",
    icon: Bot,
    highlight: true,
    badge: "AI-Powered",
    features: [
      "Everything in Professional",
      "AI photo triage (GPT-4o Vision)",
      "Autonomous compliance agent",
      "One-click AI Audit Report",
      "Inspection chasing — auto-alerts",
      "Fuel anomaly detection",
      "Predictive maintenance alerts",
      "Defect auto-escalation",
      "DVSA-referenced AI analysis",
    ],
    aiFeatures: [
      "AI photo triage (GPT-4o Vision)",
      "One-click AI Audit Report",
      "Predictive maintenance alerts",
    ],
  },
];

const MIN_VEHICLES = 1;
const MAX_VEHICLES = 150;

export default function PricingSection({ referralCode }: { referralCode?: string } = {}) {
  const [vehicleCount, setVehicleCount] = useState<number>(1);
  const [isAnnual, setIsAnnual] = useState<boolean>(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (planName: string) => {
    setCheckoutLoading(planName);
    try {
      const productsRes = await fetch('/api/stripe/products');
      const { products } = await productsRes.json();
      const product = products?.find((p: any) =>
        p.name?.toLowerCase() === planName.toLowerCase() ||
        p.metadata?.tier === planName.toLowerCase()
      );
      if (!product || !product.prices?.length) {
        alert('This plan is not yet available. Please contact support@titanfleet.co.uk');
        return;
      }
      const priceId = product.prices[0].id;
      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, referralCode, vehicleCount }),
      });
      const { url } = await checkoutRes.json();
      if (url) window.location.href = url;
    } catch {
      alert('Something went wrong. Please try again or email support@titanfleet.co.uk');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 bg-white/5 text-slate-300 text-sm font-semibold px-4 py-2 rounded-full mb-5 border border-white/10"
          >
            <Truck className="h-4 w-4 text-emerald-400" />
            Per-vehicle pricing — pay for what you use
          </motion.div>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
          >
            Transparent Pricing.<br className="hidden sm:block" />
            <span className="text-emerald-400">Scales with your fleet.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            No flat tiers. No hidden limits. You pay per vehicle — and every vehicle gets the full plan.
          </motion.p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="flex justify-center mb-10"
          data-testid="toggle-billing-period"
        >
          <div className="inline-flex items-center gap-4 bg-slate-800/80 rounded-full p-1.5 border border-slate-700">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                !isAnnual ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                isAnnual ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Annual
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isAnnual ? "bg-emerald-500 text-white" : "bg-emerald-500/20 text-emerald-400"
              }`}>
                2 months free
              </span>
            </button>
          </div>
        </motion.div>

        {/* Vehicle slider */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="bg-slate-800/50 rounded-2xl p-6 sm:p-8 mb-10 border border-slate-700"
        >
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  How many vehicles in your fleet?
                </h3>
              </div>
              <motion.div
                key={vehicleCount}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-emerald-500 text-slate-900 font-bold text-lg sm:text-xl px-4 py-2 rounded-lg min-w-[60px] text-center"
              >
                {vehicleCount}
              </motion.div>
            </div>
            <div className="pricing-slider mb-4">
              <Slider
                value={[vehicleCount]}
                onValueChange={(v) => setVehicleCount(Math.max(MIN_VEHICLES, v[0]))}
                min={MIN_VEHICLES}
                max={MAX_VEHICLES}
                step={1}
                data-testid="slider-vehicle-count"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>1 vehicle</span>
              <span>{MAX_VEHICLES} vehicles</span>
            </div>
          </div>
        </motion.div>

        {/* Plan cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        >
          {plans.map((plan, index) => {
            const rate = isAnnual ? plan.annualPricePerVehicle : plan.pricePerVehicle;
            const monthlyTotal = rate * vehicleCount;
            const annualTotal = plan.annualPricePerVehicle * vehicleCount * 12;
            const monthlyAnnualisedTotal = plan.pricePerVehicle * vehicleCount * 12;
            const annualSaving = monthlyAnnualisedTotal - annualTotal;
            const Icon = plan.icon;

            return (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-2xl flex flex-col ${
                  plan.highlight
                    ? "bg-gradient-to-b from-[#5B6CFF] to-[#4338ca] ring-2 ring-[#5B6CFF]/60 shadow-2xl shadow-[#5B6CFF]/30 scale-[1.02]"
                    : "bg-slate-800 border border-slate-700"
                }`}
                data-testid={`pricing-card-${plan.name.toLowerCase().replace(" ", "-")}`}
              >
                {plan.badge && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-extrabold tracking-wider uppercase px-5 py-2 rounded-full shadow-lg whitespace-nowrap ${
                    plan.highlight
                      ? "bg-white text-[#5B6CFF]"
                      : "bg-emerald-500 text-slate-900"
                  }`}>
                    {plan.highlight && <Star className="inline h-3 w-3 mr-1" />}
                    {plan.badge}
                  </div>
                )}

                <div className={`p-6 sm:p-8 flex-1 flex flex-col ${plan.badge ? "pt-10" : ""}`}>
                  {/* Plan name & icon */}
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${
                    plan.highlight ? "bg-white/20" : "bg-slate-700"
                  }`}>
                    <Icon className={`h-6 w-6 ${plan.highlight ? "text-white" : "text-emerald-400"}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? "text-white" : "text-white"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-6 ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mb-1">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl sm:text-5xl font-black ${plan.highlight ? "text-white" : "text-white"}`}>
                        £{rate}
                      </span>
                      <span className={`text-sm ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>/vehicle/mo</span>
                    </div>
                    <p className={`text-sm mt-1 font-semibold ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>
                      £{monthlyTotal.toFixed(0)}/mo · {vehicleCount} vehicle{vehicleCount !== 1 ? "s" : ""}
                    </p>
                    {isAnnual && (
                      <p className={`text-xs mt-1 font-bold ${plan.highlight ? "text-emerald-300" : "text-emerald-400"}`}>
                        Save £{annualSaving.toFixed(0)}/year vs monthly
                      </p>
                    )}
                    {!isAnnual && (
                      <p className={`text-xs mt-1 ${plan.highlight ? "text-indigo-300" : "text-slate-500"}`}>
                        Switch to annual — save £{(plan.pricePerVehicle - plan.annualPricePerVehicle) * vehicleCount * 12}/yr
                      </p>
                    )}
                  </div>

                  <p className={`text-xs mt-2 mb-6 ${plan.highlight ? "text-indigo-300" : "text-slate-500"}`}>
                    {isAnnual ? "Billed annually" : "Billed monthly"} · Prices exclude VAT
                  </p>

                  {/* CTA */}
                  <button
                    onClick={() => handleCheckout(plan.name)}
                    disabled={checkoutLoading === plan.name}
                    className={`w-full h-12 font-semibold rounded-xl transition-all mb-6 ${
                      plan.highlight
                        ? "bg-white text-[#5B6CFF] hover:bg-indigo-50 shadow-lg"
                        : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    data-testid={`button-${plan.name.toLowerCase().replace(" ", "-")}-subscribe`}
                  >
                    {checkoutLoading === plan.name ? "Loading…" : "Start 14-Day Free Trial"}
                  </button>

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => {
                      const isAI = plan.aiFeatures?.includes(feature);
                      return (
                        <li key={feature} className="flex items-start gap-2.5">
                          {isAI ? (
                            <Bot className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-emerald-300" : "text-[#5B6CFF]"}`} />
                          ) : (
                            <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-emerald-300" : "text-emerald-400"}`} />
                          )}
                          <span className={`text-sm ${plan.highlight ? "text-indigo-100" : "text-slate-300"}`}>
                            {feature}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Value comparison */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="bg-slate-800/50 rounded-2xl p-6 sm:p-8 mb-10 border border-slate-700"
        >
          <h3 className="text-center text-lg font-bold text-white mb-6">
            How TitanFleet AI Pro compares at {vehicleCount} vehicles
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left pb-3 font-medium">Platform</th>
                  <th className="text-center pb-3 font-medium">Monthly cost</th>
                  <th className="text-center pb-3 font-medium">AI built-in</th>
                  <th className="text-center pb-3 font-medium">DVSA audit trail</th>
                  <th className="text-center pb-3 font-medium">Setup fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="bg-[#5B6CFF]/10">
                  <td className="py-3 font-bold text-white flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[#5B6CFF]" /> TitanFleet AI Pro
                  </td>
                  <td className="py-3 text-center font-bold text-emerald-400">
                    £{(25 * vehicleCount).toFixed(0)}/mo
                  </td>
                  <td className="py-3 text-center text-emerald-400 font-bold">✓ Full AI</td>
                  <td className="py-3 text-center text-emerald-400 font-bold">✓ DVSA-graded</td>
                  <td className="py-3 text-center text-emerald-400 font-bold">£0</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-300">Samsara</td>
                  <td className="py-3 text-center text-slate-300">~£{(32 * vehicleCount).toFixed(0)}/mo</td>
                  <td className="py-3 text-center text-slate-500">Basic only</td>
                  <td className="py-3 text-center text-slate-500">Partial</td>
                  <td className="py-3 text-center text-red-400">£500–2,000</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-300">Quartix</td>
                  <td className="py-3 text-center text-slate-300">~£{(14 * vehicleCount).toFixed(0)}/mo</td>
                  <td className="py-3 text-center text-slate-500">None</td>
                  <td className="py-3 text-center text-slate-500">None</td>
                  <td className="py-3 text-center text-red-400">Hardware req.</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-300">FleetCheck</td>
                  <td className="py-3 text-center text-slate-300">~£{(15 * vehicleCount).toFixed(0)}/mo</td>
                  <td className="py-3 text-center text-slate-500">None</td>
                  <td className="py-3 text-center text-slate-400">✓ Basic</td>
                  <td className="py-3 text-center text-slate-400">£0</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 text-center mt-4">Competitor prices are estimates based on publicly available information. VAT excluded.</p>
        </motion.div>

        {/* Guarantee */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-10"
        >
          <div className="bg-slate-800/60 rounded-2xl p-6 sm:p-8 border border-slate-700 text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Shield className="h-8 w-8 text-emerald-400" />
              <h3 className="text-xl font-bold text-white">30-Day "Save Time or Refund" Guarantee</h3>
            </div>
            <p className="text-slate-300 leading-relaxed">
              If TitanFleet doesn't simplify your compliance workflow, we'll refund you personally. No questions asked.
            </p>
          </div>
        </motion.div>

        {/* Bottom note */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center"
        >
          <p className="text-sm text-emerald-400 font-medium mb-4">
            No credit card required for trial · Cancel anytime · Full data export available
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <ArrowRight className="h-4 w-4 text-slate-500" />
            <p className="text-slate-400 text-sm">
              Need more than 150 vehicles or a custom contract?{" "}
              <a href="mailto:support@titanfleet.co.uk" className="text-emerald-400 hover:underline font-medium">
                Talk to us
              </a>
            </p>
          </div>
          <p className="text-slate-500 text-sm mb-3">Pay securely by card or mobile wallet</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {["VISA", "Mastercard", "Apple Pay", "GPay"].map(m => (
              <div key={m} className="bg-slate-800 rounded px-3 py-1.5 text-xs font-bold text-slate-300 border border-slate-700">{m}</div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
