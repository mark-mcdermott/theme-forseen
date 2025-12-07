// Side-effect import to ensure custom element is registered
import './ThemeForseen.js';
export { ThemeForseen } from './ThemeForseen.js';
export { colorThemes, fontPairings } from './themes.js';
// Initialize function to add the drawer to the page
export function initThemeForseen() {
    if (typeof window === 'undefined')
        return;
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addDrawer);
    }
    else {
        addDrawer();
    }
}
function addDrawer() {
    // Prevent duplicate drawers
    if (document.querySelector('theme-forseen'))
        return;
    const drawer = document.createElement('theme-forseen');
    document.body.appendChild(drawer);
}
// Auto-initialize if script is loaded
if (typeof window !== 'undefined') {
    initThemeForseen();
}
//# sourceMappingURL=index.js.map