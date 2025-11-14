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
5. **Activate a Theme**: Click the lightning bolt (⚡) icon on any tile to export the configuration to your project files

## Theme Activation

ThemeForseen includes a powerful activation feature that exports your chosen theme or font pairing to your project files.

### How Activation Works

1. Click the ⚡ (lightning bolt) icon on any theme or font tile
2. A modal appears with generated code
3. Choose one of two options:
   - **Save to File**: Uses the File System Access API (Chrome/Edge) to save directly to your project
   - **Copy**: Copies the code to your clipboard for manual pasting

### For Color Themes

Activating a color theme generates Tailwind config code that should be added to your `tailwind.config.js` (or `.ts`, `.mjs`) file in the `theme.extend.colors` section.

**Requirements:**
- You must have a Tailwind config file in your project root
- If you don't have one, create it with `npx tailwindcss init`

### For Font Pairings

Activating a font pairing generates CSS with custom properties (`--font-heading`, `--font-body`). We recommend saving this to `src/styles/fonts.css` and importing it in your main layout.

The generated CSS includes:
- CSS custom properties for heading and body fonts
- Optional direct element styling
- Tailwind config snippet for using `font-heading` and `font-body` classes

### Browser Support

The "Save to File" feature uses the File System Access API, supported in:
- Chrome, Edge, and other Chromium-based browsers

For other browsers, use the "Copy" button to paste the code manually.

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

## Repository Size & Font Management

You might notice this repository has a significant file size. This is primarily due to bundling all fonts locally. ThemeForseen includes 30 font pairings (60+ individual font files with multiple weights) to provide a comprehensive selection for previewing.

### Why Local Fonts?

We chose to bundle fonts locally rather than loading from CDNs to minimize FOUC (Flash of Unstyled Content) during live previewing. When rapidly switching between font combinations, loading fonts on-demand causes noticeable flashing. Local fonts provide a smoother, more immediate preview experience.

### FOUC Status

While local fonts significantly reduce FOUC, it's not completely eliminated—you may still notice occasional font flashing, especially on first load or slower connections. We're continuing to investigate improvements:

- Font preloading strategies
- Progressive font subsetting
- Smarter caching mechanisms
- Alternative loading patterns

We're open to suggestions and contributions on this front!

## Contributing

ThemeForseen is an open-source project and we welcome contributions! Whether you want to:

- Add new color themes or font pairings
- Improve FOUC handling and performance
- Optimize bundle size
- Fix bugs or enhance documentation
- Suggest new features

Feel free to:
- **Open an issue** to report bugs or suggest features
- **Submit a pull request** with improvements
- **Start a discussion** about ideas or approaches

Visit our [GitHub repository](https://github.com/mark-mcdermott/theme-forseen) to get started!

## License

MIT
