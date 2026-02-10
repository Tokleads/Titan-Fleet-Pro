import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, Lock } from "lucide-react";

export default function ResetPassword() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing reset token. Please use the link from your email.");
      setLoading(false);
      return;
    }

    fetch(`/api/auth/verify-reset-token?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Invalid token");
        }
        return res.json();
      })
      .then(() => setValid(true))
      .catch((err) => setError(err.message))
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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Reset failed");
      }

      setSuccess(true);
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
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900" data-testid="text-reset-success">Password Reset!</h2>
              <p className="text-slate-500 text-sm">
                Your password has been updated successfully. You can now log in with your new password.
              </p>
              <Link href="/manager/login">
                <a className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center mt-4" data-testid="link-login-after-reset">
                  Go to Login
                </a>
              </Link>
            </div>
          ) : !valid ? (
            <div className="text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertCircle className="h-7 w-7 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Invalid Link</h2>
              <p className="text-slate-500 text-sm" data-testid="text-reset-error">{error}</p>
              <Link href="/forgot-password">
                <a className="inline-block text-blue-600 hover:text-blue-700 text-sm font-medium mt-2" data-testid="link-request-new-reset">
                  Request a new reset link
                </a>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    data-testid="input-new-password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    data-testid="input-confirm-new-password"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm" data-testid="text-reset-form-error">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !password || !confirmPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                data-testid="button-reset-password"
              >
                {submitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
