import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/">
          <span className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium cursor-pointer mb-8 block" data-testid="link-back-home">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </span>
        </Link>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl font-bold text-white">TITAN</span>
            <span className="text-2xl text-slate-400">FLEET</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Effective Date: February 2026</p>
        </div>

        <div className="space-y-10 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Who We Are</h2>
            <p>
              Titan Fleet is a UK-based fleet management and compliance software platform. We provide cloud-based tools for transport operators, fleet owners, and drivers to manage vehicle inspections, compliance records, GPS tracking, timesheets, deliveries, and more.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. What Data We Collect</h2>
            <p className="mb-3">We collect the following types of data when you use our platform:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><span className="text-white font-medium">Personal Information:</span> Name, email address, phone number, driver PIN</li>
              <li><span className="text-white font-medium">Company Details:</span> Company name, company code, address, O-licence number</li>
              <li><span className="text-white font-medium">Vehicle Data:</span> Registration numbers, MOT status, tax status, VIN, mileage records</li>
              <li><span className="text-white font-medium">GPS Location Data:</span> Real-time vehicle location coordinates and route history</li>
              <li><span className="text-white font-medium">Inspection Records:</span> Walk-around check results, defect reports, photos, signatures</li>
              <li><span className="text-white font-medium">Fuel Data:</span> Fuel entries, mileage, consumption records</li>
              <li><span className="text-white font-medium">Delivery Records:</span> Proof of delivery data, customer signatures, delivery photos, GPS coordinates</li>
              <li><span className="text-white font-medium">Payment Information:</span> Billing details processed securely via Stripe (we do not store card numbers)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Why We Collect It</h2>
            <p className="mb-3">We process your data for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Providing fleet management, compliance tracking, and operational services</li>
              <li>Meeting DVSA (Driver and Vehicle Standards Agency) compliance requirements</li>
              <li>Processing subscription billing and payments via Stripe</li>
              <li>Generating compliance reports, inspection records, and delivery documentation</li>
              <li>Sending service notifications, alerts, and operational updates</li>
              <li>Improving our platform and providing customer support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. How We Store Your Data</h2>
            <p className="mb-3">We take the security of your data seriously:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>All data is encrypted in transit (TLS/SSL) and at rest</li>
              <li>Data is stored in a secure PostgreSQL database hosted on encrypted cloud infrastructure</li>
              <li>Access controls and authentication mechanisms protect all user accounts</li>
              <li>Sensitive fields such as passwords and PINs are hashed using industry-standard algorithms</li>
              <li>Regular security reviews and monitoring are conducted</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p className="mb-3">We retain your data for the following periods:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><span className="text-white font-medium">Inspection Records:</span> Retained for 3 years in accordance with DVSA requirements for operator compliance</li>
              <li><span className="text-white font-medium">Delivery Records:</span> Retained for 18 months in line with GDPR data minimisation principles</li>
              <li><span className="text-white font-medium">Account Data:</span> Retained while your subscription is active, plus 30 days after cancellation to allow for data export</li>
              <li><span className="text-white font-medium">Payment Records:</span> Retained as required by UK financial regulations and tax law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights Under GDPR</h2>
            <p className="mb-3">Under the UK General Data Protection Regulation (UK GDPR), you have the following rights:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><span className="text-white font-medium">Right of Access:</span> Request a copy of the personal data we hold about you</li>
              <li><span className="text-white font-medium">Right to Rectification:</span> Request correction of inaccurate or incomplete data</li>
              <li><span className="text-white font-medium">Right to Erasure:</span> Request deletion of your personal data (subject to legal retention obligations)</li>
              <li><span className="text-white font-medium">Right to Data Portability:</span> Request an export of your data in a machine-readable format</li>
              <li><span className="text-white font-medium">Right to Object:</span> Object to the processing of your personal data in certain circumstances</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, please contact us at <a href="mailto:support@titanfleet.co.uk" className="text-[#5B6CFF] hover:underline" data-testid="link-email-gdpr">support@titanfleet.co.uk</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Cookies</h2>
            <p>
              We use minimal cookies to operate our platform. These include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
              <li><span className="text-white font-medium">Session Cookies:</span> Essential for maintaining your login session and authentication state</li>
              <li><span className="text-white font-medium">Preference Cookies:</span> Used to remember your display preferences and settings</li>
            </ul>
            <p className="mt-3">We do not use advertising or third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Third Parties</h2>
            <p className="mb-3">We share data with the following trusted third-party services only as necessary to operate our platform:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><span className="text-white font-medium">Stripe:</span> For secure payment processing and subscription management</li>
              <li><span className="text-white font-medium">Resend:</span> For transactional email delivery (e.g., password resets, notifications)</li>
            </ul>
            <p className="mt-3">We do not sell, rent, or trade your personal data to any third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or how we handle your data, please contact us:
            </p>
            <p className="mt-3">
              <a href="mailto:support@titanfleet.co.uk" className="text-[#5B6CFF] hover:underline" data-testid="link-email-contact">support@titanfleet.co.uk</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-700 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-sm font-bold text-white">TITAN</span>
            <span className="text-sm text-slate-400">FLEET</span>
          </div>
          <p className="text-slate-500 text-xs">© 2026 Titan Fleet. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}