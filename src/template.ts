import { styles } from "./styles.js";
import { getAllThemeTags } from "./themes.js";

export interface TemplateState {
  themesColumnCollapsed: boolean;
  fontsColumnCollapsed: boolean;
  isDarkMode: boolean;
  searchText: string;
  selectedTags: Set<string>;
  selectedHeadingStyles: Set<string>;
  selectedBodyStyles: Set<string>;
}

const allTags = getAllThemeTags();

export function getTemplate(state: TemplateState): string {
  return `
    <style>${styles}</style>

    <div class="backdrop"></div>

    <button class="drawer-toggle" title="Open Theme Picker">
      <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor"/>
      </svg>
      <span class="toggle-text">Theme</span>
    </button>

    <div class="drawer">
      <div class="drawer-header">
        <div class="drawer-header-content ${
          state.themesColumnCollapsed || state.fontsColumnCollapsed
            ? "logo-hidden"
            : ""
        }">
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
        <div class="column ${
          state.themesColumnCollapsed ? "collapsed" : ""
        }" data-column="themes">
          <div class="column-header">
            <span class="column-title">${
              state.themesColumnCollapsed ? "Themes Color" : "Color Themes"
            }</span>
            <button class="collapse-btn" data-column-type="themes" title="${
              state.themesColumnCollapsed ? "Expand" : "Collapse"
            }">
              ${state.themesColumnCollapsed ? "«" : "»"}
            </button>
          </div>
          <div class="column-content">
            <div class="column-controls">
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
                    value="${state.searchText}"
                  />
                  <button class="filter-dropdown-btn" aria-label="Filter options">▼</button>
                  <div class="filter-dropdown hidden">
                    ${allTags.map(tag => `
                      <div class="filter-option" data-tag="${tag}">
                        <input type="checkbox" id="tag-${tag}" ${
                          state.selectedTags.has(tag) ? "checked" : ""
                        }>
                        <label for="tag-${tag}">${tag.charAt(0).toUpperCase() + tag.slice(1)}</label>
                      </div>
                    `).join("")}
                  </div>
                </div>
                <div class="filter-tags">
                  ${Array.from(state.selectedTags)
                    .map(
                      (tag) => `
                    <span class="filter-tag" data-tag="${tag}">
                      ${tag}
                      <button class="filter-tag-remove" data-tag="${tag}">&times;</button>
                    </span>
                  `
                    )
                    .join("")}
                </div>
              </div>
              <div class="mode-toggle">
                <button class="mode-btn ${
                  !state.isDarkMode ? "active" : ""
                }" data-mode="light">Light Mode</button>
                <button class="mode-btn ${
                  state.isDarkMode ? "active" : ""
                }" data-mode="dark">Dark Mode</button>
              </div>
            </div>
            <div class="themes-list"></div>
          </div>
        </div>

        <!-- Fonts Column -->
        <div class="column ${
          state.fontsColumnCollapsed ? "collapsed" : ""
        }" data-column="fonts">
          <div class="column-header">
            <span class="column-title">${
              state.fontsColumnCollapsed ? "Pairings Font" : "Font Pairings"
            }</span>
            <button class="collapse-btn" data-column-type="fonts" title="${
              state.fontsColumnCollapsed ? "Expand" : "Collapse"
            }">
              ${state.fontsColumnCollapsed ? "«" : "»"}
            </button>
          </div>
          <div class="column-content">
            <div class="column-controls">
              <div class="instructions" data-instructions="fonts">
                <button class="instructions-close" aria-label="Close">&times;</button>
                Use ↑/↓ arrow keys or mouse wheel to browse fonts. Changes apply instantly!
              </div>
              <div class="font-filters">
                <div class="font-filter-group">
                  <label class="font-filter-label">Heading</label>
                  <button class="font-filter-dropdown-btn" data-filter-type="heading">
                    ${
                      state.selectedHeadingStyles.size > 0
                        ? Array.from(state.selectedHeadingStyles).join(", ")
                        : "All styles"
                    } ▼
                  </button>
                  <div class="font-filter-dropdown hidden" data-filter-type="heading">
                    <div class="filter-option" data-style="sans">
                      <input type="checkbox" id="heading-sans" ${
                        state.selectedHeadingStyles.has("sans")
                          ? "checked"
                          : ""
                      }>
                      <label for="heading-sans">Sans</label>
                    </div>
                    <div class="filter-option" data-style="serif">
                      <input type="checkbox" id="heading-serif" ${
                        state.selectedHeadingStyles.has("serif")
                          ? "checked"
                          : ""
                      }>
                      <label for="heading-serif">Serif</label>
                    </div>
                    <div class="filter-option" data-style="display">
                      <input type="checkbox" id="heading-display" ${
                        state.selectedHeadingStyles.has("display")
                          ? "checked"
                          : ""
                      }>
                      <label for="heading-display">Display</label>
                    </div>
                    <div class="filter-option" data-style="mono">
                      <input type="checkbox" id="heading-mono" ${
                        state.selectedHeadingStyles.has("mono")
                          ? "checked"
                          : ""
                      }>
                      <label for="heading-mono">Mono</label>
                    </div>
                  </div>
                </div>
                <div class="font-filter-group">
                  <label class="font-filter-label">Body</label>
                  <button class="font-filter-dropdown-btn" data-filter-type="body">
                    ${
                      state.selectedBodyStyles.size > 0
                        ? Array.from(state.selectedBodyStyles).join(", ")
                        : "All styles"
                    } ▼
                  </button>
                  <div class="font-filter-dropdown hidden" data-filter-type="body">
                    <div class="filter-option" data-style="sans">
                      <input type="checkbox" id="body-sans" ${
                        state.selectedBodyStyles.has("sans") ? "checked" : ""
                      }>
                      <label for="body-sans">Sans</label>
                    </div>
                    <div class="filter-option" data-style="serif">
                      <input type="checkbox" id="body-serif" ${
                        state.selectedBodyStyles.has("serif") ? "checked" : ""
                      }>
                      <label for="body-serif">Serif</label>
                    </div>
                    <div class="filter-option" data-style="display">
                      <input type="checkbox" id="body-display" ${
                        state.selectedBodyStyles.has("display")
                          ? "checked"
                          : ""
                      }>
                      <label for="body-display">Display</label>
                    </div>
                    <div class="filter-option" data-style="mono">
                      <input type="checkbox" id="body-mono" ${
                        state.selectedBodyStyles.has("mono") ? "checked" : ""
                      }>
                      <label for="body-mono">Mono</label>
                    </div>
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
}
