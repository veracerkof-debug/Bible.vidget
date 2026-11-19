// Иконки PWA из SVG (книга на тёплом фоне Melete). Запуск: node tools/make-icons.mjs
import { chromium } from 'playwright';
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#161514"/><g transform="translate(${256 - 256 * (1 - pad)} ${256 - 256 * (1 - pad)}) scale(${1 - pad})"><g transform="translate(96 96) scale(13.33)" fill="none" stroke="#C99A62" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10.5 5.2 8.2 4.6 4 4.6v13.8c4.2 0 6.5.6 8 1.9 1.5-1.3 3.8-1.9 8-1.9V4.6c-4.2 0-6.5.6-8 1.9zM12 6.5v13.8"/><path d="M12 9.2v4.6M10.1 11h3.8" stroke="#E07B39"/></g></g></svg>`;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' }); const p = await b.newPage({ deviceScaleFactor: 1 });
for (const [name, size, pad] of [['icon-192', 192, 0], ['icon-180', 180, 0], ['icon-512', 512, 0], ['icon-maskable-512', 512, 0.2]]) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<style>html,body{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg(pad)}`);
  await p.screenshot({ path: `public/icons/${name}.png` });
}
await b.close();
