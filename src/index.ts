export { ThemeForseen } from './ThemeForseen.js';
export { colorThemes, fontPairings, type ColorTheme, type FontPairing } from './themes.js';

// Initialize function to add the drawer to the page
export function initThemeForseen() {
  if (typeof window === 'undefined') return;

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addDrawer);
  } else {
    addDrawer();
  }
}

function addDrawer() {
  const drawer = document.createElement('theme-forseen');
  document.body.appendChild(drawer);
}

// Auto-initialize if script is loaded
if (typeof window !== 'undefined') {
  initThemeForseen();
}
