/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary, #0066CC)',
        'primary-shadow': 'var(--color-primary-shadow, #004C99)',
        accent: 'var(--color-accent, #FF6B35)',
        'accent-shadow': 'var(--color-accent-shadow, #CC5529)',
        bg: 'var(--color-bg, #FFFFFF)',
        'card-bg': 'var(--color-card-bg, #F5F5F5)',
        text: 'var(--color-text, #333333)',
        extra: 'var(--color-extra, #00D4FF)',
      },
    },
    fontFamily: {
      heading: ['var(--font-heading, Inter)', 'sans-serif'],
      body: ['var(--font-body, Geist)', 'sans-serif'],
    },
  },
  plugins: [],
  darkMode: ['class', '.darkmode'],
}
