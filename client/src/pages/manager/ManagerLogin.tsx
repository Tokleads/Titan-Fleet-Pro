import { useState } from "react";
import { useLocation, Link } from "wouter";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanInput } from "@/components/titan-ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import tenantConfig from "@/config/tenant";
import { session } from "@/lib/session";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowRight, Smartphone, ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function ManagerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loginMode, setLoginMode] = useState<'pin' | 'email'>('pin');
  const [companyCode, setCompanyCode] = useState("APEX");
  const [pin, setPin] = useState("7429");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [totpToken, setTotpToken] = useState("");
  const [managerName, setManagerName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginMode === 'pin' && (!companyCode || !pin)) return;
    if (loginMode === 'email' && (!email || !password)) return;

    setIsLoading(true);
    try {
      let response: Response;
      
      if (loginMode === 'email') {
        response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email, 
            password,
            totpToken: requiresTwoFactor ? totpToken : undefined
          }),
        });
      } else {
        response = await fetch("/api/manager/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            companyCode: companyCode.toUpperCase(), 
            pin,
            totpToken: requiresTwoFactor ? totpToken : undefined
          }),
        });
      }

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
      
      if (data.token) {
        session.setToken(data.token);
      }
      session.setUser(data.manager);
      session.setCompany(data.company);
      localStorage.setItem("titanfleet_last_role", "manager");
      const isMobile = window.innerWidth < 768;
      setLocation(isMobile ? "/manager/app" : "/manager");
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
              <motion.div 
                key="login-form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setLoginMode('pin')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${loginMode === 'pin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    data-testid="button-mode-pin"
                  >
                    Company Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMode('email')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${loginMode === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    data-testid="button-mode-email"
                  >
                    Email Login
                  </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  {loginMode === 'pin' ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                        <TitanInput
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          data-testid="input-login-email"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            data-testid="input-login-password"
                            className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 pr-12 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary/40"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                            data-testid="button-toggle-password"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <TitanButton 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMode === 'pin' ? (!companyCode || !pin || isLoading) : (!email || !password || isLoading)}
                    data-testid="button-login"
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </TitanButton>

                  {loginMode === 'email' && (
                    <div className="text-center">
                      <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium" data-testid="link-forgot-password">
                          Forgot your password?
                      </Link>
                    </div>
                  )}
                </form>
              </motion.div>
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

        </TitanCard>

        <div className="mt-6 text-center flex items-center justify-center gap-4">
          <Link href="/app" className="text-xs text-slate-400 hover:text-white transition-colors" data-testid="link-driver-login">Driver Login</Link>
          <span className="text-slate-600">·</span>
          <a href="/?marketing=true" className="text-xs text-slate-400 hover:text-white transition-colors" data-testid="link-view-website">View our website</a>
        </div>
      </motion.div>
    </div>
  );
}
