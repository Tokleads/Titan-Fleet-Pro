import { useState, useEffect } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { useLocation, useRoute } from "wouter";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import type { Vehicle, Inspection } from "@shared/schema";
import { ChevronLeft, Truck, FileText, Fuel, AlertOctagon, ChevronRight, X, Check, Square } from "lucide-react";
import { SkeletonCard } from "@/components/titan-ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";

type DialogState = "none" | "trailer" | "checksheet";

export default function VehicleDetail() {
  const [, params] = useRoute("/driver/vehicle/:id");
  const [, setLocation] = useLocation();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [recentInspections, setRecentInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [motStatus, setMotStatus] = useState<{
    valid: boolean;
    expiryDate: string | null;
  } | null>(null);
  
  // Dialog states
  const [dialogState, setDialogState] = useState<DialogState>("none");
  const [hasTrailer, setHasTrailer] = useState<boolean | null>(null);
  const [onlyTrailerInspections, setOnlyTrailerInspections] = useState(false);

  const company = session.getCompany();
  const user = session.getUser();

  useEffect(() => {
    if (params?.id) {
      loadVehicle(Number(params.id));
    }
  }, [params?.id]);

  const loadVehicle = async (id: number) => {
    setIsLoading(true);
    try {
      const vehicleData = await api.getVehicle(id);
      setVehicle(vehicleData);

      if (vehicleData.vrm) {
        const mot = await api.getMotStatus(vehicleData.vrm);
        setMotStatus(mot);
      }

      if (company && user) {
        const inspections = await api.getInspections(company.id, user.id, 7);
        const vehicleInspections = inspections.filter(i => i.vehicleId === id);
        setRecentInspections(vehicleInspections.slice(0, 3));
      }
    } catch (error) {
      console.error("Failed to load vehicle:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInspection = () => {
    setDialogState("trailer");
  };

  const handleTrailerAnswer = (answer: boolean) => {
    setHasTrailer(answer);
    setDialogState("checksheet");
  };

  const handleSelectChecksheet = (type: "safety" | "end_of_shift") => {
    setDialogState("none");
    if (type === "end_of_shift") {
      setLocation(`/driver/end-of-shift/${vehicle?.id}`);
    } else {
      const trailerParam = hasTrailer ? "&trailer=true" : "";
      setLocation(`/driver/inspection/${vehicle?.id}?type=${type}${trailerParam}`);
    }
  };

  if (isLoading) {
    return (
      <DriverLayout>
        <div className="min-h-screen bg-slate-50 p-4 space-y-4 titan-page-enter">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DriverLayout>
    );
  }

  if (!vehicle) {
    return (
      <DriverLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">Vehicle not found</p>
          <TitanButton variant="outline" onClick={() => setLocation("/driver")} className="mt-4">
            Back to Dashboard
          </TitanButton>
        </div>
      </DriverLayout>
    );
  }

  const motDueDate = vehicle.motDue ? new Date(vehicle.motDue) : null;
  const isMotDueSoon = motDueDate && motDueDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <DriverLayout>
      <div className="space-y-6 titan-page-enter">
        {/* Header */}
        <div className="flex items-center gap-3">
          <TitanButton variant="ghost" size="icon" onClick={() => setLocation("/driver")} className="h-10 w-10 -ml-2" data-testid="button-back">
            <ChevronLeft className="h-6 w-6 text-slate-600" />
          </TitanButton>
          <h1 className="titan-title">Vehicle Actions</h1>
        </div>

        {/* Vehicle Identity Card */}
        <TitanCard className="p-6 bg-slate-900 text-white border-0 shadow-titan-lg relative overflow-hidden" data-testid="card-vehicle-info">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Registration</p>
              <h2 className="text-3xl font-mono font-bold tracking-tight">{vehicle.vrm}</h2>
              <p className="text-white/80 text-lg font-medium pt-1">{vehicle.make} {vehicle.model}</p>
            </div>
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Truck className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">MOT Due</p>
              <p className={`font-medium text-sm mt-0.5 ${isMotDueSoon ? 'text-amber-400' : ''}`}>
                {motDueDate ? motDueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Last Check</p>
              <p className="font-medium text-sm mt-0.5">
                {recentInspections.length > 0 
                  ? new Date(recentInspections[0].createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  : 'None'}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Status</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`h-2 w-2 rounded-full ${vehicle.active ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium text-sm">{vehicle.active ? 'Active' : 'Off Road'}</span>
              </div>
            </div>
          </div>
        </TitanCard>

        {/* Action Grid */}
        <div className="space-y-3">
          <ActionCard 
            icon={<FileText className="h-5 w-5 text-blue-600" />}
            title="Start inspection"
            subtitle="Daily check or end of shift"
            onClick={handleStartInspection}
            primary
            testId="action-start-inspection"
          />
          <ActionCard 
            icon={<Fuel className="h-5 w-5 text-emerald-600" />}
            title="Fuel / AdBlue"
            subtitle="Log fill-up and receipts"
            onClick={() => setLocation(`/driver/fuel/${vehicle.id}`)}
            testId="action-fuel"
          />
          <ActionCard 
            icon={<AlertOctagon className="h-5 w-5 text-amber-600" />}
            title="Report fault"
            subtitle="Log fault with photos"
            onClick={() => setLocation(`/driver/defect/${vehicle.id}`)}
            testId="action-defect"
          />
        </div>

        {/* Recent History */}
        <div className="space-y-3">
          <div className="titan-section-label ml-1">Recent Activity</div>
          {recentInspections.length === 0 ? (
            <TitanCard className="p-6 text-center border-2 border-dashed border-slate-200 bg-slate-50/50">
              <p className="text-sm text-slate-500">No inspections yet for this vehicle</p>
            </TitanCard>
          ) : (
            recentInspections.map((inspection) => (
              <TitanCard key={inspection.id} className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  inspection.status === 'PASS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-900">{inspection.type} Inspection</p>
                  <p className="text-xs text-slate-500">
                    {new Date(inspection.createdAt).toLocaleDateString()} • {inspection.status}
                  </p>
                </div>
              </TitanCard>
            ))
          )}
        </div>
      </div>

      {/* Trailer Question Dialog */}
      <AnimatePresence>
        {dialogState === "trailer" && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setDialogState("none")}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="titan-title text-center mb-2">
                  Trailer coupled?
                </h3>
                <p className="titan-meta text-center mb-6">
                  Is a trailer currently coupled to this unit?
                </p>
                <div className="flex gap-3">
                  <TitanButton 
                    variant="outline" 
                    className="flex-1 h-12"
                    onClick={() => handleTrailerAnswer(true)}
                    data-testid="button-trailer-yes"
                  >
                    Yes, trailer
                  </TitanButton>
                  <TitanButton 
                    className="flex-1 h-12"
                    onClick={() => handleTrailerAnswer(false)}
                    data-testid="button-trailer-no"
                  >
                    No trailer
                  </TitanButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checksheet Selection Dialog */}
      <AnimatePresence>
        {dialogState === "checksheet" && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setDialogState("none")}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-x-0 top-0 bottom-0 z-50 bg-white"
            >
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                  <button onClick={() => setDialogState("none")} className="p-2 -ml-2">
                    <ChevronLeft className="h-6 w-6 text-slate-600" />
                  </button>
                  <h2 className="titan-title">Select inspection type</h2>
                </div>

                <div className="flex-1 p-4 space-y-3">
                  {/* Trailer checks only toggle */}
                  <div 
                    className="titan-card p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setOnlyTrailerInspections(!onlyTrailerInspections)}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">Trailer checks only</div>
                      <div className="titan-helper">Show trailer-specific inspections.</div>
                    </div>
                    <div className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-colors ${
                      onlyTrailerInspections ? 'bg-primary border-primary text-white' : 'border-slate-300'
                    }`}>
                      {onlyTrailerInspections && <Check className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Checksheet options */}
                  {!onlyTrailerInspections && (
                    <>
                      <button 
                        className="titan-card titan-tap w-full p-4 flex items-center gap-3 text-left"
                        onClick={() => handleSelectChecksheet("end_of_shift")}
                        data-testid="checksheet-end-of-shift"
                      >
                        <div className="h-11 w-11 rounded-xl bg-blue-50 grid place-items-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[15px] font-semibold text-slate-900">End of shift inspection</div>
                          <div className="titan-helper">Check vehicle at shift end</div>
                        </div>
                        <div className="text-slate-400">›</div>
                      </button>

                      <button 
                        className="titan-card titan-tap w-full p-4 flex items-center gap-3 text-left"
                        onClick={() => handleSelectChecksheet("safety")}
                        data-testid="checksheet-safety"
                      >
                        <div className="h-11 w-11 rounded-xl bg-blue-50 grid place-items-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[15px] font-semibold text-slate-900">Safety check</div>
                          <div className="titan-helper">Full vehicle safety inspection</div>
                        </div>
                        <div className="text-slate-400">›</div>
                      </button>
                    </>
                  )}

                  {/* Trailer-only options */}
                  {onlyTrailerInspections && hasTrailer && (
                    <button 
                      className="titan-card titan-tap w-full p-4 flex items-center gap-3 text-left"
                      onClick={() => handleSelectChecksheet("safety")}
                    >
                      <div className="h-11 w-11 rounded-xl bg-blue-50 grid place-items-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[15px] font-semibold text-slate-900">Trailer inspection</div>
                        <div className="titan-helper">Check coupled trailer</div>
                      </div>
                      <div className="text-slate-400">›</div>
                    </button>
                  )}

                  {onlyTrailerInspections && !hasTrailer && (
                    <div className="text-center py-8 text-slate-500">
                      <p>No trailer attached to this vehicle</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DriverLayout>
  );
}

function ActionCard({ 
  icon, 
  title, 
  subtitle, 
  onClick, 
  primary,
  testId 
}: { 
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  primary?: boolean;
  testId?: string;
}) {
  return (
    <button 
      onClick={onClick}
      data-testid={testId}
      className="titan-card titan-tap titan-btn-press w-full text-left flex items-center gap-3 px-4 py-4 min-h-[68px]"
    >
      <div className={`h-11 w-11 rounded-xl grid place-items-center ${primary ? 'bg-blue-50' : 'bg-slate-100'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[15px] font-semibold text-slate-900">{title}</div>
        <div className="titan-helper">{subtitle}</div>
      </div>
      <div className="text-slate-400">›</div>
    </button>
  );
}
