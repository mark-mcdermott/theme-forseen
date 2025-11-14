# ThemeForseen

A live color theme and font pairing preview tool that adds an interactive sidebar drawer to your website. Browse and preview different color schemes and font combinations in real-time!

## Features

- 🎨 **Live Color Theme Preview** - 5+ curated color palettes with instant visual feedback
- 🔤 **Font Pairing Preview** - 8+ professionally paired font combinations
- 🌓 **Light & Dark Mode Support** - Separate themes for light and dark modes
- ⌨️ **Keyboard Navigation** - Use arrow keys to quickly browse options
- 🖱️ **Mouse Wheel Support** - Scroll through themes and fonts with your mouse wheel
- 🎯 **CSS Variables** - Uses CSS custom properties for seamless integration
- 📦 **Framework Agnostic** - Works with any web framework (Astro, React, Vue, etc.)

## Project Structure

```
theme-forseen/
├── src/                           # Drawer library source code
│   ├── ThemeForseenDrawer.ts      # Main web component
│   ├── themes.ts                  # Color & font definitions
│   └── index.ts                   # Entry point
├── dist/                          # Built library
├── package.json                   # Library package configuration
└── demos/                         # Demo websites
    ├── themeforseen.com/          # Astro demo site (main)
    │   └── src/layouts/
    │       └── DefaultLayout.astro
    └── the-office-placeholder-site.com/  # React demo site
        └── src/
```

## Quick Start

The drawer is already integrated into the demo sites. To see it in action:

```bash
# For the Astro demo site
cd demos/themeforseen.com
yarn install
yarn dev
```

Or try the React demo:

```bash
# For the React demo site
cd demos/the-office-placeholder-site.com
yarn install
yarn dev
```

Then click the 🎨 icon on the left side of the screen!

## Usage in Your Project

### For Astro Projects

1. Copy the ThemeForseen library files into your project:
   ```bash
   # Copy src/, dist/, package.json, and tsconfig.json to your project root
   ```

2. Build the drawer:
   ```bash
   npm install
   npm run build
   ```

3. Add to your layout file (e.g., `src/layouts/Layout.astro`):
   ```astro
   <body>
     <theme-forseen-drawer></theme-forseen-drawer>
     <!-- your content -->

     <script>
       import '../path/to/dist/index.js';
     </script>
   </body>
   ```

4. Update your `tailwind.config.js`:
   ```js
   export default {
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
   };
   ```

5. Use the Tailwind classes in your components:
   ```html
   <h1 class="font-heading text-primary">Hello World</h1>
   <p class="font-body text-text bg-bg">Some body text</p>
   <div class="bg-card-bg">Card content</div>
   ```

### For Other Frameworks (React, Vue, etc.)

ThemeForseen uses Web Components, so it works with any framework:

```html
<!-- Add to your HTML -->
<script type="module" src="/path/to/dist/index.js"></script>
<theme-forseen-drawer></theme-forseen-drawer>
```

For React projects, see the example in `demos/the-office-placeholder-site.com/`

Then configure your CSS framework to use the CSS variables.

## How to Use the Drawer

1. **Open the Drawer**: Click the 🎨 icon on the left side of the screen
2. **Browse Themes**:
   - Click any theme to apply it instantly
   - Use ↑/↓ arrow keys or mouse wheel to scroll through themes
   - Toggle between Light and Dark mode
3. **Browse Fonts**:
   - Click any font pairing to apply it
   - Use ↑/↓ arrow keys or mouse wheel to scroll through fonts
4. **See Changes Live**: All changes apply immediately to your page!

## Customization

Add your own themes and fonts by editing `src/themes.ts`:

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
      // ... dark mode colors
    },
  },
  // Add more themes...
];
```

After editing, rebuild:
```bash
npm run build
# or use yarn
yarn build
```

## CSS Variables Reference

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

## Development

```bash
# Build the drawer library (from root)
npm install
npm run build
# or use yarn
yarn install
yarn build

# Run the Astro demo site
cd demos/themeforseen.com
yarn install
yarn dev

# Or run the React demo site
cd demos/the-office-placeholder-site.com
yarn install
yarn dev
```

The demo sites automatically import the drawer from `../../dist/index.js`, so make sure to build the library first before running the demos.

## License

MIT
