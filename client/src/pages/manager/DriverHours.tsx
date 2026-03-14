import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Clock, AlertTriangle, CheckCircle2, Plus, Timer, TrendingUp, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type DriverHoursSummary = {
  driverId: number;
  driverName: string;
  dailyDriving: { used: number; limit: number; remaining: number };
  weeklyDriving: { used: number; limit: number; remaining: number };
  fortnightlyDriving: { used: number; limit: number; remaining: number };
  weeklyWorking: { used: number; limit: number; remaining: number };
  dailyRest: { taken: number; required: number; compliant: boolean };
  weeklyRest: { taken: number; required: number; compliant: boolean };
  infringements: { type: string; severity: string; description: string; date: string }[];
  status: 'ok' | 'warning' | 'critical';
};

type HoursLog = {
  id: number;
  date: string;
  drivingMinutes: number;
  otherWorkMinutes: number;
  availabilityMinutes: number;
  restMinutes: number;
  breakMinutes: number;
};

export default function DriverHours() {
  const [summaries, setSummaries] = useState<DriverHoursSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<DriverHoursSummary | null>(null);
  const [logs, setLogs] = useState<HoursLog[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [allDrivers, setAllDrivers] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({ driverId: '', date: '', drivingMinutes: '', otherWorkMinutes: '', restMinutes: '', breakMinutes: '' });

  const companyId = session.getCompany()?.id;

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [sumRes, driversRes] = await Promise.all([
        fetch(`/api/driver-hours/summary?companyId=${companyId}`, { credentials: 'include', headers: authHeaders() }),
        fetch(`/api/drivers?companyId=${companyId}`, { credentials: 'include', headers: authHeaders() }),
      ]);
      if (sumRes.ok) setSummaries(await sumRes.json());
      if (driversRes.ok) {
        const d = await driversRes.json();
        setAllDrivers(Array.isArray(d) ? d.map((u: any) => ({ id: u.id, name: u.name })) : []);
      }
    } catch { toast.error('Failed to load driver hours'); }
    setLoading(false);
  }

  async function viewDetail(s: DriverHoursSummary) {
    setSelectedDriver(s);
    try {
      const res = await fetch(`/api/driver-hours/logs/${s.driverId}?days=14`, { credentials: 'include', headers: authHeaders() });
      if (res.ok) setLogs(await res.json());
    } catch { setLogs([]); }
  }

  async function handleSubmit() {
    if (!form.driverId || !form.date || !form.drivingMinutes) {
      toast.error('Fill required fields');
      return;
    }
    try {
      const res = await fetch('/api/driver-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          companyId, driverId: parseInt(form.driverId), date: form.date,
          drivingMinutes: parseInt(form.drivingMinutes) || 0,
          otherWorkMinutes: parseInt(form.otherWorkMinutes) || 0,
          restMinutes: parseInt(form.restMinutes) || 0,
          breakMinutes: parseInt(form.breakMinutes) || 0,
          source: 'manual',
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Hours logged');
      setShowAdd(false);
      setForm({ driverId: '', date: '', drivingMinutes: '', otherWorkMinutes: '', restMinutes: '', breakMinutes: '' });
      fetchData();
    } catch { toast.error('Failed to log hours'); }
  }

  function statusIcon(status: string) {
    switch (status) {
      case 'ok': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'critical': return <ShieldAlert className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  }

  function formatMinutes(m: number) {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    return `${h}h ${mins > 0 ? mins + 'm' : ''}`.trim();
  }

  function usageBar(used: number, limit: number) {
    const pct = Math.min(100, (used / limit) * 100);
    const color = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500';
    return (
      <div className="flex items-center gap-2">
        <div className="w-20 bg-gray-700 rounded-full h-2">
          <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm">{formatMinutes(used)} / {formatMinutes(limit)}</span>
      </div>
    );
  }

  const okCount = summaries.filter(s => s.status === 'ok').length;
  const warnCount = summaries.filter(s => s.status === 'warning').length;
  const critCount = summaries.filter(s => s.status === 'critical').length;
  const totalInfringements = summaries.reduce((sum, s) => sum + (s.infringements?.length || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" data-testid="text-page-title">
            <Timer className="w-7 h-7 text-blue-400" />
            Driver Hours & Working Time
          </h1>
          <p className="text-gray-400 mt-1">EU/UK drivers' hours and Working Time Directive compliance</p>
        </div>
        <Button data-testid="button-log-hours" onClick={() => setShowAdd(true)} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold">
          <Plus className="w-4 h-4 mr-2" />Log Hours
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-gray-400 text-sm">Compliant</div>
            <div className="text-2xl font-bold text-green-400" data-testid="text-ok-count"><CheckCircle2 className="w-5 h-5 inline mr-2" />{okCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-gray-400 text-sm">Warnings</div>
            <div className="text-2xl font-bold text-amber-400" data-testid="text-warn-count"><AlertTriangle className="w-5 h-5 inline mr-2" />{warnCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-gray-400 text-sm">Critical</div>
            <div className="text-2xl font-bold text-red-400" data-testid="text-crit-count"><ShieldAlert className="w-5 h-5 inline mr-2" />{critCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-gray-400 text-sm">Infringements</div>
            <div className="text-2xl font-bold text-red-300" data-testid="text-infringement-count"><TrendingUp className="w-5 h-5 inline mr-2" />{totalInfringements}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Driver Hours Overview</CardTitle>
          <CardDescription className="text-gray-400">Daily 9h (10h twice/week) • Weekly 56h • Fortnightly 90h • WTD 60h/week max</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : summaries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No driver hours data. Log hours to get started.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Driver</TableHead>
                  <TableHead className="text-gray-400">Daily Driving</TableHead>
                  <TableHead className="text-gray-400">Weekly Driving</TableHead>
                  <TableHead className="text-gray-400">Weekly Working</TableHead>
                  <TableHead className="text-gray-400">Infringements</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map(s => (
                  <TableRow key={s.driverId} className="border-gray-700" data-testid={`row-driver-${s.driverId}`}>
                    <TableCell>{statusIcon(s.status)}</TableCell>
                    <TableCell className="text-white font-medium">{s.driverName}</TableCell>
                    <TableCell className="text-white">{usageBar(s.dailyDriving.used, s.dailyDriving.limit)}</TableCell>
                    <TableCell className="text-white">{usageBar(s.weeklyDriving.used, s.weeklyDriving.limit)}</TableCell>
                    <TableCell className="text-white">{usageBar(s.weeklyWorking.used, s.weeklyWorking.limit)}</TableCell>
                    <TableCell>
                      {(s.infringements?.length || 0) > 0 ? (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{s.infringements.length}</Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">None</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button data-testid={`button-detail-${s.driverId}`} variant="ghost" size="sm" onClick={() => viewDetail(s)}>Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedDriver} onOpenChange={() => setSelectedDriver(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDriver?.driverName} — Hours Detail</DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-800 border-gray-600">
                  <CardContent className="p-3">
                    <div className="text-xs text-gray-400">Daily Driving</div>
                    <div className="text-sm text-white">{formatMinutes(selectedDriver.dailyDriving.remaining)} remaining</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-600">
                  <CardContent className="p-3">
                    <div className="text-xs text-gray-400">Weekly Driving</div>
                    <div className="text-sm text-white">{formatMinutes(selectedDriver.weeklyDriving.remaining)} remaining</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-600">
                  <CardContent className="p-3">
                    <div className="text-xs text-gray-400">Fortnightly Driving</div>
                    <div className="text-sm text-white">{formatMinutes(selectedDriver.fortnightlyDriving.remaining)} remaining</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-600">
                  <CardContent className="p-3">
                    <div className="text-xs text-gray-400">Weekly Working (WTD)</div>
                    <div className="text-sm text-white">{formatMinutes(selectedDriver.weeklyWorking.remaining)} remaining</div>
                  </CardContent>
                </Card>
              </div>

              {selectedDriver.infringements?.length > 0 && (
                <Card className="bg-red-900/20 border-red-700">
                  <CardHeader className="py-3">
                    <CardTitle className="text-red-400 text-sm">Infringements</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    {selectedDriver.infringements.map((inf, i) => (
                      <div key={i} className="flex items-center gap-2 py-1 text-sm">
                        <Badge className={inf.severity === 'critical' ? 'bg-red-500/30 text-red-300' : 'bg-amber-500/30 text-amber-300'}>{inf.severity}</Badge>
                        <span className="text-gray-300">{inf.description}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {logs.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Recent Logs (14 days)</h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-400">Date</TableHead>
                        <TableHead className="text-gray-400">Driving</TableHead>
                        <TableHead className="text-gray-400">Other Work</TableHead>
                        <TableHead className="text-gray-400">Rest</TableHead>
                        <TableHead className="text-gray-400">Break</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map(l => (
                        <TableRow key={l.id} className="border-gray-700">
                          <TableCell className="text-white">{new Date(l.date).toLocaleDateString('en-GB')}</TableCell>
                          <TableCell className="text-white">{formatMinutes(l.drivingMinutes)}</TableCell>
                          <TableCell className="text-gray-300">{formatMinutes(l.otherWorkMinutes)}</TableCell>
                          <TableCell className="text-gray-300">{formatMinutes(l.restMinutes)}</TableCell>
                          <TableCell className="text-gray-300">{formatMinutes(l.breakMinutes)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Log Driver Hours</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Driver *</Label>
              <Select value={form.driverId} onValueChange={v => setForm({ ...form, driverId: v })}>
                <SelectTrigger data-testid="select-driver-hours" className="bg-gray-800 border-gray-600"><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  {allDrivers.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400">Date *</Label>
              <Input data-testid="input-hours-date" type="date" className="bg-gray-800 border-gray-600" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Driving (minutes) *</Label>
                <Input data-testid="input-driving-min" type="number" className="bg-gray-800 border-gray-600" value={form.drivingMinutes} onChange={e => setForm({ ...form, drivingMinutes: e.target.value })} />
              </div>
              <div>
                <Label className="text-gray-400">Other Work (minutes)</Label>
                <Input data-testid="input-other-work-min" type="number" className="bg-gray-800 border-gray-600" value={form.otherWorkMinutes} onChange={e => setForm({ ...form, otherWorkMinutes: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Rest (minutes)</Label>
                <Input data-testid="input-rest-min" type="number" className="bg-gray-800 border-gray-600" value={form.restMinutes} onChange={e => setForm({ ...form, restMinutes: e.target.value })} />
              </div>
              <div>
                <Label className="text-gray-400">Break (minutes)</Label>
                <Input data-testid="input-break-min" type="number" className="bg-gray-800 border-gray-600" value={form.breakMinutes} onChange={e => setForm({ ...form, breakMinutes: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button data-testid="button-cancel-hours" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button data-testid="button-submit-hours" onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600 text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
