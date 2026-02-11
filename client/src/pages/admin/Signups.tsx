import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "./AdminLayout";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";

interface Signup {
  id: number;
  email: string;
  tier: string;
  maxVehicles: number | null;
  referralCode: string | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
}

interface SignupStats {
  total: number;
  completed: number;
  pending: number;
  expired: number;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  pending: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
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

export default function AdminSignups() {
  const [, setLocation] = useLocation();
  const [signups, setSignups] = useState<Signup[]>([]);
  const [stats, setStats] = useState<SignupStats>({ total: 0, completed: 0, pending: 0, expired: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignups = async () => {
      const token = localStorage.getItem("titan_admin_token");
      if (!token) {
        setLocation("/admin/login");
        return;
      }

      try {
        const response = await fetch("/api/admin/onboarding", {
          headers: { "x-admin-token": token },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("titan_admin_token");
            localStorage.removeItem("titan_admin_authenticated");
            setLocation("/admin/login");
            return;
          }
          throw new Error("Failed to fetch signups");
        }

        const data = await response.json();
        const items: Signup[] = data.tokens || data.signups || data || [];
        setSignups(items);

        const computed: SignupStats = {
          total: items.length,
          completed: items.filter((s) => s.status === "completed").length,
          pending: items.filter((s) => s.status === "pending").length,
          expired: items.filter((s) => s.status === "expired").length,
        };
        setStats(data.stats || computed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load signups");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignups();
  }, [setLocation]);

  const summaryCards = [
    { title: "Total Signups", value: stats.total, icon: UserPlus, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
    { title: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/20" },
    { title: "Pending", value: stats.pending, icon: Clock, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
    { title: "Expired", value: stats.expired, icon: XCircle, color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white" data-testid="text-signups-title">Signups</h1>
          <p className="text-slate-400 mt-1">Account setup tokens and onboarding status</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : error ? (
          <motion.div className="p-6 bg-red-900/20 rounded-2xl border border-red-800">
            <p className="text-red-400" data-testid="text-signups-error">{error}</p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {summaryCards.map((card) => (
                <motion.div key={card.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.14 }} className={`p-6 bg-slate-900/50 rounded-2xl border ${card.borderColor}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400" data-testid={`text-label-${card.title.toLowerCase().replace(/\s/g, "-")}`}>{card.title}</p>
                      <p className="text-3xl font-bold text-white mt-1" data-testid={`text-value-${card.title.toLowerCase().replace(/\s/g, "-")}`}>{card.value.toLocaleString()}</p>
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
                      <TableHead className="text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-400">Tier</TableHead>
                      <TableHead className="text-slate-400">Max Vehicles</TableHead>
                      <TableHead className="text-slate-400">Referral Code</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Created</TableHead>
                      <TableHead className="text-slate-400">Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signups.length === 0 ? (
                      <TableRow className="border-slate-800">
                        <TableCell colSpan={7} className="text-center py-12">
                          <UserPlus className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400">No signups found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      signups.map((signup, index) => (
                        <TableRow key={signup.id || index} className="border-slate-800 hover:bg-slate-800/50" data-testid={`row-signup-${signup.id || index}`}>
                          <TableCell className="font-medium text-white" data-testid={`text-signup-email-${signup.id || index}`}>{signup.email}</TableCell>
                          <TableCell className="text-slate-300 capitalize" data-testid={`text-signup-tier-${signup.id || index}`}>{signup.tier}</TableCell>
                          <TableCell className="text-slate-300" data-testid={`text-signup-vehicles-${signup.id || index}`}>{signup.maxVehicles ?? "—"}</TableCell>
                          <TableCell>
                            {signup.referralCode ? (
                              <code className="px-2 py-1 rounded bg-slate-800 text-amber-400 text-sm font-mono" data-testid={`text-signup-referral-${signup.id || index}`}>
                                {signup.referralCode}
                              </code>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[signup.status] || STATUS_COLORS.pending} data-testid={`badge-signup-status-${signup.id || index}`}>
                              {formatStatus(signup.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300" data-testid={`text-signup-created-${signup.id || index}`}>{formatDate(signup.createdAt)}</TableCell>
                          <TableCell className="text-slate-300" data-testid={`text-signup-expires-${signup.id || index}`}>{formatDate(signup.expiresAt)}</TableCell>
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
