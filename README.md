# Envanter Analiz Sistemi - Yayına Alım Rehberi

Bu proje, personel kişilik envanterlerini analiz eden ve yapay zeka desteğiyle raporlayan bir sistemdir.

## 🚀 Hızlı Başlangıç (Docker ile)

Sistemi tek bir komutla ayağa kaldırabilirsiniz:

```bash
docker-compose up --build -d
```

Bu komut:
- Frontend'i Nginx ile servis eder (Port: 80)
- Backend'i Node.js ile çalıştırır (Port: 3001)
- Veritabanını `backend/data` klasöründe saklar.

## ⚙️ Yapılandırma

### Logo Kullanımı
- Paylaştığınız logoyu `frontend/public/logo.png` olarak kaydedin. Sistem otomatik olarak tüm sayfalarda (Giriş, Test, Admin) bu logoyu kullanacaktır.

### Yeni Özellikler
- **Çift Tıklama:** Test sırasında bir seçeneğe çift tıklayarak anında sonraki soruya geçebilirsiniz.
- **Teşekkür Sayfası:** Test bitiminde kullanıcıya özel bir teşekkür sayfası gösterilir ve veriler arka planda kaydedilir.
- **Modern Tasarım:** Glassmorphism ve premium renk paleti ile tasarım tamamen yenilendi.

## 🛠️ Manuel Kurulum (Docker Olmadan)

### Backend
1. `cd backend`
2. `npm install`
3. `npm start`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run build`
4. `dist` klasörünü bir web sunucusunda (Nginx, Apache vb.) servis edin.

## 🧪 Testler
Backend testlerini çalıştırmak için:
```bash
cd backend
npm test
```

## 📂 Dosya Yapısı
- `frontend/`: React + Vite uygulaması.
- `backend/`: Express + SQLite + OpenAI entegrasyonu.
- `docker-compose.yml`: Üretim ortamı orkestrasyonu.
