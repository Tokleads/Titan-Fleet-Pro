import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DriverLayout } from "@/components/layout/AppShell";
import { session } from "@/lib/session";
import { useLocation } from "wouter";
import { Package, ChevronRight, ChevronDown, MapPin, Camera, PenTool, Clock, FileText, Loader2, CheckCircle } from "lucide-react";

interface Delivery {
  id: number;
  customerName: string;
  deliveryAddress?: string;
  referenceNumber?: string;
  deliveryNotes?: string;
  status: string;
  gpsLatitude?: string;
  gpsLongitude?: string;
  photoUrls?: string[];
  signatureUrl?: string;
  completedAt?: string;
  createdAt?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = days[d.getDay()];
  const date = d.getDate();
  const month = months[d.getMonth()];
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${day} ${date} ${month}, ${hours}:${mins}`;
}

export default function DriverDeliveries() {
  const [, setLocation] = useLocation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const user = session.getUser();
  const company = session.getCompany();

  const { data: deliveriesData, isLoading } = useQuery<{ deliveries: Delivery[]; total: number }>({
    queryKey: ["driver-deliveries", company?.id, user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/deliveries/driver?companyId=${company?.id}&driverId=${user?.id}&limit=30&offset=0`);
      if (!res.ok) throw new Error("Failed to fetch deliveries");
      return res.json();
    },
    enabled: !!company?.id && !!user?.id,
  });

  const deliveries = deliveriesData?.deliveries || [];

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <DriverLayout>
      <div className="space-y-4 pb-24">
        <div className="space-y-1">
          <h1 className="titan-title" data-testid="text-deliveries-title">My Deliveries</h1>
          <p className="titan-helper" data-testid="text-deliveries-subtitle">Your completed delivery records</p>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3" data-testid="loading-deliveries">
            <Loader2 className="h-8 w-8 text-[#5B6CFF] animate-spin" />
            <p className="text-sm text-slate-500">Loading deliveries...</p>
          </div>
        )}

        {!isLoading && (!deliveries || deliveries.length === 0) && (
          <div className="titan-card p-8 flex flex-col items-center gap-4 text-center" data-testid="empty-deliveries">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 grid place-items-center">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">No deliveries yet</p>
              <p className="text-sm text-slate-500">Complete your first delivery from the dashboard.</p>
            </div>
          </div>
        )}

        {!isLoading && deliveries && deliveries.length > 0 && (
          <div className="space-y-3" data-testid="deliveries-list">
            {deliveries.map((delivery) => {
              const isExpanded = expandedId === delivery.id;
              return (
                <div key={delivery.id} className="titan-card overflow-hidden" data-testid={`card-delivery-${delivery.id}`}>
                  <button
                    type="button"
                    className="w-full p-4 flex items-center gap-3 text-left"
                    onClick={() => toggleExpand(delivery.id)}
                    data-testid={`button-toggle-delivery-${delivery.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate" data-testid={`text-customer-${delivery.id}`}>
                        {delivery.customerName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5" data-testid={`text-date-${delivery.id}`}>
                        {formatDate(delivery.completedAt || delivery.createdAt || "")}
                      </p>
                      {delivery.referenceNumber && (
                        <p className="text-[11px] text-slate-400 mt-0.5" data-testid={`text-ref-${delivery.id}`}>
                          Ref: {delivery.referenceNumber}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${
                          delivery.status === "completed"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : delivery.status === "invoiced"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-50 text-slate-600 border border-slate-200"
                        }`}
                        data-testid={`badge-status-${delivery.id}`}
                      >
                        {delivery.status}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-3" data-testid={`detail-delivery-${delivery.id}`}>
                      <div className="pt-3 space-y-2">
                        <DetailRow icon={<Package className="h-4 w-4" />} label="Customer" value={delivery.customerName} />
                        {delivery.deliveryAddress && (
                          <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address" value={delivery.deliveryAddress} />
                        )}
                        {delivery.referenceNumber && (
                          <DetailRow icon={<FileText className="h-4 w-4" />} label="Reference" value={delivery.referenceNumber} />
                        )}
                        {delivery.deliveryNotes && (
                          <DetailRow icon={<FileText className="h-4 w-4" />} label="Notes" value={delivery.deliveryNotes} />
                        )}
                        {(delivery.gpsLatitude && delivery.gpsLongitude) && (
                          <DetailRow icon={<MapPin className="h-4 w-4" />} label="GPS Location" value={`${delivery.gpsLatitude}, ${delivery.gpsLongitude}`} />
                        )}
                        <DetailRow
                          icon={<Camera className="h-4 w-4" />}
                          label="Photos"
                          value={`${delivery.photoUrls?.length || 0} attached`}
                        />
                        <DetailRow
                          icon={<PenTool className="h-4 w-4" />}
                          label="Signature"
                          value={
                            delivery.signatureUrl ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3.5 w-3.5" /> Signed
                              </span>
                            ) : (
                              <span className="text-slate-400">Not signed</span>
                            )
                          }
                        />
                        {(delivery.completedAt || delivery.createdAt) && (
                          <DetailRow
                            icon={<Clock className="h-4 w-4" />}
                            label="Completed"
                            value={formatDate(delivery.completedAt || delivery.createdAt || "")}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DriverLayout>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
      <span className="text-slate-500 shrink-0 w-20">{label}</span>
      <span className="text-slate-900 font-medium flex-1">{value}</span>
    </div>
  );
}
