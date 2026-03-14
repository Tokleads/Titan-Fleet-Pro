import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { GraduationCap, Plus, AlertTriangle, CheckCircle2, Clock, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type DriverSummary = {
  driverId: number;
  driverName: string;
  totalHours: number;
  remainingHours: number;
  cpcExpiryDate: string | null;
  status: 'compliant' | 'expiring' | 'expired' | 'in_progress';
  recordCount: number;
};

type CPCRecord = {
  id: number;
  driverId: number;
  trainingDate: string;
  hours: number;
  provider: string;
  courseTitle: string | null;
  certificateRef: string | null;
  cpcExpiryDate: string | null;
  notes: string | null;
};

type Stats = { total: number; compliant: number; expiring: number; expired: number };

export default function DriverCPC() {
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [records, setRecords] = useState<CPCRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, compliant: 0, expiring: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [view, setView] = useState<'summary' | 'records'>('summary');
  const [allDrivers, setAllDrivers] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({ driverId: '', trainingDate: '', hours: '', provider: '', courseTitle: '', certificateRef: '', cpcExpiryDate: '', notes: '' });

  const companyId = session.getCompany()?.id;

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [summaryRes, recordsRes, driversRes] = await Promise.all([
        fetch(`/api/cpc/summary?companyId=${companyId}`, { credentials: 'include', headers: authHeaders() }),
        fetch(`/api/cpc/records?companyId=${companyId}`, { credentials: 'include', headers: authHeaders() }),
        fetch(`/api/drivers?companyId=${companyId}`, { credentials: 'include', headers: authHeaders() }),
      ]);
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setDrivers(data.drivers || []);
        setStats(data.stats || { total: 0, compliant: 0, expiring: 0, expired: 0 });
      }
      if (recordsRes.ok) setRecords(await recordsRes.json());
      if (driversRes.ok) {
        const d = await driversRes.json();
        setAllDrivers(Array.isArray(d) ? d.map((u: any) => ({ id: u.id, name: u.name })) : []);
      }
    } catch { toast.error('Failed to load CPC data'); }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!form.driverId || !form.trainingDate || !form.hours || !form.provider) {
      toast.error('Fill in all required fields');
      return;
    }
    try {
      const res = await fetch('/api/cpc/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({ companyId, driverId: parseInt(form.driverId), trainingDate: form.trainingDate, hours: parseFloat(form.hours), provider: form.provider, courseTitle: form.courseTitle || null, certificateRef: form.certificateRef || null, cpcExpiryDate: form.cpcExpiryDate || null, notes: form.notes || null }),
      });
      if (!res.ok) throw new Error();
      toast.success('CPC record added');
      setShowAdd(false);
      setForm({ driverId: '', trainingDate: '', hours: '', provider: '', courseTitle: '', certificateRef: '', cpcExpiryDate: '', notes: '' });
      fetchData();
    } catch { toast.error('Failed to add CPC record'); }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(`/api/cpc/records/${id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      toast.success('Record deleted');
      fetchData();
    } catch { toast.error('Failed to delete'); }
  }

  function statusBadge(status: string) {
    switch (status) {
      case 'compliant': return <Badge data-testid={`badge-status-compliant`} className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Compliant</Badge>;
      case 'expiring': return <Badge data-testid={`badge-status-expiring`} className="bg-amber-500/20 text-amber-400 border-amber-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Expiring Soon</Badge>;
      case 'expired': return <Badge data-testid={`badge-status-expired`} className="bg-red-500/20 text-red-400 border-red-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
      default: return <Badge data-testid={`badge-status-progress`} className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
    }
  }

  const filteredRecords = selectedDriver ? records.filter(r => r.driverId === selectedDriver) : records;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" data-testid="text-page-title">
            <GraduationCap className="w-7 h-7 text-amber-400" />
            Driver CPC Tracking
          </h1>
          <p className="text-gray-400 mt-1">Monitor Certificate of Professional Competence status across your fleet</p>
        </div>
        <Button data-testid="button-add-cpc" onClick={() => setShowAdd(true)} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />Add CPC Record
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-gray-400 text-sm">Total Drivers</div>
            <div className="text-2xl font-bold text-white" data-testid="text-total-drivers"><Users className="w-5 h-5 inline mr-2 text-blue-400" />{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-gray-400 text-sm">Compliant</div>
            <div className="text-2xl font-bold text-green-400" data-testid="text-compliant-count"><CheckCircle2 className="w-5 h-5 inline mr-2" />{stats.compliant}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-gray-400 text-sm">Expiring (90 days)</div>
            <div className="text-2xl font-bold text-amber-400" data-testid="text-expiring-count"><AlertTriangle className="w-5 h-5 inline mr-2" />{stats.expiring}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-gray-400 text-sm">Expired</div>
            <div className="text-2xl font-bold text-red-400" data-testid="text-expired-count"><AlertTriangle className="w-5 h-5 inline mr-2" />{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button data-testid="button-view-summary" variant={view === 'summary' ? 'default' : 'outline'} onClick={() => setView('summary')} size="sm">Summary</Button>
        <Button data-testid="button-view-records" variant={view === 'records' ? 'default' : 'outline'} onClick={() => setView('records')} size="sm">Training Records</Button>
      </div>

      {view === 'summary' && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Driver CPC Status</CardTitle>
            <CardDescription className="text-gray-400">35 hours of periodic training required every 5 years</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No drivers found. Add CPC training records to get started.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Driver</TableHead>
                    <TableHead className="text-gray-400">Hours Completed</TableHead>
                    <TableHead className="text-gray-400">Remaining</TableHead>
                    <TableHead className="text-gray-400">CPC Expiry</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map(d => (
                    <TableRow key={d.driverId} className="border-gray-700" data-testid={`row-driver-${d.driverId}`}>
                      <TableCell className="text-white font-medium">{d.driverName}</TableCell>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${Math.min(100, (d.totalHours / 35) * 100)}%` }} />
                          </div>
                          <span>{d.totalHours}h / 35h</span>
                        </div>
                      </TableCell>
                      <TableCell className={d.remainingHours > 0 ? 'text-amber-400' : 'text-green-400'}>{d.remainingHours}h</TableCell>
                      <TableCell className="text-white">{d.cpcExpiryDate ? new Date(d.cpcExpiryDate).toLocaleDateString('en-GB') : 'Not set'}</TableCell>
                      <TableCell>{statusBadge(d.status)}</TableCell>
                      <TableCell>
                        <Button data-testid={`button-view-records-${d.driverId}`} variant="ghost" size="sm" onClick={() => { setSelectedDriver(d.driverId); setView('records'); }}>
                          View Records
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {view === 'records' && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Training Records</CardTitle>
                <CardDescription className="text-gray-400">
                  {selectedDriver ? `Showing records for ${drivers.find(d => d.driverId === selectedDriver)?.driverName || 'driver'}` : 'All drivers'}
                </CardDescription>
              </div>
              {selectedDriver && (
                <Button data-testid="button-clear-filter" variant="outline" size="sm" onClick={() => setSelectedDriver(null)}>Show All</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No training records found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400">Course</TableHead>
                    <TableHead className="text-gray-400">Provider</TableHead>
                    <TableHead className="text-gray-400">Hours</TableHead>
                    <TableHead className="text-gray-400">Certificate</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map(r => (
                    <TableRow key={r.id} className="border-gray-700" data-testid={`row-record-${r.id}`}>
                      <TableCell className="text-white">{new Date(r.trainingDate).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell className="text-white">{r.courseTitle || '-'}</TableCell>
                      <TableCell className="text-gray-300">{r.provider}</TableCell>
                      <TableCell className="text-amber-400 font-semibold">{r.hours}h</TableCell>
                      <TableCell className="text-gray-300">{r.certificateRef || '-'}</TableCell>
                      <TableCell>
                        <Button data-testid={`button-delete-record-${r.id}`} variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Add CPC Training Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Driver *</Label>
              <Select value={form.driverId} onValueChange={v => setForm({ ...form, driverId: v })}>
                <SelectTrigger data-testid="select-driver" className="bg-gray-800 border-gray-600"><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  {allDrivers.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Training Date *</Label>
                <Input data-testid="input-training-date" type="date" className="bg-gray-800 border-gray-600" value={form.trainingDate} onChange={e => setForm({ ...form, trainingDate: e.target.value })} />
              </div>
              <div>
                <Label className="text-gray-400">Hours *</Label>
                <Input data-testid="input-hours" type="number" step="0.5" min="0" max="7" className="bg-gray-800 border-gray-600" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Training Provider *</Label>
              <Input data-testid="input-provider" className="bg-gray-800 border-gray-600" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} />
            </div>
            <div>
              <Label className="text-gray-400">Course Title</Label>
              <Input data-testid="input-course-title" className="bg-gray-800 border-gray-600" value={form.courseTitle} onChange={e => setForm({ ...form, courseTitle: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Certificate Ref</Label>
                <Input data-testid="input-cert-ref" className="bg-gray-800 border-gray-600" value={form.certificateRef} onChange={e => setForm({ ...form, certificateRef: e.target.value })} />
              </div>
              <div>
                <Label className="text-gray-400">CPC Expiry Date</Label>
                <Input data-testid="input-expiry-date" type="date" className="bg-gray-800 border-gray-600" value={form.cpcExpiryDate} onChange={e => setForm({ ...form, cpcExpiryDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button data-testid="button-cancel-add" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button data-testid="button-submit-cpc" onClick={handleSubmit} className="bg-amber-500 hover:bg-amber-600 text-black">Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
