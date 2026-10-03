import { test, expect, Page } from '@playwright/test';
import {
  clearStorage,
  countFontRequests,
  countFontStylesheets,
  countRequestedFaces,
  fontRequests,
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

// Whether a row lies within the part of its column that shows, whatever the window has scrolled to
async function inViewInItsColumn(page: Page, selector: string): Promise<boolean> {
  return shadowLocator(page, selector).evaluate((row) => {
    const column = row.closest('.themes-list, .fonts-list')!.getBoundingClientRect();
    const box = row.getBoundingClientRect();
    return box.top >= column.top && box.bottom <= column.bottom + 1;
  });
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

  test('follows a kept face: the heading stays while another pairing is chosen', async ({ page }) => {
    await startFresh(page);
    await openDrawer(page);

    // Raleway & Lato, and keep Raleway
    await shadowLocator(page, '.font-item[data-index="2"]').click();
    await shadowLocator(page, '.keep-btn[data-keep="heading"]').click();
    // Poppins & Roboto: only the body changes
    await shadowLocator(page, '.font-item[data-index="3"]').click();

    const state = await page.evaluate(() => document.querySelector('theme-forseen')!.state);
    expect(state?.fonts).toEqual({ heading: 'Raleway', body: 'Roboto' });
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

  test('a face kept before there were pairings to keep it against falls back to the named pairing', async ({ page }) => {
    await page.goto('/tests/fixtures/defaults');
    // As 0.8 and earlier stored one face chosen alone: the face, and no pairing
    await page.evaluate(() => {
      localStorage.setItem('themeforseen-heading-font', 'Poppins');
      localStorage.setItem('themeforseen-font', '-1');
    });
    await page.reload();
    await waitUntilReady(page);

    const state = await page.evaluate(() => document.querySelector('theme-forseen')!.state);
    expect(state?.fonts).toEqual({ heading: 'Poppins', body: 'Inter' });

    // And it can be let go, on the named pairing's row
    await openDrawer(page);
    const keep = shadowLocator(page, '.font-item[data-index="197"] .keep-btn[data-keep="heading"]');
    await expect(keep).toHaveAttribute('aria-pressed', 'true');
    await keep.click();
    expect((await page.evaluate(() => document.querySelector('theme-forseen')!.state))?.fonts.heading).toBe('Geist');
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
    await expect.poll(() => countRequestedFaces(page)).toBe(2);
    await page.waitForTimeout(300);
    expect(await countRequestedFaces(page)).toBe(2);
  });

  test('opening the drawer requests the faces in view, not the whole collection', async ({ page }) => {
    await openDrawer(page);

    await expect.poll(() => countRequestedFaces(page)).toBeGreaterThan(2);
    expect(await countRequestedFaces(page)).toBeLessThan(40);
  });

  test('faces further down are requested as they come into view', async ({ page }) => {
    await openDrawer(page);
    await expect.poll(() => countRequestedFaces(page)).toBeGreaterThan(2);
    const atTop = await countRequestedFaces(page);

    await shadowLocator(page, '.font-item[data-index="120"]').scrollIntoViewIfNeeded();

    await expect.poll(() => countRequestedFaces(page)).toBeGreaterThan(atTop);
  });

  test('the faces a screenful of rows calls for are asked for together', async ({ page }) => {
    await page.route(/fonts\.googleapis\.com/, (route) => route.fulfill({ contentType: 'text/css', body: '', headers: { 'access-control-allow-origin': '*' } }));
    await page.reload();
    await waitUntilReady(page);
    // The two applied faces, in one request
    await expect.poll(() => countFontRequests(page)).toBe(1);

    await openDrawer(page);
    await expect.poll(() => countRequestedFaces(page)).toBeGreaterThan(6);
    expect(await countFontRequests(page)).toBeLessThanOrEqual(3);
  });

  test('if Google refuses a request for several, each face is asked for on its own', async ({ page }) => {
    await page.route(/fonts\.googleapis\.com/, (route) => {
      const families = route.request().url().match(/family=/g)!.length;
      const headers = { 'access-control-allow-origin': '*' };
      return families > 1 ? route.fulfill({ status: 400, body: '', headers }) : route.fulfill({ contentType: 'text/css', body: '', headers });
    });
    await page.reload();
    await waitUntilReady(page);

    await expect.poll(async () => (await fontRequests(page)).filter((url) => url.match(/family=/g)!.length === 1).length).toBe(2);
  });

  test('faces are registered with the page, not linked into it, so its own faces are left alone', async ({ page }) => {
    const css = `@font-face { font-family: 'Electrolize'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/test/face.woff2) format('woff2'); unicode-range: U+0000-00FF; }`;
    await page.route(/fonts\.googleapis\.com/, (route) => route.fulfill({ contentType: 'text/css', body: css, headers: { 'access-control-allow-origin': '*' } }));
    await page.reload();
    await waitUntilReady(page);

    await expect
      .poll(() => page.evaluate(() => [...document.fonts].filter((face) => face.family === 'Electrolize').map((face) => `${face.weight} ${face.unicodeRange}`)))
      .toEqual(['400 U+0-FF']);
    expect(await countFontStylesheets(page)).toBe(0);
  });

  test('where the host cannot be fetched from, its stylesheet is linked as before', async ({ page }) => {
    await page.route(/fonts\.googleapis\.com/, (route) => (route.request().resourceType() === 'fetch' ? route.abort() : route.fulfill({ contentType: 'text/css', body: '' })));
    await page.reload();
    await waitUntilReady(page);

    await expect.poll(() => countFontStylesheets(page)).toBe(1);
  });

  test('faces the page declares itself are not requested', async ({ page }) => {
    await startFresh(page, '/tests/fixtures/self-hosted');
    expect(await countRequestedFaces(page)).toBe(0);

    await openDrawer(page);
    await expect.poll(() => countRequestedFaces(page)).toBeGreaterThan(0);

    const requested = await fontRequests(page);
    expect(requested.some((url) => /family=(Geist|Inter)(:|&|$)/.test(url))).toBe(false);
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

test.describe('The Drawer', () => {
  test.beforeEach(async ({ page }) => {
    await recordChanges(page);
    await startFresh(page, '/tests/fixtures/defaults');
    await openDrawer(page);
  });

  test('opens on the selection in each column', async ({ page }) => {
    await expect(shadowLocator(page, '.theme-item[data-index="2054"]')).toBeInViewport();
    await expect(shadowLocator(page, '.font-item[data-index="197"]')).toBeInViewport();
  });

  test('the tabs show which columns are out, and both can be', async ({ page }) => {
    const themesTab = shadowLocator(page, '.column-tab[data-column-type="themes"]');
    const fontsTab = shadowLocator(page, '.column-tab[data-column-type="fonts"]');
    await expect(themesTab).toHaveAttribute('aria-pressed', 'true');
    await expect(fontsTab).toHaveAttribute('aria-pressed', 'true');

    await fontsTab.click();
    await expect(fontsTab).toHaveAttribute('aria-pressed', 'false');
    await expect(shadowLocator(page, '[data-column="fonts"]')).toHaveClass(/collapsed/);
    await expect(shadowLocator(page, '[data-column="themes"]')).not.toHaveClass(/collapsed/);
  });

  test('the mode switch is the two buttons', async ({ page }) => {
    await shadowLocator(page, '.mode-btn[data-mode="dark"]').click();
    await expect(shadowLocator(page, '.mode-btn[data-mode="dark"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(shadowLocator(page, '.drawer')).toHaveAttribute('data-mode', 'dark');
    expect((await lastChange(page))?.mode).toBe('dark');
  });

  test('Starred and Liked show only those themes', async ({ page }) => {
    await shadowLocator(page, '.star[data-type="theme"][data-index="2"]').click();
    await shadowLocator(page, '.heart[data-type="theme"][data-index="3"]').click();
    await shadowLocator(page, '.heart[data-type="theme"][data-index="5"]').click();

    await shadowLocator(page, '.pill[data-favorites="starred"]').click();
    await expect(shadowLocator(page, '.theme-item')).toHaveCount(1);
    await expect(shadowLocator(page, '.theme-item[data-index="2"]')).toBeVisible();

    await shadowLocator(page, '.pill[data-favorites="hearted"]').click();
    await expect(shadowLocator(page, '.theme-item')).toHaveCount(2);
    await expect(shadowLocator(page, '.pill[data-favorites="starred"]')).toHaveAttribute('aria-pressed', 'false');

    await shadowLocator(page, '.pill[data-favorites="all"]').click();
    expect(await shadowLocator(page, '.theme-item').count()).toBeGreaterThan(2000);
  });

  test('the font search finds pairings by name', async ({ page }) => {
    await shadowLocator(page, '.font-filter-input').fill('geist');
    const names = await shadowLocator(page, '.font-item .font-name').allTextContents();
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => /geist/i.test(name))).toBe(true);

    await page.reload();
    await waitUntilReady(page);
    await openDrawer(page);
    await expect(shadowLocator(page, '.font-filter-input')).toHaveValue('geist');
  });

  test('the style pills filter by the heading face, and the menu by the body', async ({ page }) => {
    await shadowLocator(page, '.pill[data-style="serif"]').click();
    const serifCount = await shadowLocator(page, '.font-item').count();
    expect(serifCount).toBeGreaterThan(0);
    const styles = await shadowLocator(page, '.font-item .font-styles').allTextContents();
    expect(styles.every((text) => text.trim().startsWith('Serif'))).toBe(true);

    await shadowLocator(page, '.font-filter-dropdown-btn[data-filter-type="body"]').click();
    await shadowLocator(page, '.font-filter-dropdown .filter-option[data-style="mono"] input').check();
    expect(await shadowLocator(page, '.font-item').count()).toBeLessThan(serifCount);
    await expect(shadowLocator(page, '.font-filter-dropdown-btn[data-filter-type="body"] .menu-label')).toHaveText('Mono');
  });

  test('the tag menu can be searched', async ({ page }) => {
    await shadowLocator(page, '.filter-dropdown-btn').click();
    await shadowLocator(page, '.dropdown-search').fill('weath');
    await expect(shadowLocator(page, '.filter-option[data-tag="weather"]')).toBeVisible();
    await expect(shadowLocator(page, '.filter-option[data-tag="warm"]')).toBeHidden();
  });

  test('the preview key takes the selection off the page, and puts it back', async ({ page }) => {
    const key = shadowLocator(page, '.preview-btn');
    await expect(key).toHaveAttribute('aria-pressed', 'true');
    expect(await getCSSVar(page, '--color-primary')).toBe('#EB5526');

    await key.click();
    await expect(key).toHaveAttribute('aria-pressed', 'false');
    await expect(key).toHaveText(/Site's Own Look/);
    // The page's own styles: nothing of the selection is left on it
    expect(await getCSSVar(page, '--color-primary')).toBe('');
    expect(await getCSSVar(page, '--font-heading')).toBe('');
    expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe('');
    expect(await lastChange(page)).toMatchObject({ previewing: false, theme: { name: 'Weather Station' }, open: true });

    await key.click();
    await expect(key).toHaveAttribute('aria-pressed', 'true');
    expect(await getCSSVar(page, '--color-primary')).toBe('#EB5526');
    expect(await getCSSVar(page, '--font-heading')).toContain('Geist');
    expect((await lastChange(page))?.previewing).toBe(true);
  });

  test('choosing anything while comparing puts the preview back, whole', async ({ page }) => {
    await shadowLocator(page, '.preview-btn').click();
    await shadowLocator(page, '.font-item[data-index="1"]').click();

    await expect(shadowLocator(page, '.preview-btn')).toHaveAttribute('aria-pressed', 'true');
    expect(await getCSSVar(page, '--font-heading')).toContain('Montserrat');
    expect(await getCSSVar(page, '--color-primary')).toBe('#EB5526');

    await shadowLocator(page, '.preview-btn').click();
    await shadowLocator(page, '.theme-item[data-index="2053"]').click();
    expect(await getCSSVar(page, '--color-primary')).not.toBe('');
    expect(await getCSSVar(page, '--font-heading')).toContain('Montserrat');
  });

  test('comparing does not change the mode, whatever the page looks like without the selection', async ({ page }) => {
    await shadowLocator(page, '.mode-btn[data-mode="dark"]').click();
    await shadowLocator(page, '.preview-btn').click();
    // The page changing its own style while the selection is off is not a mode change
    await page.evaluate(() => document.documentElement.style.setProperty('--anything', '1'));
    await page.waitForTimeout(100);

    expect(await lastChange(page)).toMatchObject({ previewing: false, mode: 'dark' });
    await expect(page.locator('theme-forseen')).toHaveAttribute('mode', 'dark');
  });

  test('a column header puts its column away and leaves a stub that brings it back', async ({ page }) => {
    const fontsTab = shadowLocator(page, '.column-tab[data-column-type="fonts"]');
    const themesTab = shadowLocator(page, '.column-tab[data-column-type="themes"]');
    await expect(fontsTab).toHaveAttribute('title', 'Hide Font Pairings');

    // Each header is as wide as the column beneath it
    const widths = async (selector: string) => shadowLocator(page, selector).evaluate((element) => Math.round(element.getBoundingClientRect().width));
    expect(await widths('.column-tab[data-column-type="fonts"]')).toBe(await widths('[data-column="fonts"]'));

    await fontsTab.click();
    await expect(fontsTab).toHaveAttribute('title', 'Show Font Pairings');
    expect(await widths('.column-tab[data-column-type="fonts"]')).toBeLessThan(50);
    await expect(fontsTab.locator('.tab-name')).toBeHidden();
    // The last column out does not offer to go
    await expect(themesTab.locator('.tab-away')).toBeHidden();

    await fontsTab.click();
    await expect(shadowLocator(page, '[data-column="fonts"]')).not.toHaveClass(/collapsed/);
  });

  test('Apply to Project offers both files when there is no server', async ({ page }) => {
    await shadowLocator(page, '.apply-btn').click();
    const modal = shadowLocator(page, '.activation-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.activation-section')).toHaveCount(2);
    await expect(modal.locator('.activation-code').nth(0)).toContainText("primary: '#EB5526'");
    await expect(modal.locator('.activation-code').nth(1)).toContainText("--font-heading: 'Geist'");

    await modal.locator('.activation-cancel-btn').click();
    await expect(modal).toBeHidden();
  });

  test('the Apply modal opens in the top layer, above whatever the page has', async ({ page }) => {
    await page.addStyleTag({ content: 'body::after { content: ""; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none; }' });
    await shadowLocator(page, '.apply-btn').click();

    const modal = shadowLocator(page, '.activation-modal');
    expect(await modal.evaluate((dialog) => dialog.matches(':modal'))).toBe(true);

    // Escape closes it, as a dialog's does
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('anywhere on a font row chooses its pairing, the middle included', async ({ page }) => {
    const row = shadowLocator(page, '.font-item[data-index="1"]');
    await row.scrollIntoViewIfNeeded();
    await row.click();

    await expect(row).toHaveClass(/selected/);
    expect((await lastChange(page))?.fonts).toEqual({ heading: 'Montserrat', body: 'Open Sans' });
    // Only the selected row carries the controls
    await expect(shadowLocator(page, '.font-keep')).toHaveCount(1);
    await expect(row.locator('.font-keep')).toBeVisible();
  });

  test('a kept face holds through other pairings, and lets go', async ({ page }) => {
    await shadowLocator(page, '.font-item[data-index="1"]').click();
    const keepBody = shadowLocator(page, '.keep-btn[data-keep="body"]');
    await keepBody.click();
    await expect(keepBody).toHaveAttribute('aria-pressed', 'true');

    await shadowLocator(page, '.font-item[data-index="2"]').click();
    expect((await lastChange(page))?.fonts).toEqual({ heading: 'Raleway', body: 'Open Sans' });
    // The controls moved to the newly selected row and still show what is in use
    const controls = shadowLocator(page, '.font-item[data-index="2"] .font-keep');
    await expect(controls.locator('[data-keep="body"] .keep-face')).toHaveText('Open Sans');
    await expect(controls.locator('[data-keep="body"]')).toHaveAttribute('aria-pressed', 'true');

    await controls.locator('[data-keep="body"]').click();
    expect((await lastChange(page))?.fonts).toEqual({ heading: 'Raleway', body: 'Lato' });

    // Kept faces are remembered
    await controls.locator('[data-keep="heading"]').click();
    await page.reload();
    await waitUntilReady(page);
    await openDrawer(page);
    await expect(shadowLocator(page, '.keep-btn[data-keep="heading"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('swap exchanges the two faces, and again puts the pairing back as it comes', async ({ page }) => {
    await shadowLocator(page, '.font-item[data-index="1"]').click();
    await shadowLocator(page, '.font-swap').click();
    expect((await lastChange(page))?.fonts).toEqual({ heading: 'Open Sans', body: 'Montserrat' });
    await expect(shadowLocator(page, '.keep-btn[data-keep="heading"] .keep-face')).toHaveText('Open Sans');

    await shadowLocator(page, '.font-swap').click();
    expect((await lastChange(page))?.fonts).toEqual({ heading: 'Montserrat', body: 'Open Sans' });
    await expect(shadowLocator(page, '.keep-btn[data-keep="heading"]')).toHaveAttribute('aria-pressed', 'false');
  });

  test('the keep buttons work from the keyboard, and keep the focus', async ({ page }) => {
    await shadowLocator(page, '.font-item[data-index="1"]').click();
    const keep = shadowLocator(page, '.keep-btn[data-keep="heading"]');
    await keep.focus();
    await page.keyboard.press('Enter');

    await expect(keep).toHaveAttribute('aria-pressed', 'true');
    await expect(keep).toBeFocused();
  });
});

test.describe('Docked', () => {
  test.beforeEach(async ({ page }) => {
    await recordChanges(page);
    await startFresh(page, '/tests/fixtures/docked');
  });

  test('fills the element the page lays out, with no tab or backdrop', async ({ page }) => {
    const slot = await page.locator('aside').boundingBox();
    const drawer = await shadowLocator(page, '.drawer').boundingBox();
    expect(drawer).toEqual({ x: slot!.x + 12, y: slot!.y + 12, width: slot!.width - 24, height: slot!.height - 24 });

    await expect(shadowLocator(page, '.drawer-toggle')).toBeHidden();
    await expect(shadowLocator(page, '.backdrop')).toBeHidden();
    await expect(shadowLocator(page, '.drawer')).toHaveClass(/open/);
  });

  test('both columns show, since the window is wide, and each opens on its selection', async ({ page }) => {
    await expect(shadowLocator(page, '[data-column="themes"]')).not.toHaveClass(/collapsed/);
    await expect(shadowLocator(page, '[data-column="fonts"]')).not.toHaveClass(/collapsed/);
    for (const row of ['.theme-item[data-index="2054"]', '.font-item[data-index="197"]']) {
      expect(await inViewInItsColumn(page, row)).toBe(true);
    }
  });

  test('a narrow window still shows both columns, since the page sizes the drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addStyleTag({ content: 'main { display: block; padding: 0 } aside { width: 390px }' });
    await page.reload();
    await waitUntilReady(page);

    await expect(shadowLocator(page, '[data-column="themes"]')).not.toHaveClass(/collapsed/);
    await expect(shadowLocator(page, '[data-column="fonts"]')).not.toHaveClass(/collapsed/);
    const slot = await page.locator('aside').boundingBox();
    const drawer = await shadowLocator(page, '.drawer').boundingBox();
    expect(drawer!.width).toBe(slot!.width - 24);
  });

  test('moving the element is one visit, and the drawer carries on as it was', async ({ page }) => {
    const visits = () => page.evaluate(() => localStorage.getItem('themeforseen-visit-count'));
    const before = await visits();

    await page.evaluate(() => {
      const element = document.querySelector('theme-forseen')!;
      document.body.append(element);
      document.querySelector('aside')!.append(element);
    });

    expect(await visits()).toBe(before);
    await expect(shadowLocator(page, '.drawer')).toHaveCount(1);
    await expect(shadowLocator(page, '.drawer')).toHaveClass(/open/);

    // One listener per row still: a second would undo the first
    const heart = shadowLocator(page, '.theme-item[data-index="2054"] .favorite-icon.heart');
    await heart.click();
    await expect(heart).toHaveClass(/loved/);
  });

  test("the page's control closes it, and it leaves the element", async ({ page }) => {
    await page.locator('#toggle').click();
    await expect(shadowLocator(page, '.drawer')).not.toHaveClass(/open/);
    expect((await lastChange(page))?.open).toBe(false);

    // Slid out to the right and clipped by the host
    await expect.poll(async () => {
      const box = await shadowLocator(page, '.drawer').boundingBox();
      const slot = await page.locator('aside').boundingBox();
      return box!.x >= slot!.x + slot!.width - 24;
    }).toBe(true);
  });

  test('a selection still applies to the page', async ({ page }) => {
    await shadowLocator(page, '.theme-item[data-index="0"]').click();
    expect(await getCSSVar(page, '--color-primary')).toBe('#FF3366');
  });

  test('opening on the selection scrolls the columns, not the page', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 500 });
    await page.reload();
    await waitUntilReady(page);

    await expect(shadowLocator(page, '.theme-item[data-index="2054"]')).toHaveClass(/selected-light/);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(await shadowLocator(page, '.themes-list').evaluate((content) => content.scrollTop)).toBeGreaterThan(1000);
  });

  test('the heart and the star stay touch targets when a page zooms the drawer down', async ({ page }) => {
    await page.addStyleTag({ content: 'theme-forseen { zoom: 0.85 }' });

    const [heart, star] = await shadowLocator(page, '.theme-item[data-index="2054"] .favorite-icon').evaluateAll((buttons) =>
      buttons.map((button) => button.getBoundingClientRect().toJSON()),
    );
    // WCAG 2.2: 24 px, or 24 px between centres
    expect(heart.width).toBeGreaterThanOrEqual(24);
    expect(heart.height).toBeGreaterThanOrEqual(24);
    expect(star.left + star.width / 2 - (heart.left + heart.width / 2)).toBeGreaterThanOrEqual(24);

    // The selected font row's controls too
    const controls = await shadowLocator(page, '.font-keep button').evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().toJSON()));
    expect(controls).toHaveLength(3);
    for (const box of controls) {
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    }
  });

  test('a row is never half covered by its column\'s controls', async ({ page }) => {
    // Scroll so that a row lies across the top of each list
    for (const list of ['.themes-list', '.fonts-list']) {
      await shadowLocator(page, list).evaluate((element) => element.scrollBy({ top: 31 }));
    }

    for (const column of ['themes', 'fonts']) {
      const covered = await shadowLocator(page, `[data-column="${column}"]`).evaluate((element) => {
        const controls = element.querySelector('.column-controls')!.getBoundingClientRect();
        const list = element.querySelector('.themes-list, .fonts-list')!.getBoundingClientRect();
        return controls.bottom > list.top + 0.5;
      });
      expect(covered).toBe(false);
    }
  });

  test('nothing in a column is wider than the column', async ({ page }) => {
    for (const column of ['themes', 'fonts']) {
      const content = shadowLocator(page, `[data-column="${column}"] .column-content`);
      expect(await content.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0);
    }
  });

  test('the arrow keys are the page\'s until the pointer or the focus is on the drawer', async ({ page }) => {
    const theme = () => page.evaluate(() => document.querySelector('theme-forseen')!.state!.theme.name);
    await page.mouse.move(100, 100);
    await page.locator('h1').click();
    await page.keyboard.press('ArrowDown');
    expect(await theme()).toBe('Weather Station');

    await shadowLocator(page, '.theme-item[data-index="2054"]').hover();
    await page.keyboard.press('ArrowUp');
    expect(await theme()).not.toBe('Weather Station');
  });
});

test.describe('Mode On The Element', () => {
  test.beforeEach(async ({ page }) => {
    await startFresh(page, '/tests/fixtures/defaults');
  });

  test('the element carries the mode, and a rule the page sets on it holds in both', async ({ page }) => {
    const element = page.locator('theme-forseen');
    await expect(element).toHaveAttribute('mode', 'light');

    await page.addStyleTag({ content: 'theme-forseen { --tf-bg: rgb(1, 2, 3); }' });
    const drawerBackground = () =>
      page.evaluate(() => getComputedStyle(document.querySelector('theme-forseen')!.shadowRoot!.querySelector('.drawer')!).backgroundColor);
    expect(await drawerBackground()).toBe('rgb(1, 2, 3)');

    await openDrawer(page);
    await shadowLocator(page, '.mode-btn[data-mode="dark"]').click();
    await expect(element).toHaveAttribute('mode', 'dark');
    expect(await drawerBackground()).toBe('rgb(1, 2, 3)');
  });

  test('without a rule from the page, night has its own palette', async ({ page }) => {
    await openDrawer(page);
    const drawerBackground = () =>
      page.evaluate(() => getComputedStyle(document.querySelector('theme-forseen')!.shadowRoot!.querySelector('.drawer')!).backgroundColor);
    const day = await drawerBackground();
    await shadowLocator(page, '.mode-btn[data-mode="dark"]').click();
    await expect.poll(drawerBackground).not.toBe(day);
  });
});
