import { useLocation } from "wouter";
import { TitanCard } from "@/components/titan-ui/Card";
import { ArrowRight, Truck, ShieldCheck, Users, FileCheck, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const COMPANY = {
  code: "APEX",
  name: "Apex Transport Ltd",
  color: "#5B6CFF",
  vehicles: 15,
  drivers: 2,
  description: "Demo fleet for Titan Fleet platform",
  driverPin: "1234",
  managerPin: "0000"
};

export default function TitanFleetDemo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleGoToLogin = (type: "driver" | "manager") => {
    if (type === "driver") {
      setLocation("/driver");
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
          className="flex flex-col items-center text-center mb-8"
        >
          <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6">
            <span className="text-3xl font-bold" style={{ color: COMPANY.color }}>TF</span>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            Titan Fleet Demo
          </h1>
          <p className="text-white/80 text-sm mb-4">
            {COMPANY.description}
          </p>
          
          <div className="flex gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="text-sm">{COMPANY.vehicles} vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">{COMPANY.drivers} drivers</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <TitanCard className="p-6 mb-6 bg-slate-50 border-0">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-600">DEMO MODE</span>
            </div>
            
            <h2 className="text-lg font-bold text-center mb-2">Demo Credentials</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Use these to log in and explore
            </p>

            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Company Code</span>
                  <button 
                    onClick={() => copyToClipboard(COMPANY.code, "Company code")}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-xl font-bold font-mono">{COMPANY.code}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Driver PIN</span>
                    <button 
                      onClick={() => copyToClipboard(COMPANY.driverPin, "Driver PIN")}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xl font-bold font-mono">{COMPANY.driverPin}</span>
                </div>
                
                <div className="bg-white rounded-xl p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Manager PIN</span>
                    <button 
                      onClick={() => copyToClipboard(COMPANY.managerPin, "Manager PIN")}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xl font-bold font-mono">{COMPANY.managerPin}</span>
                </div>
              </div>
            </div>
          </TitanCard>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGoToLogin("manager")}
              className="w-full flex items-center justify-between p-5 rounded-2xl text-white font-semibold shadow-lg transition-all"
              style={{ backgroundColor: COMPANY.color }}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5" />
                <span>Manager Dashboard</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGoToLogin("driver")}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-white font-semibold shadow-md hover:shadow-lg transition-all"
              style={{ color: COMPANY.color }}
            >
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5" />
                <span>Driver App</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
