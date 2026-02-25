import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { ObjectStorageService } from './objectStorage';

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

  const headerTop = doc.y;
  doc.save();
  doc.rect(50, headerTop, 495, 70).fill('#1e293b');
  doc.rect(50, headerTop + 70, 495, 4).fill('#10b981');
  doc.fontSize(26).font('Helvetica-Bold').fillColor('#ffffff').text('TITAN', 70, headerTop + 12, { continued: true }).fillColor('#10b981').text(' FLEET');
  doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text('Fleet Management System', 70, headerTop + 46);
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff').text('Vehicle Inspection Report', 280, headerTop + 18, { width: 250, align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text(`Generated: ${dateStr} at ${timeStr}`, 280, headerTop + 46, { width: 250, align: 'right' });
  doc.restore();
  doc.y = headerTop + 90;
  doc.fillColor('#000000');
  doc.moveDown(0.5);

  doc.fillColor('#000000');
  doc.fontSize(12).font('Helvetica-Bold').text('Company: ', { continued: true }).font('Helvetica').text(inspection.companyName);
  doc.fontSize(12).font('Helvetica-Bold').text('Vehicle: ', { continued: true }).font('Helvetica').text(`${inspection.vehicleVrm} - ${inspection.vehicleMake} ${inspection.vehicleModel}`);
  doc.fontSize(12).font('Helvetica-Bold').text('Driver: ', { continued: true }).font('Helvetica').text(inspection.driverName);
  doc.fontSize(12).font('Helvetica-Bold').text('Check Type: ', { continued: true }).font('Helvetica').text(inspection.type.replace('_', ' '));
  doc.fontSize(12).font('Helvetica-Bold').text('Odometer: ', { continued: true }).font('Helvetica').text(inspection.odometer != null ? `${inspection.odometer.toLocaleString()} miles` : 'N/A');
  doc.fontSize(12).font('Helvetica-Bold').text('Trailer Coupled: ', { continued: true }).font('Helvetica').text(inspection.hasTrailer ? 'Yes' : 'No');
  doc.moveDown(0.5);

  if (inspection.startedAt && inspection.completedAt) {
    const startTime = new Date(inspection.startedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(inspection.completedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const duration = inspection.durationSeconds ? `${Math.floor(inspection.durationSeconds / 60)}m ${inspection.durationSeconds % 60}s` : 'N/A';
    
    doc.fontSize(12).font('Helvetica-Bold').text('DVSA Timing Evidence', { underline: true });
    doc.fontSize(11).font('Helvetica').text(`Started: ${startTime} | Completed: ${endTime} | Duration: ${duration}`);
    doc.moveDown(0.5);
  }

  const statusColor = inspection.status === 'PASS' ? '#16a34a' : '#dc2626';
  doc.fontSize(14).font('Helvetica-Bold').fillColor(statusColor).text(`Result: ${inspection.status}`, { align: 'center' });
  doc.fillColor('#000000');
  doc.moveDown(1);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#dddddd');
  doc.moveDown(1);

  doc.fontSize(14).font('Helvetica-Bold').text('Checklist Items');
  doc.moveDown(0.5);

  if (Array.isArray(inspection.checklist)) {
    let currentSection = '';
    inspection.checklist.forEach((item: any) => {
      if (item.section !== currentSection) {
        currentSection = item.section;
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#374151').text(currentSection);
        doc.fillColor('#000000');
      }

      const statusIcon = item.status === 'pass' ? '[PASS]' : item.status === 'fail' ? '[FAIL]' : item.status === 'na' ? '[N/A]' : '[--]';
      const statusClr = item.status === 'pass' ? '#16a34a' : item.status === 'fail' ? '#dc2626' : '#6b7280';
      
      doc.fontSize(10).font('Helvetica').fillColor(statusClr).text(`  ${statusIcon} `, { continued: true }).fillColor('#000000').text(item.item);
      
      if (item.defectNote) {
        doc.fontSize(9).fillColor('#dc2626').text(`      Defect: ${item.defectNote}`);
        doc.fillColor('#000000');
      }
    });
  }

  if (inspection.defects && inspection.defects.length > 0) {
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#dddddd');
    doc.moveDown(1);

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#dc2626').text('Defects Reported');
    doc.fillColor('#000000');
    doc.moveDown(0.5);

    inspection.defects.forEach((defect: any, idx: number) => {
      doc.fontSize(11).font('Helvetica-Bold').text(`${idx + 1}. ${defect.item || 'General'}`);
      if (defect.note) {
        doc.fontSize(10).font('Helvetica').text(`   ${defect.note}`);
      }
      if (defect.photo) {
        const photoBuffer = photoBuffers.get(defect.photo);
        if (photoBuffer) {
          doc.moveDown(0.3);
          try {
            doc.image(photoBuffer, { fit: [200, 200], align: 'center' });
          } catch (imgErr) {
            const photoFilename = defect.photo.split('/').pop() || 'photo';
            doc.fontSize(9).fillColor('#2563eb').text(`   Photo evidence: ${photoFilename} (could not embed)`);
            doc.fillColor('#000000');
          }
        } else {
          const photoFilename = defect.photo.split('/').pop() || 'photo';
          doc.fontSize(9).fillColor('#2563eb').text(`   Photo evidence attached: ${photoFilename}`);
          doc.fillColor('#000000');
        }
      }
      doc.moveDown(0.3);
    });
  }

  if (inspection.cabPhotos && inspection.cabPhotos.length > 0) {
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#dddddd');
    doc.moveDown(1);

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2563eb').text('Cab Condition Photos');
    doc.fillColor('#000000');
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica').text(`${inspection.cabPhotos.length} cab cleanliness photo(s) recorded:`);
    doc.moveDown(0.3);

    inspection.cabPhotos.forEach((photo: string, idx: number) => {
      const photoBuffer = photoBuffers.get(photo);
      if (photoBuffer) {
        try {
          doc.image(photoBuffer, { fit: [200, 200], align: 'center' });
          doc.moveDown(0.3);
        } catch (imgErr) {
          const filename = photo.split('/').pop() || `photo-${idx + 1}`;
          doc.fontSize(10).font('Helvetica').text(`  ${idx + 1}. ${filename} (could not embed)`);
        }
      } else {
        const filename = photo.split('/').pop() || `photo-${idx + 1}`;
        doc.fontSize(10).font('Helvetica').text(`  ${idx + 1}. ${filename}`);
      }
    });
  }

  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#dddddd');
  doc.moveDown(1);

  doc.fontSize(9).fillColor('#666666').text('This document is an official record of a vehicle safety inspection.', { align: 'center' });
  doc.text('Any tampering with this document is prohibited.', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(8).text(`Report ID: ${inspection.id} | Generated by TitanFleet`, { align: 'center' });

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

  const headerTop = doc.y;
  doc.save();
  doc.rect(50, headerTop, 495, 70).fill('#1e293b');
  doc.rect(50, headerTop + 70, 495, 4).fill('#10b981');
  doc.fontSize(26).font('Helvetica-Bold').fillColor('#ffffff').text('TITAN', 70, headerTop + 12, { continued: true }).fillColor('#10b981').text(' FLEET');
  doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text('Fleet Management System', 70, headerTop + 46);
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff').text('DVSA Compliance Report', 280, headerTop + 18, { width: 250, align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text(`Generated: ${new Date().toLocaleString('en-GB')}`, 280, headerTop + 46, { width: 250, align: 'right' });
  doc.restore();
  doc.y = headerTop + 90;
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
