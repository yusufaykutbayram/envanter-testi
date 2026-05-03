import db from '../src/database.js';
import { calculateScores, calculateSuitability } from '../src/services/scoring.js';
import { analyzePersonality } from '../src/services/aiService.js';

async function migrateAll() {
  console.log('--- Eski Kayıtları Güncelleme Başlatıldı ---');
  
  const personnel = db.prepare('SELECT * FROM personnel').all();
  console.log(`${personnel.length} kayıt bulundu.`);

  const updateStmt = db.prepare(`
    UPDATE personnel SET
      ai_summary = ?,
      ai_strengths = ?,
      ai_weaknesses = ?,
      ai_work_style = ?,
      ai_stress_behavior = ?,
      ai_job_fit = ?,
      ai_recommendations = ?
    WHERE id = ?
  `);

  for (const p of personnel) {
    try {
      // Scores were already stored, but we can re-calculate or just use them
      const scores = { E: p.e_score, A: p.a_score, C: p.c_score, N: p.n_score, O: p.o_score };
      
      // Use the newly restored template service
      const analysis = await analyzePersonality(p.name, p.age, scores, p.position, p.department || 'Üretim');
      const suitability = calculateSuitability(scores, p.position, p.department || 'Üretim');

      updateStmt.run(
        analysis.summary,
        JSON.stringify(analysis.strengths),
        JSON.stringify(analysis.weaknesses),
        analysis.work_style,
        analysis.stress_behavior,
        `${suitability.label} (%${suitability.score})`,
        JSON.stringify(analysis.recommendations),
        p.id
      );
      
      console.log(`Güncellendi: ID ${p.id} - ${p.name}`);
    } catch (err) {
      console.error(`Hata ID ${p.id}:`, err.message);
    }
  }

  console.log('--- Güncelleme Tamamlandı ---');
  process.exit(0);
}

migrateAll();
