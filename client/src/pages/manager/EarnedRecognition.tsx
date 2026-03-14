import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Shield, Award, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Download, Star } from 'lucide-react';
import { toast } from 'sonner';
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type ForsRequirement = {
  id: string;
  category: string;
  requirement: string;
  status: 'met' | 'partial' | 'not_met';
  evidence: string;
  forsLevel: 'bronze' | 'silver' | 'gold';
};

type ERData = {
  companyId: number;
  period: string;
  kpis: {
    motFirstTimePassRate: number;
    inspectionCompletionRate: number;
    defectResolutionHours: number;
    driverCpcComplianceRate: number;
    overallScore: number;
  };
  forsReadiness: {
    level: 'none' | 'bronze' | 'silver' | 'gold';
    score: number;
    requirements: ForsRequirement[];
  };
  evidenceSummary: {
    totalVehicles: number;
    totalDrivers: number;
    inspectionsLast12Months: number;
    defectsReported: number;
    defectsResolved: number;
    averageResolutionHours: number;
    cpcCompliantDrivers: number;
    totalActiveDrivers: number;
  };
};

type KPIDisplay = {
  name: string;
  target: string;
  actual: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
};

function buildKPIDisplayList(kpis: ERData['kpis']): KPIDisplay[] {
  return [
    {
      name: 'MOT First-Time Pass Rate',
      target: '≥ 90%',
      actual: `${kpis.motFirstTimePassRate}%`,
      status: kpis.motFirstTimePassRate >= 90 ? 'pass' : kpis.motFirstTimePassRate >= 80 ? 'warning' : 'fail',
      description: 'Percentage of vehicles passing MOT on first attempt',
    },
    {
      name: 'Inspection Completion Rate',
      target: '≥ 95%',
      actual: `${kpis.inspectionCompletionRate}%`,
      status: kpis.inspectionCompletionRate >= 95 ? 'pass' : kpis.inspectionCompletionRate >= 85 ? 'warning' : 'fail',
      description: 'Percentage of required daily inspections completed',
    },
    {
      name: 'Defect Resolution Time',
      target: '≤ 48h',
      actual: `${kpis.defectResolutionHours}h`,
      status: kpis.defectResolutionHours <= 48 ? 'pass' : kpis.defectResolutionHours <= 72 ? 'warning' : 'fail',
      description: 'Average time to resolve reported defects',
    },
    {
      name: 'Driver CPC Compliance',
      target: '100%',
      actual: `${kpis.driverCpcComplianceRate}%`,
      status: kpis.driverCpcComplianceRate >= 100 ? 'pass' : kpis.driverCpcComplianceRate >= 90 ? 'warning' : 'fail',
      description: 'Percentage of drivers with valid CPC qualification',
    },
  ];
}

export default function EarnedRecognition() {
  const [data, setData] = useState<ERData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'kpis' | 'fors'>('overview');

  const companyId = session.getCompany()?.id;

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/earned-recognition?companyId=${companyId}`, { credentials: 'include', headers: authHeaders() });
      if (res.ok) setData(await res.json());
    } catch { toast.error('Failed to load earned recognition data'); }
    setLoading(false);
  }

  function scoreColor(score: number) {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  }

  function forsLevelBadge(level: string) {
    switch (level) {
      case 'gold': return <Badge data-testid="badge-fors-level" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-lg px-3 py-1"><Star className="w-4 h-4 mr-1" />FORS Gold</Badge>;
      case 'silver': return <Badge data-testid="badge-fors-level" className="bg-gray-300/20 text-gray-300 border-gray-300/30 text-lg px-3 py-1"><Award className="w-4 h-4 mr-1" />FORS Silver</Badge>;
      case 'bronze': return <Badge data-testid="badge-fors-level" className="bg-amber-700/20 text-amber-600 border-amber-700/30 text-lg px-3 py-1"><Award className="w-4 h-4 mr-1" />FORS Bronze</Badge>;
      default: return <Badge data-testid="badge-fors-level" className="bg-gray-600/20 text-gray-400 border-gray-600/30 text-lg px-3 py-1">Not Assessed</Badge>;
    }
  }

  function kpiStatusBadge(status: string) {
    switch (status) {
      case 'pass': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Pass</Badge>;
      case 'warning': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      default: return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Fail</Badge>;
    }
  }

  function forsStatusIcon(status: string) {
    switch (status) {
      case 'met': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'partial': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default: return <XCircle className="w-5 h-5 text-red-400" />;
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Loading earned recognition data...</div>;
  }

  if (!data) {
    return <div className="p-6 text-center text-gray-400">Unable to load data. Please try again.</div>;
  }

  const kpiList = buildKPIDisplayList(data.kpis);
  const passedKPIs = kpiList.filter(k => k.status === 'pass').length;
  const reqs = data.forsReadiness.requirements;
  const metCount = reqs.filter(r => r.status === 'met').length;

  const ersStatus = data.kpis.overallScore >= 80 ? 'eligible' : data.kpis.overallScore >= 60 ? 'at_risk' : 'not_eligible';

  function ersStatusBadge(status: string) {
    switch (status) {
      case 'eligible': return <Badge data-testid="badge-ers-status" className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-3 py-1"><CheckCircle2 className="w-4 h-4 mr-1" />Eligible</Badge>;
      case 'at_risk': return <Badge data-testid="badge-ers-status" className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-lg px-3 py-1"><AlertTriangle className="w-4 h-4 mr-1" />At Risk</Badge>;
      default: return <Badge data-testid="badge-ers-status" className="bg-red-500/20 text-red-400 border-red-500/30 text-lg px-3 py-1"><XCircle className="w-4 h-4 mr-1" />Not Eligible</Badge>;
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" data-testid="text-page-title">
            <Shield className="w-7 h-7 text-green-400" />
            FORS & Earned Recognition
          </h1>
          <p className="text-gray-400 mt-1">DVSA Earned Recognition Scheme & FORS accreditation readiness — Period: {data.period}</p>
        </div>
        <Button data-testid="button-export-evidence" className="bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={() => toast.info('Evidence pack PDF export coming soon')}>
          <Download className="w-4 h-4 mr-2" />Export Evidence Pack
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-gray-400 text-sm mb-2">Compliance Score</div>
            <div className={`text-4xl font-bold ${scoreColor(data.kpis.overallScore)}`} data-testid="text-overall-score">{data.kpis.overallScore}%</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-gray-400 text-sm mb-2">ERS Status</div>
            {ersStatusBadge(ersStatus)}
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-gray-400 text-sm mb-2">FORS Level</div>
            {forsLevelBadge(data.forsReadiness.level)}
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-gray-400 text-sm mb-2">KPIs Passing</div>
            <div className="text-2xl font-bold text-white" data-testid="text-kpi-pass-count">{passedKPIs}/{kpiList.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button data-testid="button-tab-overview" variant={activeTab === 'overview' ? 'default' : 'outline'} onClick={() => setActiveTab('overview')} size="sm">Overview</Button>
        <Button data-testid="button-tab-kpis" variant={activeTab === 'kpis' ? 'default' : 'outline'} onClick={() => setActiveTab('kpis')} size="sm">DVSA KPIs</Button>
        <Button data-testid="button-tab-fors" variant={activeTab === 'fors' ? 'default' : 'outline'} onClick={() => setActiveTab('fors')} size="sm">FORS Requirements</Button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" />Earned Recognition KPIs</CardTitle>
              <CardDescription className="text-gray-400">DVSA performance indicators for operator compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {kpiList.map((kpi, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg" data-testid={`kpi-item-${i}`}>
                    <div>
                      <div className="text-white text-sm font-medium">{kpi.name}</div>
                      <div className="text-gray-400 text-xs">{kpi.description}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white text-sm">{kpi.actual} / {kpi.target}</span>
                      {kpiStatusBadge(kpi.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" />FORS Readiness</CardTitle>
                <CardDescription className="text-gray-400">{metCount}/{reqs.length} requirements met — Score: {data.forsReadiness.score}%</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['bronze', 'silver', 'gold'].map(level => {
                    const levelReqs = reqs.filter(r => r.forsLevel === level);
                    const met = levelReqs.filter(r => r.status === 'met').length;
                    const pct = levelReqs.length > 0 ? Math.round((met / levelReqs.length) * 100) : 0;
                    const color = level === 'gold' ? 'bg-yellow-500' : level === 'silver' ? 'bg-gray-300' : 'bg-amber-600';
                    return (
                      <div key={level} className="p-3 bg-gray-800/50 rounded-lg" data-testid={`fors-level-${level}`}>
                        <div className="flex justify-between mb-1">
                          <span className="text-white text-sm capitalize">{level}</span>
                          <span className="text-gray-400 text-sm">{met}/{levelReqs.length} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Evidence Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-gray-400">Vehicles</div>
                  <div className="text-white font-medium">{data.evidenceSummary.totalVehicles}</div>
                  <div className="text-gray-400">Active Drivers</div>
                  <div className="text-white font-medium">{data.evidenceSummary.totalActiveDrivers}</div>
                  <div className="text-gray-400">Inspections (12m)</div>
                  <div className="text-white font-medium">{data.evidenceSummary.inspectionsLast12Months}</div>
                  <div className="text-gray-400">Defects Reported</div>
                  <div className="text-white font-medium">{data.evidenceSummary.defectsReported}</div>
                  <div className="text-gray-400">Defects Resolved</div>
                  <div className="text-white font-medium">{data.evidenceSummary.defectsResolved}</div>
                  <div className="text-gray-400">CPC Compliant Drivers</div>
                  <div className="text-white font-medium">{data.evidenceSummary.cpcCompliantDrivers}/{data.evidenceSummary.totalActiveDrivers}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'kpis' && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">DVSA Earned Recognition KPIs</CardTitle>
            <CardDescription className="text-gray-400">Performance metrics required for DVSA Earned Recognition Scheme eligibility</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">KPI</TableHead>
                  <TableHead className="text-gray-400">Description</TableHead>
                  <TableHead className="text-gray-400">Target</TableHead>
                  <TableHead className="text-gray-400">Actual</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpiList.map((kpi, i) => (
                  <TableRow key={i} className="border-gray-700" data-testid={`row-kpi-${i}`}>
                    <TableCell className="text-white font-medium">{kpi.name}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{kpi.description}</TableCell>
                    <TableCell className="text-gray-300">{kpi.target}</TableCell>
                    <TableCell className={kpi.status === 'pass' ? 'text-green-400 font-semibold' : kpi.status === 'fail' ? 'text-red-400 font-semibold' : 'text-amber-400 font-semibold'}>{kpi.actual}</TableCell>
                    <TableCell>{kpiStatusBadge(kpi.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'fors' && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">FORS Requirements Checklist</CardTitle>
            <CardDescription className="text-gray-400">Fleet Operator Recognition Scheme — Bronze, Silver & Gold requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">ID</TableHead>
                  <TableHead className="text-gray-400">Level</TableHead>
                  <TableHead className="text-gray-400">Category</TableHead>
                  <TableHead className="text-gray-400">Requirement</TableHead>
                  <TableHead className="text-gray-400">Evidence</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reqs.map((req, i) => (
                  <TableRow key={i} className="border-gray-700" data-testid={`row-fors-${i}`}>
                    <TableCell className="text-gray-300 font-mono">{req.id}</TableCell>
                    <TableCell>
                      <Badge className={req.forsLevel === 'gold' ? 'bg-yellow-500/20 text-yellow-400' : req.forsLevel === 'silver' ? 'bg-gray-300/20 text-gray-300' : 'bg-amber-700/20 text-amber-600'}>
                        {req.forsLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">{req.category}</TableCell>
                    <TableCell className="text-white">{req.requirement}</TableCell>
                    <TableCell className="text-gray-400 text-sm">{req.evidence}</TableCell>
                    <TableCell>{forsStatusIcon(req.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
