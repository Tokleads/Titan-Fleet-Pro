import { useState } from "react";
import { useLocation } from "wouter";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanInput } from "@/components/titan-ui/Input";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowRight, Lock, Mail } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const data = await response.json();
      
      localStorage.setItem("titan_admin_token", data.adminToken);
      localStorage.setItem("titan_admin_authenticated", "true");

      toast({
        title: "Welcome, Admin",
        description: "Successfully authenticated as Super Admin",
      });

      setLocation("/admin");
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="bg-slate-800 rounded-2xl p-4 inline-block mb-4 shadow-xl border border-slate-700">
            <Shield className="h-12 w-12 text-amber-500" />
          </div>
          <h1 className="text-2xl tracking-tight">
            <span className="font-bold text-white">Titan Fleet</span>
            <span className="font-normal text-slate-400 ml-2">Admin</span>
          </h1>
          <p className="text-slate-500 mt-1">Super Admin Portal</p>
        </div>

        <TitanCard className="p-8 shadow-2xl border-slate-800 bg-slate-900/50 backdrop-blur">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="text-lg font-semibold text-white">Admin Authentication</h2>
              <p className="text-sm text-slate-400 mt-1">
                Sign in to your owner dashboard
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <TitanInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@titanfleet.co.uk"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="input-admin-email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <TitanInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="input-admin-password"
              />
            </div>

            <TitanButton 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
              disabled={!email || !password || isLoading}
              data-testid="button-admin-login"
            >
              {isLoading ? "Authenticating..." : "Access Admin Panel"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </TitanButton>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-500">
              Access restricted to authorized administrators only
            </p>
          </div>
        </TitanCard>
      </motion.div>
    </div>
  );
}
