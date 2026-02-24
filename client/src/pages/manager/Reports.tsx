import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { session } from "@/lib/session";

function authHeaders(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Calendar,
  Filter,
  Loader2,
  TrendingUp,
  Users,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  endpoint?: string; // For legacy reports
}

const REPORT_TYPES: ReportType[] = [
  // Fleet Reports
  {
    id: 'vehicle-list',
    name: 'Vehicle List',
    description: 'Complete list of all vehicles with key details',
    icon: '🚛',
    category: 'Fleet'
  },
  {
    id: 'vor-analysis',
    name: 'VOR Analysis',
    description: 'Vehicle off-road statistics',
    icon: '🚫',
    category: 'Fleet'
  },
  {
    id: 'mileage',
    name: 'Mileage Report',
    description: 'Current mileage for all vehicles',
    icon: '📊',
    category: 'Fleet'
  },
  
  // Driver Reports
  {
    id: 'driver-list',
    name: 'Driver List',
    description: 'All drivers with license information',
    icon: '👤',
    category: 'Drivers'
  },
  
  // Cost Reports
  {
    id: 'fuel-purchase',
    name: 'Fuel Purchases',
    description: 'Fuel costs and consumption analysis',
    icon: '⛽',
    category: 'Costs'
  },
  {
    id: 'cost-analysis',
    name: 'Cost Analysis',
    description: 'Total costs by vehicle (fuel + service)',
    icon: '💰',
    category: 'Costs'
  },
  
  // Maintenance Reports
  {
    id: 'defect',
    name: 'Defect Report',
    description: 'All reported defects by vehicle',
    icon: '⚠️',
    category: 'Maintenance'
  },
  {
    id: 'service-due',
    name: 'Service Due',
    description: 'Vehicles due for service',
    icon: '🔧',
    category: 'Maintenance'
  },
  
  // Compliance Reports
  {
    id: 'mot-expiry',
    name: 'MOT Expiry',
    description: 'MOT due dates for all vehicles',
    icon: '📅',
    category: 'Compliance'
  },
  {
    id: 'safety-inspection',
    name: 'Safety Inspections',
    description: 'Inspection history with pass/fail status',
    icon: '✓',
    category: 'Compliance'
  },
  
  // Legacy DVSA Reports (keep existing functionality)
  {
    id: 'dvsa-compliance',
    name: 'DVSA Compliance Report',
    description: 'Complete compliance report for DVSA audits',
    icon: '🛡️',
    category: 'Compliance',
    endpoint: '/api/reports/dvsa-compliance'
  },
  {
    id: 'fleet-utilization',
    name: 'Fleet Utilization Report',
    description: 'Analyze vehicle usage and efficiency metrics',
    icon: '📈',
    category: 'Fleet',
    endpoint: '/api/reports/fleet-utilization'
  },
  {
    id: 'driver-performance',
    name: 'Driver Performance Report',
    description: 'Comprehensive driver statistics',
    icon: '👥',
    category: 'Drivers',
    endpoint: '/api/reports/driver-performance'
  }
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);

  const companyId = session.getCompany()?.id;

  // New report system
  const generateMutation = useMutation({
    mutationFn: async (reportType: string) => {
      const res = await fetch('/api/manager/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          reportType,
          filters: {
            companyId,
            startDate: startDate || undefined,
            endDate: endDate || undefined
          }
        })
      });
      if (!res.ok) throw new Error('Failed to generate report');
      return res.json();
    },
    onSuccess: (data) => {
      setReportData(data);
      toast.success('Report generated successfully');
    },
    onError: () => {
      toast.error('Failed to generate report');
    }
  });

  const exportCSVMutation = useMutation({
    mutationFn: async (reportType: string) => {
      const res = await fetch('/api/manager/reports/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          reportType,
          filters: {
            companyId,
            startDate: startDate || undefined,
            endDate: endDate || undefined
          }
        })
      });
      if (!res.ok) throw new Error('Failed to export CSV');
      return res.blob();
    },
    onSuccess: (blob, reportType) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV exported successfully');
    },
    onError: () => {
      toast.error('Failed to export CSV');
    }
  });

  const exportPDFMutation = useMutation({
    mutationFn: async (reportType: string) => {
      const res = await fetch('/api/manager/reports/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          reportType,
          filters: {
            companyId,
            startDate: startDate || undefined,
            endDate: endDate || undefined
          }
        })
      });
      if (!res.ok) throw new Error('Failed to export PDF');
      return res.blob();
    },
    onSuccess: (blob, reportType) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF exported successfully');
    },
    onError: () => {
      toast.error('Failed to export PDF');
    }
  });

  // Legacy report system
  const [generating, setGenerating] = useState<string | null>(null);

  const generateLegacyReport = async (reportType: string, endpoint: string) => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      toast.error('Start date must be before end date');
      return;
    }

    setGenerating(reportType);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Report generated successfully`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateReport = () => {
    if (!selectedReport) return;
    
    const report = REPORT_TYPES.find(r => r.id === selectedReport);
    if (report?.endpoint) {
      // Legacy report
      generateLegacyReport(selectedReport, report.endpoint);
    } else {
      // New report system
      generateMutation.mutate(selectedReport);
    }
  };

  const handleExportCSV = () => {
    if (selectedReport) {
      exportCSVMutation.mutate(selectedReport);
    }
  };

  const handleExportPDF = () => {
    if (selectedReport) {
      exportPDFMutation.mutate(selectedReport);
    }
  };

  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const categories = Array.from(new Set(REPORT_TYPES.map(r => r.category)));
  const selectedReportData = REPORT_TYPES.find(r => r.id === selectedReport);
  const isLegacyReport = selectedReportData?.endpoint;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-600 mt-2">
          Generate comprehensive fleet management reports
        </p>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Period
          </CardTitle>
          <CardDescription>Select the date range for your reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Quick Date Ranges */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange(7)}>
              Last 7 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange(30)}>
              Last 30 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange(90)}>
              Last 3 Months
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange(180)}>
              Last 6 Months
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange(365)}>
              Last Year
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Report Selection */}
        <div className="lg:col-span-2 space-y-6">
          {categories.map(category => {
            const categoryReports = REPORT_TYPES.filter(r => r.category === category);
            
            return (
              <div key={category}>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryReports.map(report => (
                    <Card
                      key={report.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedReport === report.id
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:border-blue-300'
                      }`}
                      onClick={() => {
                        setSelectedReport(report.id);
                        setReportData(null); // Clear previous report data
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{report.icon}</div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base">{report.name}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm">
                          {report.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleGenerateReport}
                disabled={!selectedReport || generateMutation.isPending || generating !== null}
                className="w-full"
              >
                {(generateMutation.isPending || generating) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>

              {!isLegacyReport && (
                <>
                  <Button
                    onClick={handleExportCSV}
                    disabled={!selectedReport || exportCSVMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {exportCSVMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export CSV
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleExportPDF}
                    disabled={!selectedReport || exportPDFMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {exportPDFMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {selectedReport && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm">Selected Report</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-blue-900">
                  {selectedReportData?.name}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {selectedReportData?.description}
                </p>
                {isLegacyReport && (
                  <p className="text-xs text-blue-600 mt-2">
                    ℹ️ This report uses the legacy PDF format
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Report Preview (for new reports only) */}
      {reportData && !isLegacyReport && (
        <Card>
          <CardHeader>
            <CardTitle>{reportData.title}</CardTitle>
            <CardDescription>{reportData.description}</CardDescription>
            <p className="text-sm text-slate-500">
              Generated: {new Date(reportData.generatedAt).toLocaleString('en-GB')}
            </p>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            {reportData.summary && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-3">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(reportData.summary).map(([key, value]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').trim();
                    const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
                    return (
                      <div key={key}>
                        <p className="text-sm text-slate-600">{capitalizedLabel}</p>
                        <p className="text-lg font-semibold text-slate-900">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {reportData.columns.map((col: string, i: number) => (
                      <th key={i} className="px-4 py-3 text-left font-semibold text-slate-900">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.rows.slice(0, 50).map((row: any[], i: number) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      {row.map((cell: any, j: number) => (
                        <td key={j} className="px-4 py-3 text-slate-700">
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.rows.length > 50 && (
                <p className="text-sm text-slate-500 mt-4 text-center">
                  Showing first 50 of {reportData.rows.length} rows. Export to see all data.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
