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
    
    res.type('pdf');
    res.set('Content-Disposition', `attachment; filename=rapor-${person.id}.pdf`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    logger.error(error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'PDF oluşturulamadı' });
    }
  }
});

const COMPARISON_TEMPLATES = {
  E: {
    balanced: { title: "Dengeli Sosyal Enerji", description: "Grup içinde hem aktif hem de dinleyici roller dengelenmiş durumda.", synergy: "İletişim akışı düzenli ve verimli.", potential_conflict: "Belirgin bir çatışma öngörülmemektedir." },
    opposite: { title: "Zıt Sosyal Dinamikler", description: "Grupta hem çok dışa dönük hem de çok içe dönük profiller var.", synergy: "İçe dönükler derinlik katarken, dışa dönükler enerjiyi yükseltir.", potential_conflict: "İletişim hızı ve sosyalleşme ihtiyacı konusunda anlayış birliği gerekebilir." },
    similar_high: { title: "Yüksek Sosyal Sinerji", description: "Ekibin tamamı dışa dönük ve etkileşim odaklı.", synergy: "Çok hızlı iletişim ve yüksek dış motivasyon.", potential_conflict: "Sırayla dinleme ve detaylara odaklanma konusunda aksamalar olabilir." },
    similar_low: { title: "Sakin ve Odaklı Grup", description: "Ekip genel olarak içe dönük ve sessiz çalışmayı tercih ediyor.", synergy: "Yüksek konsantrasyon ve bireysel verimlilik.", potential_conflict: "Grup içi iletişim ve bilgi paylaşımı proaktif olmayabilir." }
  },
  A: {
    balanced: { title: "Uyumlu İş Birliği", description: "Ekip üyeleri makul düzeyde uzlaşmacı ve yapıcı.", synergy: "Kararlar ortak akılla ve nezaketle alınır.", potential_conflict: "Ciddi bir fikir ayrılığı beklenmiyor." },
    opposite: { title: "Eleştirel ve Uyumlu Dengesi", description: "Grupta hem çok sorgulayıcı hem de çok uyumlu kişiler var.", synergy: "Uyumlu olanlar ekibi bir arada tutarken, eleştireller hataları önler.", potential_conflict: "Sert eleştiriler uyumlu kişileri demotive edebilir." },
    similar_high: { title: "Maksimum Ekip Uyumu", description: "Tüm üyeler son derece yardımsever ve uyumlu.", synergy: "Huzurlu ve destekleyici bir çalışma ortamı.", potential_conflict: "Gerekli eleştirilerin yapılamaması 'evet efendimcilik' riskini doğurabilir." },
    similar_low: { title: "Rekabetçi Dinamik", description: "Ekip üyeleri bağımsız ve sorgulayıcı bir yapıya sahip.", synergy: "Yüksek standartlar ve sürekli gelişim arzusu.", potential_conflict: "Fikir çatışmaları ve rekabet ortamı gerginlik yaratabilir." }
  },
  C: {
    balanced: { title: "Düzenli Çalışma Akışı", description: "Disiplin ve esneklik grup içinde dengelenmiş.", synergy: "İşler zamanında biterken esneklik de korunuyor.", potential_conflict: "Yöntem farklılıkları minimal düzeydedir." },
    opposite: { title: "Sistematik ve Esnek Karma", description: "Grupta hem çok planlı hem de çok spontane çalışanlar var.", synergy: "Planlılar yapıyı kurarken, esnek olanlar kriz anlarını yönetir.", potential_conflict: "Düzen ve teslim tarihleri konusunda anlaşmazlık çıkabilir." },
    similar_high: { title: "Yüksek Disiplin Odaklı", description: "Ekibin tamamı kuralcı ve sonuç odaklı.", synergy: "Hatasız ve zamanında teslimat.", potential_conflict: "Aşırı mükemmeliyetçilik süreçleri yavaşlatabilir." },
    similar_low: { title: "Esnek ve Dinamik Yapı", description: "Ekip genel olarak kurallardan ziyade sürece odaklı.", synergy: "Hızlı değişimlere kolay adaptasyon.", potential_conflict: "Organizasyon bozukluğu ve detayların atlanması riski vardır." }
  },
  N: {
    balanced: { title: "Duygusal Dayanıklılık", description: "Grup stresle başa çıkma konusunda genel bir dengeye sahip.", synergy: "Baskı altında makul tepkiler verilir.", potential_conflict: "Duygusal tepkiler genellikle öngörülebilir." },
    opposite: { title: "Hassas ve Soğukkanlı Dengesi", description: "Grupta stres toleransı farklı olan kişiler bir arada.", synergy: "Soğukkanlı olanlar kriz anında grubu sakinleştirir.", potential_conflict: "Kaygılı üyeler baskı anında daha fazla desteğe ihtiyaç duyabilir." },
    similar_high: { title: "Yüksek Stres Direnci", description: "Ekip üyeleri duygusal olarak oldukça dayanıklı ve sakin.", synergy: "Kriz anlarında bile rasyonel karar alma.", potential_conflict: "Duygusal ihtiyaçların ve empatinin göz ardı edilmesi riski." },
    similar_low: { title: "Hassas Çalışma Grubu", description: "Grup genel olarak duygusal etkilere açık ve hassas.", synergy: "Birbirine duyarlı ve empatik bir yaklaşım.", potential_conflict: "Yüksek baskı altında ekip motivasyonu hızla düşebilir." }
  },
  O: {
    balanced: { title: "Dengeli Vizyon", description: "Yenilikçilik ve geleneksel yöntemler grup içinde harmanlanmış.", synergy: "Yeni fikirler pratik süzgeçlerden geçerek uygulanır.", potential_conflict: "Değişim hızı konusunda ortak karar alınabilir." },
    opposite: { title: "Yenilikçi ve Geleneksel Çatışması", description: "Grupta hem vizyonerler hem de korumacılar var.", synergy: "Eskinin tecrübesi ile yeninin heyecanı birleşir.", potential_conflict: "Değişim projelerinde direnç veya aşırı risk alma tartışmaları." },
    similar_high: { title: "Vizyoner Ekip", description: "Tüm üyeler değişime ve yeni fikirlere çok açık.", synergy: "Sürekli inovasyon ve yaratıcı çözümler.", potential_conflict: "Gerçeklikten kopma ve rutin işlerin aksaması riski." },
    similar_low: { title: "Gelenekçi ve Pratik Grup", description: "Ekip bilinen ve güvenli yöntemlerle çalışmayı seviyor.", synergy: "Yüksek operasyonel istikrar ve hatasızlık.", potential_conflict: "Gelişen teknolojiye veya yeni yöntemlere adaptasyon hızı yavaş kalabilir." }
  }
};

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

    const analysis = traits.map(trait => {
      const scores = people.map(p => p[trait.key]);
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

      let type = 'balanced';
      if (max - min > 30) type = 'opposite';
      else if (avg > 70) type = 'similar_high';
      else if (avg < 30) type = 'similar_low';

      const template = COMPARISON_TEMPLATES[trait.code][type];
      
      return {
        trait: trait.code, label: trait.label, type,
        title: template?.title || 'Dengeli Dağılım',
        description: template?.description || 'Grup bu özellikte dengeli.',
        synergy: template?.synergy || 'Dengeli çalışma.',
        potential_conflict: template?.potential_conflict || 'Çatışma yok.'
      };
    });

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

    const pdfBuffer = await generateComparisonPDF({ people, analysis, fitAnalysis, recommendation: { winnerName: 'Seçilenler', reason: '...' } });
    
    res.type('pdf');
    res.set('Content-Disposition', 'attachment; filename=karsilastirma.pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'PDF oluşturulamadı' });
    }
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
