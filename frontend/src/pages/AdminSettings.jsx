import { useState } from 'react';
import { adminApi } from '../services/api';

export default function AdminSettings() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Şifre en az 4 karakter olmalıdır.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await adminApi.changePassword(newPassword);
      setMessage({ type: 'success', text: 'Şifre başarıyla güncellendi. Bir sonraki girişte yeni şifreniz geçerli olacaktır.' });
      setNewPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: 'Şifre güncellenirken bir hata oluştu: ' + (err.response?.data?.error || err.message) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1 className="admin-page-title">⚙️ Ayarlar</h1>
      </div>

      <div className="card" style={{ maxWidth: '500px' }}>
        <h3 className="section-title">Admin Şifresini Değiştir</h3>
        <p className="modern-text" style={{ fontSize: '14px', marginBottom: '1.5rem', color: '#64748b' }}>
          Buradan değiştireceğiniz şifre, admin paneline giriş yaparken kullanılacaktır.
        </p>

        {message.text && (
          <div className={`alert alert-${message.type}`} style={{ 
            padding: '1rem', 
            borderRadius: 'var(--radius-sm)', 
            marginBottom: '1rem',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
          }}>
            {message.type === 'success' ? '✅' : '⚠️'} {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">Yeni Şifre</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yeni şifrenizi girin"
              required
              minLength={4}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '2px solid var(--gray-100)' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block" 
            disabled={loading}
            style={{ marginTop: '1rem' }}
          >
            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  );
}
