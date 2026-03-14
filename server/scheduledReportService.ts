import { db } from './db';
import { scheduledReports, companies } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from './emailService';
import type { Express } from 'express';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const REPORT_TYPES: Record<string, { name: string; description: string }> = {
  'compliance-summary': { name: 'Compliance Summary', description: 'MOT status, inspection rates, defect resolution' },
  'fleet-status': { name: 'Fleet Status', description: 'Vehicle operational status, VOR count, mileage' },
  'driver-hours': { name: 'Driver Hours', description: 'Working hours, rest compliance, infringements' },
  'fuel-analysis': { name: 'Fuel Analysis', description: 'Consumption, cost trends, anomalies' },
  'defect-report': { name: 'Defect Report', description: 'Open defects, resolution times, recurring issues' },
  'inspection-report': { name: 'Inspection Report', description: 'Completion rates, pass/fail, timing compliance' },
};

export function getAvailableReportTypes() {
  return Object.entries(REPORT_TYPES).map(([key, val]) => ({ id: key, ...val }));
}

export async function processScheduledReports(): Promise<{ sent: number; errors: number }> {
  const now = new Date();
  const currentDay = now.getDay();
  const currentDate = now.getDate();
  let sent = 0;
  let errors = 0;

  try {
    const reports = await db.select().from(scheduledReports).where(eq(scheduledReports.enabled, true));

    for (const report of reports) {
      let shouldSend = false;

      if (report.frequency === 'weekly' && report.dayOfWeek === currentDay) {
        shouldSend = true;
      } else if (report.frequency === 'monthly' && currentDate === 1) {
        shouldSend = true;
      } else if (report.frequency === 'daily') {
        shouldSend = true;
      }

      if (report.lastSentAt) {
        const hoursSinceLast = (now.getTime() - new Date(report.lastSentAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLast < 20) shouldSend = false;
      }

      if (!shouldSend) continue;

      try {
        const [company] = await db.select().from(companies).where(eq(companies.id, report.companyId));
        if (!company) continue;

        const reportData = await generateReportData(report.reportType, report.companyId);

        const periodLabel = report.frequency === 'weekly' ? 'Weekly' : report.frequency === 'monthly' ? 'Monthly' : 'Daily';
        const typeName = REPORT_TYPES[report.reportType]?.name || report.reportType;

        const htmlContent = buildReportEmailHtml(company.name, typeName, periodLabel, reportData);

        for (const recipient of report.recipients) {
          await sendEmail({
            to: recipient,
            subject: `${periodLabel} ${typeName} — ${company.name} — ${now.toLocaleDateString('en-GB')}`,
            html: htmlContent,
          });
        }

        await db.update(scheduledReports)
          .set({ lastSentAt: now })
          .where(eq(scheduledReports.id, report.id));

        sent++;
        console.log(`[ScheduledReports] Sent ${typeName} for ${company.name}`);
      } catch (err) {
        errors++;
        console.error(`[ScheduledReports] Failed report ${report.id}:`, err);
      }
    }
  } catch (err) {
    console.error('[ScheduledReports] Process error:', err);
  }

  return { sent, errors };
}

async function generateReportData(reportType: string, companyId: number): Promise<any[]> {
  try {
    const mapped: Record<string, string> = {
      'compliance-summary': 'dvsa-compliance',
      'fleet-status': 'vehicle-list',
      'driver-hours': 'driver-list',
      'fuel-analysis': 'fuel-purchases',
      'defect-report': 'safety-inspections',
      'inspection-report': 'safety-inspections',
    };
    const type = mapped[reportType] || 'vehicle-list';
    const { reportGenerators } = await import('./reports');
    const generator = reportGenerators[type as keyof typeof reportGenerators];
    if (!generator) return [];
    const result = await generator({ companyId });
    if (result && typeof result === 'object' && 'data' in result) {
      return Array.isArray((result as any).data) ? (result as any).data.slice(0, 50) : [];
    }
    return Array.isArray(result) ? (result as any[]).slice(0, 50) : [];
  } catch (err) {
    console.error('[ScheduledReports] Report generation failed:', err);
    return [];
  }
}

function buildReportEmailHtml(companyName: string, reportName: string, period: string, data: any[]): string {
  const rows = data.slice(0, 25);
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  let tableHtml = '';
  if (rows.length > 0) {
    tableHtml = `
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:16px;">
        <thead>
          <tr style="background:#1e293b;color:white;">
            ${headers.map(h => `<th style="padding:8px 12px;text-align:left;border:1px solid #334155;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, i) => `
            <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
              ${headers.map(h => `<td style="padding:6px 12px;border:1px solid #e2e8f0;">${row[h] ?? ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${data.length > 25 ? `<p style="color:#64748b;font-size:12px;margin-top:8px;">Showing 25 of ${data.length} records. Log in for the full report.</p>` : ''}
    `;
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:22px;">🚛 Titan Fleet</h1>
        <p style="color:#94a3b8;margin:8px 0 0 0;">${companyName}</p>
      </div>
      <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;">
        <div style="background:#3b82f6;color:white;padding:8px 16px;border-radius:6px;display:inline-block;font-weight:bold;margin-bottom:16px;">
          ${period} Report
        </div>
        <h2 style="color:#1e293b;margin:0 0 8px 0;">${reportName}</h2>
        <p style="color:#64748b;margin:0 0 16px 0;">Generated: ${new Date().toLocaleString('en-GB')}</p>
        ${tableHtml || '<p style="color:#64748b;">No data available for this period.</p>'}
      </div>
      <div style="background:#1e293b;padding:16px 24px;border-radius:0 0 12px 12px;text-align:center;">
        <p style="color:#94a3b8;margin:0;font-size:12px;">Titan Fleet Management • Automated Report</p>
      </div>
    </div>
  `;
}
