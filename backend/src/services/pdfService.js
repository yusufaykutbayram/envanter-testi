import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import logger from '../utils/logger.js';

const COLORS = {
  red: '#e31e24',
  dark: '#0f172a',
  text: '#1e293b',
  gray: '#64748b',
  light: '#f1f5f9',
  border: '#e2e8f0',
};

const PALETTE = ['#e31e24', '#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return val.split('\n').filter(Boolean); }
  }
  return [];
}

function safeStr(val, fallback = '—') {
  if (val === null || val === undefined) return fallback;
  return String(val);
}

function drawHeader(doc, subtitle) {
  doc.fillColor(COLORS.red).fontSize(22).font('Helvetica-Bold').text('BORSAN AKADEMİ', 50, 45);
  doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica').text(subtitle, 50, 72);
  doc.fillColor(COLORS.red).rect(50, 88, 495, 3).fill();
}

function drawFooter(doc) {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica')
      .text(
        `Borsan Akademi Envanter Analiz Sistemi  •  Sayfa ${i + 1} / ${pages.count}  •  © ${new Date().getFullYear()}`,
        50, 800, { align: 'center', width: 495 }
      );
    doc.fillColor(COLORS.border).rect(50, 796, 495, 1).fill();
  }
}

function generateRadarSVG(people) {
  const size = 320;
  const center = size / 2;
  const radius = size * 0.36;
  const factors = ['e', 'a', 'c', 'n', 'o'];
  const labels = ['Dışadönüklük', 'Uyumluluk', 'Sorumluluk', 'Duygusal\nDenge', 'Deneyime\nAçıklık'];

  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;

  // Bg fill
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;

  // Grid circles
  [0.25, 0.5, 0.75, 1].forEach(r => {
    svg += `<circle cx="${center}" cy="${center}" r="${radius * r}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
  });

  // Score labels on circles
  [25, 50, 75, 100].forEach(v => {
    svg += `<text x="${center + 4}" y="${center - radius * (v / 100) + 4}" font-size="7" fill="#94a3b8" font-family="Arial">${v}</text>`;
  });

  // Axis lines & labels
  factors.forEach((f, i) => {
    const angle = (Math.PI * 2 * i) / factors.length - Math.PI / 2;
    const x2 = center + radius * Math.cos(angle);
    const y2 = center + radius * Math.sin(angle);
    svg += `<line x1="${center}" y1="${center}" x2="${x2}" y2="${y2}" stroke="#cbd5e1" stroke-width="1"/>`;

    const lx = center + (radius + 28) * Math.cos(angle);
    const ly = center + (radius + 28) * Math.sin(angle);
    const lines = labels[i].split('\n');
    lines.forEach((line, li) => {
      svg += `<text x="${lx}" y="${ly + li * 10 - (lines.length - 1) * 5}" text-anchor="middle" font-size="9" fill="#475569" font-family="Arial">${line}</text>`;
    });
  });

  // Data polygons
  people.forEach((p, idx) => {
    const color = PALETTE[idx % PALETTE.length];
    const points = factors.map((f, i) => {
      const score = Number(p[`${f}_score`]) || 0;
      const angle = (Math.PI * 2 * i) / factors.length - Math.PI / 2;
      return `${center + radius * (score / 100) * Math.cos(angle)},${center + radius * (score / 100) * Math.sin(angle)}`;
    }).join(' ');
    svg += `<polygon points="${points}" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2"/>`;

    // Dots
    factors.forEach((f, i) => {
      const score = Number(p[`${f}_score`]) || 0;
      const angle = (Math.PI * 2 * i) / factors.length - Math.PI / 2;
      const dx = center + radius * (score / 100) * Math.cos(angle);
      const dy = center + radius * (score / 100) * Math.sin(angle);
      svg += `<circle cx="${dx}" cy="${dy}" r="3" fill="${color}"/>`;
    });
  });

  svg += '</svg>';
  return svg;
}

function drawScoreBar(doc, label, score, color, x, y, w) {
  const barW = w || 200;
  const filledW = Math.round((score / 100) * barW);
  doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(label, x, y);
  doc.fillColor(COLORS.light).roundedRect(x, y + 12, barW, 8, 4).fill();
  if (filledW > 0) doc.fillColor(color).roundedRect(x, y + 12, filledW, 8, 4).fill();
  doc.fillColor(COLORS.text).fontSize(9).font('Helvetica-Bold').text(`${score}`, x + barW + 5, y + 10);
}

// ─────────────────────────────────────────────────────────────────────────────
export async function generatePersonnelReportPDF(person) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // ── PAGE 1 ──
      drawHeader(doc, 'Kişilik Envanteri Bireysel Analiz Raporu');

      // Info box
      const infoTop = 110;
      doc.fillColor(COLORS.light).roundedRect(50, infoTop, 270, 120, 8).fill();
      doc.fillColor(COLORS.text).fontSize(13).font('Helvetica-Bold').text('Personel Bilgileri', 65, infoTop + 12);
      const fields = [
        ['Ad Soyad', safeStr(person.name)],
        ['Pozisyon', safeStr(person.position)],
        ['Departman', safeStr(person.department)],
        ['Sicil No', safeStr(person.employee_id)],
        ['Yaş', safeStr(person.age)],
      ];
      fields.forEach(([label, val], i) => {
        const fy = infoTop + 30 + i * 18;
        doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(label + ':', 65, fy);
        doc.fillColor(COLORS.text).fontSize(9).font('Helvetica-Bold').text(val, 155, fy);
      });

      // Fit score card
      const fitRaw = safeStr(person.ai_job_fit, '');
      const fitNum = fitRaw.match(/\d+/)?.[0] || '—';
      doc.fillColor(COLORS.dark).roundedRect(340, infoTop, 205, 120, 8).fill();
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica').text('Pozisyon Uygunluğu', 340, infoTop + 18, { width: 205, align: 'center' });
      doc.fontSize(44).font('Helvetica-Bold').text(`${fitNum}${fitNum !== '—' ? '%' : ''}`, 340, infoTop + 36, { width: 205, align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text(safeStr(person.position), 340, infoTop + 92, { width: 205, align: 'center' });

      // Scores
      const scoreTop = 248;
      doc.fillColor(COLORS.text).fontSize(12).font('Helvetica-Bold').text('Envanter Puanları', 50, scoreTop);
      const traits = [
        { label: 'Dışadönüklük (E)', key: 'e_score', color: PALETTE[0] },
        { label: 'Uyumluluk (A)', key: 'a_score', color: PALETTE[2] },
        { label: 'Sorumluluk (C)', key: 'c_score', color: PALETTE[3] },
        { label: 'Duygusal Denge (N)', key: 'n_score', color: PALETTE[4] },
        { label: 'Deneyime Açıklık (O)', key: 'o_score', color: PALETTE[5] },
      ];
      traits.forEach((t, i) => {
        const col = i < 3 ? 0 : 1;
        const row = i < 3 ? i : i - 3;
        drawScoreBar(doc, t.label, Number(person[t.key]) || 0, t.color, 50 + col * 270, scoreTop + 20 + row * 35, 210);
      });

      // Radar chart
      const chartTop = 420;
      doc.fillColor(COLORS.text).fontSize(12).font('Helvetica-Bold').text('Kişilik Profil Grafiği', 50, chartTop);
      const svg = generateRadarSVG([person]);
      SVGtoPDF(doc, svg, 125, chartTop + 18, { width: 295, height: 295 });

      // ── PAGE 2 ──
      doc.addPage();
      drawHeader(doc, 'Kişilik Envanteri — Uzman Analiz Raporu');

      let y = 110;

      // Summary
      doc.fillColor(COLORS.dark).roundedRect(50, y, 495, 18).fill();
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('  Genel Değerlendirme', 50, y + 3, { width: 495 });
      y += 24;
      const summary = safeStr(person.ai_summary, 'Analiz bilgisi bulunamadı.');
      doc.fillColor(COLORS.text).fontSize(10).font('Helvetica').text(summary, 55, y, { width: 485, lineGap: 3, align: 'justify' });
      y += doc.heightOfString(summary, { width: 485 }) + 20;

      // Strengths
      const strengths = safeArray(person.ai_strengths);
      if (strengths.length > 0) {
        doc.fillColor('#16a34a').roundedRect(50, y, 495, 18).fill();
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('  Güçlü Yönler', 50, y + 3, { width: 495 });
        y += 24;
        strengths.forEach(s => {
          doc.fillColor('#16a34a').circle(60, y + 5, 3).fill();
          doc.fillColor(COLORS.text).fontSize(10).font('Helvetica').text(safeStr(s), 70, y, { width: 470, lineGap: 2 });
          y += doc.heightOfString(safeStr(s), { width: 470 }) + 6;
        });
        y += 10;
      }

      // Weaknesses
      const weaknesses = safeArray(person.ai_weaknesses);
      if (weaknesses.length > 0) {
        doc.fillColor('#dc2626').roundedRect(50, y, 495, 18).fill();
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('  Gelişim Alanları', 50, y + 3, { width: 495 });
        y += 24;
        weaknesses.forEach(w => {
          doc.fillColor('#dc2626').circle(60, y + 5, 3).fill();
          doc.fillColor(COLORS.text).fontSize(10).font('Helvetica').text(safeStr(w), 70, y, { width: 470, lineGap: 2 });
          y += doc.heightOfString(safeStr(w), { width: 470 }) + 6;
        });
        y += 10;
      }

      // Work style
      const workStyle = safeStr(person.ai_work_style, '');
      if (workStyle && workStyle !== '—') {
        doc.fillColor(COLORS.dark).roundedRect(50, y, 495, 18).fill();
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('  Çalışma Stili', 50, y + 3, { width: 495 });
        y += 24;
        doc.fillColor(COLORS.text).fontSize(10).font('Helvetica').text(workStyle, 55, y, { width: 485, lineGap: 3 });
        y += doc.heightOfString(workStyle, { width: 485 }) + 20;
      }

      // Recommendations
      const recs = safeArray(person.ai_recommendations);
      if (recs.length > 0) {
        doc.fillColor('#0369a1').roundedRect(50, y, 495, 18).fill();
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('  Öneriler', 50, y + 3, { width: 495 });
        y += 24;
        recs.forEach((r, ri) => {
          doc.fillColor(COLORS.text).fontSize(10).font('Helvetica-Bold').text(`${ri + 1}.`, 55, y, { continued: true });
          doc.font('Helvetica').text(`  ${safeStr(r)}`, { width: 470, lineGap: 2 });
          y += doc.heightOfString(safeStr(r), { width: 460 }) + 6;
        });
      }

      drawFooter(doc);
      doc.end();
    } catch (error) {
      logger.error('PDFKit Personnel Error:', error);
      reject(error);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export async function generateComparisonPDF({ people, analysis, fitAnalysis, recommendation }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // ── PAGE 1: Kapak & Katılımcılar ──
      drawHeader(doc, 'Personel Karşılaştırma Raporu');

      let y = 110;

      // People list
      doc.fillColor(COLORS.dark).roundedRect(50, y, 495, 18).fill();
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('  Karşılaştırılan Personeller', 50, y + 3, { width: 495 });
      y += 24;

      people.forEach((p, i) => {
        const color = PALETTE[i % PALETTE.length];
        doc.fillColor(color).roundedRect(50, y, 6, 32).fill();
        doc.fillColor(COLORS.dark).fontSize(11).font('Helvetica-Bold').text(p.name, 65, y + 2);
        doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(`${p.position}  |  ${p.department || 'Genel'}  |  ${p.age} yaş`, 65, y + 17);
        y += 42;
      });

      y += 10;

      // Radar
      doc.fillColor(COLORS.text).fontSize(12).font('Helvetica-Bold').text('Kişilik Profil Karşılaştırması', 50, y);
      y += 18;
      const svg = generateRadarSVG(people);
      SVGtoPDF(doc, svg, 110, y, { width: 325, height: 325 });

      // Legend
      let legX = 50, legY = y + 330;
      people.forEach((p, i) => {
        doc.fillColor(PALETTE[i % PALETTE.length]).roundedRect(legX, legY, 12, 12, 2).fill();
        doc.fillColor(COLORS.text).fontSize(9).font('Helvetica').text(p.name, legX + 16, legY + 1);
        legX += 80 + p.name.length * 4;
        if (legX > 480) { legX = 50; legY += 18; }
      });

      // Score comparison table
      y = legY + 25;
      if (y > 700) { doc.addPage(); drawHeader(doc, 'Personel Karşılaştırma Raporu'); y = 110; }

      doc.fillColor(COLORS.dark).roundedRect(50, y, 495, 18).fill();
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('Puan Karşılaştırma Tablosu', 55, y + 3);
      y += 22;

      const traits = [
        { label: 'Dışadönüklük', key: 'e_score' },
        { label: 'Uyumluluk', key: 'a_score' },
        { label: 'Sorumluluk', key: 'c_score' },
        { label: 'Duy. Denge', key: 'n_score' },
        { label: 'Deneyime Açık.', key: 'o_score' },
      ];

      // Header row
      doc.fillColor(COLORS.light).rect(50, y, 495, 16).fill();
      doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica-Bold').text('ÖZELLİK', 55, y + 4);
      people.forEach((p, i) => {
        doc.fillColor(PALETTE[i % PALETTE.length]).fontSize(8).font('Helvetica-Bold').text(p.name.split(' ')[0], 140 + i * 80, y + 4);
      });
      y += 18;

      traits.forEach((t, ti) => {
        if (ti % 2 === 0) doc.fillColor('#f8fafc').rect(50, y, 495, 18).fill();
        doc.fillColor(COLORS.text).fontSize(9).font('Helvetica').text(t.label, 55, y + 4);
        people.forEach((p, i) => {
          const score = Number(p[t.key]) || 0;
          doc.fillColor(PALETTE[i % PALETTE.length]).fontSize(9).font('Helvetica-Bold').text(String(score), 140 + i * 80, y + 4);
        });
        y += 18;
      });

      // ── PAGE 2: Uyum analizi & öneri ──
      doc.addPage();
      drawHeader(doc, 'Personel Karşılaştırma Raporu');
      y = 110;

      // Fit scores
      if (fitAnalysis && fitAnalysis.length > 0) {
        doc.fillColor(COLORS.dark).roundedRect(50, y, 495, 18).fill();
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('  Pozisyon Uyum Analizi', 50, y + 3, { width: 495 });
        y += 28;

        fitAnalysis.forEach((f, i) => {
          const score = Number(f.fitScore) || 0;
          const color = PALETTE[i % PALETTE.length];
          const isWinner = recommendation && f.id === recommendation.winnerId;

          if (isWinner) {
            doc.fillColor('#fef9c3').roundedRect(50, y, 495, 36).fill();
            doc.fillColor('#ca8a04').fontSize(8).font('Helvetica-Bold').text('🏆 EN UYGUN ADAY', 50, y + 2, { width: 495, align: 'right' });
          }
          doc.fillColor(color).fontSize(11).font('Helvetica-Bold').text(f.name, 55, y + (isWinner ? 12 : 4));
          doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica').text(f.position || '', 55, y + 24);

          // Bar
          const barW = 280;
          const filled = Math.round((score / 100) * barW);
          doc.fillColor(COLORS.light).roundedRect(200, y + 10, barW, 14, 4).fill();
          if (filled > 0) doc.fillColor(color).roundedRect(200, y + 10, filled, 14, 4).fill();
          doc.fillColor(COLORS.text).fontSize(11).font('Helvetica-Bold').text(`%${score}`, 490, y + 10);
          y += 48;
        });
        y += 10;
      }

      // Recommendation
      if (recommendation) {
        doc.fillColor('#f0fdf4').roundedRect(50, y, 495, 70).fill();
        doc.fillColor('#16a34a').roundedRect(50, y, 5, 70).fill();
        doc.fillColor('#16a34a').fontSize(12).font('Helvetica-Bold').text('Uzman Önerisi', 65, y + 10);
        doc.fillColor(COLORS.dark).fontSize(11).font('Helvetica-Bold').text(safeStr(recommendation.winnerName), 65, y + 28);
        doc.fillColor(COLORS.text).fontSize(9).font('Helvetica').text(safeStr(recommendation.reason), 65, y + 44, { width: 470 });
        y += 85;
      }

      // Analysis cards
      if (analysis && analysis.length > 0) {
        doc.fillColor(COLORS.dark).roundedRect(50, y, 495, 18).fill();
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('  Grup Dinamiği Analizi', 50, y + 3, { width: 495 });
        y += 24;

        analysis.forEach(item => {
          if (y > 720) { doc.addPage(); drawHeader(doc, 'Personel Karşılaştırma Raporu'); y = 110; }
          doc.fillColor(COLORS.light).roundedRect(50, y, 495, 14).fill();
          doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica-Bold').text(safeStr(item.label || item.trait), 55, y + 3);
          doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica-Bold').text(safeStr(item.title), 120, y + 3);
          y += 16;
          if (item.description) {
            doc.fillColor(COLORS.text).fontSize(9).font('Helvetica').text(safeStr(item.description), 55, y, { width: 485, lineGap: 2 });
            y += doc.heightOfString(safeStr(item.description), { width: 485 }) + 4;
          }
          if (item.synergy) {
            doc.fillColor('#16a34a').fontSize(8).font('Helvetica-Bold').text('Sinerji: ', 55, y, { continued: true });
            doc.fillColor(COLORS.text).font('Helvetica').text(safeStr(item.synergy), { width: 475, lineGap: 2 });
            y += doc.heightOfString(safeStr(item.synergy), { width: 460 }) + 2;
          }
          if (item.potential_conflict) {
            doc.fillColor('#dc2626').fontSize(8).font('Helvetica-Bold').text('Dikkat: ', 55, y, { continued: true });
            doc.fillColor(COLORS.text).font('Helvetica').text(safeStr(item.potential_conflict), { width: 475, lineGap: 2 });
            y += doc.heightOfString(safeStr(item.potential_conflict), { width: 460 }) + 2;
          }
          y += 14;
        });
      }

      drawFooter(doc);
      doc.end();
    } catch (error) {
      logger.error('Comparison PDF Error:', error);
      reject(error);
    }
  });
}
