import { useState } from "react";
import { DriverLayout } from "@/components/layout/AppShell";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard } from "@/components/titan-ui/Card";
import { useLocation, useRoute } from "wouter";
import { api } from "@/lib/mockData";
import { ChevronLeft, Truck, FileText, Fuel, AlertOctagon, Info, ChevronRight } from "lucide-react";

export default function VehicleDetail() {
  const [, params] = useRoute("/driver/vehicle/:id");
  const [, setLocation] = useLocation();
  const vehicle = api.getVehicles("comp-1").find(v => v.id === params?.id); // Mock lookup

  if (!vehicle) return <div>Vehicle not found</div>;

  return (
    <DriverLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
            <TitanButton variant="ghost" size="icon" onClick={() => setLocation("/driver")} className="h-10 w-10 -ml-2">
                <ChevronLeft className="h-6 w-6 text-slate-600" />
            </TitanButton>
            <h1 className="text-xl font-bold text-slate-900">Vehicle Actions</h1>
        </div>

        {/* Vehicle Identity Card */}
        <TitanCard className="p-6 bg-slate-900 text-white border-0 shadow-titan-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            
            <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Registration</p>
                    <h2 className="text-3xl font-mono font-bold tracking-tight">{vehicle.reg}</h2>
                    <p className="text-white/80 text-lg font-medium pt-1">{vehicle.make} {vehicle.model}</p>
                </div>
                <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Truck className="h-6 w-6 text-white" />
                </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10 flex gap-6">
                <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">MOT Due</p>
                    <p className="font-medium mt-0.5">{new Date(vehicle.motDue).toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Status</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="font-medium">Active</span>
                    </div>
                </div>
            </div>
        </TitanCard>

        {/* Action Grid */}
        <div className="grid grid-cols-1 gap-3">
            <ActionCard 
                icon={<FileText className="h-6 w-6 text-blue-600" />}
                title="Start Inspection"
                subtitle="Daily check or end of shift"
                onClick={() => setLocation(`/driver/inspection/${vehicle.id}`)}
                primary
            />
            <ActionCard 
                icon={<Fuel className="h-6 w-6 text-emerald-600" />}
                title="Fuel / AdBlue"
                subtitle="Log fill-up & receipts"
                onClick={() => setLocation(`/driver/fuel/${vehicle.id}`)}
            />
            <ActionCard 
                icon={<AlertOctagon className="h-6 w-6 text-amber-600" />}
                title="Report Collision"
                subtitle="Log accident details"
                onClick={() => setLocation(`/driver/collision/${vehicle.id}`)}
            />
        </div>

        {/* Recent History for this Vehicle */}
        <div className="pt-4 space-y-3">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 ml-1">
                Recent Activity
             </h3>
             <TitanCard className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className="font-bold text-sm text-slate-900">Daily Inspection</p>
                    <p className="text-xs text-slate-500">Today, 07:30 AM • Passed</p>
                </div>
             </TitanCard>
        </div>
      </div>
    </DriverLayout>
  );
}

function ActionCard({ icon, title, subtitle, onClick, primary }: { icon: React.ReactNode, title: string, subtitle: string, onClick: () => void, primary?: boolean }) {
    return (
        <button 
            onClick={onClick}
            className={`
                w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all active:scale-[0.98]
                ${primary 
                    ? 'bg-white border-primary/20 shadow-md ring-1 ring-primary/10' 
                    : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                }
            `}
        >
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${primary ? 'bg-primary/5' : 'bg-slate-50'}`}>
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
            </div>
            <div className="ml-auto">
                <ChevronRight className="h-5 w-5 text-slate-300" />
            </div>
        </button>
    )
}
