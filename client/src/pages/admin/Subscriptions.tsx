import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "./AdminLayout";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Users, AlertTriangle, XCircle, TrendingUp, Loader2, ExternalLink } from "lucide-react";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Subscription {
  companyId: number;
  companyName: string;
  companyCode: string;
  tier: string;
  monthlyPrice: number;
  stripeStatus: string;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
}

interface SubscriptionStats {
  active: number;
  trialing: number;
  canceled: number;
  pastDue: number;
  mrr: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  trialing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  canceled: "bg-red-500/10 text-red-400 border-red-500/20",
  past_due: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  no_subscription: "bg-slate-500/10 text-slate-400 border-slate-500/20",
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

export default function AdminSubscriptions() {
  const [, setLocation] = useLocation();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({ active: 0, trialing: 0, canceled: 0, pastDue: 0, mrr: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      const token = localStorage.getItem("titan_admin_token");
      if (!token) {
        setLocation("/admin/login");
        return;
      }

      try {
        const response = await fetch("/api/admin/subscriptions", {
          headers: { "x-admin-token": token, ...authHeaders() },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("titan_admin_token");
            localStorage.removeItem("titan_admin_authenticated");
            setLocation("/admin/login");
            return;
          }
          throw new Error("Failed to fetch subscriptions");
        }

        const data = await response.json();
        const subs: Subscription[] = data.subscriptions || data || [];
        setSubscriptions(subs);

        const computed: SubscriptionStats = {
          active: subs.filter((s) => s.stripeStatus === "active").length,
          trialing: subs.filter((s) => s.stripeStatus === "trialing").length,
          canceled: subs.filter((s) => s.stripeStatus === "canceled").length,
          pastDue: subs.filter((s) => s.stripeStatus === "past_due").length,
          mrr: subs
            .filter((s) => s.stripeStatus === "active" || s.stripeStatus === "trialing")
            .reduce((sum, s) => sum + (s.monthlyPrice || 0), 0),
        };
        setStats(data.summary || computed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load subscriptions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, [setLocation]);

  const summaryCards = [
    { title: "Active", value: stats.active, icon: Users, color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/20" },
    { title: "Trialing", value: stats.trialing, icon: CreditCard, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
    { title: "Canceled", value: stats.canceled, icon: XCircle, color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" },
    { title: "Past Due", value: stats.pastDue, icon: AlertTriangle, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
    { title: "MRR (£)", value: `£${stats.mrr.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white" data-testid="text-subscriptions-title">Subscriptions</h1>
          <p className="text-slate-400 mt-1">Manage company subscriptions and billing</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : error ? (
          <motion.div className="p-6 bg-red-900/20 rounded-2xl border border-red-800">
            <p className="text-red-400" data-testid="text-subscriptions-error">{error}</p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {summaryCards.map((card) => (
                <motion.div key={card.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.14 }} className={`p-6 bg-slate-900/50 rounded-2xl border ${card.borderColor}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400" data-testid={`text-label-${card.title.toLowerCase().replace(/[\s()£]/g, "-")}`}>{card.title}</p>
                      <p className="text-3xl font-bold text-white mt-1" data-testid={`text-value-${card.title.toLowerCase().replace(/[\s()£]/g, "-")}`}>
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
                      <TableHead className="text-slate-400">Company</TableHead>
                      <TableHead className="text-slate-400">Code</TableHead>
                      <TableHead className="text-slate-400">Tier</TableHead>
                      <TableHead className="text-slate-400">Monthly Price (£)</TableHead>
                      <TableHead className="text-slate-400">Stripe Status</TableHead>
                      <TableHead className="text-slate-400">Trial End</TableHead>
                      <TableHead className="text-slate-400">Next Payment</TableHead>
                      <TableHead className="text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.length === 0 ? (
                      <TableRow className="border-slate-800">
                        <TableCell colSpan={8} className="text-center py-12">
                          <CreditCard className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400">No subscriptions found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptions.map((sub) => (
                        <TableRow key={sub.companyId} className="border-slate-800 hover:bg-slate-800/50" data-testid={`row-subscription-${sub.companyId}`}>
                          <TableCell className="font-medium text-white" data-testid={`text-company-name-${sub.companyId}`}>{sub.companyName}</TableCell>
                          <TableCell>
                            <code className="px-2 py-1 rounded bg-slate-800 text-amber-400 text-sm font-mono" data-testid={`text-company-code-${sub.companyId}`}>
                              {sub.companyCode}
                            </code>
                          </TableCell>
                          <TableCell className="text-slate-300 capitalize" data-testid={`text-tier-${sub.companyId}`}>{sub.tier}</TableCell>
                          <TableCell className="text-slate-300" data-testid={`text-price-${sub.companyId}`}>£{(sub.monthlyPrice || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[sub.stripeStatus] || STATUS_COLORS.no_subscription} data-testid={`badge-status-${sub.companyId}`}>
                              {formatStatus(sub.stripeStatus || "no_subscription")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300" data-testid={`text-trial-end-${sub.companyId}`}>{formatDate(sub.trialEnd)}</TableCell>
                          <TableCell className="text-slate-300" data-testid={`text-next-payment-${sub.companyId}`}>{formatDate(sub.currentPeriodEnd)}</TableCell>
                          <TableCell className="text-right">
                            {sub.stripeCustomerId && (
                              <a
                                href={`https://dashboard.stripe.com/customers/${sub.stripeCustomerId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                                data-testid={`link-stripe-${sub.companyId}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                                Stripe
                              </a>
                            )}
                          </TableCell>
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
