import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import logger from '../utils/logger.js';

// Radar SVG Generator (Same as before but simplified for PDFKit)
function generateRadarSVG(people) {
  const size = 300;
  const center = size / 2;
  const radius = size * 0.4;
  const factors = ['E', 'A', 'C', 'N', 'O'];
  const labels = ['Dışadönüklük', 'Uyumluluk', 'Sorumluluk', 'Duygusal Denge', 'Deneyime Açıklık'];

  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  
  // Background Circles
  [0.2, 0.4, 0.6, 0.8, 1].forEach(r => {
    svg += `<circle cx="${center}" cy="${center}" r="${radius * r}" fill="none" stroke="#e2e8f0" stroke-width="1" />`;
  });

  // Axis Lines & Labels
  factors.forEach((f, i) => {
    const angle = (Math.PI * 2 * i) / factors.length - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    svg += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#cbd5e1" stroke-width="1" />`;
    
    // Label
    const lx = center + (radius + 25) * Math.cos(angle);
    const ly = center + (radius + 25) * Math.sin(angle);
    svg += `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="10" fill="#64748b" font-family="Arial">${labels[i]}</text>`;
  });

  // Data Polygons
  const colors = ['#e31e24', '#0f172a', '#3b82f6', '#10b981', '#f59e0b'];
  people.forEach((p, idx) => {
    const points = factors.map((f, i) => {
      const score = p[`${f.toLowerCase()}_score`] || 0;
      const angle = (Math.PI * 2 * i) / factors.length - Math.PI / 2;
      const x = center + radius * (score / 100) * Math.cos(angle);
      const y = center + radius * (score / 100) * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
    
    const color = colors[idx % colors.length];
    svg += `<polygon points="${points}" fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="2" />`;
  });

  svg += '</svg>';
  return svg;
}

export async function generatePersonnelReportPDF(person) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fillColor('#e31e24').fontSize(24).font('Helvetica-Bold').text('BORSAN AKADEMİ', { align: 'left' });
      doc.moveDown(0.2);
      doc.fillColor('#1e293b').fontSize(14).font('Helvetica').text('Kişilik Envanteri Analiz Raporu', { align: 'left' });
      doc.strokeColor('#e31e24').lineWidth(3).moveTo(50, 95).lineTo(545, 95).stroke();
      doc.moveDown(2);

      // Info Section
      doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('Personel Bilgileri', 50, 120);
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      
      const infoY = 145;
      doc.text(`Ad Soyad:`, 50, infoY).font('Helvetica-Bold').text(person.name, 120, infoY).font('Helvetica');
      doc.text(`Yaş:`, 50, infoY + 20).font('Helvetica-Bold').text(person.age.toString(), 120, infoY + 20).font('Helvetica');
      doc.text(`Sicil No:`, 50, infoY + 40).font('Helvetica-Bold').text(person.employee_id || '—', 120, infoY + 40).font('Helvetica');
      doc.text(`Departman:`, 50, infoY + 60).font('Helvetica-Bold').text(person.department || '—', 120, infoY + 60).font('Helvetica');
      doc.text(`Pozisyon:`, 50, infoY + 80).font('Helvetica-Bold').text(person.position, 120, infoY + 80).font('Helvetica');

      // Job Fit Card
      doc.roundedRect(350, 140, 195, 80, 10).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(10).text('Pozisyon Uygunluğu', 350, 155, { width: 195, align: 'center' });
      doc.fontSize(32).font('Helvetica-Bold').text(`${person.ai_job_fit.match(/\d+/)?.[0] || '—'}%`, 350, 175, { width: 195, align: 'center' });

      // Radar Chart
      doc.moveDown(4);
      doc.fillColor('#e31e24').fontSize(14).font('Helvetica-Bold').text('Kişilik Profili', 50, 260, { align: 'center' });
      const svg = generateRadarSVG([person]);
      SVGtoPDF(doc, svg, 145, 290, { width: 300, height: 300 });

      // AI Analysis
      doc.addPage();
      doc.fillColor('#e31e24').fontSize(16).font('Helvetica-Bold').text('Uzman Analiz Özeti', 50, 50);
      doc.moveDown(1);
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica').text(person.ai_summary, { align: 'justify', lineGap: 3 });
      
      doc.moveDown(2);
      doc.fontSize(14).font('Helvetica-Bold').text('Güçlü Yönler', 50);
      doc.moveDown(0.5);
      (person.ai_strengths || []).forEach(s => {
        doc.fontSize(11).font('Helvetica').text(`• ${s}`, { indent: 15 });
      });

      doc.moveDown(1.5);
      doc.fontSize(14).font('Helvetica-Bold').text('Gelişim Alanları', 50);
      doc.moveDown(0.5);
      (person.ai_weaknesses || []).forEach(w => {
        doc.fontSize(11).font('Helvetica').text(`• ${w}`, { indent: 15 });
      });

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fillColor('#94a3b8').fontSize(10).text(`Borsan Akademi Envanter Analiz Sistemi © ${new Date().getFullYear()}`, 50, 780, { align: 'center' });
      }

      doc.end();
    } catch (error) {
      logger.error('PDFKit Generation Error:', error);
      reject(error);
    }
  });
}

export async function generateComparisonPDF({ people, analysis, fitAnalysis, recommendation }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fillColor('#e31e24').fontSize(24).font('Helvetica-Bold').text('BORSAN AKADEMİ', { align: 'left' });
      doc.fillColor('#1e293b').fontSize(14).text('Personel Karşılaştırma Raporu', { align: 'left' });
      doc.strokeColor('#e31e24').lineWidth(3).moveTo(50, 95).lineTo(545, 95).stroke();
      doc.moveDown(2);

      doc.fontSize(18).font('Helvetica-Bold').text('Seçilen Adaylar', 50);
      doc.moveDown(1);
      people.forEach((p, i) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${i+1}. ${p.name}`, { continued: true });
        doc.font('Helvetica').text(` - ${p.position} (${p.department || 'Genel'})`);
      });

      doc.moveDown(2);
      doc.fontSize(16).font('Helvetica-Bold').text('Grup Karakteristiği', 50);
      doc.moveDown(1);
      
      const svg = generateRadarSVG(people);
      SVGtoPDF(doc, svg, 145, doc.y, { width: 300, height: 300 });

      doc.end();
    } catch (error) {
      logger.error('Comparison PDF Generation Error:', error);
      reject(error);
    }
  });
}
