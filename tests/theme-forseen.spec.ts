import { test, expect, Page } from '@playwright/test';

// Helper to get CSS variable value from document root
async function getCSSVar(page: Page, varName: string): Promise<string> {
  return page.evaluate((name) => {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }, varName);
}

// Helper to open the drawer
async function openDrawer(page: Page): Promise<void> {
  await page.locator('theme-forseen').locator('.drawer-toggle').click();
  await expect(page.locator('theme-forseen').locator('.drawer.open')).toBeVisible();
}

// Helper to clear localStorage before each test
async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('themeforseen-')) {
        localStorage.removeItem(key);
      }
    });
  });
}

// Helper to get element inside shadow DOM
function shadowLocator(page: Page, selector: string) {
  return page.locator('theme-forseen').locator(selector);
}

// =============================================================================
// HIGH VALUE TESTS - Core functionality that must not break
// =============================================================================

test.describe('CSS Variable Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/');
    await clearStorage(page);
    await page.reload();
  });

  test('applies theme color CSS variables to document root', async ({ page }) => {
    await openDrawer(page);

    // Click on the second theme (Neon Pulse - index 1)
    await shadowLocator(page, '.theme-item[data-index="1"]').click();

    // Verify CSS variables are set on document.documentElement
    const primary = await getCSSVar(page, '--color-primary');
    const accent = await getCSSVar(page, '--color-accent');
    const bg = await getCSSVar(page, '--color-bg');

    // Neon Pulse light mode colors
    expect(primary).toBe('#00F5FF');
    expect(accent).toBe('#FF00FF');
    expect(bg).toBe('#FFFFFF');
  });

  test('applies font CSS variables to document root', async ({ page }) => {
    await openDrawer(page);

    // Click on a font pairing
    await shadowLocator(page, '.font-item[data-index="1"]').click();

    // Verify font CSS variables are set
    const headingFont = await getCSSVar(page, '--font-heading');
    const bodyFont = await getCSSVar(page, '--font-body');

    expect(headingFont).toBeTruthy();
    expect(bodyFont).toBeTruthy();
    // Fonts should include fallbacks
    expect(headingFont).toContain(',');
  });

  test('applies dark mode colors when dark mode is selected', async ({ page }) => {
    await openDrawer(page);

    // Switch to dark mode
    await shadowLocator(page, '.mode-btn[data-mode="dark"]').click();

    // Select theme (Electric Sunset - index 0)
    await shadowLocator(page, '.theme-item[data-index="0"]').click();

    // Verify dark mode colors are applied
    const bg = await getCSSVar(page, '--color-bg');
    expect(bg).toBe('#0F0F0F'); // Electric Sunset dark background
  });

  test('sets color-scheme property for proper browser dark mode', async ({ page }) => {
    await openDrawer(page);

    // Initially should be light
    let colorScheme = await page.evaluate(() =>
      document.documentElement.style.colorScheme
    );
    expect(colorScheme).toBe('light');

    // Switch to dark mode
    await shadowLocator(page, '.mode-btn[data-mode="dark"]').click();

    colorScheme = await page.evaluate(() =>
      document.documentElement.style.colorScheme
    );
    expect(colorScheme).toBe('dark');
  });
});

test.describe('localStorage Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/');
    await clearStorage(page);
    await page.reload();
  });

  test('persists theme selection across page reload', async ({ page }) => {
    await openDrawer(page);

    // Select theme 5
    await shadowLocator(page, '.theme-item[data-index="5"]').click();

    // Reload page
    await page.reload();
    await openDrawer(page);

    // Theme 5 should still be selected (has selected-light class)
    const theme5 = shadowLocator(page, '.theme-item[data-index="5"]');
    await expect(theme5).toHaveClass(/selected-light/);
  });

  test('persists dark mode preference across reload', async ({ page }) => {
    await openDrawer(page);

    // Switch to dark mode
    await shadowLocator(page, '.mode-btn[data-mode="dark"]').click();

    // Reload page
    await page.reload();

    // Should still be in dark mode (check color-scheme)
    const colorScheme = await page.evaluate(() =>
      document.documentElement.style.colorScheme
    );
    expect(colorScheme).toBe('dark');

    // Dark mode button should be active
    await openDrawer(page);
    const darkBtn = shadowLocator(page, '.mode-btn[data-mode="dark"]');
    await expect(darkBtn).toHaveClass(/active/);
  });

  test('persists starred theme across reload', async ({ page }) => {
    await openDrawer(page);

    // Star theme 3
    await shadowLocator(page, '.star[data-type="theme"][data-index="3"]').click();

    // Verify it's starred
    const star = shadowLocator(page, '.star[data-type="theme"][data-index="3"]');
    await expect(star).toHaveClass(/starred/);

    // Reload page
    await page.reload();
    await openDrawer(page);

    // Should still be starred
    const starAfterReload = shadowLocator(page, '.star[data-type="theme"][data-index="3"]');
    await expect(starAfterReload).toHaveClass(/starred/);
  });

  test('persists loved themes across reload', async ({ page }) => {
    await openDrawer(page);

    // Love themes 2 and 4
    await shadowLocator(page, '.heart[data-type="theme"][data-index="2"]').click();
    await shadowLocator(page, '.heart[data-type="theme"][data-index="4"]').click();

    // Reload page
    await page.reload();
    await openDrawer(page);

    // Both should still be loved
    await expect(shadowLocator(page, '.heart[data-type="theme"][data-index="2"]')).toHaveClass(/loved/);
    await expect(shadowLocator(page, '.heart[data-type="theme"][data-index="4"]')).toHaveClass(/loved/);
  });

  test('persists font selection across reload', async ({ page }) => {
    await openDrawer(page);

    // Select font pairing 3
    await shadowLocator(page, '.font-item[data-index="3"]').click();

    // Reload page
    await page.reload();
    await openDrawer(page);

    // Font 3 should be selected
    const font3 = shadowLocator(page, '.font-item[data-index="3"]');
    await expect(font3).toHaveClass(/selected/);
  });
});

test.describe('Light/Dark Mode Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/');
    await clearStorage(page);
    await page.reload();
  });

  test('light and dark theme selections are independent', async ({ page }) => {
    await openDrawer(page);

    // Select theme 3 in light mode
    await shadowLocator(page, '.theme-item[data-index="3"]').click();
    await expect(shadowLocator(page, '.theme-item[data-index="3"]')).toHaveClass(/selected-light/);

    // Switch to dark mode, select theme 7
    await shadowLocator(page, '.mode-btn[data-mode="dark"]').click();
    await shadowLocator(page, '.theme-item[data-index="7"]').click();
    await expect(shadowLocator(page, '.theme-item[data-index="7"]')).toHaveClass(/selected-dark/);

    // Switch back to light mode
    await shadowLocator(page, '.mode-btn[data-mode="light"]').click();

    // Theme 3 should still be the light selection
    await expect(shadowLocator(page, '.theme-item[data-index="3"]')).toHaveClass(/selected-light/);

    // And theme 7 should still show as dark selection
    await expect(shadowLocator(page, '.theme-item[data-index="7"]')).toHaveClass(/selected-dark/);
  });

  test('starred themes are independent per mode', async ({ page }) => {
    await openDrawer(page);

    // Star theme 2 in light mode
    await shadowLocator(page, '.star[data-type="theme"][data-index="2"]').click();
    await expect(shadowLocator(page, '.star[data-type="theme"][data-index="2"]')).toHaveClass(/starred/);

    // Switch to dark mode
    await shadowLocator(page, '.mode-btn[data-mode="dark"]').click();

    // Theme 2 should NOT be starred in dark mode (starred state is per-mode)
    // The starred class should not be present since we re-render themes on mode switch
    await expect(shadowLocator(page, '.star[data-type="theme"][data-index="2"]')).not.toHaveClass(/starred/);

    // Star a different theme (5) in dark mode
    await shadowLocator(page, '.star[data-type="theme"][data-index="5"]').click();
    await expect(shadowLocator(page, '.star[data-type="theme"][data-index="5"]')).toHaveClass(/starred/);

    // Switch back to light mode
    await shadowLocator(page, '.mode-btn[data-mode="light"]').click();

    // Theme 2 should still be starred (light mode star)
    await expect(shadowLocator(page, '.star[data-type="theme"][data-index="2"]')).toHaveClass(/starred/);
    // Theme 5 should NOT be starred (that was dark mode)
    await expect(shadowLocator(page, '.star[data-type="theme"][data-index="5"]')).not.toHaveClass(/starred/);
  });

  test('loved themes are independent per mode', async ({ page }) => {
    await openDrawer(page);

    // Love themes 1 and 3 in light mode
    await shadowLocator(page, '.heart[data-type="theme"][data-index="1"]').click();
    await shadowLocator(page, '.heart[data-type="theme"][data-index="3"]').click();

    // Switch to dark mode
    await shadowLocator(page, '.mode-btn[data-mode="dark"]').click();

    // Those themes should NOT be loved in dark mode
    await expect(shadowLocator(page, '.heart[data-type="theme"][data-index="1"]')).not.toHaveClass(/loved/);
    await expect(shadowLocator(page, '.heart[data-type="theme"][data-index="3"]')).not.toHaveClass(/loved/);

    // Love different themes in dark mode
    await shadowLocator(page, '.heart[data-type="theme"][data-index="6"]').click();

    // Switch back to light
    await shadowLocator(page, '.mode-btn[data-mode="light"]').click();

    // Original loves should be preserved
    await expect(shadowLocator(page, '.heart[data-type="theme"][data-index="1"]')).toHaveClass(/loved/);
    await expect(shadowLocator(page, '.heart[data-type="theme"][data-index="3"]')).toHaveClass(/loved/);
    // Dark mode love should not be here
    await expect(shadowLocator(page, '.heart[data-type="theme"][data-index="6"]')).not.toHaveClass(/loved/);
  });

  test('switching modes applies correct theme colors', async ({ page }) => {
    await openDrawer(page);

    // Select theme 0 (Electric Sunset) for both modes
    await shadowLocator(page, '.theme-item[data-index="0"]').click();
    await shadowLocator(page, '.mode-btn[data-mode="dark"]').click();
    await shadowLocator(page, '.theme-item[data-index="0"]').click();

    // In dark mode, should have dark colors
    let bg = await getCSSVar(page, '--color-bg');
    expect(bg).toBe('#0F0F0F'); // Electric Sunset dark

    // Switch to light
    await shadowLocator(page, '.mode-btn[data-mode="light"]').click();

    bg = await getCSSVar(page, '--color-bg');
    expect(bg).toBe('#FFFFFF'); // Electric Sunset light
  });
});

// =============================================================================
// MEDIUM VALUE TESTS - Interaction bugs
// =============================================================================

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/');
    await clearStorage(page);
    await page.reload();
  });

  test('arrow down selects next theme', async ({ page }) => {
    await openDrawer(page);

    // Ensure we're in light mode for this test
    await shadowLocator(page, '.mode-btn[data-mode="light"]').click();

    // Click on themes column to focus it
    await shadowLocator(page, '.theme-item[data-index="0"]').click();

    // Initial selection should be theme 0
    await expect(shadowLocator(page, '.theme-item[data-index="0"]')).toHaveClass(/selected-light/);

    // Press arrow down
    await page.keyboard.press('ArrowDown');

    // Theme 1 should now be selected
    await expect(shadowLocator(page, '.theme-item[data-index="1"]')).toHaveClass(/selected-light/);
  });

  test('arrow up selects previous theme', async ({ page }) => {
    await openDrawer(page);

    // Ensure we're in light mode
    await shadowLocator(page, '.mode-btn[data-mode="light"]').click();

    // Select theme 3 first
    await shadowLocator(page, '.theme-item[data-index="3"]').click();

    // Press arrow up
    await page.keyboard.press('ArrowUp');

    // Theme 2 should now be selected
    await expect(shadowLocator(page, '.theme-item[data-index="2"]')).toHaveClass(/selected-light/);
  });

  test('s key toggles star on current theme', async ({ page }) => {
    await openDrawer(page);

    // Select theme 2
    await shadowLocator(page, '.theme-item[data-index="2"]').click();

    // Press s to star
    await page.keyboard.press('s');

    // Theme 2 should be starred
    await expect(shadowLocator(page, '.star[data-type="theme"][data-index="2"]')).toHaveClass(/starred/);

    // Press s again to unstar
    await page.keyboard.press('s');

    // Should no longer be starred
    await expect(shadowLocator(page, '.star[data-type="theme"][data-index="2"]')).not.toHaveClass(/starred/);
  });

  test('h key toggles heart on current theme', async ({ page }) => {
    await openDrawer(page);

    // Select theme 4
    await shadowLocator(page, '.theme-item[data-index="4"]').click();

    // Press h to love
    await page.keyboard.press('h');

    // Theme 4 should be loved
    await expect(shadowLocator(page, '.heart[data-type="theme"][data-index="4"]')).toHaveClass(/loved/);

    // Press h again to unlove
    await page.keyboard.press('h');

    // Should no longer be loved
    await expect(shadowLocator(page, '.heart[data-type="theme"][data-index="4"]')).not.toHaveClass(/loved/);
  });

  test('keyboard navigation works in fonts column', async ({ page }) => {
    await openDrawer(page);

    // Hover over fonts column to focus it
    await shadowLocator(page, '.fonts-list').hover();

    // Click a font to select it and set focus
    await shadowLocator(page, '.font-item[data-index="0"]').click();

    // Press arrow down
    await page.keyboard.press('ArrowDown');

    // Font 1 should now be selected
    await expect(shadowLocator(page, '.font-item[data-index="1"]')).toHaveClass(/selected/);
  });
});

test.describe('Drawer State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/');
    await clearStorage(page);
    await page.reload();
  });

  test('drawer opens when toggle is clicked', async ({ page }) => {
    // Drawer should be closed initially
    await expect(shadowLocator(page, '.drawer')).not.toHaveClass(/open/);

    // Click toggle
    await shadowLocator(page, '.drawer-toggle').click();

    // Drawer should be open
    await expect(shadowLocator(page, '.drawer')).toHaveClass(/open/);
  });

  test('drawer closes when close button is clicked', async ({ page }) => {
    await openDrawer(page);

    // Click close button
    await shadowLocator(page, '.close-btn').click();

    // Drawer should be closed
    await expect(shadowLocator(page, '.drawer')).not.toHaveClass(/open/);
  });

  test('drawer closes when backdrop is clicked', async ({ page }) => {
    await openDrawer(page);

    // Click backdrop
    await shadowLocator(page, '.backdrop').click({ force: true });

    // Drawer should be closed
    await expect(shadowLocator(page, '.drawer')).not.toHaveClass(/open/);
  });

  test('toggle button hides when drawer is open', async ({ page }) => {
    // Toggle should be visible initially
    await expect(shadowLocator(page, '.drawer-toggle')).toBeVisible();

    await openDrawer(page);

    // Toggle should be hidden
    await expect(shadowLocator(page, '.drawer-toggle')).toHaveClass(/hidden/);
  });
});

test.describe('Column Collapse', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/');
    await clearStorage(page);
    await page.reload();
  });

  test('themes column can be collapsed', async ({ page }) => {
    await openDrawer(page);

    // Click collapse button for themes
    await shadowLocator(page, '.collapse-btn[data-column-type="themes"]').click();

    // Themes column should be collapsed
    await expect(shadowLocator(page, '[data-column="themes"]')).toHaveClass(/collapsed/);
  });

  test('fonts column can be collapsed', async ({ page }) => {
    await openDrawer(page);

    // Click collapse button for fonts
    await shadowLocator(page, '.collapse-btn[data-column-type="fonts"]').click();

    // Fonts column should be collapsed
    await expect(shadowLocator(page, '[data-column="fonts"]')).toHaveClass(/collapsed/);
  });

  test('collapsed column can be expanded', async ({ page }) => {
    await openDrawer(page);

    // Collapse themes
    await shadowLocator(page, '.collapse-btn[data-column-type="themes"]').click();
    await expect(shadowLocator(page, '[data-column="themes"]')).toHaveClass(/collapsed/);

    // Expand themes
    await shadowLocator(page, '.collapse-btn[data-column-type="themes"]').click();
    await expect(shadowLocator(page, '[data-column="themes"]')).not.toHaveClass(/collapsed/);
  });

  test('column collapse state persists across reload', async ({ page }) => {
    await openDrawer(page);

    // Collapse fonts column
    await shadowLocator(page, '.collapse-btn[data-column-type="fonts"]').click();

    // Reload
    await page.reload();
    await openDrawer(page);

    // Fonts column should still be collapsed
    await expect(shadowLocator(page, '[data-column="fonts"]')).toHaveClass(/collapsed/);
  });
});

test.describe('Mobile Accordion Behavior', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/tests/fixtures/');
    await clearStorage(page);
    await page.reload();
  });

  test('on mobile, expanding one column collapses the other', async ({ page }) => {
    await openDrawer(page);

    // Initially themes should be open, fonts collapsed (or vice versa on mobile)
    // The behavior is: when you expand one, the other collapses

    // Collapse themes first
    await shadowLocator(page, '.collapse-btn[data-column-type="themes"]').click();
    await expect(shadowLocator(page, '[data-column="themes"]')).toHaveClass(/collapsed/);

    // Now expand themes - fonts should collapse
    await shadowLocator(page, '.collapse-btn[data-column-type="themes"]').click();
    await expect(shadowLocator(page, '[data-column="themes"]')).not.toHaveClass(/collapsed/);
    await expect(shadowLocator(page, '[data-column="fonts"]')).toHaveClass(/collapsed/);

    // Expand fonts - themes should collapse
    await shadowLocator(page, '.collapse-btn[data-column-type="fonts"]').click();
    await expect(shadowLocator(page, '[data-column="fonts"]')).not.toHaveClass(/collapsed/);
    await expect(shadowLocator(page, '[data-column="themes"]')).toHaveClass(/collapsed/);
  });
});

// =============================================================================
// ADDITIONAL USEFUL TESTS
// =============================================================================

test.describe('Only One Star Allowed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/');
    await clearStorage(page);
    await page.reload();
  });

  test('starring a new theme unstars the previous one', async ({ page }) => {
    await openDrawer(page);

    // Star theme 2
    await shadowLocator(page, '.star[data-type="theme"][data-index="2"]').click();
    await expect(shadowLocator(page, '.star[data-type="theme"][data-index="2"]')).toHaveClass(/starred/);

    // Star theme 5
    await shadowLocator(page, '.star[data-type="theme"][data-index="5"]').click();

    // Theme 5 should be starred
    await expect(shadowLocator(page, '.star[data-type="theme"][data-index="5"]')).toHaveClass(/starred/);

    // Theme 2 should no longer be starred
    await expect(shadowLocator(page, '.star[data-type="theme"][data-index="2"]')).not.toHaveClass(/starred/);
  });

  test('starring a new font unstars the previous one', async ({ page }) => {
    await openDrawer(page);

    // Star font 1
    await shadowLocator(page, '.star[data-type="font"][data-index="1"]').click();
    await expect(shadowLocator(page, '.star[data-type="font"][data-index="1"]')).toHaveClass(/starred/);

    // Star font 3
    await shadowLocator(page, '.star[data-type="font"][data-index="3"]').click();

    // Font 3 should be starred
    await expect(shadowLocator(page, '.star[data-type="font"][data-index="3"]')).toHaveClass(/starred/);

    // Font 1 should no longer be starred
    await expect(shadowLocator(page, '.star[data-type="font"][data-index="1"]')).not.toHaveClass(/starred/);
  });
});

test.describe('Multiple Hearts Allowed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/');
    await clearStorage(page);
    await page.reload();
  });

  test('can love multiple themes', async ({ page }) => {
    await openDrawer(page);

    // Love themes 1, 3, and 5
    await shadowLocator(page, '.heart[data-type="theme"][data-index="1"]').click();
    await shadowLocator(page, '.heart[data-type="theme"][data-index="3"]').click();
    await shadowLocator(page, '.heart[data-type="theme"][data-index="5"]').click();

    // All three should be loved
    await expect(shadowLocator(page, '.heart[data-type="theme"][data-index="1"]')).toHaveClass(/loved/);
    await expect(shadowLocator(page, '.heart[data-type="theme"][data-index="3"]')).toHaveClass(/loved/);
    await expect(shadowLocator(page, '.heart[data-type="theme"][data-index="5"]')).toHaveClass(/loved/);
  });

  test('can love multiple fonts', async ({ page }) => {
    await openDrawer(page);

    // Love fonts 0 and 2
    await shadowLocator(page, '.heart[data-type="font"][data-index="0"]').click();
    await shadowLocator(page, '.heart[data-type="font"][data-index="2"]').click();

    // Both should be loved
    await expect(shadowLocator(page, '.heart[data-type="font"][data-index="0"]')).toHaveClass(/loved/);
    await expect(shadowLocator(page, '.heart[data-type="font"][data-index="2"]')).toHaveClass(/loved/);
  });
});

test.describe('Individual Font Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/');
    await clearStorage(page);
    await page.reload();
  });

  test('can select individual heading font', async ({ page }) => {
    await openDrawer(page);

    // Click on the heading font within a font pairing
    await shadowLocator(page, '.individual-font.heading-font').first().click();

    // Should apply the font
    const headingFont = await getCSSVar(page, '--font-heading');
    expect(headingFont).toBeTruthy();
  });

  test('can swap heading and body fonts', async ({ page }) => {
    await openDrawer(page);

    // Get initial fonts from first pairing
    const initialHeading = await getCSSVar(page, '--font-heading');
    const initialBody = await getCSSVar(page, '--font-body');

    // Click swap button on first font pairing
    await shadowLocator(page, '.font-switch-icon[data-index="0"]').click();

    // Fonts should be swapped
    const swappedHeading = await getCSSVar(page, '--font-heading');
    const swappedBody = await getCSSVar(page, '--font-body');

    // The heading should now contain what was the body font name
    // (exact comparison is tricky due to fallbacks, but they should be different)
    expect(swappedHeading).not.toBe(initialHeading);
    expect(swappedBody).not.toBe(initialBody);
  });
});
