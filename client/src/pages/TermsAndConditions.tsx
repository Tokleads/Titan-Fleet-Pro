import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsAndConditions() {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Terms & Conditions</h1>
          <p className="text-slate-400 text-sm">Effective Date: February 2026</p>
        </div>

        <div className="space-y-10 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Service Description</h2>
            <p>
              Titan Fleet is a cloud-based fleet management platform designed for UK transport operators. The platform provides vehicle compliance tracking, GPS fleet tracking, digital walk-around inspections, defect management, proof of delivery, automated timesheets, fuel monitoring, driver management, and reporting tools. The service is delivered as a Software-as-a-Service (SaaS) subscription accessed via web browser and mobile devices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Subscription Terms</h2>
            <p className="mb-3">By subscribing to Titan Fleet, you agree to the following terms:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>All subscriptions are billed monthly via Stripe</li>
              <li>New accounts receive a 14-day free trial with full platform access</li>
              <li>You may cancel your subscription at any time — there are no long-term contracts or lock-in periods</li>
              <li>Cancellation takes effect at the end of the current billing cycle</li>
              <li>VAT is charged in addition to the listed prices where applicable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Pricing</h2>
            <p className="mb-4">The following pricing tiers are available. All prices exclude VAT:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-3 pr-4 text-white font-semibold">Plan</th>
                    <th className="py-3 pr-4 text-white font-semibold">Price</th>
                    <th className="py-3 text-white font-semibold">Vehicles</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 pr-4">Starter</td>
                    <td className="py-3 pr-4">£59/month</td>
                    <td className="py-3">Up to 10 vehicles</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 pr-4">Growth</td>
                    <td className="py-3 pr-4">£129/month</td>
                    <td className="py-3">Up to 25 vehicles</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 pr-4">Pro</td>
                    <td className="py-3 pr-4">£249/month</td>
                    <td className="py-3">Up to 50 vehicles</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Scale</td>
                    <td className="py-3 pr-4">£399/month</td>
                    <td className="py-3">Up to 100 vehicles</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-slate-400">Titan Fleet reserves the right to adjust pricing with 30 days' notice to existing subscribers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Account Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>You are responsible for keeping your login credentials, PINs, and passwords secure</li>
              <li>You must provide accurate and up-to-date company and user information</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>You must notify us immediately of any unauthorised use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Acceptable Use</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>You agree not to misuse the platform, attempt to gain unauthorised access, or interfere with the service</li>
              <li>Each account is intended for use by a single company or operator</li>
              <li>You must not use the platform for any unlawful purpose</li>
              <li>Automated scraping, data extraction, or reverse engineering of the platform is prohibited</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual Property</h2>
            <p className="mb-3">
              All intellectual property rights in the Titan Fleet platform, including but not limited to the software, design, branding, and documentation, are owned by Titan Fleet.
            </p>
            <p>
              You retain full ownership of all data you upload or generate through the platform, including inspection records, vehicle data, delivery records, and any other operational data. We do not claim ownership of your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Data & GDPR Compliance</h2>
            <p className="mb-3">
              We process personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. For full details on how we collect, store, and process your data, please refer to our{" "}
              <Link href="/privacy-policy">
                <span className="text-[#5B6CFF] hover:underline cursor-pointer" data-testid="link-privacy-policy">Privacy Policy</span>
              </Link>.
            </p>
            <p>
              As a data processor, we will process your data only in accordance with your instructions and for the purposes described in our Privacy Policy. We implement appropriate technical and organisational measures to protect personal data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Titan Fleet is provided "as is" and we make no warranties regarding uninterrupted or error-free service</li>
              <li>Our total liability to you shall not exceed the amount paid by you in the 12 months preceding any claim</li>
              <li>We are not liable for any indirect, incidental, or consequential damages arising from the use of our platform</li>
              <li>We are not responsible for DVSA compliance decisions — the platform is a tool to assist with compliance management, not a guarantee of compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Termination</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Either party may terminate this agreement at any time</li>
              <li>You may cancel your subscription through the Stripe customer portal or by contacting us</li>
              <li>Upon termination, your data will remain available for export for 30 days</li>
              <li>After the 30-day period, your data will be permanently deleted from our systems</li>
              <li>We reserve the right to terminate accounts that violate these terms with immediate effect</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Governing Law</h2>
            <p>
              These Terms & Conditions are governed by and construed in accordance with the laws of England and Wales. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
            <p>
              If you have any questions about these Terms & Conditions, please contact us:
            </p>
            <p className="mt-3">
              <a href="mailto:support@titanfleet.co.uk" className="text-[#5B6CFF] hover:underline" data-testid="link-email-contact">support@titanfleet.co.uk</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Changes to These Terms</h2>
            <p>
              We may update these Terms & Conditions from time to time. Material changes will be communicated to active subscribers via email at least 30 days before they take effect. Continued use of the platform after changes take effect constitutes acceptance of the updated terms.
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