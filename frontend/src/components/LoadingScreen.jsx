export default function LoadingScreen() {
  return (
    <div className="page-center">
      <div className="loading-card">
        <div className="spinner" aria-hidden="true" />
        <h2>AI Analiz Yapıyor</h2>
        <p>Kişilik profiliniz hazırlanıyor...</p>
        <div className="loading-steps">
          <div className="loading-step done">✓ Skorlar hesaplandı</div>
          <div className="loading-step active">⟳ AI yorumu oluşturuluyor</div>
          <div className="loading-step pending">○ Rapor hazırlanıyor</div>
        </div>
      </div>
    </div>
  );
}
