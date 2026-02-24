import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, Download, CheckCircle2, AlertTriangle, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type AuditLog = {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  entity: string;
  entityId: number | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
  currentHash: string;
  previousHash: string | null;
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [integrityStatus, setIntegrityStatus] = useState<{
    valid: boolean;
    totalEntries: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    fetchAuditLogs();
    verifyIntegrity();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, selectedAction, selectedEntity]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const companyId = localStorage.getItem('companyId');
      const response = await fetch(`/api/audit-logs?companyId=${companyId}`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const verifyIntegrity = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      const response = await fetch(`/api/audit-logs/verify?companyId=${companyId}`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        setIntegrityStatus(data);
        if (!data.valid) {
          toast.error('Audit log tampering detected!', {
            description: `${data.errors.length} integrity violations found`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to verify audit log integrity:', error);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ipAddress?.includes(searchQuery)
      );
    }

    // Action filter
    if (selectedAction !== 'ALL') {
      filtered = filtered.filter(log => log.action === selectedAction);
    }

    // Entity filter
    if (selectedEntity !== 'ALL') {
      filtered = filtered.filter(log => log.entity === selectedEntity);
    }

    setFilteredLogs(filtered);
  };

  const handleExport = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      const response = await fetch(`/api/audit-logs/export?companyId=${companyId}`, { headers: authHeaders() });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Audit logs exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export audit logs');
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-500',
      UPDATE: 'bg-blue-500',
      DELETE: 'bg-red-500',
      LOGIN: 'bg-purple-500',
      LOGOUT: 'bg-gray-500',
      VIEW: 'bg-cyan-500',
      EXPORT: 'bg-orange-500',
      ASSIGN: 'bg-yellow-500',
      VERIFY: 'bg-indigo-500',
      APPROVE: 'bg-pink-500',
    };
    return <Badge className={colors[action] || 'bg-gray-500'}>{action}</Badge>;
  };

  const uniqueActions = Array.from(new Set(logs.map(log => log.action))).sort();
  const uniqueEntities = Array.from(new Set(logs.map(log => log.entity))).sort();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Immutable activity trail with hash chaining</p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Integrity Status */}
      {integrityStatus && (
        <Card className={integrityStatus.valid ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {integrityStatus.valid ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Audit Log Integrity: Valid
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Audit Log Integrity: COMPROMISED
                </>
              )}
            </CardTitle>
            <CardDescription>
              {integrityStatus.valid ? (
                `All ${integrityStatus.totalEntries} audit log entries verified. No tampering detected.`
              ) : (
                `${integrityStatus.errors.length} integrity violations detected in ${integrityStatus.totalEntries} entries.`
              )}
            </CardDescription>
          </CardHeader>
          {!integrityStatus.valid && integrityStatus.errors.length > 0 && (
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="font-semibold text-red-900 mb-2">Integrity Violations:</p>
                <ul className="text-sm text-red-800 space-y-1">
                  {integrityStatus.errors.slice(0, 5).map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                  {integrityStatus.errors.length > 5 && (
                    <li>• ... and {integrityStatus.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>Complete audit trail of all system activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by user, action, entity, or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedEntity} onValueChange={setSelectedEntity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Entities</SelectItem>
                {uniqueEntities.map(entity => (
                  <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{log.userName || 'System'}</TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.entity}
                        {log.entityId && ` #${log.entityId}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {log.details && (
                        <details className="cursor-pointer">
                          <summary className="text-sm text-blue-600 hover:underline">
                            View details
                          </summary>
                          <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.ipAddress || '-'}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-gray-500" title={log.currentHash}>
                        {log.currentHash.substring(0, 8)}...
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Info */}
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {filteredLogs.length} of {logs.length} entries
          </div>
        </CardContent>
      </Card>

      {/* Hash Chaining Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Immutable Audit Trail
          </CardTitle>
          <CardDescription>
            How hash chaining ensures tamper-proof compliance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>Hash Chaining:</strong> Each audit log entry contains a SHA-256 hash of the previous entry,
              creating a blockchain-like chain. Any attempt to modify historical records will break the chain
              and be immediately detected.
            </p>
            <p>
              <strong>Tamper Detection:</strong> The system continuously verifies the integrity of the audit log
              by recalculating hashes and comparing them to stored values. If tampering is detected, an alert
              is displayed and the specific compromised entries are identified.
            </p>
            <p>
              <strong>DVSA Compliance:</strong> This immutable audit trail meets regulatory requirements for
              fleet management systems, providing undeniable proof of all system activities for compliance audits.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
