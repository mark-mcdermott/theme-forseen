import { colorThemes, fontPairings, } from "./themes";
export class ThemeForseen extends HTMLElement {
    constructor() {
        super();
        this.isOpen = false;
        this.selectedLightTheme = 0;
        this.selectedDarkTheme = 0;
        this.selectedFontPairing = 0;
        this.isDarkMode = false;
        this.focusedColumn = "themes";
        this.starredLightThemes = new Set();
        this.starredDarkThemes = new Set();
        this.lovedLightTheme = null;
        this.lovedDarkTheme = null;
        this.starredFonts = new Set();
        this.lovedFont = null;
        // Individual font selections
        this.selectedHeadingFont = null;
        this.selectedBodyFont = null;
        // Filter state
        this.selectedTags = new Set();
        this.searchText = "";
        this.selectedHeadingStyles = new Set();
        this.selectedBodyStyles = new Set();
        // Column collapse state
        this.themesColumnCollapsed = false;
        this.fontsColumnCollapsed = false;
        // Active tile state for keyboard shortcuts
        this.activeThemeIndex = null;
        this.activeFontIndex = null;
        this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
        this.loadFromLocalStorage();
        this.incrementVisitCounter();
        this.render();
        this.attachEventListeners();
        this.checkDarkMode();
        this.applyTheme();
        this.applyFonts();
        // Render theme and font lists (this also restores favorites)
        this.renderThemes();
        this.renderFonts();
        // Hide instructions if user has visited enough times
        this.maybeHideInstructions();
        // Jiggle the bookmark after 7 seconds to attract attention
        setTimeout(() => {
            const toggle = this.shadowRoot?.querySelector('.drawer-toggle');
            if (toggle && !this.isOpen) {
                toggle.classList.add('jiggle');
                // Remove the class after animation completes so it can be triggered again if needed
                setTimeout(() => {
                    toggle.classList.remove('jiggle');
                }, 600);
            }
        }, 7000);
    }
    checkDarkMode() {
        // Use saved preference if available, otherwise use system preference
        const saved = localStorage.getItem("themeforseen-darkmode");
        if (saved !== null) {
            this.isDarkMode = saved === "true";
        }
        else {
            this.isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        // Watch for system changes (but saved preference takes priority)
        window
            .matchMedia("(prefers-color-scheme: dark)")
            .addEventListener("change", (e) => {
            if (localStorage.getItem("themeforseen-darkmode") === null) {
                this.isDarkMode = e.matches;
                this.applyTheme();
                this.updateModeButtons();
            }
        });
        // Helper function to check and sync dark mode
        const syncDarkMode = () => {
            const currentColorScheme = document.documentElement.style.colorScheme ||
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
    loadFromLocalStorage() {
        // Load selections
        const savedLightTheme = localStorage.getItem("themeforseen-lighttheme");
        const savedDarkTheme = localStorage.getItem("themeforseen-darktheme");
        const savedFont = localStorage.getItem("themeforseen-font");
        if (savedLightTheme)
            this.selectedLightTheme = parseInt(savedLightTheme);
        if (savedDarkTheme)
            this.selectedDarkTheme = parseInt(savedDarkTheme);
        if (savedFont)
            this.selectedFontPairing = parseInt(savedFont);
        // Load starred themes
        const savedStarredLight = localStorage.getItem("themeforseen-starred-light");
        const savedStarredDark = localStorage.getItem("themeforseen-starred-dark");
        if (savedStarredLight) {
            this.starredLightThemes = new Set(JSON.parse(savedStarredLight));
        }
        if (savedStarredDark) {
            this.starredDarkThemes = new Set(JSON.parse(savedStarredDark));
        }
        // Load loved themes
        const savedLovedLight = localStorage.getItem("themeforseen-loved-light");
        const savedLovedDark = localStorage.getItem("themeforseen-loved-dark");
        if (savedLovedLight)
            this.lovedLightTheme = parseInt(savedLovedLight);
        if (savedLovedDark)
            this.lovedDarkTheme = parseInt(savedLovedDark);
        // Load starred fonts
        const savedStarredFonts = localStorage.getItem("themeforseen-starred-fonts");
        if (savedStarredFonts) {
            this.starredFonts = new Set(JSON.parse(savedStarredFonts));
        }
        // Load loved font
        const savedLovedFont = localStorage.getItem("themeforseen-loved-font");
        if (savedLovedFont)
            this.lovedFont = parseInt(savedLovedFont);
        // Load individual font selections
        const savedHeadingFont = localStorage.getItem("themeforseen-heading-font");
        const savedBodyFont = localStorage.getItem("themeforseen-body-font");
        if (savedHeadingFont)
            this.selectedHeadingFont = savedHeadingFont;
        if (savedBodyFont)
            this.selectedBodyFont = savedBodyFont;
        // Load filter state
        const savedTags = localStorage.getItem("themeforseen-filter-tags");
        const savedSearch = localStorage.getItem("themeforseen-filter-search");
        const savedHeadingStyles = localStorage.getItem("themeforseen-filter-heading-styles");
        const savedBodyStyles = localStorage.getItem("themeforseen-filter-body-styles");
        if (savedTags) {
            this.selectedTags = new Set(JSON.parse(savedTags));
        }
        if (savedSearch) {
            this.searchText = savedSearch;
        }
        if (savedHeadingStyles) {
            this.selectedHeadingStyles = new Set(JSON.parse(savedHeadingStyles));
        }
        if (savedBodyStyles) {
            this.selectedBodyStyles = new Set(JSON.parse(savedBodyStyles));
        }
        // Load column collapse state
        const savedThemesCollapsed = localStorage.getItem("themeforseen-themes-collapsed");
        const savedFontsCollapsed = localStorage.getItem("themeforseen-fonts-collapsed");
        if (savedThemesCollapsed) {
            this.themesColumnCollapsed = savedThemesCollapsed === "true";
        }
        if (savedFontsCollapsed) {
            this.fontsColumnCollapsed = savedFontsCollapsed === "true";
        }
    }
    incrementVisitCounter() {
        const visitCount = parseInt(localStorage.getItem("themeforseen-visit-count") || "0");
        localStorage.setItem("themeforseen-visit-count", String(visitCount + 1));
    }
    maybeHideInstructions() {
        const visitCount = parseInt(localStorage.getItem("themeforseen-visit-count") || "0");
        if (visitCount >= 10) {
            // Hide both instruction boxes
            this.shadowRoot?.querySelectorAll(".instructions").forEach((el) => {
                el.classList.add("hidden");
            });
        }
    }
    saveToLocalStorage() {
        // Save mode
        localStorage.setItem("themeforseen-darkmode", String(this.isDarkMode));
        // Save selections
        localStorage.setItem("themeforseen-lighttheme", String(this.selectedLightTheme));
        localStorage.setItem("themeforseen-darktheme", String(this.selectedDarkTheme));
        localStorage.setItem("themeforseen-font", String(this.selectedFontPairing));
        // Save starred themes
        localStorage.setItem("themeforseen-starred-light", JSON.stringify(Array.from(this.starredLightThemes)));
        localStorage.setItem("themeforseen-starred-dark", JSON.stringify(Array.from(this.starredDarkThemes)));
        // Save loved themes
        if (this.lovedLightTheme !== null) {
            localStorage.setItem("themeforseen-loved-light", String(this.lovedLightTheme));
        }
        else {
            localStorage.removeItem("themeforseen-loved-light");
        }
        if (this.lovedDarkTheme !== null) {
            localStorage.setItem("themeforseen-loved-dark", String(this.lovedDarkTheme));
        }
        else {
            localStorage.removeItem("themeforseen-loved-dark");
        }
        // Save starred fonts
        localStorage.setItem("themeforseen-starred-fonts", JSON.stringify(Array.from(this.starredFonts)));
        // Save loved font
        if (this.lovedFont !== null) {
            localStorage.setItem("themeforseen-loved-font", String(this.lovedFont));
        }
        else {
            localStorage.removeItem("themeforseen-loved-font");
        }
        // Save individual font selections
        if (this.selectedHeadingFont) {
            localStorage.setItem("themeforseen-heading-font", this.selectedHeadingFont);
        }
        else {
            localStorage.removeItem("themeforseen-heading-font");
        }
        if (this.selectedBodyFont) {
            localStorage.setItem("themeforseen-body-font", this.selectedBodyFont);
        }
        else {
            localStorage.removeItem("themeforseen-body-font");
        }
        // Save filter state
        localStorage.setItem("themeforseen-filter-tags", JSON.stringify(Array.from(this.selectedTags)));
        localStorage.setItem("themeforseen-filter-search", this.searchText);
        localStorage.setItem("themeforseen-filter-heading-styles", JSON.stringify(Array.from(this.selectedHeadingStyles)));
        localStorage.setItem("themeforseen-filter-body-styles", JSON.stringify(Array.from(this.selectedBodyStyles)));
        // Save column collapse state
        localStorage.setItem("themeforseen-themes-collapsed", String(this.themesColumnCollapsed));
        localStorage.setItem("themeforseen-fonts-collapsed", String(this.fontsColumnCollapsed));
    }
    render() {
        if (!this.shadowRoot)
            return;
        this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600&display=swap');

        * {
          box-sizing: border-box;
        }

        :host {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .drawer-toggle {
          position: fixed;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 70px;
          height: 80px;
          background: transparent;
          border: none;
          border-radius: 0 6px 6px 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: all 0.3s ease;
          z-index: 999998;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4)) drop-shadow(0 2px 3px rgba(0,0,0,0.3));
        }

        .drawer-toggle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: auto;
          transform: scaleX(-1);
          clip-path: url(#bookmark-clip);
          position: relative;
          z-index: 2;
        }

        .bookmark-border {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 1;
        }

        .bookmark-shape {
          position: absolute;
          width: 0;
          height: 0;
        }

        .drawer-toggle:hover {
          width: 75px;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4)) drop-shadow(0 2px 3px rgba(0,0,0,0.3)) brightness(1.1);
        }

        .drawer-toggle.hidden {
          opacity: 0;
          pointer-events: none;
        }

        @keyframes jiggle {
          0%, 100% { transform: translateY(-50%) rotate(0deg); }
          10% { transform: translateY(-50%) rotate(-3deg); }
          20% { transform: translateY(-50%) rotate(3deg); }
          30% { transform: translateY(-50%) rotate(-3deg); }
          40% { transform: translateY(-50%) rotate(3deg); }
          50% { transform: translateY(-50%) rotate(-2deg); }
          60% { transform: translateY(-50%) rotate(2deg); }
          70% { transform: translateY(-50%) rotate(-1deg); }
          80% { transform: translateY(-50%) rotate(1deg); }
          90% { transform: translateY(-50%) rotate(0deg); }
        }

        .drawer-toggle.jiggle {
          animation: jiggle 0.6s ease-in-out;
        }

        .backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: transparent;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: 999997;
        }

        .backdrop.visible {
          opacity: 1;
          pointer-events: all;
        }

        .drawer {
          position: fixed;
          left: -600px;
          top: 0;
          height: 100vh;
          width: 600px;
          background: light-dark(white, #1a1a1a);
          color: light-dark(#333, #e0e0e0);
          box-shadow: 2px 0 10px rgba(0,0,0,0.2);
          transition: left 0.3s ease;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          z-index: 999999;
        }

        .drawer.open {
          left: 0;
        }

        .drawer-header {
          padding: 20px;
          background: light-dark(#f5f5f5, #2a2a2a);
          border-bottom: 2px solid light-dark(#ddd, #444);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .drawer-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .drawer-header-logo {
          width: 64px;
          height: auto;
        }

        .drawer-header-content.logo-hidden .drawer-header-logo,
        .drawer-header-content.logo-hidden h2 {
          display: none;
        }

        .drawer-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: light-dark(#333, #e0e0e0);
          font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 55px;
          cursor: pointer;
          color: light-dark(#666, #aaa);
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: light-dark(#333, #fff);
        }

        .drawer-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .column {
          flex: 1;
          display: flex;
          flex-direction: column;
          border-right: 1px solid light-dark(#ddd, #444);
          overflow: hidden;
        }

        .column:last-child {
          border-right: none;
        }

        .column-header {
          padding: 15px;
          background: light-dark(#fafafa, #252525);
          border-bottom: 1px solid light-dark(#ddd, #444);
          font-weight: 600;
          font-size: 14px;
          color: light-dark(#333, #e0e0e0);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .column-title {
          flex: 1;
        }

        .collapse-btn {
          background: transparent;
          border: 1px solid light-dark(#ccc, #555);
          color: light-dark(#333, #e0e0e0);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .collapse-btn:hover {
          background: light-dark(#e0e0e0, #333);
        }

        .column.collapsed {
          flex: 0 0 40px;
          min-width: 40px;
        }

        .column.collapsed .column-header {
          writing-mode: vertical-lr;
          text-align: center;
          padding: 15px 5px;
        }

        .column.collapsed .column-title {
          transform: rotate(180deg);
        }

        .column.collapsed .collapse-btn {
          writing-mode: horizontal-tb;
          transform: rotate(180deg);
        }

        .column.collapsed .column-content {
          display: none;
        }

        .column-content {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
        }

        .column-content::-webkit-scrollbar {
          width: 8px;
        }

        .column-content::-webkit-scrollbar-track {
          background: light-dark(#f1f1f1, #2a2a2a);
        }

        .column-content::-webkit-scrollbar-thumb {
          background: light-dark(#888, #555);
          border-radius: 4px;
        }

        .column-content::-webkit-scrollbar-thumb:hover {
          background: light-dark(#555, #777);
        }

        .theme-item, .font-item {
          padding: 12px;
          padding-right: 40px;
          margin: 5px 0;
          border: 2px solid light-dark(#ddd, #444);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: light-dark(white, #2a2a2a);
          position: relative;
        }

        .theme-item:hover, .font-item:hover {
          border-color: light-dark(#666, #888);
          transform: translateX(2px);
        }

        .theme-item.selected, .font-item.selected {
          border: 2px solid light-dark(#4CAF50, #81C784);
          background: light-dark(rgba(76,175,80,0.1), rgba(129,199,132,0.1));
          font-weight: 600;
        }

        .theme-item.active, .font-item.active {
          outline: 3px solid light-dark(#2196F3, #64B5F6);
          outline-offset: 2px;
        }

        .theme-item .theme-name, .font-item .font-name {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          color: light-dark(#333, #e0e0e0);
        }

        .theme-colors {
          display: flex;
          gap: 4px;
          margin-top: 8px;
        }

        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 1px solid rgba(0,0,0,0.1);
        }

        .font-preview {
          font-size: 12px;
          color: light-dark(#666, #aaa);
          margin-top: 4px;
        }

        .individual-font {
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }

        .individual-font:hover {
          background: light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.05));
        }

        .individual-font.selected {
          border: 2px solid light-dark(#4CAF50, #81C784);
          background: light-dark(rgba(76,175,80,0.1), rgba(129,199,132,0.1));
        }

        .favorites {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 10;
        }

        .favorite-icon {
          width: 20px;
          height: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #716122;
          font-size: 16px;
          line-height: 1;
          user-select: none;
        }

        .favorite-icon:hover {
          transform: scale(1.2);
          color: #A79032;
        }

        .favorite-icon.starred {
          color: #fcd997;
        }

        .favorite-icon.starred:hover {
          color: #fcd997;
        }

        .favorite-icon.loved {
          color: #bf195e;
        }

        .favorite-icon.loved:hover {
          color: #bf195e;
        }

        .activate-icon {
          width: 20px;
          height: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 16px;
          line-height: 1;
          user-select: none;
          background: transparent;
          border: none;
          padding: 0;
          margin: 0;
          color: light-dark(#666, #999);
        }

        .activate-icon:hover {
          transform: scale(1.3);
          color: light-dark(#FFB800, #FFC700);
          filter: drop-shadow(0 0 4px light-dark(#FFB800, #FFC700));
        }

        .font-switch-icon {
          position: absolute;
          right: 45px;
          top: 50%;
          transform: translateY(-50%);
          background: light-dark(#f0f0f0, #3a3a3a);
          border: 1px solid light-dark(#ccc, #555);
          color: light-dark(#333, #e0e0e0);
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 16px;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .font-switch-icon:hover {
          background: light-dark(#e0e0e0, #444);
          transform: translateY(-50%) scale(1.1);
        }

        .mode-toggle {
          display: flex;
          gap: 10px;
          margin-top: 10px;
          padding: 10px;
          background: light-dark(#f9f9f9, #2a2a2a);
          border-radius: 6px;
        }

        .mode-btn {
          flex: 1;
          padding: 8px;
          border: 2px solid light-dark(#ddd, #444);
          background: light-dark(white, #333);
          color: light-dark(#333, #e0e0e0);
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .mode-btn.active {
          border-color: light-dark(#333, #aaa);
          background: light-dark(#f0f0f0, #444);
          font-weight: 600;
        }

        .instructions {
          padding: 12px;
          padding-right: 30px;
          background: light-dark(#fff3cd, #3a3418);
          border: 1px solid light-dark(#ffc107, #665500);
          border-radius: 6px;
          font-size: 11px;
          color: light-dark(#856404, #ffdb99);
          margin-bottom: 10px;
          position: relative;
          transition: all 0.3s ease;
        }

        .instructions.hidden {
          display: none;
        }

        .instructions-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          color: light-dark(#856404, #ffdb99);
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          opacity: 0.6;
        }

        .instructions-close:hover {
          opacity: 1;
        }

        .filter-container {
          margin-bottom: 10px;
        }

        .filter-input-wrapper {
          position: relative;
          display: flex;
          gap: 0;
        }

        .filter-input {
          flex: 1;
          padding: 8px 30px 8px 10px;
          border: 2px solid light-dark(#ddd, #444);
          border-radius: 4px;
          background: light-dark(white, #333);
          color: light-dark(#333, #e0e0e0);
          font-size: 12px;
        }

        .filter-input:focus {
          outline: none;
          border-color: light-dark(#4CAF50, #81C784);
        }

        .filter-dropdown-btn {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 30px;
          background: none;
          border: none;
          color: light-dark(#666, #aaa);
          cursor: pointer;
          font-size: 10px;
          transition: all 0.2s ease;
        }

        .filter-dropdown-btn:hover {
          color: light-dark(#333, #e0e0e0);
        }

        .filter-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
          min-height: 0;
        }

        .filter-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: light-dark(#4CAF50, #81C784);
          color: light-dark(white, #000);
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .filter-tag-remove {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          margin: 0;
          line-height: 1;
          opacity: 0.8;
        }

        .filter-tag-remove:hover {
          opacity: 1;
        }

        .filter-dropdown {
          margin-top: 8px;
          padding: 8px;
          background: light-dark(white, #333);
          border: 2px solid light-dark(#ddd, #444);
          border-radius: 4px;
        }

        .filter-dropdown.hidden {
          display: none;
        }

        .filter-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px;
          cursor: pointer;
          border-radius: 4px;
        }

        .filter-option:hover {
          background: light-dark(#f5f5f5, #444);
        }

        .filter-option input[type="checkbox"] {
          cursor: pointer;
        }

        .filter-option label {
          cursor: pointer;
          font-size: 12px;
          flex: 1;
        }

        .font-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .font-filter-group {
          flex: 1;
          position: relative;
        }

        .font-filter-label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          margin-bottom: 4px;
          color: light-dark(#666, #aaa);
        }

        .font-filter-dropdown-btn {
          width: 100%;
          padding: 8px 10px;
          border: 2px solid light-dark(#ddd, #444);
          border-radius: 4px;
          background: light-dark(white, #333);
          color: light-dark(#333, #e0e0e0);
          font-size: 11px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }

        .font-filter-dropdown-btn:hover {
          border-color: light-dark(#4CAF50, #81C784);
        }

        .font-filter-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          padding: 8px;
          background: light-dark(white, #333);
          border: 2px solid light-dark(#ddd, #444);
          border-radius: 4px;
          z-index: 100;
        }

        .font-filter-dropdown.hidden {
          display: none;
        }

        /* Activation Modal */
        .activation-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100000;
          backdrop-filter: blur(4px);
        }

        .activation-modal.hidden {
          display: none;
        }

        .activation-modal-content {
          background: light-dark(#fff, #2a2a2a);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          max-width: 800px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .activation-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid light-dark(#ddd, #444);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .activation-modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: light-dark(#333, #e0e0e0);
        }

        .activation-modal-close {
          background: none;
          border: none;
          font-size: 32px;
          cursor: pointer;
          color: light-dark(#666, #aaa);
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .activation-modal-close:hover {
          color: light-dark(#333, #fff);
        }

        .activation-modal-body {
          padding: 24px;
          overflow-y: auto;
        }

        .activation-instructions {
          margin: 0 0 20px 0;
          color: light-dark(#555, #ccc);
          line-height: 1.6;
        }

        .activation-code-section {
          margin-bottom: 20px;
        }

        .activation-code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .activation-code-filename {
          font-family: 'Courier New', monospace;
          font-weight: 600;
          color: light-dark(#333, #e0e0e0);
          font-size: 14px;
        }

        .activation-copy-btn {
          background: light-dark(#f0f0f0, #3a3a3a);
          border: 1px solid light-dark(#ccc, #555);
          color: light-dark(#333, #e0e0e0);
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .activation-copy-btn:hover {
          background: light-dark(#e0e0e0, #444);
        }

        .activation-copy-btn.copied {
          background: light-dark(#4CAF50, #81C784);
          color: white;
          border-color: light-dark(#4CAF50, #81C784);
        }

        .activation-code-block {
          background: light-dark(#f5f5f5, #1a1a1a);
          border: 1px solid light-dark(#ddd, #444);
          border-radius: 6px;
          padding: 16px;
          overflow-x: auto;
          margin: 0;
        }

        .activation-code {
          font-family: 'Courier New', Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
          color: light-dark(#333, #e0e0e0);
          white-space: pre;
        }

        .activation-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .activation-save-btn,
        .activation-cancel-btn {
          padding: 10px 20px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .activation-save-btn {
          background: light-dark(#4CAF50, #81C784);
          color: white;
        }

        .activation-save-btn:hover {
          background: light-dark(#45a049, #66bb6a);
        }

        .activation-save-btn:disabled {
          background: light-dark(#ccc, #555);
          cursor: not-allowed;
        }

        .activation-cancel-btn {
          background: light-dark(#f0f0f0, #3a3a3a);
          color: light-dark(#333, #e0e0e0);
          border: 1px solid light-dark(#ccc, #555);
        }

        .activation-cancel-btn:hover {
          background: light-dark(#e0e0e0, #444);
        }
      </style>

      <svg class="bookmark-shape" width="0" height="0">
        <defs>
          <clipPath id="bookmark-clip" clipPathUnits="objectBoundingBox">
            <!-- Banner/flag shape showing full image width -->
            <path d="M 0,0 L 0.1,0.5 L 0,1 L 1,1 L 1,0 Z" />
          </clipPath>
        </defs>
      </svg>

      <div class="backdrop"></div>

      <button class="drawer-toggle" title="Click the Nyan Unicorn to open Theme Drawer!">
        <svg class="bookmark-border" viewBox="0 0 100 100" preserveAspectRatio="none">
          <!-- Top edge -->
          <line x1="100" y1="0" x2="0" y2="0" stroke="black" stroke-width="2" vector-effect="non-scaling-stroke"/>
          <!-- Triangle top edge -->
          <line x1="0" y1="0" x2="10" y2="50" stroke="black" stroke-width="2" vector-effect="non-scaling-stroke"/>
          <!-- Triangle bottom edge -->
          <line x1="10" y1="50" x2="0" y2="100" stroke="black" stroke-width="2" vector-effect="non-scaling-stroke"/>
          <!-- Bottom edge -->
          <line x1="0" y1="100" x2="100" y2="100" stroke="black" stroke-width="2" vector-effect="non-scaling-stroke"/>
        </svg>
        <img src="/nyan-unicorn.webp" alt="Nyan Unicorn" />
      </button>

      <div class="drawer">
        <div class="drawer-header">
          <div class="drawer-header-content ${this.themesColumnCollapsed || this.fontsColumnCollapsed ? 'logo-hidden' : ''}">
            <svg class="drawer-header-logo" viewBox="0 0 97.6 56.38" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <style>
                  .cls-1{fill:#010101;}
                  .cls-2{fill:#eeea55;}
                  .cls-2,.cls-3,.cls-4,.cls-5,.cls-6{stroke:#010101;stroke-linecap:round;stroke-linejoin:round;}
                  .cls-2,.cls-3,.cls-6{stroke-width:3.1px;}
                  .cls-3,.cls-7{fill:#fff;}
                  .cls-4,.cls-5{stroke-width:2.8px;}
                  .cls-4,.cls-6{fill:#5fccf5;}
                  .cls-5{fill:none;}
                </style>
              </defs>
              <line class="cls-5" x1="87.35" y1="8.38" x2="75.71" y2="8.38"/>
              <path class="cls-1" d="M7.49,6.7c0,2.07-1.68,3.75-3.75,3.75s-3.75-1.68-3.75-3.75,1.68-3.75,3.75-3.75,3.75,1.68,3.75,3.75Z"/>
              <path class="cls-4" d="M35.28,10.45c0,2.07-1.68,3.75-3.75,3.75s-3.75-1.68-3.75-3.75,1.68-3.75,3.75-3.75,3.75,1.68,3.75,3.75Z"/>
              <polyline class="cls-2" points="45.97 18.89 56.24 1.55 66.27 19.35"/>
              <path class="cls-3" d="M87.35,33.43c-21.38-21.36-42.75-21.1-64.13,0"/>
              <path class="cls-3" d="M23.22,33.43c12.92,16.52,43.02,22.82,64.13,0"/>
              <path class="cls-6" d="M66.24,29.75c0,6.08-4.93,11.01-11.01,11.01s-11.01-4.93-11.01-11.01,4.93-11.01,11.01-11.01,11.01,4.93,11.01,11.01Z"/>
              <path class="cls-2" d="M78.49,41.04c1.26-.65,3.24,5.28,7.77,13.79H24.67l7.77-13.12c5.5,3.54,13.53,6.55,22.9,6.58s17.83-4.51,23.15-7.25Z"/>
              <path class="cls-1" d="M61.54,29.75c0,3.49-2.83,6.31-6.31,6.31s-6.31-2.83-6.31-6.31,2.83-6.31,6.31-6.31,6.31,2.83,6.31,6.31Z"/>
              <path class="cls-1" d="M19.51,45.15s.08-.04.12-.05c.78-.34,1.29-1.16,1.19-2.05-.1-.9-.79-1.58-1.63-1.73-.03,0-.06-.02-.09-.02-.32-.05-1.91-.38-2.25-2.33,0-.02,0-.03-.01-.04-.02-.08-.04-.15-.06-.22-.02-.05-.03-.11-.05-.16-.03-.06-.06-.12-.09-.18-.03-.05-.06-.11-.09-.16-.04-.05-.08-.1-.12-.15-.04-.05-.08-.1-.12-.14-.05-.05-.1-.09-.15-.13-.05-.04-.09-.08-.14-.11-.05-.04-.12-.07-.17-.1-.06-.03-.11-.06-.17-.09-.05-.02-.11-.04-.17-.06-.07-.02-.14-.04-.21-.06-.02,0-.03,0-.05-.01-.04,0-.09,0-.13,0-.07,0-.14-.02-.21-.02-.07,0-.14,0-.21.01-.05,0-.09,0-.14.01-.02,0-.03.01-.05.01-.07.01-.13.04-.2.06-.06.02-.13.04-.19.06-.05.02-.1.05-.15.08-.07.03-.13.07-.19.11-.04.03-.08.06-.12.1-.06.05-.12.09-.17.15-.04.04-.07.09-.11.13-.04.05-.09.11-.13.16-.03.05-.06.1-.09.16-.03.06-.07.12-.1.19-.02.05-.04.11-.05.16-.02.07-.05.14-.06.22,0,.01,0,.03-.01.04-.34,1.94-1.92,2.28-2.25,2.33-.04,0-.08.02-.12.03-.08.01-.15.03-.23.05-.06.02-.12.05-.18.07-.05.02-.11.04-.16.07-.08.04-.15.09-.22.15-.02.02-.05.03-.07.05-.52.42-.83,1.08-.75,1.79.11.92.81,1.61,1.68,1.74.02,0,.03,0,.04.01.32.05,1.91.38,2.25,2.33,0,.02,0,.03.01.05.01.06.03.11.04.17.02.07.04.13.07.2.02.05.04.09.07.14.03.06.07.13.11.19.03.04.06.08.09.12.04.06.09.11.14.17.04.04.07.07.11.11.05.05.11.09.17.13.04.03.08.06.12.09.07.04.14.08.21.11.04.02.07.04.11.05.22.09.46.13.71.13h0c.25,0,.49-.05.71-.13.04-.02.08-.04.12-.05.07-.03.14-.07.21-.11.04-.03.09-.06.13-.09.06-.04.11-.08.17-.13.04-.04.08-.07.11-.11.05-.05.1-.11.14-.16.03-.04.06-.08.09-.12.04-.06.07-.12.11-.19.02-.05.05-.09.07-.14.03-.06.05-.13.07-.19.02-.06.03-.11.04-.17,0-.02.01-.03.01-.05.34-1.94,1.92-2.28,2.25-2.33.02,0,.03,0,.05-.01.07-.01.14-.03.21-.05.06-.01.11-.03.17-.05Z"/>
              <line class="cls-5" x1="81.53" y1="14.2" x2="81.53" y2="2.55"/>
              <path class="cls-1" d="M97.6,47.91c0,2.07-1.68,3.75-3.75,3.75s-3.75-1.68-3.75-3.75,1.68-3.75,3.75-3.75,3.75,1.68,3.75,3.75Z"/>
              <circle class="cls-7" cx="57.12" cy="26.22" r="2.33"/>
            </svg>
            <h2>ThemeForseen</h2>
          </div>
          <button class="close-btn" title="Close">&times;</button>
        </div>

        <div class="drawer-content">
          <!-- Themes Column -->
          <div class="column ${this.themesColumnCollapsed ? 'collapsed' : ''}" data-column="themes">
            <div class="column-header">
              <span class="column-title">Color Themes</span>
              <button class="collapse-btn" data-column-type="themes" title="${this.themesColumnCollapsed ? 'Expand' : 'Collapse'}">
                ${this.themesColumnCollapsed ? '→' : '←'}
              </button>
            </div>
            <div class="column-content">
              <div class="instructions" data-instructions="themes">
                <button class="instructions-close" aria-label="Close">&times;</button>
                Use ↑/↓ arrow keys or mouse wheel to browse themes. Themes apply in real-time!
              </div>
              <div class="filter-container">
                <div class="filter-input-wrapper">
                  <input
                    type="text"
                    class="filter-input"
                    placeholder="Search or select tags..."
                    value="${this.searchText}"
                  />
                  <button class="filter-dropdown-btn" aria-label="Filter options">▼</button>
                </div>
                <div class="filter-tags">
                  ${Array.from(this.selectedTags).map(tag => `
                    <span class="filter-tag" data-tag="${tag}">
                      ${tag}
                      <button class="filter-tag-remove" data-tag="${tag}">&times;</button>
                    </span>
                  `).join('')}
                </div>
                <div class="filter-dropdown hidden">
                  <div class="filter-option" data-tag="corporate">
                    <input type="checkbox" id="tag-corporate" ${this.selectedTags.has('corporate') ? 'checked' : ''}>
                    <label for="tag-corporate">Corporate</label>
                  </div>
                  <div class="filter-option" data-tag="funky">
                    <input type="checkbox" id="tag-funky" ${this.selectedTags.has('funky') ? 'checked' : ''}>
                    <label for="tag-funky">Funky</label>
                  </div>
                </div>
              </div>
              <div class="mode-toggle">
                <button class="mode-btn" data-mode="light">Light Mode</button>
                <button class="mode-btn active" data-mode="dark">Dark Mode</button>
              </div>
              <div class="themes-list"></div>
            </div>
          </div>

          <!-- Fonts Column -->
          <div class="column ${this.fontsColumnCollapsed ? 'collapsed' : ''}" data-column="fonts">
            <div class="column-header">
              <span class="column-title">Font Pairings</span>
              <button class="collapse-btn" data-column-type="fonts" title="${this.fontsColumnCollapsed ? 'Expand' : 'Collapse'}">
                ${this.fontsColumnCollapsed ? '→' : '←'}
              </button>
            </div>
            <div class="column-content">
              <div class="instructions" data-instructions="fonts">
                <button class="instructions-close" aria-label="Close">&times;</button>
                Use ↑/↓ arrow keys or mouse wheel to browse fonts. Changes apply instantly!
              </div>
              <div class="font-filters">
                <div class="font-filter-group">
                  <label class="font-filter-label">Heading</label>
                  <button class="font-filter-dropdown-btn" data-filter-type="heading">
                    ${this.selectedHeadingStyles.size > 0 ? Array.from(this.selectedHeadingStyles).join(', ') : 'All styles'} ▼
                  </button>
                  <div class="font-filter-dropdown hidden" data-filter-type="heading">
                    <div class="filter-option" data-style="sans">
                      <input type="checkbox" id="heading-sans" ${this.selectedHeadingStyles.has('sans') ? 'checked' : ''}>
                      <label for="heading-sans">Sans</label>
                    </div>
                    <div class="filter-option" data-style="serif">
                      <input type="checkbox" id="heading-serif" ${this.selectedHeadingStyles.has('serif') ? 'checked' : ''}>
                      <label for="heading-serif">Serif</label>
                    </div>
                    <div class="filter-option" data-style="display">
                      <input type="checkbox" id="heading-display" ${this.selectedHeadingStyles.has('display') ? 'checked' : ''}>
                      <label for="heading-display">Display</label>
                    </div>
                    <div class="filter-option" data-style="mono">
                      <input type="checkbox" id="heading-mono" ${this.selectedHeadingStyles.has('mono') ? 'checked' : ''}>
                      <label for="heading-mono">Mono</label>
                    </div>
                  </div>
                </div>
                <div class="font-filter-group">
                  <label class="font-filter-label">Body</label>
                  <button class="font-filter-dropdown-btn" data-filter-type="body">
                    ${this.selectedBodyStyles.size > 0 ? Array.from(this.selectedBodyStyles).join(', ') : 'All styles'} ▼
                  </button>
                  <div class="font-filter-dropdown hidden" data-filter-type="body">
                    <div class="filter-option" data-style="sans">
                      <input type="checkbox" id="body-sans" ${this.selectedBodyStyles.has('sans') ? 'checked' : ''}>
                      <label for="body-sans">Sans</label>
                    </div>
                    <div class="filter-option" data-style="serif">
                      <input type="checkbox" id="body-serif" ${this.selectedBodyStyles.has('serif') ? 'checked' : ''}>
                      <label for="body-serif">Serif</label>
                    </div>
                    <div class="filter-option" data-style="display">
                      <input type="checkbox" id="body-display" ${this.selectedBodyStyles.has('display') ? 'checked' : ''}>
                      <label for="body-display">Display</label>
                    </div>
                    <div class="filter-option" data-style="mono">
                      <input type="checkbox" id="body-mono" ${this.selectedBodyStyles.has('mono') ? 'checked' : ''}>
                      <label for="body-mono">Mono</label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="fonts-list"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Activation Modal -->
      <div class="activation-modal hidden">
        <div class="activation-modal-content">
          <div class="activation-modal-header">
            <h3>Activate Theme Configuration</h3>
            <button class="activation-modal-close">&times;</button>
          </div>
          <div class="activation-modal-body">
            <p class="activation-instructions"></p>
            <div class="activation-code-section">
              <div class="activation-code-header">
                <span class="activation-code-filename"></span>
                <button class="activation-copy-btn">Copy</button>
              </div>
              <pre class="activation-code-block"><code class="activation-code"></code></pre>
            </div>
            <div class="activation-buttons">
              <button class="activation-save-btn">Save to File</button>
              <button class="activation-cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
        this.drawerElement = this.shadowRoot.querySelector(".drawer");
        this.drawerToggle = this.shadowRoot.querySelector(".drawer-toggle");
        this.backdrop = this.shadowRoot.querySelector(".backdrop");
        this.themesColumn = this.shadowRoot.querySelector('[data-column="themes"]');
        this.fontsColumn = this.shadowRoot.querySelector('[data-column="fonts"]');
        this.renderThemes();
        this.renderFonts();
    }
    filterTheme(theme) {
        // Filter by tags if any are selected
        if (this.selectedTags.size > 0) {
            const themeTags = theme.tags || [];
            const hasMatchingTag = Array.from(this.selectedTags).some(tag => themeTags.includes(tag));
            if (!hasMatchingTag)
                return false;
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
                colors.extra
            ];
            return colorValues.some(color => color.toLowerCase().includes(search) ||
                color.toLowerCase().replace('#', '').includes(search.replace('#', '')));
        }
        return true;
    }
    renderThemes() {
        const themesList = this.shadowRoot?.querySelector(".themes-list");
        if (!themesList)
            return;
        const filteredThemes = colorThemes.filter(theme => this.filterTheme(theme));
        themesList.innerHTML = filteredThemes
            .map((theme, _) => {
            const index = colorThemes.indexOf(theme);
            const colors = this.isDarkMode ? theme.dark : theme.light;
            const isActive = this.activeThemeIndex === index;
            return `
        <div class="theme-item ${isActive ? 'active' : ''}" data-index="${index}">
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
    restoreThemeFavorites() {
        // Restore starred themes for current mode
        const starredSet = this.isDarkMode ? this.starredDarkThemes : this.starredLightThemes;
        starredSet.forEach((index) => {
            const star = this.shadowRoot?.querySelector(`.star[data-type="theme"][data-index="${index}"]`);
            star?.classList.add("starred");
        });
        // Restore loved theme for current mode
        const lovedIndex = this.isDarkMode ? this.lovedDarkTheme : this.lovedLightTheme;
        if (lovedIndex !== null) {
            const heart = this.shadowRoot?.querySelector(`.heart[data-type="theme"][data-index="${lovedIndex}"]`);
            heart?.classList.add("loved");
        }
    }
    filterFontPairing(pairing) {
        // Filter by heading styles if any are selected
        if (this.selectedHeadingStyles.size > 0) {
            const hasMatchingHeadingStyle = pairing.headingStyle.some(style => this.selectedHeadingStyles.has(style));
            if (!hasMatchingHeadingStyle)
                return false;
        }
        // Filter by body styles if any are selected
        if (this.selectedBodyStyles.size > 0) {
            const hasMatchingBodyStyle = pairing.bodyStyle.some(style => this.selectedBodyStyles.has(style));
            if (!hasMatchingBodyStyle)
                return false;
        }
        return true;
    }
    renderFonts() {
        const fontsList = this.shadowRoot?.querySelector(".fonts-list");
        if (!fontsList)
            return;
        const filteredPairings = fontPairings.filter(pairing => this.filterFontPairing(pairing));
        fontsList.innerHTML = filteredPairings
            .map((pairing, _) => {
            const index = fontPairings.indexOf(pairing);
            const isActive = this.activeFontIndex === index;
            return `
        <div class="font-item ${isActive ? 'active' : ''}" data-index="${index}">
          <div class="font-name">${pairing.name}</div>
          <div class="font-preview">
            <span class="individual-font heading-font" data-font="${pairing.heading}" data-type="heading">
              Heading: ${pairing.heading}
            </span><br>
            <span class="individual-font body-font" data-font="${pairing.body}" data-type="body">
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
    restoreFontFavorites() {
        // Restore starred fonts
        this.starredFonts.forEach((index) => {
            const star = this.shadowRoot?.querySelector(`.star[data-type="font"][data-index="${index}"]`);
            star?.classList.add("starred");
        });
        // Restore loved font
        if (this.lovedFont !== null) {
            const heart = this.shadowRoot?.querySelector(`.heart[data-type="font"][data-index="${this.lovedFont}"]`);
            heart?.classList.add("loved");
        }
    }
    attachFilterListeners() {
        // Filter input
        const filterInput = this.shadowRoot?.querySelector(".filter-input");
        filterInput?.addEventListener("input", (e) => {
            this.searchText = e.target.value;
            this.saveToLocalStorage();
            this.renderThemes();
        });
        // Filter dropdown button
        const filterDropdownBtn = this.shadowRoot?.querySelector(".filter-dropdown-btn");
        const filterDropdown = this.shadowRoot?.querySelector(".filter-dropdown");
        filterDropdownBtn?.addEventListener("click", () => {
            filterDropdown?.classList.toggle("hidden");
        });
        // Filter checkboxes
        this.shadowRoot?.querySelectorAll(".filter-container .filter-option input[type='checkbox']").forEach((checkbox) => {
            checkbox.addEventListener("change", (e) => {
                const option = e.target.closest(".filter-option");
                const tag = option?.getAttribute("data-tag");
                if (tag) {
                    if (e.target.checked) {
                        this.selectedTags.add(tag);
                    }
                    else {
                        this.selectedTags.delete(tag);
                    }
                    this.saveToLocalStorage();
                    this.render();
                    this.attachEventListeners();
                    this.renderThemes();
                }
            });
        });
        // Filter tag remove buttons
        this.shadowRoot?.querySelectorAll(".filter-tag-remove").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const tag = e.currentTarget.getAttribute("data-tag");
                if (tag) {
                    this.selectedTags.delete(tag);
                    this.saveToLocalStorage();
                    this.render();
                    this.attachEventListeners();
                    this.renderThemes();
                }
            });
        });
    }
    updateFontFilterButtonText(filterType) {
        const targetSet = filterType === "heading" ? this.selectedHeadingStyles : this.selectedBodyStyles;
        const btn = this.shadowRoot?.querySelector(`.font-filter-dropdown-btn[data-filter-type="${filterType}"]`);
        if (btn) {
            const text = targetSet.size > 0 ? Array.from(targetSet).join(', ') : 'All styles';
            btn.textContent = `${text} ▼`;
        }
    }
    attachFontFilterListeners() {
        // Font filter dropdown buttons
        this.shadowRoot?.querySelectorAll(".font-filter-dropdown-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const filterType = e.currentTarget.getAttribute("data-filter-type");
                const dropdown = this.shadowRoot?.querySelector(`.font-filter-dropdown[data-filter-type="${filterType}"]`);
                dropdown?.classList.toggle("hidden");
            });
        });
        // Font filter checkboxes
        this.shadowRoot?.querySelectorAll(".font-filter-dropdown .filter-option input[type='checkbox']").forEach((checkbox) => {
            checkbox.addEventListener("change", (e) => {
                const input = e.target;
                const option = input.closest(".filter-option");
                const style = option?.getAttribute("data-style");
                const dropdown = option?.closest(".font-filter-dropdown");
                const filterType = dropdown?.getAttribute("data-filter-type");
                if (style && filterType) {
                    const targetSet = filterType === "heading" ? this.selectedHeadingStyles : this.selectedBodyStyles;
                    if (input.checked) {
                        targetSet.add(style);
                    }
                    else {
                        targetSet.delete(style);
                    }
                    this.saveToLocalStorage();
                    this.updateFontFilterButtonText(filterType);
                    this.renderFonts();
                }
            });
        });
    }
    attachEventListeners() {
        const toggle = this.shadowRoot?.querySelector(".drawer-toggle");
        const closeBtn = this.shadowRoot?.querySelector(".close-btn");
        const drawer = this.shadowRoot?.querySelector(".drawer");
        toggle?.addEventListener("click", () => this.toggleDrawer());
        closeBtn?.addEventListener("click", () => this.toggleDrawer());
        this.backdrop?.addEventListener("click", () => this.toggleDrawer());
        // Prevent clicks inside the drawer from bubbling to backdrop
        drawer?.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        // Theme items - using event delegation to survive re-renders
        const themesList = this.shadowRoot?.querySelector(".themes-list");
        themesList?.addEventListener("click", (e) => {
            const themeItem = e.target.closest(".theme-item");
            if (themeItem) {
                const index = parseInt(themeItem.dataset.index || "0");
                this.activeThemeIndex = index;
                this.focusedColumn = "themes";
                if (this.isDarkMode) {
                    this.selectedDarkTheme = index;
                }
                else {
                    this.selectedLightTheme = index;
                }
                this.applyTheme();
                this.renderThemes(); // Re-render to show active state
            }
        });
        // Font items - using event delegation for consistency
        const fontsList = this.shadowRoot?.querySelector(".fonts-list");
        fontsList?.addEventListener("click", (e) => {
            const target = e.target;
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
                const fontType = target.dataset.type;
                if (fontType === "heading") {
                    this.selectedHeadingFont = fontName;
                }
                else {
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
                const index = parseInt(fontItem.dataset.index || "0");
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
                const mode = e.currentTarget.dataset.mode;
                this.isDarkMode = mode === "dark";
                this.applyTheme();
                this.updateModeButtons();
                this.renderThemes();
            });
        });
        // Column collapse buttons
        this.shadowRoot?.querySelectorAll(".collapse-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const columnType = e.currentTarget.dataset.columnType;
                this.toggleColumn(columnType);
            });
        });
        this.attachFilterListeners();
        this.attachFontFilterListeners();
        // Keyboard navigation
        document.addEventListener("keydown", (e) => {
            if (!this.isOpen)
                return;
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                this.handleArrowKey(e.key === "ArrowDown");
            }
            // Star/Heart keyboard shortcuts
            if (e.key.toLowerCase() === "s" || e.key.toLowerCase() === "h") {
                e.preventDefault();
                this.handleFavoriteShortcut(e.key.toLowerCase());
            }
        });
        // Mouse wheel navigation
        const themesContent = this.shadowRoot?.querySelector('[data-column="themes"] .column-content');
        const fontsContent = this.shadowRoot?.querySelector('[data-column="fonts"] .column-content');
        themesContent?.addEventListener("wheel", (e) => {
            e.preventDefault();
            const delta = e.deltaY;
            if (Math.abs(delta) > 10) {
                this.focusedColumn = "themes";
                this.handleArrowKey(delta > 0);
            }
        });
        fontsContent?.addEventListener("wheel", (e) => {
            e.preventDefault();
            const delta = e.deltaY;
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
                const instructionsDiv = e.target.closest(".instructions");
                if (instructionsDiv) {
                    instructionsDiv.classList.add("hidden");
                }
            });
        });
        // Favorite icons (star and heart)
        this.shadowRoot?.addEventListener("click", (e) => {
            const target = e.target;
            if (target.classList.contains("favorite-icon")) {
                e.stopPropagation();
                const type = target.dataset.type;
                const index = parseInt(target.dataset.index || "0");
                const isStar = target.classList.contains("star");
                if (type === "theme") {
                    if (isStar) {
                        // Stars are independent per mode (light/dark)
                        const starredSet = this.isDarkMode ? this.starredDarkThemes : this.starredLightThemes;
                        if (starredSet.has(index)) {
                            starredSet.delete(index);
                            target.classList.remove("starred");
                        }
                        else {
                            starredSet.add(index);
                            target.classList.add("starred");
                        }
                    }
                    else {
                        // Hearts: only one favorite per mode (light/dark)
                        const currentFavorite = this.isDarkMode ? this.lovedDarkTheme : this.lovedLightTheme;
                        if (currentFavorite === index) {
                            // Deselect current favorite
                            if (this.isDarkMode) {
                                this.lovedDarkTheme = null;
                            }
                            else {
                                this.lovedLightTheme = null;
                            }
                            target.classList.remove("loved");
                        }
                        else {
                            // Remove previous favorite's heart
                            if (currentFavorite !== null) {
                                const prevHeart = this.shadowRoot?.querySelector(`.heart[data-type="theme"][data-index="${currentFavorite}"]`);
                                prevHeart?.classList.remove("loved");
                            }
                            // Set new favorite
                            if (this.isDarkMode) {
                                this.lovedDarkTheme = index;
                            }
                            else {
                                this.lovedLightTheme = index;
                            }
                            target.classList.add("loved");
                        }
                    }
                }
                else if (type === "font") {
                    if (isStar) {
                        // Stars can have multiple selected
                        if (this.starredFonts.has(index)) {
                            this.starredFonts.delete(index);
                            target.classList.remove("starred");
                        }
                        else {
                            this.starredFonts.add(index);
                            target.classList.add("starred");
                        }
                    }
                    else {
                        // Hearts: only one favorite font
                        if (this.lovedFont === index) {
                            // Deselect current favorite
                            this.lovedFont = null;
                            target.classList.remove("loved");
                        }
                        else {
                            // Remove previous favorite's heart
                            if (this.lovedFont !== null) {
                                const prevHeart = this.shadowRoot?.querySelector(`.heart[data-type="font"][data-index="${this.lovedFont}"]`);
                                prevHeart?.classList.remove("loved");
                            }
                            // Set new favorite
                            this.lovedFont = index;
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
            const target = e.target;
            if (target.classList.contains("activate-icon")) {
                e.stopPropagation();
                const type = target.dataset.type;
                const index = parseInt(target.dataset.index || "0");
                this.handleActivate(type, index);
            }
        });
        // Activation modal event listeners
        const activationModal = this.shadowRoot?.querySelector(".activation-modal");
        const activationModalClose = this.shadowRoot?.querySelector(".activation-modal-close");
        const activationCancelBtn = this.shadowRoot?.querySelector(".activation-cancel-btn");
        const activationCopyBtn = this.shadowRoot?.querySelector(".activation-copy-btn");
        const activationSaveBtn = this.shadowRoot?.querySelector(".activation-save-btn");
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
    handleArrowKey(isDown) {
        if (this.focusedColumn === "themes") {
            if (this.isDarkMode) {
                this.selectedDarkTheme = isDown
                    ? Math.min(this.selectedDarkTheme + 1, colorThemes.length - 1)
                    : Math.max(this.selectedDarkTheme - 1, 0);
            }
            else {
                this.selectedLightTheme = isDown
                    ? Math.min(this.selectedLightTheme + 1, colorThemes.length - 1)
                    : Math.max(this.selectedLightTheme - 1, 0);
            }
            this.activeThemeIndex = this.isDarkMode ? this.selectedDarkTheme : this.selectedLightTheme;
            this.applyTheme();
            this.renderThemes(); // Re-render to show active state
            this.scrollToSelected(".theme-item");
        }
        else {
            this.selectedFontPairing = isDown
                ? Math.min(this.selectedFontPairing + 1, fontPairings.length - 1)
                : Math.max(this.selectedFontPairing - 1, 0);
            this.activeFontIndex = this.selectedFontPairing;
            this.applyFonts();
            this.renderFonts(); // Re-render to show active state
            this.scrollToSelected(".font-item");
        }
    }
    handleFavoriteShortcut(key) {
        if (this.focusedColumn === "themes" && this.activeThemeIndex !== null) {
            const index = this.activeThemeIndex;
            if (key === "s") {
                // Toggle star
                const starredSet = this.isDarkMode ? this.starredDarkThemes : this.starredLightThemes;
                if (starredSet.has(index)) {
                    starredSet.delete(index);
                }
                else {
                    starredSet.add(index);
                }
                this.saveToLocalStorage();
                this.renderThemes();
            }
            else if (key === "h") {
                // Toggle heart
                const currentLoved = this.isDarkMode ? this.lovedDarkTheme : this.lovedLightTheme;
                if (currentLoved === index) {
                    if (this.isDarkMode) {
                        this.lovedDarkTheme = null;
                    }
                    else {
                        this.lovedLightTheme = null;
                    }
                }
                else {
                    if (this.isDarkMode) {
                        this.lovedDarkTheme = index;
                    }
                    else {
                        this.lovedLightTheme = index;
                    }
                }
                this.saveToLocalStorage();
                this.renderThemes();
            }
        }
        else if (this.focusedColumn === "fonts" && this.activeFontIndex !== null) {
            const index = this.activeFontIndex;
            if (key === "s") {
                // Toggle star
                if (this.starredFonts.has(index)) {
                    this.starredFonts.delete(index);
                }
                else {
                    this.starredFonts.add(index);
                }
                this.saveToLocalStorage();
                this.renderFonts();
            }
            else if (key === "h") {
                // Toggle heart
                if (this.lovedFont === index) {
                    this.lovedFont = null;
                }
                else {
                    this.lovedFont = index;
                }
                this.saveToLocalStorage();
                this.renderFonts();
            }
        }
    }
    scrollToSelected(selector) {
        const column = this.focusedColumn === "themes" ? this.themesColumn : this.fontsColumn;
        const content = column.querySelector(".column-content");
        const items = column.querySelectorAll(selector);
        const selectedIndex = this.focusedColumn === "themes"
            ? this.isDarkMode
                ? this.selectedDarkTheme
                : this.selectedLightTheme
            : this.selectedFontPairing;
        const selectedItem = items[selectedIndex];
        if (selectedItem && content) {
            selectedItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }
    updateThemeSelection() {
        this.shadowRoot?.querySelectorAll(".theme-item").forEach((item, index) => {
            const selectedIndex = this.isDarkMode
                ? this.selectedDarkTheme
                : this.selectedLightTheme;
            if (index === selectedIndex) {
                item.classList.add("selected");
            }
            else {
                item.classList.remove("selected");
            }
        });
    }
    updateFontSelection() {
        // Update font pairing card selection (only if no individual fonts selected)
        const hasIndividualSelection = this.selectedHeadingFont !== null || this.selectedBodyFont !== null;
        this.shadowRoot?.querySelectorAll(".font-item").forEach((item, index) => {
            if (!hasIndividualSelection && index === this.selectedFontPairing) {
                item.classList.add("selected");
            }
            else {
                item.classList.remove("selected");
            }
        });
        // Update individual font selections
        this.shadowRoot?.querySelectorAll(".individual-font").forEach((element) => {
            const fontName = element.dataset.font;
            const fontType = element.dataset.type;
            if (fontType === "heading" && fontName === this.selectedHeadingFont) {
                element.classList.add("selected");
            }
            else if (fontType === "body" && fontName === this.selectedBodyFont) {
                element.classList.add("selected");
            }
            else {
                element.classList.remove("selected");
            }
        });
    }
    updateModeButtons() {
        this.shadowRoot?.querySelectorAll(".mode-btn").forEach((btn) => {
            const mode = btn.dataset.mode;
            if ((mode === "dark" && this.isDarkMode) ||
                (mode === "light" && !this.isDarkMode)) {
                btn.classList.add("active");
            }
            else {
                btn.classList.remove("active");
            }
        });
    }
    toggleDrawer() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.drawerElement.classList.add("open");
            this.drawerToggle.classList.add("hidden");
            this.backdrop.classList.add("visible");
        }
        else {
            this.drawerElement.classList.remove("open");
            this.drawerToggle.classList.remove("hidden");
            this.backdrop.classList.remove("visible");
        }
    }
    toggleColumn(columnType) {
        if (columnType === "themes") {
            this.themesColumnCollapsed = !this.themesColumnCollapsed;
            localStorage.setItem("themesColumnCollapsed", JSON.stringify(this.themesColumnCollapsed));
        }
        else {
            this.fontsColumnCollapsed = !this.fontsColumnCollapsed;
            localStorage.setItem("fontsColumnCollapsed", JSON.stringify(this.fontsColumnCollapsed));
        }
        this.render();
        this.attachEventListeners();
    }
    handleActivate(type, index) {
        const modal = this.shadowRoot?.querySelector(".activation-modal");
        const instructions = this.shadowRoot?.querySelector(".activation-instructions");
        const filename = this.shadowRoot?.querySelector(".activation-code-filename");
        const code = this.shadowRoot?.querySelector(".activation-code");
        const saveBtn = this.shadowRoot?.querySelector(".activation-save-btn");
        if (!modal || !instructions || !filename || !code || !saveBtn)
            return;
        let generatedCode = "";
        let targetFilename = "";
        let instructionText = "";
        if (type === "theme") {
            // Generate Tailwind config for colors
            const theme = colorThemes[index];
            const colors = this.isDarkMode ? theme.dark : theme.light;
            generatedCode = this.generateTailwindColorConfig(colors);
            targetFilename = "tailwind.config.js (or .ts, .mjs)";
            instructionText = `Add these color definitions to your Tailwind config file. If you don't have a tailwind.config.js file in your project root, please create one first. Click "Save to File" to select your config file, or copy the code and paste it manually.`;
        }
        else {
            // Generate CSS for fonts
            const pairing = fontPairings[index];
            const headingFont = this.selectedHeadingFont || pairing.heading;
            const bodyFont = this.selectedBodyFont || pairing.body;
            generatedCode = this.generateFontCSS(headingFont, bodyFont);
            targetFilename = "src/styles/fonts.css (or your preferred location)";
            instructionText = `Add these font definitions to a CSS file in your project. We recommend creating a file like src/styles/fonts.css. Make sure to import this file in your main layout or global styles. Click "Save to File" to save, or copy the code and paste it manually.`;
        }
        instructions.textContent = instructionText;
        filename.textContent = targetFilename;
        code.textContent = generatedCode;
        // Store the generated code and filename for the save function
        saveBtn._generatedCode = generatedCode;
        saveBtn._targetFilename = targetFilename;
        modal.classList.remove("hidden");
    }
    generateTailwindColorConfig(colors) {
        return `// Add this to your tailwind.config.js (or .ts, .mjs) file
// In the theme.extend.colors section

export default {
  theme: {
    extend: {
      colors: {
        primary: '${colors.primary}',
        'primary-shadow': '${colors.primaryShadow}',
        accent: '${colors.accent}',
        'accent-shadow': '${colors.accentShadow}',
        bg: '${colors.background}',
        'card-bg': '${colors.cardBackground}',
        text: '${colors.text}',
        extra: '${colors.extra}',
      },
    },
  },
};`;
    }
    generateFontCSS(headingFont, bodyFont) {
        return `/* Add this to your CSS file (e.g., src/styles/fonts.css) */
/* Then import it in your main layout or global styles */

:root {
  --font-heading: '${headingFont}', sans-serif;
  --font-body: '${bodyFont}', sans-serif;
}

/* Optional: Apply directly to elements */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

body, p, span {
  font-family: var(--font-body);
}

/* For Tailwind users: Add this to tailwind.config.js */
/*
export default {
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
};
*/`;
    }
    async handleSaveToFile() {
        const saveBtn = this.shadowRoot?.querySelector(".activation-save-btn");
        if (!saveBtn || !saveBtn._generatedCode)
            return;
        const generatedCode = saveBtn._generatedCode;
        const targetFilename = saveBtn._targetFilename;
        // Check if File System Access API is supported
        if ('showSaveFilePicker' in window) {
            try {
                const suggestedName = targetFilename.includes("tailwind")
                    ? "tailwind.config.js"
                    : "fonts.css";
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: suggestedName,
                    types: [
                        {
                            description: 'Code Files',
                            accept: targetFilename.includes("tailwind")
                                ? { 'text/javascript': ['.js', '.ts', '.mjs'] }
                                : { 'text/css': ['.css'] }
                        },
                    ],
                });
                const writable = await fileHandle.createWritable();
                await writable.write(generatedCode);
                await writable.close();
                // Show success message
                saveBtn.textContent = "Saved!";
                saveBtn.style.background = "#4CAF50";
                setTimeout(() => {
                    saveBtn.textContent = "Save to File";
                    saveBtn.style.background = "";
                }, 2000);
            }
            catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error saving file:', err);
                    alert('Error saving file. Please copy the code manually.');
                }
            }
        }
        else {
            alert('File System Access API is not supported in your browser. Please copy the code manually and paste it into your file.');
        }
    }
    applyTheme() {
        const themeIndex = this.isDarkMode
            ? this.selectedDarkTheme
            : this.selectedLightTheme;
        const theme = colorThemes[themeIndex];
        const colors = this.isDarkMode ? theme.dark : theme.light;
        // Set color-scheme on document root for proper light/dark mode
        document.documentElement.style.colorScheme = this.isDarkMode ? "dark" : "light";
        // Apply CSS variables to document root
        document.documentElement.style.setProperty("--color-primary", colors.primary);
        document.documentElement.style.setProperty("--color-primary-shadow", colors.primaryShadow);
        document.documentElement.style.setProperty("--color-accent", colors.accent);
        document.documentElement.style.setProperty("--color-accent-shadow", colors.accentShadow);
        document.documentElement.style.setProperty("--color-bg", colors.background);
        document.documentElement.style.setProperty("--color-card-bg", colors.cardBackground);
        document.documentElement.style.setProperty("--color-text", colors.text);
        document.documentElement.style.setProperty("--color-extra", colors.extra);
        // Also explicitly set background and foreground colors
        document.documentElement.style.setProperty("--background-color", colors.background);
        document.documentElement.style.setProperty("--foreground-color", colors.text);
        // Apply heading colors
        const getColor = (colorKey) => {
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
        document.documentElement.style.setProperty("--color-h1", getColor(colors.h1Color));
        document.documentElement.style.setProperty("--color-h2", getColor(colors.h2Color));
        document.documentElement.style.setProperty("--color-h3", getColor(colors.h3Color));
        this.saveToLocalStorage();
    }
    applyFonts() {
        // Determine which fonts to use: individual selections or pairing
        let headingFont;
        let bodyFont;
        if (this.selectedHeadingFont || this.selectedBodyFont) {
            // Use individual selections (with defaults if one isn't selected)
            if (this.selectedHeadingFont && this.selectedBodyFont) {
                headingFont = this.selectedHeadingFont;
                bodyFont = this.selectedBodyFont;
            }
            else if (this.selectedHeadingFont) {
                // Only heading selected, use default for body
                headingFont = this.selectedHeadingFont;
                bodyFont = fontPairings[0].body; // Default body font
            }
            else {
                // Only body selected, use default for heading
                headingFont = fontPairings[0].heading; // Default heading font
                bodyFont = this.selectedBodyFont;
            }
        }
        else {
            // Use pairing
            const pairingIndex = this.selectedFontPairing >= 0 ? this.selectedFontPairing : 0;
            const pairing = fontPairings[pairingIndex];
            headingFont = pairing.heading;
            bodyFont = pairing.body;
        }
        // Determine appropriate fallback based on font characteristics
        const getHeadingFallback = (fontName) => {
            const serifFonts = [
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
            return serifFonts.includes(fontName)
                ? `"${fontName}", Georgia, "Times New Roman", serif`
                : `"${fontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`;
        };
        const getBodyFallback = (fontName) => {
            const serifFonts = [
                "Lora",
                "Merriweather",
                "Libre Baskerville",
                "Source Sans Pro",
            ];
            const monoFonts = ["Space Mono"];
            if (monoFonts.includes(fontName)) {
                return `"${fontName}", "Courier New", Courier, monospace`;
            }
            return serifFonts.includes(fontName)
                ? `"${fontName}", Georgia, "Times New Roman", serif`
                : `"${fontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`;
        };
        document.documentElement.style.setProperty("--font-heading", getHeadingFallback(headingFont));
        document.documentElement.style.setProperty("--font-body", getBodyFallback(bodyFont));
        this.saveToLocalStorage();
    }
}
// Register the custom element
if (typeof window !== "undefined" &&
    !customElements.get("theme-forseen")) {
    customElements.define("theme-forseen", ThemeForseen);
}
//# sourceMappingURL=ThemeForseen.js.map