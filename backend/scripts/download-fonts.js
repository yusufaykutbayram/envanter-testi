/**
 * Font Download Script
 * Roboto Regular & Bold TTF fontlarını Google Fonts'tan indirir
 * Kullanım: node scripts/download-fonts.js
 */

import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(__dirname, '../src/fonts');

if (!existsSync(fontsDir)) {
  mkdirSync(fontsDir, { recursive: true });
  console.log('✓ fonts/ klasörü oluşturuldu');
}

const fonts = [
  {
    name: 'Roboto-Regular.ttf',
    // Google Fonts API direkt TTF linki (latin-ext dahil, Türkçe destekler)
    urls: [
      'https://fonts.gstatic.com/s/roboto/v47/KFOmCnqEu92Fr1Mu7GxKOzY.ttf',
      'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-ext-400-normal.ttf',
    ]
  },
  {
    name: 'Roboto-Bold.ttf',
    urls: [
      'https://fonts.gstatic.com/s/roboto/v47/KFOlCnqEu92Fr1MmWUlfBBc9.ttf',
      'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-ext-700-normal.ttf',
    ]
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${response.statusCode}: ${url}`));
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    });

    request.setTimeout(15000, () => {
      request.destroy();
      file.close();
      reject(new Error('Timeout: ' + url));
    });

    request.on('error', (err) => {
      file.close();
      reject(err);
    });
  });
}

async function downloadWithFallback(font) {
  const dest = join(fontsDir, font.name);
  if (existsSync(dest)) {
    console.log(`✓ ${font.name} zaten mevcut, atlanıyor`);
    return;
  }
  for (const url of font.urls) {
    try {
      console.log(`  İndiriliyor: ${font.name} <- ${url}`);
      await downloadFile(url, dest);
      console.log(`✓ ${font.name} indirildi`);
      return;
    } catch (err) {
      console.warn(`  ✗ Başarısız (${err.message}), sonraki kaynak deneniyor...`);
    }
  }
  throw new Error(`${font.name} tüm kaynaklardan indirilemedi!`);
}

console.log('🔤 Roboto font dosyaları indiriliyor...\n');
Promise.all(fonts.map(downloadWithFallback))
  .then(() => console.log('\n✅ Tüm fontlar hazır!'))
  .catch(err => {
    console.error('\n❌ Hata:', err.message);
    console.log('\n💡 Manuel çözüm:');
    console.log('   https://fonts.google.com/specimen/Roboto adresinden');
    console.log('   Regular ve Bold TTF dosyalarını indirip');
    console.log('   backend/src/fonts/ klasörüne kopyalayın.');
    process.exit(1);
  });
