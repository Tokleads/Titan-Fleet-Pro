/**
 * Report Export Utilities
 * 
 * Generate CSV and PDF exports from report data
 */

import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import type { ReportData } from "./reports";

const LOGO_PATH = path.join(process.cwd(), 'server', 'assets', 'titan-fleet-logo.png');
function getLogoBuffer(): Buffer | null {
  try { return fs.existsSync(LOGO_PATH) ? fs.readFileSync(LOGO_PATH) : null; } catch { return null; }
}

/**
 * Generate CSV from report data
 */
export function generateCSV(reportData: ReportData): string {
  const lines: string[] = [];
  
  // Add title and metadata
  lines.push(`"${reportData.title}"`);
  lines.push(`"${reportData.description}"`);
  lines.push(`"Generated: ${new Date(reportData.generatedAt).toLocaleString('en-GB')}"`);
  lines.push(''); // Empty line
  
  // Add summary if present
  if (reportData.summary) {
    lines.push('"Summary"');
    Object.entries(reportData.summary).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
      lines.push(`"${capitalizedLabel}","${value}"`);
    });
    lines.push(''); // Empty line
  }
  
  // Add column headers
  lines.push(reportData.columns.map(col => `"${col}"`).join(','));
  
  // Add data rows
  reportData.rows.forEach(row => {
    const escapedRow = row.map(cell => {
      const cellStr = String(cell);
      // Escape quotes and wrap in quotes
      return `"${cellStr.replace(/"/g, '""')}"`;
    });
    lines.push(escapedRow.join(','));
  });
  
  return lines.join('\n');
}

/**
 * Generate PDF from report data
 */
export async function generatePDF(reportData: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        layout: 'landscape' // Landscape for wider tables
      });
      
      const buffers: Buffer[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
      
      const logo = getLogoBuffer();
      const headerTop = doc.y;
      const pageWidth = doc.page.width - 100;
      if (logo) {
        try {
          doc.rect(50, headerTop, 160, 45).fill('#1e293b');
          doc.image(logo, 58, headerTop + 6, { height: 33 });
        } catch {}
      }
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text(reportData.title, 50, headerTop + 6, { width: pageWidth, align: 'right' });
      doc.fontSize(8).font('Helvetica').fillColor('#555555').text(`Generated: ${new Date(reportData.generatedAt).toLocaleString('en-GB')}`, 50, headerTop + 28, { width: pageWidth, align: 'right' });
      doc.y = headerTop + 52;
      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).lineWidth(1).stroke('#000000');
      doc.y += 12;
      doc.fillColor('#000000');
      doc.moveDown(0.5);
      
      // Summary section
      if (reportData.summary) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#000000')
           .text('Summary');
        
        doc.moveDown(0.5);
        
        doc.fontSize(10)
           .font('Helvetica');
        
        Object.entries(reportData.summary).forEach(([key, value]) => {
          const label = key.replace(/([A-Z])/g, ' $1').trim();
          const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
          doc.text(`${capitalizedLabel}: ${value}`);
        });
        
        doc.moveDown(1);
      }
      
      // Table
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('Report Data');
      
      doc.moveDown(0.5);
      
      const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const columnWidth = tableWidth / reportData.columns.length;
      
      // Table header
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#000000');
      
      let startX = doc.page.margins.left;
      let startY = doc.y;
      
      // Draw header background
      doc.rect(startX, startY, tableWidth, 20)
         .fill('#f3f4f6');
      
      // Draw header text
      doc.fillColor('#000000');
      reportData.columns.forEach((col, i) => {
        const x = startX + (i * columnWidth);
        doc.text(col, x + 5, startY + 5, {
          width: columnWidth - 10,
          height: 20,
          ellipsis: true
        });
      });
      
      doc.moveDown(1.5);
      
      // Table rows
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#000000');
      
      reportData.rows.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
          startY = doc.y;
        } else {
          startY = doc.y;
        }
        
        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.rect(startX, startY, tableWidth, 15)
             .fill('#fafafa');
        }
        
        // Draw row text
        doc.fillColor('#000000');
        row.forEach((cell, i) => {
          const x = startX + (i * columnWidth);
          doc.text(String(cell), x + 5, startY + 3, {
            width: columnWidth - 10,
            height: 15,
            ellipsis: true
          });
        });
        
        doc.moveDown(0.8);
      });
      
      // Footer
      doc.fontSize(8)
         .fillColor('#999999')
         .text(
           `Page ${doc.bufferedPageRange().count} - Generated by Titan Fleet`,
           doc.page.margins.left,
           doc.page.height - 50,
           { align: 'center' }
         );
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
