import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Truck, User, Mail, Phone, CheckCircle2, AlertTriangle, Loader2, Copy, Check } from "lucide-react";

export default function DriverSignup() {
  const [, params] = useRoute("/join/:token");
  const token = params?.token || "";

  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ pin: string; companyCode: string } | null>(null);
  const [pinCopied, setPinCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/drivers/invite/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Invalid invite link");
          return;
        }
        const data = await res.json();
        setCompanyName(data.companyName || "");
      })
      .catch(() => setError("Failed to validate invite link"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/drivers/invite/${token}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      setResult({ pin: data.pin, companyCode: data.companyCode });
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyPin() {
    if (!result) return;
    navigator.clipboard.writeText(result.pin).then(() => {
      setPinCopied(true);
      setTimeout(() => setPinCopied(false), 2500);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid Invite</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center" data-testid="signup-success">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome Aboard!</h1>
          <p className="text-slate-600 mb-5">You're registered. Save your details below — you'll need them to log in.</p>

          <div className="bg-slate-50 rounded-xl p-5 space-y-4 mb-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Company Code</p>
                <p className="text-xl font-bold text-slate-900 font-mono" data-testid="text-company-code">{result.companyCode}</p>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Your PIN</p>
              <div className="flex items-center justify-between">
                <p className="text-5xl font-bold text-blue-600 font-mono tracking-[0.25em]" data-testid="text-driver-pin">{result.pin}</p>
                <button
                  onClick={copyPin}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors"
                  data-testid="button-copy-pin"
                >
                  {pinCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {pinCopied ? 'Copied!' : 'Copy PIN'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-left">
            <p className="text-xs font-semibold text-amber-800">
              Screenshot or note your PIN now — it cannot be recovered once you leave this page.
            </p>
          </div>

          <a
            href={`/app?code=${encodeURIComponent(result.companyCode)}`}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            data-testid="link-go-to-app"
          >
            <Truck className="h-5 w-5" />
            Go to Driver App
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Join {companyName}</h1>
          <p className="text-slate-600 mt-1">Register as a driver to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
                required
                autoComplete="name"
                data-testid="input-driver-name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email (optional)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoComplete="email"
                data-testid="input-driver-email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone (optional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07123 456789"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoComplete="tel"
                data-testid="input-driver-phone"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg" data-testid="text-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            data-testid="button-register"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {submitting ? "Registering..." : "Register as Driver"}
          </button>
        </form>
      </div>
    </div>
  );
}
