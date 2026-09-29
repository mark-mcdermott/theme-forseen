import type { ColorTheme, FontPairing } from "./themes.js";

export interface Collection {
  colorThemes: ColorTheme[];
  fontPairings: FontPairing[];
  tags: string[];
}

let collection: Promise<Collection> | null = null;

// The data is most of the package's weight, so it is fetched separately from the element's code
export function loadCollection(): Promise<Collection> {
  collection ??= import("./data.js").then((data) => ({
    colorThemes: data.colorThemes,
    fontPairings: data.fontPairings,
    tags: data.getAllThemeTags(),
  }));
  return collection;
}

export function indexOfName(
  items: { name: string }[],
  name: string | null
): number {
  if (!name) return -1;
  const wanted = name.trim().toLowerCase();
  return items.findIndex((item) => item.name.toLowerCase() === wanted);
}
