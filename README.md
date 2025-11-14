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
├── theme-forseen-drawer/    # The drawer library (main product)
│   ├── src/
│   │   ├── ThemeForseenDrawer.ts  # Main web component
│   │   ├── themes.ts              # Color & font definitions
│   │   └── index.ts               # Entry point
│   ├── dist/                      # Built library
│   └── package.json
└── site/                    # Demo Astro website
    └── src/
        └── layouts/
            └── DefaultLayout.astro  # Drawer integrated here
```

## Quick Start

The drawer is already integrated into the demo site. To see it in action:

```bash
cd site
npm install
npm run dev
```

Then open http://localhost:4321/ and click the 🎨 icon on the left side of the screen!

## Usage in Your Project

### For Astro Projects

1. Copy the `theme-forseen-drawer` folder into your project
2. Build the drawer:
   ```bash
   cd theme-forseen-drawer
   npm install
   npm run build
   ```

3. Add to your layout file (e.g., `src/layouts/Layout.astro`):
   ```astro
   <body>
     <theme-forseen-drawer></theme-forseen-drawer>
     <!-- your content -->

     <script>
       import '../../theme-forseen-drawer/dist/index.js';
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

### For Other Frameworks

ThemeForseen uses Web Components, so it works with any framework:

```html
<!-- Add to your HTML -->
<script type="module" src="/path/to/theme-forseen-drawer/dist/index.js"></script>
<theme-forseen-drawer></theme-forseen-drawer>
```

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

Add your own themes and fonts by editing `theme-forseen-drawer/src/themes.ts`:

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
cd theme-forseen-drawer
npm run build
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
# Build the drawer
cd theme-forseen-drawer
npm install
npm run build

# Run the demo site
cd ../site
npm install
npm run dev
```

## License

MIT
