// Captures a fixture page whole, drawer closed or open: node scripts/shoot-page.mjs <url> <out.png> <width> <height> [open]
import { chromium } from '@playwright/test';
const [url, out, width, height, open] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('theme-forseen')?.state != null);
if (open) {
  await page.evaluate(async () => { document.querySelector('theme-forseen').open(); await new Promise((r) => setTimeout(r, 1200)); });
}
await page.screenshot({ path: out });
await browser.close();
