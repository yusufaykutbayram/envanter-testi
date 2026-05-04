import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import logger from '../utils/logger.js';

async function getBrowser() {
  if (process.env.VERCEL) {
    logger.info('Launching browser on Vercel (Stable Mode)...');
    return await puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true,
    });
  }
  logger.info('Launching browser locally...');
  logger.info('Launching browser locally...');
  return await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // Local path adjust if needed or remove to let it find automatically
    executablePath: process.platform === 'win32' 
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
      : '/usr/bin/google-chrome'
  });
}

function generateRadarSVG(people) {
  const size = 280;
  const center = size / 2;
  const radius = size * 0.38;
  const traits = ['e_score', 'a_score', 'c_score', 'n_score', 'o_score'];
  const traitLabels = ['Dışadönüklük', 'Uyumluluk', 'Sorumluluk', 'Duygusal Denge', 'Deneyime Açıklık'];
  const palette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
  const MAX_SCORE = 100;

  const getPoint = (score, index) => {
    const angle = (index * 2 * Math.PI / traits.length) - (Math.PI / 2);
    const r = (Math.min(MAX_SCORE, Math.max(0, score)) / MAX_SCORE) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  let grid = '';
  for (let i = 1; i <= 5; i++) {
    const r = (i / 5) * radius;
    const points = traits.map((_, idx) => {
      const angle = (idx * 2 * Math.PI / traits.length) - (Math.PI / 2);
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');
    grid += `<polygon points="${points}" fill="none" stroke="#cbd5e1" stroke-width="0.5" />`;
    const angle = -Math.PI / 2;
    grid += `<text x="${center}" y="${center - r}" font-size="6" fill="#94a3b8" text-anchor="middle" dy="-2">${i * 20}</text>`;
  }

  traits.forEach((_, idx) => {
    const angle = (idx * 2 * Math.PI / traits.length) - (Math.PI / 2);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    grid += `<line x1="${center}" y1="${center}" x2="${center + radius * cos}" y2="${center + radius * sin}" stroke="#cbd5e1" stroke-width="1" />`;
    const labelR = radius + 15;
    const lx = center + labelR * cos;
    const ly = center + labelR * sin;
    let anchor = 'middle';
    if (cos > 0.2) anchor = 'start';
    else if (cos < -0.2) anchor = 'end';
    grid += `<text x="${lx}" y="${ly}" font-size="9" font-weight="700" text-anchor="${anchor}" fill="#475569" dominant-baseline="central">${traitLabels[idx]}</text>`;
  });

  let polygons = '';
  people.forEach((p, idx) => {
    const color = palette[idx % palette.length];
    const points = traits.map((trait, tIdx) => {
      const pt = getPoint(p[trait], tIdx);
      return `${pt.x},${pt.y}`;
    }).join(' ');
    polygons += `<polygon points="${points}" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" />`;
  });

  return `
    <svg width="${size + 140}" height="${size + 60}" viewBox="0 0 ${size + 140} ${size + 60}" style="margin: 0 auto; display: block;">
      <g transform="translate(70, 30)">
        ${grid}
        ${polygons}
      </g>
    </svg>
  `;
}

export async function generateComparisonPDF(data) {
  let browser;
  try {
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
    browser = await getBrowser();
    const page = await browser.newPage();
    const radarSVG = generateRadarSVG(data.people);

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #0f172a; margin: 0; padding: 30px; background: #fff; }
            @page { size: A4; margin: 0; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e31e24; padding-bottom: 15px; margin-bottom: 20px; }
            .logo { font-weight: 800; font-size: 22px; color: #e31e24; letter-spacing: -1px; }
            .report-title { text-align: right; }
            .report-title h1 { margin: 0; font-size: 18px; font-weight: 800; }
            .recommendation-card { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; border-radius: 12px; padding: 15px; margin-bottom: 20px; }
            .rec-badge { display: inline-block; padding: 3px 10px; background: #0369a1; color: white; border-radius: 99px; font-size: 10px; font-weight: 700; margin-bottom: 8px; }
            .rec-winner { font-size: 16px; font-weight: 800; margin-bottom: 8px; }
            .rec-reason { font-size: 12px; line-height: 1.5; color: #334155; }
            .fit-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
            .fit-name { width: 140px; font-weight: 600; font-size: 12px; }
            .fit-bar-bg { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
            .fit-bar-fill { height: 100%; border-radius: 4px; }
            .fit-score { width: 45px; text-align: right; font-weight: 700; font-size: 12px; }
            .visual-compare { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9; }
            .radar-chart-container { flex: 1.2; }
            .legend-container { flex: 0.8; display: flex; flex-direction: column; gap: 8px; }
            .legend-item { display: flex; align-items: center; gap: 10px; font-size: 11px; }
            .legend-color { width: 12px; height: 12px; border-radius: 3px; }
            .section-title { font-size: 15px; font-weight: 800; margin: 20px 0 12px; border-left: 4px solid #e31e24; padding-left: 10px; }
            .trait-grid { display: flex; flex-wrap: wrap; gap: 15px; justify-content: space-between; }
            .trait-card { width: 48%; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 5px; box-sizing: border-box; }
            .trait-header { font-size: 10px; font-weight: 800; color: #e31e24; text-transform: uppercase; margin-bottom: 4px; }
            .trait-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
            .trait-desc { font-size: 11px; color: #475569; margin-bottom: 10px; line-height: 1.4; }
            .dynamic-box { padding: 8px; border-radius: 6px; font-size: 10px; margin-bottom: 4px; }
            .synergy { background: #f0fdf4; color: #166534; border: 1px solid #dcfce7; }
            .conflict { background: #fff1f2; color: #991b1b; border: 1px solid #fecdd3; }
            .footer { position: fixed; bottom: 20px; left: 30px; right: 30px; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">BORSAN AKADEMİ</div>
            <div class="report-title"><h1>Personel Karşılaştırma Raporu</h1></div>
        </div>
        <div class="recommendation-card">
            <div class="rec-badge">UZMAN ÖNERİSİ</div>
            <div class="rec-winner">En Uygun Aday: ${data.recommendation.winnerName}</div>
            <p class="rec-reason">${data.recommendation.reason}</p>
            <div style="margin-top: 15px;">
                ${data.fitAnalysis.map((p, idx) => `
                    <div class="fit-row">
                        <div class="fit-name">${p.name}</div>
                        <div class="fit-bar-bg"><div class="fit-bar-fill" style="width: ${p.fitScore}%; background: ${palette[idx % palette.length]};"></div></div>
                        <div class="fit-score">%${p.fitScore}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="section-title">Görsel Karşılaştırma</div>
        <div class="visual-compare">
            <div class="radar-chart-container">${radarSVG}</div>
            <div class="legend-container">
                ${data.people.map((p, idx) => `
                    <div class="legend-item">
                        <div class="legend-color" style="background: ${palette[idx % palette.length]}"></div>
                        <div><span class="legend-name">${p.name}</span> <span class="legend-pos">(${p.position})</span></div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="section-title">İlişkisel Analiz</div>
        <div class="trait-grid">
            ${data.analysis.map(item => `
                <div class="trait-card">
                    <div class="trait-header">${item.label}</div>
                    <div class="trait-title">${item.title}</div>
                    <p class="trait-desc">${item.description}</p>
                    <div class="dynamic-box synergy"><strong>Sinerji:</strong> ${item.synergy}</div>
                    <div class="dynamic-box conflict"><strong>Olası Çatışma:</strong> ${item.potential_conflict}</div>
                </div>
            `).join('')}
        </div>
        <div class="footer">Borsan Akademi Envanter Analiz Sistemi &copy; ${new Date().getFullYear()}</div>
    </body>
    </html>
    `;
    await page.setContent(htmlContent, { waitUntil: 'networkidle2', timeout: 45000 });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

export async function generatePersonnelReportPDF(person) {
  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    const radarSVG = generateRadarSVG([person]);
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #e31e24; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-weight: 800; font-size: 24px; color: #e31e24; }
            .main-grid { display: flex; gap: 30px; margin-bottom: 30px; }
            .info-panel { flex: 1; background: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; }
            .suitability-card { flex: 1; background: #0f172a; color: white; border-radius: 16px; padding: 24px; text-align: center; }
            .suit-score { font-size: 48px; font-weight: 800; }
            .section-title { font-size: 16px; font-weight: 800; color: #e31e24; text-transform: uppercase; margin-bottom: 15px; }
            .info-item { display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 5px; margin-bottom: 10px; }
            .ai-summary { background: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 25px; font-size: 14px; }
            .ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .ai-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">BORSAN AKADEMİ</div>
            <div><h1>Kişilik Envanteri Analiz Raporu</h1></div>
        </div>
        <div class="main-grid">
            <div class="info-panel">
                <div class="section-title">Personel Bilgileri</div>
                <div class="info-item"><label>Ad Soyad:</label> <span>${person.name}</span></div>
                <div class="info-item"><label>Yaş:</label> <span>${person.age}</span></div>
                <div class="info-item"><label>Sicil No:</label> <span>${person.employee_id || '—'}</span></div>
                <div class="info-item"><label>Departman:</label> <span>${person.department || '—'}</span></div>
                <div class="info-item"><label>Pozisyon:</label> <span>${person.position}</span></div>
            </div>
            <div class="suitability-card">
                <div>Pozisyon Uygunluğu</div>
                <div class="suit-score">${person.ai_job_fit.match(/\d+/)?.[0] || '—'}%</div>
                <div>${person.ai_job_fit.split('(')[0].trim()}</div>
            </div>
        </div>
        <div style="text-align:center; margin-bottom:30px;">
            <div class="section-title">Kişilik Profili</div>
            ${radarSVG}
        </div>
        <div class="ai-content">
            <div class="section-title">Uzman Analiz Özeti</div>
            <div class="ai-summary">${person.ai_summary}</div>
            <div class="ai-grid">
                <div class="ai-box"><h4>Güçlü Yönler</h4><ul>${(person.ai_strengths || []).map(s => `<li>${s}</li>`).join('')}</ul></div>
                <div class="ai-box"><h4>Gelişim Alanları</h4><ul>${(person.ai_weaknesses || []).map(w => `<li>${w}</li>`).join('')}</ul></div>
            </div>
        </div>
        <div style="font-size:10px; color:#94a3b8; text-align:center; margin-top:50px; border-top:1px solid #eee; padding-top:10px;">
            Borsan Akademi Personel Analiz Sistemi &copy; ${new Date().getFullYear()}
        </div>
    </body>
    </html>
    `;
    await page.setContent(htmlContent, { waitUntil: 'networkidle2', timeout: 45000 });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}
