export const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600&display=swap');

  * {
    box-sizing: border-box;
  }

  :host {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .drawer-toggle {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 120px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
    background-size: 200% 200%;
    animation: shimmer 3s ease-in-out infinite;
    border: none;
    border-radius: 12px 0 0 12px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 999998;
    box-shadow:
      -4px 0 20px rgba(102, 126, 234, 0.4),
      -2px 0 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .drawer-toggle::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 70%
    );
    animation: sparkle 4s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes shimmer {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  @keyframes sparkle {
    0% { transform: translateX(-100%) rotate(45deg); }
    100% { transform: translateX(100%) rotate(45deg); }
  }

  .drawer-toggle:hover {
    width: 54px;
    background: linear-gradient(135deg, #764ba2 0%, #667eea 50%, #764ba2 100%);
    background-size: 200% 200%;
    box-shadow:
      -6px 0 30px rgba(102, 126, 234, 0.6),
      -2px 0 12px rgba(0, 0, 0, 0.15);
  }

  .drawer-toggle:active {
    transform: translateY(-50%) scale(0.98);
  }

  .drawer-toggle .toggle-icon {
    width: 24px;
    height: 24px;
    color: white;
    opacity: 0.95;
  }

  .drawer-toggle .toggle-text {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
    font-size: 11px;
    font-weight: 600;
    color: white;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    opacity: 0.9;
  }

  .drawer-toggle.hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(-50%) translateX(100%);
  }

  @keyframes jiggle {
    0%, 100% { transform: translateY(-50%) rotate(0deg); }
    25% { transform: translateY(-50%) rotate(-2deg) scale(1.02); }
    50% { transform: translateY(-50%) rotate(2deg) scale(1.02); }
    75% { transform: translateY(-50%) rotate(-1deg); }
  }

  .drawer-toggle.jiggle {
    animation: jiggle 0.5s ease-in-out;
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
    right: 0;
    top: 0;
    height: 100vh;
    width: auto;
    max-width: 90vw;
    background: light-dark(white, #1a1a1a);
    color: light-dark(#333, #e0e0e0);
    box-shadow: -2px 0 10px rgba(0,0,0,0.2);
    transition: transform 0.3s ease, width 0.3s ease;
    overflow: hidden;
    transform: translateX(100%);
    display: flex;
    flex-direction: column;
    z-index: 999999;
  }

  .drawer.open {
    transform: translateX(0);
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
    width: fit-content;
  }

  .column {
    width: 300px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid light-dark(#ddd, #444);
    overflow: hidden;
    transition: width 0.3s ease;
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
    width: 40px;
    min-width: 40px;
  }

  .column.collapsed .column-header {
    writing-mode: vertical-lr;
    text-align: center;
    padding: 15px 5px;
    gap: 12px;
    height: 140px;
    box-sizing: border-box;
  }

  .column.collapsed .column-title {
    transform: rotate(180deg);
  }

  .column.collapsed .collapse-btn {
    writing-mode: horizontal-tb;
  }

  .column.collapsed .column-content {
    display: none;
  }

  .column-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 10px 10px 10px;
  }

  .column-controls {
    position: sticky;
    top: 0;
    z-index: 100;
    background: light-dark(#f5f5f5, #1e1e1e);
    margin: 0 -10px 10px -10px;
    padding: 10px;
    border-bottom: 1px solid light-dark(#ddd, #444);
  }

  .themes-list, .fonts-list {
    position: relative;
    z-index: 1;
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

  /* Light mode selection - blue */
  .theme-item.selected-light {
    border: 2px solid light-dark(#2196F3, #64B5F6);
    background: light-dark(rgba(33,150,243,0.1), rgba(100,181,246,0.1));
  }

  /* Dark mode selection - green */
  .theme-item.selected-dark {
    border: 2px solid light-dark(#4CAF50, #81C784);
    background: light-dark(rgba(76,175,80,0.1), rgba(129,199,132,0.1));
  }

  /* Both selected - show both colors */
  .theme-item.selected-light.selected-dark {
    border: 2px solid light-dark(#4CAF50, #81C784);
    outline: 3px solid light-dark(#2196F3, #64B5F6);
    outline-offset: -1px;
    background: light-dark(
      linear-gradient(135deg, rgba(33,150,243,0.1) 50%, rgba(76,175,80,0.1) 50%),
      linear-gradient(135deg, rgba(100,181,246,0.1) 50%, rgba(129,199,132,0.1) 50%)
    );
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
    top: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 10;
  }

  [data-column="themes"] .favorites {
    gap: 5px;
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
    color: #f5c518;
  }

  .favorite-icon.starred:hover {
    color: #ffd700;
  }

  .favorite-icon.loved {
    color: #e57373;
  }

  .favorite-icon.loved:hover {
    color: #ef5350;
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
`;
