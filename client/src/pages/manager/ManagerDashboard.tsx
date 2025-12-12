import { ManagerLayout } from "@/components/layout/AppShell";
import { TitanCard } from "@/components/titan-ui/Card";
import { TitanButton } from "@/components/titan-ui/Button";
import { useBrand } from "@/hooks/use-brand";
import { api } from "@/lib/mockData";
import { Truck, CheckCircle, AlertOctagon, FileText, ArrowUpRight, Search, Filter, Download } from "lucide-react";
import { TitanInput } from "@/components/titan-ui/Input";

export default function ManagerDashboard() {
  const { currentCompany } = useBrand();
  
  // Stats
  const vehicles = api.getVehicles(currentCompany.id);
  const inspections = api.getInspections(currentCompany.id);
  const defects = inspections.filter(i => i.status === "FAIL").length;

  return (
    <ManagerLayout>
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Overview for {currentCompany.name}</p>
            </div>
            <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-full text-sm font-medium border shadow-sm flex items-center gap-2 ${currentCompany.googleDriveConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    <div className={`h-2 w-2 rounded-full ${currentCompany.googleDriveConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    {currentCompany.googleDriveConnected ? 'Drive Sync Active' : 'Drive Sync Inactive'}
                </div>
                <TitanButton variant="outline" size="sm" className="h-10">
                    <Download className="mr-2 h-4 w-4" /> Export Report
                </TitanButton>
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                icon={<Truck className="h-6 w-6 text-blue-600" />} 
                label="Total Vehicles" 
                value={vehicles.length.toString()} 
                trend="+2 this month"
                trendUp
            />
            <StatCard 
                icon={<FileText className="h-6 w-6 text-slate-600" />} 
                label="Inspections Today" 
                value={inspections.length.toString()} 
                trend="12 pending"
            />
            <StatCard 
                icon={<AlertOctagon className="h-6 w-6 text-red-600" />} 
                label="Open Defects" 
                value={defects.toString()} 
                variant="danger"
                trend="Action required"
            />
            <StatCard 
                icon={<CheckCircle className="h-6 w-6 text-green-600" />} 
                label="Compliance Rate" 
                value="98%" 
                variant="success"
                trend="+1.5% vs last week"
                trendUp
            />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Inspections Table */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Recent Inspections</h2>
                    <div className="flex gap-2">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input 
                                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all" 
                                placeholder="Search VRM or Driver..."
                            />
                        </div>
                        <TitanButton variant="outline" size="sm" className="h-9 px-3">
                            <Filter className="h-4 w-4" />
                        </TitanButton>
                    </div>
                </div>

                <TitanCard className="overflow-hidden border-border shadow-titan-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border">
                                <tr>
                                    <th className="px-6 py-4">Vehicle</th>
                                    <th className="px-6 py-4">Driver</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {inspections.map(insp => (
                                    <tr key={insp.id} className="hover:bg-secondary/20 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-foreground">{insp.vehicleId}</td> 
                                        <td className="px-6 py-4 text-foreground/80">John Doe</td>
                                        <td className="px-6 py-4 text-muted-foreground capitalize">{insp.type.toLowerCase().replace('_', ' ')}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide ${
                                                insp.status === 'PASS' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                                            }`}>
                                                {insp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(insp.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary hover:text-primary/80 font-medium text-xs">View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TitanCard>
            </div>

            {/* Sidebar Widgets */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                     <h2 className="text-lg font-bold text-foreground">Fleet Health</h2>
                </div>
                
                <TitanCard className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">MOT Due Soon</p>
                            <p className="text-3xl font-bold text-foreground">3</p>
                        </div>
                        <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                            <AlertOctagon className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[15%]" />
                    </div>
                    <p className="text-xs text-muted-foreground">3 vehicles require attention within 30 days.</p>
                </TitanCard>

                <TitanCard className="p-6 space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Vehicles Off Road</p>
                            <p className="text-3xl font-bold text-foreground">1</p>
                        </div>
                        <div className="h-12 w-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground">
                            <Truck className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-slate-500 w-[5%]" />
                    </div>
                     <p className="text-xs text-muted-foreground">KX65 ABC reported with engine fault.</p>
                </TitanCard>
            </div>
        </div>
      </div>
    </ManagerLayout>
  );
}

function StatCard({ icon, label, value, trend, trendUp, variant }: { icon: React.ReactNode, label: string, value: string, trend?: string, trendUp?: boolean, variant?: "success" | "danger" }) {
    return (
        <TitanCard className="p-6 transition-all hover:shadow-titan-lg">
            <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {trendUp && <ArrowUpRight className="h-3 w-3" />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <h3 className={`text-3xl font-bold mt-1 ${
                    variant === 'danger' ? 'text-red-600' : 
                    variant === 'success' ? 'text-green-600' : 
                    'text-foreground'
                }`}>
                    {value}
                </h3>
            </div>
        </TitanCard>
    )
}
