import type { ColorTheme, FontPairing } from "./themes.js";
import { indexOfName, loadCollection } from "./collection.js";
import { getTemplate } from "./template.js";
import namer from "color-namer";
import {
  STORAGE_KEYS,
  getItem,
  setItem,
  getInt,
  setInt,
  getBool,
  setBool,
  getSet,
  setSet,
  removeItem,
} from "./storage.js";
import { applyThemeColors, applyFontStyles, clearApplied } from "./themeApplicator.js";
import { loadGoogleFont } from "./fontLoader.js";
import { icons } from "./marks.js";
import { activationSections, showActivationModal } from "./activationModal.js";

const DEV_SERVER_URL = "http://localhost:3847";
const DEV_SERVER_TIMEOUT = 1000;

interface DevServerResponse {
  success: boolean;
  message: string;
  file?: string;
  projectType?: string;
  created?: boolean;
  importInstruction?: string;
}

async function tryApplyViaServer(
  type: "theme" | "font",
  colors: ColorTheme["light"] | ColorTheme["dark"] | null,
  fonts: ThemeForseenState["fonts"] | null,
  isDarkMode: boolean
): Promise<DevServerResponse | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEV_SERVER_TIMEOUT);

  try {
    const body: Record<string, unknown> = { type };

    if (type === "theme" && colors) {
      body.data = {
        colors: {
          primary: colors.primary,
          primaryShadow: colors.primaryShadow,
          accent: colors.accent,
          accentShadow: colors.accentShadow,
          background: colors.background,
          cardBackground: colors.cardBackground,
          text: colors.text,
          extra: colors.extra,
        },
        isDarkMode,
      };
    } else if (type === "font" && fonts) {
      // `font` is what servers before 0.6.2 read
      body.data = { heading: fonts.heading, body: fonts.body, font: fonts.heading };
    }

    const response = await fetch(`${DEV_SERVER_URL}/api/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return await response.json();
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

function showToast(
  shadowRoot: ShadowRoot,
  message: string,
  isSuccess: boolean
): void {
  // Remove existing toast if any
  const existingToast = shadowRoot.querySelector(".theme-forseen-toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = `theme-forseen-toast ${isSuccess ? "" : "error"}`;
  toast.innerHTML = `
    <span class="toast-icon">${isSuccess ? "✓" : "✕"}</span>
    <span class="toast-message">${message}</span>
  `;

  // In the top layer where the browser has one, so no part of the page can cover it
  toast.setAttribute("popover", "manual");
  shadowRoot.appendChild(toast);
  toast.showPopover?.();

  requestAnimationFrame(() => toast.classList.add("shown"));

  setTimeout(() => {
    toast.classList.remove("shown");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * Brings a row into view by scrolling its column and nothing else:
 * scrollIntoView would move the page too, which a docked drawer must not do.
 * Measured on the screen and converted, so it holds when a page zooms the drawer.
 */
function scrollWithin(list: HTMLElement, row: HTMLElement, where: "center" | "nearest", smooth = false): void {
  const box = list.getBoundingClientRect();
  const rowBox = row.getBoundingClientRect();
  const scale = box.height / list.clientHeight || 1;

  let distance = 0;
  if (where === "center") distance = rowBox.top + rowBox.height / 2 - (box.top + box.bottom) / 2;
  else if (rowBox.top < box.top) distance = rowBox.top - box.top;
  else if (rowBox.bottom > box.bottom) distance = rowBox.bottom - box.bottom;

  if (distance) list.scrollBy({ top: distance / scale, behavior: smooth ? "smooth" : "auto" });
}

function favoriteButtons(type: "theme" | "font", index: number): string {
  return `
    <div class="favorites">
      <button class="favorite-icon heart" data-type="${type}" data-index="${index}" title="Like" aria-label="Like">${icons.heart}</button>
      <button class="favorite-icon star" data-type="${type}" data-index="${index}" title="Star" aria-label="Star">${icons.star}</button>
    </div>`;
}

/** What the pairing is made of, from the data: a serif heading with a sans body is "Serif + Sans" */
function describeStyles(pairing: FontPairing): string {
  const first = (styles: string[]) => capitalize(styles[0] ?? "");
  return `${first(pairing.headingStyle)} + ${first(pairing.bodyStyle)}`;
}

/**
 * The selected row's controls: the two faces in use, each of which can be kept
 * while another pairing is chosen, and the swap.
 */
function keepControls(fonts: { heading: string; body: string }, kept: { heading: boolean; body: boolean }): string {
  const keep = (role: "heading" | "body") => `
    <button class="keep-btn" data-keep="${role}" aria-pressed="${kept[role]}" title="${keepTitle(role, fonts[role], kept[role])}">
      ${icons.pin}<span class="keep-text"><span class="keep-role">${capitalize(role)}</span><span class="keep-face">${fonts[role]}</span></span>
    </button>`;

  return `
    <div class="font-keep" role="group" aria-label="Faces in use">
      ${keep("heading")}
      ${keep("body")}
      <button class="font-swap" title="Swap heading and body" aria-label="Swap heading and body">${icons.swap}</button>
    </div>`;
}

function keepTitle(role: "heading" | "body", face: string, kept: boolean): string {
  const use = role === "heading" ? "headings" : "body text";
  return kept
    ? `${face} is kept for ${use}. Press to let it change with the pairing`
    : `Keep ${face} for ${use} while you choose another pairing`;
}

// Cache for color names to avoid repeated calculations
const colorNameCache = new Map<string, string[]>();

// Get all color names for a hex color (uses ntc list with 1500+ names)
function getColorNames(hex: string): string[] {
  const normalizedHex = hex.toUpperCase();
  if (colorNameCache.has(normalizedHex)) {
    return colorNameCache.get(normalizedHex)!;
  }

  try {
    const result = namer(hex);
    // Get names from multiple lists for better coverage
    const names = [
      ...result.ntc.slice(0, 3).map((c) => c.name.toLowerCase()),
      ...result.basic.slice(0, 2).map((c) => c.name.toLowerCase()),
      ...result.html.slice(0, 2).map((c) => c.name.toLowerCase()),
    ];
    // Remove duplicates
    const uniqueNames = [...new Set(names)];
    colorNameCache.set(normalizedHex, uniqueNames);
    return uniqueNames;
  } catch {
    colorNameCache.set(normalizedHex, []);
    return [];
  }
}

// Check if any color name matches the search term
function colorMatchesSearch(hex: string, searchTerm: string): boolean {
  const names = getColorNames(hex);
  return names.some((name) => name.includes(searchTerm));
}

export interface ThemeForseenState {
  mode: "light" | "dark";
  theme: { name: string; colors: ColorTheme["light"] };
  fonts: { heading: string; body: string };
  open: boolean;
  /** The selection is on the page. False while the page is shown as it is without it, to compare */
  previewing: boolean;
}

export const CHANGE_EVENT = "themeforseen:change";

const NOT_STORED = -1;

export class ThemeForseen extends HTMLElement {
  static observedAttributes = ["open"];

  private colorThemes: ColorTheme[] = [];
  private fontPairings: FontPairing[] = [];
  private tags: string[] = [];
  private defaultFontPairing = 0;
  private isReady = false;
  private lastAnnounced = "";
  private fontRowObserver: IntersectionObserver | null = null;

  private isOpen = false;
  private previewing = true;
  private isDarkMode = false;
  private focusedColumn: "themes" | "fonts" = "themes";

  private get mode(): "light" | "dark" {
    return this.isDarkMode ? "dark" : "light";
  }

  private selectedTheme = { light: NOT_STORED, dark: NOT_STORED };
  private starredTheme: { light: number | null; dark: number | null } = {
    light: null,
    dark: null,
  };
  private lovedThemes = { light: new Set<number>(), dark: new Set<number>() };

  private selectedFontPairing = 0;
  private hasStoredFontPairing = false;
  private starredFont: number | null = null;
  private lovedFonts = new Set<number>();

  // A face kept while other pairings are chosen; the other face comes from the pairing
  private keptHeading: string | null = null;
  private keptBody: string | null = null;

  private selectedTags = new Set<string>();
  private searchText = "";
  private fontSearchText = "";
  private selectedHeadingStyles = new Set<string>();
  private selectedBodyStyles = new Set<string>();
  private showHeartedOnly = false;
  private showStarredOnly = false;

  private themesColumnCollapsed = false;
  private fontsColumnCollapsed = false;
  private filterDropdownOpen = false;
  private filterDropdownScrollTop = 0;
  private clickOutsideHandlerAdded = false;
  private fontFilterClickOutsideHandlerAdded = false;

  private isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  private activeThemeIndex: number | null = null;
  private activeFontIndex: number | null = null;

  private drawerElement!: HTMLElement;
  private drawerToggle!: HTMLElement;
  private backdrop!: HTMLElement;
  private themesColumn!: HTMLElement;
  private fontsColumn!: HTMLElement;
  private darkModeObserver: MutationObserver | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.loadFromLocalStorage();
    this.incrementVisitCounter();
    this.checkDarkMode(); // Must be before render() so isDarkMode is set correctly

    this.start().catch((error) => {
      console.error("[ThemeForseen] Could not load the collection.", error);
    });
  }

  attributeChangedCallback(
    name: string,
    _previous: string | null,
    value: string | null
  ) {
    if (name === "open") this.setOpen(value !== null);
  }

  /** What is applied to the page right now. Null until the collection has loaded. */
  get state(): ThemeForseenState | null {
    if (!this.isReady) return null;

    const theme = this.colorThemes[this.selectedTheme[this.mode]];
    return {
      mode: this.mode,
      theme: { name: theme.name, colors: { ...theme[this.mode] } },
      fonts: this.currentFonts(),
      open: this.isOpen,
      previewing: this.previewing,
    };
  }

  open() {
    this.setOpen(true);
  }

  close() {
    this.setOpen(false);
  }

  toggle() {
    this.setOpen(!this.isOpen);
  }

  private setOpen(open: boolean) {
    if (this.isOpen === open) return;

    this.isOpen = open;
    this.toggleAttribute("open", open);

    if (!this.isReady) return;
    this.applyDrawerState();
    if (open) this.revealSelections();
    this.announce();
  }

  // Each list opens on its selection rather than its top
  private revealSelections() {
    const rows = [
      `.theme-item[data-index="${this.selectedTheme[this.mode]}"]`,
      `.font-item[data-index="${this.selectedFontPairing}"]`,
    ];
    const reveal = () => {
      for (const selector of rows) {
        const row = this.shadowRoot?.querySelector<HTMLElement>(selector);
        const list = row?.closest<HTMLElement>(".themes-list, .fonts-list");
        if (row && list) scrollWithin(list, row, "center");
      }
    };

    // Rows out of view are measured by estimate, so settle once they have been laid out
    reveal();
    requestAnimationFrame(reveal);
  }

  private resolveSelections() {
    const defaultTheme = this.indexOfDefault(this.colorThemes, "default-theme");
    this.defaultFontPairing = this.indexOfDefault(
      this.fontPairings,
      "default-fonts"
    );

    for (const mode of ["light", "dark"] as const) {
      if (!this.colorThemes[this.selectedTheme[mode]]) {
        this.selectedTheme[mode] = defaultTheme;
      }
    }

    // Before faces could be kept, choosing one alone stored no pairing at all
    const pairingIsMissing =
      this.selectedFontPairing < 0 ||
      this.selectedFontPairing >= this.fontPairings.length;
    if (!this.hasStoredFontPairing || pairingIsMissing) {
      this.selectedFontPairing = this.defaultFontPairing;
    }
  }

  private indexOfDefault(items: { name: string }[], attribute: string): number {
    const name = this.getAttribute(attribute);
    if (!name) return 0;

    const index = indexOfName(items, name);
    if (index >= 0) return index;

    console.warn(
      `[ThemeForseen] ${attribute}="${name}" is not in the collection. Using "${items[0].name}".`
    );
    return 0;
  }

  // The mode was changed from outside the drawer, so the page is repainted whether or not the drawer is open
  private followMode(isDark: boolean) {
    if (this.isDarkMode === isDark) return;

    this.isDarkMode = isDark;
    if (!this.isReady) return;

    this.applyTheme(true);
    this.updateModeButtons();
    this.renderThemes();
  }

  private announce() {
    const state = this.state;
    if (!state) return;

    const serialized = JSON.stringify(state);
    if (serialized === this.lastAnnounced) return;
    this.lastAnnounced = serialized;

    this.dispatchEvent(
      new CustomEvent<ThemeForseenState>(CHANGE_EVENT, {
        detail: state,
        bubbles: true,
        composed: true,
      })
    );
  }

  private async start() {
    const collection = await loadCollection();
    if (!this.isConnected) return;

    this.colorThemes = collection.colorThemes;
    this.fontPairings = collection.fontPairings;
    this.tags = collection.tags;
    this.resolveSelections();

    this.render();
    this.setAttribute("mode", this.mode);
    this.attachPersistentListeners();
    this.attachEventListeners();
    this.applyDrawerState();
    this.applyTheme(true); // Force on initial load
    this.applyFonts();

    // Hide instructions if user has visited enough times
    this.maybeHideInstructions();

    this.isReady = true;
    if (this.isOpen) this.revealSelections();
    this.announce();

    // Jiggle the bookmark after 7 seconds to attract attention
    setTimeout(() => {
      const toggle = this.shadowRoot?.querySelector(".drawer-toggle");
      if (toggle && !this.isOpen) {
        toggle.classList.add("jiggle");
        // Remove the class after animation completes so it can be triggered again if needed
        setTimeout(() => {
          toggle.classList.remove("jiggle");
        }, 600);
      }
    }, 7000);
  }

  private checkDarkMode() {
    const saved = getBool(STORAGE_KEYS.DARK_MODE);
    if (saved !== null) {
      this.isDarkMode = saved;
    } else {
      this.isDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
    }

    // Watch for system preference changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (getBool(STORAGE_KEYS.DARK_MODE) === null) {
          this.followMode(e.matches);
        }
      });

    // Watch for color-scheme changes from external sources via MutationObserver
    this.darkModeObserver = new MutationObserver(() => {
      // With the selection off the page, the page's style says nothing about the mode
      if (!this.previewing) return;

      const currentColorScheme =
        document.documentElement.style.colorScheme ||
        getComputedStyle(document.documentElement).colorScheme;
      this.followMode(currentColorScheme === "dark");
    });

    this.darkModeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // Listen for custom event from external dark mode toggles
    window.addEventListener("darkmode-change", ((e: CustomEvent) => {
      this.followMode(e.detail?.dark ?? false);
    }) as EventListener);
  }

  private loadFromLocalStorage() {
    const lightTheme = getItem(STORAGE_KEYS.LIGHT_THEME);
    const darkTheme = getItem(STORAGE_KEYS.DARK_THEME);
    const font = getItem(STORAGE_KEYS.FONT);
    if (lightTheme) this.selectedTheme.light = parseInt(lightTheme);
    if (darkTheme) this.selectedTheme.dark = parseInt(darkTheme);
    if (font) {
      this.selectedFontPairing = parseInt(font);
      this.hasStoredFontPairing = true;
    }

    const starredLight = getItem(STORAGE_KEYS.STARRED_LIGHT);
    const starredDark = getItem(STORAGE_KEYS.STARRED_DARK);
    if (starredLight) this.starredTheme.light = parseInt(starredLight);
    if (starredDark) this.starredTheme.dark = parseInt(starredDark);

    this.lovedThemes.light = getSet(STORAGE_KEYS.LOVED_LIGHT);
    this.lovedThemes.dark = getSet(STORAGE_KEYS.LOVED_DARK);

    const starredFont = getItem(STORAGE_KEYS.STARRED_FONT);
    if (starredFont) this.starredFont = parseInt(starredFont);

    this.lovedFonts = getSet(STORAGE_KEYS.LOVED_FONTS);

    this.keptHeading = getItem(STORAGE_KEYS.HEADING_FONT);
    this.keptBody = getItem(STORAGE_KEYS.BODY_FONT);

    this.selectedTags = getSet(STORAGE_KEYS.FILTER_TAGS);
    this.searchText = getItem(STORAGE_KEYS.FILTER_SEARCH) || "";
    this.fontSearchText = getItem(STORAGE_KEYS.FILTER_FONT_SEARCH) || "";
    // One heading style at a time now; an older store may hold several
    this.selectedHeadingStyles = new Set(
      Array.from(getSet<string>(STORAGE_KEYS.FILTER_HEADING_STYLES)).slice(0, 1)
    );
    this.selectedBodyStyles = getSet(STORAGE_KEYS.FILTER_BODY_STYLES);

    const heartedOnly = getBool(STORAGE_KEYS.FILTER_HEARTED_ONLY);
    const starredOnly = getBool(STORAGE_KEYS.FILTER_STARRED_ONLY);
    if (heartedOnly !== null) this.showHeartedOnly = heartedOnly;
    if (starredOnly !== null) this.showStarredOnly = starredOnly;

    const themesCollapsed = getBool(STORAGE_KEYS.THEMES_COLLAPSED);
    const fontsCollapsed = getBool(STORAGE_KEYS.FONTS_COLLAPSED);
    if (themesCollapsed !== null) this.themesColumnCollapsed = themesCollapsed;
    if (fontsCollapsed !== null) this.fontsColumnCollapsed = fontsCollapsed;

    // On mobile, ensure only one column is open (accordion behavior)
    if (
      this.isMobile() &&
      !this.themesColumnCollapsed &&
      !this.fontsColumnCollapsed
    ) {
      this.fontsColumnCollapsed = true;
    }
  }

  private incrementVisitCounter() {
    const visitCount = getInt(STORAGE_KEYS.VISIT_COUNT);
    setInt(STORAGE_KEYS.VISIT_COUNT, visitCount + 1);
  }

  private maybeHideInstructions() {
    const visitCount = getInt(STORAGE_KEYS.VISIT_COUNT);
    if (visitCount >= 10) {
      this.shadowRoot?.querySelectorAll(".instructions").forEach((el) => {
        (el as HTMLElement).classList.add("hidden");
      });
    }
  }

  private saveToLocalStorage() {
    setBool(STORAGE_KEYS.DARK_MODE, this.isDarkMode);

    setInt(STORAGE_KEYS.LIGHT_THEME, this.selectedTheme.light);
    setInt(STORAGE_KEYS.DARK_THEME, this.selectedTheme.dark);
    setInt(STORAGE_KEYS.FONT, this.selectedFontPairing);

    if (this.starredTheme.light !== null) {
      setInt(STORAGE_KEYS.STARRED_LIGHT, this.starredTheme.light);
    } else {
      removeItem(STORAGE_KEYS.STARRED_LIGHT);
    }
    if (this.starredTheme.dark !== null) {
      setInt(STORAGE_KEYS.STARRED_DARK, this.starredTheme.dark);
    } else {
      removeItem(STORAGE_KEYS.STARRED_DARK);
    }

    setSet(STORAGE_KEYS.LOVED_LIGHT, this.lovedThemes.light);
    setSet(STORAGE_KEYS.LOVED_DARK, this.lovedThemes.dark);

    if (this.starredFont !== null) {
      setInt(STORAGE_KEYS.STARRED_FONT, this.starredFont);
    } else {
      removeItem(STORAGE_KEYS.STARRED_FONT);
    }

    setSet(STORAGE_KEYS.LOVED_FONTS, this.lovedFonts);

    if (this.keptHeading) {
      setItem(STORAGE_KEYS.HEADING_FONT, this.keptHeading);
    } else {
      removeItem(STORAGE_KEYS.HEADING_FONT);
    }
    if (this.keptBody) {
      setItem(STORAGE_KEYS.BODY_FONT, this.keptBody);
    } else {
      removeItem(STORAGE_KEYS.BODY_FONT);
    }

    setSet(STORAGE_KEYS.FILTER_TAGS, this.selectedTags);
    setItem(STORAGE_KEYS.FILTER_SEARCH, this.searchText);
    setItem(STORAGE_KEYS.FILTER_FONT_SEARCH, this.fontSearchText);
    setSet(STORAGE_KEYS.FILTER_HEADING_STYLES, this.selectedHeadingStyles);
    setSet(STORAGE_KEYS.FILTER_BODY_STYLES, this.selectedBodyStyles);
    setBool(STORAGE_KEYS.FILTER_HEARTED_ONLY, this.showHeartedOnly);
    setBool(STORAGE_KEYS.FILTER_STARRED_ONLY, this.showStarredOnly);

    setBool(STORAGE_KEYS.THEMES_COLLAPSED, this.themesColumnCollapsed);
    setBool(STORAGE_KEYS.FONTS_COLLAPSED, this.fontsColumnCollapsed);
  }

  private render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = getTemplate({
      themesColumnCollapsed: this.themesColumnCollapsed,
      fontsColumnCollapsed: this.fontsColumnCollapsed,
      isDarkMode: this.isDarkMode,
      searchText: this.searchText,
      fontSearchText: this.fontSearchText,
      selectedTags: this.selectedTags,
      selectedHeadingStyles: this.selectedHeadingStyles,
      selectedBodyStyles: this.selectedBodyStyles,
      showHeartedOnly: this.showHeartedOnly,
      showStarredOnly: this.showStarredOnly,
      tags: this.tags,
    });

    this.drawerElement = this.shadowRoot.querySelector(".drawer")!;
    this.drawerToggle = this.shadowRoot.querySelector(".drawer-toggle")!;
    this.backdrop = this.shadowRoot.querySelector(".backdrop")!;
    this.themesColumn = this.shadowRoot.querySelector(
      '[data-column="themes"]'
    )!;
    this.fontsColumn = this.shadowRoot.querySelector('[data-column="fonts"]')!;

    this.renderThemes();
    this.renderFonts();
  }

  private filterTheme(theme: ColorTheme, index: number): boolean {
    if (this.showStarredOnly && this.starredTheme[this.mode] !== index) return false;
    if (this.showHeartedOnly && !this.lovedThemes[this.mode].has(index)) return false;

    // Filter by tags if any are selected
    if (this.selectedTags.size > 0) {
      const themeTags = theme.tags || [];
      const hasMatchingTag = Array.from(this.selectedTags).some((tag) =>
        themeTags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    // Filter by search text
    if (this.searchText.trim()) {
      const search = this.searchText.trim().toLowerCase();
      const colors = this.isDarkMode ? theme.dark : theme.light;

      // Check if searching by name
      if (theme.name.toLowerCase().includes(search)) {
        return true;
      }

      // Check if searching by color (hex code)
      const colorValues = [
        colors.primary,
        colors.primaryShadow,
        colors.accent,
        colors.accentShadow,
        colors.background,
        colors.cardBackground,
        colors.text,
        colors.extra,
      ];

      // Match by hex code
      const hexMatch = colorValues.some(
        (color) =>
          color.toLowerCase().includes(search) ||
          color.toLowerCase().replace("#", "").includes(search.replace("#", ""))
      );
      if (hexMatch) return true;

      // Match by color name (e.g., "magenta", "teal", "coral")
      // Only check main colors (primary, accent, extra) for performance
      const mainColors = [colors.primary, colors.accent, colors.extra];
      return mainColors.some((color) => colorMatchesSearch(color, search));
    }

    return true;
  }

  private renderThemes() {
    const themesList = this.shadowRoot?.querySelector(".themes-list");
    if (!themesList) return;

    const filteredThemes = this.colorThemes.filter((theme, index) =>
      this.filterTheme(theme, index)
    );

    themesList.innerHTML = filteredThemes
      .map((theme, _) => {
        const index = this.colorThemes.indexOf(theme);
        const colors = this.isDarkMode ? theme.dark : theme.light;
        // Selection classes added by updateThemeSelection()
        return `
        <div class="theme-item" data-index="${index}">
          <div class="theme-main">
            <div class="theme-name">${theme.name}</div>
            <div class="theme-colors">
              <div class="color-swatch" style="background-color: ${colors.primary}" title="Primary"></div>
              <div class="color-swatch" style="background-color: ${colors.accent}" title="Accent"></div>
              <div class="color-swatch" style="background-color: ${colors.background}" title="Background"></div>
              <div class="color-swatch" style="background-color: ${colors.cardBackground}" title="Card Background"></div>
              <div class="color-swatch" style="background-color: ${colors.text}" title="Text"></div>
            </div>
          </div>
          ${favoriteButtons("theme", index)}
        </div>
      `;
      })
      .join("");

    this.updateThemeSelection();
    this.restoreThemeFavorites();
  }

  private restoreThemeFavorites() {
    const starredIndex = this.starredTheme[this.mode];
    if (starredIndex !== null) {
      const star = this.shadowRoot?.querySelector(
        `.star[data-type="theme"][data-index="${starredIndex}"]`
      );
      star?.classList.add("starred");
    }

    this.lovedThemes[this.mode].forEach((index) => {
      const heart = this.shadowRoot?.querySelector(
        `.heart[data-type="theme"][data-index="${index}"]`
      );
      heart?.classList.add("loved");
    });
  }

  private filterFontPairing(pairing: FontPairing): boolean {
    const search = this.fontSearchText.trim().toLowerCase();
    if (search && !pairing.name.toLowerCase().includes(search)) return false;

    // Filter by heading styles if any are selected
    if (this.selectedHeadingStyles.size > 0) {
      const hasMatchingHeadingStyle = pairing.headingStyle.some((style) =>
        this.selectedHeadingStyles.has(style)
      );
      if (!hasMatchingHeadingStyle) return false;
    }

    // Filter by body styles if any are selected
    if (this.selectedBodyStyles.size > 0) {
      const hasMatchingBodyStyle = pairing.bodyStyle.some((style) =>
        this.selectedBodyStyles.has(style)
      );
      if (!hasMatchingBodyStyle) return false;
    }

    return true;
  }

  private renderFonts() {
    const fontsList = this.shadowRoot?.querySelector(".fonts-list");
    if (!fontsList) return;

    const filteredPairings = this.fontPairings.filter((pairing) =>
      this.filterFontPairing(pairing)
    );

    fontsList.innerHTML = filteredPairings
      .map((pairing, _) => {
        const index = this.fontPairings.indexOf(pairing);
        const isActive = this.activeFontIndex === index;
        return `
        <div class="font-item ${
          isActive ? "active" : ""
        }" data-index="${index}">
          <div class="font-sample" style="font-family: '${pairing.heading}', sans-serif" aria-hidden="true">Aa</div>
          <div class="font-main">
            <div class="font-name">${pairing.name}</div>
            <div class="font-styles" title="Heading style + body style">${describeStyles(pairing)}</div>
          </div>
          ${favoriteButtons("font", index)}
          ${index === this.selectedFontPairing ? this.keepControlsMarkup() : ""}
        </div>
      `;
      })
      .join("");

    this.watchFontRows();
    this.updateFontSelection();
    this.restoreFontFavorites();
  }

  // A pairing's faces are requested when its row comes into view, and only while the drawer is open
  private watchFontRows() {
    this.fontRowObserver?.disconnect();
    this.fontRowObserver = null;
    if (!this.isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const row = entry.target as HTMLElement;
          const pairing = this.fontPairings[parseInt(row.dataset.index || "")];
          observer.unobserve(row);
          if (!pairing) continue;

          loadGoogleFont(pairing.heading);
          loadGoogleFont(pairing.body);
        }
      },
      {
        root: this.fontsColumn.querySelector(".fonts-list"),
        rootMargin: "200px 0px",
      }
    );

    this.fontsColumn
      .querySelectorAll(".font-item")
      .forEach((row) => observer.observe(row));
    this.fontRowObserver = observer;
  }

  private restoreFontFavorites() {
    if (this.starredFont !== null) {
      const star = this.shadowRoot?.querySelector(
        `.star[data-type="font"][data-index="${this.starredFont}"]`
      );
      star?.classList.add("starred");
    }

    this.lovedFonts.forEach((index) => {
      const heart = this.shadowRoot?.querySelector(
        `.heart[data-type="font"][data-index="${index}"]`
      );
      heart?.classList.add("loved");
    });
  }

  private attachFilterListeners() {
    const filterInput = this.shadowRoot?.querySelector(
      ".filter-input"
    ) as HTMLInputElement;
    filterInput?.addEventListener("input", (e) => {
      this.searchText = (e.target as HTMLInputElement).value;
      this.saveToLocalStorage();
      this.renderThemes();
    });

    const filterDropdownBtn = this.shadowRoot?.querySelector(
      ".filter-dropdown-btn"
    );
    const filterDropdown = this.shadowRoot?.querySelector(".filter-dropdown");

    filterDropdownBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.filterDropdownOpen = !this.filterDropdownOpen;
      filterDropdown?.classList.toggle("hidden");
      filterDropdownBtn.setAttribute("aria-expanded", String(this.filterDropdownOpen));
      if (this.filterDropdownOpen) (filterDropdown?.querySelector(".dropdown-search") as HTMLInputElement | null)?.focus();
    });

    const tagSearch = filterDropdown?.querySelector(".dropdown-search") as HTMLInputElement | null;
    tagSearch?.addEventListener("input", () => {
      const needle = tagSearch.value.trim().toLowerCase();
      filterDropdown?.querySelectorAll<HTMLElement>(".filter-option[data-tag]").forEach((option) => {
        option.classList.toggle("hidden", !option.dataset.tag!.includes(needle));
      });
    });
    tagSearch?.addEventListener("click", (e) => e.stopPropagation());

    this.shadowRoot?.querySelectorAll<HTMLElement>(".pill[data-favorites]").forEach((pillButton) => {
      pillButton.addEventListener("click", () => {
        const which = pillButton.dataset.favorites;
        this.showStarredOnly = which === "starred";
        this.showHeartedOnly = which === "hearted";
        this.shadowRoot?.querySelectorAll(".pill[data-favorites]").forEach((other) => {
          other.setAttribute("aria-pressed", String(other === pillButton));
        });
        this.saveToLocalStorage();
        this.renderThemes();
      });
    });

    // Close dropdown when clicking outside (only add once since shadowRoot persists)
    if (!this.clickOutsideHandlerAdded) {
      this.clickOutsideHandlerAdded = true;
      this.shadowRoot?.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        // Don't interfere with favorite clicks
        if (target.closest(".favorite-icon")) return;
        const currentFilterContainer =
          this.shadowRoot?.querySelector(".filter-container");
        const currentFilterDropdown =
          this.shadowRoot?.querySelector(".filter-dropdown");
        if (
          this.filterDropdownOpen &&
          !currentFilterContainer?.contains(e.target as Node)
        ) {
          this.filterDropdownOpen = false;
          currentFilterDropdown?.classList.add("hidden");
          this.shadowRoot?.querySelector(".filter-dropdown-btn")?.setAttribute("aria-expanded", "false");
        }
      });
    }

    // Stop clicks on filter options from bubbling (user may click label, not just checkbox)
    this.shadowRoot
      ?.querySelectorAll(".filter-container .filter-option")
      .forEach((option) => {
        option.addEventListener("click", (e) => {
          e.stopPropagation();
        });
      });

    this.shadowRoot
      ?.querySelectorAll(
        ".filter-container .filter-option input[type='checkbox']"
      )
      .forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
          const option = (e.target as HTMLInputElement).closest(
            ".filter-option"
          );

          // Handle tag filters
          const tag = option?.getAttribute("data-tag");
          if (tag) {
            if ((e.target as HTMLInputElement).checked) {
              this.selectedTags.add(tag);
            } else {
              this.selectedTags.delete(tag);
            }
            // Save scroll position before re-render
            const filterDropdown = this.shadowRoot?.querySelector(
              ".filter-dropdown"
            ) as HTMLElement | null;
            if (filterDropdown) {
              this.filterDropdownScrollTop = filterDropdown.scrollTop;
            }
            this.saveToLocalStorage();
            this.render();
            this.applyDrawerState();
            this.applyFilterDropdownState();
            this.attachEventListeners();
            this.renderThemes();
            this.renderFonts();
          }
        });
      });

    this.shadowRoot?.querySelectorAll(".filter-tag-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tag = (e.currentTarget as HTMLElement).getAttribute("data-tag");
        if (tag) {
          this.selectedTags.delete(tag);
          this.saveToLocalStorage();
          this.render();
          this.applyDrawerState();
          this.attachEventListeners();
          this.renderThemes();
          this.renderFonts();
        }
      });
    });
  }

  private updateFontFilterButtonText() {
    const label = this.shadowRoot?.querySelector(
      '.font-filter-dropdown-btn[data-filter-type="body"] .menu-label'
    );
    if (label) {
      label.textContent =
        this.selectedBodyStyles.size > 0
          ? Array.from(this.selectedBodyStyles).map(capitalize).join(", ")
          : "Any body";
    }
  }

  private attachFontFilterListeners() {
    const searchInput = this.shadowRoot?.querySelector(".font-filter-input") as HTMLInputElement | null;
    searchInput?.addEventListener("input", () => {
      this.fontSearchText = searchInput.value;
      this.saveToLocalStorage();
      this.renderFonts();
    });

    this.shadowRoot?.querySelectorAll<HTMLElement>(".pill[data-style]").forEach((pillButton) => {
      pillButton.addEventListener("click", () => {
        const style = pillButton.dataset.style!;
        this.selectedHeadingStyles = new Set(style === "all" ? [] : [style]);
        this.shadowRoot?.querySelectorAll(".pill[data-style]").forEach((other) => {
          other.setAttribute("aria-pressed", String(other === pillButton));
        });
        this.saveToLocalStorage();
        this.renderFonts();
      });
    });

    this.shadowRoot
      ?.querySelectorAll(".font-filter-dropdown-btn")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const filterType = (e.currentTarget as HTMLElement).getAttribute(
            "data-filter-type"
          );
          const dropdown = this.shadowRoot?.querySelector(
            `.font-filter-dropdown[data-filter-type="${filterType}"]`
          );
          dropdown?.classList.toggle("hidden");
          btn.setAttribute("aria-expanded", String(!dropdown?.classList.contains("hidden")));
        });
      });

    this.shadowRoot
      ?.querySelectorAll(
        ".font-filter-dropdown .filter-option input[type='checkbox']"
      )
      .forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
          const input = e.target as HTMLInputElement;
          const option = input.closest(".filter-option");
          const style = option?.getAttribute("data-style");
          const dropdown = option?.closest(".font-filter-dropdown");
          const filterType = dropdown?.getAttribute("data-filter-type") as
            | "heading"
            | "body";

          if (style && filterType) {
            const targetSet =
              filterType === "heading"
                ? this.selectedHeadingStyles
                : this.selectedBodyStyles;

            if (input.checked) {
              targetSet.add(style);
            } else {
              targetSet.delete(style);
            }

            this.saveToLocalStorage();
            this.updateFontFilterButtonText();
            this.renderFonts();
          }
        });
      });

    // Close font filter dropdowns when clicking outside
    if (!this.fontFilterClickOutsideHandlerAdded) {
      this.fontFilterClickOutsideHandlerAdded = true;
      this.shadowRoot?.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        // Only keep dropdown open if clicking inside dropdown or on its button
        const isInsideDropdown = target.closest(".font-filter-dropdown");
        const isDropdownButton = target.closest(".font-filter-dropdown-btn");
        if (!isInsideDropdown && !isDropdownButton) {
          // Close all font filter dropdowns
          this.shadowRoot
            ?.querySelectorAll(".font-filter-dropdown")
            .forEach((dropdown) => {
              dropdown.classList.add("hidden");
            });
          this.shadowRoot
            ?.querySelectorAll(".font-filter-dropdown-btn")
            .forEach((button) => button.setAttribute("aria-expanded", "false"));
        }
      });
    }
  }

  // Listeners on the document and the shadow root outlive every re-render, so they are attached once
  private attachPersistentListeners() {
    document.addEventListener("keydown", (e) => {
      if (!this.isOpen) return;
      // Docked, the drawer is one part of a page: its keys work while it has the pointer or the focus
      if (this.hasAttribute("docked") && !this.matches(":hover") && !this.shadowRoot?.activeElement) return;

      // Check if user is typing in an input field
      const activeElement =
        this.shadowRoot?.activeElement || document.activeElement;
      const isTypingInInput =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA";

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        // Only prevent arrow keys if not in an input
        if (!isTypingInInput) {
          e.preventDefault();
          this.handleArrowKey(e.key === "ArrowDown");
        }
      }

      // Star/Heart keyboard shortcuts (only when not typing in input)
      if (
        !isTypingInInput &&
        (e.key.toLowerCase() === "s" || e.key.toLowerCase() === "h")
      ) {
        e.preventDefault();
        this.handleFavoriteShortcut(e.key.toLowerCase() as "s" | "h");
      }
    });

    // Delegated click handler for buttons (mode, tabs, footer, instructions close, favorites)
    this.shadowRoot?.addEventListener("click", (e) => {
      const target = (e.target as Element).closest<HTMLElement>(
        ".mode-btn, .column-tab, .instructions-close, .favorite-icon, .preview-btn, .apply-btn"
      );
      if (!target) return;

      // Mode toggle buttons
      if (target.classList.contains("mode-btn")) {
        this.isDarkMode = target.dataset.mode === "dark";
        this.activeThemeIndex = this.selectedTheme[this.mode];
        this.applyTheme();
        this.updateModeButtons();
        this.renderThemes();
        return;
      }

      // Column tabs
      if (target.classList.contains("column-tab")) {
        e.stopPropagation();
        const columnType = target.dataset.columnType as "themes" | "fonts";
        this.toggleColumn(columnType);
        return;
      }

      // Instructions close buttons
      if (target.classList.contains("instructions-close")) {
        e.stopPropagation();
        target.closest(".instructions")?.classList.add("hidden");
        return;
      }

      // The footer: look at the site, or write the selection to the project
      if (target.classList.contains("preview-btn")) {
        this.setPreviewing(!this.previewing);
        return;
      }
      if (target.classList.contains("apply-btn")) {
        this.applyToProject();
        return;
      }

      // Favorite icons (star and heart)
      if (target.classList.contains("favorite-icon")) {
        e.stopPropagation();
        const type = target.dataset.type as "theme" | "font";
        const index = parseInt(target.dataset.index || "0");
        const isStar = target.classList.contains("star");

        if (type === "theme") {
          if (isStar) {
            const currentStarred = this.starredTheme[this.mode];

            if (currentStarred === index) {
              this.starredTheme[this.mode] = null;
              target.classList.remove("starred");
            } else {
              if (currentStarred !== null) {
                const prevStar = this.shadowRoot?.querySelector(
                  `.star[data-type="theme"][data-index="${currentStarred}"]`
                );
                prevStar?.classList.remove("starred");
              }
              this.starredTheme[this.mode] = index;
              target.classList.add("starred");
            }
          } else {
            const lovedSet = this.lovedThemes[this.mode];

            if (lovedSet.has(index)) {
              lovedSet.delete(index);
              target.classList.remove("loved");
            } else {
              lovedSet.add(index);
              target.classList.add("loved");
            }
          }
        } else if (type === "font") {
          if (isStar) {
            if (this.starredFont === index) {
              this.starredFont = null;
              target.classList.remove("starred");
            } else {
              if (this.starredFont !== null) {
                const prevStar = this.shadowRoot?.querySelector(
                  `.star[data-type="font"][data-index="${this.starredFont}"]`
                );
                prevStar?.classList.remove("starred");
              }

              this.starredFont = index;
              target.classList.add("starred");
            }
          } else {
            if (this.lovedFonts.has(index)) {
              this.lovedFonts.delete(index);
              target.classList.remove("loved");
            } else {
              this.lovedFonts.add(index);
              target.classList.add("loved");
            }
          }
        }

        this.saveToLocalStorage();
        return;
      }
    });
  }

  // Listeners on elements that a re-render replaces
  private attachEventListeners() {
    const toggle = this.shadowRoot?.querySelector(".drawer-toggle");
    const closeBtn = this.shadowRoot?.querySelector(".close-btn");
    const drawer = this.shadowRoot?.querySelector(".drawer");

    toggle?.addEventListener("click", () => this.toggle());
    closeBtn?.addEventListener("click", () => this.toggle());
    this.backdrop?.addEventListener("click", () => this.toggle());

    // Note: Backdrop click handling works because backdrop is a sibling of drawer,
    // not an ancestor, so clicks inside drawer don't bubble through backdrop anyway.

    // Theme items - using event delegation to survive re-renders
    const themesList = this.shadowRoot?.querySelector(".themes-list");
    themesList?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      // The favorite buttons have their own handler
      if (target.closest(".favorite-icon")) return;
      const themeItem = target.closest(".theme-item");
      if (themeItem) {
        const index = parseInt((themeItem as HTMLElement).dataset.index || "0");
        this.activeThemeIndex = index;
        this.focusedColumn = "themes";
        this.selectedTheme[this.mode] = index;
        this.applyTheme();
        this.updateThemeSelection();
      }
    });

    // Font items - using event delegation for consistency
    const fontsList = this.shadowRoot?.querySelector(".fonts-list");
    fontsList?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.closest(".favorite-icon")) return;

      // The selected row's own controls
      const keepButton = target.closest<HTMLElement>(".keep-btn");
      if (keepButton) {
        this.toggleKept(keepButton.dataset.keep as "heading" | "body");
        return;
      }
      if (target.closest(".font-swap")) {
        this.swapFaces();
        return;
      }
      if (target.closest(".font-keep")) return;

      // Anywhere else on a row chooses its pairing; a kept face stays as it is
      const fontItem = target.closest(".font-item");
      if (fontItem) {
        const index = parseInt((fontItem as HTMLElement).dataset.index || "0");
        this.activeFontIndex = index;
        this.focusedColumn = "fonts";
        this.selectedFontPairing = index;

        this.applyFonts();
        this.renderFonts(); // Re-render to show active state
      }
    });

    this.attachFilterListeners();
    this.attachFontFilterListeners();

    const themesContent = this.shadowRoot?.querySelector(
      '[data-column="themes"] .column-content'
    );
    const fontsContent = this.shadowRoot?.querySelector(
      '[data-column="fonts"] .column-content'
    );

    themesContent?.addEventListener("wheel", (e) => {
      // Allow normal scrolling in filter dropdowns
      const target = e.target as HTMLElement;
      if (target.closest(".filter-dropdown")) {
        return;
      }
      e.preventDefault();
      const delta = (e as WheelEvent).deltaY;
      if (Math.abs(delta) > 10) {
        this.focusedColumn = "themes";
        this.handleArrowKey(delta > 0);
      }
    });

    fontsContent?.addEventListener("wheel", (e) => {
      // Allow normal scrolling in filter dropdowns
      const target = e.target as HTMLElement;
      if (target.closest(".font-filter-dropdown")) {
        return;
      }
      e.preventDefault();
      const delta = (e as WheelEvent).deltaY;
      if (Math.abs(delta) > 10) {
        this.focusedColumn = "fonts";
        this.handleArrowKey(delta > 0);
      }
    });

    themesContent?.addEventListener("mouseenter", () => {
      this.focusedColumn = "themes";
    });

    fontsContent?.addEventListener("mouseenter", () => {
      this.focusedColumn = "fonts";
    });

    // The modal closes from its own buttons and from a click on its backdrop
    const activationModal = this.shadowRoot?.querySelector<HTMLDialogElement>(".activation-modal");
    activationModal?.addEventListener("click", (e) => {
      const target = e.target as Element;
      if (target === activationModal || target.closest(".activation-modal-close, .activation-cancel-btn")) {
        activationModal.close();
      }
    });
  }

  private handleArrowKey(isDown: boolean) {
    if (this.focusedColumn === "themes") {
      // Get visible theme indices from DOM
      const visibleThemeIndices: number[] = [];
      this.shadowRoot?.querySelectorAll(".theme-item").forEach((item) => {
        const idx = parseInt((item as HTMLElement).dataset.index || "-1");
        if (idx >= 0) visibleThemeIndices.push(idx);
      });

      if (visibleThemeIndices.length === 0) return;

      const current = this.selectedTheme[this.mode];
      const currentPos = visibleThemeIndices.indexOf(current);
      let newPos: number;

      if (currentPos === -1) {
        newPos = isDown ? 0 : visibleThemeIndices.length - 1;
      } else {
        newPos = isDown
          ? Math.min(currentPos + 1, visibleThemeIndices.length - 1)
          : Math.max(currentPos - 1, 0);
      }

      this.selectedTheme[this.mode] = visibleThemeIndices[newPos];
      this.activeThemeIndex = this.selectedTheme[this.mode];
      this.applyTheme();
      this.updateThemeSelection();
      this.scrollToSelected(".theme-item");
    } else {
      // Get visible font indices from DOM
      const visibleFontIndices: number[] = [];
      this.shadowRoot?.querySelectorAll(".font-item").forEach((item) => {
        const idx = parseInt((item as HTMLElement).dataset.index || "-1");
        if (idx >= 0) visibleFontIndices.push(idx);
      });

      if (visibleFontIndices.length === 0) return;

      const currentPos = visibleFontIndices.indexOf(this.selectedFontPairing);
      let newPos: number;

      if (currentPos === -1) {
        newPos = isDown ? 0 : visibleFontIndices.length - 1;
      } else {
        newPos = isDown
          ? Math.min(currentPos + 1, visibleFontIndices.length - 1)
          : Math.max(currentPos - 1, 0);
      }

      this.selectedFontPairing = visibleFontIndices[newPos];
      this.activeFontIndex = this.selectedFontPairing;
      this.applyFonts();
      this.renderFonts();
      this.scrollToSelected(".font-item");
    }
  }

  private handleFavoriteShortcut(key: "s" | "h") {
    if (this.focusedColumn === "themes" && this.activeThemeIndex !== null) {
      const index = this.activeThemeIndex;
      if (key === "s") {
        const currentStarred = this.starredTheme[this.mode];
        this.starredTheme[this.mode] = currentStarred === index ? null : index;
        this.saveToLocalStorage();
        this.renderThemes();
      } else if (key === "h") {
        const lovedSet = this.lovedThemes[this.mode];
        if (lovedSet.has(index)) {
          lovedSet.delete(index);
        } else {
          lovedSet.add(index);
        }
        this.saveToLocalStorage();
        this.renderThemes();
      }
    } else if (
      this.focusedColumn === "fonts" &&
      this.activeFontIndex !== null
    ) {
      const index = this.activeFontIndex;
      if (key === "s") {
        // Toggle star (only one allowed)
        if (this.starredFont === index) {
          this.starredFont = null;
        } else {
          this.starredFont = index;
        }
        this.saveToLocalStorage();
        this.renderFonts();
      } else if (key === "h") {
        // Toggle heart (multiple allowed)
        if (this.lovedFonts.has(index)) {
          this.lovedFonts.delete(index);
        } else {
          this.lovedFonts.add(index);
        }
        this.saveToLocalStorage();
        this.renderFonts();
      }
    }
  }

  private scrollToSelected(selector: string) {
    const column =
      this.focusedColumn === "themes" ? this.themesColumn : this.fontsColumn;
    const list = column.querySelector(".themes-list, .fonts-list") as HTMLElement;
    const selectedIndex =
      this.focusedColumn === "themes"
        ? this.selectedTheme[this.mode]
        : this.selectedFontPairing;

    const selectedItem = column.querySelector(
      `${selector}[data-index="${selectedIndex}"]`
    ) as HTMLElement | null;
    if (selectedItem && list) scrollWithin(list, selectedItem, "nearest", true);
  }

  private updateThemeSelection() {
    this.shadowRoot?.querySelectorAll(".theme-item").forEach((item) => {
      const itemIndex = parseInt((item as HTMLElement).dataset.index || "0");

      item.classList.toggle(
        "selected-light",
        itemIndex === this.selectedTheme.light
      );
      item.classList.toggle(
        "selected-dark",
        itemIndex === this.selectedTheme.dark
      );
      item.classList.remove("selected", "active");
    });
  }

  private updateFontSelection() {
    this.shadowRoot?.querySelectorAll(".font-item").forEach((item) => {
      const itemIndex = parseInt((item as HTMLElement).dataset.index || "-1");
      item.classList.toggle("selected", itemIndex === this.selectedFontPairing);
    });
  }

  private keepControlsMarkup(): string {
    return keepControls(this.currentFonts(), {
      heading: this.keptHeading !== null,
      body: this.keptBody !== null,
    });
  }

  // In place, so the button that was pressed keeps the focus
  private updateKeepControls() {
    const fonts = this.currentFonts();
    const kept = { heading: this.keptHeading !== null, body: this.keptBody !== null };

    for (const role of ["heading", "body"] as const) {
      const button = this.shadowRoot?.querySelector(`.keep-btn[data-keep="${role}"]`);
      if (!button) continue;

      button.setAttribute("aria-pressed", String(kept[role]));
      button.setAttribute("title", keepTitle(role, fonts[role], kept[role]));
      button.querySelector(".keep-face")!.textContent = fonts[role];
    }
  }

  // Keeps the face in use for a role, or lets it follow the pairing again
  private toggleKept(role: "heading" | "body") {
    const face = this.currentFonts()[role];

    if (role === "heading") this.keptHeading = this.keptHeading === null ? face : null;
    else this.keptBody = this.keptBody === null ? face : null;

    this.applyFonts();
    this.updateKeepControls();
  }

  // Heading and body change places. Swapped back to the pairing as it comes, nothing is kept
  private swapFaces() {
    const { heading, body } = this.currentFonts();
    const pairing = this.fontPairings[this.selectedFontPairing];

    this.keptHeading = body === pairing?.heading ? null : body;
    this.keptBody = heading === pairing?.body ? null : heading;

    this.applyFonts();
    this.updateKeepControls();
  }

  private updateModeButtons() {
    this.shadowRoot?.querySelectorAll(".mode-btn").forEach((btn) => {
      const active = ((btn as HTMLElement).dataset.mode === "dark") === this.isDarkMode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    this.drawerElement?.setAttribute("data-mode", this.mode);
    this.setAttribute("mode", this.mode);
  }

  private applyDrawerState() {
    if (this.isOpen) {
      this.drawerElement.classList.add("open");
      this.drawerToggle.classList.add("hidden");
      this.backdrop.classList.add("visible");
    } else {
      this.drawerElement.classList.remove("open");
      this.drawerToggle.classList.remove("hidden");
      this.backdrop.classList.remove("visible");
    }

    this.watchFontRows();
  }

  private applyFilterDropdownState() {
    const filterDropdown = this.shadowRoot?.querySelector(
      ".filter-dropdown"
    ) as HTMLElement | null;
    if (this.filterDropdownOpen) {
      filterDropdown?.classList.remove("hidden");
      // Restore scroll position
      if (filterDropdown) {
        filterDropdown.scrollTop = this.filterDropdownScrollTop;
      }
    } else {
      filterDropdown?.classList.add("hidden");
    }
  }

  private toggleColumn(columnType: "themes" | "fonts") {
    const isExpanding =
      columnType === "themes"
        ? this.themesColumnCollapsed
        : this.fontsColumnCollapsed;
    const otherCollapsed =
      columnType === "themes"
        ? this.fontsColumnCollapsed
        : this.themesColumnCollapsed;

    // One column at least
    if (!isExpanding && otherCollapsed) return;

    if (columnType === "themes") {
      this.themesColumnCollapsed = !this.themesColumnCollapsed;
      // On mobile, collapse fonts when expanding themes (accordion behavior)
      if (this.isMobile() && isExpanding && !this.fontsColumnCollapsed) {
        this.fontsColumnCollapsed = true;
        this.updateColumnUI("fonts");
      }
    } else {
      this.fontsColumnCollapsed = !this.fontsColumnCollapsed;
      // On mobile, collapse themes when expanding fonts (accordion behavior)
      if (this.isMobile() && isExpanding && !this.themesColumnCollapsed) {
        this.themesColumnCollapsed = true;
        this.updateColumnUI("themes");
      }
    }

    this.updateColumnUI(columnType);
    this.saveToLocalStorage();
  }

  private updateColumnUI(columnType: "themes" | "fonts") {
    const isCollapsed =
      columnType === "themes"
        ? this.themesColumnCollapsed
        : this.fontsColumnCollapsed;

    this.shadowRoot
      ?.querySelector(`[data-column="${columnType}"]`)
      ?.classList.toggle("collapsed", isCollapsed);
    const tab = this.shadowRoot?.querySelector(`.column-tab[data-column-type="${columnType}"]`);
    const name = columnType === "themes" ? "Color Themes" : "Font Pairings";
    tab?.setAttribute("aria-pressed", String(!isCollapsed));
    tab?.setAttribute("title", `${isCollapsed ? "Show" : "Hide"} ${name}`);
  }

  // The selection as applied to the page: the theme in the mode in view, and the faces
  private async applyToProject() {
    if (!this.shadowRoot) return;

    const theme = this.colorThemes[this.selectedTheme[this.mode]];
    if (!theme) return;
    const colors = this.isDarkMode ? theme.dark : theme.light;
    const fonts = this.currentFonts();

    // The server rewrites one file; the writes go one after the other
    const themeResult = await tryApplyViaServer("theme", colors, null, this.isDarkMode);
    if (!themeResult) {
      showActivationModal(this.shadowRoot, activationSections(colors, fonts));
      return;
    }
    const fontResult = await tryApplyViaServer("font", null, fonts, this.isDarkMode);

    const result = fontResult?.success ? fontResult : themeResult;
    if (themeResult.success && fontResult?.success) {
      const created = themeResult.created || fontResult.created;
      showToast(this.shadowRoot, `${created ? "Created" : "Applied to"} ${result.file}`, true);
      if (created && result.importInstruction) {
        console.log(`[ThemeForseen] ${result.importInstruction}`);
      }
    } else {
      showToast(this.shadowRoot, result.message || "The project could not be written to.", false);
    }
  }

  // The compare key: the page as it is without the selection, and back
  private setPreviewing(previewing: boolean) {
    if (this.previewing === previewing) return;

    if (previewing) {
      this.applyFonts();
      return;
    }

    this.previewing = false;
    this.updatePreviewButton();
    this.withoutWatchingThePage(() => clearApplied());
    this.announce();
  }

  // Anything that applies a selection puts the preview back on; says whether it had been off
  private resumePreview(): boolean {
    if (this.previewing) return false;

    this.previewing = true;
    this.updatePreviewButton();
    return true;
  }

  private updatePreviewButton() {
    const button = this.shadowRoot?.querySelector(".preview-btn");
    if (!button) return;

    button.setAttribute("aria-pressed", String(this.previewing));
    button.setAttribute(
      "title",
      this.previewing
        ? "Your selection is on the page. Press to see the page without it"
        : "The page as it is without your selection. Press to put it back"
    );
    button.querySelector(".preview-label")!.textContent = this.previewing
      ? "Preview on This Site"
      : "Site's Own Look";
  }

  // The element writes to the page's style itself; those writes are not the page changing its mode
  private withoutWatchingThePage(write: () => void) {
    this.darkModeObserver?.disconnect();

    try {
      write();
    } finally {
      this.darkModeObserver?.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }
  }

  private applyTheme(force = false) {
    if (!force && !this.isOpen && this.drawerElement) {
      return;
    }

    const resumed = this.resumePreview();
    this.darkModeObserver?.disconnect();

    try {
      const theme = this.colorThemes[this.selectedTheme[this.mode]];
      const colors = theme[this.mode];

      applyThemeColors(colors, this.isDarkMode);
      if (resumed) {
        const { heading, body } = this.currentFonts();
        applyFontStyles(heading, body);
      }
      this.saveToLocalStorage();
    } finally {
      this.darkModeObserver?.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }

    this.announce();
  }

  // A kept face wins; the other comes from the selected pairing
  private currentFonts(): ThemeForseenState["fonts"] {
    const pairing =
      this.fontPairings[this.selectedFontPairing] ??
      this.fontPairings[this.defaultFontPairing];

    return {
      heading: this.keptHeading ?? pairing.heading,
      body: this.keptBody ?? pairing.body,
    };
  }

  private applyFonts() {
    const { heading, body } = this.currentFonts();

    const resumed = this.resumePreview();
    this.withoutWatchingThePage(() => applyFontStyles(heading, body));

    // The colours came off with the faces; applyTheme puts them back, saves and announces
    if (resumed) {
      this.applyTheme(true);
      return;
    }

    this.saveToLocalStorage();
    this.announce();
  }
}

if (typeof window !== "undefined" && !customElements.get("theme-forseen")) {
  customElements.define("theme-forseen", ThemeForseen);
}

declare global {
  interface HTMLElementTagNameMap {
    "theme-forseen": ThemeForseen;
  }
  // The event bubbles, so it can be heard on the element, the document or the window
  interface GlobalEventHandlersEventMap {
    "themeforseen:change": CustomEvent<ThemeForseenState>;
  }
}
