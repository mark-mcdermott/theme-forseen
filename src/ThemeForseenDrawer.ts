import { colorThemes, fontPairings, type ColorTheme, type FontPairing } from './themes';

export class ThemeForseenDrawer extends HTMLElement {
  private isOpen = false;
  private selectedLightTheme = 0;
  private selectedDarkTheme = 0;
  private selectedFontPairing = 0;
  private isDarkMode = false;
  private focusedColumn: 'themes' | 'fonts' = 'themes';

  private drawerElement!: HTMLElement;
  private themesColumn!: HTMLElement;
  private fontsColumn!: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
    this.checkDarkMode();
    this.applyTheme();
    this.applyFonts();
  }

  private checkDarkMode() {
    // Check for system dark mode preference
    this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Watch for changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.isDarkMode = e.matches;
      this.applyTheme();
    });
  }

  private render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
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
          width: 40px;
          height: 80px;
          background: #333;
          color: white;
          border: none;
          border-radius: 0 8px 8px 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transition: all 0.3s ease;
          z-index: 999998;
        }

        .drawer-toggle:hover {
          background: #555;
          width: 45px;
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

        .drawer-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: light-dark(#333, #e0e0e0);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
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
          margin: 5px 0;
          border: 2px solid light-dark(#ddd, #444);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: light-dark(white, #2a2a2a);
        }

        .theme-item:hover, .font-item:hover {
          border-color: light-dark(#666, #888);
          transform: translateX(2px);
        }

        .theme-item.selected, .font-item.selected {
          border-color: light-dark(#333, #aaa);
          background: light-dark(#f9f9f9, #333);
          font-weight: 600;
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
          background: light-dark(#fff3cd, #3a3418);
          border: 1px solid light-dark(#ffc107, #665500);
          border-radius: 6px;
          font-size: 11px;
          color: light-dark(#856404, #ffdb99);
          margin-bottom: 10px;
        }
      </style>

      <button class="drawer-toggle" title="Open Theme Drawer">
        🎨
      </button>

      <div class="drawer">
        <div class="drawer-header">
          <h2>ThemeForseen</h2>
          <button class="close-btn" title="Close">&times;</button>
        </div>

        <div class="drawer-content">
          <!-- Themes Column -->
          <div class="column" data-column="themes">
            <div class="column-header">Color Themes</div>
            <div class="column-content">
              <div class="instructions">
                Use ↑/↓ arrow keys or mouse wheel to browse themes. Themes apply in real-time!
              </div>
              <div class="mode-toggle">
                <button class="mode-btn" data-mode="light">Light Mode</button>
                <button class="mode-btn active" data-mode="dark">Dark Mode</button>
              </div>
              <div class="themes-list"></div>
            </div>
          </div>

          <!-- Fonts Column -->
          <div class="column" data-column="fonts">
            <div class="column-header">Font Pairings</div>
            <div class="column-content">
              <div class="instructions">
                Use ↑/↓ arrow keys or mouse wheel to browse fonts. Changes apply instantly!
              </div>
              <div class="fonts-list"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.drawerElement = this.shadowRoot.querySelector('.drawer')!;
    this.themesColumn = this.shadowRoot.querySelector('[data-column="themes"]')!;
    this.fontsColumn = this.shadowRoot.querySelector('[data-column="fonts"]')!;

    this.renderThemes();
    this.renderFonts();
  }

  private renderThemes() {
    const themesList = this.shadowRoot?.querySelector('.themes-list');
    if (!themesList) return;

    themesList.innerHTML = colorThemes
      .map((theme, index) => {
        const colors = this.isDarkMode ? theme.dark : theme.light;
        return `
        <div class="theme-item" data-index="${index}">
          <div class="theme-name">${theme.name}</div>
          <div class="theme-colors">
            <div class="color-swatch" style="background-color: ${colors.primary}"></div>
            <div class="color-swatch" style="background-color: ${colors.accent}"></div>
            <div class="color-swatch" style="background-color: ${colors.background}"></div>
            <div class="color-swatch" style="background-color: ${colors.cardBackground}"></div>
            <div class="color-swatch" style="background-color: ${colors.text}"></div>
          </div>
        </div>
      `;
      })
      .join('');

    this.updateThemeSelection();
  }

  private renderFonts() {
    const fontsList = this.shadowRoot?.querySelector('.fonts-list');
    if (!fontsList) return;

    fontsList.innerHTML = fontPairings
      .map(
        (pairing, index) => `
        <div class="font-item" data-index="${index}">
          <div class="font-name">${pairing.name}</div>
          <div class="font-preview">
            Heading: ${pairing.heading}<br>
            Body: ${pairing.body}
          </div>
        </div>
      `
      )
      .join('');

    this.updateFontSelection();
  }

  private attachEventListeners() {
    const toggle = this.shadowRoot?.querySelector('.drawer-toggle');
    const closeBtn = this.shadowRoot?.querySelector('.close-btn');

    toggle?.addEventListener('click', () => this.toggleDrawer());
    closeBtn?.addEventListener('click', () => this.toggleDrawer());

    // Theme items - using event delegation to survive re-renders
    const themesList = this.shadowRoot?.querySelector('.themes-list');
    themesList?.addEventListener('click', (e) => {
      const themeItem = (e.target as HTMLElement).closest('.theme-item');
      if (themeItem) {
        const index = parseInt((themeItem as HTMLElement).dataset.index || '0');
        if (this.isDarkMode) {
          this.selectedDarkTheme = index;
        } else {
          this.selectedLightTheme = index;
        }
        this.applyTheme();
        this.updateThemeSelection();
      }
    });

    // Font items - using event delegation for consistency
    const fontsList = this.shadowRoot?.querySelector('.fonts-list');
    fontsList?.addEventListener('click', (e) => {
      const fontItem = (e.target as HTMLElement).closest('.font-item');
      if (fontItem) {
        const index = parseInt((fontItem as HTMLElement).dataset.index || '0');
        this.selectedFontPairing = index;
        this.applyFonts();
        this.updateFontSelection();
      }
    });

    // Mode toggle
    this.shadowRoot?.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLElement).dataset.mode;
        this.isDarkMode = mode === 'dark';
        this.applyTheme();
        this.updateModeButtons();
        this.renderThemes();
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.handleArrowKey(e.key === 'ArrowDown');
      }
    });

    // Mouse wheel navigation
    const themesContent = this.shadowRoot?.querySelector('[data-column="themes"] .column-content');
    const fontsContent = this.shadowRoot?.querySelector('[data-column="fonts"] .column-content');

    themesContent?.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = (e as WheelEvent).deltaY;
      if (Math.abs(delta) > 10) {
        this.focusedColumn = 'themes';
        this.handleArrowKey(delta > 0);
      }
    });

    fontsContent?.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = (e as WheelEvent).deltaY;
      if (Math.abs(delta) > 10) {
        this.focusedColumn = 'fonts';
        this.handleArrowKey(delta > 0);
      }
    });

    // Focus tracking
    themesContent?.addEventListener('mouseenter', () => {
      this.focusedColumn = 'themes';
    });

    fontsContent?.addEventListener('mouseenter', () => {
      this.focusedColumn = 'fonts';
    });
  }

  private handleArrowKey(isDown: boolean) {
    if (this.focusedColumn === 'themes') {
      if (this.isDarkMode) {
        this.selectedDarkTheme = isDown
          ? Math.min(this.selectedDarkTheme + 1, colorThemes.length - 1)
          : Math.max(this.selectedDarkTheme - 1, 0);
      } else {
        this.selectedLightTheme = isDown
          ? Math.min(this.selectedLightTheme + 1, colorThemes.length - 1)
          : Math.max(this.selectedLightTheme - 1, 0);
      }
      this.applyTheme();
      this.updateThemeSelection();
      this.scrollToSelected('.theme-item');
    } else {
      this.selectedFontPairing = isDown
        ? Math.min(this.selectedFontPairing + 1, fontPairings.length - 1)
        : Math.max(this.selectedFontPairing - 1, 0);
      this.applyFonts();
      this.updateFontSelection();
      this.scrollToSelected('.font-item');
    }
  }

  private scrollToSelected(selector: string) {
    const column =
      this.focusedColumn === 'themes' ? this.themesColumn : this.fontsColumn;
    const content = column.querySelector('.column-content');
    const items = column.querySelectorAll(selector);
    const selectedIndex =
      this.focusedColumn === 'themes'
        ? this.isDarkMode
          ? this.selectedDarkTheme
          : this.selectedLightTheme
        : this.selectedFontPairing;

    const selectedItem = items[selectedIndex] as HTMLElement;
    if (selectedItem && content) {
      selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  private updateThemeSelection() {
    this.shadowRoot?.querySelectorAll('.theme-item').forEach((item, index) => {
      const selectedIndex = this.isDarkMode
        ? this.selectedDarkTheme
        : this.selectedLightTheme;
      if (index === selectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  private updateFontSelection() {
    this.shadowRoot?.querySelectorAll('.font-item').forEach((item, index) => {
      if (index === this.selectedFontPairing) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  private updateModeButtons() {
    this.shadowRoot?.querySelectorAll('.mode-btn').forEach((btn) => {
      const mode = (btn as HTMLElement).dataset.mode;
      if ((mode === 'dark' && this.isDarkMode) || (mode === 'light' && !this.isDarkMode)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  private toggleDrawer() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.drawerElement.classList.add('open');
    } else {
      this.drawerElement.classList.remove('open');
    }
  }

  private applyTheme() {
    const themeIndex = this.isDarkMode ? this.selectedDarkTheme : this.selectedLightTheme;
    const theme = colorThemes[themeIndex];
    const colors = this.isDarkMode ? theme.dark : theme.light;

    // Apply CSS variables to document root
    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-primary-shadow', colors.primaryShadow);
    document.documentElement.style.setProperty('--color-accent', colors.accent);
    document.documentElement.style.setProperty('--color-accent-shadow', colors.accentShadow);
    document.documentElement.style.setProperty('--color-bg', colors.background);
    document.documentElement.style.setProperty('--color-card-bg', colors.cardBackground);
    document.documentElement.style.setProperty('--color-text', colors.text);
    document.documentElement.style.setProperty('--color-extra', colors.extra);

    // Apply heading colors
    const getColor = (colorKey: string) => {
      switch (colorKey) {
        case 'primary':
          return colors.primary;
        case 'accent':
          return colors.accent;
        case 'text':
          return colors.text;
        default:
          return colors.text;
      }
    };

    document.documentElement.style.setProperty('--color-h1', getColor(colors.h1Color));
    document.documentElement.style.setProperty('--color-h2', getColor(colors.h2Color));
    document.documentElement.style.setProperty('--color-h3', getColor(colors.h3Color));
  }

  private applyFonts() {
    const pairing = fontPairings[this.selectedFontPairing];

    // Determine appropriate fallback based on font characteristics
    const getHeadingFallback = (fontName: string): string => {
      const serifFonts = ['Playfair Display', 'Merriweather', 'Lora', 'DM Serif Display',
                          'Crimson Text', 'Abril Fatface', 'Libre Baskerville',
                          'Cormorant Garamond', 'Spectral', 'Yeseva One', 'Arvo',
                          'Vollkorn', 'Bitter', 'Cardo'];
      return serifFonts.includes(fontName)
        ? `"${fontName}", Georgia, "Times New Roman", serif`
        : `"${fontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`;
    };

    const getBodyFallback = (fontName: string): string => {
      const serifFonts = ['Lora', 'Merriweather', 'Libre Baskerville', 'Source Sans Pro'];
      const monoFonts = ['Space Mono'];

      if (monoFonts.includes(fontName)) {
        return `"${fontName}", "Courier New", Courier, monospace`;
      }
      return serifFonts.includes(fontName)
        ? `"${fontName}", Georgia, "Times New Roman", serif`
        : `"${fontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`;
    };

    document.documentElement.style.setProperty('--font-heading', getHeadingFallback(pairing.heading));
    document.documentElement.style.setProperty('--font-body', getBodyFallback(pairing.body));
  }
}

// Register the custom element
if (typeof window !== 'undefined' && !customElements.get('theme-forseen-drawer')) {
  customElements.define('theme-forseen-drawer', ThemeForseenDrawer);
}
