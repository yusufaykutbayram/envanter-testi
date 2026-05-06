import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from 'recharts';
import { adminApi } from '../services/api';

const PIE_COLORS = ['#7c3aed', '#0891b2', '#059669'];

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    adminApi.dashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Yükleniyor...</div>;
  if (!data)   return <div className="admin-error">Veri yüklenemedi</div>;

  const barData = [
    { name: 'Dışadönüklük', value: data.avgScores?.avg_e || 0 },
    { name: 'Uyumluluk',    value: data.avgScores?.avg_a || 0 },
    { name: 'Sorumluluk',   value: data.avgScores?.avg_c || 0 },
    { name: 'Duygusal D.',  value: data.avgScores?.avg_n || 0 },
    { name: 'Açıklık',      value: data.avgScores?.avg_o || 0 },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{data.totalTests}</div>
          <div className="stat-label">Toplam Test</div>
        </div>
        {data.positionDistribution?.map((p) => (
          <div key={p.position} className="stat-card">
            <div className="stat-number">{p.count}</div>
            <div className="stat-label">{p.position}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Ortalama Kişilik Skorları</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} / 100`]} />
              <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Pozisyon Dağılımı</h3>
          {data.positionDistribution?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.positionDistribution}
                  dataKey="count"
                  nameKey="position"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.positionDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">Henüz test yapılmamış</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Son Yapılan Testler</h3>
        {data.recentTests?.length > 0 ? (
        <div className="table-responsive" style={{ minWidth: 'auto' }}>
          <table className="admin-table" style={{ minWidth: '600px' }}>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>Yaş</th>
                <th>Pozisyon</th>
                <th>Tarih</th>
                <th className="td-actions"></th>
              </tr>
            </thead>
            <tbody>
              {data.recentTests.map((p) => (
                <tr key={p.id}>
                  <td className="td-name">{p.name}</td>
                  <td>{p.age}</td>
                  <td>
                    <span className="badge badge-gray">{p.position}</span>
                  </td>
                  <td>{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                  <td className="td-actions">
                    <button
                      className="btn btn-sm"
                      onClick={() => navigate(`/admin/personnel/${p.id}`)}
                    >
                      Detay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <p className="no-data">Henüz test yapılmamış</p>
        )}
      </div>
    </div>
  );
}
