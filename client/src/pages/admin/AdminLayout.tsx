import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  Building2, 
  Settings, 
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  UserPlus,
  Gift
} from "lucide-react";

const navItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/companies", icon: Building2, label: "Companies" },
  { path: "/admin/subscriptions", icon: CreditCard, label: "Subscriptions" },
  { path: "/admin/signups", icon: UserPlus, label: "Signups" },
  { path: "/admin/referrals", icon: Gift, label: "Referrals" },
  { path: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("titan_admin_authenticated");
    if (!isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("titan_admin_token");
    localStorage.removeItem("titan_admin_authenticated");
    setLocation("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-out relative`}>
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-800">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm bg-amber-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <span className="text-lg tracking-tight">
                <span className="font-bold text-white">Titan Fleet</span>
              </span>
              <p className="text-[10px] text-amber-500 uppercase tracking-wider font-medium">Super Admin</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path || 
              (item.path !== "/admin" && location.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive 
                    ? 'bg-amber-600/20 text-amber-500' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-amber-500' : 'text-slate-500'}`} />
                {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-red-900/20 hover:text-red-400 rounded-xl transition-all duration-150 ${!sidebarOpen ? 'justify-center' : ''}`}
            data-testid="button-admin-logout"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Sign out</span>}
          </button>
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 h-6 w-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-700 transition-colors z-10"
          data-testid="button-toggle-admin-sidebar"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">Titan Fleet Admin</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-600/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white">Super Admin</p>
              <p className="text-xs text-slate-500">System Administrator</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
