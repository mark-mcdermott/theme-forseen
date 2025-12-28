const loadedFonts = new Set<string>();

export function loadGoogleFont(fontName: string): void {
  if (loadedFonts.has(fontName)) {
    return;
  }

  const fontNameForUrl = fontName.replace(/ /g, "+");

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontNameForUrl}:wght@400;500;600;700&display=swap`;

  document.head.appendChild(link);

  loadedFonts.add(fontName);
}

export function isFontLoaded(fontName: string): boolean {
  return loadedFonts.has(fontName);
}
