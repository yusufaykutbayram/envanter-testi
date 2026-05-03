import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

export default function PersonnelCompare() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef();

  const ids = searchParams.get('ids');

  useEffect(() => {
    if (!ids) {
      navigate('/admin/personnel');
      return;
    }
    fetchData();
  }, [ids]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getComparison(ids);
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    setIsExporting(true);
    try {
      await adminApi.exportPDF(ids);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert(`HATA: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <div className="admin-loading">Analiz Hazırlanıyor...</div>;
  if (!data) return <div>Hata oluştu</div>;

  // Prepare chart data
  const chartData = [
    { trait: 'Dışadönüklük', full: 50 },
    { trait: 'Uyumluluk', full: 50 },
    { trait: 'Sorumluluk', full: 50 },
    { trait: 'Duygusal Denge', full: 50 },
    { trait: 'Deneyime Açıklık', full: 50 },
  ];

  data.people.forEach((p, idx) => {
    chartData[0][p.name] = p.e_score;
    chartData[1][p.name] = p.a_score;
    chartData[2][p.name] = p.c_score;
    chartData[3][p.name] = p.n_score;
    chartData[4][p.name] = p.o_score;
  });

  return (
    <div className="admin-page" ref={reportRef}>
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Geri</button>
        <h1 className="admin-page-title">Karşılaştırma Raporu</h1>
        <button className="btn btn-primary" onClick={generatePDF} disabled={isExporting}>
          {isExporting ? '⏳ Hazırlanıyor...' : '📥 PDF Olarak İndir'}
        </button>
      </div>

      <div className="compare-grid">
        <div className="card chart-card">
          <h3>Görsel Karşılaştırma</h3>
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="trait" tick={{ fontSize: 12, fill: '#4b5563' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                {data.people.map((p, i) => (
                  <Radar
                    key={p.id}
                    name={p.name}
                    dataKey={p.name}
                    stroke={PALETTE[i % PALETTE.length]}
                    fill={PALETTE[i % PALETTE.length]}
                    fillOpacity={0.4}
                  />
                ))}
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card people-summary-card">
          <h3>Katılımcılar</h3>
          <div className="people-mini-list">
            {data.people.map((p, i) => (
              <div key={p.id} className="person-mini-item">
                <div className="color-dot" style={{ backgroundColor: PALETTE[i % PALETTE.length] }}></div>
                <div className="p-info">
                  <div className="p-name">{p.name}</div>
                  <div className="p-pos">{p.position} | {p.department} | {p.age} Yaş</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card recommendation-card">
        <div className="rec-badge">🏆 Uzman Önerisi</div>
        <h2 className="rec-winner">En Uygun Aday: {data.recommendation.winnerName}</h2>
        <p className="rec-reason">{data.recommendation.reason}</p>
        
        <div className="fit-meter-container">
          {data.fitAnalysis.map((p, i) => (
            <div key={p.id} className={`fit-bar-item ${p.id === data.recommendation.winnerId ? 'winner' : ''}`}>
              <div className="fit-bar-info">
                <div className="fit-name-wrap">
                  <div className="color-dot" style={{ backgroundColor: PALETTE[i % PALETTE.length], width: 8, height: 8 }}></div>
                  <span>{p.name}</span>
                </div>
                <strong>%{p.fitScore} Uyum</strong>
              </div>
              <div className="fit-bar-bg">
                <div 
                  className="fit-bar-fill" 
                  style={{ 
                    width: `${p.fitScore}%`, 
                    backgroundColor: PALETTE[i % PALETTE.length] 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="section-title">İlişkisel Analiz ve Grup Dinamiği</h2>
      <div className="analysis-grid">
        {data.analysis.map((item, idx) => (
          <div key={idx} className="card analysis-card">
            <div className="analysis-header">
              <span className="trait-label">{item.label}</span>
              <h4 className="analysis-title">{item.title}</h4>
            </div>
            <p className="analysis-desc">{item.description}</p>
            <div className="dynamic-box synergy">
              <strong>Sinerji:</strong> {item.synergy}
            </div>
            <div className="dynamic-box conflict">
              <strong>Olası Çatışma:</strong> {item.potential_conflict}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
