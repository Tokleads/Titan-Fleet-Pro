import { useState } from "react";
import { useLocation } from "wouter";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanInput } from "@/components/titan-ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import tenantConfig from "@/config/tenant";
import { session } from "@/lib/session";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowRight, Smartphone, ArrowLeft } from "lucide-react";

export default function ManagerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [companyCode, setCompanyCode] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [totpToken, setTotpToken] = useState("");
  const [managerName, setManagerName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyCode || !pin) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/manager/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          companyCode: companyCode.toUpperCase(), 
          pin,
          totpToken: requiresTwoFactor ? totpToken : undefined
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const data = await response.json();
      
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setManagerName(data.managerName);
        return;
      }
      
      session.setUser(data.manager);
      session.setCompany(data.company);

      setLocation("/manager");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      if (requiresTwoFactor) {
        setTotpToken("");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    setRequiresTwoFactor(false);
    setTotpToken("");
    setManagerName("");
  };

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
          <span className="text-2xl tracking-tight">
            <span className="font-bold text-white">Titan</span>
            <span className="font-normal text-slate-400 ml-1">Fleet</span>
          </span>
          <p className="text-slate-400 mt-1">Transport Manager Portal</p>
        </div>

        <TitanCard className="p-8 shadow-2xl border-0">
          <AnimatePresence mode="wait">
            {!requiresTwoFactor ? (
              <motion.form 
                key="login-form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleLogin} 
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company Code</label>
                  <TitanInput
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                    placeholder="e.g. APEX"
                    className="uppercase"
                    data-testid="input-company-code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Manager PIN</label>
                  <TitanInput
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter PIN"
                    maxLength={6}
                    data-testid="input-pin"
                  />
                </div>

                <TitanButton 
                  type="submit" 
                  className="w-full" 
                  disabled={!companyCode || !pin || isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </TitanButton>
              </motion.form>
            ) : (
              <motion.form 
                key="2fa-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Smartphone className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Two-Factor Authentication</h2>
                  <p className="text-sm text-muted-foreground">
                    Hi {managerName}! Enter the 6-digit code from your authenticator app.
                  </p>
                </div>

                <div>
                  <TitanInput
                    type="text"
                    value={totpToken}
                    onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus
                    data-testid="input-totp-login"
                  />
                </div>

                <div className="flex gap-3">
                  <TitanButton 
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </TitanButton>
                  <TitanButton 
                    type="submit" 
                    className="flex-1" 
                    disabled={totpToken.length !== 6 || isLoading}
                    data-testid="button-verify"
                  >
                    {isLoading ? "Verifying..." : "Verify"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </TitanButton>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {!requiresTwoFactor && (
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Demo: Company Code <span className="font-mono font-bold">APEX</span>, PIN <span className="font-mono font-bold">0000</span>
              </p>
            </div>
          )}
        </TitanCard>
      </motion.div>
    </div>
  );
}
