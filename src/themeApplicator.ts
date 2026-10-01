import type { ColorTheme } from "./themes.js";
import { loadGoogleFont } from "./fontLoader.js";
import { bodyStack, headingStack } from "./fontStacks.js";

type ThemeColors = ColorTheme["light"] | ColorTheme["dark"];

export function applyThemeColors(colors: ThemeColors, isDarkMode: boolean): void {
  const root = document.documentElement;

  // Set color-scheme on document root for proper light/dark mode
  root.style.colorScheme = isDarkMode ? "dark" : "light";

  // Apply CSS variables to document root
  root.style.setProperty("--color-primary", colors.primary);
  root.style.setProperty("--color-primary-shadow", colors.primaryShadow);
  root.style.setProperty("--color-accent", colors.accent);
  root.style.setProperty("--color-accent-shadow", colors.accentShadow);
  root.style.setProperty("--color-bg", colors.background);
  root.style.setProperty("--color-card-bg", colors.cardBackground);
  root.style.setProperty("--color-text", colors.text);
  root.style.setProperty("--color-extra", colors.extra);

  // Also set aliases for common naming conventions
  root.style.setProperty("--primary-color", colors.primary);
  root.style.setProperty("--secondary-color", colors.accent);

  // Also explicitly set background and foreground colors
  root.style.setProperty("--background-color", colors.background);
  root.style.setProperty("--foreground-color", colors.text);

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

  root.style.setProperty("--color-h1", getColor(colors.h1Color));
  root.style.setProperty("--color-h2", getColor(colors.h2Color));
  root.style.setProperty("--color-h3", getColor(colors.h3Color));
  // General heading color (uses h1 color as default)
  root.style.setProperty("--color-heading", getColor(colors.h1Color));
}

export function applyFontStyles(headingFont: string, bodyFont: string): void {
  // Load Google Fonts before applying them
  loadGoogleFont(headingFont);
  loadGoogleFont(bodyFont);

  const root = document.documentElement;
  const headingFallback = headingStack(headingFont);
  const bodyFallback = bodyStack(bodyFont);

  root.style.setProperty("--font-heading", headingFallback);
  root.style.setProperty("--font-body", bodyFallback);
  // Also set aliases for alternate naming conventions
  root.style.setProperty("--heading-font", headingFallback);
  root.style.setProperty("--body-font", bodyFallback);
}
