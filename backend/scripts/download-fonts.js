/**
 * Font Setup Script
 * DejaVu Sans fontlarını (npm paketi) src/fonts/ klasörüne kopyalar.
 * DejaVu Sans: Tam Latin Extended desteği (Türkçe ğüşıöç dahil)
 * Kullanım: node scripts/download-fonts.js
 */

import { existsSync, mkdirSync, copyFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(__dirname, '../src/fonts');
const dejavuDir = join(__dirname, '../../node_modules/dejavu-fonts-ttf/ttf');

if (!existsSync(fontsDir)) mkdirSync(fontsDir, { recursive: true });

const pairs = [
  { src: 'DejaVuSans.ttf',      dest: 'Roboto-Regular.ttf' },
  { src: 'DejaVuSans-Bold.ttf', dest: 'Roboto-Bold.ttf'    },
];

console.log('🔤 Font dosyaları hazırlanıyor...\n');
let ok = true;
for (const { src, dest } of pairs) {
  const srcPath  = join(dejavuDir, src);
  const destPath = join(fontsDir, dest);
  if (!existsSync(srcPath)) {
    console.error(`❌ Kaynak bulunamadı: ${srcPath}`);
    ok = false;
    continue;
  }
  copyFileSync(srcPath, destPath);
  const kb = Math.round(statSync(destPath).size / 1024);
  console.log(`✓ ${dest} (${kb} KB) — Türkçe karakter desteği: ğüşıöç ✅`);
}

if (ok) {
  console.log('\n✅ Fontlar hazır! PDF çıktılarında Türkçe karakterler düzgün görünecek.');
} else {
  console.error('\n❌ Hata! Önce çalıştırın: npm install dejavu-fonts-ttf --save-dev');
  process.exit(1);
}
