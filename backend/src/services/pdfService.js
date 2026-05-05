import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import logger from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Font Loading ──────────────────────────────────────────────────────────────
let fontRegular = null;
let fontBold = null;

async function loadFonts() {
  if (fontRegular && fontBold) return;
  try {
    const localReg  = join(__dirname, '../fonts/Roboto-Regular.ttf');
    const localBold = join(__dirname, '../fonts/Roboto-Bold.ttf');
    if (existsSync(localReg) && existsSync(localBold)) {
      fontRegular = readFileSync(localReg);
      fontBold    = readFileSync(localBold);
      return;
    }
    const [r1, r2] = await Promise.all([
      fetch('https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-ext-400-normal.ttf'),
      fetch('https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-ext-700-normal.ttf'),
    ]);
    if (r1.ok && r2.ok) {
      fontRegular = Buffer.from(await r1.arrayBuffer());
      fontBold    = Buffer.from(await r2.arrayBuffer());
    }
  } catch (err) {
    logger.warn('Font fallback: ' + err.message);
  }
}

function reg(doc)  { return fontRegular ? doc.font(fontRegular) : doc.font('Helvetica'); }
function bold(doc) { return fontBold    ? doc.font(fontBold)    : doc.font('Helvetica-Bold'); }

const COLORS = {
  red: '#e31e24', dark: '#0f172a', text: '#1e293b',
  gray: '#64748b', light: '#f1f5f9', border: '#e2e8f0',
};
const PALETTE = ['#e31e24', '#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

function safeStr(val, fb = '—') { return val == null ? fb : String(val); }
function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val.split('\n').filter(Boolean); }
  }
  return [];
}

// ── Drawing Components ────────────────────────────────────────────────────────
function drawHeader(doc, subtitle) {
  bold(doc).fillColor(COLORS.red).fontSize(22).text('BORSAN AKADEMI', 50, 45);
  reg(doc).fillColor(COLORS.gray).fontSize(11).text(subtitle, 50, 72);
  doc.fillColor(COLORS.red).rect(50, 88, 495, 3).fill();
}

function drawFooter(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // Margini geçici olarak sıfırla ki footer yeni sayfa tetiklemesin
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    
    reg(doc).fillColor(COLORS.gray).fontSize(8)
      .text(
        `Borsan Akademi Envanter Analiz Sistemi  |  Sayfa ${i + 1} / ${range.count}  |  © ${new Date().getFullYear()}`,
        50, 805, { align: 'center', width: 495 }
      );
    doc.fillColor(COLORS.border).rect(50, 800, 495, 0.5).fill();
    
    doc.page.margins.bottom = oldBottom;
  }
}

function sectionHeader(doc, title, color, y) {
  doc.fillColor(color || COLORS.dark).rect(50, y, 495, 20).fill();
  bold(doc).fillColor('#ffffff').fontSize(11).text('  ' + title, 50, y + 4, { width: 495 });
  return y + 26;
}

function drawScoreBar(doc, label, score, color, x, y, w) {
  const barW = w || 200;
  const filled = Math.max(0, Math.min(barW, Math.round((score / 100) * barW)));
  reg(doc).fillColor(COLORS.gray).fontSize(9).text(label, x, y);
  doc.fillColor(COLORS.light).roundedRect(x, y + 13, barW, 8, 4).fill();
  if (filled > 0) doc.fillColor(color).roundedRect(x, y + 13, filled, 8, 4).fill();
  bold(doc).fillColor(COLORS.text).fontSize(9).text(String(score), x + barW + 5, y + 12);
}

function generateRadarSVG(people) {
  const size = 320, center = 160, radius = 115;
  const factors = ['e', 'a', 'c', 'n', 'o'];
  const labels  = ['Disadonukluk', 'Uyumluluk', 'Sorumluluk', 'Duy. Denge', 'Den. Aciklik'];
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  [0.25, 0.5, 0.75, 1].forEach(r => svg += `<circle cx="${center}" cy="${center}" r="${radius * r}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`);
  factors.forEach((f, i) => {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const x2 = center + radius * Math.cos(a), y2 = center + radius * Math.sin(a);
    svg += `<line x1="${center}" y1="${center}" x2="${x2}" y2="${y2}" stroke="#cbd5e1" stroke-width="1"/>`;
    const lx = center + (radius + 26) * Math.cos(a), ly = center + (radius + 26) * Math.sin(a);
    svg += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="9" fill="#475569" font-family="Arial">${labels[i]}</text>`;
  });
  people.forEach((p, idx) => {
    const color = PALETTE[idx % PALETTE.length];
    const pts = factors.map((f, i) => {
      const s = Number(p[`${f}_score`]) || 0;
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      return `${center + radius * (s / 100) * Math.cos(a)},${center + radius * (s / 100) * Math.sin(a)}`;
    }).join(' ');
    svg += `<polygon points="${pts}" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-width="2"/>`;
  });
  return svg + '</svg>';
}

// ── Main Functions ────────────────────────────────────────────────────────────

export async function generatePersonnelReportPDF(person) {
  await loadFonts();
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // PAGE 1
      drawHeader(doc, 'Kisilik Envanteri Bireysel Analiz Raporu');
      
      doc.fillColor(COLORS.light).roundedRect(50, 110, 270, 120, 8).fill();
      bold(doc).fillColor(COLORS.text).fontSize(12).text('Personel Bilgileri', 65, 122);
      const info = [['Ad Soyad', person.name], ['Pozisyon', person.position], ['Departman', person.department], ['Sicil No', person.employee_id], ['Yas', person.age]];
      info.forEach(([l, v], i) => {
        reg(doc).fillColor(COLORS.gray).fontSize(9).text(l + ':', 65, 140 + i * 18);
        bold(doc).fillColor(COLORS.text).fontSize(9).text(safeStr(v), 155, 140 + i * 18);
      });

      const fit = safeStr(person.ai_job_fit, '').match(/\d+/)?.[0] || '—';
      doc.fillColor(COLORS.dark).roundedRect(340, 110, 205, 120, 8).fill();
      reg(doc).fillColor('#94a3b8').fontSize(9).text('Pozisyon Uygunlugu', 340, 126, { width: 205, align: 'center' });
      bold(doc).fillColor('#ffffff').fontSize(42).text(`${fit}${fit !== '—' ? '%' : ''}`, 340, 140, { width: 205, align: 'center' });

      let by = 250;
      bold(doc).fillColor(COLORS.text).fontSize(12).text('Envanter Puanlari', 50, by);
      const traits = [
        { l: 'Disadonukluk (E)', k: 'e_score', c: PALETTE[0] },
        { l: 'Uyumluluk (A)',    k: 'a_score', c: PALETTE[2] },
        { l: 'Sorumluluk (C)',   k: 'c_score', c: PALETTE[3] },
        { l: 'Duy. Denge (N)',   k: 'n_score', c: PALETTE[4] },
        { l: 'Den. Aciklik (O)', k: 'o_score', c: PALETTE[5] },
      ];
      traits.forEach((t, i) => drawScoreBar(doc, t.l, Number(person[t.k]) || 0, t.c, 50 + (i < 3 ? 0 : 270) * 1, by + 25 + (i < 3 ? i : i - 3) * 35, 210));

      bold(doc).fillColor(COLORS.text).fontSize(12).text('Kisilik Profil Grafigi', 50, 420);
      SVGtoPDF(doc, generateRadarSVG([person]), 135, 445, { width: 300, height: 300 });

      // PAGE 2
      doc.addPage();
      drawHeader(doc, 'Kisilik Envanteri - Uzman Analiz Raporu');
      let y = 110;

      y = sectionHeader(doc, 'Genel Degerlendirme', COLORS.dark, y);
      reg(doc).fillColor(COLORS.text).fontSize(10).text(safeStr(person.ai_summary), 55, y, { width: 485, lineGap: 3 });
      y += doc.heightOfString(safeStr(person.ai_summary), { width: 485 }) + 20;

      const items = [
        { title: 'Guclu Yonler', data: safeArray(person.ai_strengths), color: '#16a34a' },
        { title: 'Gelisim Alanlari', data: safeArray(person.ai_weaknesses), color: '#dc2626' }
      ];
      items.forEach(it => {
        if (it.data.length > 0) {
          y = sectionHeader(doc, it.title, it.color, y);
          it.data.forEach(txt => {
            doc.fillColor(it.color).circle(58, y + 5, 2.5).fill();
            reg(doc).fillColor(COLORS.text).fontSize(10).text(safeStr(txt), 68, y, { width: 472 });
            y += doc.heightOfString(safeStr(txt), { width: 472 }) + 5;
          });
          y += 10;
        }
      });

      if (person.ai_work_style) {
        y = sectionHeader(doc, 'Calisma Stili', COLORS.dark, y);
        reg(doc).fillColor(COLORS.text).fontSize(10).text(safeStr(person.ai_work_style), 55, y, { width: 485 });
        y += doc.heightOfString(safeStr(person.ai_work_style), { width: 485 }) + 20;
      }

      const recs = safeArray(person.ai_recommendations);
      if (recs.length > 0) {
        y = sectionHeader(doc, 'Oneriler', '#0369a1', y);
        recs.forEach((r, i) => {
          bold(doc).fillColor(COLORS.text).fontSize(10).text(`${i + 1}.`, 55, y, { continued: true });
          reg(doc).text(`  ${safeStr(r)}`, { width: 470 });
          y += doc.heightOfString(safeStr(r), { width: 470 }) + 5;
        });
      }

      drawFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function generateComparisonPDF({ people, analysis, fitAnalysis, recommendation }) {
  await loadFonts();
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // PAGE 1
      drawHeader(doc, 'Personel Karsilastirma Raporu');
      let y = 110;
      y = sectionHeader(doc, 'Karsilastirilan Personeller', COLORS.dark, y);
      people.forEach((p, i) => {
        doc.fillColor(PALETTE[i % PALETTE.length]).rect(50, y, 5, 30).fill();
        bold(doc).fillColor(COLORS.dark).fontSize(11).text(p.name, 64, y + 2);
        reg(doc).fillColor(COLORS.gray).fontSize(9).text(`${p.position} | ${p.department}`, 64, y + 17);
        y += 38;
      });

      bold(doc).fillColor(COLORS.text).fontSize(12).text('Kisilik Profil Karsilastirmasi', 50, y + 10);
      SVGtoPDF(doc, generateRadarSVG(people), 115, y + 30, { width: 320, height: 320 });
      
      let lx = 50, ly = y + 360;
      people.forEach((p, i) => {
        doc.fillColor(PALETTE[i % PALETTE.length]).roundedRect(lx, ly, 10, 10, 2).fill();
        reg(doc).fillColor(COLORS.text).fontSize(9).text(p.name, lx + 15, ly + 1);
        lx += 150; if (lx > 450) { lx = 50; ly += 15; }
      });

      // PAGE 2
      doc.addPage();
      drawHeader(doc, 'Detayli Analiz ve Oneriler');
      y = 110;

      if (recommendation) {
        const reason = safeStr(recommendation.reason);
        const reasonHeight = doc.heightOfString(reason, { width: 465 });
        const boxHeight = reasonHeight + 50; // padding + title spaces

        doc.fillColor('#f0fdf4').roundedRect(50, y, 495, boxHeight, 8).fill();
        doc.fillColor('#16a34a').rect(50, y, 5, boxHeight).fill();
        
        bold(doc).fillColor('#16a34a').fontSize(11).text('Uzman Onerisi:', 65, y + 12);
        bold(doc).fillColor(COLORS.dark).fontSize(11).text(safeStr(recommendation.winnerName), 65, y + 28);
        reg(doc).fillColor(COLORS.text).fontSize(9).text(reason, 65, y + 43, { width: 465 });
        
        y += boxHeight + 15;
      }

      if (fitAnalysis && fitAnalysis.length) {
        y = sectionHeader(doc, 'Pozisyon Uyum Analizi', COLORS.dark, y);
        fitAnalysis.forEach((f, i) => {
          drawScoreBar(doc, f.name, f.fitScore, PALETTE[i % PALETTE.length], 55, y, 400);
          y += 35;
        });
        y += 10;
      }

      if (analysis && analysis.length) {
        y = sectionHeader(doc, 'Grup Dinamigi Analizi', COLORS.dark, y);
        analysis.forEach(item => {
          if (y > 700) { doc.addPage(); drawHeader(doc, 'Grup Dinamigi Analizi (Devam)'); y = 110; }
          bold(doc).fillColor(COLORS.dark).fontSize(10).text(item.title || item.label, 55, y);
          y += 15;
          reg(doc).fillColor(COLORS.text).fontSize(9).text(item.description, 55, y, { width: 485 });
          y += doc.heightOfString(item.description, { width: 485 }) + 10;
        });
      }

      drawFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
