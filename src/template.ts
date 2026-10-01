import { styles } from "./styles.js";
import { adaptiveCloud, filledCloud, icons, wordmarkSvg } from "./marks.js";

export interface TemplateState {
  themesColumnCollapsed: boolean;
  fontsColumnCollapsed: boolean;
  isDarkMode: boolean;
  searchText: string;
  fontSearchText: string;
  selectedTags: Set<string>;
  selectedHeadingStyles: Set<string>;
  selectedBodyStyles: Set<string>;
  showHeartedOnly: boolean;
  showStarredOnly: boolean;
  tags: string[];
}

const FONT_STYLES = ["sans", "serif", "display", "mono"] as const;

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function pill(attributes: string, pressed: boolean, label: string): string {
  return `<button class="pill" ${attributes} aria-pressed="${pressed}">${label}</button>`;
}

function checkOption(attribute: string, id: string, checked: boolean, label: string): string {
  return `
    <div class="filter-option" ${attribute}>
      <input type="checkbox" id="${id}" ${checked ? "checked" : ""}>
      <label for="${id}">${label}</label>
    </div>`;
}

function themesColumn(state: TemplateState): string {
  const favorites = state.showStarredOnly ? "starred" : state.showHeartedOnly ? "hearted" : "all";
  const tagLabel = state.selectedTags.size > 0 ? `${state.selectedTags.size} tag${state.selectedTags.size > 1 ? "s" : ""}` : "All tags";

  return `
    <section class="column ${state.themesColumnCollapsed ? "collapsed" : ""}" data-column="themes" aria-label="Color themes">
      <div class="column-content">
        <div class="column-controls">
          <div class="instructions" data-instructions="themes">
            Browse with ↑ ↓ or the wheel. Themes apply as you go.
            <button class="instructions-close" aria-label="Dismiss">${icons.close}</button>
          </div>
          <div class="filter-container">
            <label class="search">
              ${icons.search}
              <input type="search" class="filter-input" placeholder="Search themes…" aria-label="Search themes" value="${escapeAttribute(state.searchText)}" />
            </label>
            <div class="pills" role="group" aria-label="Show">
              ${pill('data-favorites="all"', favorites === "all", "All")}
              ${pill('data-favorites="starred"', favorites === "starred", `${icons.star} Starred`)}
              ${pill('data-favorites="hearted"', favorites === "hearted", `${icons.heart} Liked`)}
            </div>
            <div class="menu">
              <button class="menu-btn filter-dropdown-btn" aria-haspopup="true" aria-expanded="false">
                <span class="menu-label">${tagLabel}</span>${icons.chevron}
              </button>
              <div class="dropdown filter-dropdown hidden">
                <input type="search" class="dropdown-search" placeholder="Find a tag…" aria-label="Find a tag" />
                ${state.tags.map((tag) => checkOption(`data-tag="${tag}"`, `tag-${tag}`, state.selectedTags.has(tag), capitalize(tag))).join("")}
              </div>
            </div>
            <div class="filter-tags">
              ${Array.from(state.selectedTags)
                .map(
                  (tag) => `
                <span class="filter-tag" data-tag="${tag}">
                  ${tag}
                  <button class="filter-tag-remove" data-tag="${tag}" aria-label="Remove ${tag}">${icons.close}</button>
                </span>`
                )
                .join("")}
            </div>
          </div>
        </div>
        <div class="themes-list"></div>
      </div>
    </section>`;
}

function fontsColumn(state: TemplateState): string {
  const heading = state.selectedHeadingStyles.size > 0 ? Array.from(state.selectedHeadingStyles)[0] : "all";
  const bodyLabel =
    state.selectedBodyStyles.size > 0
      ? Array.from(state.selectedBodyStyles).map(capitalize).join(", ")
      : "Any body";

  return `
    <section class="column ${state.fontsColumnCollapsed ? "collapsed" : ""}" data-column="fonts" aria-label="Font pairings">
      <div class="column-content">
        <div class="column-controls">
          <div class="instructions" data-instructions="fonts">
            Browse with ↑ ↓ or the wheel. Pairings apply as you go.
            <button class="instructions-close" aria-label="Dismiss">${icons.close}</button>
          </div>
          <div class="font-filters">
            <label class="search">
              ${icons.search}
              <input type="search" class="font-filter-input" placeholder="Search fonts…" aria-label="Search fonts" value="${escapeAttribute(state.fontSearchText)}" />
            </label>
            <div class="pills" role="group" aria-label="Heading style">
              ${pill('data-style="all"', heading === "all", "All")}
              ${FONT_STYLES.map((style) => pill(`data-style="${style}"`, heading === style, capitalize(style))).join("")}
            </div>
            <div class="menu">
              <button class="menu-btn font-filter-dropdown-btn" data-filter-type="body" aria-haspopup="true" aria-expanded="false">
                <span class="menu-label">${bodyLabel}</span>${icons.chevron}
              </button>
              <div class="dropdown font-filter-dropdown hidden" data-filter-type="body">
                ${FONT_STYLES.map((style) => checkOption(`data-style="${style}"`, `body-${style}`, state.selectedBodyStyles.has(style), capitalize(style))).join("")}
              </div>
            </div>
          </div>
        </div>
        <div class="fonts-list"></div>
      </div>
    </section>`;
}

export function getTemplate(state: TemplateState): string {
  return `
    <style>${styles}</style>

    <div class="backdrop"></div>

    <button class="drawer-toggle" title="Open ThemeForseen" aria-label="Open ThemeForseen">
      ${filledCloud("toggle-icon")}
      <span class="toggle-text">Themes</span>
    </button>

    <div class="drawer" data-mode="${state.isDarkMode ? "dark" : "light"}" role="dialog" aria-label="ThemeForseen">
      <header class="drawer-header">
        <div class="drawer-header-content">
          ${adaptiveCloud("drawer-header-logo")}
          ${wordmarkSvg("drawer-header-wordmark")}
        </div>
        <button class="close-btn" aria-label="Close">${icons.close}</button>
      </header>

      <div class="drawer-controls">
        <div class="column-tabs" role="group" aria-label="Columns">
          <button class="column-tab" data-column-type="themes" aria-pressed="${!state.themesColumnCollapsed}">
            ${icons.list}<span>Color Themes</span>
          </button>
          <button class="column-tab" data-column-type="fonts" aria-pressed="${!state.fontsColumnCollapsed}">
            ${icons.aa}<span>Font Pairings</span>
          </button>
        </div>
        <div class="mode-toggle" role="group" aria-label="Mode">
          ${icons.sun}
          <div class="mode-switch">
            <button class="mode-btn ${state.isDarkMode ? "" : "active"}" data-mode="light" aria-pressed="${!state.isDarkMode}">Light</button>
            <button class="mode-btn ${state.isDarkMode ? "active" : ""}" data-mode="dark" aria-pressed="${state.isDarkMode}">Dark</button>
          </div>
        </div>
      </div>

      <div class="drawer-content">
        ${themesColumn(state)}
        ${fontsColumn(state)}
      </div>

      <footer class="drawer-footer">
        <button class="preview-btn">${icons.eye}<span>Preview on This Site</span></button>
        <button class="apply-btn"><span>Apply to Project</span>${icons.arrow}</button>
      </footer>
    </div>

    <div class="activation-modal hidden" role="dialog" aria-label="Apply to your project">
      <div class="activation-modal-content">
        <div class="activation-modal-header">
          <h3>Apply to your project</h3>
          <button class="activation-modal-close" aria-label="Close">${icons.close}</button>
        </div>
        <div class="activation-modal-body">
          <p class="activation-instructions"></p>
          <div class="activation-sections"></div>
          <div class="activation-buttons">
            <button class="activation-cancel-btn">Done</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
