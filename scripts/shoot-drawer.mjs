// Captures the open drawer at the console's viewport: node scripts/shoot-drawer.mjs <url> <out.png> [dark]
import { chromium } from '@playwright/test';
const [url, out, mode] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('theme-forseen')?.state != null);
await page.evaluate(async (mode) => {
  const tf = document.querySelector('theme-forseen'); tf.open();
  const root = tf.shadowRoot;
  for (const type of ['themes', 'fonts']) {
    const tab = root.querySelector(`.column-tab[data-column-type=${type}]`);
    if (tab?.getAttribute('aria-pressed') === 'false') tab.click();
  }
  if (mode === 'dark') root.querySelector('.mode-btn[data-mode=dark]').click();
  await new Promise((r) => setTimeout(r, 1200));
}, mode);
const box = await page.evaluate(() => { const d = document.querySelector('theme-forseen').shadowRoot.querySelector('.drawer').getBoundingClientRect(); return { x: d.x, y: d.y, width: d.width, height: d.height }; });
await page.screenshot({ path: out, clip: box });
console.log(JSON.stringify(box));
await browser.close();
