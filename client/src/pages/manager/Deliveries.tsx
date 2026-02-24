import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagerLayout } from "./ManagerLayout";
import { session } from "@/lib/session";
import { useDebounce } from "@/hooks/use-debounce";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  Search,
  Calendar,
  BarChart3,
  Users,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  MapPin,
  Camera,
  PenTool,
  Clock,
  FileText,
  Loader2,
  Eye,
} from "lucide-react";

type DateRangePreset = "today" | "7days" | "30days" | "all";
type StatusFilter = "all" | "completed" | "invoiced";

function getDateRange(preset: DateRangePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];
  switch (preset) {
    case "today": {
      return { startDate: endDate, endDate };
    }
    case "7days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { startDate: d.toISOString().split("T")[0], endDate };
    }
    case "30days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { startDate: d.toISOString().split("T")[0], endDate };
    }
    case "all":
    default:
      return { startDate: "", endDate: "" };
  }
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function truncate(str: string, len: number) {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    invoiced: "bg-blue-100 text-blue-700",
    archived: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || "bg-gray-100 text-gray-600"}`}
      data-testid={`badge-status-${status}`}
    >
      {status}
    </span>
  );
}

function DeliveryPhoto({ src, idx }: { src: string; idx: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 aspect-square flex items-center justify-center">
        <div className="flex flex-col items-center gap-1 text-slate-400">
          <Camera className="h-5 w-5" />
          <span className="text-xs">Photo {idx + 1}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 aspect-square flex items-center justify-center">
      <img
        src={src}
        alt={`Delivery photo ${idx + 1}`}
        className="w-full h-full object-cover"
        data-testid={`img-delivery-photo-${idx}`}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function Deliveries() {
  const company = session.getCompany();
  const companyId = company?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { startDate, endDate } = getDateRange(datePreset);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    avgPerDriver: number;
  }>({
    queryKey: ["delivery-stats", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/deliveries/${companyId}/stats`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!companyId,
  });

  const { data: deliveriesData, isLoading } = useQuery<{
    deliveries: any[];
    total: number;
  }>({
    queryKey: [
      "manager-deliveries",
      companyId,
      page,
      debouncedSearch,
      startDate,
      endDate,
      statusFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(page * pageSize),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const res = await fetch(`/api/manager/deliveries/${companyId}?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch deliveries");
      return res.json();
    },
    enabled: !!companyId,
  });

  const deliveries = deliveriesData?.deliveries || [];
  const totalDeliveries = deliveriesData?.total || 0;
  const totalPages = Math.ceil(totalDeliveries / pageSize);
  const showingFrom = totalDeliveries === 0 ? 0 : page * pageSize + 1;
  const showingTo = Math.min((page + 1) * pageSize, totalDeliveries);

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: string }) => {
      const res = await fetch("/api/manager/deliveries/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ ids, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-stats"] });
      setSelectedIds(new Set());
      toast({ title: "Status updated", description: "Selected deliveries marked as invoiced." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update delivery status.", variant: "destructive" });
    },
  });

  const markInvoicedMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: string }) => {
      const res = await fetch("/api/manager/deliveries/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ ids, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-stats"] });
      setShowModal(false);
      setSelectedDelivery(null);
      toast({ title: "Status updated", description: "Delivery marked as invoiced." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update delivery status.", variant: "destructive" });
    },
  });

  const exportCSV = async () => {
    if (!companyId) return;
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const res = await fetch(`/api/manager/deliveries/${companyId}/export/csv?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `deliveries-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Export failed", description: "Could not export deliveries.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === deliveries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deliveries.map((d: any) => d.id)));
    }
  };

  const openDetail = (delivery: any) => {
    setSelectedDelivery(delivery);
    setShowModal(true);
  };

  const datePresets: { key: DateRangePreset; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "7days", label: "Last 7 days" },
    { key: "30days", label: "Last 30 days" },
    { key: "all", label: "All time" },
  ];

  const statusOptions: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "completed", label: "Completed" },
    { key: "invoiced", label: "Invoiced" },
  ];

  const statCards: { label: string; value: string | number; icon: any; color: string; preset?: DateRangePreset }[] = [
    { label: "Today", value: stats?.today ?? "—", icon: Package, color: "text-blue-600 bg-blue-50", preset: "today" },
    { label: "This Week", value: stats?.thisWeek ?? "—", icon: Calendar, color: "text-purple-600 bg-purple-50", preset: "7days" },
    { label: "This Month", value: stats?.thisMonth ?? "—", icon: BarChart3, color: "text-emerald-600 bg-emerald-50", preset: "30days" },
    { label: "Avg per Driver", value: stats?.avgPerDriver ?? "—", icon: Users, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <Package className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Deliveries</h1>
              <p className="text-slate-500 mt-0.5">Proof of delivery records and management</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4" data-testid="stats-grid">
          {statCards.map((card) => (
            <button
              key={card.label}
              type="button"
              className={`bg-white rounded-xl border p-5 flex items-center gap-4 text-left transition-all ${
                card.preset && datePreset === card.preset
                  ? "border-blue-400 ring-2 ring-blue-100 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
              } ${card.preset ? "cursor-pointer" : "cursor-default"}`}
              onClick={() => {
                if (card.preset) {
                  setDatePreset(datePreset === card.preset ? "all" : card.preset);
                  setPage(0);
                }
              }}
              data-testid={`stat-card-${card.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : card.value}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-3" data-testid="filters-bar">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(0); }}
              placeholder="Search customer, reference..."
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              data-testid="input-search-deliveries"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
            {datePresets.map((p) => (
              <button
                key={p.key}
                onClick={() => { setDatePreset(p.key); setPage(0); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  datePreset === p.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                data-testid={`button-date-${p.key}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
            {statusOptions.map((s) => (
              <button
                key={s.key}
                onClick={() => { setStatusFilter(s.key); setPage(0); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === s.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                data-testid={`button-status-${s.key}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            data-testid="button-export-csv"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export CSV
              </>
            )}
          </button>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between" data-testid="bulk-actions-bar">
            <span className="text-sm font-medium text-blue-700">
              {selectedIds.size} delivery{selectedIds.size !== 1 ? "ies" : ""} selected
            </span>
            <button
              onClick={() => bulkStatusMutation.mutate({ ids: Array.from(selectedIds), status: "invoiced" })}
              disabled={bulkStatusMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              data-testid="button-bulk-invoiced"
            >
              {bulkStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Mark Selected as Invoiced
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" data-testid="deliveries-table">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : deliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Package className="h-12 w-12 mb-3" />
              <p className="text-lg font-medium">No deliveries found</p>
              <p className="text-sm">Adjust your filters or check back later.</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="pl-4 pr-2 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === deliveries.length && deliveries.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        data-testid="checkbox-select-all"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date/Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Driver</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveries.map((delivery: any) => (
                    <tr
                      key={delivery.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => openDetail(delivery)}
                      data-testid={`row-delivery-${delivery.id}`}
                    >
                      <td className="pl-4 pr-2 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(delivery.id)}
                          onChange={() => toggleSelect(delivery.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          data-testid={`checkbox-delivery-${delivery.id}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap" data-testid={`text-date-${delivery.id}`}>
                        {formatDateTime(delivery.createdAt || delivery.completedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700" data-testid={`text-driver-${delivery.id}`}>
                        {delivery.driverName || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 font-medium" data-testid={`text-customer-${delivery.id}`}>
                        {delivery.customerName || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500" data-testid={`text-reference-${delivery.id}`}>
                        {delivery.referenceNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500" data-testid={`text-location-${delivery.id}`}>
                        {truncate(delivery.deliveryAddress || (delivery.gpsLatitude && delivery.gpsLongitude ? `${delivery.gpsLatitude}, ${delivery.gpsLongitude}` : ""), 30)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={delivery.status} />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openDetail(delivery)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          data-testid={`button-view-${delivery.id}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/30" data-testid="pagination">
                <p className="text-sm text-slate-500" data-testid="text-pagination-info">
                  Showing {showingFrom}–{showingTo} of {totalDeliveries}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* POD Detail Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="modal-pod-detail">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" data-testid="text-modal-title">
                <Package className="h-5 w-5 text-blue-600" />
                Proof of Delivery – {selectedDelivery?.customerName || "Unknown"}
              </DialogTitle>
            </DialogHeader>

            {selectedDelivery && (
              <div className="grid grid-cols-2 gap-6 mt-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Customer Info</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-900" data-testid="text-detail-customer">{selectedDelivery.customerName || "—"}</p>
                          <p className="text-xs text-slate-500">{selectedDelivery.deliveryAddress || "No address provided"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <p className="text-sm text-slate-700" data-testid="text-detail-reference">Ref: {selectedDelivery.referenceNumber || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Driver</h3>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <p className="text-sm text-slate-700" data-testid="text-detail-driver">{selectedDelivery.driverName || "Unknown"}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Date &amp; Time</h3>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <p className="text-sm text-slate-700" data-testid="text-detail-datetime">
                        {formatDateTime(selectedDelivery.createdAt || selectedDelivery.completedAt)}
                      </p>
                    </div>
                  </div>

                  {(selectedDelivery.arrivedAt || selectedDelivery.departedAt) && (
                    <div>
                      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Arrival / Departure</h3>
                      <div className="space-y-1.5">
                        {selectedDelivery.arrivedAt && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-500" />
                            <p className="text-sm text-slate-700" data-testid="text-detail-arrived">
                              Arrived: {formatDateTime(selectedDelivery.arrivedAt)}
                            </p>
                          </div>
                        )}
                        {selectedDelivery.departedAt && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <p className="text-sm text-slate-700" data-testid="text-detail-departed">
                              Departed: {formatDateTime(selectedDelivery.departedAt)}
                            </p>
                          </div>
                        )}
                        {selectedDelivery.arrivedAt && selectedDelivery.departedAt && (() => {
                          const diffSec = Math.floor((new Date(selectedDelivery.departedAt).getTime() - new Date(selectedDelivery.arrivedAt).getTime()) / 1000);
                          const h = Math.floor(diffSec / 3600);
                          const m = Math.floor((diffSec % 3600) / 60);
                          const durationStr = h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m} mins`;
                          return (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-slate-400" />
                              <p className="text-sm text-slate-700" data-testid="text-detail-onsite">
                                On-Site: {durationStr}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">GPS Location</h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <p className="text-sm text-slate-700" data-testid="text-detail-gps">
                        {selectedDelivery.gpsLatitude && selectedDelivery.gpsLongitude
                          ? `${selectedDelivery.gpsLatitude}, ${selectedDelivery.gpsLongitude}`
                          : "No GPS data"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Delivery Notes</h3>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3" data-testid="text-detail-notes">
                      {selectedDelivery.deliveryNotes || "No notes"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Status</h3>
                    <StatusBadge status={selectedDelivery.status} />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Signature</h3>
                    {selectedDelivery.signatureUrl ? (
                      <div className="border border-slate-200 rounded-lg p-2 bg-white">
                        <img
                          src={selectedDelivery.signatureUrl.startsWith("/objects/") ? selectedDelivery.signatureUrl : `/objects/${selectedDelivery.signatureUrl}`}
                          alt="Signature"
                          className="w-full h-32 object-contain"
                          data-testid="img-signature"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex items-center justify-center h-32 text-slate-400 text-sm"><span>Signature on file</span></div>';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <PenTool className="h-4 w-4" />
                        No signature captured
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Photos</h3>
                    {selectedDelivery.photoUrls && selectedDelivery.photoUrls.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {selectedDelivery.photoUrls.map((photo: any, idx: number) => {
                          const photoPath = typeof photo === "string" ? photo : photo.path || photo.objectPath;
                          const imgSrc = photoPath?.startsWith("/objects/") ? photoPath : `/objects/${photoPath}`;
                          return (
                            <DeliveryPhoto key={idx} src={imgSrc} idx={idx} />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Camera className="h-4 w-4" />
                        No photos
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  if (!selectedDelivery) return;
                  window.open(`/api/deliveries/${selectedDelivery.id}/pdf`, '_blank');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                data-testid="button-download-pdf"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              {selectedDelivery?.status === "completed" && (
                <button
                  onClick={() => markInvoicedMutation.mutate({ ids: [selectedDelivery.id], status: "invoiced" })}
                  disabled={markInvoicedMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  data-testid="button-mark-invoiced"
                >
                  {markInvoicedMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Mark as Invoiced
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                data-testid="button-close-modal"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ManagerLayout>
  );
}
