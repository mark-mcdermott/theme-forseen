const STORAGE_PREFIX = "themeforseen-";

export const STORAGE_KEYS = {
  DARK_MODE: `${STORAGE_PREFIX}darkmode`,
  LIGHT_THEME: `${STORAGE_PREFIX}lighttheme`,
  DARK_THEME: `${STORAGE_PREFIX}darktheme`,
  FONT: `${STORAGE_PREFIX}font`,
  STARRED_LIGHT: `${STORAGE_PREFIX}starred-light`,
  STARRED_DARK: `${STORAGE_PREFIX}starred-dark`,
  LOVED_LIGHT: `${STORAGE_PREFIX}loved-light`,
  LOVED_DARK: `${STORAGE_PREFIX}loved-dark`,
  STARRED_FONT: `${STORAGE_PREFIX}starred-font`,
  LOVED_FONTS: `${STORAGE_PREFIX}loved-fonts`,
  HEADING_FONT: `${STORAGE_PREFIX}heading-font`,
  BODY_FONT: `${STORAGE_PREFIX}body-font`,
  FILTER_TAGS: `${STORAGE_PREFIX}filter-tags`,
  FILTER_SEARCH: `${STORAGE_PREFIX}filter-search`,
  FILTER_HEADING_STYLES: `${STORAGE_PREFIX}filter-heading-styles`,
  FILTER_BODY_STYLES: `${STORAGE_PREFIX}filter-body-styles`,
  FILTER_HEARTED_ONLY: `${STORAGE_PREFIX}filter-hearted-only`,
  FILTER_STARRED_ONLY: `${STORAGE_PREFIX}filter-starred-only`,
  THEMES_COLLAPSED: `${STORAGE_PREFIX}themes-collapsed`,
  FONTS_COLLAPSED: `${STORAGE_PREFIX}fonts-collapsed`,
  VISIT_COUNT: `${STORAGE_PREFIX}visit-count`,
} as const;

export function getItem(key: string): string | null {
  return localStorage.getItem(key);
}

export function setItem(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function removeItem(key: string): void {
  localStorage.removeItem(key);
}

export function getInt(key: string, defaultValue = 0): number {
  const value = localStorage.getItem(key);
  return value ? parseInt(value, 10) : defaultValue;
}

export function setInt(key: string, value: number): void {
  localStorage.setItem(key, String(value));
}

export function getBool(key: string): boolean | null {
  const value = localStorage.getItem(key);
  if (value === null) return null;
  return value === "true";
}

export function setBool(key: string, value: boolean): void {
  localStorage.setItem(key, String(value));
}

export function getSet<T>(key: string): Set<T> {
  const value = localStorage.getItem(key);
  if (!value) return new Set();
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return new Set(parsed);
  } catch {
    // ignore corrupted data
  }
  return new Set();
}

export function setSet<T>(key: string, value: Set<T>): void {
  localStorage.setItem(key, JSON.stringify(Array.from(value)));
}
