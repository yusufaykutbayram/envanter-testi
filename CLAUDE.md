# Envanter Testi — Proje Yapılandırması

## Proje Hakkında
Bu proje bir envanter yönetim ve test sistemidir.

## Aktif Skills
- `inventory-demand-planning` — talep tahmini, güvenlik stoğu, yenileme planlaması
- `backend-patterns` — API ve servis mimarisi
- `database-migrations` — veritabanı şema yönetimi
- `tdd-workflow` — test güdümlü geliştirme
- `security-review` — güvenlik denetimleri

## Aktif Rules
Proje `~/.claude/rules/ecc/common/` kurallarını takip eder:
- Coding style: immutable patterns, DRY, KISS
- Testing: min %80 kapsam, TDD zorunlu
- Security: sırların hardcode edilmemesi, input validasyonu

## Dizin Yapısı
```
src/        — uygulama kaynak kodu
tests/      — birim ve entegrasyon testleri
docs/       — dokümantasyon
config/     — yapılandırma dosyaları
scripts/    — yardımcı scriptler
```

## Geliştirme Kuralları
- Kod yazmadan önce planlama yap (planner agent)
- Her değişiklikten sonra code-reviewer kullan
- Testleri önce yaz (tdd-guide agent)
- Güvenlik hassas değişikliklerde security-reviewer kullan

## Agent Pipeline
```
researcher → architect → coder → tester → reviewer
```
