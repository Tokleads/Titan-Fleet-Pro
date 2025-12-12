import { useState } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanInput } from "@/components/titan-ui/Input";
import { Search, Clock, ChevronRight, AlertTriangle, Truck, Plus, History, WifiOff, Fuel, AlertOctagon } from "lucide-react";
import { api, Vehicle } from "@/lib/mockData";
import { useBrand } from "@/hooks/use-brand";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export default function DriverDashboard() {
  const { currentCompany } = useBrand();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Vehicle[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Mock recents
  const recentVehicles = api.getVehicles(currentCompany.id).slice(0, 3);

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));
    const matches = api.searchVehicles(currentCompany.id, query);
    setResults(matches);
    setHasSearched(true);
    setIsSearching(false);
  };

  const handleSelectVehicle = (vehicleId: string) => {
    setLocation(`/driver/vehicle/${vehicleId}`);
  };

  return (
    <DriverLayout>
      <div className="space-y-8">
        {/* Welcome / Status */}
        <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Driver Home</h1>
            <p className="text-slate-500 font-medium">Ready to start your shift?</p>
        </div>

        {/* Primary Workflow: Search Vehicle */}
        <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Find Vehicle</h2>
            <TitanCard className="p-5 space-y-4 shadow-titan-md border-primary/10">
                <div className="flex gap-2">
                    <TitanInput 
                        placeholder="ENTER VRM" 
                        className="text-xl h-14 uppercase tracking-widest font-mono bg-slate-50 border-slate-200 placeholder:tracking-normal"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <TitanButton 
                        size="icon" 
                        className="h-14 w-14 rounded-[10px] shrink-0" 
                        onClick={handleSearch}
                        isLoading={isSearching}
                    >
                        <Search className="h-6 w-6" />
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
            </TitanCard>
        </section>

        {/* Quick Actions / Recents */}
        {!hasSearched && (
            <motion.section 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
            >
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Recent Vehicles
                </h2>
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
            </motion.section>
        )}

        {/* Activity Summary */}
        <section className="pt-4">
             <TitanCard className="bg-slate-900 text-white border-0 shadow-titan-lg p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">My Activity</h3>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">Last 7 Days</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-white/5 rounded-xl">
                        <div className="text-2xl font-bold">12</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-60 mt-1">Checks</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl">
                        <div className="text-2xl font-bold">3</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-60 mt-1">Defects</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl">
                        <div className="text-2xl font-bold">5</div>
                        <div className="text-[10px] uppercase tracking-wider opacity-60 mt-1">Fuel</div>
                    </div>
                </div>
             </TitanCard>
        </section>
      </div>
    </DriverLayout>
  );
}

function VehicleCard({ vehicle, onSelect }: { vehicle: Vehicle, onSelect: () => void }) {
  const isMotDueSoon = new Date(vehicle.motDue) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <TitanCard 
      onClick={onSelect}
      className="p-4 active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer hover:border-primary/50 group bg-white shadow-titan-sm"
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 group-hover:text-primary transition-colors flex items-center justify-center text-slate-500">
            <Truck className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-heading font-bold text-lg leading-none tracking-tight text-slate-900">{vehicle.reg}</h4>
          <p className="text-sm text-slate-500 mt-1">{vehicle.make} {vehicle.model}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isMotDueSoon && (
             <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold rounded uppercase tracking-wide">MOT Due</span>
        )}
        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
      </div>
    </TitanCard>
  );
}
