import { useState } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanInput } from "@/components/titan-ui/Input";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { Search, Clock, ChevronRight, AlertTriangle, Truck, Plus, History, WifiOff } from "lucide-react";
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
  const [isOffline, setIsOffline] = useState(false); // Simulating offline state

  // Mock recents
  const recentVehicles = api.getVehicles(currentCompany.id).slice(0, 3);

  const handleSearch = () => {
    if (!query) return;
    const matches = api.searchVehicles(currentCompany.id, query);
    setResults(matches);
    setHasSearched(true);
  };

  const handleSelectVehicle = (vehicleId: string) => {
    setLocation(`/driver/inspection/${vehicleId}`);
  };

  return (
    <DriverLayout>
      <div className="space-y-6 pb-20">
        {/* Offline Banner */}
        <AnimatePresence>
            {isOffline && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-center gap-3 overflow-hidden"
                >
                    <WifiOff className="h-5 w-5 text-amber-700" />
                    <div>
                        <p className="text-sm font-bold text-amber-800">You are offline</p>
                        <p className="text-xs text-amber-700">Inspections will be saved to your device.</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Hero Section */}
        <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Good Morning, John</h1>
            <p className="text-slate-500">Ready for your shift?</p>
        </div>

        {/* Main Action - Search */}
        <TitanCard className="p-6 space-y-4 shadow-titan-md border-primary/10">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Find Vehicle</label>
            <div className="flex gap-2">
                <TitanInput 
                    placeholder="Enter VRM (e.g. KX65)" 
                    className="text-lg h-14 uppercase tracking-wider font-mono bg-slate-50 border-slate-200"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <TitanButton size="lg" className="h-14 px-6 rounded-[10px]" onClick={handleSearch}>
                    <Search className="h-5 w-5" />
                </TitanButton>
            </div>
          </div>
        </TitanCard>

        {/* Search Results or Recents */}
        <AnimatePresence mode="wait">
            {hasSearched ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Search Results</h3>
                    <button onClick={() => { setHasSearched(false); setQuery(""); }} className="text-sm text-primary font-medium">Clear</button>
                </div>
                
                {results.length === 0 ? (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3">
                      <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                          <AlertTriangle className="h-6 w-6" />
                      </div>
                      <p className="font-medium text-slate-900">Vehicle not found</p>
                      <TitanButton variant="outline" size="sm">Request to add vehicle</TitanButton>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map(vehicle => (
                      <VehicleCard key={vehicle.id} vehicle={vehicle} onSelect={() => handleSelectVehicle(vehicle.id)} />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="recents"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Recent Vehicles
                </h3>
                <div className="space-y-3">
                  {recentVehicles.map((vehicle, i) => (
                    <motion.div
                        key={vehicle.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <VehicleCard vehicle={vehicle} onSelect={() => handleSelectVehicle(vehicle.id)} />
                    </motion.div>
                  ))}
                </div>

                <div className="pt-4">
                    <TitanCard className="bg-primary/5 border-primary/10 p-4 flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => {}}>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
                                <History className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">Your History</p>
                                <p className="text-xs text-slate-500">Last 7 days of activity</p>
                            </div>
                        </div>
                        <ChevronRight className="text-slate-400" />
                    </TitanCard>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </DriverLayout>
  );
}

function VehicleCard({ vehicle, onSelect }: { vehicle: Vehicle, onSelect: () => void }) {
  const isMotDueSoon = new Date(vehicle.motDue) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <TitanCard 
      onClick={onSelect}
      className="p-4 active:scale-[0.98] transition-transform flex items-center justify-between cursor-pointer hover:border-primary/50 group"
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-slate-100 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center text-slate-500">
            <Truck className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-heading font-bold text-lg leading-none tracking-tight">{vehicle.reg}</h4>
          <p className="text-sm text-slate-500 mt-1">{vehicle.make} {vehicle.model}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isMotDueSoon && (
             <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold rounded uppercase tracking-wide">MOT Due</span>
        )}
        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
            <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </TitanCard>
  );
}
