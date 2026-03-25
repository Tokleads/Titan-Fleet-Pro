import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "./AdminLayout";
import { motion } from "framer-motion";
import { Bug, Lightbulb, ThumbsUp, Star, Filter, RefreshCw, MessageSquare, CheckCircle2, Archive, Clock } from "lucide-react";

interface FeedbackItem {
  id: number;
  type: "bug" | "feature" | "general";
  message: string;
  rating: number | null;
  page: string | null;
  userEmail: string | null;
  userName: string | null;
  companyName: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

const TYPE_CONFIG = {
  bug: { label: "Bug", icon: Bug, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  feature: { label: "Feature", icon: Lightbulb, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  general: { label: "General", icon: ThumbsUp, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: "New", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
  reviewed: { label: "Reviewed", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: CheckCircle2 },
  actioned: { label: "Actioned", color: "text-green-400 bg-green-500/10 border-green-500/20", icon: CheckCircle2 },
  closed: { label: "Closed", color: "text-slate-400 bg-slate-500/10 border-slate-500/20", icon: Archive },
};

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-slate-600 text-xs">No rating</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-700"}`}
        />
      ))}
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminFeedback() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const fetchFeedback = async () => {
    const token = localStorage.getItem("titan_admin_token");
    if (!token) {
      setLocation("/admin/login");
      return;
    }
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/feedback?${params}`, {
        headers: { "x-admin-token": token },
      });
      if (res.status === 401) {
        localStorage.removeItem("titan_admin_token");
        localStorage.removeItem("titan_admin_authenticated");
        setLocation("/admin/login");
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [typeFilter, statusFilter]);

  const updateStatus = async (id: number, status: string, note?: string) => {
    const token = localStorage.getItem("titan_admin_token");
    if (!token) return;
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "x-admin-token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note }),
      });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
        setExpandedId(null);
        setAdminNote("");
      }
    } finally {
      setUpdating(null);
    }
  };

  const counts = {
    all: total,
    new: items.filter((i) => i.status === "new").length,
    bug: items.filter((i) => i.type === "bug").length,
    feature: items.filter((i) => i.type === "feature").length,
    general: items.filter((i) => i.type === "general").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Beta Feedback</h1>
            <p className="text-slate-400 mt-1">{total} submission{total !== 1 ? "s" : ""} total</p>
          </div>
          <button
            onClick={fetchFeedback}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-colors"
            data-testid="button-refresh-feedback"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Unreviewed", value: counts.new, color: "text-amber-400", icon: Clock },
            { label: "Bug Reports", value: counts.bug, color: "text-red-400", icon: Bug },
            { label: "Feature Requests", value: counts.feature, color: "text-blue-400", icon: Lightbulb },
            { label: "General", value: counts.general, color: "text-green-400", icon: ThumbsUp },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-400">Filter:</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            data-testid="select-type-filter"
          >
            <option value="">All Types</option>
            <option value="bug">Bugs</option>
            <option value="feature">Features</option>
            <option value="general">General</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            data-testid="select-status-filter"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="actioned">Actioned</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-slate-600 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <MessageSquare className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No feedback yet</p>
            <p className="text-slate-600 text-sm mt-1">Submissions will appear here once users start sending feedback</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => {
              const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG.bug;
              const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;
              const isExpanded = expandedId === item.id;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                  data-testid={`feedback-item-${item.id}`}
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : item.id);
                      setAdminNote(item.adminNote || "");
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border ${typeConf.bg} flex-shrink-0`}>
                        <typeConf.icon className={`h-4 w-4 ${typeConf.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusConf.color}`}>
                            {statusConf.label}
                          </span>
                          <span className="text-xs text-slate-500">{typeConf.label}</span>
                          {item.companyName && (
                            <span className="text-xs text-slate-600">{item.companyName}</span>
                          )}
                          {item.userName && (
                            <span className="text-xs text-slate-600">{item.userName}</span>
                          )}
                          <StarDisplay rating={item.rating} />
                        </div>
                        <p className="text-sm text-slate-200 line-clamp-2">{item.message}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {item.page && (
                            <span className="text-xs text-slate-600 font-mono">{item.page}</span>
                          )}
                          <span className="text-xs text-slate-600">{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimateExpanded isOpen={isExpanded}>
                    <div className="px-4 pb-4 border-t border-slate-800 pt-3 space-y-3">
                      <div className="bg-slate-800 rounded-lg p-3">
                        <p className="text-sm text-slate-200 whitespace-pre-wrap">{item.message}</p>
                        {item.userEmail && (
                          <p className="text-xs text-slate-500 mt-2">From: {item.userEmail}</p>
                        )}
                        {item.adminNote && (
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <p className="text-xs text-amber-500 font-medium mb-1">Admin note</p>
                            <p className="text-xs text-slate-400">{item.adminNote}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <textarea
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Add an admin note (optional)..."
                          className="w-full h-16 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/40 resize-none"
                          data-testid={`admin-note-${item.id}`}
                        />
                        <div className="flex gap-2 flex-wrap">
                          {["reviewed", "actioned", "closed"].map((s) => (
                            <button
                              key={s}
                              onClick={() => updateStatus(item.id, s, adminNote || undefined)}
                              disabled={updating === item.id || item.status === s}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
                                item.status === s
                                  ? "bg-slate-700 text-slate-400 cursor-default"
                                  : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                              }`}
                              data-testid={`button-status-${s}-${item.id}`}
                            >
                              {updating === item.id ? "..." : `Mark ${s}`}
                            </button>
                          ))}
                          {item.status !== "new" && (
                            <button
                              onClick={() => updateStatus(item.id, "new")}
                              disabled={updating === item.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 transition-colors disabled:opacity-40"
                              data-testid={`button-status-reopen-${item.id}`}
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </AnimateExpanded>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function AnimateExpanded({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresenceSimple isOpen={isOpen}>{children}</AnimatePresenceSimple>
  );
}

function AnimatePresenceSimple({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  if (!isOpen) return null;
  return <>{children}</>;
}
