# ThemeForseen

A live color theme and font pairing preview drawer for websites. Browse and preview different color schemes and font combinations in real-time.

Built as a vanilla [Web Component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) using the Custom Elements API, so it works with any framework (React, Vue, Svelte, Astro, plain HTML, etc.).

## Features

- **Live Color Theme Preview** - Curated color palettes with instant visual feedback
- **Font Pairing Preview** - Professionally paired font combinations
- **Light & Dark Mode Support** - Separate themes for each mode
- **Keyboard Navigation** - Arrow keys to browse options
- **Mouse Wheel Support** - Scroll through themes and fonts
- **CSS Variables** - Uses CSS custom properties for seamless integration
- **Framework Agnostic** - Works with any web framework

## Installation (Local Development)

This package isn't on npm yet. To use it locally:

### Option 1: npm link (recommended for active development)

```bash
# Clone the repo
git clone https://github.com/mark-mcdermott/theme-forseen.git
cd theme-forseen

# Install dependencies and build
npm install
npm run build

# Create a global symlink
npm link

# In your project directory
cd /path/to/your-project
npm link theme-forseen
```

Changes to theme-forseen will be reflected after rebuilding (`npm run build`).

### Option 2: File path in package.json

```json
{
  "dependencies": {
    "theme-forseen": "file:../path/to/theme-forseen"
  }
}
```

Then run `npm install` in your project.

### Option 3: npm pack (simulates real npm install)

```bash
# In theme-forseen directory
npm run build
npm pack
# Creates theme-forseen-0.1.0.tgz

# In your project
npm install ../path/to/theme-forseen-0.1.0.tgz
```

## Usage

### Basic Usage (any framework)

```html
<script type="module">
  import { initThemeForseen } from 'theme-forseen';
  initThemeForseen();
</script>
```

Or add the element directly:

```html
<script type="module" src="path/to/theme-forseen/dist/index.js"></script>
<theme-forseen></theme-forseen>
```

### SvelteKit

```svelte
<script>
  import { onMount } from 'svelte';
  import { initThemeForseen } from 'theme-forseen';

  onMount(() => {
    initThemeForseen();
  });
</script>
```

### React

```jsx
import { useEffect } from 'react';
import { initThemeForseen } from 'theme-forseen';

function App() {
  useEffect(() => {
    initThemeForseen();
  }, []);

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

1. **Open**: Click the icon on the left side of the screen
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

### Fonts
| Variable | Description |
|----------|-------------|
| `--font-heading` | Font family for headings |
| `--font-body` | Font family for body text |

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
