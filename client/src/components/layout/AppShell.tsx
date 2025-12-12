import { useBrand } from "@/hooks/use-brand";
import { useLocation, useRoute } from "wouter";
import { LogOut, Home, History, UploadCloud, Settings, Menu, X, Truck, FileText } from "lucide-react";
import { useState } from "react";
import { TitanButton } from "@/components/titan-ui/Button";
import { motion, AnimatePresence } from "framer-motion";

export function DriverLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { currentCompany, tenant } = useBrand();

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col pb-safe">
      {/* Mobile Header - Titan Style */}
      <header className="bg-white text-slate-900 px-4 py-3 shadow-sm border-b border-slate-100 sticky top-0 z-40">
        <div className="flex justify-between items-center max-w-md mx-auto w-full">
            <div className="flex items-center gap-3">
                {tenant.logoUrl ? (
                    <img 
                        src={tenant.logoUrl} 
                        alt={tenant.companyName}
                        className="h-8 w-auto"
                    />
                ) : (
                    <div 
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                        style={{ backgroundColor: tenant.colors.primary }}
                    >
                        {tenant.companyName.substring(0, 1)}
                    </div>
                )}
                <div>
                    <h1 className="font-semibold text-[15px] leading-none text-slate-900">{tenant.companyName}</h1>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Driver Portal</p>
                </div>
            </div>
            
            {/* Online Status */}
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto p-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation - Enhanced */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200/60 bg-white/90 backdrop-blur z-50 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
            <BottomNavItem 
                icon={<Home size={22} />} 
                label="Home" 
                active={isActive("/driver")} 
                onClick={() => setLocation("/driver")}
            />
            <BottomNavItem 
                icon={<FileText size={22} />} 
                label="History" 
                active={isActive("/driver/history")} 
                onClick={() => setLocation("/driver/history")}
            />
            <BottomNavItem 
                icon={<UploadCloud size={22} />} 
                label="Queue" 
                active={isActive("/driver/queue")} 
                onClick={() => setLocation("/driver/queue")}
                badge={0}
            />
            <BottomNavItem 
                icon={<Settings size={22} />} 
                label="Settings" 
                active={isActive("/driver/settings")} 
                onClick={() => setLocation("/driver/settings")}
            />
        </div>
      </nav>
    </div>
  );
}

function BottomNavItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: number }) {
    return (
        <button 
            onClick={onClick}
            className={`
                relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors
                ${active ? 'text-primary' : 'text-slate-500 hover:text-slate-700'}
            `}
        >
            <div className="relative">
                {icon}
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
                        {badge}
                    </span>
                )}
            </div>
            <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            {active && (
                <motion.div 
                    layoutId="bottom-nav-indicator"
                    className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                />
            )}
        </button>
    )
}
