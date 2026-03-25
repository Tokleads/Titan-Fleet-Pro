import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { Bug, Lightbulb, ThumbsUp, Star, Filter, MessageSquare, Clock, CheckCircle2, Archive } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
  bug: { label: "Bug", icon: Bug, color: "text-red-500", bg: "bg-red-50 border-red-200" },
  feature: { label: "Feature", icon: Lightbulb, color: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
  general: { label: "General", icon: ThumbsUp, color: "text-green-500", bg: "bg-green-50 border-green-200" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: "New", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Clock },
  reviewed: { label: "Reviewed", color: "text-blue-600 bg-blue-50 border-blue-200", icon: CheckCircle2 },
  actioned: { label: "Actioned", color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2 },
  closed: { label: "Closed", color: "text-slate-500 bg-slate-100 border-slate-200", icon: Archive },
};

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
        />
      ))}
      <span className="text-xs text-slate-500 ml-1">{rating}/5</span>
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

export default function BetaFeedback() {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["beta-feedback", typeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/beta-feedback?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch feedback");
      return res.json() as Promise<{ items: FeedbackItem[]; total: number }>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: number; status: string; note?: string }) => {
      const res = await fetch(`/api/beta-feedback/${id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beta-feedback"] });
      setExpandedId(null);
      setAdminNote("");
      toast({ title: "Status updated" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to update status" });
    },
  });

  const items = data?.items || [];
  const total = data?.total || 0;

  const counts = {
    new: items.filter((i) => i.status === "new").length,
    bug: items.filter((i) => i.type === "bug").length,
    feature: items.filter((i) => i.type === "feature").length,
    general: items.filter((i) => i.type === "general").length,
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Beta Feedback</h1>
            <p className="text-slate-500 mt-1">{total} submission{total !== 1 ? "s" : ""} from your team</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Unreviewed", value: counts.new, color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
            { label: "Bug Reports", value: counts.bug, color: "text-red-600", bg: "bg-red-50", icon: Bug },
            { label: "Feature Requests", value: counts.feature, color: "text-blue-600", bg: "bg-blue-50", icon: Lightbulb },
            { label: "General", value: counts.general, color: "text-green-600", bg: "bg-green-50", icon: ThumbsUp },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} border border-slate-200 rounded-xl p-4`}>
              <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-600 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            data-testid="select-feedback-type-filter"
          >
            <option value="">All Types</option>
            <option value="bug">Bugs</option>
            <option value="feature">Features</option>
            <option value="general">General</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            data-testid="select-feedback-status-filter"
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
            <div className="h-8 w-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No feedback yet</p>
            <p className="text-slate-400 text-sm mt-1">
              {typeFilter || statusFilter
                ? "Try removing filters"
                : "Feedback submitted by your team will appear here"}
            </p>
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
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                  data-testid={`feedback-item-${item.id}`}
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
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
                          {item.userName && (
                            <span className="text-xs text-slate-500 font-medium" data-testid={`feedback-username-${item.id}`}>{item.userName}</span>
                          )}
                          {item.companyName && (
                            <span className="text-xs text-slate-400" data-testid={`feedback-company-${item.id}`}>{item.companyName}</span>
                          )}
                          <StarDisplay rating={item.rating} />
                        </div>
                        <p className="text-sm text-slate-800 line-clamp-2">{item.message}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {item.page && (
                            <span className="text-xs text-slate-400 font-mono">{item.page}</span>
                          )}
                          <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">{item.message}</p>
                        {item.userEmail && (
                          <p className="text-xs text-slate-400 mt-2">From: {item.userEmail}</p>
                        )}
                        {item.adminNote && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs text-amber-600 font-medium mb-1">Admin note</p>
                            <p className="text-xs text-slate-600">{item.adminNote}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <textarea
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Add a note (optional)..."
                          className="w-full h-16 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                          data-testid={`admin-note-${item.id}`}
                        />
                        <div className="flex gap-2 flex-wrap">
                          {["reviewed", "actioned", "closed"].map((s) => (
                            <button
                              key={s}
                              onClick={() => updateMutation.mutate({ id: item.id, status: s, note: adminNote || undefined })}
                              disabled={updateMutation.isPending || item.status === s}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
                                item.status === s
                                  ? "bg-slate-100 text-slate-400 cursor-default"
                                  : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                              }`}
                              data-testid={`button-status-${s}-${item.id}`}
                            >
                              {updateMutation.isPending ? "..." : `Mark ${s}`}
                            </button>
                          ))}
                          {item.status !== "new" && (
                            <button
                              onClick={() => updateMutation.mutate({ id: item.id, status: "new" })}
                              disabled={updateMutation.isPending}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors disabled:opacity-40"
                              data-testid={`button-reopen-${item.id}`}
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
