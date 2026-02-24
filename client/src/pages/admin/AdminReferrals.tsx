import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "./AdminLayout";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gift, UserCheck, Award, TrendingUp, Loader2 } from "lucide-react";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Referral {
  id: number;
  referralCode: string;
  referrerCompanyName: string;
  referredCompanyName: string | null;
  status: string;
  rewardType: string | null;
  rewardValue: string | null;
  createdAt: string;
}

interface ReferralStats {
  total: number;
  signedUp: number;
  rewarded: number;
  conversionRate: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  signed_up: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  converted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  rewarded: "bg-green-500/10 text-green-400 border-green-500/20",
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminReferrals() {
  const [, setLocation] = useLocation();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({ total: 0, signedUp: 0, rewarded: 0, conversionRate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferrals = async () => {
      const token = localStorage.getItem("titan_admin_token");
      if (!token) {
        setLocation("/admin/login");
        return;
      }

      try {
        const response = await fetch("/api/admin/referrals", {
          headers: { "x-admin-token": token, ...authHeaders() },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("titan_admin_token");
            localStorage.removeItem("titan_admin_authenticated");
            setLocation("/admin/login");
            return;
          }
          throw new Error("Failed to fetch referrals");
        }

        const data = await response.json();
        const items: Referral[] = data.referrals || data || [];
        setReferrals(items);

        const signedUp = items.filter((r) => r.status === "signed_up" || r.status === "converted" || r.status === "rewarded").length;
        const rewarded = items.filter((r) => r.status === "rewarded").length;
        const computed: ReferralStats = {
          total: items.length,
          signedUp,
          rewarded,
          conversionRate: items.length > 0 ? Math.round((signedUp / items.length) * 100) : 0,
        };
        setStats(data.summary || computed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load referrals");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferrals();
  }, [setLocation]);

  const summaryCards = [
    { title: "Total Referrals", value: stats.total, icon: Gift, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
    { title: "Signed Up", value: stats.signedUp, icon: UserCheck, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
    { title: "Rewarded", value: stats.rewarded, icon: Award, color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/20" },
    { title: "Conversion Rate (%)", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white" data-testid="text-referrals-title">Referrals</h1>
          <p className="text-slate-400 mt-1">Track referral codes, conversions and rewards</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : error ? (
          <motion.div className="p-6 bg-red-900/20 rounded-2xl border border-red-800">
            <p className="text-red-400" data-testid="text-referrals-error">{error}</p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {summaryCards.map((card) => (
                <motion.div key={card.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.14 }} className={`p-6 bg-slate-900/50 rounded-2xl border ${card.borderColor}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400" data-testid={`text-label-${card.title.toLowerCase().replace(/[\s()%]/g, "-")}`}>{card.title}</p>
                      <p className="text-3xl font-bold text-white mt-1" data-testid={`text-value-${card.title.toLowerCase().replace(/[\s()%]/g, "-")}`}>
                        {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                      </p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.14 }} className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Code</TableHead>
                      <TableHead className="text-slate-400">Referrer Company</TableHead>
                      <TableHead className="text-slate-400">Referred Company</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Reward</TableHead>
                      <TableHead className="text-slate-400">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.length === 0 ? (
                      <TableRow className="border-slate-800">
                        <TableCell colSpan={6} className="text-center py-12">
                          <Gift className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400">No referrals found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      referrals.map((referral, index) => (
                        <TableRow key={referral.id || index} className="border-slate-800 hover:bg-slate-800/50" data-testid={`row-referral-${referral.id || index}`}>
                          <TableCell>
                            <code className="px-2 py-1 rounded bg-slate-800 text-amber-400 text-sm font-mono" data-testid={`text-referral-code-${referral.id || index}`}>
                              {referral.referralCode}
                            </code>
                          </TableCell>
                          <TableCell className="font-medium text-white" data-testid={`text-referrer-company-${referral.id || index}`}>{referral.referrerCompanyName}</TableCell>
                          <TableCell className="text-slate-300" data-testid={`text-referred-company-${referral.id || index}`}>{referral.referredCompanyName || "—"}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[referral.status] || STATUS_COLORS.pending} data-testid={`badge-referral-status-${referral.id || index}`}>
                              {formatStatus(referral.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300" data-testid={`text-referral-reward-${referral.id || index}`}>{referral.rewardType && referral.rewardValue ? `${referral.rewardType}: ${referral.rewardValue}` : "—"}</TableCell>
                          <TableCell className="text-slate-300" data-testid={`text-referral-created-${referral.id || index}`}>{formatDate(referral.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
