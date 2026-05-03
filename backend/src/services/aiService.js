import logger from '../utils/logger.js';
import db from '../database.js';
import { calculateSuitability } from './scoring.js';

/**
 * Maps a score (0-100) to a level (1-10)
 */
function getLevel(score) {
  const level = Math.ceil(score / 10);
  return Math.max(1, Math.min(10, level));
}

export async function analyzePersonality(name, age, scores, position, department) {
  try {
    logger.info(`Template Library Analysis requested for ${name} (${position})`);

    const traits = ['O', 'C', 'E', 'A', 'N'];
    const combinedAnalysis = {
      summary: '',
      strengths: [],
      weaknesses: [],
      work_style: '',
      stress_behavior: '',
      job_fit: '',
      recommendations: []
    };

    for (const traitCode of traits) {
      const level = getLevel(scores[traitCode]);
      const { data: template, error } = await db
        .from('analysis_templates')
        .select('*')
        .eq('trait', traitCode)
        .eq('level', level)
        .single();

      if (template) {
        combinedAnalysis.summary += `${template.summary} `;
        combinedAnalysis.strengths.push(...(template.strengths || []));
        combinedAnalysis.weaknesses.push(...(template.weaknesses || []));
        combinedAnalysis.work_style += `${template.work_style} `;
        combinedAnalysis.recommendations.push(...(template.recommendations || []));
        
        if (traitCode === 'N') {
          combinedAnalysis.stress_behavior = template.summary;
        }
      }
    }

    // Suitability calculation for job_fit field
    const suitability = calculateSuitability(scores, position, department);
    combinedAnalysis.job_fit = `${position} pozisyonu için ${suitability.label} (%${suitability.score}). ${department} departmanı gerekliliklerine göre değerlendirilmiştir.`;

    // De-duplicate and limit lists
    combinedAnalysis.strengths = [...new Set(combinedAnalysis.strengths)].slice(0, 6);
    combinedAnalysis.weaknesses = [...new Set(combinedAnalysis.weaknesses)].slice(0, 5);
    combinedAnalysis.recommendations = [...new Set(combinedAnalysis.recommendations)].slice(0, 6);

    return combinedAnalysis;
  } catch (error) {
    logger.error(`Template Analysis Error: ${error.message}`);
    return getFallbackAnalysis(position);
  }
}

function getFallbackAnalysis(position) {
  return {
    summary: 'Kişilik envanteri sonuçlarına göre profil değerlendirmesi yapılamadı.',
    strengths: ['Veri girişi başarılı'],
    weaknesses: ['Sistem hatası'],
    work_style: 'Bilinmiyor',
    stress_behavior: 'Bilinmiyor',
    job_fit: `${position} pozisyonu için manuel değerlendirme yapınız.`,
    recommendations: ['Lütfen teknik destek alınız.']
  };
}
