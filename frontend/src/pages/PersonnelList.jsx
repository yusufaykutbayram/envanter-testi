import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';

const POSITIONS = [
  "Operatör Yardımcısı", "Operatör", "Lider", "Vardiya Amiri", 
  "Üretim Mühendisi", "Vardiya Mühendisi", "Uzman Yardımcısı", 
  "Uzman", "Kıdemli Uzman", "Yönetici", "Müdür"
];

const DEPARTMENTS = [
  "Ar-Ge", "Üretim", "Kalite", "Bakım", "Satın Alma", 
  "Satış", "Lojistik", "Muhasebe", "İnsan Kaynakları", 
  "Dijital Dönüşüm", "Planlama"
];

export default function PersonnelList() {
  const [data,    setData]    = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ position: '', department: '', dateFrom: '', dateTo: '', page: 1 });
  const [selectedIds, setSelectedIds] = useState([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getPersonnel({ ...filters, limit: 20 });
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filters]);

  const setFilter = (field) => (e) =>
    setFilters((prev) => ({ ...prev, [field]: e.target.value, page: 1 }));

  const resetFilters = () =>
    setFilters({ position: '', department: '', dateFrom: '', dateTo: '', page: 1 });

  const handleExport = () => adminApi.exportExcel().catch(console.error);

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.data.map(p => p.id));
    }
  };

  const handleCompare = () => {
    if (selectedIds.length < 2) return;
    navigate(`/admin/compare?ids=${selectedIds.join(',')}`);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1 className="admin-page-title">Personel Listesi</h1>
        <div className="header-actions">
          {selectedIds.length >= 2 && (
            <button className="btn btn-primary" onClick={handleCompare}>
              📊 {selectedIds.length} Kişiyi Karşılaştır
            </button>
          )}
          <button className="btn btn-success" onClick={handleExport}>📥 Excel İndir</button>
        </div>
      </div>

      <div className="card filter-card">
        <div className="filter-row">
          <div className="form-group">
            <label>Pozisyon</label>
            <select value={filters.position} onChange={setFilter('position')}>
              <option value="">Tümü</option>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Departman</label>
            <select value={filters.department} onChange={setFilter('department')}>
              <option value="">Tümü</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Başlangıç Tarihi</label>
            <input type="date" value={filters.dateFrom} onChange={setFilter('dateFrom')} />
          </div>
          <div className="form-group">
            <label>Bitiş Tarihi</label>
            <input type="date" value={filters.dateTo} onChange={setFilter('dateTo')} />
          </div>
          <button className="btn btn-ghost" style={{ alignSelf: 'flex-end' }} onClick={resetFilters}>
            Sıfırla
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-meta">Toplam: {data.total} kayıt</div>

        {loading ? (
          <div className="admin-loading">Yükleniyor...</div>
        ) : data.data.length > 0 ? (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === data.data.length && data.data.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Ad Soyad</th>
                  <th>Yaş</th>
                  <th>Sicil No</th>
                  <th>E</th><th>A</th><th>C</th><th>N</th><th>O</th>
                  <th>Pozisyon</th>
                  <th>Departman</th>
                  <th>Tarih</th>
                  <th>AI Özeti</th>
                  <th className="td-actions"></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((p) => (
                  <tr key={p.id} className={selectedIds.includes(p.id) ? 'row-selected' : ''}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </td>
                    <td className="td-name">{p.name}</td>
                    <td>{p.age}</td>
                    <td>{p.employee_id || '—'}</td>
                    <td>{p.e_score}</td>
                    <td>{p.a_score}</td>
                    <td>{p.c_score}</td>
                    <td>{p.n_score}</td>
                    <td>{p.o_score}</td>
                    <td>
                      <span className="badge badge-gray">
                        {p.position}
                      </span>
                    </td>
                    <td>{p.department || '—'}</td>
                    <td>{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="td-summary">
                      {p.ai_summary ? p.ai_summary.substring(0, 70) + '…' : '—'}
                    </td>
                    <td className="td-actions">
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-sm"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                          onClick={() => navigate(`/admin/personnel/${p.id}`)}
                        >
                          Detay
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          style={{ color: '#ef4444', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`${p.name} kaydını silmek istediğinize emin misiniz?`)) {
                              adminApi.deletePersonnel(p.id)
                                .then(() => fetchData())
                                .catch(err => alert('Silme işlemi başarısız: ' + err.message));
                            }
                          }}
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">Kayıt bulunamadı</p>
        )}

        {data.total > 20 && (
          <div className="pagination">
            <button
              className="btn btn-sm"
              disabled={filters.page <= 1}
              onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            >
              ← Önceki
            </button>
            <span>Sayfa {filters.page} / {Math.ceil(data.total / 20)}</span>
            <button
              className="btn btn-sm"
              disabled={filters.page * 20 >= data.total}
              onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            >
              Sonraki →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
