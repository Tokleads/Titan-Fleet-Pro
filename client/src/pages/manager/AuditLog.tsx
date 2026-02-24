import { ManagerLayout } from "./ManagerLayout";
import { TitanCard, TitanCardContent, TitanCardHeader } from "@/components/titan-ui/Card";
import { TitanButton } from "@/components/titan-ui/Button";
import { session } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import { ClipboardList, Download, Filter, ChevronLeft, ChevronRight, User, Clock, FileText } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { VehicleDetailModal } from "@/components/VehicleDetailModal";

interface AuditLogEntry {
  id: number;
  companyId: number;
  userId: number | null;
  userName: string;
  action: string;
  entity: string;
  entityId: number | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  'LOGIN': { label: 'Logged in', color: 'bg-green-100 text-green-700' },
  'LOGOUT': { label: 'Logged out', color: 'bg-gray-100 text-gray-700' },
  'CREATE': { label: 'Created', color: 'bg-blue-100 text-blue-700' },
  'UPDATE': { label: 'Updated', color: 'bg-amber-100 text-amber-700' },
  'DELETE': { label: 'Deleted', color: 'bg-red-100 text-red-700' },
  'VIEW': { label: 'Viewed', color: 'bg-purple-100 text-purple-700' },
  'EXPORT': { label: 'Exported', color: 'bg-indigo-100 text-indigo-700' },
};

const entityLabels: Record<string, string> = {
  'USER': 'User',
  'VEHICLE': 'Vehicle',
  'INSPECTION': 'Inspection',
  'DEFECT': 'Defect',
  'FUEL': 'Fuel Entry',
  'SETTINGS': 'Settings',
  'SESSION': 'Session',
  'TRAILER': 'Trailer',
  'DOCUMENT': 'Document',
};

export default function AuditLog() {
  const company = session.getCompany();
  const companyId = company?.id;
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const limit = 25;

  const { data: allVehiclesData } = useQuery({
    queryKey: ["all-vehicles-lookup", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles?companyId=${companyId}`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!companyId,
  });
  const vrmToIdMap = new Map(((allVehiclesData as any)?.vehicles || (Array.isArray(allVehiclesData) ? allVehiclesData : [])).map((v: any) => [v.vrm, v.id]));

  const { data, isLoading } = useQuery<AuditLogsResponse>({
    queryKey: ['auditLogs', company?.id, page, entityFilter, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      if (entityFilter) params.append('entity', entityFilter);
      if (actionFilter) params.append('action', actionFilter);
      
      const res = await fetch(`/api/manager/audit-logs/${company?.id}?${params}`, { headers: authHeaders() });
      return res.json();
    },
    enabled: !!company?.id,
  });

  const handleExport = () => {
    const params = new URLSearchParams();
    if (entityFilter) params.append('entity', entityFilter);
    if (actionFilter) params.append('action', actionFilter);
    window.open(`/api/manager/audit-logs/${company?.id}/export?${params}`, '_blank');
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <ManagerLayout>
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Audit Log</h1>
            <p className="text-muted-foreground">Track all system activity and changes.</p>
          </div>
          <TitanButton onClick={handleExport} variant="outline" data-testid="button-export-audit">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </TitanButton>
        </div>

        <TitanCard>
          <TitanCardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Activity History</h2>
                  <p className="text-sm text-muted-foreground">{data?.total || 0} total entries</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={entityFilter}
                    onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }}
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
                    data-testid="select-entity-filter"
                  >
                    <option value="">All Entities</option>
                    <option value="SESSION">Sessions</option>
                    <option value="VEHICLE">Vehicles</option>
                    <option value="DEFECT">Defects</option>
                    <option value="INSPECTION">Inspections</option>
                    <option value="SETTINGS">Settings</option>
                    <option value="USER">Users</option>
                  </select>
                  <select
                    value={actionFilter}
                    onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                    className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
                    data-testid="select-action-filter"
                  >
                    <option value="">All Actions</option>
                    <option value="LOGIN">Login</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="EXPORT">Export</option>
                  </select>
                </div>
              </div>
            </div>
          </TitanCardHeader>
          <TitanCardContent>
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">Loading audit logs...</div>
            ) : !data?.logs?.length ? (
              <div className="py-12 text-center text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No audit log entries yet.</p>
                <p className="text-sm">Activity will appear here as users interact with the system.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-xl border border-border bg-background hover:bg-secondary/30 transition-colors"
                    data-testid={`audit-log-entry-${log.id}`}
                  >
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{log.userName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionLabels[log.action]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {actionLabels[log.action]?.label || log.action}
                        </span>
                        <span className="text-muted-foreground">{entityLabels[log.entity] || log.entity}</span>
                        {log.entityId && (
                          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                            #{log.entityId}
                          </span>
                        )}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {(log.details as Record<string, string>).vrm && <span className="mr-3">VRM: <button
                            onClick={(e) => { e.stopPropagation(); const id = vrmToIdMap.get((log.details as Record<string, string>).vrm); if (id) setSelectedVehicleId(id); }}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
                          >{(log.details as Record<string, string>).vrm}</button></span>}
                          {(log.details as Record<string, string>).managerName && <span className="mr-3">{(log.details as Record<string, string>).managerName}</span>}
                          {(log.details as Record<string, string>).status && <span>Status: {(log.details as Record<string, string>).status}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm:ss')}
                        </span>
                        {log.ipAddress && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {log.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <TitanButton
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </TitanButton>
                  <TitanButton
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages - 1}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </TitanButton>
                </div>
              </div>
            )}
          </TitanCardContent>
        </TitanCard>
      </div>
      {selectedVehicleId && (
        <VehicleDetailModal vehicleId={selectedVehicleId} onClose={() => setSelectedVehicleId(null)} />
      )}
    </ManagerLayout>
  );
}
