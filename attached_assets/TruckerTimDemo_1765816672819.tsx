import { useState } from "react";
import { useLocation } from "wouter";
import { useBrand } from "@/hooks/use-brand";
import { TitanCard } from "@/components/titan-ui/Card";
import { ArrowRight, Truck, ShieldCheck, Users, FileCheck } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import { useToast } from "@/hooks/use-toast";

const COMPANY = {
  code: "TIM",
  name: "Trucker Tim Transport",
  color: "#dc2626",
  vehicles: 10,
  drivers: 3,
  description: "Owner-operator fleet management",
  initials: "TT"
};

export default function TruckerTimDemo() {
  const [, setLocation] = useLocation();
  const { setCompanyId } = useBrand();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (type: "driver" | "manager") => {
    setIsLoading(true);
    
    try {
      const company = await api.getCompanyByCode(COMPANY.code);
      session.setCompany(company);
      setCompanyId(String(company.id));

      if (type === "driver") {
        const mockDriver = {
          id: 6,
          companyId: company.id,
          email: "driver1@truckertim.com",
          name: "Mike Thompson",
          role: "DRIVER" as const,
          pin: "1234",
          active: true,
          createdAt: new Date(),
          totpSecret: null,
          totpEnabled: null
        };
        session.setUser(mockDriver);
        setLocation("/driver");
      } else {
        const response = await fetch("/api/manager/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyCode: COMPANY.code, pin: "0000" }),
        });
        
        if (!response.ok) throw new Error("Login failed");
        
        const data = await response.json();
        session.setUser(data.manager);
        session.setCompany(data.company);
        setLocation("/manager");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Demo Error",
        description: "Failed to load demo. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
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
              <div 
                className="h-20 w-20 rounded-xl flex items-center justify-center text-white font-heading font-bold text-3xl tracking-tight"
                style={{ backgroundColor: COMPANY.color }}
              >
                {COMPANY.initials}
              </div>
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
              <h2 className="font-heading text-xl font-bold text-foreground mt-4 tracking-tight">Explore the Platform</h2>
              <p className="text-muted-foreground text-sm mt-1">Choose how you'd like to experience the demo</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleLogin("driver")}
                disabled={isLoading}
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
                    <h3 className="font-semibold text-foreground">Driver Experience</h3>
                    <p className="text-muted-foreground text-sm">Mobile-first vehicle checks & fuel logs</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </button>

              <button
                onClick={() => handleLogin("manager")}
                disabled={isLoading}
                className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group motion-fast"
                data-testid="button-demo-manager"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShieldCheck className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">Manager Dashboard</h3>
                    <p className="text-muted-foreground text-sm">Fleet overview, reports & team management</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-center text-muted-foreground text-xs">
                This is a live demo with sample data. Feel free to explore all features.
              </p>
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
