import { ManagerLayout } from "./ManagerLayout";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard, TitanCardContent, TitanCardHeader } from "@/components/titan-ui/Card";
import { TitanInput } from "@/components/titan-ui/Input";
import { useBrand } from "@/hooks/use-brand";
import { session } from "@/lib/session";
import { Palette, HardDrive, RefreshCw, Check, X, Loader2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { tenant } = useBrand();
  const company = session.getCompany();
  const queryClient = useQueryClient();
  const [primaryColor, setPrimaryColor] = useState(company?.primaryColor || "#2563eb");
  const [googleDriveConnected, setGoogleDriveConnected] = useState(company?.googleDriveConnected || false);
  
  useEffect(() => {
    if (company) {
      setGoogleDriveConnected(company.googleDriveConnected || false);
    }
  }, [company]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [folderId, setFolderId] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; email?: string; error?: string } | null>(null);

  const testConnection = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/manager/company/${company?.id}/gdrive/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, refreshToken }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setTestResult(data);
    },
  });

  const saveConnection = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/manager/company/${company?.id}/gdrive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, refreshToken, folderId }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      session.setCompany(data);
      setGoogleDriveConnected(true);
      setIsConnecting(false);
      setClientId("");
      setClientSecret("");
      setRefreshToken("");
      setFolderId("");
      setTestResult(null);
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/manager/company/${company?.id}/gdrive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disconnect: true }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      session.setCompany(data);
      setGoogleDriveConnected(false);
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });

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
                            <TitanInput label="Company Display Name" defaultValue={company?.name || ""} />
                            
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
                            <p className="text-sm text-muted-foreground">Connect your corporate Google Drive for automatic PDF uploads.</p>
                        </div>
                    </div>
                </TitanCardHeader>
                <TitanCardContent>
                    <div className="bg-secondary/20 border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-white rounded-xl shadow-sm flex items-center justify-center p-3">
                                <svg viewBox="0 0 87.3 78" className="h-full w-full">
                                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                                  <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                                  <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground text-lg">Google Drive</h4>
                                <p className="text-sm text-muted-foreground">
                                    {googleDriveConnected ? 'Connected to company workspace' : 'Not connected'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 min-w-[140px]">
                            {googleDriveConnected ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-green-700 font-medium bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                        Connected
                                    </div>
                                    <TitanButton 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full"
                                        onClick={() => disconnect.mutate()}
                                        disabled={disconnect.isPending}
                                    >
                                        {disconnect.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect"}
                                    </TitanButton>
                                </div>
                            ) : (
                                <TitanButton onClick={() => setIsConnecting(!isConnecting)} data-testid="button-connect-gdrive">
                                    {isConnecting ? "Cancel" : "Connect Account"}
                                </TitanButton>
                            )}
                        </div>
                    </div>

                    {isConnecting && !googleDriveConnected && (
                        <div className="mt-6 space-y-6 p-6 bg-background rounded-xl border border-border">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-foreground">Setup Instructions</h4>
                                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                                    <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="h-3 w-3" /></a></li>
                                    <li>Create a project and enable the Google Drive API</li>
                                    <li>Create OAuth 2.0 credentials (Web application type)</li>
                                    <li>Use the OAuth Playground to get a refresh token</li>
                                    <li>Paste the refresh token below</li>
                                </ol>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Google Client ID</label>
                                    <TitanInput
                                        type="text"
                                        placeholder="Your Google OAuth Client ID"
                                        value={clientId}
                                        onChange={(e) => setClientId(e.target.value)}
                                        data-testid="input-gdrive-client-id"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Google Client Secret</label>
                                    <TitanInput
                                        type="password"
                                        placeholder="Your Google OAuth Client Secret"
                                        value={clientSecret}
                                        onChange={(e) => setClientSecret(e.target.value)}
                                        data-testid="input-gdrive-client-secret"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Refresh Token</label>
                                    <TitanInput
                                        type="password"
                                        placeholder="Paste your Google OAuth refresh token"
                                        value={refreshToken}
                                        onChange={(e) => setRefreshToken(e.target.value)}
                                        data-testid="input-gdrive-token"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Folder ID (optional)</label>
                                    <TitanInput
                                        placeholder="Google Drive folder ID for uploads"
                                        value={folderId}
                                        onChange={(e) => setFolderId(e.target.value)}
                                        data-testid="input-gdrive-folder"
                                    />
                                    <p className="text-xs text-muted-foreground">Leave empty to upload to root. Find the ID in your Drive folder URL.</p>
                                </div>

                                {testResult && (
                                    <div className={`p-4 rounded-lg border ${testResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                        {testResult.success ? (
                                            <div className="flex items-center gap-2">
                                                <Check className="h-4 w-4" />
                                                <span>Connected as {testResult.email}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <X className="h-4 w-4" />
                                                <span>{testResult.error}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <TitanButton
                                        variant="outline"
                                        onClick={() => testConnection.mutate()}
                                        disabled={!clientId || !clientSecret || !refreshToken || testConnection.isPending}
                                        data-testid="button-test-gdrive"
                                    >
                                        {testConnection.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Test Connection
                                    </TitanButton>
                                    <TitanButton
                                        onClick={() => saveConnection.mutate()}
                                        disabled={!clientId || !clientSecret || !refreshToken || !testResult?.success || saveConnection.isPending}
                                        data-testid="button-save-gdrive"
                                    >
                                        {saveConnection.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Save Connection
                                    </TitanButton>
                                </div>
                            </div>
                        </div>
                    )}

                    {googleDriveConnected && (
                        <div className="mt-6 p-4 rounded-xl border border-border bg-background">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Status</p>
                            <p className="text-sm text-foreground">Inspection PDFs will automatically upload to your configured Google Drive folder.</p>
                        </div>
                    )}
                </TitanCardContent>
            </TitanCard>
        </div>
      </div>
    </ManagerLayout>
  );
}
