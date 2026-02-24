import { ManagerLayout } from "./ManagerLayout";
import { TitanButton } from "@/components/titan-ui/Button";
import { TitanCard, TitanCardContent, TitanCardHeader } from "@/components/titan-ui/Card";
import { TitanInput } from "@/components/titan-ui/Input";
import { LogoUploader } from "@/components/LogoUploader";
import { useBrand } from "@/hooks/use-brand";
import { session } from "@/lib/session";
import { Palette, HardDrive, RefreshCw, Check, X, Loader2, ExternalLink, Shield, Smartphone, Users, Edit, Plus, Trash2, UserCog, Settings2, Package } from "lucide-react";
import type { User } from "@shared/schema";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function FeatureToggle({ label, description, enabled, onToggle }: { label: string; description: string; enabled: boolean; onToggle: (enabled: boolean) => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(enabled);

  useEffect(() => { setValue(enabled); }, [enabled]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggle(!value);
      setValue(!value);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50" data-testid={`feature-toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex-1 mr-4">
        <p className="font-medium text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}
        data-testid={`toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  function authHeaders(): Record<string, string> {
    const token = session.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  const { tenant } = useBrand();
  const company = session.getCompany();
  const queryClient = useQueryClient();
  const [primaryColor, setPrimaryColor] = useState(company?.primaryColor || "#2563eb");
  const [logoUrl, setLogoUrl] = useState(company?.logoUrl || "");
  const [googleDriveConnected, setGoogleDriveConnected] = useState(company?.googleDriveConnected || false);
  
  useEffect(() => {
    if (company) {
      setGoogleDriveConnected(company.googleDriveConnected || false);
      setLogoUrl(company.logoUrl || "");
    }
  }, [company]);

  const handleLogoUpload = (newLogoPath: string) => {
    setLogoUrl(newLogoPath);
    if (company) {
      session.setCompany({ ...company, logoUrl: newLogoPath });
    }
  };
  const [isConnecting, setIsConnecting] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [folderId, setFolderId] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; email?: string; error?: string } | null>(null);
  
  // 2FA state
  const manager = session.getUser();
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  
  const { data: twoFAStatus, refetch: refetchTwoFAStatus } = useQuery({
    queryKey: ['2fa-status', manager?.id],
    queryFn: async () => {
      const res = await fetch(`/api/manager/2fa/status/${manager?.id}`, { headers: authHeaders() });
      return res.json();
    },
    enabled: !!manager?.id
  });

  const testConnection = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/manager/company/${company?.id}/gdrive/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
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
        headers: { "Content-Type": "application/json", ...authHeaders() },
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
        headers: { "Content-Type": "application/json", ...authHeaders() },
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
  
  // 2FA mutations
  const setup2FA = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/manager/2fa/setup/${manager?.id}`, { method: "POST", headers: authHeaders() });
      return res.json();
    },
    onSuccess: (data) => {
      setQrCodeUrl(data.qrCodeDataUrl);
      setTotpSecret(data.secret);
      setShow2FASetup(true);
    },
  });
  
  const enable2FA = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/manager/2fa/enable/${manager?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ token: totpCode }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        refetchTwoFAStatus();
        setShow2FASetup(false);
        setTotpCode("");
        setQrCodeUrl("");
        setTotpSecret("");
      }
    },
  });
  
  const disable2FA = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/manager/2fa/disable/${manager?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ token: totpCode }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        refetchTwoFAStatus();
        setTotpCode("");
      }
    },
  });

  // Team Management state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'DRIVER', pin: '' });
  const [userError, setUserError] = useState<string | null>(null);

  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ['users', company?.id],
    queryFn: async () => {
      const res = await fetch(`/api/manager/users/${company?.id}`, { headers: authHeaders() });
      return res.json();
    },
    enabled: !!company?.id
  });

  const createUser = useMutation({
    mutationFn: async (userData: typeof userForm) => {
      const res = await fetch('/api/manager/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          companyId: company?.id,
          ...userData,
          pin: userData.pin || null,
          managerId: manager?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      return data;
    },
    onSuccess: () => {
      refetchUsers();
      setIsAddingUser(false);
      setUserForm({ name: '', email: '', role: 'DRIVER', pin: '' });
      setUserError(null);
    },
    onError: (error: Error) => {
      setUserError(error.message);
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<typeof userForm>) => {
      const res = await fetch(`/api/manager/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ ...data, pin: data.pin || null, managerId: manager?.id, companyId: company?.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update user');
      return result;
    },
    onSuccess: () => {
      refetchUsers();
      setEditingUser(null);
      setUserForm({ name: '', email: '', role: 'DRIVER', pin: '' });
      setUserError(null);
    },
    onError: (error: Error) => {
      setUserError(error.message);
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/manager/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ managerId: manager?.id, companyId: company?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to deactivate user');
      return data;
    },
    onSuccess: () => {
      refetchUsers();
      setUserError(null);
    },
    onError: (error: Error) => {
      setUserError(error.message);
    },
  });

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, role: user.role, pin: user.pin || '' });
    setIsAddingUser(false);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      updateUser.mutate({ id: editingUser.id, ...userForm });
    } else {
      createUser.mutate(userForm);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setIsAddingUser(false);
    setUserForm({ name: '', email: '', role: 'DRIVER', pin: '' });
  };

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
                        <div className="space-y-6">
                            <TitanInput label="Company Display Name" defaultValue={company?.name || ""} />
                            
                            {company?.id && (
                              <LogoUploader
                                currentLogoUrl={logoUrl}
                                companyId={company.id}
                                onUploadComplete={handleLogoUpload}
                              />
                            )}
                            
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

            {/* Security / 2FA Section */}
            <TitanCard>
                <TitanCardHeader>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Security</h2>
                            <p className="text-sm text-muted-foreground">Protect your account with two-factor authentication.</p>
                        </div>
                    </div>
                </TitanCardHeader>
                <TitanCardContent className="space-y-6">
                    <div className="p-4 rounded-xl border border-border bg-background">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Two-Factor Authentication</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {twoFAStatus?.enabled 
                                            ? "Your account is protected with 2FA"
                                            : "Add an extra layer of security to your account"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {twoFAStatus?.enabled ? (
                                    <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                                        <Check className="h-4 w-4" />
                                        Enabled
                                    </span>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Disabled</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {!twoFAStatus?.enabled && !show2FASetup && (
                        <TitanButton
                            onClick={() => setup2FA.mutate()}
                            disabled={setup2FA.isPending}
                            data-testid="button-setup-2fa"
                        >
                            {setup2FA.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                            Enable Two-Factor Authentication
                        </TitanButton>
                    )}

                    {show2FASetup && (
                        <div className="space-y-6 p-6 rounded-xl border border-border bg-secondary/30">
                            <div className="text-center space-y-4">
                                <h3 className="font-semibold text-foreground">Set Up Authenticator App</h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                                </p>
                                
                                {qrCodeUrl && (
                                    <div className="flex justify-center">
                                        <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 rounded-lg border border-border" data-testid="img-2fa-qr" />
                                    </div>
                                )}
                                
                                <div className="text-xs text-muted-foreground">
                                    <p>Can't scan? Enter this code manually:</p>
                                    <code className="block mt-1 p-2 bg-background rounded text-sm font-mono tracking-widest">
                                        {totpSecret}
                                    </code>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-foreground">Enter the 6-digit code from your app</label>
                                <TitanInput
                                    type="text"
                                    placeholder="000000"
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    className="text-center text-2xl tracking-[0.5em] font-mono"
                                    data-testid="input-totp-code"
                                />
                            </div>

                            <div className="flex gap-3">
                                <TitanButton
                                    variant="outline"
                                    onClick={() => {
                                        setShow2FASetup(false);
                                        setQrCodeUrl("");
                                        setTotpSecret("");
                                        setTotpCode("");
                                    }}
                                >
                                    Cancel
                                </TitanButton>
                                <TitanButton
                                    onClick={() => enable2FA.mutate()}
                                    disabled={totpCode.length !== 6 || enable2FA.isPending}
                                    data-testid="button-verify-2fa"
                                >
                                    {enable2FA.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Verify & Enable
                                </TitanButton>
                            </div>
                        </div>
                    )}

                    {twoFAStatus?.enabled && (
                        <div className="space-y-4 p-4 rounded-xl border border-border bg-secondary/30">
                            <p className="text-sm text-muted-foreground">
                                To disable two-factor authentication, enter a code from your authenticator app.
                            </p>
                            <div className="flex gap-3">
                                <TitanInput
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    className="max-w-[200px] text-center font-mono"
                                    data-testid="input-disable-totp"
                                />
                                <TitanButton
                                    variant="outline"
                                    onClick={() => disable2FA.mutate()}
                                    disabled={totpCode.length !== 6 || disable2FA.isPending}
                                    data-testid="button-disable-2fa"
                                >
                                    {disable2FA.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Disable 2FA
                                </TitanButton>
                            </div>
                        </div>
                    )}
                </TitanCardContent>
            </TitanCard>

            {/* Feature Settings Section */}
            <TitanCard>
                <TitanCardHeader>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Settings2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Feature Settings</h2>
                            <p className="text-sm text-muted-foreground">Enable or disable features for your company.</p>
                        </div>
                    </div>
                </TitanCardHeader>
                <TitanCardContent className="space-y-4">
                    <FeatureToggle
                        label="Proof of Delivery (POD)"
                        description="Allow drivers to capture delivery proof with photos, signature, GPS, and timing. Disable if your deliveries use a third-party system (e.g. Amazon, DPD)."
                        enabled={(company?.settings as any)?.podEnabled !== false}
                        onToggle={async (enabled) => {
                            if (!company) return;
                            try {
                                const res = await fetch(`/api/manager/company/${company.id}/settings`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json", ...authHeaders() },
                                    body: JSON.stringify({ settings: { podEnabled: enabled } }),
                                });
                                if (res.ok) {
                                    const updated = await res.json();
                                    session.setCompany(updated);
                                }
                            } catch {}
                        }}
                    />
                    <FeatureToggle
                        label="Fuel Logging"
                        description="Allow drivers to record diesel and AdBlue fuel entries."
                        enabled={(company?.settings as any)?.fuelEnabled !== false}
                        onToggle={async (enabled) => {
                            if (!company) return;
                            try {
                                const res = await fetch(`/api/manager/company/${company.id}/settings`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json", ...authHeaders() },
                                    body: JSON.stringify({ settings: { fuelEnabled: enabled } }),
                                });
                                if (res.ok) {
                                    const updated = await res.json();
                                    session.setCompany(updated);
                                }
                            } catch {}
                        }}
                    />
                </TitanCardContent>
            </TitanCard>

            {/* Team Management Section */}
            <TitanCard>
                <TitanCardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Team Management</h2>
                                <p className="text-sm text-muted-foreground">Manage drivers and managers in your organization.</p>
                            </div>
                        </div>
                        <TitanButton
                            onClick={() => { setIsAddingUser(true); setEditingUser(null); setUserForm({ name: '', email: '', role: 'DRIVER', pin: '' }); }}
                            disabled={isAddingUser || !!editingUser}
                            data-testid="button-add-user"
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add User
                        </TitanButton>
                    </div>
                </TitanCardHeader>
                <TitanCardContent className="space-y-4">
                    {/* Add/Edit User Form */}
                    {(isAddingUser || editingUser) && (
                        <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-4">
                            <h4 className="font-semibold text-foreground">
                                {editingUser ? `Edit ${editingUser.name}` : 'Add New User'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TitanInput
                                    label="Full Name"
                                    value={userForm.name}
                                    onChange={(e) => setUserForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. John Smith"
                                    data-testid="input-user-name"
                                />
                                <TitanInput
                                    label="Email Address"
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="e.g. john@company.com"
                                    data-testid="input-user-email"
                                />
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Role</label>
                                    <select
                                        value={userForm.role}
                                        onChange={(e) => setUserForm(f => ({ ...f, role: e.target.value }))}
                                        className="w-full h-12 px-4 rounded-[14px] border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        data-testid="select-user-role"
                                    >
                                        <option value="DRIVER">Driver</option>
                                        <option value="MANAGER">Manager</option>
                                    </select>
                                </div>
                                <TitanInput
                                    label="PIN Code"
                                    value={userForm.pin}
                                    onChange={(e) => setUserForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                    placeholder="4-digit PIN"
                                    maxLength={4}
                                    data-testid="input-user-pin"
                                />
                            </div>
                            {userError && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" data-testid="error-user-form">
                                    <div className="flex items-center gap-2">
                                        <X className="h-4 w-4" />
                                        <span>{userError}</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3">
                                <TitanButton
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    data-testid="button-cancel-user"
                                >
                                    Cancel
                                </TitanButton>
                                <TitanButton
                                    onClick={handleSaveUser}
                                    disabled={!userForm.name || !userForm.email || createUser.isPending || updateUser.isPending}
                                    data-testid="button-save-user"
                                >
                                    {(createUser.isPending || updateUser.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    {editingUser ? 'Update User' : 'Create User'}
                                </TitanButton>
                            </div>
                        </div>
                    )}

                    {/* Users List */}
                    <div className="space-y-2">
                        {(users as User[]).filter((u: User) => u.active).map((user: User) => (
                            <div key={user.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-secondary/30 transition-colors" data-testid={`user-row-${user.id}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${user.role === 'MANAGER' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {user.role === 'MANAGER' ? <UserCog className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {user.role}
                                    </span>
                                    {user.pin && (
                                        <span className="px-2 py-1 text-xs font-mono bg-secondary text-muted-foreground rounded">
                                            PIN: {user.pin}
                                        </span>
                                    )}
                                    <TitanButton
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditUser(user)}
                                        disabled={!!editingUser || isAddingUser}
                                        data-testid={`button-edit-user-${user.id}`}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </TitanButton>
                                    <TitanButton
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm(`Are you sure you want to deactivate ${user.name}? They will no longer be able to log in.`)) {
                                                deleteUser.mutate(user.id);
                                            }
                                        }}
                                        disabled={user.id === manager?.id}
                                        data-testid={`button-delete-user-${user.id}`}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </TitanButton>
                                </div>
                            </div>
                        ))}

                        {(users as User[]).filter((u: User) => u.active).length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                <p>No team members yet. Add your first user above.</p>
                            </div>
                        )}
                    </div>
                </TitanCardContent>
            </TitanCard>
        </div>
      </div>
    </ManagerLayout>
  );
}
