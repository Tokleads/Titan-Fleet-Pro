import { ManagerLayout } from "@/components/layout/AppShell";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard, TitanCardContent, TitanCardHeader } from "@/components/titan-ui/Card";
import { TitanInput } from "@/components/titan-ui/Input";
import { useBrand } from "@/hooks/use-brand";
import { Palette, HardDrive, RefreshCw, Check, UploadCloud } from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const { currentCompany } = useBrand();
  const [primaryColor, setPrimaryColor] = useState(currentCompany.settings.brand?.primaryColor || "#2563eb");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrimaryColor(e.target.value);
  };

  return (
    <ManagerLayout>
      <div className="p-8 space-y-8 max-w-4xl mx-auto">
        <div className="space-y-1">
            <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your company profile and integrations.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
            {/* Brand Kit Section */}
            <TitanCard>
                <TitanCardHeader>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Palette className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Brand Kit</h2>
                            <p className="text-sm text-muted-foreground">Customize the driver app experience.</p>
                        </div>
                    </div>
                </TitanCardHeader>
                <TitanCardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <TitanInput label="Company Display Name" defaultValue={currentCompany.name} />
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground ml-1">Primary Color</label>
                                <div className="flex gap-3">
                                    <div className="relative overflow-hidden h-12 w-16 rounded-[10px] ring-1 ring-border shadow-sm">
                                        <input 
                                            type="color" 
                                            value={primaryColor} 
                                            onChange={handleColorChange}
                                            className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer p-0 border-0" 
                                        />
                                    </div>
                                    <TitanInput 
                                        value={primaryColor} 
                                        onChange={handleColorChange} 
                                        className="font-mono flex-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-secondary/30 rounded-xl p-6 border border-border/50">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 block">Live Preview</label>
                            <div className="space-y-4">
                                <button 
                                    className="h-11 px-6 text-sm rounded-[14px] font-medium text-white shadow-md transition-transform active:scale-95 w-full flex items-center justify-center gap-2"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Check className="h-4 w-4" /> Primary Button
                                </button>
                                <button 
                                    className="h-11 px-6 text-sm rounded-[14px] font-medium bg-transparent border shadow-sm w-full"
                                    style={{ borderColor: primaryColor, color: primaryColor }}
                                >
                                    Secondary Action
                                </button>
                            </div>
                        </div>
                    </div>
                </TitanCardContent>
            </TitanCard>

            {/* Integration Section */}
            <TitanCard>
                <TitanCardHeader>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                            <HardDrive className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Storage Integration</h2>
                            <p className="text-sm text-muted-foreground">Connect your corporate Google Drive.</p>
                        </div>
                    </div>
                </TitanCardHeader>
                <TitanCardContent>
                    <div className="bg-secondary/20 border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-white rounded-xl shadow-sm flex items-center justify-center p-3">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo_%282020-present%29.svg" alt="Drive" className="h-full w-full object-contain" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground text-lg">Google Drive</h4>
                                <p className="text-sm text-muted-foreground">
                                    {currentCompany.googleDriveConnected ? 'Connected to company workspace' : 'Not connected'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 min-w-[140px]">
                            {currentCompany.googleDriveConnected ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-green-700 font-medium bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                        Sync Active
                                    </div>
                                    <TitanButton variant="outline" size="sm" className="w-full">Reconnect</TitanButton>
                                </div>
                            ) : (
                                <TitanButton onClick={() => setIsConnecting(!isConnecting)}>
                                    Connect Account
                                </TitanButton>
                            )}
                        </div>
                    </div>

                    {currentCompany.googleDriveConnected && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-border bg-background">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Target Path</p>
                                <p className="font-mono text-sm text-foreground">/FleetCheck/Uploads/{'{Year}'}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-background flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Last Sync</p>
                                    <p className="text-sm text-foreground">Just now</p>
                                </div>
                                <TitanButton variant="ghost" size="icon" className="h-8 w-8">
                                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                </TitanButton>
                            </div>
                        </div>
                    )}
                </TitanCardContent>
            </TitanCard>
        </div>
      </div>
    </ManagerLayout>
  );
}
