import { useLocation } from "wouter";
import { TitanCard } from "@/components/titan-ui/Card";
import { ArrowRight, Truck, ShieldCheck, Users, FileCheck, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const COMPANY = {
  code: "APEX",
  name: "DC European Haulage Ltd",
  color: "#4169b2",
  vehicles: 15,
  drivers: 2,
  description: "European logistics and haulage specialists",
  logo: "/dc-european-logo.png",
  driverPin: "1234",
  managerPin: "0000"
};

export default function DCEuropeanDemo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleGoToLogin = (type: "driver" | "manager") => {
    if (type === "driver") {
      setLocation("/");
    } else {
      setLocation("/manager/login");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center relative overflow-hidden bg-background">
      <div 
        className="absolute top-0 left-0 w-full h-1/2 rounded-b-[3rem] z-0"
        style={{ 
          background: `linear-gradient(135deg, ${COMPANY.color} 0%, ${COMPANY.color}dd 100%)`,
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2)'
        }}
      />
      
      <div className="w-full max-w-md mx-auto p-6 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="space-y-6"
        >
          <div className="text-center space-y-4 pt-8">
            <div className="bg-white rounded-2xl p-4 inline-block mx-auto shadow-xl ring-1 ring-black/5">
              <img 
                src={COMPANY.logo} 
                alt={COMPANY.name}
                className="h-20 w-auto object-contain"
              />
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-2xl font-bold text-white tracking-tight">{COMPANY.name}</h1>
              <p className="text-white/80 text-sm font-medium">{COMPANY.description}</p>
            </div>
            <div className="flex justify-center gap-6 text-white/90 text-sm font-medium">
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4" /> {COMPANY.vehicles} vehicles
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" /> {COMPANY.drivers} drivers
              </span>
            </div>
          </div>

          <TitanCard className="p-6 shadow-xl border-0 ring-1 ring-black/5 bg-card">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold tracking-wide">
                <FileCheck className="h-3.5 w-3.5" /> DEMO MODE
              </span>
              <h2 className="font-heading text-xl font-bold text-foreground mt-4 tracking-tight">Demo Credentials</h2>
              <p className="text-muted-foreground text-sm mt-1">Use these to log in and explore</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Company Code</span>
                  <button onClick={() => copyToClipboard(COMPANY.code, "Company code")} className="text-primary hover:text-primary/80">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="font-mono text-xl font-bold text-slate-900 tracking-wider">{COMPANY.code}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide block mb-1">Driver PIN</span>
                  <span className="font-mono text-lg font-bold text-blue-900">{COMPANY.driverPin}</span>
                </div>
                <div className="bg-slate-100 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">Manager PIN</span>
                  <span className="font-mono text-lg font-bold text-slate-900">{COMPANY.managerPin}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleGoToLogin("driver")}
                className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group motion-fast"
                data-testid="button-demo-driver"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="h-12 w-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: `${COMPANY.color}15` }}
                  >
                    <Truck className="h-6 w-6" style={{ color: COMPANY.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">Driver App Login</h3>
                    <p className="text-muted-foreground text-sm">Use code {COMPANY.code} + PIN {COMPANY.driverPin}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </button>

              <button
                onClick={() => handleGoToLogin("manager")}
                className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group motion-fast"
                data-testid="button-demo-manager"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShieldCheck className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">Manager Dashboard Login</h3>
                    <p className="text-muted-foreground text-sm">Use code {COMPANY.code} + PIN {COMPANY.managerPin}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </button>
            </div>
          </TitanCard>

          <div className="text-center">
            <a href="/" className="text-white/70 hover:text-white text-sm font-medium transition-colors motion-fast">
              ← Back to main site
            </a>
          </div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-6 left-0 right-0 text-center z-10">
        <span className="text-[11px] tracking-[0.15em] uppercase">
          <span className="font-bold text-foreground/60">Titan</span>
          <span className="font-normal text-foreground/40 ml-1">Fleet</span>
        </span>
      </div>
    </div>
  );
}
