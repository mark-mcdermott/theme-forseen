// Records the README's preview: node scripts/shoot-preview.mjs <url> <out.gif> [width] [fps]
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, out, width = '960', fps = '12'] = process.argv.slice(2);
const viewport = { width: 1180, height: 640 };
const dir = mkdtempSync(join(tmpdir(), 'tf-preview-'));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport, recordVideo: { dir, size: viewport } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('theme-forseen')?.state != null);

// The drawer earns its place by restyling the page, so the page stays in frame throughout
await page.evaluate(async () => {
  const tf = document.querySelector('theme-forseen');
  const root = tf.shadowRoot;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const rowByName = (list, name) =>
    [...root.querySelectorAll(`.${list}-list .${list.slice(0, -1)}-item`)].find((el) =>
      el.textContent.includes(name),
    );
  const pick = async (list, name, hold = 1100) => {
    const row = rowByName(list, name);
    if (!row) throw new Error(`no ${list} row named ${name}`);
    row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    await wait(420);
    row.click();
    await wait(hold);
  };

  await wait(700);
  tf.open();
  await wait(1100);

  await pick('themes', 'Executive Blue');
  await pick('themes', 'Forest Canopy');
  await pick('fonts', 'Playfair Display');
  await pick('themes', 'Deep Ocean');

  root.querySelector('.mode-btn[data-mode=dark]').click();
  await wait(1300);

  await pick('themes', 'Midnight Noir', 1500);
});

await page.close();
await browser.close();

const webm = join(dir, readdirSync(dir).find((f) => f.endsWith('.webm')));
const palette = join(dir, 'palette.png');
const scale = `fps=${fps},scale=${width}:-1:flags=lanczos`;
execFileSync('ffmpeg', ['-y', '-i', webm, '-vf', `${scale},palettegen=max_colors=128`, palette]);
execFileSync('ffmpeg', [
  '-y', '-i', webm, '-i', palette,
  '-lavfi', `${scale}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,
  '-loop', '0', out,
]);
rmSync(dir, { recursive: true, force: true });
console.log(out);
