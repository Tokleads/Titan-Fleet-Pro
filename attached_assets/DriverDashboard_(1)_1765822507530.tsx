import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanInput } from "@/components/titan-ui/Input";
import { DocumentsPopup } from "@/components/driver/DocumentsPopup";
import { Search, Clock, ChevronRight, AlertTriangle, Truck, Plus, History, WifiOff, Fuel, AlertOctagon } from "lucide-react";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import type { Vehicle, Inspection, FuelEntry } from "@shared/schema";
import { useBrand } from "@/hooks/use-brand";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

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

  const user = session.getUser();
  const company = session.getCompany();

  const { data: unreadDocs } = useQuery({
    queryKey: ["unread-documents", company?.id, user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/documents/unread?companyId=${company?.id}&userId=${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
    enabled: !!company?.id && !!user?.id,
  });

  const hasUnreadDocs = unreadDocs && unreadDocs.length > 0;

  useEffect(() => {
    if (company && user) {
      loadRecents();
      loadActivity();
    }
  }, [company, user]);

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
      setInspections(inspectionData);
      setFuelEntries(fuelData);
    } catch (error) {
      console.error("Failed to load activity:", error);
    }
  };

  const handleSearch = async () => {
    if (!query || !company) return;
    setIsSearching(true);
    try {
      const matches = await api.searchVehicles(company.id, query);
      setResults(matches);
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

  return (
    <DriverLayout>
      <div className="space-y-4">
        {/* Welcome / Status */}
        <div className="space-y-1">
            <h1 className="titan-title">Driver Home</h1>
            <p className="titan-helper">Ready to start your shift?</p>
        </div>

        {/* Primary Workflow: Search Vehicle */}
        <section>
            <div className="titan-card p-4 space-y-3">
                <div className="titan-section-label">Find Vehicle</div>
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
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center space-y-3">
                                        <p className="font-medium text-slate-900">Vehicle not found</p>
                                        <TitanButton variant="outline" size="sm" className="w-full">Request to add</TitanButton>
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

        {/* Activity Summary */}
        <section>
             <div className="titan-card bg-slate-900 text-white border-0 p-4">
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
      </div>

      {hasUnreadDocs && showDocsPopup && (
        <DocumentsPopup onClose={() => setShowDocsPopup(false)} />
      )}
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
