/**
 * The font-family stacks ThemeForseen sets, and the dev server writes, for
 * a named face: the face itself, then fallbacks of the same kind.
 */

const SERIF_HEADING_FONTS = [
  "Playfair Display",
  "Merriweather",
  "Lora",
  "DM Serif Display",
  "Crimson Text",
  "Abril Fatface",
  "Libre Baskerville",
  "Cormorant Garamond",
  "Spectral",
  "Yeseva One",
  "Arvo",
  "Vollkorn",
  "Bitter",
  "Cardo",
];

const SERIF_BODY_FONTS = [
  "Lora",
  "Merriweather",
  "Libre Baskerville",
  "Source Sans Pro",
];

const MONO_FONTS = ["Space Mono"];

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const MONO = '"Courier New", Courier, monospace';

export function headingStack(fontName: string): string {
  const fallback = SERIF_HEADING_FONTS.includes(fontName) ? SERIF : SANS;
  return `"${fontName}", ${fallback}`;
}

export function bodyStack(fontName: string): string {
  const fallback = MONO_FONTS.includes(fontName)
    ? MONO
    : SERIF_BODY_FONTS.includes(fontName)
      ? SERIF
      : SANS;
  return `"${fontName}", ${fallback}`;
}
