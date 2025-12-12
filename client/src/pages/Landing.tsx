import { useState } from "react";
import { useLocation } from "wouter";
import { useBrand } from "@/hooks/use-brand";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanInput } from "@/components/titan-ui/Input";
import { TitanCard } from "@/components/titan-ui/Card";
import { ArrowRight, Truck, ShieldCheck, QrCode } from "lucide-react";
import { MOCK_COMPANIES } from "@/lib/mockData";
import { motion } from "framer-motion";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { setCompanyId } = useBrand();
  const [companyCode, setCompanyCode] = useState("APEX"); // Default for demo
  const [driverId, setDriverId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"driver" | "manager">("driver");

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API lookup
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // For demo, just pick the first company if code matches mock logic
    // In real app, this would fetch config
    setCompanyId(MOCK_COMPANIES[0].id);
    
    if (mode === "driver") {
        setLocation("/driver");
    } else {
        setLocation("/manager");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center relative overflow-hidden">
      {/* Abstract Background Shapes for Premium Feel */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-900 rounded-b-[3rem] shadow-2xl z-0" />
      
      <div className="w-full max-w-md mx-auto p-6 z-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="text-center space-y-2 pt-8">
                <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Truck className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">FleetCheck</h1>
                <p className="text-slate-400 text-sm font-medium">Professional Driver Portal</p>
            </div>

            {/* Login Card */}
            <TitanCard className="p-6 sm:p-8 shadow-2xl border-0 ring-1 ring-black/5 bg-white">
                <form onSubmit={handleStart} className="space-y-6">
                    {mode === "driver" ? (
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Company Code</label>
                                <TitanInput 
                                    placeholder="e.g. APEX" 
                                    value={companyCode}
                                    onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                                    className="h-14 text-lg font-mono tracking-wide uppercase bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    icon={<ShieldCheck className="h-5 w-5" />}
                                />
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Driver ID</label>
                                <TitanInput 
                                    placeholder="Enter your ID" 
                                    value={driverId}
                                    onChange={(e) => setDriverId(e.target.value)}
                                    className="h-14 text-lg bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                />
                            </div>
                        </div>
                    ) : (
                         <div className="space-y-5">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 items-start">
                                <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-blue-900">Manager Console</p>
                                    <p className="text-xs text-blue-700 mt-1">Please log in with your corporate credentials to access the fleet dashboard.</p>
                                </div>
                            </div>
                            <TitanInput 
                                placeholder="Email Address" 
                                type="email"
                                className="h-14 bg-slate-50"
                            />
                            <TitanInput 
                                placeholder="Password" 
                                type="password"
                                className="h-14 bg-slate-50"
                            />
                        </div>
                    )}

                    <TitanButton 
                        size="lg" 
                        className="w-full h-14 text-base font-bold shadow-titan-lg shadow-primary/20"
                        isLoading={isLoading}
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

            {/* Quick Actions (Mock) */}
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
      
      {/* Footer Branding */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-10">
        <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase opacity-50">Powered by Titan Fleet</p>
      </div>
    </div>
  );
}
