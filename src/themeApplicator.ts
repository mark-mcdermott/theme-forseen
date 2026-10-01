import type { ColorTheme } from "./themes.js";
import { loadGoogleFont } from "./fontLoader.js";
import { bodyStack, headingStack } from "./fontStacks.js";

type ThemeColors = ColorTheme["light"] | ColorTheme["dark"];

/** Every property this module has set on the page, so the selection can be taken off again */
const applied = new Set<string>();

function set(property: string, value: string): void {
  document.documentElement.style.setProperty(property, value);
  applied.add(property);
}

/** Takes the selection off the page, leaving the page's own styles */
export function clearApplied(): void {
  const root = document.documentElement;
  for (const property of applied) root.style.removeProperty(property);
  applied.clear();
}

export function applyThemeColors(colors: ThemeColors, isDarkMode: boolean): void {
  // Set color-scheme on document root for proper light/dark mode
  set("color-scheme", isDarkMode ? "dark" : "light");

  // Apply CSS variables to document root
  set("--color-primary", colors.primary);
  set("--color-primary-shadow", colors.primaryShadow);
  set("--color-accent", colors.accent);
  set("--color-accent-shadow", colors.accentShadow);
  set("--color-bg", colors.background);
  set("--color-card-bg", colors.cardBackground);
  set("--color-text", colors.text);
  set("--color-extra", colors.extra);

  // Also set aliases for common naming conventions
  set("--primary-color", colors.primary);
  set("--secondary-color", colors.accent);

  // Also explicitly set background and foreground colors
  set("--background-color", colors.background);
  set("--foreground-color", colors.text);

  // Apply heading colors
  const getColor = (colorKey: string) => {
    switch (colorKey) {
      case "primary":
        return colors.primary;
      case "accent":
        return colors.accent;
      case "text":
        return colors.text;
      default:
        return colors.text;
    }
  };

  set("--color-h1", getColor(colors.h1Color));
  set("--color-h2", getColor(colors.h2Color));
  set("--color-h3", getColor(colors.h3Color));
  // General heading color (uses h1 color as default)
  set("--color-heading", getColor(colors.h1Color));
}

export function applyFontStyles(headingFont: string, bodyFont: string): void {
  // Load Google Fonts before applying them
  loadGoogleFont(headingFont);
  loadGoogleFont(bodyFont);

  const headingFallback = headingStack(headingFont);
  const bodyFallback = bodyStack(bodyFont);

  set("--font-heading", headingFallback);
  set("--font-body", bodyFallback);
  // Also set aliases for alternate naming conventions
  set("--heading-font", headingFallback);
  set("--body-font", bodyFallback);
}
