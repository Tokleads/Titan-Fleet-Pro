import { useState } from "react";
import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  AlertTriangle, 
  Fuel, 
  Truck, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Bell,
  FileText,
  User,
  Shield,
  ClipboardList,
  MapPin,
  Clock,
  Radio,
  Navigation,
  BarChart3,
  Users,
  FolderOpen,
  Activity,
  DollarSign
} from "lucide-react";
import tenantConfig from "@/config/tenant";
import { session } from "@/lib/session";
import { TitanIntelligenceSidebar } from "@/components/TitanIntelligenceSidebar";

const navItems = [
  { path: "/manager", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/manager/advanced-dashboard", icon: BarChart3, label: "Analytics" },
  { path: "/manager/live-tracking", icon: Navigation, label: "Live Tracking" },
  { path: "/manager/timesheets", icon: Clock, label: "Timesheets" },
  { path: "/manager/pay-rates", icon: DollarSign, label: "Pay Rates" },
  { path: "/manager/titan-command", icon: Radio, label: "Titan Command" },
  { path: "/manager/geofences", icon: MapPin, label: "Geofences" },
  { path: "/manager/inspections", icon: ClipboardCheck, label: "Inspections" },
  { path: "/manager/defects", icon: AlertTriangle, label: "Defects" },
  { path: "/manager/fuel", icon: Fuel, label: "Fuel Log" },
  { path: "/manager/fleet", icon: Truck, label: "Fleet" },
  { path: "/manager/documents", icon: FileText, label: "Documents" },
  { path: "/manager/fleet-documents", icon: FolderOpen, label: "Fleet Docs" },
  { path: "/manager/user-roles", icon: Users, label: "User Roles" },
  { path: "/manager/notifications", icon: Bell, label: "Notifications" },
  { path: "/manager/license", icon: Shield, label: "License" },
  { path: "/manager/audit-log", icon: ClipboardList, label: "Audit Log" },
  { path: "/admin/performance", icon: Activity, label: "Performance" },
  { path: "/manager/settings", icon: Settings, label: "Settings" },
];

export function ManagerLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = session.getUser();

  const handleLogout = () => {
    session.clear();
    setLocation("/manager/login");
  };

  return (
    <div className="min-h-screen bg-slate-100/50 flex relative">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} bg-white border-r border-slate-200/80 flex flex-col transition-all duration-300 ease-out relative`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-100">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm bg-slate-900">
            TF
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <span className="text-lg tracking-tight">
                <span className="font-bold text-slate-900">Titan</span>
                <span className="font-normal text-slate-600 ml-1">Fleet</span>
              </span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Fleet Manager</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path || 
              (item.path !== "/manager" && location.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-150 ${!sidebarOpen ? 'justify-center' : ''}`}
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Sign out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 h-6 w-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
          data-testid="button-toggle-sidebar"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-3.5 w-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
          )}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 mr-80">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search VRM, driver, inspection..."
                className="w-80 h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                data-testid="input-global-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              className="relative h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5 text-slate-500" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
            
            <div className="w-px h-8 bg-slate-200 mx-2" />
            
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.name || 'Manager'}</p>
                <p className="text-xs text-slate-500">Transport Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Titan Intelligence Sidebar */}
      <TitanIntelligenceSidebar />
    </div>
  );
}
