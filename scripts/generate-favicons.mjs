import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');
const sourceImage = path.resolve(publicDir, 'mozhi logo -bg.png');

async function generate() {
  console.log('Generating optimized favicons and brand logos from:', sourceImage);

  // Read and trim source image
  const trimmed = await sharp(sourceImage)
    .trim()
    .toBuffer();

  // 1. Master Web Logo (clean trimmed PNG)
  await sharp(trimmed)
    .resize(600, null, { withoutEnlargement: true })
    .png({ quality: 95 })
    .toFile(path.resolve(publicDir, 'logo.png'));
  
  await sharp(trimmed)
    .resize(600, null, { withoutEnlargement: true })
    .png({ quality: 95 })
    .toFile(path.resolve(publicDir, 'mozhi-logo.png'));

  // 2. Favicon 32x32 (Maximized fill)
  await sharp(trimmed)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.resolve(publicDir, 'favicon-32x32.png'));

  // 3. Favicon 16x16 (Maximized fill)
  await sharp(trimmed)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.resolve(publicDir, 'favicon-16x16.png'));

  // 4. Favicon PNG 64x64
  await sharp(trimmed)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.resolve(publicDir, 'favicon.png'));

  // 5. Apple Touch Icon 180x180 (Zoomed in on dark carbon backing)
  await sharp(trimmed)
    .resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
      background: { r: 10, g: 8, b: 7, alpha: 1 },
    })
    .png()
    .toFile(path.resolve(publicDir, 'apple-touch-icon.png'));

  // 6. App Icon 192x192 (Zoomed in)
  await sharp(trimmed)
    .resize(172, 172, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
      background: { r: 10, g: 8, b: 7, alpha: 1 },
    })
    .png()
    .toFile(path.resolve(publicDir, 'icon-192.png'));

  // 7. App Icon 512x512 (Zoomed in)
  await sharp(trimmed)
    .resize(460, 460, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 26,
      bottom: 26,
      left: 26,
      right: 26,
      background: { r: 10, g: 8, b: 7, alpha: 1 },
    })
    .png()
    .toFile(path.resolve(publicDir, 'icon-512.png'));

  // 8. Square Brand Mark for Header / UI (Clean transparent zoom)
  await sharp(trimmed)
    .resize(120, 120, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.resolve(publicDir, 'brand-mark.png'));

  console.log('All favicon assets generated successfully!');
}

generate().catch(console.error);
