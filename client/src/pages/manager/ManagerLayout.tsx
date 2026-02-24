import { useState, useEffect, useRef, useCallback } from "react";
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
  Package,
  Clock,
  Radio,
  Navigation,
  BarChart3,
  Users,
  FolderOpen,
  PoundSterling,
  TrendingUp,
  Gift,
  CarFront,
  ScrollText,
  Brain,
  Smartphone
} from "lucide-react";
import tenantConfig from "@/config/tenant";
import { session } from "@/lib/session";
import { TitanIntelligenceSidebar } from "@/components/TitanIntelligenceSidebar";
import { NotificationBell } from "@/components/NotificationBell";

const navItems = [
  { path: "/manager", icon: LayoutDashboard, label: "Dashboard", permissionKey: "dashboard" },
  { path: "/manager/advanced-dashboard", icon: BarChart3, label: "Analytics", permissionKey: "analytics" },
  { path: "/manager/live-tracking", icon: Navigation, label: "Live Tracking", permissionKey: "live-tracking" },
  { path: "/manager/drivers", icon: Users, label: "Drivers", permissionKey: "drivers" },
  { path: "/manager/timesheets", icon: Clock, label: "Timesheets", permissionKey: "timesheets" },
  { path: "/manager/pay-rates", icon: PoundSterling, label: "Pay Rates", permissionKey: "pay-rates" },
  { path: "/manager/fuel-intelligence", icon: TrendingUp, label: "Fuel Intelligence", permissionKey: "fuel-intelligence" },
  { path: "/manager/titan-command", icon: Radio, label: "Titan Command", permissionKey: "titan-command" },
  { path: "/manager/geofences", icon: MapPin, label: "Geofences", permissionKey: "geofences" },
  { path: "/manager/inspections", icon: ClipboardCheck, label: "Inspections", permissionKey: "inspections" },
  { path: "/manager/deliveries", icon: Package, label: "Deliveries", permissionKey: "deliveries" },
  { path: "/manager/defects", icon: AlertTriangle, label: "Defects", permissionKey: "defects" },
  { path: "/manager/ai-insights", icon: Brain, label: "AI Insights", permissionKey: "ai-insights" },
  { path: "/manager/fuel", icon: Fuel, label: "Fuel Log", permissionKey: "fuel-log" },
  { path: "/manager/operator-licence", icon: ScrollText, label: "O Licence", permissionKey: "o-licence" },
  { path: "/manager/fleet", icon: Truck, label: "Fleet", permissionKey: "fleet" },
  { path: "/manager/vehicle-management", icon: CarFront, label: "Vehicle Mgmt", permissionKey: "vehicle-mgmt" },
  { path: "/manager/documents", icon: FileText, label: "Documents", permissionKey: "documents" },
  { path: "/manager/fleet-documents", icon: FolderOpen, label: "Fleet Docs", permissionKey: "fleet-docs" },
  { path: "/manager/user-roles", icon: Users, label: "User Roles", permissionKey: "user-roles" },
  { path: "/manager/notifications", icon: Bell, label: "Notifications", permissionKey: "notifications" },
  { path: "/manager/referrals", icon: Gift, label: "Referrals", permissionKey: "referrals" },
  { path: "/manager/audit-log", icon: ClipboardList, label: "Audit Log", permissionKey: "audit-log" },
  { path: "/manager/settings", icon: Settings, label: "Settings", permissionKey: "settings" },
];

interface SearchResults {
  drivers: { id: number; name: string; email: string; role: string }[];
  vehicles: { id: number; vrm: string; make: string; model: string }[];
}

export function ManagerLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = session.getUser();
  const company = session.getCompany();
  const companySettings = (company?.settings || {}) as Record<string, any>;

  useEffect(() => {
    if (!user || !company) {
      setLocation('/manager/login');
    }
  }, [user, company, setLocation]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const userPermissions = user?.permissions as string[] | null | undefined;
  const hasPermissions = Array.isArray(userPermissions) && userPermissions.length > 0;

  const filteredNavItems = navItems.filter(item => {
    if (item.path === "/manager/deliveries" && companySettings.podEnabled === false) return false;
    if (item.path === "/manager/fuel" && companySettings.fuelEnabled === false) return false;
    if (isAdmin) return true;
    if (item.permissionKey === "dashboard") return true;
    if (item.permissionKey === "user-roles" || item.permissionKey === "settings") return false;
    if (!hasPermissions) return true;
    return userPermissions!.includes(item.permissionKey);
  });

  const handleLogout = () => {
    session.clear();
    setLocation("/manager/login");
  };

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2 || !company?.id) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    try {
      const token = session.getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/global-search?companyId=${company.id}&q=${encodeURIComponent(q)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setSearchOpen(true);
      }
    } catch (e) {
      console.error("Search error", e);
    } finally {
      setSearchLoading(false);
    }
  }, [company?.id]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.length < 2) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }
    searchTimerRef.current = setTimeout(() => doSearch(value), 300);
  };

  const navigateToResult = (path: string) => {
    setSearchQuery("");
    setSearchResults(null);
    setSearchOpen(false);
    setLocation(path);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user || !company) {
    return null;
  }

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

        {/* TM Mobile App Link */}
        <div className="px-3 pt-3 pb-1">
          <Link
            href="/manager/app"
            className={`flex items-center gap-3 px-3 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-150 shadow-sm ${!sidebarOpen ? 'justify-center' : ''}`}
            data-testid="link-mobile-app-top"
          >
            <Smartphone className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-semibold">TM Mobile App</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
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
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => { if (searchResults && searchQuery.length >= 2) setSearchOpen(true); }}
                placeholder="Search driver or VRM..."
                className="w-80 h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                data-testid="input-global-search"
              />

              {searchOpen && searchResults && (
                <div className="absolute top-full left-0 mt-1 w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                  {searchResults.drivers.length === 0 && searchResults.vehicles.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">
                      No results for "{searchQuery}"
                    </div>
                  ) : (
                    <>
                      {searchResults.drivers.length > 0 && (
                        <div>
                          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Drivers</span>
                          </div>
                          {searchResults.drivers.map((d) => (
                            <button
                              key={`d-${d.id}`}
                              onClick={() => navigateToResult("/manager/drivers")}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                              data-testid={`search-result-driver-${d.id}`}
                            >
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-blue-600">{d.name.charAt(0)}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900 truncate">{d.name}</p>
                                <p className="text-xs text-slate-400 truncate">{d.email}</p>
                              </div>
                              <Users className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.vehicles.length > 0 && (
                        <div>
                          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Vehicles</span>
                          </div>
                          {searchResults.vehicles.map((v) => (
                            <button
                              key={`v-${v.id}`}
                              onClick={() => navigateToResult("/manager/fleet")}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                              data-testid={`search-result-vehicle-${v.id}`}
                            >
                              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <Truck className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900 truncate">{v.vrm}</p>
                                <p className="text-xs text-slate-400 truncate">{v.make} {v.model}</p>
                              </div>
                              <CarFront className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            
            <div className="w-px h-8 bg-slate-200 mx-2" />
            
            <button
              onClick={() => setLocation("/manager/license")}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0"
              data-testid="button-user-profile"
            >
              <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-900">{user?.name || 'Manager'}</p>
                <p className="text-xs text-slate-500">Transport Manager</p>
              </div>
            </button>
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
