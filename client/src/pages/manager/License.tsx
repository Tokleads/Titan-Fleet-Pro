import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { 
  Shield,
  Truck,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  X
} from "lucide-react";

interface LicenseInfo {
  tier: string;
  tierDisplay: string;
  activeVehicleCount: number;
  allowance: number;
  graceOverage: number;
  softLimit: number;
  hardLimit: number;
  state: 'ok' | 'at_limit' | 'in_grace' | 'over_hard_limit';
  remainingToSoft: number;
  remainingToHard: number;
  percentUsed: number;
}

function UsageBar({ usage, allowance, hardLimit }: { usage: number; allowance: number; hardLimit: number }) {
  const softPercent = Math.min(100, (Math.min(usage, allowance) / hardLimit) * 100);
  const gracePercent = usage > allowance ? Math.min((usage - allowance) / (hardLimit - allowance) * ((hardLimit - allowance) / hardLimit * 100), ((hardLimit - allowance) / hardLimit * 100)) : 0;
  const allowanceMarker = (allowance / hardLimit) * 100;

  return (
    <div className="space-y-2">
      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${softPercent}%` }}
        />
        {usage > allowance && (
          <div 
            className="absolute top-0 h-full bg-amber-500 transition-all duration-500"
            style={{ left: `${allowanceMarker}%`, width: `${gracePercent}%` }}
          />
        )}
        <div 
          className="absolute top-0 h-full w-0.5 bg-slate-400"
          style={{ left: `${allowanceMarker}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>0</span>
        <span className="font-medium">{allowance} (allowance)</span>
        <span>{hardLimit} (max)</span>
      </div>
    </div>
  );
}

export default function ManagerLicense() {
  const company = session.getCompany();
  const user = session.getUser();
  const companyId = company?.id;
  const queryClient = useQueryClient();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const { data: license, isLoading } = useQuery<LicenseInfo>({
    queryKey: ["license", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/company/license/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch license info");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: stripeProducts } = useQuery<any>({
    queryKey: ["stripe-products"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const handlePlanUpgrade = async (planKey: string) => {
    if (!stripeProducts?.products?.length) return;

    const planNameMap: Record<string, string[]> = {
      starter: ["starter", "core", "lite"],
      growth: ["growth"],
      pro: ["pro", "professional"],
      scale: ["scale", "operator", "enterprise", "unlimited"],
    };

    const matchNames = planNameMap[planKey] || [planKey];
    const product = stripeProducts.products.find((p: any) =>
      matchNames.some((name: string) => p.name.toLowerCase().includes(name))
    );

    const priceId = product?.prices?.[0]?.id;
    if (!priceId) {
      window.open("https://titanfleet.co.uk/pricing", "_blank");
      return;
    }

    setCheckoutLoading(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          companyName: company?.name,
          companyEmail: company?.contactEmail || user?.email,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const upgradeMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch("/api/company/license/request-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          managerId: user?.id,
          message,
          currentTier: license?.tier || "core"
        })
      });
      if (!res.ok) throw new Error("Failed to submit upgrade request");
      return res.json();
    },
    onSuccess: () => {
      setShowUpgradeDialog(false);
      setUpgradeMessage("");
      queryClient.invalidateQueries({ queryKey: ["license", companyId] });
    }
  });

  const getStateInfo = (state: string) => {
    switch (state) {
      case 'ok':
        return { color: 'emerald', icon: CheckCircle2, message: null };
      case 'at_limit':
        return { 
          color: 'blue', 
          icon: AlertTriangle, 
          message: `You've reached your recommended fleet size. Grace vehicles available: ${license?.graceOverage || 0}.`
        };
      case 'in_grace':
        const graceUsed = (license?.activeVehicleCount || 0) - (license?.allowance || 0);
        return { 
          color: 'amber', 
          icon: AlertTriangle, 
          message: `Grace active: you are using ${graceUsed} of ${license?.graceOverage || 0} grace vehicles. Upgrade recommended.`
        };
      case 'over_hard_limit':
        return { 
          color: 'red', 
          icon: AlertTriangle, 
          message: "Capacity exceeded. You can't add more vehicles until upgraded."
        };
      default:
        return { color: 'slate', icon: Shield, message: null };
    }
  };

  const stateInfo = license ? getStateInfo(license.state) : null;

  return (
    <ManagerLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">License</h1>
          <p className="text-slate-500 mt-0.5">Manage your fleet license and vehicle capacity</p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-32 bg-slate-100 rounded" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
            </div>
          </div>
        ) : license ? (
          <>
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Shield className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Current Plan</p>
                    <p className="text-2xl font-bold text-slate-900">{license.tierDisplay}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUpgradeDialog(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                  data-testid="button-request-upgrade"
                >
                  Request upgrade
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-slate-400" />
                    <span className="font-medium text-slate-900">Vehicle Usage</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">
                    {license.activeVehicleCount} / {license.allowance}
                    {license.activeVehicleCount > license.allowance && (
                      <span className="text-amber-600 ml-1">(Grace active)</span>
                    )}
                  </span>
                </div>
                <UsageBar 
                  usage={license.activeVehicleCount} 
                  allowance={license.allowance} 
                  hardLimit={license.hardLimit} 
                />
              </div>

              {stateInfo?.message && (
                <div className={`flex items-start gap-3 p-4 rounded-xl ${
                  license.state === 'at_limit' ? 'bg-blue-50 border border-blue-100' :
                  license.state === 'in_grace' ? 'bg-amber-50 border border-amber-100' :
                  license.state === 'over_hard_limit' ? 'bg-red-50 border border-red-100' : ''
                }`}>
                  <stateInfo.icon className={`h-5 w-5 mt-0.5 ${
                    license.state === 'at_limit' ? 'text-blue-600' :
                    license.state === 'in_grace' ? 'text-amber-600' :
                    license.state === 'over_hard_limit' ? 'text-red-600' : ''
                  }`} />
                  <p className={`text-sm font-medium ${
                    license.state === 'at_limit' ? 'text-blue-800' :
                    license.state === 'in_grace' ? 'text-amber-800' :
                    license.state === 'over_hard_limit' ? 'text-red-800' : ''
                  }`}>
                    {stateInfo.message}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-900">{license.activeVehicleCount}</p>
                  <p className="text-xs text-slate-500">Active Vehicles</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-900">{license.allowance}</p>
                  <p className="text-xs text-slate-500">Allowance</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-900">{license.graceOverage}</p>
                  <p className="text-xs text-slate-500">Grace Buffer</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-900">{license.remainingToHard}</p>
                  <p className="text-xs text-slate-500">Remaining</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Available Plans</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'starter', name: 'Starter', price: '£59', vehicles: 'Up to 10 vehicles', aliases: ['core'] },
                  { key: 'growth', name: 'Growth', price: '£129', vehicles: 'Up to 25 vehicles', aliases: [] },
                  { key: 'pro', name: 'Pro', price: '£249', vehicles: 'Up to 50 vehicles', aliases: [] },
                  { key: 'scale', name: 'Scale', price: '£399', vehicles: 'Unlimited vehicles', aliases: ['operator'] },
                ].map((plan) => {
                  const isCurrent = license.tier === plan.key || plan.aliases.includes(license.tier);
                  const isLoading = checkoutLoading === plan.key;
                  return (
                    <button
                      key={plan.key}
                      onClick={() => !isCurrent && handlePlanUpgrade(plan.key)}
                      disabled={isCurrent || isLoading}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isCurrent 
                          ? 'border-blue-500 bg-white cursor-default' 
                          : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer active:scale-[0.98]'
                      } ${isLoading ? 'opacity-70' : ''}`}
                      data-testid={`button-plan-${plan.key}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900">{plan.name}</span>
                        {isCurrent && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Current</span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-slate-900">{plan.price}<span className="text-xs font-normal text-slate-500">/mo</span></p>
                      <p className="text-sm text-slate-500 mt-1">{plan.vehicles}</p>
                      {!isCurrent && (
                        <p className="text-xs text-blue-600 font-medium mt-2">
                          {isLoading ? 'Redirecting...' : 'Click to upgrade →'}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        {showUpgradeDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Request Upgrade</h3>
                <button 
                  onClick={() => setShowUpgradeDialog(false)}
                  className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
                  data-testid="button-close-upgrade-dialog"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Tell us about your upgrade needs. Our team will contact you shortly.
              </p>
              <textarea
                value={upgradeMessage}
                onChange={(e) => setUpgradeMessage(e.target.value)}
                placeholder="e.g., We're expanding our fleet to 25 vehicles next month..."
                className="w-full h-32 p-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                data-testid="input-upgrade-message"
              />
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setShowUpgradeDialog(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  data-testid="button-cancel-upgrade"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => upgradeMutation.mutate(upgradeMessage)}
                  disabled={upgradeMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  data-testid="button-submit-upgrade"
                >
                  {upgradeMutation.isPending ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
