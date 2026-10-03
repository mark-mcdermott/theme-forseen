/**
 * The drawer's look. Every colour, face and measure a host might want to
 * change is a custom property on the host element, so a site can skin the
 * drawer by setting them on <theme-forseen>; the defaults are its own.
 */
export const styles = `
  * {
    box-sizing: border-box;
  }

  :host {
    --tf-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --tf-width: 600px;
    --tf-radius: 10px;

    --tf-bg: #ede3d1;
    --tf-surface: #f7f0e3;
    --tf-surface-2: #e2d6bf;
    --tf-text: #15140f;
    --tf-muted: #6b6358;
    --tf-line: rgba(21, 20, 15, 0.16);
    --tf-key: #1d262a;
    --tf-on-key: #f3ead9;
    --tf-teal: #19606b;
    --tf-on-teal: #ffffff;
    --tf-orange: #f0562b;
    --tf-on-orange: #15140f;
    --tf-shadow: 0 12px 48px rgba(0, 0, 0, 0.35);

    --tf-cloud-1: #04394a;
    --tf-cloud-2: #057276;
    --tf-cloud-3: #fb4a1d;
    --tf-cloud-4: #e88a16;
    --tf-cloud-5: #92560e;

    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    height: 100dvh;
    z-index: 999999;
    font-family: var(--tf-font);
    color: var(--tf-text);
    -webkit-font-smoothing: antialiased;
  }

  /* On the host, so a page's own rule for the element wins over it in both modes */
  :host([mode="dark"]) {
    --tf-bg: #23201b;
    --tf-surface: #2f2a24;
    --tf-surface-2: #3b352d;
    --tf-text: #efe6d6;
    --tf-muted: #a89e8f;
    --tf-line: rgba(239, 230, 214, 0.14);
    --tf-key: #efe6d6;
    --tf-on-key: #1d262a;
    --tf-teal: #237d87;
    --tf-on-orange: #15140f;
  }

  /*
   * Docked: the host is a box the page lays out, and the drawer fills it.
   * There is no tab and no backdrop; the page provides the control. Closed,
   * the drawer slides out of the box to the right, as into a chassis.
   */
  :host([docked]) {
    position: relative;
    top: auto;
    right: auto;
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: auto;
  }

  :host([docked]) .drawer-toggle,
  :host([docked]) .backdrop {
    display: none !important;
  }

  :host([docked]) .drawer {
    position: absolute;
    inset: 0;
    width: auto;
    height: auto;
    border-radius: var(--tf-dock-radius, 0);
    box-shadow: none;
  }

  .hidden {
    display: none !important;
  }

  .icon {
    width: 1em;
    height: 1em;
    flex: none;
  }

  button {
    font: inherit;
    color: inherit;
    cursor: pointer;
  }

  /* The tab on the side of the page */
  .drawer-toggle {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 128px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 0;
    border: 0;
    border-radius: var(--tf-radius) 0 0 var(--tf-radius);
    background: var(--tf-key);
    color: var(--tf-on-key);
    box-shadow: -2px 0 12px rgba(0, 0, 0, 0.25);
    transition: transform 0.25s ease, opacity 0.25s ease;
    z-index: 999998;
  }

  .drawer-toggle:hover {
    transform: translateY(-50%) translateX(-2px);
  }

  .drawer-toggle:focus-visible,
  button:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--tf-orange);
    outline-offset: 2px;
  }

  .drawer-toggle .toggle-icon {
    width: 24px;
    height: auto;
  }

  .drawer-toggle .toggle-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .drawer-toggle.hidden {
    display: flex !important;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-50%) translateX(100%);
  }

  .backdrop {
    position: fixed;
    inset: 0;
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

  /* The drawer */
  .drawer {
    position: fixed;
    right: 0;
    top: 0;
    height: 100vh;
    height: 100dvh;
    width: min(var(--tf-width), 100vw);
    display: flex;
    flex-direction: column;
    background: var(--tf-bg);
    color: var(--tf-text);
    box-shadow: var(--tf-shadow);
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    z-index: 999999;
  }

  .drawer.open {
    transform: translateX(0);
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px 8px 14px;
    border-bottom: 1px solid var(--tf-line);
  }

  .drawer-header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .drawer-header-logo {
    width: 42px;
    height: auto;
    color: var(--tf-text);
  }

  .drawer-header-logo rect {
    transition: fill 0.4s;
  }

  .drawer-header-wordmark {
    height: 19px;
    width: auto;
    color: var(--tf-text);
  }

  .close-btn {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    font-size: 22px;
  }

  .close-btn:hover {
    background: var(--tf-surface-2);
  }

  /* The mode switch, in the header */
  .mode-switch {
    position: relative;
    display: flex;
    flex: none;
    width: 72px;
    margin-left: auto;
    margin-right: 8px;
  }

  .mode-switch::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 28px;
    border-radius: 14px;
    background: var(--tf-key);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.35);
  }

  .mode-switch::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--tf-orange);
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.35), 0 1px 3px rgba(0, 0, 0, 0.4);
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mode-switch:has(.mode-btn[data-mode="dark"].active)::after {
    transform: translateX(44px);
  }

  .mode-btn {
    position: relative;
    z-index: 1;
    flex: 1;
    height: 42px;
    padding: 31px 0 0;
    border: 0;
    background: transparent;
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
    color: var(--tf-muted);
  }

  .mode-btn.active {
    color: var(--tf-text);
  }

  /*
   * Column headers. Each sits over its own column, at its width, so what it
   * belongs to is where it is; pressing one puts that column away, and what
   * is left of it is a stub on the column's side that brings it back.
   */
  .column-tabs {
    display: flex;
    gap: 10px;
    padding: 12px 14px 10px;
  }

  .column-tab {
    display: flex;
    flex: 1 1 0;
    align-items: center;
    gap: 8px;
    min-width: 0;
    height: 42px;
    padding: 0 8px 0 12px;
    border: 0;
    border-radius: var(--tf-radius);
    background: var(--tf-teal);
    color: var(--tf-on-teal);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 0 rgba(0, 0, 0, 0.2);
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    text-align: left;
    transition: background 0.15s, color 0.15s;
  }

  .column-tab .icon {
    display: block;
    font-size: 19px;
  }

  .tab-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tab-away {
    opacity: 0.75;
  }

  .column-tab:hover .tab-away {
    opacity: 1;
  }

  /* Away: a stub, with its pane hollow */
  .column-tab[aria-pressed="false"] {
    flex: 0 0 42px;
    justify-content: center;
    padding: 0;
    background: var(--tf-surface);
    color: var(--tf-text);
    box-shadow: inset 0 0 0 1px var(--tf-line);
  }

  .column-tab[aria-pressed="false"]:hover {
    background: var(--tf-surface-2);
  }

  .column-tab[aria-pressed="false"] .tab-name,
  .column-tab[aria-pressed="false"] .tab-away {
    display: none;
  }

  .column-tab[aria-pressed="false"] .pane {
    fill: none;
  }

  /* The one column left cannot be put away, so it does not offer to be */
  .column-tabs:has(.column-tab[aria-pressed="false"]) .column-tab[aria-pressed="true"] .tab-away {
    display: none;
  }

  /* Columns */
  .drawer-content {
    display: flex;
    flex: 1;
    min-height: 0;
    gap: 10px;
    padding: 0 14px;
  }

  .column {
    display: flex;
    flex: 1 1 0;
    min-width: 0;
    flex-direction: column;
  }

  .column.collapsed {
    display: none;
  }

  /*
   * A column is its controls, and beneath them its list, which scrolls on its
   * own. The controls do not ride over the list: a row passing under them
   * would have its buttons half covered, too little left of them to press.
   */
  .column-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }

  .themes-list,
  .fonts-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--tf-surface-2) transparent;
    padding-bottom: 12px;
  }

  /* Tracks take the column's width, not their content's: a row of pills must wrap rather than widen them */
  .column-controls,
  .filter-container,
  .font-filters {
    grid-template-columns: minmax(0, 1fr);
  }

  /* Above the list, for the menus that open over it */
  .column-controls {
    position: relative;
    z-index: 2;
    display: grid;
    flex: none;
    gap: 7px;
    padding-bottom: 8px;
  }

  .instructions {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 6px 6px 6px 9px;
    border-radius: 7px;
    background: var(--tf-surface-2);
    font-size: 11.5px;
    line-height: 1.35;
    color: var(--tf-muted);
  }

  .instructions-close {
    display: grid;
    place-items: center;
    flex: none;
    width: 20px;
    height: 20px;
    margin-left: auto;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: transparent;
    font-size: 14px;
  }

  .filter-container,
  .font-filters {
    display: grid;
    gap: 7px;
  }

  .search {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 36px;
    padding: 0 11px;
    border-radius: var(--tf-radius);
    background: var(--tf-surface);
    box-shadow: inset 0 0 0 1px var(--tf-line);
    color: var(--tf-muted);
    cursor: text;
  }

  .search:focus-within {
    box-shadow: inset 0 0 0 2px var(--tf-teal);
  }

  .search .icon {
    font-size: 16px;
  }

  .search input {
    flex: 1;
    min-width: 0;
    border: 0;
    padding: 0;
    background: transparent;
    font: inherit;
    font-size: 13.5px;
    color: var(--tf-text);
    outline: none;
  }

  .search input::placeholder {
    color: var(--tf-muted);
  }

  .search input::-webkit-search-cancel-button {
    -webkit-appearance: none;
  }

  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 9px;
    border: 0;
    border-radius: 7px;
    background: var(--tf-surface);
    box-shadow: inset 0 0 0 1px var(--tf-line);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;
  }

  .pill .icon {
    font-size: 13px;
  }

  .pill:hover {
    background: var(--tf-surface-2);
  }

  .pill[aria-pressed="true"] {
    background: var(--tf-teal);
    color: var(--tf-on-teal);
  }

  .menu {
    position: relative;
  }

  .menu-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    height: 32px;
    padding: 0 8px 0 11px;
    border: 0;
    border-radius: 7px;
    background: var(--tf-surface);
    box-shadow: inset 0 0 0 1px var(--tf-line);
    font-size: 12.5px;
    font-weight: 500;
    text-align: left;
  }

  .menu-btn:hover {
    background: var(--tf-surface-2);
  }

  .menu-btn .icon {
    font-size: 16px;
    color: var(--tf-muted);
  }

  .menu-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 5;
    max-height: 260px;
    overflow-y: auto;
    padding: 6px;
    border-radius: 8px;
    background: var(--tf-surface);
    box-shadow: inset 0 0 0 1px var(--tf-line), 0 10px 30px rgba(0, 0, 0, 0.25);
  }

  .dropdown-search {
    position: sticky;
    top: 0;
    width: 100%;
    height: 32px;
    margin-bottom: 4px;
    padding: 0 10px;
    border: 0;
    border-radius: 6px;
    background: var(--tf-surface-2);
    font: inherit;
    font-size: 13px;
    color: var(--tf-text);
  }

  .dropdown-search::-webkit-search-cancel-button {
    -webkit-appearance: none;
  }

  .filter-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    font-size: 13px;
  }

  .filter-option:hover {
    background: var(--tf-surface-2);
  }

  .filter-option input {
    accent-color: var(--tf-teal);
    margin: 0;
  }

  .filter-option label {
    flex: 1;
    cursor: pointer;
  }

  .filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .filter-tags:empty {
    display: none;
  }

  .filter-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 4px 3px 10px;
    border-radius: 999px;
    background: var(--tf-surface-2);
    font-size: 12px;
    font-weight: 500;
  }

  .filter-tag-remove {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    font-size: 12px;
  }

  .filter-tag-remove:hover {
    background: var(--tf-surface);
  }

  /* Rows */
  .theme-item,
  .font-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 7px;
    padding: 8px 6px 8px 12px;
    border-radius: var(--tf-radius);
    background: var(--tf-surface);
    box-shadow: inset 0 0 0 1px var(--tf-line), inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 2px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    content-visibility: auto;
    contain-intrinsic-size: auto 72px;
    transition: box-shadow 0.15s, background 0.15s;
  }

  .theme-item:hover,
  .font-item:hover {
    box-shadow: inset 0 0 0 1px var(--tf-muted), 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  .theme-main,
  .font-main {
    flex: 1;
    min-width: 0;
  }

  .theme-name,
  .font-name {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.25;
  }

  .theme-name,
  .font-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .theme-colors {
    display: flex;
    gap: 5px;
    margin-top: 6px;
  }

  .color-swatch {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
  }

  /* The row for the mode in view; the other mode's pick keeps a quiet mark */
  .drawer[data-mode="light"] .theme-item.selected-light,
  .drawer[data-mode="dark"] .theme-item.selected-dark,
  .font-item.selected {
    background: color-mix(in srgb, var(--tf-orange) 7%, var(--tf-surface));
    box-shadow: inset 0 0 0 2px var(--tf-orange);
  }

  .drawer[data-mode="light"] .theme-item.selected-dark:not(.selected-light),
  .drawer[data-mode="dark"] .theme-item.selected-light:not(.selected-dark) {
    outline: 1.5px dashed var(--tf-muted);
    outline-offset: -2px;
  }

  .font-sample {
    flex: none;
    width: 44px;
    font-size: 28px;
    font-weight: 600;
    line-height: 1;
    text-align: center;
  }

  .font-styles {
    margin-top: 2px;
    font-size: 11.5px;
    line-height: 1.3;
    color: var(--tf-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /*
   * The selected row's controls, on a line of their own beneath it: the face
   * in use for headings and the one for body text, each of which can be kept
   * while another pairing is chosen, and the swap. Sized and spaced to be
   * touch targets even when a page zooms the drawer down to 85%.
   */
  .font-item {
    flex-wrap: wrap;
  }

  .font-keep {
    display: grid;
    flex: 0 0 100%;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 4px;
    margin-top: 6px;
    padding-right: 6px;
  }

  .keep-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    height: 40px;
    padding: 0 8px;
    border: 0;
    border-radius: 7px;
    background: var(--tf-surface-2);
    font-size: 12.5px;
    text-align: left;
    transition: background 0.15s, color 0.15s;
  }

  .keep-btn .icon {
    font-size: 15px;
    opacity: 0.6;
  }

  .keep-text {
    display: grid;
    flex: 1;
    min-width: 0;
    line-height: 1.2;
  }

  .keep-role {
    font-size: 9.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  .keep-face {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .keep-btn:hover {
    filter: brightness(0.96);
  }

  .keep-btn[aria-pressed="true"] {
    background: var(--tf-orange);
    color: var(--tf-on-orange);
  }

  .keep-btn[aria-pressed="true"] .icon {
    fill: currentColor;
    opacity: 1;
  }

  .font-swap {
    display: grid;
    grid-column: 2;
    grid-row: 1 / span 2;
    place-items: center;
    width: 32px;
    padding: 0;
    border: 0;
    border-radius: 7px;
    background: var(--tf-surface-2);
    font-size: 17px;
  }

  .font-swap:hover {
    filter: brightness(0.96);
  }

  .favorites {
    display: flex;
    flex: none;
    gap: 0;
  }

  /* 29 apart, so each is still a 24 px target when a page zooms the drawer down to 85% */
  .favorite-icon {
    display: grid;
    place-items: center;
    width: 29px;
    height: 29px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    font-size: 17px;
    color: var(--tf-muted);
  }

  .favorite-icon:hover {
    background: var(--tf-surface-2);
    color: var(--tf-text);
  }

  .favorite-icon .icon {
    pointer-events: none;
  }

  .favorite-icon.starred,
  .favorite-icon.loved {
    color: var(--tf-orange);
  }

  .favorite-icon.starred .icon,
  .favorite-icon.loved .icon {
    fill: currentColor;
  }

  /* A narrow column, as when the drawer is docked: the sample shrinks and the row tightens */
  .column {
    container-type: inline-size;
  }

  @container (max-width: 250px) {
    .theme-item,
    .font-item {
      gap: 6px;
      padding: 8px 4px 8px 10px;
    }

    .font-sample {
      width: 34px;
      font-size: 24px;
    }

    .theme-name,
    .font-name {
      font-size: 13.5px;
    }

    .theme-colors {
      gap: 4px;
    }

    .color-swatch {
      width: 21px;
      height: 21px;
    }

    .pills {
      gap: 3px;
    }

    .pill {
      gap: 3px;
      padding: 0 5px;
      font-size: 10.5px;
    }

    .preview-btn,
    .apply-btn {
      gap: 6px;
      font-size: 13.5px;
    }
  }

  /* Footer */
  .drawer-footer {
    display: flex;
    gap: 10px;
    padding: 10px 14px 14px;
    border-top: 1px solid var(--tf-line);
  }

  .preview-btn,
  .apply-btn {
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    justify-content: center;
    gap: 9px;
    height: 46px;
    padding: 0 12px;
    border: 0;
    border-radius: var(--tf-radius);
    font-size: 14.5px;
    font-weight: 600;
    white-space: nowrap;
    transition: transform 0.1s, filter 0.15s;
  }

  .preview-btn .icon,
  .apply-btn .icon {
    font-size: 19px;
  }

  .preview-btn {
    background: var(--tf-surface);
    box-shadow: inset 0 0 0 1.5px var(--tf-key);
  }

  .preview-eye,
  .preview-eye-off {
    display: grid;
  }

  .preview-eye-off,
  .preview-btn[aria-pressed="false"] .preview-eye {
    display: none;
  }

  /* The selection is off the page: the key is down and says what is showing instead */
  .preview-btn[aria-pressed="false"] {
    background: var(--tf-key);
    color: var(--tf-on-key);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.35);
  }

  .preview-btn[aria-pressed="false"] .preview-eye-off {
    display: grid;
  }

  .apply-btn {
    background: var(--tf-orange);
    color: var(--tf-on-orange);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 0 rgba(0, 0, 0, 0.2);
  }

  .preview-btn:hover,
  .apply-btn:hover {
    filter: brightness(1.04);
  }

  .preview-btn:active,
  .apply-btn:active {
    transform: translateY(1px);
  }

  /* The modal, when there is no server to write to: a dialog, so it opens above the whole page */
  .activation-modal {
    width: min(680px, calc(100vw - 40px));
    max-height: 90vh;
    padding: 0;
    border: 0;
    border-radius: 12px;
    background: var(--tf-bg);
    color: var(--tf-text);
    box-shadow: var(--tf-shadow);
    overflow: hidden;
  }

  .activation-modal[open] {
    display: flex;
    flex-direction: column;
  }

  .activation-modal::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .activation-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 12px 12px 20px;
    border-bottom: 1px solid var(--tf-line);
  }

  .activation-modal-header h3 {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
  }

  .activation-modal-close {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    font-size: 20px;
  }

  .activation-modal-close:hover {
    background: var(--tf-surface-2);
  }

  .activation-modal-body {
    display: grid;
    gap: 14px;
    padding: 16px 20px 20px;
    overflow-y: auto;
  }

  .activation-instructions {
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
    color: var(--tf-muted);
  }

  .activation-instructions code {
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--tf-surface-2);
    font-size: 13px;
  }

  .activation-sections {
    display: grid;
    gap: 14px;
  }

  .activation-section {
    border-radius: 10px;
    background: var(--tf-surface);
    box-shadow: inset 0 0 0 1px var(--tf-line);
    overflow: hidden;
  }

  .activation-code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 8px 8px 14px;
    border-bottom: 1px solid var(--tf-line);
  }

  .activation-code-title {
    font-size: 13px;
    font-weight: 600;
  }

  .activation-code-filename {
    font-size: 12px;
    color: var(--tf-muted);
  }

  .activation-code-actions {
    display: flex;
    gap: 6px;
  }

  .activation-copy-btn,
  .activation-save-btn,
  .activation-cancel-btn {
    height: 32px;
    padding: 0 12px;
    border: 0;
    border-radius: 7px;
    background: var(--tf-surface-2);
    font-size: 13px;
    font-weight: 600;
  }

  .activation-copy-btn:hover,
  .activation-save-btn:hover,
  .activation-cancel-btn:hover {
    filter: brightness(0.96);
  }

  .activation-copy-btn.copied,
  .activation-save-btn.saved {
    background: var(--tf-teal);
    color: var(--tf-on-teal);
  }

  .activation-code-block {
    margin: 0;
    max-height: 240px;
    padding: 12px 14px;
    overflow: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    tab-size: 2;
  }

  .activation-buttons {
    display: flex;
    justify-content: flex-end;
  }

  .activation-cancel-btn {
    background: var(--tf-key);
    color: var(--tf-on-key);
  }

  /* Toast */
  .theme-forseen-toast {
    position: fixed;
    inset: auto auto 20px 50%;
    z-index: 1000001;
    display: flex;
    margin: 0;
    border: 0;
    overflow: visible;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 10px;
    background: var(--tf-key);
    color: var(--tf-on-key);
    box-shadow: var(--tf-shadow);
    font-size: 14px;
    font-weight: 500;
    transform: translateX(-50%) translateY(100px);
    transition: transform 0.3s ease;
  }

  .theme-forseen-toast.shown {
    transform: translateX(-50%) translateY(0);
  }

  .theme-forseen-toast.error {
    background: var(--tf-orange);
    color: var(--tf-on-orange);
  }

  /*
   * Narrow screens: the drawer is the screen, and one column at a time.
   * Docked, the page sizes the drawer, so the window's width says nothing.
   */
  @media (max-width: 768px) {
    :host(:not([docked])) {
      --tf-width: 100vw;
    }

    /* One column at a time: the headers are tabs proper, side by side */
    :host(:not([docked])) .column-tab[aria-pressed="false"] {
      flex: 1 1 0;
      justify-content: flex-start;
      padding: 0 8px 0 12px;
    }

    :host(:not([docked])) .column-tab[aria-pressed="false"] .tab-name {
      display: block;
    }

    :host(:not([docked])) .column-tab .tab-away {
      display: none;
    }
  }

  /* A phone: the words alone on the tabs and the keys */
  @media (max-width: 480px) {
    :host(:not([docked])) .column-tabs {
      gap: 8px;
      padding: 12px 12px 10px;
    }

    :host(:not([docked])) .drawer-header-wordmark {
      height: 16px;
    }

    :host(:not([docked])) .drawer-content {
      padding: 0 12px;
    }

    :host(:not([docked])) .drawer-footer {
      gap: 8px;
      padding: 10px 12px 12px;
    }

    :host(:not([docked])) .preview-btn,
    :host(:not([docked])) .apply-btn {
      gap: 0;
      padding: 0 10px;
      font-size: 14px;
    }

    :host(:not([docked])) .preview-btn .icon,
    :host(:not([docked])) .apply-btn .icon {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .drawer,
    .drawer-toggle,
    .backdrop,
    .mode-switch::after,
    .theme-forseen-toast,
    .drawer-header-logo rect {
      transition: none;
    }
  }
`;
