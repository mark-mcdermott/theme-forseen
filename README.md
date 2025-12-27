# ThemeForseen

A live color theme and font pairing preview drawer for websites. Browse and preview different color schemes and font combinations in real-time.

Built as a vanilla [Web Component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) using the Custom Elements API, so it works with any framework (React, Vue, Svelte, Astro, plain HTML, etc.).

## Features

- **Live Color Theme Preview** - Curated color palettes with instant visual feedback
- **Font Pairing Preview** - Thoughtful, beautiful font combinations
- **Light & Dark Mode Support** - Separate themes for each mode
- **Keyboard Navigation** - Arrow keys to browse options
- **Mouse Wheel Support** - Scroll through themes and fonts
- **CSS Variables** - Uses CSS custom properties for seamless integration
- **Framework Agnostic** - Works with any web framework

## Installation

```bash
npm install theme-forseen
```

## Usage

The drawer auto-initializes when you import the module—no setup code needed.

### With a Bundler (Vite, Webpack, Parcel, etc.)

```html
<script type="module">
  import 'theme-forseen';
</script>
```

### Without a Bundler (plain HTML)

If you're serving static HTML files without a bundler, use the full path:

```html
<script type="module">
  import '/node_modules/theme-forseen/dist/index.js';
</script>
```

Or use a CDN:

```html
<script type="module">
  import 'https://unpkg.com/theme-forseen/dist/index.js';
</script>
```

### SvelteKit

```svelte
<script>
  import 'theme-forseen';
</script>
```

### React

```jsx
import 'theme-forseen';

function App() {
  return <div>Your app</div>;
}
```

### Tailwind CSS Integration

ThemeForseen sets CSS variables on `<html>` at runtime when you select themes. You just need to tell Tailwind about them.

#### Tailwind v4 (CSS-first config)

Add this to your main CSS file:

```css
@import "tailwindcss";

@theme inline {
  --color-primary: var(--color-primary);
  --color-primary-shadow: var(--color-primary-shadow);
  --color-accent: var(--color-accent);
  --color-accent-shadow: var(--color-accent-shadow);
  --color-bg: var(--color-bg);
  --color-card-bg: var(--color-card-bg);
  --color-text: var(--color-text);
  --color-extra: var(--color-extra);
  --font-heading: var(--font-heading);
  --font-body: var(--font-body);
}
```

The `inline` keyword tells Tailwind these reference external runtime variables.

#### Tailwind v3 (JS config)

Update your `tailwind.config.js`:

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

#### Using the classes

Then use in your markup:

```html
<h1 class="font-heading text-primary">Hello World</h1>
<p class="font-body text-text bg-bg">Body text</p>
```

## How to Use the Drawer

1. **Open**: Click the icon on the right side of the screen
2. **Browse Themes**: Click to apply, use arrow keys or mouse wheel to scroll
3. **Toggle Mode**: Switch between Light and Dark mode
4. **Browse Fonts**: Click any font pairing to apply it
5. **Activate**: Click the lightning bolt icon to export config to your project

## CSS Variables Reference

### Colors
| Variable | Description |
|----------|-------------|
| `--color-primary` | Primary brand color |
| `--color-primary-shadow` | Darker shade of primary |
| `--color-accent` | Accent/secondary color |
| `--color-accent-shadow` | Darker shade of accent |
| `--color-bg` | Background color |
| `--color-card-bg` | Card/surface background |
| `--color-text` | Main text color |
| `--color-extra` | Additional accent color |
| `--color-h1`, `--color-h2`, `--color-h3` | Heading colors |
| `--color-heading` | General heading color (same as h1) |
| `--primary-color` | Alias for `--color-primary` |
| `--secondary-color` | Alias for `--color-accent` |

### Fonts
| Variable | Description |
|----------|-------------|
| `--font-heading` | Font family for headings |
| `--font-body` | Font family for body text |
| `--heading-font` | Alias for `--font-heading` |
| `--body-font` | Alias for `--font-body` |

## Customization

Add your own themes by editing `src/themes.ts`:

```typescript
export const colorThemes: ColorTheme[] = [
  {
    name: 'My Custom Theme',
    light: {
      primary: '#FF0000',
      primaryShadow: '#CC0000',
      accent: '#00FF00',
      accentShadow: '#00CC00',
      background: '#FFFFFF',
      cardBackground: '#F5F5F5',
      text: '#333333',
      extra: '#0000FF',
      h1Color: 'primary',
      h2Color: 'primary',
      h3Color: 'accent',
    },
    dark: {
      // dark mode colors...
    },
  },
];
```

Rebuild after changes:

```bash
npm run build
```

## Development

```bash
# Install and build
npm install
npm run build

# Watch mode
npm run dev
```

## Contributing

Contributions welcome! Open an issue or submit a PR at [GitHub](https://github.com/mark-mcdermott/theme-forseen).

## License

MIT
