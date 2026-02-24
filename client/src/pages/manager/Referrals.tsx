import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

import { 
  Gift, 
  Copy, 
  Mail, 
  Share2, 
  Users, 
  UserPlus, 
  Trophy, 
  Check,
  Clock,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ReferralStats {
  total: number;
  signedUp: number;
  converted: number;
  rewardsEarned: number;
}

interface Referral {
  id: number;
  referralCode: string;
  referredCompanyId: number | null;
  referredCompanyName: string | null;
  status: string;
  rewardType: string | null;
  rewardValue: number | null;
  rewardClaimed: boolean;
  signedUpAt: string | null;
  convertedAt: string | null;
  createdAt: string;
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconBg,
  iconColor,
  loading
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType; 
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}) {
  return (
    <div 
      className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200"
      data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <div className="h-9 w-20 bg-slate-100 rounded-lg animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          )}
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBg} shadow-sm`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    pending: { label: "Pending", variant: "secondary" },
    signed_up: { label: "Signed Up", variant: "outline" },
    converted: { label: "Converted", variant: "default" },
    rewarded: { label: "Rewarded", variant: "default" }
  };
  
  const config = statusConfig[status] || { label: status, variant: "secondary" as const };
  
  return (
    <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
      {config.label}
    </Badge>
  );
}

export default function Referrals() {
  const { toast } = useToast();
  const user = session.getUser();
  const companyId = user?.companyId;
  const [copied, setCopied] = useState(false);

  const { data: codeData, isLoading: codeLoading } = useQuery<{ referralCode: string }>({
    queryKey: ["/api/referral/code", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/referral/code?companyId=${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch referral code");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/referral/stats", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/referral/stats?companyId=${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch referral stats");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ["/api/referral/list", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/referral/list?companyId=${companyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch referrals");
      return res.json();
    },
    enabled: !!companyId,
  });

  const referralCode = codeData?.referralCode || "";
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Join Titan Fleet - Fleet Management Made Easy");
    const body = encodeURIComponent(
      `Hi,\n\nI've been using Titan Fleet for fleet management and I think you'd love it too!\n\nUse my referral code to sign up: ${referralCode}\n\nOr click this link: ${referralLink}\n\nWhen you subscribe, we both benefit!\n\nBest regards`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `Check out Titan Fleet for fleet management! Use my referral code ${referralCode} when you sign up: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`);
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-500 p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Refer & Earn</h1>
                <p className="text-blue-100">Share Titan Fleet and get rewarded</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-100 mb-2">Your Referral Code</p>
              <div className="flex items-center gap-3 flex-wrap">
                {codeLoading ? (
                  <div className="h-10 w-40 bg-white/20 rounded-lg animate-pulse" />
                ) : (
                  <span 
                    className="text-3xl font-mono font-bold tracking-wider"
                    data-testid="text-referral-code"
                  >
                    {referralCode}
                  </span>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(referralCode, "Referral code")}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                  data-testid="button-copy-code"
                >
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => copyToClipboard(referralLink, "Referral link")}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                data-testid="button-copy-link"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button
                variant="secondary"
                onClick={shareViaEmail}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                data-testid="button-share-email"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button
                variant="secondary"
                onClick={shareViaWhatsApp}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                data-testid="button-share-whatsapp"
              >
                <Share2 className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">How it works</h3>
              <p className="text-sm text-slate-600">
                Refer a company, get <span className="font-semibold text-emerald-600">1 month free</span> when they subscribe to a paid plan!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Referrals"
            value={stats?.total || 0}
            icon={Users}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            loading={statsLoading}
          />
          <StatCard
            title="Signed Up"
            value={stats?.signedUp || 0}
            icon={UserPlus}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            loading={statsLoading}
          />
          <StatCard
            title="Converted"
            value={stats?.converted || 0}
            icon={Check}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            loading={statsLoading}
          />
          <StatCard
            title="Rewards Earned"
            value={stats?.rewardsEarned || 0}
            icon={Trophy}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            loading={statsLoading}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Your Referrals</h2>
            <p className="text-sm text-slate-500">Track all your referrals and their status</p>
          </div>
          
          {referralsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-sm text-slate-500">Loading referrals...</p>
            </div>
          ) : !referrals || referrals.length === 0 ? (
            <div className="p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No referrals yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Share your referral code with other fleet operators to start earning rewards!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-referrals">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Signed Up</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Converted</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-slate-50 transition-colors" data-testid={`row-referral-${referral.id}`}>
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-900">
                          {referral.referredCompanyName || "Pending signup..."}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={referral.status} />
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {referral.signedUpAt ? new Date(referral.signedUpAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {referral.convertedAt ? new Date(referral.convertedAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-5 py-4">
                        {referral.rewardClaimed ? (
                          <Badge variant="default" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            <Check className="h-3 w-3 mr-1" />
                            Claimed
                          </Badge>
                        ) : referral.status === 'converted' || referral.status === 'rewarded' ? (
                          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}
