import {
  colorThemes,
  fontPairings,
  type ColorTheme,
  type FontPairing,
} from "./themes.js";
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
import { applyThemeColors, applyFontStyles } from "./themeApplicator.js";
import { loadGoogleFont } from "./fontLoader.js";
import { showActivationModal, handleSaveToFile } from "./activationModal.js";

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
  fontFamily: string | null,
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
    } else if (type === "font" && fontFamily) {
      body.data = { font: fontFamily };
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

function showToast(shadowRoot: ShadowRoot, message: string, isSuccess: boolean): void {
  // Remove existing toast if any
  const existingToast = shadowRoot.querySelector(".theme-forseen-toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = "theme-forseen-toast";
  toast.innerHTML = `
    <span class="toast-icon">${isSuccess ? "✓" : "✕"}</span>
    <span class="toast-message">${message}</span>
  `;

  // Style the toast
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%) translateY(100px)",
    padding: "12px 24px",
    borderRadius: "8px",
    backgroundColor: isSuccess ? "#10B981" : "#EF4444",
    color: "white",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: "10001",
    transition: "transform 0.3s ease",
    fontFamily: "system-ui, -apple-system, sans-serif",
  });

  shadowRoot.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = "translateX(-50%) translateY(0)";
  });

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toast.style.transform = "translateX(-50%) translateY(100px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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

export class ThemeForseen extends HTMLElement {
  private isOpen = false;
  private isDarkMode = false;
  private focusedColumn: "themes" | "fonts" = "themes";

  private get mode(): "light" | "dark" {
    return this.isDarkMode ? "dark" : "light";
  }

  private selectedTheme = { light: 0, dark: 0 };
  private starredTheme: { light: number | null; dark: number | null } = {
    light: null,
    dark: null,
  };
  private lovedThemes = { light: new Set<number>(), dark: new Set<number>() };

  private selectedFontPairing = 0;
  private starredFont: number | null = null;
  private lovedFonts = new Set<number>();

  private selectedHeadingFont: string | null = null;
  private selectedBodyFont: string | null = null;

  private selectedTags = new Set<string>();
  private searchText = "";
  private selectedHeadingStyles = new Set<string>();
  private selectedBodyStyles = new Set<string>();
  private showHeartedOnly = false;
  private showStarredOnly = false;

  private themesColumnCollapsed = false;
  private fontsColumnCollapsed = false;
  private filterDropdownOpen = false;
  private filterDropdownScrollTop = 0;
  private clickOutsideHandlerAdded = false;

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
    this.render();
    this.attachEventListeners();
    this.applyTheme(true); // Force on initial load
    this.applyFonts();

    // Render theme and font lists (this also restores favorites)
    this.renderThemes();
    this.renderFonts();

    // Hide instructions if user has visited enough times
    this.maybeHideInstructions();

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
          this.isDarkMode = e.matches;
          this.applyTheme();
          this.updateModeButtons();
        }
      });

    // Watch for color-scheme changes from external sources via MutationObserver
    this.darkModeObserver = new MutationObserver(() => {
      const currentColorScheme =
        document.documentElement.style.colorScheme ||
        getComputedStyle(document.documentElement).colorScheme;
      const shouldBeDark = currentColorScheme === "dark";

      if (this.isDarkMode !== shouldBeDark) {
        this.isDarkMode = shouldBeDark;
        this.applyTheme();
        this.updateModeButtons();
        this.renderThemes();
      }
    });

    this.darkModeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // Listen for custom event from external dark mode toggles
    window.addEventListener("darkmode-change", ((e: CustomEvent) => {
      const shouldBeDark = e.detail?.dark ?? false;
      if (this.isDarkMode !== shouldBeDark) {
        this.isDarkMode = shouldBeDark;
        this.applyTheme();
        this.updateModeButtons();
        this.renderThemes();
      }
    }) as EventListener);
  }

  private loadFromLocalStorage() {
    const lightTheme = getItem(STORAGE_KEYS.LIGHT_THEME);
    const darkTheme = getItem(STORAGE_KEYS.DARK_THEME);
    const font = getItem(STORAGE_KEYS.FONT);
    if (lightTheme) this.selectedTheme.light = parseInt(lightTheme);
    if (darkTheme) this.selectedTheme.dark = parseInt(darkTheme);
    if (font) this.selectedFontPairing = parseInt(font);

    const starredLight = getItem(STORAGE_KEYS.STARRED_LIGHT);
    const starredDark = getItem(STORAGE_KEYS.STARRED_DARK);
    if (starredLight) this.starredTheme.light = parseInt(starredLight);
    if (starredDark) this.starredTheme.dark = parseInt(starredDark);

    this.lovedThemes.light = getSet(STORAGE_KEYS.LOVED_LIGHT);
    this.lovedThemes.dark = getSet(STORAGE_KEYS.LOVED_DARK);

    const starredFont = getItem(STORAGE_KEYS.STARRED_FONT);
    if (starredFont) this.starredFont = parseInt(starredFont);

    this.lovedFonts = getSet(STORAGE_KEYS.LOVED_FONTS);

    this.selectedHeadingFont = getItem(STORAGE_KEYS.HEADING_FONT);
    this.selectedBodyFont = getItem(STORAGE_KEYS.BODY_FONT);

    this.selectedTags = getSet(STORAGE_KEYS.FILTER_TAGS);
    this.searchText = getItem(STORAGE_KEYS.FILTER_SEARCH) || "";
    this.selectedHeadingStyles = getSet(STORAGE_KEYS.FILTER_HEADING_STYLES);
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

    if (this.selectedHeadingFont) {
      setItem(STORAGE_KEYS.HEADING_FONT, this.selectedHeadingFont);
    } else {
      removeItem(STORAGE_KEYS.HEADING_FONT);
    }
    if (this.selectedBodyFont) {
      setItem(STORAGE_KEYS.BODY_FONT, this.selectedBodyFont);
    } else {
      removeItem(STORAGE_KEYS.BODY_FONT);
    }

    setSet(STORAGE_KEYS.FILTER_TAGS, this.selectedTags);
    setItem(STORAGE_KEYS.FILTER_SEARCH, this.searchText);
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
      selectedTags: this.selectedTags,
      selectedHeadingStyles: this.selectedHeadingStyles,
      selectedBodyStyles: this.selectedBodyStyles,
      showHeartedOnly: this.showHeartedOnly,
      showStarredOnly: this.showStarredOnly,
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
    // Filter by favorites if enabled (OR logic - show if hearted OR starred)
    if (this.showHeartedOnly || this.showStarredOnly) {
      const isHearted = this.lovedThemes[this.mode].has(index);
      const isStarred = this.starredTheme[this.mode] === index;

      let matchesFavorites = false;
      if (this.showHeartedOnly && isHearted) matchesFavorites = true;
      if (this.showStarredOnly && isStarred) matchesFavorites = true;

      if (!matchesFavorites) return false;
    }

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

    const filteredThemes = colorThemes.filter((theme, index) =>
      this.filterTheme(theme, index)
    );

    themesList.innerHTML = filteredThemes
      .map((theme, _) => {
        const index = colorThemes.indexOf(theme);
        const colors = this.isDarkMode ? theme.dark : theme.light;
        // Selection classes added by updateThemeSelection()
        return `
        <div class="theme-item" data-index="${index}">
          <div class="theme-name">${theme.name}</div>
          <div class="theme-colors">
            <div class="color-swatch" style="background-color: ${colors.primary}" title="Primary"></div>
            <div class="color-swatch" style="background-color: ${colors.accent}" title="Accent"></div>
            <div class="color-swatch" style="background-color: ${colors.background}" title="Background"></div>
            <div class="color-swatch" style="background-color: ${colors.cardBackground}" title="Card Background"></div>
            <div class="color-swatch" style="background-color: ${colors.text}" title="Text"></div>
          </div>
          <div class="favorites">
            <button class="activate-icon" data-type="theme" data-index="${index}" title="Activate this theme">⚡</button>
            <span class="favorite-icon star" data-type="theme" data-index="${index}" title="Like">★</span>
            <span class="favorite-icon heart" data-type="theme" data-index="${index}" title="Love">♥</span>
          </div>
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

    const filteredPairings = fontPairings.filter((pairing) =>
      this.filterFontPairing(pairing)
    );

    fontsList.innerHTML = filteredPairings
      .map((pairing, _) => {
        const index = fontPairings.indexOf(pairing);
        const isActive = this.activeFontIndex === index;
        return `
        <div class="font-item ${
          isActive ? "active" : ""
        }" data-index="${index}">
          <div class="font-name">${pairing.name}</div>
          <div class="font-preview">
            <span class="individual-font heading-font" data-font="${
              pairing.heading
            }" data-type="heading" style="font-family: '${pairing.heading}', sans-serif">
              Heading: ${pairing.heading}
            </span><br>
            <span class="individual-font body-font" data-font="${
              pairing.body
            }" data-type="body" style="font-family: '${pairing.body}', sans-serif">
              Body: ${pairing.body}
            </span>
          </div>
          <button class="font-switch-icon" data-index="${index}" title="Swap heading and body fonts">⇄</button>
          <div class="favorites">
            <button class="activate-icon" data-type="font" data-index="${index}" title="Activate this font pairing">⚡</button>
            <span class="favorite-icon star" data-type="font" data-index="${index}" title="Like">★</span>
            <span class="favorite-icon heart" data-type="font" data-index="${index}" title="Love">♥</span>
          </div>
        </div>
      `;
      })
      .join("");

    // Load fonts for all visible pairings
    filteredPairings.forEach((pairing) => {
      loadGoogleFont(pairing.heading);
      loadGoogleFont(pairing.body);
    });

    this.updateFontSelection();
    this.restoreFontFavorites();
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

    // Show dropdown when clicking on input
    filterInput?.addEventListener("click", () => {
      this.filterDropdownOpen = true;
      filterDropdown?.classList.remove("hidden");
    });

    filterDropdownBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.filterDropdownOpen = !this.filterDropdownOpen;
      filterDropdown?.classList.toggle("hidden");
    });

    // Close dropdown when clicking outside (only add once since shadowRoot persists)
    if (!this.clickOutsideHandlerAdded) {
      this.clickOutsideHandlerAdded = true;
      this.shadowRoot?.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        // Don't interfere with favorite/activate icon clicks
        if (
          target.classList.contains("favorite-icon") ||
          target.classList.contains("activate-icon")
        ) {
          return;
        }
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

          // Handle favorites filters
          const favoritesType = option?.getAttribute("data-favorites");
          if (favoritesType) {
            const isChecked = (e.target as HTMLInputElement).checked;
            if (favoritesType === "hearted") {
              this.showHeartedOnly = isChecked;
            } else if (favoritesType === "starred") {
              this.showStarredOnly = isChecked;
            }
            // Save scroll position before re-render
            const filterDropdown = this.shadowRoot?.querySelector(".filter-dropdown") as HTMLElement | null;
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
            return;
          }

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

  private updateFontFilterButtonText(filterType: "heading" | "body") {
    const targetSet =
      filterType === "heading"
        ? this.selectedHeadingStyles
        : this.selectedBodyStyles;
    const btn = this.shadowRoot?.querySelector(
      `.font-filter-dropdown-btn[data-filter-type="${filterType}"]`
    );
    if (btn) {
      const text =
        targetSet.size > 0 ? Array.from(targetSet).join(", ") : "All styles";
      btn.textContent = `${text} ▼`;
    }
  }

  private attachFontFilterListeners() {
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
            this.updateFontFilterButtonText(filterType);
            this.renderFonts();
          }
        });
      });
  }

  private attachEventListeners() {
    const toggle = this.shadowRoot?.querySelector(".drawer-toggle");
    const closeBtn = this.shadowRoot?.querySelector(".close-btn");
    const drawer = this.shadowRoot?.querySelector(".drawer");

    toggle?.addEventListener("click", () => this.toggleDrawer());
    closeBtn?.addEventListener("click", () => this.toggleDrawer());
    this.backdrop?.addEventListener("click", () => this.toggleDrawer());

    // Note: Backdrop click handling works because backdrop is a sibling of drawer,
    // not an ancestor, so clicks inside drawer don't bubble through backdrop anyway.

    // Theme items - using event delegation to survive re-renders
    const themesList = this.shadowRoot?.querySelector(".themes-list");
    themesList?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      // Ignore clicks on favorite/activate icons - they have their own handlers
      if (
        target.classList.contains("favorite-icon") ||
        target.classList.contains("activate-icon")
      ) {
        return;
      }
      const themeItem = target.closest(".theme-item");
      if (themeItem) {
        const index = parseInt((themeItem as HTMLElement).dataset.index || "0");
        this.activeThemeIndex = index;
        this.focusedColumn = "themes";
        this.selectedTheme[this.mode] = index;
        this.applyTheme();
        this.renderThemes();
      }
    });

    // Font items - using event delegation for consistency
    const fontsList = this.shadowRoot?.querySelector(".fonts-list");
    fontsList?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (
        target.classList.contains("favorite-icon") ||
        target.classList.contains("activate-icon")
      ) {
        return;
      }

      if (target.classList.contains("font-switch-icon")) {
        e.stopPropagation();

        // Get current fonts - either from individual selection or from pairing
        let currentHeading: string;
        let currentBody: string;

        if (this.selectedHeadingFont || this.selectedBodyFont) {
          // Use individual selections (with defaults from first pairing if one is missing)
          currentHeading = this.selectedHeadingFont || fontPairings[0].heading;
          currentBody = this.selectedBodyFont || fontPairings[0].body;
        } else {
          // Get from current pairing
          const pairingIndex = this.selectedFontPairing >= 0 ? this.selectedFontPairing : 0;
          currentHeading = fontPairings[pairingIndex].heading;
          currentBody = fontPairings[pairingIndex].body;
        }

        // Swap the fonts
        this.selectedHeadingFont = currentBody;
        this.selectedBodyFont = currentHeading;
        this.selectedFontPairing = -1; // Clear pairing selection

        this.applyFonts();
        this.updateFontSelection();
        return;
      }

      if (target.classList.contains("individual-font")) {
        e.stopPropagation();
        const fontName = target.dataset.font || "";
        const fontType = target.dataset.type as "heading" | "body";

        if (fontType === "heading") {
          this.selectedHeadingFont = fontName;
        } else {
          this.selectedBodyFont = fontName;
        }

        // Clear pairing selection when individual fonts are selected
        this.selectedFontPairing = -1;

        this.applyFonts();
        this.updateFontSelection();
        return;
      }

      // Otherwise, selecting a font pairing
      const fontItem = target.closest(".font-item");
      if (fontItem) {
        const index = parseInt((fontItem as HTMLElement).dataset.index || "0");
        this.activeFontIndex = index;
        this.focusedColumn = "fonts";
        this.selectedFontPairing = index;

        // Clear individual font selections when selecting a pairing
        this.selectedHeadingFont = null;
        this.selectedBodyFont = null;

        this.applyFonts();
        this.renderFonts(); // Re-render to show active state
      }
    });

    this.attachFilterListeners();
    this.attachFontFilterListeners();

    document.addEventListener("keydown", (e) => {
      if (!this.isOpen) return;

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

    // Delegated click handler for buttons (mode, collapse, instructions close, favorites, activate)
    this.shadowRoot?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      // Mode toggle buttons
      if (target.classList.contains("mode-btn")) {
        this.isDarkMode = target.dataset.mode === "dark";
        this.activeThemeIndex = this.selectedTheme[this.mode];
        this.applyTheme();
        this.updateModeButtons();
        this.renderThemes();
        return;
      }

      // Collapse buttons
      if (target.classList.contains("collapse-btn")) {
        e.stopPropagation();
        const columnType = target.dataset.columnType as "themes" | "fonts";
        this.toggleColumn(columnType);
        return;
      }

      // Instructions close buttons
      if (target.classList.contains("instructions-close")) {
        e.stopPropagation();
        const instructionsDiv = target.closest(".instructions");
        if (instructionsDiv) {
          instructionsDiv.classList.add("hidden");
        }
        return;
      }

      // Activate icons
      if (target.classList.contains("activate-icon")) {
        e.stopPropagation();
        const type = target.dataset.type as "theme" | "font";
        const index = parseInt(target.dataset.index || "0");
        this.handleActivate(type, index);
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

    // Activation modal event listeners
    const activationModal = this.shadowRoot?.querySelector(".activation-modal");
    const activationModalClose = this.shadowRoot?.querySelector(
      ".activation-modal-close"
    );
    const activationCancelBtn = this.shadowRoot?.querySelector(
      ".activation-cancel-btn"
    );
    const activationCopyBtn = this.shadowRoot?.querySelector(
      ".activation-copy-btn"
    );
    const activationSaveBtn = this.shadowRoot?.querySelector(
      ".activation-save-btn"
    );

    activationModalClose?.addEventListener("click", () => {
      activationModal?.classList.add("hidden");
    });

    activationCancelBtn?.addEventListener("click", () => {
      activationModal?.classList.add("hidden");
    });

    activationCopyBtn?.addEventListener("click", () => {
      const codeElement = this.shadowRoot?.querySelector(".activation-code");
      if (codeElement?.textContent) {
        navigator.clipboard.writeText(codeElement.textContent);
        activationCopyBtn.textContent = "Copied!";
        activationCopyBtn.classList.add("copied");
        setTimeout(() => {
          activationCopyBtn.textContent = "Copy";
          activationCopyBtn.classList.remove("copied");
        }, 2000);
      }
    });

    activationSaveBtn?.addEventListener("click", () => {
      this.handleSaveToFile();
    });
  }

  private handleArrowKey(isDown: boolean) {
    if (this.focusedColumn === "themes") {
      const current = this.selectedTheme[this.mode];
      this.selectedTheme[this.mode] = isDown
        ? Math.min(current + 1, colorThemes.length - 1)
        : Math.max(current - 1, 0);
      this.activeThemeIndex = this.selectedTheme[this.mode];
      this.applyTheme();
      this.renderThemes();
      this.scrollToSelected(".theme-item");
    } else {
      this.selectedFontPairing = isDown
        ? Math.min(this.selectedFontPairing + 1, fontPairings.length - 1)
        : Math.max(this.selectedFontPairing - 1, 0);
      this.activeFontIndex = this.selectedFontPairing;
      this.applyFonts();
      this.renderFonts(); // Re-render to show active state
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
    const content = column.querySelector(".column-content") as HTMLElement;
    const items = column.querySelectorAll(selector);
    const selectedIndex =
      this.focusedColumn === "themes"
        ? this.selectedTheme[this.mode]
        : this.selectedFontPairing;

    const selectedItem = items[selectedIndex] as HTMLElement;
    if (selectedItem && content) {
      // For first item, scroll to absolute top to avoid sticky header issues
      if (selectedIndex === 0) {
        content.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        selectedItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
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
    const hasIndividualSelection =
      this.selectedHeadingFont !== null || this.selectedBodyFont !== null;

    this.shadowRoot?.querySelectorAll(".font-item").forEach((item) => {
      const itemIndex = parseInt((item as HTMLElement).dataset.index || "-1");
      if (!hasIndividualSelection && itemIndex === this.selectedFontPairing) {
        item.classList.add("selected");
      } else {
        item.classList.remove("selected");
      }
    });

    this.shadowRoot?.querySelectorAll(".individual-font").forEach((element) => {
      const fontName = (element as HTMLElement).dataset.font;
      const fontType = (element as HTMLElement).dataset.type;

      if (fontType === "heading" && fontName === this.selectedHeadingFont) {
        element.classList.add("selected");
      } else if (fontType === "body" && fontName === this.selectedBodyFont) {
        element.classList.add("selected");
      } else {
        element.classList.remove("selected");
      }
    });
  }

  private updateModeButtons() {
    this.shadowRoot?.querySelectorAll(".mode-btn").forEach((btn) => {
      const mode = (btn as HTMLElement).dataset.mode;
      if (
        (mode === "dark" && this.isDarkMode) ||
        (mode === "light" && !this.isDarkMode)
      ) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  private toggleDrawer() {
    this.isOpen = !this.isOpen;
    this.applyDrawerState();
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

    // Update classes on existing elements for smooth animation
    const column = this.shadowRoot?.querySelector(
      `[data-column="${columnType}"]`
    );
    const collapseBtn = column?.querySelector(
      ".collapse-btn"
    ) as HTMLButtonElement;
    const headerContent = this.shadowRoot?.querySelector(
      ".drawer-header-content"
    );

    if (column) {
      if (columnType === "themes") {
        column.classList.toggle("collapsed", this.themesColumnCollapsed);
        if (collapseBtn) {
          collapseBtn.innerHTML = this.themesColumnCollapsed ? "«" : "»";
          collapseBtn.title = this.themesColumnCollapsed
            ? "Expand"
            : "Collapse";
        }
      } else {
        column.classList.toggle("collapsed", this.fontsColumnCollapsed);
        if (collapseBtn) {
          collapseBtn.innerHTML = this.fontsColumnCollapsed ? "«" : "»";
          collapseBtn.title = this.fontsColumnCollapsed ? "Expand" : "Collapse";
        }
      }
    }

    if (headerContent) {
      headerContent.classList.toggle(
        "logo-hidden",
        this.themesColumnCollapsed || this.fontsColumnCollapsed
      );
    }

    this.saveToLocalStorage();
  }

  // Helper to update just one column's UI (used for accordion behavior on mobile)
  private updateColumnUI(columnType: "themes" | "fonts") {
    const column = this.shadowRoot?.querySelector(
      `[data-column="${columnType}"]`
    );
    const collapseBtn = column?.querySelector(
      ".collapse-btn"
    ) as HTMLButtonElement;
    const headerContent = this.shadowRoot?.querySelector(
      ".drawer-header-content"
    );

    if (column) {
      const isCollapsed =
        columnType === "themes"
          ? this.themesColumnCollapsed
          : this.fontsColumnCollapsed;

      column.classList.toggle("collapsed", isCollapsed);
      if (collapseBtn) {
        collapseBtn.innerHTML = isCollapsed ? "«" : "»";
        collapseBtn.title = isCollapsed ? "Expand" : "Collapse";
      }
    }

    if (headerContent) {
      headerContent.classList.toggle(
        "logo-hidden",
        this.themesColumnCollapsed || this.fontsColumnCollapsed
      );
    }
  }

  private async handleActivate(type: "theme" | "font", index: number) {
    if (!this.shadowRoot) return;

    // Try to apply via dev server first
    let colors: ColorTheme["light"] | ColorTheme["dark"] | null = null;
    let fontFamily: string | null = null;

    if (type === "theme") {
      const theme = colorThemes[index];
      colors = this.isDarkMode ? theme.dark : theme.light;
    } else {
      const pairing = fontPairings[index];
      fontFamily = this.selectedHeadingFont || pairing.heading;
    }

    const result = await tryApplyViaServer(type, colors, fontFamily, this.isDarkMode);

    if (result?.success) {
      // Show success toast with filename
      const message = result.created
        ? `Created ${result.file}`
        : `Applied to ${result.file}`;
      showToast(this.shadowRoot, message, true);

      // If file was created, show import instruction in console
      if (result.created && result.importInstruction) {
        console.log(`[ThemeForseen] ${result.importInstruction}`);
      }
      return;
    }

    // Fall back to modal if server not available
    showActivationModal(type, index, {
      shadowRoot: this.shadowRoot,
      isDarkMode: this.isDarkMode,
      selectedHeadingFont: this.selectedHeadingFont,
      selectedBodyFont: this.selectedBodyFont,
    });
  }

  private async handleSaveToFile() {
    if (!this.shadowRoot) return;
    await handleSaveToFile(this.shadowRoot);
  }

  private applyTheme(force = false) {
    if (!force && !this.isOpen && this.drawerElement) {
      return;
    }

    this.darkModeObserver?.disconnect();

    try {
      const theme = colorThemes[this.selectedTheme[this.mode]];
      const colors = theme[this.mode];

      applyThemeColors(colors, this.isDarkMode);
      this.saveToLocalStorage();
    } finally {
      this.darkModeObserver?.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }
  }

  private applyFonts() {
    // Determine which fonts to use: individual selections or pairing
    let headingFont: string;
    let bodyFont: string;

    if (this.selectedHeadingFont || this.selectedBodyFont) {
      // Use individual selections (with defaults if one isn't selected)
      if (this.selectedHeadingFont && this.selectedBodyFont) {
        headingFont = this.selectedHeadingFont;
        bodyFont = this.selectedBodyFont;
      } else if (this.selectedHeadingFont) {
        headingFont = this.selectedHeadingFont;
        bodyFont = fontPairings[0].body;
      } else {
        headingFont = fontPairings[0].heading;
        bodyFont = this.selectedBodyFont!;
      }
    } else {
      const pairingIndex =
        this.selectedFontPairing >= 0 ? this.selectedFontPairing : 0;
      const pairing = fontPairings[pairingIndex];
      headingFont = pairing.heading;
      bodyFont = pairing.body;
    }

    applyFontStyles(headingFont, bodyFont);
    this.saveToLocalStorage();
  }
}

if (typeof window !== "undefined" && !customElements.get("theme-forseen")) {
  customElements.define("theme-forseen", ThemeForseen);
}
