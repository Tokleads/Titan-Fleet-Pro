import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Truck, MapPin, Clock, Shield, Headphones, Code, Building2, Palette } from "lucide-react";
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

interface PricingTier {
  name: string;
  price: number;
  maxVehicles: number;
  features: string[];
  popular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    price: 59,
    maxVehicles: 10,
    features: [
      "Up to 10 vehicles",
      "Basic inspections",
      "Defect tracking",
      "Unlimited drivers",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: 129,
    maxVehicles: 25,
    popular: true,
    features: [
      "Up to 25 vehicles",
      "GPS tracking",
      "Timesheets",
      "Priority support",
      "Fleet analytics",
    ],
  },
  {
    name: "Pro",
    price: 249,
    maxVehicles: 50,
    features: [
      "Up to 50 vehicles",
      "Advanced analytics",
      "API access",
      "Multi-depot",
      "Custom reports",
    ],
  },
  {
    name: "Scale",
    price: 399,
    maxVehicles: 100,
    features: [
      "Up to 100 vehicles",
      "Dedicated support",
      "Custom integrations",
      "White-label",
      "SLA guarantee",
    ],
  },
];

function calculateOveragePrice(vehicles: number): number {
  const basePrice = 59;
  const baseVehicles = 10;
  const overageRate = 6;

  if (vehicles <= baseVehicles) {
    return basePrice;
  }
  return basePrice + (vehicles - baseVehicles) * overageRate;
}

function getBestValueTier(vehicles: number): string {
  if (vehicles <= 10) return "Starter";
  if (vehicles <= 25) return "Growth";
  if (vehicles <= 50) return "Pro";
  return "Scale";
}

export default function PricingSection() {
  const [vehicleCount, setVehicleCount] = useState<number>(10);

  const calculatedPrice = useMemo(() => calculateOveragePrice(vehicleCount), [vehicleCount]);
  const bestValueTier = useMemo(() => getBestValueTier(vehicleCount), [vehicleCount]);
  const overageVehicles = vehicleCount > 10 ? vehicleCount - 10 : 0;

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-slate-300 max-w-2xl mx-auto"
          >
            One subscription. No hidden fees. Cancel anytime.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="bg-slate-800/50 rounded-2xl p-6 sm:p-8 mb-10 border border-slate-700"
        >
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Truck className="h-6 w-6 text-[#22c55e]" />
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  How many vehicles are in your fleet?
                </h3>
              </div>
              <motion.div
                key={vehicleCount}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-[#22c55e] text-[#0f172a] font-bold text-lg sm:text-xl px-4 py-2 rounded-lg min-w-[80px] text-center"
              >
                {vehicleCount}
              </motion.div>
            </div>

            <div className="pricing-slider mb-6">
              <Slider
                value={[vehicleCount]}
                onValueChange={(value) => setVehicleCount(value[0])}
                min={1}
                max={150}
                step={1}
                data-testid="slider-vehicle-count"
              />
            </div>

            <div className="flex justify-between text-sm text-slate-400 mb-6">
              <span>1 vehicle</span>
              <span>150 vehicles</span>
            </div>

            <motion.div
              key={calculatedPrice}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#0f172a] rounded-xl p-4 sm:p-6 border border-slate-600"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Your estimated price</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-white">
                      £{calculatedPrice.toFixed(2)}
                    </span>
                    <span className="text-slate-400">/month</span>
                  </div>
                  {overageVehicles > 0 && (
                    <p className="text-sm text-slate-400 mt-1">
                      £59 base + £{(overageVehicles * 6).toFixed(2)} ({overageVehicles} extra vehicles × £6)
                    </p>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-slate-400 mb-1">Best value plan</p>
                  <span className="inline-flex items-center gap-2 bg-[#22c55e]/20 text-[#22c55e] font-semibold px-4 py-2 rounded-lg">
                    <Check className="h-4 w-4" />
                    {bestValueTier}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-[#22c55e]/10 to-[#22c55e]/5 rounded-xl p-4 sm:p-6 mb-10 border border-[#22c55e]/30"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
                <Check className="h-5 w-5 text-[#22c55e]" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">TitanFleet</p>
                <p className="text-[#22c55e] font-bold">£0 Setup Fee</p>
              </div>
            </div>
            <div className="text-slate-400 font-medium">vs.</div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-slate-400" />
              </div>
              <div className="text-left">
                <p className="text-slate-400 font-semibold">Hardware Trackers</p>
                <p className="text-red-400 font-bold">£300+ Setup Fee</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {pricingTiers.map((tier, index) => {
            const isHighlighted = tier.name === bestValueTier;
            const isMostPopular = tier.popular;

            return (
              <motion.div
                key={tier.name}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
                  isHighlighted
                    ? "bg-[#22c55e] shadow-xl shadow-[#22c55e]/20 scale-[1.02] ring-2 ring-[#22c55e]"
                    : "bg-slate-800 border border-slate-700"
                }`}
                data-testid={`pricing-card-${tier.name.toLowerCase()}`}
              >
                {isMostPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#0f172a] text-[#22c55e] text-xs font-bold px-4 py-1.5 rounded-full border border-[#22c55e]">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-lg font-bold mb-1 ${isHighlighted ? "text-[#0f172a]" : "text-white"}`}>
                    {tier.name}
                  </h3>
                  <p className={`text-sm ${isHighlighted ? "text-[#0f172a]/70" : "text-slate-400"}`}>
                    Up to {tier.maxVehicles} vehicles
                  </p>
                </div>

                <div className="mb-2">
                  <span className={`text-4xl font-bold ${isHighlighted ? "text-[#0f172a]" : "text-white"}`}>
                    £{tier.price}
                  </span>
                  <span className={isHighlighted ? "text-[#0f172a]/70" : "text-slate-400"}>/month</span>
                </div>
                <p className={`text-xs mb-6 ${isHighlighted ? "text-[#0f172a]/60" : "text-slate-500"}`}>
                  Total price - No VAT applicable
                </p>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className={`h-5 w-5 shrink-0 mt-0.5 ${isHighlighted ? "text-[#0f172a]" : "text-[#22c55e]"}`} />
                      <span className={`text-sm ${isHighlighted ? "text-[#0f172a]" : "text-slate-300"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full h-12 font-semibold rounded-xl transition-colors ${
                    isHighlighted
                      ? "bg-[#0f172a] text-white hover:bg-slate-800"
                      : "bg-[#22c55e] text-[#0f172a] hover:bg-[#16a34a]"
                  }`}
                  data-testid={`button-${tier.name.toLowerCase()}-subscribe`}
                >
                  Start Free Trial
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <div className="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700">
            <div className="text-center py-8 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white mb-2">
                Compare All Features
              </h3>
              <p className="text-slate-400 text-sm">
                Every plan includes the essentials — scale adds capacity
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-400"></th>
                    {pricingTiers.map((tier) => (
                      <th
                        key={tier.name}
                        className={`py-4 px-4 text-sm font-medium text-center ${
                          tier.name === bestValueTier
                            ? "text-[#22c55e] bg-[#22c55e]/10"
                            : "text-slate-400"
                        }`}
                      >
                        {tier.name}
                        {tier.popular && (
                          <span className="block text-xs text-[#22c55e] mt-1">★ Popular</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "DVSA-ready checks", all: true },
                    { feature: "Photo defect reporting", all: true },
                    { feature: "Branded driver app", all: true },
                    { feature: "Unlimited drivers", all: true },
                    { feature: "Vehicle limit", values: ["10", "25", "50", "100"] },
                    { feature: "GPS tracking", starter: false, growth: true, pro: true, scale: true },
                    { feature: "Timesheets", starter: false, growth: true, pro: true, scale: true },
                    { feature: "Priority support", starter: false, growth: true, pro: true, scale: true },
                    { feature: "Advanced analytics", starter: false, growth: false, pro: true, scale: true },
                    { feature: "API access", starter: false, growth: false, pro: true, scale: true },
                    { feature: "Multi-depot", starter: false, growth: false, pro: true, scale: true },
                    { feature: "Dedicated support", starter: false, growth: false, pro: false, scale: true },
                    { feature: "Custom integrations", starter: false, growth: false, pro: false, scale: true },
                    { feature: "White-label", starter: false, growth: false, pro: false, scale: true },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="py-4 px-6 text-sm text-slate-300">{row.feature}</td>
                      {row.all !== undefined ? (
                        pricingTiers.map((tier) => (
                          <td
                            key={tier.name}
                            className={`py-4 px-4 text-center ${
                              tier.name === bestValueTier ? "bg-[#22c55e]/10" : ""
                            }`}
                          >
                            <Check className="h-5 w-5 text-[#22c55e] mx-auto" />
                          </td>
                        ))
                      ) : row.values ? (
                        row.values.map((value, idx) => (
                          <td
                            key={idx}
                            className={`py-4 px-4 text-center text-sm font-medium ${
                              pricingTiers[idx].name === bestValueTier
                                ? "bg-[#22c55e]/10 text-[#22c55e]"
                                : "text-white"
                            }`}
                          >
                            {value}
                          </td>
                        ))
                      ) : (
                        <>
                          <td className={`py-4 px-4 text-center ${pricingTiers[0].name === bestValueTier ? "bg-[#22c55e]/10" : ""}`}>
                            {row.starter ? (
                              <Check className="h-5 w-5 text-[#22c55e] mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className={`py-4 px-4 text-center ${pricingTiers[1].name === bestValueTier ? "bg-[#22c55e]/10" : ""}`}>
                            {row.growth ? (
                              <Check className="h-5 w-5 text-[#22c55e] mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className={`py-4 px-4 text-center ${pricingTiers[2].name === bestValueTier ? "bg-[#22c55e]/10" : ""}`}>
                            {row.pro ? (
                              <Check className="h-5 w-5 text-[#22c55e] mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className={`py-4 px-4 text-center ${pricingTiers[3].name === bestValueTier ? "bg-[#22c55e]/10" : ""}`}>
                            {row.scale ? (
                              <Check className="h-5 w-5 text-[#22c55e] mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-center py-6 border-t border-slate-700">
              <p className="text-sm text-[#22c55e]">
                Pay monthly. Cancel anytime. Full data export available.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center mt-12 space-y-4"
        >
          <p className="text-slate-400 text-sm">Pay securely by card or mobile wallet</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="bg-slate-800 rounded px-3 py-1.5 text-xs font-bold text-slate-300 border border-slate-700">VISA</div>
            <div className="bg-slate-800 rounded px-3 py-1.5 text-xs font-bold text-slate-300 border border-slate-700">Mastercard</div>
            <div className="bg-slate-800 rounded px-3 py-1.5 text-xs font-bold text-slate-300 border border-slate-700">Apple Pay</div>
            <div className="bg-slate-800 rounded px-3 py-1.5 text-xs font-bold text-slate-300 border border-slate-700">GPay</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
