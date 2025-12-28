import {
  colorThemes,
  fontPairings,
  type ColorTheme,
  type FontPairing,
} from "./themes.js";
import { getTemplate } from "./template.js";
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
import { showActivationModal, handleSaveToFile } from "./activationModal.js";

export class ThemeForseen extends HTMLElement {
  // Static flag to prevent any instance from applying while another is applying
  private static isApplyingTheme = false;

  private isOpen = false;
  private selectedLightTheme = 0;
  private selectedDarkTheme = 0;
  private selectedFontPairing = 0;
  private isDarkMode = false;
  private focusedColumn: "themes" | "fonts" = "themes";
  private starredLightTheme: number | null = null;
  private starredDarkTheme: number | null = null;
  private lovedLightThemes = new Set<number>();
  private lovedDarkThemes = new Set<number>();
  private starredFont: number | null = null;
  private lovedFonts = new Set<number>();

  // Individual font selections
  private selectedHeadingFont: string | null = null;
  private selectedBodyFont: string | null = null;

  // Filter state
  private selectedTags = new Set<string>();
  private searchText = "";
  private selectedHeadingStyles = new Set<string>();
  private selectedBodyStyles = new Set<string>();

  // Column collapse state
  private themesColumnCollapsed = false;
  private fontsColumnCollapsed = false;

  // Mobile detection
  private isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  // Active tile state for keyboard shortcuts
  private activeThemeIndex: number | null = null;
  private activeFontIndex: number | null = null;

  private drawerElement!: HTMLElement;
  private drawerToggle!: HTMLElement;
  private backdrop!: HTMLElement;
  private themesColumn!: HTMLElement;
  private fontsColumn!: HTMLElement;

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
    // Use saved preference if available, otherwise use system preference
    const saved = getBool(STORAGE_KEYS.DARK_MODE);
    if (saved !== null) {
      this.isDarkMode = saved;
    } else {
      this.isDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
    }

    // Watch for system changes (but saved preference takes priority)
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (getBool(STORAGE_KEYS.DARK_MODE) === null) {
          this.isDarkMode = e.matches;
          this.applyTheme();
          this.updateModeButtons();
        }
      });

    // Helper function to check and sync dark mode
    const syncDarkMode = () => {
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
    };

    // Watch for color-scheme changes from external sources (like the DarkMode component)
    const observer = new MutationObserver(() => {
      syncDarkMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    // Also watch body element as some components might modify it
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    // Listen for storage events (in case DarkMode component uses localStorage)
    window.addEventListener("storage", () => {
      syncDarkMode();
    });

    // Listen for clicks on the document to catch dark mode toggle clicks
    document.addEventListener("click", () => {
      // Check immediately
      syncDarkMode();
      // Also check with delays to catch async updates
      setTimeout(() => syncDarkMode(), 10);
      setTimeout(() => syncDarkMode(), 50);
      setTimeout(() => syncDarkMode(), 100);
    });

    // More frequent periodic check (every 200ms instead of 500ms)
    setInterval(() => {
      syncDarkMode();
    }, 200);
  }

  private loadFromLocalStorage() {
    // Load selections
    const lightTheme = getItem(STORAGE_KEYS.LIGHT_THEME);
    const darkTheme = getItem(STORAGE_KEYS.DARK_THEME);
    const font = getItem(STORAGE_KEYS.FONT);
    if (lightTheme) this.selectedLightTheme = parseInt(lightTheme);
    if (darkTheme) this.selectedDarkTheme = parseInt(darkTheme);
    if (font) this.selectedFontPairing = parseInt(font);

    // Load starred themes
    const starredLight = getItem(STORAGE_KEYS.STARRED_LIGHT);
    const starredDark = getItem(STORAGE_KEYS.STARRED_DARK);
    if (starredLight) this.starredLightTheme = parseInt(starredLight);
    if (starredDark) this.starredDarkTheme = parseInt(starredDark);

    // Load loved themes
    this.lovedLightThemes = getSet(STORAGE_KEYS.LOVED_LIGHT);
    this.lovedDarkThemes = getSet(STORAGE_KEYS.LOVED_DARK);

    // Load starred font
    const starredFont = getItem(STORAGE_KEYS.STARRED_FONT);
    if (starredFont) this.starredFont = parseInt(starredFont);

    // Load loved fonts
    this.lovedFonts = getSet(STORAGE_KEYS.LOVED_FONTS);

    // Load individual font selections
    this.selectedHeadingFont = getItem(STORAGE_KEYS.HEADING_FONT);
    this.selectedBodyFont = getItem(STORAGE_KEYS.BODY_FONT);

    // Load filter state
    this.selectedTags = getSet(STORAGE_KEYS.FILTER_TAGS);
    this.searchText = getItem(STORAGE_KEYS.FILTER_SEARCH) || "";
    this.selectedHeadingStyles = getSet(STORAGE_KEYS.FILTER_HEADING_STYLES);
    this.selectedBodyStyles = getSet(STORAGE_KEYS.FILTER_BODY_STYLES);

    // Load column collapse state
    const themesCollapsed = getBool(STORAGE_KEYS.THEMES_COLLAPSED);
    const fontsCollapsed = getBool(STORAGE_KEYS.FONTS_COLLAPSED);
    if (themesCollapsed !== null) this.themesColumnCollapsed = themesCollapsed;
    if (fontsCollapsed !== null) this.fontsColumnCollapsed = fontsCollapsed;

    // On mobile, ensure only one column is open (accordion behavior)
    if (this.isMobile() && !this.themesColumnCollapsed && !this.fontsColumnCollapsed) {
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
      // Hide both instruction boxes
      this.shadowRoot?.querySelectorAll(".instructions").forEach((el) => {
        (el as HTMLElement).classList.add("hidden");
      });
    }
  }

  private saveToLocalStorage() {
    // Save mode
    setBool(STORAGE_KEYS.DARK_MODE, this.isDarkMode);

    // Save selections
    setInt(STORAGE_KEYS.LIGHT_THEME, this.selectedLightTheme);
    setInt(STORAGE_KEYS.DARK_THEME, this.selectedDarkTheme);
    setInt(STORAGE_KEYS.FONT, this.selectedFontPairing);

    // Save starred themes (single value per mode)
    if (this.starredLightTheme !== null) {
      setInt(STORAGE_KEYS.STARRED_LIGHT, this.starredLightTheme);
    } else {
      removeItem(STORAGE_KEYS.STARRED_LIGHT);
    }
    if (this.starredDarkTheme !== null) {
      setInt(STORAGE_KEYS.STARRED_DARK, this.starredDarkTheme);
    } else {
      removeItem(STORAGE_KEYS.STARRED_DARK);
    }

    // Save loved themes (multiple per mode)
    setSet(STORAGE_KEYS.LOVED_LIGHT, this.lovedLightThemes);
    setSet(STORAGE_KEYS.LOVED_DARK, this.lovedDarkThemes);

    // Save starred font (single value)
    if (this.starredFont !== null) {
      setInt(STORAGE_KEYS.STARRED_FONT, this.starredFont);
    } else {
      removeItem(STORAGE_KEYS.STARRED_FONT);
    }

    // Save loved fonts (multiple)
    setSet(STORAGE_KEYS.LOVED_FONTS, this.lovedFonts);

    // Save individual font selections
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

    // Save filter state
    setSet(STORAGE_KEYS.FILTER_TAGS, this.selectedTags);
    setItem(STORAGE_KEYS.FILTER_SEARCH, this.searchText);
    setSet(STORAGE_KEYS.FILTER_HEADING_STYLES, this.selectedHeadingStyles);
    setSet(STORAGE_KEYS.FILTER_BODY_STYLES, this.selectedBodyStyles);

    // Save column collapse state
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

  private filterTheme(theme: ColorTheme): boolean {
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

      return colorValues.some(
        (color) =>
          color.toLowerCase().includes(search) ||
          color.toLowerCase().replace("#", "").includes(search.replace("#", ""))
      );
    }

    return true;
  }

  private renderThemes() {
    const themesList = this.shadowRoot?.querySelector(".themes-list");
    if (!themesList) return;

    const filteredThemes = colorThemes.filter((theme) =>
      this.filterTheme(theme)
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
    // Restore starred theme for current mode (single)
    const starredIndex = this.isDarkMode
      ? this.starredDarkTheme
      : this.starredLightTheme;
    if (starredIndex !== null) {
      const star = this.shadowRoot?.querySelector(
        `.star[data-type="theme"][data-index="${starredIndex}"]`
      );
      star?.classList.add("starred");
    }

    // Restore loved themes for current mode (multiple)
    const lovedSet = this.isDarkMode
      ? this.lovedDarkThemes
      : this.lovedLightThemes;
    lovedSet.forEach((index) => {
      const heart = this.shadowRoot?.querySelector(
        `.heart[data-type="theme"][data-index="${index}"]`
      );
      heart?.classList.add("loved");
    });

    // Attach click handlers to icons
    this.attachIconHandlers("theme");
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
            }" data-type="heading">
              Heading: ${pairing.heading}
            </span><br>
            <span class="individual-font body-font" data-font="${
              pairing.body
            }" data-type="body">
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

    this.updateFontSelection();
    this.restoreFontFavorites();
  }

  private restoreFontFavorites() {
    // Restore starred font (single)
    if (this.starredFont !== null) {
      const star = this.shadowRoot?.querySelector(
        `.star[data-type="font"][data-index="${this.starredFont}"]`
      );
      star?.classList.add("starred");
    }

    // Restore loved fonts (multiple)
    this.lovedFonts.forEach((index) => {
      const heart = this.shadowRoot?.querySelector(
        `.heart[data-type="font"][data-index="${index}"]`
      );
      heart?.classList.add("loved");
    });

    // Attach click handlers to icons
    this.attachIconHandlers("font");
  }

  private attachIconHandlers(_type: "theme" | "font") {
    // Icon click handling is done via event delegation on shadowRoot in attachEventListeners()
    // This function is kept for compatibility but the actual handlers are centralized
  }

  private attachFilterListeners() {
    // Filter input
    const filterInput = this.shadowRoot?.querySelector(
      ".filter-input"
    ) as HTMLInputElement;
    filterInput?.addEventListener("input", (e) => {
      this.searchText = (e.target as HTMLInputElement).value;
      this.saveToLocalStorage();
      this.renderThemes();
    });

    // Filter dropdown button
    const filterDropdownBtn = this.shadowRoot?.querySelector(
      ".filter-dropdown-btn"
    );
    const filterDropdown = this.shadowRoot?.querySelector(".filter-dropdown");
    filterDropdownBtn?.addEventListener("click", () => {
      filterDropdown?.classList.toggle("hidden");
    });

    // Filter checkboxes
    this.shadowRoot
      ?.querySelectorAll(
        ".filter-container .filter-option input[type='checkbox']"
      )
      .forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
          const option = (e.target as HTMLInputElement).closest(
            ".filter-option"
          );
          const tag = option?.getAttribute("data-tag");
          if (tag) {
            if ((e.target as HTMLInputElement).checked) {
              this.selectedTags.add(tag);
            } else {
              this.selectedTags.delete(tag);
            }
            this.saveToLocalStorage();
            this.render();
            this.attachEventListeners();
            this.renderThemes();
            this.renderFonts();
          }
        });
      });

    // Filter tag remove buttons
    this.shadowRoot?.querySelectorAll(".filter-tag-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tag = (e.currentTarget as HTMLElement).getAttribute("data-tag");
        if (tag) {
          this.selectedTags.delete(tag);
          this.saveToLocalStorage();
          this.render();
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
    // Font filter dropdown buttons
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

    // Font filter checkboxes
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
        if (this.isDarkMode) {
          this.selectedDarkTheme = index;
        } else {
          this.selectedLightTheme = index;
        }
        this.applyTheme();
        this.renderThemes(); // Re-render to show active state
      }
    });

    // Font items - using event delegation for consistency
    const fontsList = this.shadowRoot?.querySelector(".fonts-list");
    fontsList?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      // Ignore clicks on favorite/activate icons - they have their own handlers
      if (
        target.classList.contains("favorite-icon") ||
        target.classList.contains("activate-icon")
      ) {
        return;
      }

      // Check if clicking the switch button
      if (target.classList.contains("font-switch-icon")) {
        e.stopPropagation();
        const index = parseInt(target.dataset.index || "0");
        const pairing = fontPairings[index];

        // Swap the heading and body fonts
        this.selectedHeadingFont = pairing.body;
        this.selectedBodyFont = pairing.heading;
        this.selectedFontPairing = -1; // Clear pairing selection

        this.applyFonts();
        this.updateFontSelection();
        return;
      }

      // Check if clicking on an individual font
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

    // Mode toggle
    this.shadowRoot?.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const mode = (e.currentTarget as HTMLElement).dataset.mode;
        this.isDarkMode = mode === "dark";
        // Sync activeThemeIndex with the new mode's selected theme
        this.activeThemeIndex = this.isDarkMode
          ? this.selectedDarkTheme
          : this.selectedLightTheme;
        this.applyTheme();
        this.updateModeButtons();
        this.renderThemes();
      });
    });

    // Column collapse buttons
    this.shadowRoot?.querySelectorAll(".collapse-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const columnType = (e.currentTarget as HTMLElement).dataset
          .columnType as "themes" | "fonts";
        this.toggleColumn(columnType);
      });
    });

    this.attachFilterListeners();
    this.attachFontFilterListeners();

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (!this.isOpen) return;

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        this.handleArrowKey(e.key === "ArrowDown");
      }

      // Star/Heart keyboard shortcuts
      if (e.key.toLowerCase() === "s" || e.key.toLowerCase() === "h") {
        e.preventDefault();
        this.handleFavoriteShortcut(e.key.toLowerCase() as "s" | "h");
      }
    });

    // Mouse wheel navigation
    const themesContent = this.shadowRoot?.querySelector(
      '[data-column="themes"] .column-content'
    );
    const fontsContent = this.shadowRoot?.querySelector(
      '[data-column="fonts"] .column-content'
    );

    themesContent?.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = (e as WheelEvent).deltaY;
      if (Math.abs(delta) > 10) {
        this.focusedColumn = "themes";
        this.handleArrowKey(delta > 0);
      }
    });

    fontsContent?.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = (e as WheelEvent).deltaY;
      if (Math.abs(delta) > 10) {
        this.focusedColumn = "fonts";
        this.handleArrowKey(delta > 0);
      }
    });

    // Focus tracking
    themesContent?.addEventListener("mouseenter", () => {
      this.focusedColumn = "themes";
    });

    fontsContent?.addEventListener("mouseenter", () => {
      this.focusedColumn = "fonts";
    });

    // Instructions close buttons
    this.shadowRoot?.querySelectorAll(".instructions-close").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const instructionsDiv = (e.target as HTMLElement).closest(
          ".instructions"
        );
        if (instructionsDiv) {
          instructionsDiv.classList.add("hidden");
        }
      });
    });

    // Favorite icons (star and heart)
    this.shadowRoot?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("favorite-icon")) {
        e.stopPropagation();
        const type = target.dataset.type as "theme" | "font";
        const index = parseInt(target.dataset.index || "0");
        const isStar = target.classList.contains("star");

        if (type === "theme") {
          if (isStar) {
            // Stars: only one per mode (light/dark)
            const currentStarred = this.isDarkMode
              ? this.starredDarkTheme
              : this.starredLightTheme;

            if (currentStarred === index) {
              // Deselect current starred
              if (this.isDarkMode) {
                this.starredDarkTheme = null;
              } else {
                this.starredLightTheme = null;
              }
              target.classList.remove("starred");
            } else {
              // Remove previous starred
              if (currentStarred !== null) {
                const prevStar = this.shadowRoot?.querySelector(
                  `.star[data-type="theme"][data-index="${currentStarred}"]`
                );
                prevStar?.classList.remove("starred");
              }

              // Set new starred
              if (this.isDarkMode) {
                this.starredDarkTheme = index;
              } else {
                this.starredLightTheme = index;
              }
              target.classList.add("starred");
            }
          } else {
            // Hearts: multiple allowed per mode (light/dark)
            const lovedSet = this.isDarkMode
              ? this.lovedDarkThemes
              : this.lovedLightThemes;

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
            // Stars: only one selected
            if (this.starredFont === index) {
              // Deselect current starred
              this.starredFont = null;
              target.classList.remove("starred");
            } else {
              // Remove previous starred
              if (this.starredFont !== null) {
                const prevStar = this.shadowRoot?.querySelector(
                  `.star[data-type="font"][data-index="${this.starredFont}"]`
                );
                prevStar?.classList.remove("starred");
              }

              // Set new starred
              this.starredFont = index;
              target.classList.add("starred");
            }
          } else {
            // Hearts: multiple allowed
            if (this.lovedFonts.has(index)) {
              this.lovedFonts.delete(index);
              target.classList.remove("loved");
            } else {
              this.lovedFonts.add(index);
              target.classList.add("loved");
            }
          }
        }

        // Save all favorites to localStorage
        this.saveToLocalStorage();
      }
    });

    // Activate icons
    this.shadowRoot?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("activate-icon")) {
        e.stopPropagation();
        const type = target.dataset.type as "theme" | "font";
        const index = parseInt(target.dataset.index || "0");
        this.handleActivate(type, index);
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
      if (this.isDarkMode) {
        this.selectedDarkTheme = isDown
          ? Math.min(this.selectedDarkTheme + 1, colorThemes.length - 1)
          : Math.max(this.selectedDarkTheme - 1, 0);
      } else {
        this.selectedLightTheme = isDown
          ? Math.min(this.selectedLightTheme + 1, colorThemes.length - 1)
          : Math.max(this.selectedLightTheme - 1, 0);
      }
      this.activeThemeIndex = this.isDarkMode
        ? this.selectedDarkTheme
        : this.selectedLightTheme;
      this.applyTheme();
      this.renderThemes(); // Re-render to show active state
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
        // Toggle star (only one allowed)
        const currentStarred = this.isDarkMode
          ? this.starredDarkTheme
          : this.starredLightTheme;
        if (currentStarred === index) {
          if (this.isDarkMode) {
            this.starredDarkTheme = null;
          } else {
            this.starredLightTheme = null;
          }
        } else {
          if (this.isDarkMode) {
            this.starredDarkTheme = index;
          } else {
            this.starredLightTheme = index;
          }
        }
        this.saveToLocalStorage();
        this.renderThemes();
      } else if (key === "h") {
        // Toggle heart (multiple allowed)
        const lovedSet = this.isDarkMode
          ? this.lovedDarkThemes
          : this.lovedLightThemes;
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
    const content = column.querySelector(".column-content");
    const items = column.querySelectorAll(selector);
    const selectedIndex =
      this.focusedColumn === "themes"
        ? this.isDarkMode
          ? this.selectedDarkTheme
          : this.selectedLightTheme
        : this.selectedFontPairing;

    const selectedItem = items[selectedIndex] as HTMLElement;
    if (selectedItem && content) {
      selectedItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  private updateThemeSelection() {
    this.shadowRoot?.querySelectorAll(".theme-item").forEach((item) => {
      const itemIndex = parseInt((item as HTMLElement).dataset.index || "0");

      // Light mode selection - blue
      if (itemIndex === this.selectedLightTheme) {
        item.classList.add("selected-light");
      } else {
        item.classList.remove("selected-light");
      }

      // Dark mode selection - green
      if (itemIndex === this.selectedDarkTheme) {
        item.classList.add("selected-dark");
      } else {
        item.classList.remove("selected-dark");
      }

      // Remove old classes
      item.classList.remove("selected", "active");
    });
  }

  private updateFontSelection() {
    // Update font pairing card selection (only if no individual fonts selected)
    const hasIndividualSelection =
      this.selectedHeadingFont !== null || this.selectedBodyFont !== null;

    this.shadowRoot?.querySelectorAll(".font-item").forEach((item, index) => {
      if (!hasIndividualSelection && index === this.selectedFontPairing) {
        item.classList.add("selected");
      } else {
        item.classList.remove("selected");
      }
    });

    // Update individual font selections
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

  private toggleColumn(columnType: "themes" | "fonts") {
    const isExpanding = columnType === "themes"
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

    // Update header content visibility
    if (headerContent) {
      headerContent.classList.toggle(
        "logo-hidden",
        this.themesColumnCollapsed || this.fontsColumnCollapsed
      );
    }

    // Save to localStorage
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
      const isCollapsed = columnType === "themes"
        ? this.themesColumnCollapsed
        : this.fontsColumnCollapsed;

      column.classList.toggle("collapsed", isCollapsed);
      if (collapseBtn) {
        collapseBtn.innerHTML = isCollapsed ? "«" : "»";
        collapseBtn.title = isCollapsed ? "Expand" : "Collapse";
      }
    }

    // Update header content visibility
    if (headerContent) {
      headerContent.classList.toggle(
        "logo-hidden",
        this.themesColumnCollapsed || this.fontsColumnCollapsed
      );
    }
  }

  private handleActivate(type: "theme" | "font", index: number) {
    if (!this.shadowRoot) return;
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
    // Prevent recursive calls from MutationObserver (static flag shared across all instances)
    if (ThemeForseen.isApplyingTheme) {
      return;
    }

    // Only apply if this instance's drawer is open, OR if forced (initial load), OR if no drawer is open yet
    if (!force && !this.isOpen && this.drawerElement) {
      return;
    }

    ThemeForseen.isApplyingTheme = true;

    try {
      const themeIndex = this.isDarkMode
        ? this.selectedDarkTheme
        : this.selectedLightTheme;
      const theme = colorThemes[themeIndex];
      const colors = this.isDarkMode ? theme.dark : theme.light;

      applyThemeColors(colors, this.isDarkMode);
      this.saveToLocalStorage();
    } finally {
      // Reset the guard flag (static, shared across all instances)
      ThemeForseen.isApplyingTheme = false;
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

// Register the custom element
if (typeof window !== "undefined" && !customElements.get("theme-forseen")) {
  customElements.define("theme-forseen", ThemeForseen);
}
