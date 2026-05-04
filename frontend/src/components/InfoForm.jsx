import { useState } from 'react';

const POSITIONS = [
  "Operatör Yardımcısı",
  "Operatör",
  "Lider",
  "Vardiya Amiri",
  "Üretim Mühendisi",
  "Vardiya Mühendisi",
  "Uzman Yardımcısı",
  "Uzman",
  "Kıdemli Uzman",
  "Yönetici",
  "Müdür"
];

const DEPARTMENTS = [
  "Ar-Ge",
  "Üretim",
  "Kalite",
  "Bakım",
  "Satın Alma",
  "Satış",
  "Lojistik",
  "Muhasebe",
  "İnsan Kaynakları",
  "Dijital Dönüşüm",
  "Planlama"
];

export default function InfoForm({ onSubmit }) {
  const [form, setForm] = useState({ 
    name: '', 
    age: '', 
    employeeId: '',
    department: '',
    position: ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = 'Ad Soyad en az 2 karakter olmalıdır';
    const age = Number(form.age);
    if (!form.age || isNaN(age) || age < 16 || age > 70)
      e.age = 'Geçerli bir yaş giriniz (16–70)';
    if (!form.department) e.department = 'Lütfen departman seçiniz';
    if (!form.position) e.position = 'Lütfen pozisyon seçiniz';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({
      name:       form.name.trim(),
      age:        parseInt(form.age, 10),
      employeeId: form.employeeId.trim(),
      department: form.department,
      position:   form.position,
    });
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="page-center">
      <div className="card info-card">
        <div className="logo-container">
          <img src="/logo.png" alt="Borsan Logo" className="main-logo" />
        </div>
        <h1 className="modern-title">Kişilik Envanter Testi Analizi</h1>
        <p className="modern-text">Borsan Akademi · Kişilik Değerlendirme</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">Ad Soyad <span className="required">*</span></label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              placeholder="Örn: Ahmet Yılmaz"
              className={errors.name ? 'input-error' : ''}
              autoComplete="name"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="age">Yaş <span className="required">*</span></label>
            <input
              id="age"
              type="number"
              value={form.age}
              onChange={handleChange('age')}
              placeholder="Örn: 32"
              min="16"
              max="70"
              className={errors.age ? 'input-error' : ''}
            />
            {errors.age && <span className="field-error">{errors.age}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="department">Departman <span className="required">*</span></label>
            <select
              id="department"
              value={form.department}
              onChange={handleChange('department')}
              className={errors.department ? 'input-error' : ''}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--gray-100)' }}
            >
              <option value="">Seçiniz...</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <span className="field-error">{errors.department}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="position">Mevcut Pozisyon <span className="required">*</span></label>
            <select
              id="position"
              value={form.position}
              onChange={handleChange('position')}
              className={errors.position ? 'input-error' : ''}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--gray-100)' }}
            >
              <option value="">Seçiniz...</option>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.position && <span className="field-error">{errors.position}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="employeeId">
              Sicil No <span className="optional">(opsiyonel)</span>
            </label>
            <input
              id="employeeId"
              type="text"
              value={form.employeeId}
              onChange={handleChange('employeeId')}
              placeholder="Örn: 12345"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            Teste Başla →
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <a href="/admin/login" style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'none' }}>
            🔒 Yönetici Girişi
          </a>
        </div>
        
        <p className="info-note">Test yaklaşık 5 dakika sürer · 50 soru</p>
      </div>
    </div>
  );
}
