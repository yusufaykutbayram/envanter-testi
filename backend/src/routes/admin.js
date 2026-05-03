import { Router } from 'express';
import jwt from 'jsonwebtoken';
import * as XLSX from 'xlsx';
import fs from 'fs';
import { join } from 'path';
import { rateLimit } from 'express-rate-limit';
import db from '../database.js';
import { requireAdmin } from '../middleware/auth.js';
import { generateComparisonPDF, generatePersonnelReportPDF } from '../services/pdfService.js';
import { calculateSuitability } from '../services/scoring.js';
import logger from '../utils/logger.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Çok fazla giriş denemesi, lütfen 15 dakika bekleyiniz.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (!username || !password || username !== adminUser || password !== adminPass) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  }

  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET || 'changeme',
    { expiresIn: '8h' }
  );
  res.json({ token });
});

router.get('/reports/:filename', requireAdmin, (req, res) => {
  const { filename } = req.params;
  const filepath = join(process.cwd(), 'reports', filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Rapor bulunamadı' });
  res.sendFile(filepath);
});

router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const { count: totalTests } = await db.from('personnel').select('*', { count: 'exact', head: true });
    
    // Average scores
    const { data: allScores } = await db.from('personnel').select('e_score, a_score, c_score, n_score, o_score');
    const avgScores = { avg_e: 0, avg_a: 0, avg_c: 0, avg_n: 0, avg_o: 0 };
    if (allScores.length > 0) {
        allScores.forEach(s => {
            avgScores.avg_e += s.e_score;
            avgScores.avg_a += s.a_score;
            avgScores.avg_c += s.c_score;
            avgScores.avg_n += s.n_score;
            avgScores.avg_o += s.o_score;
        });
        Object.keys(avgScores).forEach(k => avgScores[k] = Math.round(avgScores[k] / allScores.length));
    }

    // Position distribution
    const { data: posData } = await db.from('personnel').select('position');
    const positionDistribution = [];
    const posCounts = {};
    posData?.forEach(p => posCounts[p.position] = (posCounts[p.position] || 0) + 1);
    Object.entries(posCounts).forEach(([position, count]) => positionDistribution.push({ position, count }));

    // Recent tests
    const { data: recentTests } = await db.from('personnel')
        .select('id, name, age, employee_id, position, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    res.json({ totalTests, avgScores, positionDistribution, recentTests });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Dashboard verileri alınamadı' });
  }
});

router.get('/personnel', requireAdmin, async (req, res) => {
  try {
    const { position, department, page = 1, limit = 20 } = req.query;
    let query = db.from('personnel').select('*', { count: 'exact' });

    if (position) query = query.eq('position', position);
    if (department) query = query.eq('department', department);

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw error;
    res.json({ total: count, page: Number(page), limit: Number(limit), data });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Personel listesi alınamadı' });
  }
});

router.get('/personnel/:id', requireAdmin, async (req, res) => {
  try {
    const { data: row, error } = await db.from('personnel').select('*').eq('id', req.params.id).single();
    if (error || !row) return res.status(404).json({ error: 'Personel bulunamadı' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: 'Detay alınamadı' });
  }
});

router.get('/personnel/:id/pdf', requireAdmin, async (req, res) => {
  try {
    const { data: person } = await db.from('personnel').select('*').eq('id', req.params.id).single();
    if (!person) return res.status(404).json({ error: 'Personel bulunamadı' });

    const pdfBuffer = await generatePersonnelReportPDF(person);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=rapor-${person.id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'PDF oluşturulamadı' });
  }
});

router.get('/compare', requireAdmin, async (req, res) => {
  try {
    const ids = req.query.ids?.split(',').map(Number) || [];
    const { data: people } = await db.from('personnel').select('*').in('id', ids);

    const traits = [
      { code: 'E', key: 'e_score', label: 'Dışadönüklük' },
      { code: 'A', key: 'a_score', label: 'Uyumluluk' },
      { code: 'C', key: 'c_score', label: 'Sorumluluk' },
      { code: 'N', key: 'n_score', label: 'Duygusal Denge' },
      { code: 'O', key: 'o_score', label: 'Deneyime Açıklık' }
    ];

    const analysis = await Promise.all(traits.map(async trait => {
      const scores = people.map(p => p[trait.key]);
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

      let type = 'balanced';
      if (max - min > 15) type = 'opposite';
      else if (avg > 35) type = 'similar_high';
      else if (avg < 25) type = 'similar_low';

      const { data: template } = await db.from('comparison_templates')
        .select('*').eq('trait', trait.code).eq('type', type).single();
      
      return {
        trait: trait.code, label: trait.label, type,
        title: template?.title || 'Dengeli Dağılım',
        description: template?.description || 'Grup bu özellikte dengeli.',
        synergy: template?.synergy || 'Dengeli çalışma.',
        potential_conflict: template?.potential_conflict || 'Çatışma yok.'
      };
    }));

    const fitAnalysis = people.map(p => {
      const scores = { E: p.e_score, A: p.a_score, C: p.c_score, N: p.n_score, O: p.o_score };
      const suitability = calculateSuitability(scores, p.position, p.department);
      return { id: p.id, name: p.name, fitScore: suitability.score, label: suitability.label, position: p.position };
    });

    const winner = [...fitAnalysis].sort((a, b) => b.fitScore - a.fitScore)[0];
    res.json({ people, analysis, fitAnalysis, recommendation: { winnerId: winner.id, winnerName: winner.name, reason: `${winner.name} en uygun adaydır.` } });
  } catch (error) {
    res.status(500).json({ error: 'Karşılaştırma başarısız' });
  }
});

router.get('/export/pdf', requireAdmin, async (req, res) => {
  try {
    const ids = req.query.ids?.split(',').map(Number) || [];
    const { data: people } = await db.from('personnel').select('*').in('id', ids);

    // Reuse logic from /compare (Note: In a full app, this should be refactored)
    const pdfBuffer = await generateComparisonPDF({ people, analysis: [], fitAnalysis: [], recommendation: { winnerName: 'Seçilenler', reason: '...' } });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=karsilastirma.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'PDF oluşturulamadı' });
  }
});

router.get('/export/excel', requireAdmin, async (req, res) => {
  try {
    const { data: rows } = await db.from('personnel').select('*').order('created_at', { ascending: false });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Personel');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=personel-raporu.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    res.status(500).send('Excel oluşturulamadı');
  }
});

export default router;
