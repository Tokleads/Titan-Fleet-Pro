import { useBrand } from "@/hooks/use-brand";
import { useLocation } from "wouter";
import { LogOut, LayoutDashboard, Truck, Settings, FileText, Menu, X } from "lucide-react";
import { useState } from "react";
import { TitanButton } from "@/components/titan-ui/Button";
import { motion, AnimatePresence } from "framer-motion";

export function ManagerLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { currentCompany } = useBrand();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border h-screen sticky top-0">
        <div className="p-6">
          <h2 className="font-heading font-bold text-xl tracking-tight uppercase text-sidebar-foreground">{currentCompany.name}</h2>
          <div className="mt-1 px-2 py-0.5 bg-sidebar-accent rounded-full inline-block">
             <p className="text-[10px] font-bold tracking-wider uppercase text-sidebar-accent-foreground">Manager Console</p>
          </div>
        </div>
        
        <nav className="px-3 space-y-1 flex-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Overview" active />
          <NavItem icon={<Truck size={20} />} label="Vehicles" />
          <NavItem icon={<FileText size={20} />} label="Inspections" />
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button 
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-sm font-medium"
            onClick={() => setLocation("/")}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`
      flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
      ${active 
        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' 
        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      }
    `}>
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </div>
  );
}

export function DriverLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { currentCompany } = useBrand();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header - Titan Style */}
      <header className="bg-card text-card-foreground p-4 shadow-sm border-b border-border sticky top-0 z-40">
        <div className="flex justify-between items-center max-w-md mx-auto w-full">
            <div className="flex items-center gap-3">
                {/* Brand Logo Placeholder */}
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                    {currentCompany.name.substring(0, 1)}
                </div>
                <div>
                    <h1 className="font-heading font-bold text-base leading-none">{currentCompany.name}</h1>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Driver Portal</p>
                </div>
            </div>
            
            <TitanButton 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setIsMenuOpen(true)}
            >
                <Menu size={20} />
            </TitanButton>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                    onClick={() => setIsMenuOpen(false)}
                />
                <motion.div 
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 right-0 w-[280px] bg-card border-l border-border z-50 p-6 flex flex-col shadow-2xl"
                >
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="font-bold text-lg">Menu</h2>
                        <TitanButton variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                            <X size={20} />
                        </TitanButton>
                    </div>

                    <nav className="space-y-2 flex-1">
                        <MobileNavItem icon={<Truck size={20} />} label="My Vehicle" active />
                        <MobileNavItem icon={<FileText size={20} />} label="History" />
                        <MobileNavItem icon={<Settings size={20} />} label="Settings" />
                    </nav>

                    <TitanButton 
                        variant="destructive" 
                        className="w-full justify-start mt-auto"
                        onClick={() => setLocation("/")}
                    >
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </TitanButton>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-md mx-auto w-full p-4">
        {children}
      </main>
    </div>
  );
}

function MobileNavItem({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <div className={`
            flex items-center gap-4 p-3 rounded-xl transition-colors
            ${active ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:bg-secondary/50'}
        `}>
            {icon}
            <span>{label}</span>
        </div>
    )
}
