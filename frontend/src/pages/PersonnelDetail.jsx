import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';

export default function PersonnelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getPersonnelDetail(id)
      .then(setP)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleExportPDF = () => {
    adminApi.exportSinglePDF(id).catch(console.error);
  };

  if (loading) return <div className="admin-page"><div className="admin-loading">Yükleniyor...</div></div>;
  if (!p) return <div className="admin-page"><p className="no-data">Personel bulunamadı.</p></div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1 className="admin-page-title">
          <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginRight: '1rem' }}>←</button>
          {p.name}
        </h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleExportPDF}>📄 PDF Rapor İndir</button>
          <div className="badge badge-lg">{p.position}</div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3>Temel Bilgiler</h3>
          <div className="info-grid">
            <div className="info-box"><label>Yaş</label> <span>{p.age}</span></div>
            <div className="info-box"><label>Sicil No</label> <span>{p.employee_id || '—'}</span></div>
            <div className="info-box"><label>Departman</label> <span>{p.department || '—'}</span></div>
            <div className="info-box"><label>Test Tarihi</label> <span>{new Date(p.created_at).toLocaleDateString('tr-TR')}</span></div>
          </div>
          <div className="suitability-banner">
             <label>Pozisyon Uygunluğu</label> 
             <div className="suitability-tag-large">{p.ai_job_fit || '—'}</div>
          </div>
        </div>

        <div className="card">
          <h3>Envanter Puanları</h3>
          <div className="scores-grid">
            <div className="score-box"><div className="score-val">{p.e_score}</div><div className="score-label">Dışadönüklük</div></div>
            <div className="score-box"><div className="score-val">{p.a_score}</div><div className="score-label">Uyumluluk</div></div>
            <div className="score-box"><div className="score-val">{p.c_score}</div><div className="score-label">Sorumluluk</div></div>
            <div className="score-box"><div className="score-val">{p.n_score}</div><div className="score-label">Duygusal Denge</div></div>
            <div className="score-box"><div className="score-val">{p.o_score}</div><div className="score-label">Deneyime Açıklık</div></div>
          </div>
        </div>
      </div>

      <div className="card ai-card">
        <h3>AI Analiz Özeti</h3>
        <p className="ai-summary-text">{p.ai_summary}</p>
        
        <div className="ai-sections">
          <div className="ai-section">
            <h4>Güçlü Yönler</h4>
            <ul>{p.ai_strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div className="ai-section">
            <h4>Gelişim Alanları</h4>
            <ul>{p.ai_weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
        </div>

        <div className="ai-section mt-4">
          <h4>Çalışma Stili</h4>
          <p>{p.ai_work_style}</p>
        </div>

        <div className="ai-section mt-4">
          <h4>Öneriler</h4>
          <ul>{p.ai_recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
