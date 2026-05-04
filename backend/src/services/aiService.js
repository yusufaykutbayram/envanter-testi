import db from '../database.js';
import logger from '../utils/logger.js';

export async function analyzePersonality(name, age, scores, position, department) {
  try {
    const combinedAnalysis = {
      summary: '',
      strengths: [],
      weaknesses: [],
      work_style: '',
      stress_behavior: '',
      recommendations: []
    };

    const traits = ['O', 'C', 'E', 'A', 'N'];
    const traitNames = {
      'O': 'Deneyime Açıklık',
      'C': 'Sorumluluk',
      'E': 'Dışadönüklük',
      'A': 'Uyumluluk',
      'N': 'Duygusal Denge'
    };

    for (const traitCode of traits) {
      const score = scores[traitCode];
      let level = 'medium';
      if (score >= 40) level = 'high';
      else if (score <= 20) level = 'low';

      // Supabase query
      const { data: template, error } = await db
        .from('analysis_templates')
        .select('*')
        .eq('trait', traitCode)
        .eq('level', level)
        .single();

      if (error) {
          logger.warn(`Template not found for ${traitCode}-${level}:`, error.message);
          continue; 
      }

      if (template) {
        combinedAnalysis.summary += `${template.summary} `;
        combinedAnalysis.strengths.push(...(template.strengths || []));
        combinedAnalysis.weaknesses.push(...(template.weaknesses || []));
        
        if (template.work_style) combinedAnalysis.work_style = template.work_style;
        if (template.stress_behavior) combinedAnalysis.stress_behavior = template.stress_behavior;
        
        combinedAnalysis.recommendations.push(...(template.recommendations || []));
      }
    }

    // Deduplicate and cleanup
    combinedAnalysis.strengths = [...new Set(combinedAnalysis.strengths)].slice(0, 5);
    combinedAnalysis.weaknesses = [...new Set(combinedAnalysis.weaknesses)].slice(0, 5);
    combinedAnalysis.recommendations = [...new Set(combinedAnalysis.recommendations)].slice(0, 5);

    return combinedAnalysis;
  } catch (error) {
    logger.error('Personality Analysis Error:', error);
    // Return a fallback object so the system doesn't crash
    return {
      summary: 'Analiz oluşturulurken bir teknik aksaklık yaşandı.',
      strengths: ['Veri alınamadı'],
      weaknesses: ['Veri alınamadı'],
      work_style: 'Bilinmiyor',
      stress_behavior: 'Bilinmiyor',
      recommendations: ['Lütfen daha sonra tekrar deneyiniz.']
    };
  }
}
