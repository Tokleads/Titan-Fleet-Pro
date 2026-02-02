import { motion } from "framer-motion";
import { Link } from "wouter";
import { Check, Mail, Phone, Building2, Shield, FileText, Download } from "lucide-react";

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

export default function ProcurementFAQ() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="text-xl font-bold text-slate-900">Titan</span>
                <span className="text-xl text-slate-500">Fleet</span>
              </div>
            </Link>
            <a
              href="mailto:support@titanfleet.co.uk"
              className="bg-[#5B6CFF] hover:bg-[#4A5AE8] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-medium text-[#5B6CFF] mb-4"
            >
              Supplier Information for Procurement Teams
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6"
            >
              Titan Fleet — Supplier Summary
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg text-slate-600 max-w-2xl mx-auto"
            >
              Everything your procurement team needs to approve Titan Fleet as a supplier. 
              Digital fleet compliance software for UK operators.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-12"
          >
            {/* What is Titan Fleet */}
            <motion.div variants={fadeUp} className="bg-slate-50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">What is Titan Fleet?</h2>
              <p className="text-slate-600 leading-relaxed">
                Titan Fleet is a digital compliance tool for UK fleet operators. It replaces paper-based vehicle 
                walk-around checks with a mobile app that drivers use to record inspections, report defects, 
                and generate audit-ready records. The platform also includes GPS tracking, automated timesheets 
                via depot geofencing, and two-way driver communication.
              </p>
            </motion.div>

            {/* Supplier Details */}
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Building2 className="h-6 w-6 text-[#5B6CFF]" />
                Supplier Details
              </h2>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Legal Entity</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-semibold">CLOVER 44 LTD</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Company Number</td>
                      <td className="px-6 py-4 text-sm text-slate-900">15940100</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Registered Address</td>
                      <td className="px-6 py-4 text-sm text-slate-900">Unit 12, North Storage, Bankwood Lane, Doncaster, South Yorkshire, DN11 0PS</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Support Email</td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        <a href="mailto:support@titanfleet.co.uk" className="text-[#5B6CFF] hover:underline">
                          support@titanfleet.co.uk
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Website</td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        <a href="https://titanfleet.co.uk" className="text-[#5B6CFF] hover:underline">
                          titanfleet.co.uk
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Pricing */}
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FileText className="h-6 w-6 text-[#5B6CFF]" />
                Subscription Pricing
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Starter */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Starter</h3>
                  <p className="text-sm text-slate-500 mb-4">1-5 Vehicles</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-slate-900">£49</span>
                    <span className="text-slate-600">/month</span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Up to 5 vehicles
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Unlimited drivers
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Full platform access
                    </li>
                  </ul>
                </div>

                {/* Professional */}
                <div className="bg-[#5B6CFF] text-white rounded-2xl p-6 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs font-medium px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                  <h3 className="text-lg font-bold mb-1">Professional</h3>
                  <p className="text-sm text-blue-100 mb-4">6-25 Vehicles</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">£149</span>
                    <span className="text-blue-100">/month</span>
                  </div>
                  <ul className="space-y-2 text-sm text-blue-100">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-white" />
                      Up to 25 vehicles
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-white" />
                      Priority support
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-white" />
                      GPS tracking included
                    </li>
                  </ul>
                </div>

                {/* Enterprise */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Enterprise</h3>
                  <p className="text-sm text-slate-500 mb-4">26+ Vehicles</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-slate-900">£349</span>
                    <span className="text-slate-600">/month</span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Unlimited vehicles
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Dedicated onboarding
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Custom integrations
                    </li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-4 text-center">
                All plans billed monthly. No setup fees. Cancel anytime with 30 days notice.
              </p>
            </motion.div>

            {/* Contract Terms */}
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FileText className="h-6 w-6 text-[#5B6CFF]" />
                Contract Terms
              </h2>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Contract Type</td>
                      <td className="px-6 py-4 text-sm text-slate-900">Monthly rolling subscription</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Minimum Term</td>
                      <td className="px-6 py-4 text-sm text-slate-900">None — month-to-month</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Notice Period</td>
                      <td className="px-6 py-4 text-sm text-slate-900">30 days written notice</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Exit Fees</td>
                      <td className="px-6 py-4 text-sm text-slate-900">None</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Data Export</td>
                      <td className="px-6 py-4 text-sm text-slate-900">Available on request at no charge</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Data & Compliance */}
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Shield className="h-6 w-6 text-[#5B6CFF]" />
                Data & Compliance
              </h2>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Data Location</td>
                      <td className="px-6 py-4 text-sm text-slate-900">UK/EU cloud infrastructure</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">GDPR</td>
                      <td className="px-6 py-4 text-sm text-slate-900">Fully compliant, DPA available on request</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Data Retention</td>
                      <td className="px-6 py-4 text-sm text-slate-900">Customer-controlled</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Data Ownership</td>
                      <td className="px-6 py-4 text-sm text-slate-900">Customer retains full ownership</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">Sub-processors</td>
                      <td className="px-6 py-4 text-sm text-slate-900">Listed in Privacy Policy</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Support */}
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Mail className="h-6 w-6 text-[#5B6CFF]" />
                Support
              </h2>
              <div className="bg-slate-50 rounded-2xl p-8">
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    Email support included at no extra cost
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    No SLA tiers — all customers receive the same service
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    Documentation available online
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    Direct founder access for Enterprise customers
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Payment Methods */}
            <motion.div variants={fadeUp} className="text-center">
              <p className="text-slate-500 mb-4">Pay securely by card or mobile wallet</p>
              <div className="flex justify-center gap-4">
                <div className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600">
                  VISA
                </div>
                <div className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600">
                  Mastercard
                </div>
                <div className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600">
                  Apple Pay
                </div>
                <div className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600">
                  GPay
                </div>
              </div>
            </motion.div>

            {/* Contact CTA */}
            <motion.div variants={fadeUp} className="bg-slate-900 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Ready to proceed?</h2>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Contact us for a formal quote, DPA, or any additional documentation your procurement team requires.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:support@titanfleet.co.uk"
                  className="inline-flex items-center justify-center gap-2 bg-[#5B6CFF] hover:bg-[#4A5AE8] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  support@titanfleet.co.uk
                </a>
                <a
                  href="tel:07496188541"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-colors border border-white/20"
                >
                  <Phone className="h-5 w-5" />
                  Call: 07496 188541
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm">
            Document version: January 2025 · CLOVER 44 LTD · Company No. 15940100
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/privacy">
              <span className="text-slate-500 hover:text-slate-300 text-sm cursor-pointer">Privacy Policy</span>
            </Link>
            <Link href="/terms">
              <span className="text-slate-500 hover:text-slate-300 text-sm cursor-pointer">Terms & Conditions</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
