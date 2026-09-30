import { test, expect, Page } from '@playwright/test';
import {
  clearStorage,
  countFontStylesheets,
  getCSSVar,
  openDrawer,
  shadowLocator,
  waitUntilReady,
} from './helpers';

type Change = {
  mode: string;
  theme: { name: string; colors: Record<string, string> };
  fonts: { heading: string; body: string };
  open: boolean;
};

// Collects every change event that reaches the document, from before the element starts
async function recordChanges(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const changes: unknown[] = [];
    Object.assign(window, { __changes: changes });
    document.addEventListener('themeforseen:change', (event) => {
      changes.push((event as CustomEvent).detail);
    });
  });
}

async function changes(page: Page): Promise<Change[]> {
  return page.evaluate(() => (window as unknown as { __changes: Change[] }).__changes);
}

async function lastChange(page: Page): Promise<Change | undefined> {
  return (await changes(page)).at(-1);
}

async function startFresh(page: Page, path = '/tests/fixtures/'): Promise<void> {
  await page.goto(path);
  await clearStorage(page);
  await page.reload();
  await waitUntilReady(page);
}

test.describe('State', () => {
  test('reports what is applied to the page', async ({ page }) => {
    await startFresh(page);

    const state = await page.evaluate(() => document.querySelector('theme-forseen')!.state);

    expect(state).toMatchObject({
      mode: 'light',
      theme: { name: 'Electric Sunset', colors: { primary: '#FF3366', background: '#FFFFFF' } },
      fonts: { heading: 'Inter', body: 'Geist' },
      open: false,
    });
  });

  test('follows an individual font selection', async ({ page }) => {
    await startFresh(page);
    await openDrawer(page);

    await shadowLocator(page, '.font-item[data-index="2"] .individual-font.heading-font').click();

    const heading = await shadowLocator(page, '.font-item[data-index="2"] .individual-font.heading-font').getAttribute('data-font');
    const state = await page.evaluate(() => document.querySelector('theme-forseen')!.state);
    expect(state?.fonts.heading).toBe(heading);
  });
});

test.describe('Change Event', () => {
  test.beforeEach(async ({ page }) => {
    await recordChanges(page);
    await startFresh(page);
  });

  test('is announced once when the page is first painted', async ({ page }) => {
    const all = await changes(page);

    expect(all).toHaveLength(1);
    expect(all[0].theme.name).toBe('Electric Sunset');
  });

  test('is announced after the variables are on the page', async ({ page }) => {
    await page.evaluate(() => {
      document.addEventListener('themeforseen:change', () => {
        const root = document.documentElement.style;
        Object.assign(window, { __seen: [root.getPropertyValue('--color-primary'), root.getPropertyValue('--font-heading')] });
      });
    });

    await openDrawer(page);
    await shadowLocator(page, '.theme-item[data-index="1"]').click();
    await shadowLocator(page, '.font-item[data-index="1"]').click();

    const [primary, heading] = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen);
    expect(primary).toBe('#00F5FF');
    expect(heading).toContain(',');
  });

  test('reports a newly selected theme', async ({ page }) => {
    await openDrawer(page);
    await shadowLocator(page, '.theme-item[data-index="1"]').click();

    expect(await lastChange(page)).toMatchObject({
      theme: { name: 'Neon Pulse', colors: { primary: '#00F5FF' } },
      open: true,
    });
  });

  test('reports a newly selected font pairing', async ({ page }) => {
    await openDrawer(page);
    const before = (await lastChange(page))!.fonts;

    await shadowLocator(page, '.font-item[data-index="1"]').click();

    expect((await lastChange(page))!.fonts).not.toEqual(before);
  });

  test('reports a change of mode', async ({ page }) => {
    await openDrawer(page);
    await shadowLocator(page, '.mode-btn[data-mode="dark"]').click();

    expect(await lastChange(page)).toMatchObject({
      mode: 'dark',
      theme: { colors: { background: '#0F0F0F' } },
    });
  });

  test('says nothing when nothing changed', async ({ page }) => {
    await openDrawer(page);
    await shadowLocator(page, '.theme-item[data-index="1"]').click();
    const count = (await changes(page)).length;

    await shadowLocator(page, '.theme-item[data-index="1"]').click();

    expect(await changes(page)).toHaveLength(count);
  });
});

test.describe('Opening And Closing From The Page', () => {
  test.beforeEach(async ({ page }) => {
    await recordChanges(page);
    await startFresh(page);
  });

  test('open() opens the drawer and close() closes it', async ({ page }) => {
    await page.evaluate(() => document.querySelector('theme-forseen')!.open());
    await expect(shadowLocator(page, '.drawer')).toHaveClass(/open/);
    await expect(page.locator('theme-forseen')).toHaveAttribute('open', '');
    expect((await lastChange(page))!.open).toBe(true);

    await page.evaluate(() => document.querySelector('theme-forseen')!.close());
    await expect(shadowLocator(page, '.drawer')).not.toHaveClass(/open/);
    await expect(page.locator('theme-forseen')).not.toHaveAttribute('open');
    expect((await lastChange(page))!.open).toBe(false);
  });

  test('toggle() switches between the two', async ({ page }) => {
    await page.evaluate(() => document.querySelector('theme-forseen')!.toggle());
    await expect(shadowLocator(page, '.drawer')).toHaveClass(/open/);

    await page.evaluate(() => document.querySelector('theme-forseen')!.toggle());
    await expect(shadowLocator(page, '.drawer')).not.toHaveClass(/open/);
  });

  test('the open attribute opens and closes the drawer', async ({ page }) => {
    await page.evaluate(() => document.querySelector('theme-forseen')!.setAttribute('open', ''));
    await expect(shadowLocator(page, '.drawer')).toHaveClass(/open/);

    await page.evaluate(() => document.querySelector('theme-forseen')!.removeAttribute('open'));
    await expect(shadowLocator(page, '.drawer')).not.toHaveClass(/open/);
  });

  test('the open attribute follows the tab and the close button', async ({ page }) => {
    await shadowLocator(page, '.drawer-toggle').click();
    await expect(page.locator('theme-forseen')).toHaveAttribute('open', '');

    await shadowLocator(page, '.close-btn').click();
    await expect(page.locator('theme-forseen')).not.toHaveAttribute('open');
  });
});

test.describe('Mode Changed From The Page', () => {
  test.beforeEach(async ({ page }) => {
    await recordChanges(page);
    await startFresh(page);
  });

  test('darkmode-change repaints the page while the drawer is closed', async ({ page }) => {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('darkmode-change', { detail: { dark: true } })));

    expect(await getCSSVar(page, '--color-bg')).toBe('#0F0F0F');
    expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe('dark');
    expect((await lastChange(page))!.mode).toBe('dark');
  });

  test('a color-scheme set on the root repaints the page while the drawer is closed', async ({ page }) => {
    await page.evaluate(() => { document.documentElement.style.colorScheme = 'dark'; });

    await expect.poll(() => getCSSVar(page, '--color-bg')).toBe('#0F0F0F');
  });

  test('a mode changed from the page survives a reload', async ({ page }) => {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('darkmode-change', { detail: { dark: true } })));

    await page.reload();
    await waitUntilReady(page);

    expect(await getCSSVar(page, '--color-bg')).toBe('#0F0F0F');
  });
});

test.describe('Named Defaults', () => {
  test('a first visit gets the named theme and pairing', async ({ page }) => {
    await startFresh(page, '/tests/fixtures/defaults');

    expect(await getCSSVar(page, '--color-bg')).toBe('#ECDFC9');
    expect(await getCSSVar(page, '--font-heading')).toContain('"Geist"');
    expect(await getCSSVar(page, '--font-body')).toContain('"Inter"');
  });

  test('the named theme is the default in both modes', async ({ page }) => {
    await startFresh(page, '/tests/fixtures/defaults');

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('darkmode-change', { detail: { dark: true } })));

    const state = await page.evaluate(() => document.querySelector('theme-forseen')!.state);
    expect(state).toMatchObject({ mode: 'dark', theme: { name: 'Weather Station' } });
  });

  test('a stored selection wins over the named default', async ({ page }) => {
    await startFresh(page, '/tests/fixtures/defaults');
    await openDrawer(page);
    await shadowLocator(page, '.theme-item[data-index="1"]').click();

    await page.reload();
    await waitUntilReady(page);

    expect(await getCSSVar(page, '--color-primary')).toBe('#00F5FF');
  });

  test('an individual font falls back to the named pairing for the other face', async ({ page }) => {
    await startFresh(page, '/tests/fixtures/defaults');
    await openDrawer(page);

    await shadowLocator(page, '.font-item[data-index="3"] .individual-font.heading-font').click();

    const state = await page.evaluate(() => document.querySelector('theme-forseen')!.state);
    expect(state?.fonts.body).toBe('Inter');
  });

  test('a name that is not in the collection falls back to the first entry', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text());
    });

    await startFresh(page, '/tests/fixtures/unknown-defaults');

    expect(await getCSSVar(page, '--color-primary')).toBe('#FF3366');
    expect(warnings.some((warning) => warning.includes('default-theme="No Such Theme"'))).toBe(true);
    expect(warnings.some((warning) => warning.includes('default-fonts="No Such Pairing"'))).toBe(true);
  });

  test('a stored selection that no longer exists falls back to the default', async ({ page }) => {
    await page.goto('/tests/fixtures/defaults');
    await page.evaluate(() => {
      localStorage.setItem('themeforseen-lighttheme', '999999');
      localStorage.setItem('themeforseen-font', '999999');
    });

    await page.reload();
    await waitUntilReady(page);

    const state = await page.evaluate(() => document.querySelector('theme-forseen')!.state);
    expect(state).toMatchObject({ theme: { name: 'Weather Station' }, fonts: { heading: 'Geist', body: 'Inter' } });
  });
});

test.describe('Font Loading', () => {
  test.beforeEach(async ({ page }) => {
    await startFresh(page);
  });

  test('only the applied faces are requested while the drawer is closed', async ({ page }) => {
    expect(await countFontStylesheets(page)).toBe(2);
  });

  test('opening the drawer requests the faces in view, not the whole collection', async ({ page }) => {
    await openDrawer(page);

    await expect.poll(() => countFontStylesheets(page)).toBeGreaterThan(2);
    expect(await countFontStylesheets(page)).toBeLessThan(40);
  });

  test('faces further down are requested as they come into view', async ({ page }) => {
    await openDrawer(page);
    await expect.poll(() => countFontStylesheets(page)).toBeGreaterThan(2);
    const atTop = await countFontStylesheets(page);

    await shadowLocator(page, '.font-item[data-index="120"]').scrollIntoViewIfNeeded();

    await expect.poll(() => countFontStylesheets(page)).toBeGreaterThan(atTop);
  });
});

test.describe('Collection Entry', () => {
  test('loads without a document', async () => {
    const { colorThemes, fontPairings, getAllThemeTags } = await import('../dist/data.js');

    expect(colorThemes.length).toBeGreaterThan(2000);
    expect(fontPairings.length).toBeGreaterThan(190);
    expect(getAllThemeTags()).toContain('weather');
  });

  test('keeps existing entries where stored selections expect them', async () => {
    const { colorThemes, fontPairings } = await import('../dist/data.js');

    expect(colorThemes[0].name).toBe('Electric Sunset');
    expect(colorThemes[2053].name).toBe('Eternal Magma');
    expect(colorThemes[2054].name).toBe('Weather Station');
    expect(fontPairings[0].name).toBe('Inter & Geist');
    expect(fontPairings[196].name).toBe('g Gelem & Open Sans');
    expect(fontPairings[197].name).toBe('Geist & Inter');
  });

  test('the element fetches the collection separately from its own code', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => requested.push(new URL(request.url()).pathname));

    await page.goto('/tests/fixtures/');
    await waitUntilReady(page);

    expect(requested).toContain('/dist/index.js');
    expect(requested).toContain('/dist/data.js');
  });
});
