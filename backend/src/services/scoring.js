const REVERSE_QUESTIONS = new Set([10, 20, 30, 40, 50]);

const FACTOR_RANGES = {
  E: { start: 1,  end: 10 },
  A: { start: 11, end: 20 },
  C: { start: 21, end: 30 },
  N: { start: 31, end: 40 },
  O: { start: 41, end: 50 },
};

const POSITION_MATRIX = {
  "Görevli": {
    min: { C: 60, N: 55, A: 50, O: 50 },
    weight: { C: 0.40, N: 0.30, A: 0.15, E: 0.10, O: 0.05 }
  },
  "Operatör Yardımcısı": {
    min: { C: 60, N: 55, A: 50, O: 50 },
    weight: { C: 0.40, N: 0.30, A: 0.15, E: 0.10, O: 0.05 }
  },
  "Operatör": {
    min: { C: 70, N: 60, A: 55, O: 55 },
    weight: { C: 0.45, N: 0.30, A: 0.15, E: 0.05, O: 0.05 }
  },
  "Teknisyen Yardımcısı": {
    min: { C: 65, N: 60, A: 55, O: 55 },
    weight: { C: 0.40, N: 0.30, A: 0.15, E: 0.10, O: 0.05 }
  },
  "Teknisyen": {
    min: { C: 70, N: 65, A: 60, O: 60 },
    weight: { C: 0.45, N: 0.30, A: 0.15, E: 0.05, O: 0.05 }
  },
  "Tekniker": {
    min: { C: 75, N: 65, A: 60, E: 55, O: 60 },
    weight: { C: 0.35, N: 0.25, A: 0.15, E: 0.15, O: 0.10 }
  },
  "Lider": {
    min: { C: 75, N: 65, A: 65, E: 60, O: 60 },
    weight: { C: 0.30, E: 0.25, A: 0.20, N: 0.15, O: 0.10 }
  },
  "Vardiya Amiri": {
    min: { C: 80, N: 70, A: 70, E: 65, O: 60 },
    weight: { C: 0.30, E: 0.25, N: 0.20, A: 0.15, O: 0.10 }
  },
  "Mühendis": {
    min: { C: 80, N: 70, E: 60, A: 65, O: 65 },
    weight: { C: 0.30, N: 0.25, E: 0.20, A: 0.15, O: 0.10 }
  },
  "Kıdemli Mühendis": {
    min: { C: 85, N: 75, E: 65, A: 70, O: 70 },
    weight: { C: 0.30, N: 0.20, E: 0.20, A: 0.15, O: 0.15 }
  },
  "Uzman Yardımcısı(Saha)": {
    min: { C: 65, N: 60, O: 65, A: 55, E: 50 },
    weight: { C: 0.30, O: 0.25, N: 0.20, A: 0.15, E: 0.10 }
  },
  "Uzman(Saha)": {
    min: { C: 70, N: 65, O: 70, A: 60, E: 55 },
    weight: { C: 0.30, O: 0.30, N: 0.15, A: 0.15, E: 0.10 }
  },
  "Uzman Yardımcısı(Ofis)": {
    min: { C: 65, N: 60, O: 65, A: 55, E: 50 },
    weight: { C: 0.30, O: 0.25, N: 0.20, A: 0.15, E: 0.10 }
  },
  "Uzman(Ofis)": {
    min: { C: 70, N: 65, O: 70, A: 60, E: 55 },
    weight: { C: 0.30, O: 0.30, N: 0.15, A: 0.15, E: 0.10 }
  },
  "Kıdemli Uzman": {
    min: { C: 75, N: 70, O: 75, A: 65, E: 60 },
    weight: { C: 0.30, O: 0.30, N: 0.20, A: 0.10, E: 0.10 }
  },
  "Yönetici": {
    min: { C: 80, N: 75, E: 70, A: 70, O: 70 },
    weight: { C: 0.25, E: 0.25, N: 0.20, A: 0.15, O: 0.15 }
  },
  "Müdür": {
    min: { C: 85, N: 80, E: 75, A: 70, O: 75 },
    weight: { C: 0.25, E: 0.25, N: 0.20, O: 0.15, A: 0.15 }
  }
};

const DEPT_COEFFICIENTS = {
  "Üretim": { C: 1.2, N: 1.2 },
  "Kalite": { C: 1.2, O: 1.1 },
  "Bakım": { C: 1.2, N: 1.1 },
  "Ar-Ge": { O: 1.3 },
  "Satın Alma": { A: 1.2 },
  "Satış": { E: 1.3 },
  "Lojistik": { C: 1.2 },
  "Muhasebe": { C: 1.3 },
  "İnsan Kaynakları": { A: 1.3 },
  "Dijital Dönüşüm": { O: 1.3 },
  "Planlama": { C: 1.25 }
};

function calculateScores(answers) {
  const count = Object.keys(answers).length;
  if (count !== 50) {
    throw Object.assign(new Error(`50 soru yanıtlanmalıdır. Alınan: ${count}`), { status: 400 });
  }

  const adjusted = {};
  for (let i = 1; i <= 50; i++) {
    const val = Number(answers[i]);
    if (isNaN(val) || val < 1 || val > 5) {
      throw Object.assign(new Error(`Geçersiz yanıt: soru ${i}`), { status: 400 });
    }
    adjusted[i] = REVERSE_QUESTIONS.has(i) ? 6 - val : val;
  }

  const scores = {};
  for (const [factor, { start, end }] of Object.entries(FACTOR_RANGES)) {
    let total = 0;
    for (let i = start; i <= end; i++) total += adjusted[i];
    const avgFactorScore = total / 10;
    scores[factor] = Math.round(((avgFactorScore - 1) / 4) * 100);
  }

  return scores;
}

function calculateSuitability(scores, position, department) {
  const matrix = POSITION_MATRIX[position];
  if (!matrix) return { score: 0, label: 'Bilinmeyen Pozisyon' };

  let weightedScore = 0;
  for (const [factor, weight] of Object.entries(matrix.weight)) {
    let factorValue = scores[factor];
    
    // Apply department coefficients
    const deptCoeff = DEPT_COEFFICIENTS[department];
    if (deptCoeff && deptCoeff[factor]) {
      factorValue *= deptCoeff[factor];
    }

    weightedScore += factorValue * weight;
  }

  const finalScore = Math.min(100, Math.round(weightedScore));

  let label = 'Uygun Değil';
  if (finalScore >= 85) label = 'Çok Uygun';
  else if (finalScore >= 70) label = 'Uygun';
  else if (finalScore >= 55) label = 'Geliştirilebilir';

  return { score: finalScore, label };
}

export { calculateScores, calculateSuitability };
