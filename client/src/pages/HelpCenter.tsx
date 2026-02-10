import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Search,
  ChevronDown,
  Rocket,
  Truck,
  LayoutDashboard,
  CreditCard,
  ShieldCheck,
  HelpCircle,
  Mail,
  Instagram,
  Facebook,
} from "lucide-react";

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

interface FAQ {
  question: string;
  answer: string;
}

interface Category {
  id: string;
  title: string;
  icon: React.ReactNode;
  faqs: FAQ[];
}

const categories: Category[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <Rocket className="h-5 w-5" />,
    faqs: [
      {
        question: "How do I set up my account after purchasing?",
        answer: "After subscribing, you'll receive a welcome email at the address you used during checkout. Click the setup link (valid for 48 hours) to choose your company name, set your password, and create your transport manager account. Your unique company code will be generated automatically.",
      },
      {
        question: "What are Company Codes and PINs?",
        answer: "Your Company Code is a unique identifier for your business (e.g., APEX). Drivers use this code along with their 4-digit PIN to log into the mobile app. As a manager, you can also log in using your email and password.",
      },
      {
        question: "How do I add drivers to my fleet?",
        answer: "Go to Manager Dashboard → Settings → Team Management. Click 'Add User', enter the driver's name, email, and assign them a 4-digit PIN. Share the company code and PIN with them so they can log in on their mobile device.",
      },
      {
        question: "How do I add vehicles?",
        answer: "Go to Manager Dashboard → Fleet. Click 'Add Vehicle' and enter the registration number, make, model, and vehicle category (HGV/LGV). The system will automatically look up MOT and tax status from the DVSA database.",
      },
    ],
  },
  {
    id: "driver-guide",
    title: "Driver Guide",
    icon: <Truck className="h-5 w-5" />,
    faqs: [
      {
        question: "How do I perform a vehicle inspection?",
        answer: "Log in with your company code and PIN. Select your vehicle from the dashboard, then tap 'Start Inspection'. Work through each checklist section — the app includes a DVSA-compliant timer to ensure thorough checks (minimum 10 minutes for HGV, 5 minutes for LGV). Report any defects during the inspection and take photos where needed.",
      },
      {
        question: "How do I report a defect?",
        answer: "During an inspection, mark any failed items and you'll be prompted to add defect details. You can also report defects separately by selecting the vehicle and tapping 'Report Defect'. Add a description, severity level, and photos. Serious defects will automatically flag the vehicle for attention.",
      },
      {
        question: "How do I log fuel?",
        answer: "From the dashboard, select your vehicle and tap 'Fuel Entry'. Enter the fuel type (Diesel or AdBlue), litres, cost, current mileage, and the filling station. This data helps your transport manager monitor fuel efficiency across the fleet.",
      },
      {
        question: "How do I complete a Proof of Delivery (POD)?",
        answer: "Tap 'Complete Delivery' from the dashboard. Enter the customer name, delivery address, and reference number. Collect the customer's signature on screen, take photos of the delivered goods if needed, and the app will automatically record your GPS location. Your manager can then view, export, and download PDF copies.",
      },
      {
        question: "Can I use the app offline?",
        answer: "The app is designed as a Progressive Web App (PWA) and can be installed on your phone's home screen. Some features work with limited connectivity, but an internet connection is required to submit inspections, defects, and fuel entries.",
      },
    ],
  },
  {
    id: "manager-guide",
    title: "Transport Manager Guide",
    icon: <LayoutDashboard className="h-5 w-5" />,
    faqs: [
      {
        question: "How do I access the Manager Dashboard?",
        answer: "Go to the Manager Login page and sign in using either your Company Code and Manager PIN, or your email address and password. The dashboard gives you a complete overview of your fleet's compliance status, recent inspections, and any outstanding defects.",
      },
      {
        question: "How do I manage defects?",
        answer: "The Defects page shows all reported issues in a Kanban-style board organised by status: Open, In Progress, and Resolved. Click any defect to view details, photos, and update its status. Defects that remain open will automatically escalate in severity after 24 hours to ensure nothing is missed.",
      },
      {
        question: "What is the Compliance Score?",
        answer: "The Compliance Score is a real-time rating from 0-100 measuring your fleet's overall health. It's calculated from four factors: inspection completion (30%), open defects (25%), MOT status (25%), and vehicles off road (20%). Scores are graded A to F and colour-coded green, amber, or red.",
      },
      {
        question: "How do I export reports?",
        answer: "Inspection reports can be downloaded as PDF documents from the Inspections page. Delivery records can be exported as CSV files from the Deliveries page. These exports are designed to satisfy DVSA audits and operator licensing requirements.",
      },
      {
        question: "How do I manage my team?",
        answer: "Go to Settings → Team Management. Here you can add new drivers and managers, edit their details, change PINs, and deactivate users who no longer need access. All changes are recorded in the audit log.",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing & Subscription",
    icon: <CreditCard className="h-5 w-5" />,
    faqs: [
      {
        question: "What subscription plans are available?",
        answer: "We offer four monthly plans: Starter (£59/mo, up to 10 vehicles), Growth (£129/mo, up to 25 vehicles), Pro (£249/mo, up to 50 vehicles), and Scale (£399/mo, up to 100 vehicles). All plans include every feature — the only difference is the number of vehicles. All prices exclude VAT.",
      },
      {
        question: "Do I get a free trial?",
        answer: "Yes! Every plan comes with a 14-day free trial. You won't be charged until the trial ends, and you can cancel at any time during the trial period at no cost.",
      },
      {
        question: "How do I manage my subscription?",
        answer: "Click the 'Manage Billing' option in your Manager Dashboard to access the Stripe customer portal. From there you can update your payment method, change your plan, view invoices, and cancel your subscription.",
      },
      {
        question: "How do I cancel?",
        answer: "You can cancel anytime through the Stripe billing portal (no lock-in contracts). Your access continues until the end of your current billing period. After cancellation, you'll have 30 days to export your data before your account is deactivated.",
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure payment partner Stripe. All payments are processed in GBP (£).",
      },
    ],
  },
  {
    id: "dvsa-compliance",
    title: "DVSA Compliance",
    icon: <ShieldCheck className="h-5 w-5" />,
    faqs: [
      {
        question: "How does Titan Fleet help with DVSA compliance?",
        answer: "Titan Fleet is built in line with the DVSA Guide to Maintaining Roadworthiness (2024). It provides digital walk-around checks with timed inspections, automatic defect tracking with escalation, MOT and tax status monitoring, and exportable inspection records that satisfy operator licensing requirements.",
      },
      {
        question: "Are digital inspections accepted by DVSA?",
        answer: "Yes. The DVSA accepts digital daily walk-around checks provided they capture the same information as paper forms. Titan Fleet's inspections include timestamps, driver identification, GPS location, and photographic evidence — providing even stronger audit trails than paper records.",
      },
      {
        question: "How does MOT status monitoring work?",
        answer: "When you add a vehicle, Titan Fleet automatically looks up its MOT and tax status from the official DVSA/DVLA database. The system monitors expiry dates and alerts you before they lapse, helping you stay compliant without manual diary checks.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: <HelpCircle className="h-5 w-5" />,
    faqs: [
      {
        question: "I've forgotten my PIN",
        answer: "Ask your transport manager to check or reset your PIN. Managers can update driver PINs from Settings → Team Management.",
      },
      {
        question: "I've forgotten my manager password",
        answer: "On the Manager Login page, switch to 'Email Login' mode and click 'Forgot your password?' Enter your email address and you'll receive a reset link (valid for 1 hour). Follow the link to set a new password.",
      },
      {
        question: "My setup link has expired",
        answer: "Setup links are valid for 48 hours. If yours has expired, please email support@titanfleet.co.uk and we'll send you a new one.",
      },
      {
        question: "I can't see my vehicles",
        answer: "Make sure you're logging in with the correct company code. Vehicles are linked to your company account. If you've just signed up, your transport manager needs to add vehicles through the Fleet management page first.",
      },
      {
        question: "How do I contact support?",
        answer: "Email us at support@titanfleet.co.uk. We aim to respond within 24 hours on working days.",
      },
    ],
  },
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>({});

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleQuestion = (key: string) => {
    setOpenQuestions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCategories = categories
    .map((cat) => {
      if (!searchQuery.trim()) return cat;
      const query = searchQuery.toLowerCase();
      const matchedFaqs = cat.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
      if (matchedFaqs.length === 0) return null;
      return { ...cat, faqs: matchedFaqs };
    })
    .filter(Boolean) as Category[];

  const hasResults = filteredCategories.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <span className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
                <span className="text-xl font-bold text-slate-900">Titan</span>
                <span className="text-xl text-slate-500">Fleet</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/">
                <span className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium cursor-pointer" data-testid="link-back-home">
                  Back to Home
                </span>
              </Link>
              <Link href="/app">
                <span className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium cursor-pointer" data-testid="link-driver-login">
                  Driver Login
                </span>
              </Link>
              <Link href="/manager/login">
                <span className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium cursor-pointer" data-testid="link-manager-login">
                  Manager Login
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-16 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4"
            >
              Help Centre
            </motion.h1>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto"
            >
              Find answers to common questions about using Titan Fleet. Search below or browse by category.
            </motion.p>
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-xl mx-auto relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search for help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B6CFF] focus:border-transparent text-base shadow-sm"
                data-testid="input-search"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hasResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2" data-testid="text-no-results">
                No results found
              </h3>
              <p className="text-slate-500">
                Try a different search term or browse the categories below after clearing your search.
              </p>
            </motion.div>
          )}

          {hasResults && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-6"
            >
              {filteredCategories.map((category) => {
                const isCatOpen = searchQuery.trim()
                  ? true
                  : openCategories[category.id] ?? false;

                return (
                  <motion.div
                    key={category.id}
                    variants={fadeUp}
                    transition={{ duration: 0.4 }}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                    data-testid={`category-${category.id}`}
                  >
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
                      data-testid={`button-toggle-category-${category.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#5B6CFF]/10 text-[#5B6CFF] flex items-center justify-center">
                          {category.icon}
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {category.title}
                        </h2>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {category.faqs.length}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                          isCatOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isCatOpen && (
                      <div className="border-t border-slate-100">
                        {category.faqs.map((faq, faqIndex) => {
                          const questionKey = `${category.id}-${faqIndex}`;
                          const isOpen = searchQuery.trim()
                            ? true
                            : openQuestions[questionKey] ?? false;

                          return (
                            <div
                              key={faqIndex}
                              className="border-b border-slate-50 last:border-b-0"
                              data-testid={`faq-${category.id}-${faqIndex}`}
                            >
                              <button
                                onClick={() => toggleQuestion(questionKey)}
                                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/50 transition-colors"
                                data-testid={`button-toggle-question-${category.id}-${faqIndex}`}
                              >
                                <span className="text-sm font-medium text-slate-800 pr-4">
                                  {faq.question}
                                </span>
                                <ChevronDown
                                  className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                                    isOpen ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                              {isOpen && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  transition={{ duration: 0.2 }}
                                  className="px-6 pb-4"
                                >
                                  <p className="text-sm text-slate-600 leading-relaxed pl-0">
                                    {faq.answer}
                                  </p>
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-center bg-slate-50 rounded-2xl p-10 border border-slate-200"
          >
            <Mail className="h-10 w-10 text-[#5B6CFF] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Still need help?
            </h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Can't find what you're looking for? Our support team is here to help. We aim to respond within 24 hours on working days.
            </p>
            <a
              href="mailto:support@titanfleet.co.uk"
              className="inline-flex items-center gap-2 h-12 px-8 bg-[#5B6CFF] hover:bg-[#4A5AE8] text-white font-semibold rounded-xl transition-colors"
              data-testid="button-contact-support"
            >
              <Mail className="h-5 w-5" />
              Contact Support
            </a>
          </motion.div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
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

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-3">
                <li><Link href="/"><span className="text-sm hover:text-white transition-colors cursor-pointer">Home</span></Link></li>
                <li><Link href="/help"><span className="text-sm hover:text-white transition-colors cursor-pointer">Help Centre</span></Link></li>
                <li><Link href="/procurement-faq"><span className="text-sm hover:text-white transition-colors cursor-pointer">FAQs</span></Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/demo"><span className="text-sm hover:text-white transition-colors cursor-pointer">View Demo</span></Link></li>
                <li><a href="mailto:support@titanfleet.co.uk" className="text-sm hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-3">
                <li><a href="mailto:support@titanfleet.co.uk" className="text-sm hover:text-white transition-colors">support@titanfleet.co.uk</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center space-y-4">
            <div className="flex justify-center gap-6 text-sm">
              <Link href="/privacy-policy"><span className="hover:text-white transition-colors cursor-pointer" data-testid="link-privacy-policy">Privacy Policy</span></Link>
              <Link href="/terms"><span className="hover:text-white transition-colors cursor-pointer" data-testid="link-terms">Terms & Conditions</span></Link>
              <Link href="/refund-policy"><span className="hover:text-white transition-colors cursor-pointer" data-testid="link-refund-policy">Refund Policy</span></Link>
            </div>
            <p className="text-slate-500 text-xs">© 2026 Titan Fleet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}