import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { AdminLayout } from "./AdminLayout";
import { TitanButton } from "@/components/titan-ui/Button";
import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  Truck, 
  TrendingUp,
  Plus,
  Activity,
  DollarSign,
  Crown,
  Zap,
  Shield
} from "lucide-react";

interface AdminStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  totalVehicles: number;
  monthlyRevenue: number;
  tierBreakdown: {
    starter: number;
    growth: number;
    pro: number;
    scale: number;
  };
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
  }[];
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("titan_admin_token");
      if (!token) {
        setLocation("/admin/login");
        return;
      }

      try {
        const response = await fetch("/api/admin/stats", {
          headers: {
            "x-admin-token": token,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("titan_admin_token");
            localStorage.removeItem("titan_admin_authenticated");
            setLocation("/admin/login");
            return;
          }
          throw new Error("Failed to fetch stats");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [setLocation]);

  const statCards = [
    {
      title: "Total Companies",
      value: stats?.totalCompanies || 0,
      icon: Building2,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    },
    {
      title: "Active Companies",
      value: stats?.activeCompanies || 0,
      icon: Activity,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20"
    },
    {
      title: "Total Vehicles",
      value: stats?.totalVehicles || 0,
      icon: Truck,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20"
    }
  ];

  const tierIcons: Record<string, React.ElementType> = {
    starter: Shield,
    growth: TrendingUp,
    pro: Zap,
    scale: Crown
  };

  const tierColors: Record<string, string> = {
    starter: "text-slate-400",
    growth: "text-blue-400",
    pro: "text-purple-400",
    scale: "text-amber-400"
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
            <p className="text-slate-400 mt-1">Platform-wide statistics and management</p>
          </div>
          <Link href="/admin/companies">
            <TitanButton className="bg-amber-600 hover:bg-amber-700 text-white" data-testid="button-add-company">
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </TitanButton>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : error ? (
          <motion.div className="p-6 bg-red-900/20 rounded-2xl border border-red-800">
            <p className="text-red-400">{error}</p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`p-6 bg-slate-900/50 rounded-2xl border ${card.borderColor} hover:border-opacity-50 transition-all`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-400">{card.title}</p>
                        <p className="text-3xl font-bold text-white mt-1">{card.value.toLocaleString()}</p>
                      </div>
                      <div className={`h-12 w-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                        <card.icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-1"
              >
                <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Revenue Summary</h3>
                      <p className="text-sm text-slate-400">Monthly recurring revenue</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-4xl font-bold text-green-400">
                      £{stats?.monthlyRevenue?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">per month</p>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(stats?.tierBreakdown || {}).map(([tier, count]) => {
                      const Icon = tierIcons[tier] || Shield;
                      const color = tierColors[tier] || "text-slate-400";
                      const pricing: Record<string, number> = { starter: 59, growth: 129, pro: 249, scale: 399 };
                      
                      return (
                        <div key={tier} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${color}`} />
                            <span className="text-sm font-medium text-slate-300 capitalize">{tier}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-white">{count} companies</span>
                            <p className="text-xs text-slate-500">£{pricing[tier]}/mo each</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2"
              >
                <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                      <p className="text-sm text-slate-400">Latest platform activity</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                      stats.recentActivity.map((activity, index) => (
                        <div 
                          key={index} 
                          className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                        >
                          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Building2 className="h-4 w-4 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-300">{activity.description}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(activity.timestamp).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
