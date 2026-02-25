import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanInput } from "@/components/titan-ui/Input";
import { DocumentsPopup } from "@/components/driver/DocumentsPopup";
import { GPSTrackingStatus } from "@/components/driver/GPSTrackingStatus";
import ClockInOut from "./ClockInOut";
import { Search, Clock, ChevronRight, AlertTriangle, Truck, Plus, History, WifiOff, Fuel, AlertOctagon, AlertCircle, CheckCircle, Bell, Info, X, Package, FileText as FileTextIcon, MessageSquare, Car } from "lucide-react";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import type { Vehicle, Inspection, FuelEntry } from "@shared/schema";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import { useBrand } from "@/hooks/use-brand";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { HelpTooltip } from "@/components/titan-ui/HelpTooltip";
import { ProductTour, TourStep } from "@/components/ProductTour";

const driverTourSteps: TourStep[] = [
  { target: ".titan-title", title: "Welcome to Driver Home", description: "This is your home base. From here you can start inspections, clock in/out, message your manager, and more.", placement: "bottom" },
  { target: '[data-testid="input-search-vrm"]', title: "Start an Inspection", description: "Enter a vehicle registration number to begin your walk-around check. Just type the VRM and hit search.", placement: "bottom" },
  { target: '[data-testid="section-clock-in-out"]', title: "Clock In & Out", description: "Start and end your shift here to track your working hours. Your manager can see when you're on duty.", placement: "bottom" },
  { target: '[data-testid="button-message-transport"]', title: "Message Transport", description: "Need to report something? Send a message directly to your transport manager from here.", placement: "top" },
  { target: '[data-testid="button-car-register"]', title: "Company Car Register", description: "Log which company vehicle you're using today. This keeps fleet records up to date.", placement: "top" },
  { target: '[data-testid="button-complete-delivery"]', title: "Proof of Delivery", description: "Capture signatures, photos, and notes as proof of delivery. No more paperwork!", placement: "top" },
];

export default function DriverDashboard() {
  const { currentCompany } = useBrand();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Vehicle[]>([]);
  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [showDocsPopup, setShowDocsPopup] = useState(true);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [manualVrm, setManualVrm] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messagePriority, setMessagePriority] = useState("normal");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showTour, setShowTour] = useState(() => !localStorage.getItem("tourSeen_driver"));
  const { toast } = useToast();

  const user = session.getUser();
  const company = session.getCompany();

  const { data: activeTimesheetData } = useQuery({
    queryKey: ["active-timesheet", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/timesheets/active/${user?.id}`, { headers: authHeaders() });
      if (!response.ok) throw new Error("Failed to fetch active timesheet");
      const data = await response.json();
      return data.timesheet || null;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const handler = () => setShowTour(true);
    window.addEventListener("driver-tour-replay", handler);
    return () => window.removeEventListener("driver-tour-replay", handler);
  }, []);

  // Redirect to login if not logged in
  useEffect(() => {
    if (!user || !company) {
      setLocation('/app');
    }
  }, [user?.id, company?.id, setLocation]);

  const { data: unreadDocs } = useQuery({
    queryKey: ["unread-documents", company?.id, user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/documents/unread?companyId=${company?.id}&userId=${user?.id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    enabled: !!company?.id && !!user?.id,
  });

  const hasUnreadDocs = unreadDocs && unreadDocs.length > 0;

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (!company || !user) return;
      
      try {
        const [recents, inspectionData, fuelData] = await Promise.all([
          api.getRecentVehicles(company.id, user.id, 3),
          api.getInspections(company.id, user.id, 7),
          api.getFuelEntries(company.id, user.id, 7)
        ]);
        
        if (mounted) {
          setRecentVehicles(Array.isArray(recents) ? recents : []);
          setInspections(Array.isArray(inspectionData) ? inspectionData : []);
          setFuelEntries(Array.isArray(fuelData) ? fuelData : []);
        }
      } catch (error) {
        if (mounted) {
          console.error('Failed to load dashboard data:', error);
        }
      }
    };
    
    if (company && user) {
      loadData();
    }
    
    return () => {
      mounted = false;
    };
  }, [company?.id, user?.id]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!company?.companyCode) return;
      try {
        const response = await fetch(`/api/notifications/public/${company.companyCode}`);
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to load announcements:', error);
      }
    };
    fetchAnnouncements();
  }, [company?.companyCode]);

  const loadRecents = async () => {
    if (!company || !user) return;
    try {
      const recents = await api.getRecentVehicles(company.id, user.id, 3);
      setRecentVehicles(recents);
    } catch (error) {
      console.error("Failed to load recent vehicles:", error);
    }
  };

  const loadActivity = async () => {
    if (!company || !user) return;
    try {
      const [inspectionData, fuelData] = await Promise.all([
        api.getInspections(company.id, user.id, 7),
        api.getFuelEntries(company.id, user.id, 7)
      ]);
      setInspections(Array.isArray(inspectionData) ? inspectionData : []);
      setFuelEntries(Array.isArray(fuelData) ? fuelData : []);
    } catch (error) {
      console.error("Failed to load activity:", error);
    }
  };

  const handleSearch = async () => {
    if (!query || !company) return;
    setIsSearching(true);
    try {
      const matches = await api.searchVehicles(company.id, query);
      setResults(Array.isArray(matches) ? matches : []);
      setHasSearched(true);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectVehicle = (vehicleId: number) => {
    setLocation(`/driver/vehicle/${vehicleId}`);
  };

  const handleOpenManualEntry = () => {
    setManualVrm(query.toUpperCase().replace(/\s+/g, '')); // Pre-fill with searched VRM
    setManualNotes("");
    setShowManualEntryModal(true);
  };

  const handleManualVehicleSubmit = async () => {
    if (!company || !user || !manualVrm.trim()) return;
    
    try {
      const response = await fetch('/api/drivers/manual-vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          companyId: company.id,
          driverId: user.id,
          vrm: manualVrm.trim(),
          notes: manualNotes.trim() || undefined
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.vehicleId) {
          // Vehicle already exists, go to it
          toast({
            title: "Vehicle Found",
            description: "This vehicle already exists in the system.",
          });
          handleSelectVehicle(data.vehicleId);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.error || "Failed to add vehicle"
          });
        }
        return;
      }
      
      toast({
        title: "Vehicle Added",
        description: "The vehicle has been added and flagged for manager review.",
      });
      
      setShowManualEntryModal(false);
      // Navigate to the new vehicle
      if (data.vehicle?.id) {
        handleSelectVehicle(data.vehicle.id);
      }
    } catch (error) {
      console.error("Failed to add manual vehicle:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add vehicle. Please try again."
      });
    }
  };

  const handleSendMessage = async () => {
    if (!company || !user || !messageContent.trim()) return;
    setIsSendingMessage(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          companyId: company.id,
          senderId: user.id,
          subject: messageSubject.trim() || undefined,
          content: messageContent.trim(),
          priority: messagePriority,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      toast({
        title: "Message Sent",
        description: "Your message has been sent to your transport manager.",
      });
      setMessageSubject("");
      setMessageContent("");
      setMessagePriority("normal");
      setShowMessageModal(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again.",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <DriverLayout>
      <div className="space-y-4 titan-page-enter">
        {/* Welcome / Status */}
        <div className="space-y-1">
            <h1 className="titan-title">Driver Home</h1>
            <p className="titan-helper">Ready to start your shift?</p>
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
              <div className="titan-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Bell className="h-4 w-4 text-[#5B6CFF]" />
                    <span>Announcements</span>
                    <span className="bg-[#5B6CFF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {announcements.length}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowAnnouncements(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                    data-testid="button-dismiss-announcements"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {announcements.map((announcement: any) => (
                    <div 
                      key={announcement.id}
                      data-testid={`announcement-${announcement.id}`}
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clock In/Out */}
        <div data-testid="section-clock-in-out">
          {user?.id && company?.id ? (
            <ClockInOut 
              companyId={company.id} 
              driverId={user.id}
              driverName={user.name || 'Driver'}
            />
          ) : (
            <div className="titan-card p-4 text-center text-muted-foreground">
              <p>Clock in/out requires login. Please log in again.</p>
            </div>
          )}
        </div>

        {/* GPS Tracking - runs silently in background */}
        {user?.id && (
          <GPSTrackingStatus 
            driverId={user.id} 
            companyId={company?.id}
            autoStart={!!activeTimesheetData}
            hidden={true}
          />
        )}

        {/* Primary Workflow: Start Inspection */}
        <section>
            <div className="titan-card p-4 space-y-3">
                <div className="titan-section-label">Start Inspection</div>
                <div className="flex gap-3">
                    <input 
                        placeholder="Enter VRM (e.g. KX65ABC)" 
                        className="flex-1 h-12 rounded-xl font-semibold tracking-wider border border-slate-300 px-4 uppercase focus:outline-none focus:ring-2 focus:ring-primary/25 titan-focus"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        data-testid="input-search-vrm"
                    />
                    <TitanButton 
                        size="icon" 
                        className="h-12 w-12 rounded-xl shrink-0" 
                        onClick={handleSearch}
                        isLoading={isSearching}
                    >
                        <Search className="h-5 w-5" />
                    </TitanButton>
                </div>
                
                {/* Search Results Expansion */}
                <AnimatePresence>
                    {hasSearched && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-2 pb-1">
                                {results.length === 0 ? (
                                    <div className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-xl p-6 text-center space-y-3">
                                        <div className="flex items-center justify-center gap-2 text-amber-700">
                                            <AlertCircle className="h-5 w-5" />
                                            <p className="font-medium">Vehicle not found in fleet</p>
                                        </div>
                                        <p className="text-sm text-amber-600">
                                            Can't find this registration? You can add it manually and start your shift. It will be flagged for your manager to verify.
                                        </p>
                                        <TitanButton 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full border-amber-400 text-amber-700 hover:bg-amber-100"
                                            onClick={handleOpenManualEntry}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Vehicle Manually
                                        </TitanButton>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {results.map(vehicle => (
                                            <VehicleCard key={vehicle.id} vehicle={vehicle} onSelect={() => handleSelectVehicle(vehicle.id)} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>

        {/* Quick Actions / Recents */}
        {!hasSearched && (
            <motion.section 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
            >
                <div className="titan-section-label flex items-center gap-2 ml-1">
                    <Clock className="h-3 w-3" /> Recent Vehicles
                </div>
                {recentVehicles.length === 0 ? (
                    <div className="titan-empty flex flex-col items-center gap-3 p-6">
                        <div className="h-14 w-14 rounded-2xl bg-slate-100 grid place-items-center">
                            <Truck className="h-7 w-7 text-slate-400" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-semibold text-slate-900">No recent vehicles</p>
                            <p className="titan-meta">Search for a vehicle above to start your first inspection</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentVehicles.map((vehicle, i) => (
                            <motion.div
                                key={vehicle.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <VehicleCard vehicle={vehicle} onSelect={() => handleSelectVehicle(vehicle.id)} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.section>
        )}

        {/* Car Register */}
        <div 
          className="titan-card titan-btn-press p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setLocation("/driver/car-register")}
          data-testid="button-car-register"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-violet-50 flex items-center justify-center">
              <Car className="h-5 w-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Car Register</p>
              <p className="text-xs text-slate-500">Log which company car you're using</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </div>
        </div>

        {/* Message Transport */}
        <div 
          className="titan-card titan-btn-press p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowMessageModal(true)}
          data-testid="button-message-transport"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Message Transport</p>
              <p className="text-xs text-slate-500">Send a message to your transport manager</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </div>
        </div>

        {/* Activity Summary - only show when there's data */}
        {(inspections.length > 0 || fuelEntries.length > 0) && (
        <section>
             <div className="rounded-2xl bg-slate-900 text-white p-4 shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">My Activity</h3>
                    <span className="text-[11px] bg-white/10 px-2 py-1 rounded text-white/80">Last 7 days</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-white/5 rounded-xl">
                        <div className="text-2xl font-bold">{inspections.length}</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-60 mt-1">Checks</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl">
                        <div className="text-2xl font-bold">{inspections.filter(i => i.status === 'FAIL').length}</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-60 mt-1">Faults</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl">
                        <div className="text-2xl font-bold">{fuelEntries.length}</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-60 mt-1">Fuel</div>
                    </div>
                </div>
             </div>
        </section>
        )}

        {/* Delivery Actions - at bottom, only shown if POD is enabled */}
        {(company?.settings as any)?.podEnabled !== false && (
        <div className="space-y-3 pb-4">
          <div className="titan-section-label ml-1">Deliveries</div>
          <div 
            className="titan-card titan-btn-press p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setLocation("/driver/complete-delivery")}
            data-testid="button-complete-delivery"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-[#5B6CFF]/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-[#5B6CFF]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Complete Delivery<HelpTooltip term="POD" /></p>
                <p className="text-xs text-slate-500">Capture proof of delivery with photos & signature</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>
          </div>

          <div 
            className="titan-card titan-btn-press p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setLocation("/driver/deliveries")}
            data-testid="button-my-deliveries"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <FileTextIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">My Deliveries</p>
                <p className="text-xs text-slate-500">View your completed delivery records</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>
        )}
      </div>

      {hasUnreadDocs && showDocsPopup && (
        <DocumentsPopup onClose={() => setShowDocsPopup(false)} />
      )}

      {/* Send Message Modal */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="max-w-md" data-testid="dialog-send-message">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-600" />
              Message Transport
            </DialogTitle>
            <DialogDescription>
              Send a message to your transport manager
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject (optional)</label>
              <input
                type="text"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="e.g. Vehicle issue, Schedule request..."
                className="w-full h-10 px-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                data-testid="input-message-subject"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Message *</label>
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[80px]"
                rows={3}
                data-testid="input-message-content"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMessagePriority("normal")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    messagePriority === "normal"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  data-testid="button-priority-normal"
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setMessagePriority("urgent")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    messagePriority === "urgent"
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  data-testid="button-priority-urgent"
                >
                  Urgent
                </button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <TitanButton 
              onClick={handleSendMessage}
              className="w-full"
              disabled={!messageContent.trim() || isSendingMessage}
              isLoading={isSendingMessage}
              data-testid="button-send-message"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Message
            </TitanButton>
            <TitanButton 
              variant="ghost" 
              onClick={() => setShowMessageModal(false)}
              className="w-full text-muted-foreground"
              data-testid="button-cancel-message"
            >
              Cancel
            </TitanButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Vehicle Entry Modal */}
      <Dialog open={showManualEntryModal} onOpenChange={setShowManualEntryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Add Vehicle Manually
            </DialogTitle>
            <DialogDescription>
              Enter the registration to add it to your fleet. It will be flagged for your transport manager to review.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vehicle Registration</label>
              <input
                type="text"
                value={manualVrm}
                onChange={(e) => setManualVrm(e.target.value.toUpperCase())}
                placeholder="e.g. AB12 CDE"
                className="w-full h-12 px-4 text-lg font-bold tracking-wider uppercase border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                maxLength={10}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="e.g. Hire vehicle, new to fleet, replacement truck..."
                className="min-h-[80px]"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                This vehicle will be added with a review flag. Your transport manager will be notified to verify the details.
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <TitanButton 
              onClick={handleManualVehicleSubmit}
              className="w-full"
              disabled={!manualVrm.trim()}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Add & Continue
            </TitanButton>
            <TitanButton 
              variant="ghost" 
              onClick={() => setShowManualEntryModal(false)}
              className="w-full text-muted-foreground"
            >
              Cancel
            </TitanButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductTour
        steps={driverTourSteps}
        storageKey="tourSeen_driver"
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />
    </DriverLayout>
  );
}

function VehicleCard({ vehicle, onSelect }: { vehicle: Vehicle, onSelect: () => void }) {
  const isMotDueSoon = vehicle.motDue && new Date(vehicle.motDue) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div 
      onClick={onSelect}
      className="titan-card titan-tap p-4 flex items-center gap-3 cursor-pointer group"
      data-testid={`card-vehicle-${vehicle.id}`}
    >
      <div className="h-11 w-11 rounded-xl bg-slate-100 group-hover:bg-primary/10 transition-colors grid place-items-center">
        <Truck className="h-5 w-5 text-slate-500 group-hover:text-primary" />
      </div>
      <div className="flex-1">
        <div className="text-[15px] font-semibold text-slate-900">{vehicle.vrm}</div>
        <div className="titan-helper">{vehicle.make} {vehicle.model}</div>
      </div>
      <div className="flex items-center gap-2">
        {isMotDueSoon && (
          <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold rounded uppercase tracking-wide">MOT Due</span>
        )}
        <ChevronRight className="h-5 w-5 text-slate-400" />
      </div>
    </div>
  );
}
