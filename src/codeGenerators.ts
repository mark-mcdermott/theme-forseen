import type { ColorTheme } from "./themes.js";

type ThemeColors = ColorTheme["light"] | ColorTheme["dark"];

export function generateTailwindColorConfig(colors: ThemeColors): string {
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

export function generateFontCSS(headingFont: string, bodyFont: string): string {
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
