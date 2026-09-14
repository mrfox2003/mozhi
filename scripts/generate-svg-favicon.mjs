import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

async function createSvg() {
  const brandBuffer = await sharp(path.resolve(publicDir, 'brand-mark.png')).png().toBuffer();
  const base64 = brandBuffer.toString('base64');

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="#0A0807"/>
  <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="#3C3125"/>
  <image href="data:image/png;base64,${base64}" x="1.5" y="1.5" width="29" height="29" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

  fs.writeFileSync(path.resolve(publicDir, 'favicon.svg'), svgContent, 'utf-8');
  console.log('SVG favicon generated with embedded brand mark!');
}

createSvg().catch(console.error);
