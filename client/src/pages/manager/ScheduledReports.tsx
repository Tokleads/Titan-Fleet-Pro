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
import { Mail, Plus, Trash2, ToggleLeft, ToggleRight, CalendarClock, FileBarChart } from 'lucide-react';
import { toast } from 'sonner';
import { session } from "@/lib/session";
import { Switch } from '@/components/ui/switch';

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type ScheduledReport = {
  id: number;
  reportType: string;
  frequency: string;
  dayOfWeek: number;
  recipients: string[];
  enabled: boolean;
  lastSent: string | null;
  createdAt: string;
};

type ReportType = { name: string; description: string };

export default function ScheduledReports() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [reportTypes, setReportTypes] = useState<Record<string, ReportType>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ reportType: '', frequency: 'weekly', dayOfWeek: '1', recipients: '' });

  const companyId = session.getCompany()?.id;
  const userId = session.getUser()?.id;

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [reportsRes, typesRes] = await Promise.all([
        fetch(`/api/scheduled-reports?companyId=${companyId}`, { credentials: 'include', headers: authHeaders() }),
        fetch('/api/scheduled-reports/types', { credentials: 'include', headers: authHeaders() }),
      ]);
      if (reportsRes.ok) setReports(await reportsRes.json());
      if (typesRes.ok) setReportTypes(await typesRes.json());
    } catch { toast.error('Failed to load scheduled reports'); }
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.reportType || !form.recipients.trim()) {
      toast.error('Select a report type and add recipients');
      return;
    }
    const recipientList = form.recipients.split(',').map(e => e.trim()).filter(Boolean);
    if (recipientList.some(e => !e.includes('@'))) {
      toast.error('Enter valid email addresses separated by commas');
      return;
    }
    try {
      const res = await fetch('/api/scheduled-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          companyId, reportType: form.reportType, frequency: form.frequency,
          dayOfWeek: parseInt(form.dayOfWeek), recipients: recipientList, createdBy: userId,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Scheduled report created');
      setShowAdd(false);
      setForm({ reportType: '', frequency: 'weekly', dayOfWeek: '1', recipients: '' });
      fetchData();
    } catch { toast.error('Failed to create scheduled report'); }
  }

  async function toggleEnabled(report: ScheduledReport) {
    try {
      await fetch(`/api/scheduled-reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({ enabled: !report.enabled }),
      });
      fetchData();
    } catch { toast.error('Failed to update report'); }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(`/api/scheduled-reports/${id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      toast.success('Deleted');
      fetchData();
    } catch { toast.error('Failed to delete'); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" data-testid="text-page-title">
            <CalendarClock className="w-7 h-7 text-purple-400" />
            Scheduled Report Emails
          </h1>
          <p className="text-gray-300 mt-1">Configure automated report delivery to your team via email</p>
        </div>
        <Button data-testid="button-add-schedule" onClick={() => setShowAdd(true)} className="bg-purple-500 hover:bg-purple-600 text-white font-semibold">
          <Plus className="w-4 h-4 mr-2" />New Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="text-gray-300 text-sm">Active Schedules</div>
            <div className="text-2xl font-bold text-green-400" data-testid="text-active-count">
              <FileBarChart className="w-5 h-5 inline mr-2" />{reports.filter(r => r.enabled).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="text-gray-300 text-sm">Total Schedules</div>
            <div className="text-2xl font-bold text-white" data-testid="text-total-count">
              <Mail className="w-5 h-5 inline mr-2" />{reports.length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="text-gray-300 text-sm">Report Types Available</div>
            <div className="text-2xl font-bold text-purple-400" data-testid="text-types-count">
              {Object.keys(reportTypes).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Configured Report Schedules</CardTitle>
          <CardDescription className="text-gray-300">Reports are generated and emailed automatically at 7:00 AM on the scheduled day</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-300">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-300">No scheduled reports configured yet. Create one to get started.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Report</TableHead>
                  <TableHead className="text-gray-300">Frequency</TableHead>
                  <TableHead className="text-gray-300">Day</TableHead>
                  <TableHead className="text-gray-300">Recipients</TableHead>
                  <TableHead className="text-gray-300">Last Sent</TableHead>
                  <TableHead className="text-gray-300">Enabled</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map(r => (
                  <TableRow key={r.id} className="border-gray-700" data-testid={`row-report-${r.id}`}>
                    <TableCell className="text-white font-medium">{reportTypes[r.reportType]?.name || r.reportType}</TableCell>
                    <TableCell><Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">{r.frequency}</Badge></TableCell>
                    <TableCell className="text-gray-300">{DAYS[r.dayOfWeek] || '-'}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{r.recipients.join(', ')}</TableCell>
                    <TableCell className="text-gray-300">{r.lastSent ? new Date(r.lastSent).toLocaleDateString('en-GB') : 'Never'}</TableCell>
                    <TableCell>
                      <Switch
                        data-testid={`switch-enabled-${r.id}`}
                        checked={r.enabled}
                        onCheckedChange={() => toggleEnabled(r)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button data-testid={`button-delete-${r.id}`} variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300">
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

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule a Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Report Type *</Label>
              <Select value={form.reportType} onValueChange={v => setForm({ ...form, reportType: v })}>
                <SelectTrigger data-testid="select-report-type" className="bg-gray-800 border-gray-600"><SelectValue placeholder="Select report" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(reportTypes).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.reportType && reportTypes[form.reportType] && (
                <p className="text-xs text-gray-400 mt-1">{reportTypes[form.reportType].description}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Frequency</Label>
                <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
                  <SelectTrigger data-testid="select-frequency" className="bg-gray-800 border-gray-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Day of Week</Label>
                <Select value={form.dayOfWeek} onValueChange={v => setForm({ ...form, dayOfWeek: v })}>
                  <SelectTrigger data-testid="select-day" className="bg-gray-800 border-gray-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Recipients (comma-separated emails) *</Label>
              <Input data-testid="input-recipients" className="bg-gray-800 border-gray-600" placeholder="manager@company.com, ops@company.com" value={form.recipients} onChange={e => setForm({ ...form, recipients: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button data-testid="button-cancel-schedule" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button data-testid="button-create-schedule" onClick={handleCreate} className="bg-purple-500 hover:bg-purple-600 text-white">Create Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
