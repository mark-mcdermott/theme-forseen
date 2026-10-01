import { expect, Page } from '@playwright/test';

// Helper to get CSS variable value from document root
export async function getCSSVar(page: Page, varName: string): Promise<string> {
  return page.evaluate((name) => {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }, varName);
}

// Helper to get element inside shadow DOM
export function shadowLocator(page: Page, selector: string) {
  return page.locator('theme-forseen').locator(selector);
}

// Helper to open the drawer
export async function openDrawer(page: Page): Promise<void> {
  await shadowLocator(page, '.drawer-toggle').click();
  await expect(shadowLocator(page, '.drawer.open')).toBeVisible();
}

// Helper to clear localStorage before each test
export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('themeforseen-')) {
        localStorage.removeItem(key);
      }
    });
  });
}

// Helper to wait until the collection has loaded and the page has been painted
export async function waitUntilReady(page: Page): Promise<void> {
  await page.waitForFunction(() => document.querySelector('theme-forseen')?.state != null);
}

// What has been asked of the font hosts so far
export async function fontRequests(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => /\/\/fonts\.(googleapis|cdnfonts)\.com\//.test(name)),
  );
}

export async function countFontRequests(page: Page): Promise<number> {
  return (await fontRequests(page)).length;
}

// The faces those requests ask for: one request to Google can carry several families
export async function countRequestedFaces(page: Page): Promise<number> {
  return (await fontRequests(page)).flatMap((url) => url.match(/family=/g) ?? ['one']).length;
}

// Stylesheets the element has added to the page for faces: none, unless a host's CSS cannot be fetched
export async function countFontStylesheets(page: Page): Promise<number> {
  return page.evaluate(() => document.head.querySelectorAll('link[rel="stylesheet"][href*="//fonts."]').length);
}
