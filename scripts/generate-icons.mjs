// Genera los PNG de la PWA a partir de los SVG de public/icons usando el Edge del sistema.
// Uso: node scripts/generate-icons.mjs
import {chromium} from '@playwright/test';
import {readFileSync} from 'node:fs';

const targets = [
  { svg: 'icon.svg', out: 'icon-192.png', size: 192 },
  { svg: 'icon.svg', out: 'icon-512.png', size: 512 },
  { svg: 'icon.svg', out: 'apple-touch-icon.png', size: 180 },
  { svg: 'icon-maskable.svg', out: 'icon-maskable-512.png', size: 512 },
];

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
for (const { svg, out, size } of targets) {
  const markup = readFileSync(`public/icons/${svg}`, 'utf8');
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`);
  await page.screenshot({ path: `public/icons/${out}`, omitBackground: false });
  console.log('✓', out);
}
await browser.close();
