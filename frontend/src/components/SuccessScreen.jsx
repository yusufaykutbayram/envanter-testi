import React from 'react';

export default function SuccessScreen({ onRestart }) {
  return (
    <div className="page-center">
      <div className="card success-card modern-card">
        <div className="success-icon">✅</div>
        <h2 className="modern-title">Teşekkür Ederiz!</h2>
        <p className="modern-text">
          Cevaplarınız başarıyla kaydedilmiştir. <br />
          Katılımınız için teşekkür ederiz.
        </p>
        <div className="modern-divider"></div>
        <button 
          className="btn btn-primary btn-modern" 
          onClick={onRestart}
        >
          Yeni Test Başlat
        </button>
      </div>
    </div>
  );
}
