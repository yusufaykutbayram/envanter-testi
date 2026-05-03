import ScoreChart from './ScoreChart';
import { factorLabels } from '../data/questions';

const POSITION_META = {
  Formen:   { icon: '⭐', color: '#7c3aed', bg: '#f5f3ff' },
  Usta:     { icon: '🔧', color: '#0891b2', bg: '#ecfeff' },
  Operatör: { icon: '⚙️', color: '#059669', bg: '#ecfdf5' },
};

export default function ResultScreen({ results, userInfo, onRestart }) {
  const { scores, backendPosition, aiAnalysis } = results;
  const meta = POSITION_META[backendPosition] || POSITION_META['Operatör'];

  return (
    <div className="result-page">
      <div className="result-container">

        {/* Header */}
        <div className="result-header">
          <h1>Analiz Raporu</h1>
          <p className="result-meta">
            {userInfo.name} · {userInfo.age} yaş
            {userInfo.employeeId && <span> · Sicil: {userInfo.employeeId}</span>}
          </p>
        </div>

        {/* Position badge */}
        <div className="card position-card" style={{ borderTop: `4px solid ${meta.color}`, background: meta.bg }}>
          <div className="position-inner">
            <span className="position-icon">{meta.icon}</span>
            <div>
              <div className="position-label">Sistem Pozisyon Önerisi</div>
              <div className="position-value" style={{ color: meta.color }}>{backendPosition}</div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="card">
          <h3 className="section-title">Kişilik Profili</h3>
          <ScoreChart scores={scores} />
          <div className="score-pills">
            {Object.entries(scores).map(([key, val]) => (
              <div key={key} className="score-pill">
                <span className="pill-name">{factorLabels[key]}</span>
                <span className="pill-val">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Summary */}
        {aiAnalysis && (
          <>
            <div className="card">
              <h3 className="section-title">🤖 Genel Analiz</h3>
              <p className="summary-text">{aiAnalysis.summary}</p>
            </div>

            <div className="two-col">
              <div className="card analysis-card strengths-card">
                <h4>✅ Güçlü Yönler</h4>
                <ul>
                  {aiAnalysis.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div className="card analysis-card weaknesses-card">
                <h4>📈 Gelişim Alanları</h4>
                <ul>
                  {aiAnalysis.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">💼 İş Ortamı Davranışı</h3>
              <p className="summary-text">{aiAnalysis.job_fit}</p>
            </div>

            <div className="card recommendation-card">
              <h4>📋 AI Pozisyon Önerisi</h4>
              <p>{aiAnalysis.recommendation}</p>
            </div>
          </>
        )}

        <button className="btn btn-ghost btn-block" onClick={onRestart} style={{ marginTop: '0.5rem' }}>
          ↺ Yeni Test Başlat
        </button>
      </div>
    </div>
  );
}
