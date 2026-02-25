import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import path from 'path';
import fs from 'fs';
import { ObjectStorageService } from './objectStorage';

const LOGO_PATH = path.join(process.cwd(), 'server', 'assets', 'titan-fleet-logo.png');

function getLogoBuffer(): Buffer | null {
  try {
    if (fs.existsSync(LOGO_PATH)) {
      return fs.readFileSync(LOGO_PATH);
    }
  } catch {}
  return null;
}

interface InspectionData {
  id: number;
  companyName: string;
  vehicleVrm: string;
  vehicleMake: string;
  vehicleModel: string;
  driverName: string;
  type: string;
  status: string;
  odometer: number;
  checklist: any[];
  defects: any[] | null;
  cabPhotos?: string[];
  hasTrailer: boolean;
  startedAt: string | null;
  completedAt: string | null;
  durationSeconds: number | null;
  createdAt: string;
}

async function downloadPhotoBuffer(photoPath: string): Promise<Buffer | null> {
  try {
    const storageService = new ObjectStorageService();
    const file = await storageService.getObjectFile(photoPath);
    const [buffer] = await file.download();
    return buffer;
  } catch (error) {
    console.warn(`Failed to download photo: ${photoPath}`, error);
    return null;
  }
}

export async function generateInspectionPDF(inspection: InspectionData): Promise<PassThrough> {
  const photoBuffers: Map<string, Buffer> = new Map();
  const photoPaths: string[] = [];

  if (inspection.defects) {
    for (const defect of inspection.defects) {
      if (defect.photo && typeof defect.photo === 'string') {
        photoPaths.push(defect.photo);
      }
    }
  }
  if (inspection.cabPhotos) {
    for (const photo of inspection.cabPhotos) {
      if (photo && typeof photo === 'string') {
        photoPaths.push(photo);
      }
    }
  }

  const results = await Promise.allSettled(
    photoPaths.map(async (path) => {
      const buffer = await downloadPhotoBuffer(path);
      if (buffer) {
        photoBuffers.set(path, buffer);
      }
    })
  );

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = new PassThrough();
  doc.pipe(stream);

  const createdDate = new Date(inspection.createdAt);
  const dateStr = createdDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = createdDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const logo = getLogoBuffer();
  const left = 50;
  const right = 545;
  const contentWidth = right - left;

  const headerTop = doc.y;
  doc.save();
  doc.rect(left, headerTop, contentWidth, 60).fill('#1e293b');
  doc.rect(left, headerTop + 60, contentWidth, 3).fill('#10b981');
  if (logo) {
    try {
      doc.image(logo, left + 15, headerTop + 10, { height: 40 });
    } catch { }
  }
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
    .text('Vehicle Inspection Report', left, headerTop + 16, { width: contentWidth - 20, align: 'right' });
  doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
    .text(`Generated: ${dateStr} at ${timeStr}`, left, headerTop + 38, { width: contentWidth - 20, align: 'right' });
  doc.restore();
  doc.y = headerTop + 76;
  doc.fillColor('#000000');

  const detailBoxTop = doc.y;
  doc.rect(left, detailBoxTop, contentWidth, 1).fill('#e2e8f0');
  doc.y = detailBoxTop + 8;

  const col1X = left + 10;
  const col2X = left + contentWidth / 2 + 10;
  const labelW = 90;
  const valW = contentWidth / 2 - 30;

  const drawField = (x: number, y: number, label: string, value: string) => {
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text(label.toUpperCase(), x, y, { width: labelW });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(value, x, y + 10, { width: valW });
  };

  let fieldY = doc.y;
  drawField(col1X, fieldY, 'Company', inspection.companyName);
  drawField(col2X, fieldY, 'Date & Time', `${dateStr}  ${timeStr}`);
  fieldY += 32;
  drawField(col1X, fieldY, 'Vehicle', `${inspection.vehicleVrm}`);
  drawField(col2X, fieldY, 'Make / Model', `${inspection.vehicleMake} ${inspection.vehicleModel}`);
  fieldY += 32;
  drawField(col1X, fieldY, 'Driver', inspection.driverName);
  drawField(col2X, fieldY, 'Odometer', inspection.odometer != null ? `${inspection.odometer.toLocaleString()} miles` : 'N/A');
  fieldY += 32;
  drawField(col1X, fieldY, 'Check Type', inspection.type.replace('_', ' '));
  drawField(col2X, fieldY, 'Trailer', inspection.hasTrailer ? 'Yes' : 'No');
  fieldY += 32;

  doc.y = fieldY;

  if (inspection.startedAt && inspection.completedAt) {
    const startTime = new Date(inspection.startedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(inspection.completedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const duration = inspection.durationSeconds ? `${Math.floor(inspection.durationSeconds / 60)}m ${inspection.durationSeconds % 60}s` : 'N/A';
    
    doc.rect(left, doc.y, contentWidth, 24).fill('#f0fdf4');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#166534').text('DVSA TIMING EVIDENCE', col1X, doc.y + 3);
    doc.fontSize(9).font('Helvetica').fillColor('#166534')
      .text(`Started: ${startTime}   |   Completed: ${endTime}   |   Duration: ${duration}`, col1X, doc.y + 2, { width: contentWidth - 20 });
    doc.y += 10;
  }

  const statusColor = inspection.status === 'PASS' ? '#16a34a' : '#dc2626';
  const statusBg = inspection.status === 'PASS' ? '#f0fdf4' : '#fef2f2';
  const resultY = doc.y;
  doc.rect(left, resultY, contentWidth, 32).fill(statusBg);
  doc.rect(left, resultY, 4, 32).fill(statusColor);
  doc.fontSize(16).font('Helvetica-Bold').fillColor(statusColor)
    .text(`Result: ${inspection.status}`, left + 16, resultY + 8, { width: contentWidth - 30, align: 'center' });
  doc.y = resultY + 42;
  doc.fillColor('#000000');

  doc.rect(left, doc.y, contentWidth, 1).fill('#e2e8f0');
  doc.y += 10;

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('Checklist Items');
  doc.moveDown(0.3);

  if (Array.isArray(inspection.checklist)) {
    let currentSection = '';
    inspection.checklist.forEach((item: any) => {
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }

      if (item.section !== currentSection) {
        currentSection = item.section;
        doc.moveDown(0.3);
        const sectionY = doc.y;
        doc.rect(left, sectionY, contentWidth, 18).fill('#f1f5f9');
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#334155').text(currentSection, left + 10, sectionY + 4);
        doc.y = sectionY + 22;
        doc.fillColor('#000000');
      }

      const rowY = doc.y;
      const isFail = item.status === 'fail';
      if (isFail) {
        doc.rect(left, rowY, contentWidth, 16).fill('#fef2f2');
      }
      
      const statusText = item.status === 'pass' ? 'PASS' : item.status === 'fail' ? 'FAIL' : item.status === 'na' ? 'N/A' : '--';
      const statusClr = item.status === 'pass' ? '#16a34a' : item.status === 'fail' ? '#dc2626' : '#6b7280';
      const statusBgClr = item.status === 'pass' ? '#dcfce7' : item.status === 'fail' ? '#fecaca' : '#f3f4f6';
      
      doc.rect(left + 8, rowY + 2, 36, 12).fillAndStroke(statusBgClr, statusClr);
      doc.fontSize(7).font('Helvetica-Bold').fillColor(statusClr).text(statusText, left + 8, rowY + 4, { width: 36, align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#1e293b').text(item.item, left + 52, rowY + 3, { width: contentWidth - 60 });
      doc.y = rowY + 17;
      
      if (item.defectNote) {
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#dc2626').text(`Defect: ${item.defectNote}`, left + 52, doc.y, { width: contentWidth - 60 });
        doc.moveDown(0.2);
        doc.fillColor('#000000');
      }
    });
  }

  if (inspection.defects && inspection.defects.length > 0) {
    if (doc.y > doc.page.height - 120) doc.addPage();
    doc.moveDown(0.5);
    doc.rect(left, doc.y, contentWidth, 1).fill('#e2e8f0');
    doc.y += 10;

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#dc2626').text('Defects Reported');
    doc.fillColor('#000000');
    doc.moveDown(0.3);

    inspection.defects.forEach((defect: any, idx: number) => {
      if (doc.y > doc.page.height - 100) doc.addPage();
      
      const defectY = doc.y;
      doc.rect(left, defectY, contentWidth, 1).fill('#fecaca');
      doc.y = defectY + 6;
      
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#991b1b').text(`${idx + 1}. ${defect.item || 'General'}`);
      if (defect.note) {
        doc.fontSize(9).font('Helvetica').fillColor('#7f1d1d').text(defect.note, { indent: 16 });
      }
      doc.fillColor('#000000');

      if (defect.photo) {
        const photoBuffer = photoBuffers.get(defect.photo);
        if (photoBuffer) {
          doc.moveDown(0.3);
          try {
            if (doc.y > doc.page.height - 220) doc.addPage();
            doc.image(photoBuffer, left + 16, doc.y, { fit: [220, 180] });
            doc.y += 185;
          } catch {
            doc.fontSize(8).fillColor('#6b7280').text(`Photo: ${defect.photo.split('/').pop() || 'attached'}`, { indent: 16 });
          }
        }
      }
      doc.moveDown(0.4);
    });
  }

  if (inspection.cabPhotos && inspection.cabPhotos.length > 0) {
    if (doc.y > doc.page.height - 120) doc.addPage();
    doc.moveDown(0.5);
    doc.rect(left, doc.y, contentWidth, 1).fill('#e2e8f0');
    doc.y += 10;

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af').text('Cab Condition Photos');
    doc.fillColor('#000000');
    doc.moveDown(0.3);

    inspection.cabPhotos.forEach((photo: string, idx: number) => {
      const photoBuffer = photoBuffers.get(photo);
      if (photoBuffer) {
        try {
          if (doc.y > doc.page.height - 220) doc.addPage();
          doc.image(photoBuffer, left + 16, doc.y, { fit: [220, 180] });
          doc.y += 185;
          doc.moveDown(0.3);
        } catch {
          doc.fontSize(8).font('Helvetica').text(`Photo ${idx + 1}: could not embed`);
        }
      }
    });
  }

  if (doc.y > doc.page.height - 80) doc.addPage();
  doc.moveDown(1);
  const footerY = doc.y;
  doc.rect(left, footerY, contentWidth, 1).fill('#e2e8f0');
  doc.y = footerY + 8;
  doc.fontSize(7).font('Helvetica').fillColor('#94a3b8')
    .text('This document is an official record of a vehicle safety inspection. Any tampering with this document is prohibited.', { align: 'center' });
  doc.moveDown(0.2);
  doc.fontSize(7).fillColor('#94a3b8')
    .text(`Report ID: TF-${String(inspection.id).padStart(6, '0')}  |  Titan Fleet  |  titanfleet.co.uk`, { align: 'center' });

  doc.end();
  return stream;
}

export function getInspectionFilename(inspection: { vehicleVrm: string; createdAt: string; type: string }): string {
  const date = new Date(inspection.createdAt);
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
  return `${inspection.vehicleVrm}_${inspection.type}_${dateStr}_${timeStr}.pdf`;
}

/**
 * Generate DVSA Compliance Report
 */
export function generateDVSAComplianceReport(data: {
  companyName: string;
  startDate: Date;
  endDate: Date;
  totalVehicles: number;
  totalInspections: number;
  totalDefects: number;
  openDefects: number;
  criticalDefects: number;
  defectsBySeverity: { critical: number; major: number; minor: number };
  defectsByStatus: { open: number; assigned: number; inProgress: number; rectified: number; verified: number; closed: number };
  vehicleSummary: Array<{ vrm: string; make: string; model: string; inspections: number; defects: number; openDefects: number }>;
}): PassThrough {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = new PassThrough();
  doc.pipe(stream);

  const logo = getLogoBuffer();
  const headerTop = doc.y;
  doc.save();
  doc.rect(50, headerTop, 495, 60).fill('#1e293b');
  doc.rect(50, headerTop + 60, 495, 3).fill('#10b981');
  if (logo) {
    try { doc.image(logo, 65, headerTop + 10, { height: 40 }); } catch {}
  }
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
    .text('DVSA Compliance Report', 50, headerTop + 16, { width: 480, align: 'right' });
  doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
    .text(`Generated: ${new Date().toLocaleString('en-GB')}`, 50, headerTop + 38, { width: 480, align: 'right' });
  doc.restore();
  doc.y = headerTop + 76;
  doc.fillColor('#000000');
  doc.moveDown(0.5);

  doc.fontSize(12).font('Helvetica');
  doc.text(`Company: ${data.companyName}`);
  doc.text(`Report Period: ${data.startDate.toLocaleDateString('en-GB')} - ${data.endDate.toLocaleDateString('en-GB')}`);
  doc.moveDown();

  // Summary Statistics
  doc.fontSize(14).font('Helvetica-Bold').text('Summary Statistics');
  doc.fontSize(11).font('Helvetica');
  doc.text(`Total Vehicles: ${data.totalVehicles}`);
  doc.text(`Total Inspections: ${data.totalInspections}`);
  doc.text(`Total Defects: ${data.totalDefects}`);
  doc.text(`Open Defects: ${data.openDefects}`);
  doc.text(`Critical Defects: ${data.criticalDefects}`);
  doc.moveDown();

  // Compliance Rate
  const inspectionRate = data.totalVehicles > 0 
    ? ((data.totalInspections / data.totalVehicles) * 100).toFixed(1)
    : '0';
  
  doc.fontSize(14).font('Helvetica-Bold').text('Compliance Metrics');
  doc.fontSize(11).font('Helvetica');
  doc.text(`Inspection Rate: ${inspectionRate}%`);
  doc.moveDown();

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#dddddd');
  doc.moveDown();

  // Defect Breakdown
  doc.fontSize(14).font('Helvetica-Bold').text('Defect Breakdown by Severity');
  doc.fontSize(11).font('Helvetica');
  doc.text(`Critical: ${data.defectsBySeverity.critical}`);
  doc.text(`Major: ${data.defectsBySeverity.major}`);
  doc.text(`Minor: ${data.defectsBySeverity.minor}`);
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('Defect Status');
  doc.fontSize(11).font('Helvetica');
  doc.text(`Open: ${data.defectsByStatus.open}`);
  doc.text(`Assigned: ${data.defectsByStatus.assigned}`);
  doc.text(`In Progress: ${data.defectsByStatus.inProgress}`);
  doc.text(`Rectified: ${data.defectsByStatus.rectified}`);
  doc.text(`Verified: ${data.defectsByStatus.verified}`);
  doc.text(`Closed: ${data.defectsByStatus.closed}`);
  doc.moveDown();

  // Vehicle Summary
  if (data.vehicleSummary.length > 0) {
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Vehicle Inspection Summary');
    doc.moveDown();

    data.vehicleSummary.forEach((vehicle) => {
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`${vehicle.vrm} - ${vehicle.make} ${vehicle.model}`);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Inspections: ${vehicle.inspections}`, { indent: 20 });
      doc.text(`Defects: ${vehicle.defects}`, { indent: 20 });
      doc.text(`Open Defects: ${vehicle.openDefects}`, { indent: 20 });
      
      doc.moveDown(0.5);
    });
  }

  // Footer
  doc.moveDown();
  doc.fontSize(9).fillColor('#666666');
  doc.text('This report is generated for DVSA compliance purposes.', { align: 'center' });
  doc.text('All inspection records are retained for 15 months as required by law.', { align: 'center' });

  doc.end();
  return stream;
}

/**
 * Generate Fleet Utilization Report
 */
export function generateFleetUtilizationReport(data: {
  companyName: string;
  startDate: Date;
  endDate: Date;
  totalVehicles: number;
  totalShifts: number;
  totalHours: number;
  vehicleUtilization: Array<{ vrm: string; hours: number; shifts: number }>;
}): PassThrough {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = new PassThrough();
  doc.pipe(stream);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('Fleet Utilization Report', { align: 'center' });
  doc.moveDown();

  // Company & Period Info
  doc.fontSize(12).font('Helvetica');
  doc.text(`Company: ${data.companyName}`);
  doc.text(`Report Period: ${data.startDate.toLocaleDateString('en-GB')} - ${data.endDate.toLocaleDateString('en-GB')}`);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`);
  doc.moveDown();

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#dddddd');
  doc.moveDown();

  // Summary
  const avgHoursPerVehicle = data.totalVehicles > 0 
    ? (data.totalHours / data.totalVehicles).toFixed(1)
    : '0';
  
  doc.fontSize(14).font('Helvetica-Bold').text('Summary');
  doc.fontSize(11).font('Helvetica');
  doc.text(`Total Vehicles: ${data.totalVehicles}`);
  doc.text(`Total Shifts: ${data.totalShifts}`);
  doc.text(`Total Hours: ${data.totalHours.toFixed(1)} hours`);
  doc.text(`Average Hours per Vehicle: ${avgHoursPerVehicle} hours`);
  doc.moveDown();

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#dddddd');
  doc.moveDown();

  // Vehicle Utilization
  doc.fontSize(14).font('Helvetica-Bold').text('Vehicle Utilization');
  doc.moveDown(0.5);

  data.vehicleUtilization.forEach((vehicle) => {
    doc.fontSize(11).font('Helvetica');
    doc.text(`${vehicle.vrm}: ${vehicle.hours.toFixed(1)} hours (${vehicle.shifts} shifts)`);
  });

  doc.end();
  return stream;
}

/**
 * Generate Driver Performance Report
 */
export function generateDriverPerformanceReport(data: {
  companyName: string;
  startDate: Date;
  endDate: Date;
  driverPerformance: Array<{
    name: string;
    email: string;
    inspections: number;
    defectsReported: number;
    hoursWorked: number;
    shifts: number;
  }>;
}): PassThrough {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = new PassThrough();
  doc.pipe(stream);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('Driver Performance Report', { align: 'center' });
  doc.moveDown();

  // Company & Period Info
  doc.fontSize(12).font('Helvetica');
  doc.text(`Company: ${data.companyName}`);
  doc.text(`Report Period: ${data.startDate.toLocaleDateString('en-GB')} - ${data.endDate.toLocaleDateString('en-GB')}`);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`);
  doc.moveDown();

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#dddddd');
  doc.moveDown();

  // Driver-by-Driver Breakdown
  data.driverPerformance.forEach((driver) => {
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(driver.name);
    
    doc.fontSize(11).font('Helvetica');
    doc.text(`Email: ${driver.email}`, { indent: 20 });
    doc.text(`Inspections Completed: ${driver.inspections}`, { indent: 20 });
    doc.text(`Defects Reported: ${driver.defectsReported}`, { indent: 20 });
    doc.text(`Total Hours Worked: ${driver.hoursWorked.toFixed(1)} hours`, { indent: 20 });
    doc.text(`Shifts: ${driver.shifts}`, { indent: 20 });
    
    doc.moveDown();
  });

  doc.end();
  return stream;
}
