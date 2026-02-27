import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useBrand } from "@/hooks/use-brand";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanInput } from "@/components/titan-ui/Input";
import { TitanCard } from "@/components/titan-ui/Card";
import { ArrowRight, Truck, ShieldCheck, QrCode, Bell, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import { useToast } from "@/hooks/use-toast";

interface BroadcastNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  createdAt: string;
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const { refreshCompany } = useBrand();
  const { toast } = useToast();
  const [companyCode, setCompanyCode] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"driver" | "manager">("driver");
  const [announcements, setAnnouncements] = useState<BroadcastNotification[]>([]);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);

  // Fetch announcements when company code has 3+ characters
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (companyCode.length < 3) {
        setAnnouncements([]);
        return;
      }
      
      setIsLoadingAnnouncements(true);
      try {
        const response = await fetch(`/api/notifications/public/${companyCode.toUpperCase()}`);
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data);
          setShowAnnouncements(true);
        } else {
          setAnnouncements([]);
        }
      } catch (error) {
        setAnnouncements([]);
      } finally {
        setIsLoadingAnnouncements(false);
      }
    };

    const debounce = setTimeout(fetchAnnouncements, 500);
    return () => clearTimeout(debounce);
  }, [companyCode]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (mode === "driver") {
        const response = await fetch("/api/driver/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyCode: companyCode.toUpperCase(), pin }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Login failed");
        }
        
        const { user, company } = await response.json();
        session.setCompany(company);
        session.setUser(user);
        refreshCompany();
        const isManager = ['TRANSPORT_MANAGER', 'ADMIN', 'MANAGER'].includes(user.role);
        localStorage.setItem("titanfleet_last_role", isManager ? "manager" : "driver");
        setLocation(isManager ? "/manager" : "/driver");
      } else {
        const company = await api.getCompanyByCode(companyCode);
        session.setCompany(company);
        refreshCompany();
        setLocation("/manager/login");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Company not found",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-900 rounded-b-[3rem] shadow-2xl z-0" />
      
      <div className="w-full max-w-md mx-auto p-6 z-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="text-center space-y-3 pt-8">
                <div className="bg-white rounded-2xl p-4 inline-block mx-auto mb-3 shadow-xl">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg bg-slate-900">
                        TF
                    </div>
                </div>
                <span className="text-xl tracking-tight block">
                    <span className="font-bold text-white">Titan</span>
                    <span className="font-normal text-slate-400 ml-1">Fleet</span>
                </span>
                <p className="text-slate-400 text-sm font-medium">Driver Portal</p>
            </div>

            <TitanCard className="p-6 sm:p-8 shadow-2xl border-0 ring-1 ring-black/5 bg-white">
                <form onSubmit={handleStart} className="space-y-6">
                    {mode === "driver" ? (
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="titan-section-label ml-1">Company Code</label>
                                <TitanInput 
                                    placeholder="Enter company code" 
                                    value={companyCode}
                                    onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                                    className="h-14 text-lg font-mono tracking-wide uppercase bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    icon={<ShieldCheck className="h-5 w-5" />}
                                    data-testid="input-company-code"
                                />
                            </div>

                            {/* Company Announcements */}
                            <AnimatePresence>
                              {announcements.length > 0 && showAnnouncements && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                      <Bell className="h-4 w-4" />
                                      <span>Company Announcements</span>
                                    </div>
                                    <button 
                                      type="button"
                                      onClick={() => setShowAnnouncements(false)}
                                      className="text-slate-400 hover:text-slate-600 p-1"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {announcements.map((announcement) => (
                                      <div 
                                        key={announcement.id}
                                        className={`p-3 rounded-lg border text-sm ${
                                          announcement.priority?.toLowerCase() === 'urgent' 
                                            ? 'bg-red-50 border-red-200 text-red-800'
                                            : announcement.priority?.toLowerCase() === 'high'
                                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                                            : 'bg-blue-50 border-blue-200 text-blue-800'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2">
                                          {announcement.priority?.toLowerCase() === 'urgent' ? (
                                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                          ) : announcement.priority?.toLowerCase() === 'high' ? (
                                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                          ) : (
                                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium">{announcement.title}</p>
                                            <p className="text-xs opacity-80 mt-0.5">{announcement.message}</p>
                                            <p className="text-[10px] opacity-60 mt-1">
                                              {new Date(announcement.createdAt).toLocaleDateString('en-GB', { 
                                                weekday: 'short', 
                                                day: 'numeric', 
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            
                            <div className="space-y-1.5">
                                <label className="titan-section-label ml-1">Driver PIN</label>
                                <TitanInput 
                                    placeholder="Enter 4-digit PIN" 
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    className="h-14 text-lg bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    maxLength={4}
                                    data-testid="input-pin"
                                />
                            </div>
                        </div>
                    ) : (
                         <div className="space-y-5">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 items-start">
                                <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-blue-900">Manager Console</p>
                                    <p className="text-xs text-blue-700 mt-1">Please log in with your corporate credentials.</p>
                                </div>
                            </div>
                            <TitanInput 
                                placeholder="Company Code" 
                                value={companyCode}
                                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                                className="h-14 bg-slate-50 uppercase"
                            />
                            <TitanInput 
                                placeholder="Manager PIN" 
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="h-14 bg-slate-50"
                                maxLength={6}
                            />
                        </div>
                    )}

                    <TitanButton 
                        size="lg" 
                        className="w-full h-14 text-base font-bold shadow-titan-lg shadow-primary/20"
                        isLoading={isLoading}
                        data-testid="button-login"
                    >
                        {mode === "driver" ? "Start Shift" : "Access Console"} <ArrowRight className="ml-2 h-5 w-5" />
                    </TitanButton>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    {mode === "driver" ? (
                         <button 
                            type="button"
                            onClick={() => setMode("manager")}
                            className="w-full py-2 text-sm text-slate-400 font-medium hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <ShieldCheck className="h-4 w-4" /> Transport Manager Login
                        </button>
                    ) : (
                        <button 
                            type="button"
                            onClick={() => setMode("driver")}
                            className="w-full py-2 text-sm text-slate-400 font-medium hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Truck className="h-4 w-4" /> Back to Driver Login
                        </button>
                    )}
                </div>
            </TitanCard>

            {mode === "driver" && (
                <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 text-white/60 hover:bg-white/10 hover:text-white transition-all">
                        <QrCode className="h-6 w-6" />
                        <span className="text-xs font-medium">Scan Vehicle</span>
                    </button>
                    <button className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 text-white/60 hover:bg-white/10 hover:text-white transition-all">
                        <ShieldCheck className="h-6 w-6" />
                        <span className="text-xs font-medium">Help & Support</span>
                    </button>
                </div>
            )}
        </motion.div>
      </div>
      
      <div className="absolute bottom-6 left-0 right-0 text-center z-10 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link href="/manager/login" className="text-xs text-slate-400 hover:text-white transition-colors" data-testid="link-manager-login">Manager Login</Link>
          <span className="text-slate-600">·</span>
          <a href="/?marketing=true" className="text-xs text-slate-400 hover:text-white transition-colors" data-testid="link-view-website">View our website</a>
        </div>
        <span className="text-[10px] tracking-widest uppercase opacity-60 block">
          <span className="font-bold text-slate-700">Titan</span>
          <span className="font-normal text-slate-500 ml-1">Fleet</span>
        </span>
      </div>
    </div>
  );
}
