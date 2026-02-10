import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicy() {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Refund Policy</h1>
          <p className="text-slate-400 text-sm">Effective Date: February 2026</p>
        </div>

        <div className="space-y-10 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. 14-Day Free Trial</h2>
            <p>
              All new Titan Fleet accounts include a 14-day free trial with full access to the platform. No payment is taken during the trial period. You may cancel at any time during the trial without being charged. If you do not cancel before the trial expires, your chosen subscription plan will begin and the first monthly payment will be processed automatically via Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Monthly Subscriptions</h2>
            <p>
              Titan Fleet subscriptions are billed monthly. You may cancel your subscription at any time before the start of your next billing cycle. Cancellation will take effect at the end of your current billing period, and you will retain full access to the platform until that date. We do not offer refunds for partial months of service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Statutory Cooling-Off Period</h2>
            <p>
              Under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, UK consumers are entitled to a 14-day cooling-off period from the date of their first payment. If you cancel within this 14-day period, you are entitled to a full refund of your first subscription payment. This statutory right applies in addition to our free trial period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. How to Cancel</h2>
            <p className="mb-3">You can cancel your Titan Fleet subscription using either of the following methods:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><span className="text-white font-medium">Stripe Customer Portal:</span> Access the self-service portal through your account settings to manage or cancel your subscription directly</li>
              <li><span className="text-white font-medium">Email:</span> Send a cancellation request to <a href="mailto:support@titanfleet.co.uk" className="text-[#5B6CFF] hover:underline" data-testid="link-email-cancel">support@titanfleet.co.uk</a> and we will process it within 1 business day</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Refund Requests</h2>
            <p>
              If you believe you are entitled to a refund or have been charged in error, please contact us at{" "}
              <a href="mailto:support@titanfleet.co.uk" className="text-[#5B6CFF] hover:underline" data-testid="link-email-refund">support@titanfleet.co.uk</a>{" "}
              with your account details and the reason for your request. We will review each request on a case-by-case basis and respond within 2 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Processing Time</h2>
            <p>
              Approved refunds will be processed back to your original payment method via Stripe. Please allow 5–10 business days for the refund to appear on your statement. Processing times may vary depending on your bank or card provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Contact Us</h2>
            <p>
              If you have any questions about our refund policy or need assistance, please contact us:
            </p>
            <p className="mt-3">
              <a href="mailto:support@titanfleet.co.uk" className="text-[#5B6CFF] hover:underline" data-testid="link-email-contact">support@titanfleet.co.uk</a>
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