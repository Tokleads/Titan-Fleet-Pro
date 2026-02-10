import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function SetupAccount() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<{ email: string; tier: string; maxVehicles: number } | null>(null);
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [success, setSuccess] = useState<{ companyCode: string; email: string; userName: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing setup token. Please use the link from your email.");
      setLoading(false);
      return;
    }

    fetch(`/api/auth/verify-setup-token?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Invalid token");
        }
        return res.json();
      })
      .then((data) => {
        setTokenData({ email: data.email, tier: data.tier, maxVehicles: data.maxVehicles });
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/setup-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, companyName, contactName, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Setup failed");
      }

      const data = await res.json();
      setSuccess({ companyCode: data.companyCode, email: data.email, userName: data.userName });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2" data-testid="text-setup-success">Account Created!</h2>
            <p className="text-slate-500 mb-6">Your Titan Fleet account is ready to go.</p>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-left mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Company Code</span>
                <span className="font-mono font-bold text-slate-900 text-lg" data-testid="text-company-code">{success.companyCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Email</span>
                <span className="text-slate-900 text-sm" data-testid="text-account-email">{success.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Name</span>
                <span className="text-slate-900 text-sm">{success.userName}</span>
              </div>
            </div>

            <button
              onClick={() => setLocation("/manager/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              data-testid="button-go-to-login"
            >
              Go to Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="bg-white rounded-2xl p-4 inline-block mb-4 shadow-xl">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg bg-slate-900">
              TF
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Set Up Your Account</h1>
          {tokenData && (
            <p className="text-blue-400 mt-1">
              {tokenData.tier.charAt(0).toUpperCase() + tokenData.tier.slice(1)} Plan
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && !tokenData && (
            <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-lg mb-6" data-testid="text-setup-error">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {tokenData && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={tokenData.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500"
                  data-testid="input-setup-email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Logistics"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  data-testid="input-company-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. John Smith"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  data-testid="input-contact-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  data-testid="input-setup-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  data-testid="input-setup-confirm-password"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm" data-testid="text-form-error">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !companyName || !contactName || !password || !confirmPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                data-testid="button-setup-account"
              >
                {submitting ? "Setting up..." : "Create My Account"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
