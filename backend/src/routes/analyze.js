import { Router } from 'express';
import { calculateScores, calculateSuitability } from '../services/scoring.js';
import { analyzePersonality } from '../services/aiService.js';
import db from '../database.js';

const router = Router();

router.post('/analyze', async (req, res, next) => {
  try {
    const { name, age, employeeId, department, position, answers } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2)
      return res.status(400).json({ error: 'Geçerli bir ad soyad giriniz' });
    if (!age || isNaN(age) || Number(age) < 16 || Number(age) > 70)
      return res.status(400).json({ error: 'Geçerli bir yaş giriniz (16-70)' });
    if (!department)
      return res.status(400).json({ error: 'Departman seçimi zorunludur' });
    if (!position)
      return res.status(400).json({ error: 'Pozisyon seçimi zorunludur' });
    if (!answers || typeof answers !== 'object')
      return res.status(400).json({ error: 'Yanıtlar eksik' });
    if (Object.keys(answers).length !== 50)
      return res.status(400).json({ error: 'Tüm 50 soruyu yanıtlamanız gereklidir' });

    const scores = calculateScores(answers);
    const suitability = calculateSuitability(scores, position, department);
    const aiAnalysis = await analyzePersonality(name.trim(), Number(age), scores, position, department);

    const { data: result, error } = await db.from('personnel').insert({
      name: name.trim(),
      age: Number(age),
      employee_id: employeeId?.trim() || null,
      department,
      e_score: scores.E,
      a_score: scores.A,
      c_score: scores.C,
      n_score: scores.N,
      o_score: scores.O,
      position,
      ai_summary: aiAnalysis.summary || '',
      ai_strengths: aiAnalysis.strengths || [],
      ai_weaknesses: aiAnalysis.weaknesses || [],
      ai_work_style: aiAnalysis.work_style || '',
      ai_stress_behavior: aiAnalysis.stress_behavior || '',
      ai_job_fit: `${suitability.label} (%${suitability.score})`,
      ai_recommendations: aiAnalysis.recommendations || []
    }).select(); // Removed .single() to avoid failure if multiple rows (unlikely but safer)

    if (error) {
      logger.error('Supabase Insert Error:', error);
      throw error;
    }

    res.json({
      id: result?.[0]?.id || null,
      scores,
      backendPosition: position,
      aiAnalysis,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
