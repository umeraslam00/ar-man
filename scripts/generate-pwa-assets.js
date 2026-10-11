import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

async function generate() {
  const svgPath = path.join(publicDir, 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. pwa-192x192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // 2. pwa-512x512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // 3. pwa-maskable-512x512.png (with safe-zone 15% padding)
  const iconPadded = await sharp(svgBuffer)
    .resize(410, 410)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    },
  })
    .composite([{ input: iconPadded, gravity: 'centre' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  // 4. apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 5. screenshot-wide.png (1280x720)
  const wideSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <rect width="1280" height="720" fill="#09090b"/>
      <circle cx="640" cy="360" r="140" fill="none" stroke="#facc15" stroke-width="4" stroke-dasharray="14 10"/>
      <line x1="0" y1="360" x2="1280" y2="360" stroke="#facc15" stroke-width="1" opacity="0.4"/>
      <line x1="640" y1="0" x2="640" y2="720" stroke="#facc15" stroke-width="1" opacity="0.4"/>
      <rect x="420" y="348" width="440" height="24" rx="4" fill="#facc15"/>
      <text x="640" y="320" fill="#fef08a" font-family="sans-serif" font-weight="bold" font-size="28" text-anchor="middle">AR TAPE: 124.5 cm / 49.0"</text>
      <text x="640" y="440" fill="#a1a1aa" font-family="sans-serif" font-size="20" text-anchor="middle">AR Ruler App: Tape Measure Cam</text>
    </svg>
  `;
  await sharp(Buffer.from(wideSvg))
    .png()
    .toFile(path.join(publicDir, 'screenshot-wide.png'));
  console.log('Created screenshot-wide.png');

  // 6. screenshot-narrow.png (720x1280)
  const narrowSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
      <rect width="720" height="1280" fill="#09090b"/>
      <circle cx="360" cy="640" r="120" fill="none" stroke="#facc15" stroke-width="4" stroke-dasharray="14 10"/>
      <line x1="0" y1="640" x2="720" y2="640" stroke="#facc15" stroke-width="1" opacity="0.4"/>
      <line x1="360" y1="0" x2="360" y2="1280" stroke="#facc15" stroke-width="1" opacity="0.4"/>
      <rect x="180" y="628" width="360" height="24" rx="4" fill="#facc15"/>
      <text x="360" y="580" fill="#fef08a" font-family="sans-serif" font-weight="bold" font-size="32" text-anchor="middle">AR TAPE: 86.4 cm</text>
      <text x="360" y="740" fill="#a1a1aa" font-family="sans-serif" font-size="22" text-anchor="middle">Mobile AR Tape Measure Cam</text>
    </svg>
  `;
  await sharp(Buffer.from(narrowSvg))
    .png()
    .toFile(path.join(publicDir, 'screenshot-narrow.png'));
  console.log('Created screenshot-narrow.png');

  console.log('All PWA assets generated successfully!');
}

generate().catch(console.error);
