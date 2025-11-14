# ThemeForseen Drawer

A live color theme and font pairing preview tool that adds a sidebar drawer to your website, allowing you to browse and preview different color schemes and font combinations in real-time.

## Features

- 🎨 **Live Color Theme Preview** - Switch between multiple curated color palettes with instant visual feedback
- 🔤 **Font Pairing Preview** - Browse professionally paired font combinations
- 🌓 **Light & Dark Mode Support** - Separate themes for light and dark modes
- ⌨️ **Keyboard Navigation** - Use arrow keys to quickly browse options
- 🖱️ **Mouse Wheel Support** - Scroll through themes and fonts with your mouse wheel
- 🎯 **CSS Variables** - Uses CSS custom properties for seamless integration
- 📦 **Framework Agnostic** - Works with any web framework (React, Vue, Astro, etc.)

## Installation

### For Astro Projects

1. Add the drawer to your project
2. Import in your layout file
3. Configure Tailwind to use CSS variables

### Manual Installation

```bash
npm install theme-forseen-drawer
```

## Usage

### Astro

```astro
---
// In your layout file (e.g., DefaultLayout.astro)
---

<html>
  <head>...</head>
  <body>
    <slot />
    <theme-forseen-drawer></theme-forseen-drawer>
  </body>
</html>

<script>
  import 'theme-forseen-drawer';
</script>
```

### Vanilla JavaScript

```html
<script type="module">
  import 'theme-forseen-drawer';
</script>

<!-- The drawer will auto-initialize -->
```

## Tailwind Configuration

Update your `tailwind.config.js` to use the CSS variables:

```js
export default {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-shadow': 'var(--color-primary-shadow)',
        accent: 'var(--color-accent)',
        'accent-shadow': 'var(--color-accent-shadow)',
        bg: 'var(--color-bg)',
        'card-bg': 'var(--color-card-bg)',
        text: 'var(--color-text)',
        extra: 'var(--color-extra)',
      },
    },
    fontFamily: {
      heading: ['var(--font-heading)', 'sans-serif'],
      body: ['var(--font-body)', 'sans-serif'],
    },
  },
};
```

## CSS Variables

The drawer sets the following CSS variables on the document root:

### Colors
- `--color-primary` - Primary brand color
- `--color-primary-shadow` - Darker shade of primary
- `--color-accent` - Accent/secondary color
- `--color-accent-shadow` - Darker shade of accent
- `--color-bg` - Background color
- `--color-card-bg` - Card/surface background
- `--color-text` - Main text color
- `--color-extra` - Additional color for special elements
- `--color-h1`, `--color-h2`, `--color-h3` - Heading colors

### Fonts
- `--font-heading` - Font family for headings
- `--font-body` - Font family for body text

## Keyboard Shortcuts

- `Arrow Up/Down` - Navigate through themes or fonts
- Click on any theme or font to select it instantly
- Mouse wheel over a column to scroll through options

## Customization

You can add your own themes and font pairings by editing `src/themes.ts`:

```typescript
export const colorThemes: ColorTheme[] = [
  {
    name: 'My Custom Theme',
    light: {
      primary: '#FF0000',
      // ... more colors
    },
    dark: {
      primary: '#FF6666',
      // ... more colors
    },
  },
  // ... more themes
];
```

## License

MIT
