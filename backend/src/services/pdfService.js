import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import logger from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Font Loading (Turkish character support) ──────────────────────────────────
let fontRegular = null;
let fontBold = null;

// jsDelivr fontsource TTF subset URL'leri (latin-ext = Türkçe dahil)
const FONT_URLS = {
  regular: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-ext-400-normal.ttf',
  bold:    'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-ext-700-normal.ttf',
};

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function loadFonts() {
  if (fontRegular && fontBold) return;
  try {
    const localReg = join(__dirname, '../fonts/Roboto-Regular.ttf');
    const localBold = join(__dirname, '../fonts/Roboto-Bold.ttf');
    if (existsSync(localReg) && existsSync(localBold)) {
      fontRegular = readFileSync(localReg);
      fontBold = readFileSync(localBold);
      logger.info('Fonts loaded from local files (Turkish charset ready)');
      return;
    }
    // Yerel dosya yoksa jsDelivr'dan çek (Türkçe latin-ext subset)
    logger.info('Local fonts not found, fetching from jsDelivr CDN...');
    [fontRegular, fontBold] = await Promise.all([
      fetchBuffer(FONT_URLS.regular),
      fetchBuffer(FONT_URLS.bold),
    ]);
    logger.info('Fonts loaded from jsDelivr CDN (Turkish charset ready)');
  } catch (err) {
    logger.warn('Roboto font unavailable, falling back to Helvetica (Turkish chars may break): ' + err.message);
    fontRegular = null;
    fontBold = null;
  }
}

function reg(doc) {
  return fontRegular ? doc.font(fontRegular) : doc.font('Helvetica');
}
function bold(doc) {
  return fontBold ? doc.font(fontBold) : doc.font('Helvetica-Bold');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const COLORS = {
  red: '#e31e24', dark: '#0f172a', text: '#1e293b',
  gray: '#64748b', light: '#f1f5f9', border: '#e2e8f0',
};
const PALETTE = ['#e31e24', '#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

function safeStr(val, fb = '—') {
  if (val == null) return fb;
  return String(val);
}

function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; }
    catch { return val.split('\n').filter(Boolean); }
  }
  return [];
}

function drawHeader(doc, subtitle) {
  bold(doc).fillColor(COLORS.red).fontSize(22).text('BORSAN AKADEMI', 50, 45);
  reg(doc).fillColor(COLORS.gray).fontSize(11).text(subtitle, 50, 72);
  doc.fillColor(COLORS.red).rect(50, 88, 495, 3).fill();
}

function drawFooter(doc) {
  const { start, count } = doc.bufferedPageRange();
  for (let i = 0; i < count; i++) {
    doc.switchToPage(start + i);
    reg(doc).fillColor(COLORS.gray).fontSize(9)
      .text(
        `Borsan Akademi Envanter Analiz Sistemi  |  Sayfa ${i + 1} / ${count}  |  © ${new Date().getFullYear()}`,
        50, 800, { align: 'center', width: 495 }
      );
    doc.fillColor(COLORS.border).rect(50, 796, 495, 1).fill();
  }
}

function sectionHeader(doc, title, color, y) {
  doc.fillColor(color || COLORS.dark).rect(50, y, 495, 20).fill();
  bold(doc).fillColor('#ffffff').fontSize(11).text('  ' + title, 50, y + 4, { width: 495 });
  return y + 26;
}

function drawScoreBar(doc, label, score, color, x, y, w) {
  const barW = w || 200;
  const filled = Math.max(0, Math.round((score / 100) * barW));
  reg(doc).fillColor(COLORS.gray).fontSize(9).text(label, x, y);
  doc.fillColor(COLORS.light).roundedRect(x, y + 13, barW, 8, 4).fill();
  if (filled > 0) doc.fillColor(color).roundedRect(x, y + 13, filled, 8, 4).fill();
  bold(doc).fillColor(COLORS.text).fontSize(9).text(String(score), x + barW + 5, y + 12);
}

function generateRadarSVG(people) {
  const size = 320, center = 160, radius = 115;
  const factors = ['e', 'a', 'c', 'n', 'o'];
  const labels = ['Disadonukluk', 'Uyumluluk', 'Sorumluluk', 'Duy. Denge', 'Den. Aciklik'];

  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  [0.25, 0.5, 0.75, 1].forEach(r => {
    svg += `<circle cx="${center}" cy="${center}" r="${radius * r}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
  });
  [25, 50, 75, 100].forEach(v => {
    svg += `<text x="${center + 3}" y="${center - radius * (v / 100) + 4}" font-size="7" fill="#94a3b8">${v}</text>`;
  });
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
    svg += `<polygon points="${pts}" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2"/>`;
    factors.forEach((f, i) => {
      const s = Number(p[`${f}_score`]) || 0;
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      svg += `<circle cx="${center + radius * (s / 100) * Math.cos(a)}" cy="${center + radius * (s / 100) * Math.sin(a)}" r="3" fill="${color}"/>`;
    });
  });
  svg += '</svg>';
  return svg;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONNEL REPORT
// ─────────────────────────────────────────────────────────────────────────────
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

      // Info box
      doc.fillColor(COLORS.light).roundedRect(50, 110, 270, 120, 8).fill();
      bold(doc).fillColor(COLORS.text).fontSize(12).text('Personel Bilgileri', 65, 122);
      const fields = [
        ['Ad Soyad', safeStr(person.name)],
        ['Pozisyon', safeStr(person.position)],
        ['Departman', safeStr(person.department)],
        ['Sicil No', safeStr(person.employee_id)],
        ['Yas', safeStr(person.age)],
      ];
      fields.forEach(([lbl, val], i) => {
        reg(doc).fillColor(COLORS.gray).fontSize(9).text(lbl + ':', 65, 140 + i * 18);
        bold(doc).fillColor(COLORS.text).fontSize(9).text(val, 155, 140 + i * 18);
      });

      // Fit card
      const fitRaw = safeStr(person.ai_job_fit, '');
      const fitNum = fitRaw.match(/\d+/)?.[0] || '—';
      doc.fillColor(COLORS.dark).roundedRect(340, 110, 205, 120, 8).fill();
      reg(doc).fillColor('#94a3b8').fontSize(9).text('Pozisyon Uygunlugu', 340, 126, { width: 205, align: 'center' });
      bold(doc).fillColor('#ffffff').fontSize(42).text(`${fitNum}${fitNum !== '—' ? '%' : ''}`, 340, 140, { width: 205, align: 'center' });

      // Score bars
      let by = 248;
      bold(doc).fillColor(COLORS.text).fontSize(12).text('Envanter Puanlari', 50, by);
      by += 18;
      const traits = [
        { label: 'Disadonukluk (E)', key: 'e_score', color: PALETTE[0] },
        { label: 'Uyumluluk (A)', key: 'a_score', color: PALETTE[2] },
        { label: 'Sorumluluk (C)', key: 'c_score', color: PALETTE[3] },
        { label: 'Duygusal Denge (N)', key: 'n_score', color: PALETTE[4] },
        { label: 'Deneyime Aciklik (O)', key: 'o_score', color: PALETTE[5] },
      ];
      traits.forEach((t, i) => {
        const col = i < 3 ? 0 : 1;
        const row = i < 3 ? i : i - 3;
        drawScoreBar(doc, t.label, Number(person[t.key]) || 0, t.color, 50 + col * 270, by + row * 36, 210);
      });

      // Radar
      bold(doc).fillColor(COLORS.text).fontSize(12).text('Kisilik Profil Grafigi', 50, 420);
      SVGtoPDF(doc, generateRadarSVG([person]), 125, 440, { width: 295, height: 295 });

      // PAGE 2: Analysis
      doc.addPage();
      drawHeader(doc, 'Kisilik Envanteri - Uzman Analiz Raporu');
      let y = 110;

      // Summary
      y = sectionHeader(doc, 'Genel Degerlendirme', COLORS.dark, y);
      const summary = safeStr(person.ai_summary, 'Analiz bilgisi bulunamadi.');
      reg(doc).fillColor(COLORS.text).fontSize(10).text(summary, 55, y, { width: 485, lineGap: 3, align: 'justify' });
      y += doc.heightOfString(summary, { width: 485 }) + 18;

      // Strengths
      const strengths = safeArray(person.ai_strengths);
      if (strengths.length > 0) {
        y = sectionHeader(doc, 'Guclu Yonler', '#16a34a', y);
        strengths.forEach(s => {
          doc.fillColor('#16a34a').circle(58, y + 5, 3).fill();
          reg(doc).fillColor(COLORS.text).fontSize(10).text(safeStr(s), 68, y, { width: 472, lineGap: 2 });
          y += doc.heightOfString(safeStr(s), { width: 472 }) + 6;
        });
        y += 8;
      }

      // Weaknesses
      const weaknesses = safeArray(person.ai_weaknesses);
      if (weaknesses.length > 0) {
        y = sectionHeader(doc, 'Gelisim Alanlari', '#dc2626', y);
        weaknesses.forEach(w => {
          doc.fillColor('#dc2626').circle(58, y + 5, 3).fill();
          reg(doc).fillColor(COLORS.text).fontSize(10).text(safeStr(w), 68, y, { width: 472, lineGap: 2 });
          y += doc.heightOfString(safeStr(w), { width: 472 }) + 6;
        });
        y += 8;
      }

      // Work style
      const ws = safeStr(person.ai_work_style, '');
      if (ws && ws !== '—') {
        y = sectionHeader(doc, 'Calisma Stili', COLORS.dark, y);
        reg(doc).fillColor(COLORS.text).fontSize(10).text(ws, 55, y, { width: 485, lineGap: 3 });
        y += doc.heightOfString(ws, { width: 485 }) + 18;
      }

      // Recommendations
      const recs = safeArray(person.ai_recommendations);
      if (recs.length > 0) {
        y = sectionHeader(doc, 'Oneriler', '#0369a1', y);
        recs.forEach((r, ri) => {
          bold(doc).fillColor(COLORS.text).fontSize(10).text(`${ri + 1}.`, 55, y, { continued: true });
          reg(doc).text(`  ${safeStr(r)}`, { width: 470, lineGap: 2 });
          y += doc.heightOfString(safeStr(r), { width: 460 }) + 6;
        });
      }

      drawFooter(doc);
      doc.end();
    } catch (err) {
      logger.error('Personnel PDF error:', err);
      reject(err);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARISON REPORT
// ─────────────────────────────────────────────────────────────────────────────
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

      // People list
      y = sectionHeader(doc, 'Karsilastirilan Personeller', COLORS.dark, y);
      people.forEach((p, i) => {
        const color = PALETTE[i % PALETTE.length];
        doc.fillColor(color).rect(50, y, 5, 30).fill();
        bold(doc).fillColor(COLORS.dark).fontSize(11).text(safeStr(p.name), 64, y + 2);
        reg(doc).fillColor(COLORS.gray).fontSize(9).text(`${safeStr(p.position)}  |  ${safeStr(p.department, 'Genel')}  |  ${safeStr(p.age)} yas`, 64, y + 17);
        y += 38;
      });
      y += 10;

      // Radar
      bold(doc).fillColor(COLORS.text).fontSize(12).text('Kisilik Profil Karsilastirmasi', 50, y);
      y += 16;
      SVGtoPDF(doc, generateRadarSVG(people), 110, y, { width: 320, height: 320 });

      // Legend
      let lx = 50, ly = y + 326;
      people.forEach((p, i) => {
        doc.fillColor(PALETTE[i % PALETTE.length]).roundedRect(lx, ly, 12, 12, 2).fill();
        reg(doc).fillColor(COLORS.text).fontSize(9).text(safeStr(p.name), lx + 16, ly + 1);
        lx += 16 + safeStr(p.name).length * 5.5 + 14;
        if (lx > 470) { lx = 50; ly += 18; }
      });
      y = ly + 22;

      // Score table
      if (y > 680) { doc.addPage(); drawHeader(doc, 'Personel Karsilastirma Raporu'); y = 110; }
      y = sectionHeader(doc, 'Puan Karsilastirma Tablosu', COLORS.dark, y);

      const traitDefs = [
        { label: 'Disadonukluk', key: 'e_score' },
        { label: 'Uyumluluk', key: 'a_score' },
        { label: 'Sorumluluk', key: 'c_score' },
        { label: 'Duy. Denge', key: 'n_score' },
        { label: 'Den. Aciklik', key: 'o_score' },
      ];

      doc.fillColor(COLORS.light).rect(50, y, 495, 16).fill();
      bold(doc).fillColor(COLORS.gray).fontSize(8).text('OZELLIK', 55, y + 4);
      people.forEach((p, i) => {
        doc.fillColor(PALETTE[i % PALETTE.length]).fontSize(8).text(safeStr(p.name).split(' ')[0], 155 + i * 75, y + 4);
      });
      y += 18;

      traitDefs.forEach((t, ti) => {
        if (ti % 2 === 0) doc.fillColor('#f8fafc').rect(50, y, 495, 18).fill();
        reg(doc).fillColor(COLORS.text).fontSize(9).text(t.label, 55, y + 4);
        people.forEach((p, i) => {
          const score = Number(p[t.key]) || 0;
          bold(doc).fillColor(PALETTE[i % PALETTE.length]).fontSize(9).text(String(score), 155 + i * 75, y + 4);
        });
        y += 18;
      });

      // PAGE 2 — only if there's content
      const hasFit = fitAnalysis && fitAnalysis.length > 0;
      const hasRec = !!recommendation;
      const hasAnalysis = analysis && analysis.length > 0;

      if (hasFit || hasRec || hasAnalysis) {
        doc.addPage();
        drawHeader(doc, 'Personel Karsilastirma Raporu');
        y = 110;

        // Fit scores
        if (hasFit) {
          y = sectionHeader(doc, 'Pozisyon Uyum Analizi', COLORS.dark, y);
          fitAnalysis.forEach((f, i) => {
            const score = Number(f.fitScore) || 0;
            const color = PALETTE[i % PALETTE.length];
            const isWinner = recommendation && f.id === recommendation.winnerId;
            if (isWinner) {
              doc.fillColor('#fef9c3').rect(50, y, 495, 38).fill();
              bold(doc).fillColor('#ca8a04').fontSize(8).text('EN UYGUN ADAY', 50, y + 2, { width: 490, align: 'right' });
            }
            bold(doc).fillColor(color).fontSize(11).text(safeStr(f.name), 55, y + (isWinner ? 14 : 4));
            reg(doc).fillColor(COLORS.gray).fontSize(9).text(safeStr(f.position, ''), 55, y + 24);
            const bw = 280, filled = Math.round((score / 100) * bw);
            doc.fillColor(COLORS.light).roundedRect(200, y + 12, bw, 12, 4).fill();
            if (filled > 0) doc.fillColor(color).roundedRect(200, y + 12, filled, 12, 4).fill();
            bold(doc).fillColor(COLORS.text).fontSize(10).text(`%${score}`, 490, y + 12);
            y += 46;
          });
          y += 8;
        }

        // Recommendation
        if (hasRec) {
          doc.fillColor('#f0fdf4').roundedRect(50, y, 495, 68).fill();
          doc.fillColor('#16a34a').rect(50, y, 5, 68).fill();
          bold(doc).fillColor('#16a34a').fontSize(11).text('Uzman Onerisi', 64, y + 10);
          bold(doc).fillColor(COLORS.dark).fontSize(11).text(safeStr(recommendation.winnerName), 64, y + 28);
          reg(doc).fillColor(COLORS.text).fontSize(9).text(safeStr(recommendation.reason), 64, y + 46, { width: 470 });
          y += 82;
        }

        // Group analysis
        if (hasAnalysis) {
          y += 8;
          y = sectionHeader(doc, 'Grup Dinamigi Analizi', COLORS.dark, y);
          analysis.forEach(item => {
            if (y > 720) { doc.addPage(); drawHeader(doc, 'Personel Karsilastirma Raporu'); y = 110; }
            doc.fillColor(COLORS.light).rect(50, y, 495, 16).fill();
            bold(doc).fillColor(COLORS.gray).fontSize(8).text(safeStr(item.label || item.trait || ''), 55, y + 4);
            bold(doc).fillColor(COLORS.dark).fontSize(9).text(safeStr(item.title || ''), 150, y + 4);
            y += 18;
            if (item.description) {
              reg(doc).fillColor(COLORS.text).fontSize(9).text(safeStr(item.description), 55, y, { width: 485, lineGap: 2 });
              y += doc.heightOfString(safeStr(item.description), { width: 485 }) + 4;
            }
            if (item.synergy) {
              bold(doc).fillColor('#16a34a').fontSize(8).text('Sinerji: ', 55, y, { continued: true });
              reg(doc).fillColor(COLORS.text).text(safeStr(item.synergy), { width: 475, lineGap: 2 });
              y += 14;
            }
            if (item.potential_conflict) {
              bold(doc).fillColor('#dc2626').fontSize(8).text('Dikkat: ', 55, y, { continued: true });
              reg(doc).fillColor(COLORS.text).text(safeStr(item.potential_conflict), { width: 475, lineGap: 2 });
              y += 14;
            }
            y += 12;
          });
        }
      }

      drawFooter(doc);
      doc.end();
    } catch (err) {
      logger.error('Comparison PDF error:', err);
      reject(err);
    }
  });
}
