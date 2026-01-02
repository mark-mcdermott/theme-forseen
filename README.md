# ThemeForseen

![Tests](https://github.com/mark-mcdermott/theme-forseen/actions/workflows/test.yml/badge.svg)

A live color theme and font pairing preview drawer for websites. Browse and preview different color schemes and font combinations in real-time.

## Features

- **CSS Variables** - Sets `--color-primary`, `--font-heading`, etc. on `<html>` for any CSS to consume
- **Live Color Theme Preview** - Curated color palettes with instant visual feedback
- **Font Pairing Preview** - Thoughtful, beautiful font combinations
- **Light & Dark Mode Support** - Separate themes for each mode
- **Dev Server** - Write CSS variables directly to your project files with one click
- **Smart Project Detection** - Auto-detects Next.js, Vite, Astro, and other frameworks
- **Keyboard Navigation** - Arrow keys to browse options
- **Mouse Wheel Support** - Scroll through themes and fonts
- **Framework Agnostic** - Works with plain CSS, Tailwind, or any CSS framework

## Installation

```bash
npm install theme-forseen
```

## Setup

Use these CSS variables in your stylesheets:

```
--color-primary
--color-primary-shadow
--color-accent
--color-accent-shadow
--color-bg
--color-card-bg
--color-text
--color-extra
--font-heading
--font-body
```

## Simple Examples

### CDN On Simple HTML Page

```html
<!DOCTYPE html>
<html>
  <style>
    body {
      color: var(--color-text);
      background: var(--color-bg);
      font-family: var(--font-body);
    }
    h1 {
      color: var(--color-primary);
      font-family: var(--font-heading);
    }
  </style>
  <script type="module" src="https://unpkg.com/theme-forseen"></script>
  <body>
    <h1>Hello World</h1>
    <p>This is my first HTML page.</p>
  </body>
</html>
```

### Simple npm install Example

- `npm init my-app`
- `cd my-app`
- `npm install theme-forseen`
- `touch style.css`
- `style.css`:

```css
body {
  color: var(--color-text);
  background: var(--color-bg);
  font-family: var(--font-body);
}
h1 {
  color: var(--color-primary);
  font-family: var(--font-heading);
}
```

- `index.html`:

```html
<!DOCTYPE html>
<html>
  <link rel="stylesheet" href="style.css" />
  <script type="module">
    import "/node_modules/theme-forseen/dist/index.js";
  </script>
  <body>
    <h1>Hello World</h1>
    <p>This is my first HTML page.</p>
  </body>
</html>
```

- `npx serve .`

### Simple Tailwind v4 Example

- Create a placeholder vite app:

```
npm create vite@latest my-app -- --template vanilla
```

- `cd my-app`
- Delete the `src` folder. We don't need it for this simple demo.

```
rm -rf src
```

- Install the Tailwind and ThemeForseen packages:

```
npm install tailwindcss @tailwindcss/vite theme-forseen
```

- Change the `index.html` page to this simple site which uses some Tailwind utility classes:
- `npm install tailwindcss @tailwindcss/vite theme-forseen`
- `index.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="style.css" />
    <script
      type="module"
      src="/node_modules/theme-forseen/dist/index.js"
    ></script>
  </head>
  <body class="bg-bg text-text font-body">
    <h1 class="text-primary font-heading text-4xl">Hello World</h1>
    <p>This is my first Tailwind page.</p>
  </body>
</html>
```

- Create a vite config file:

```
touch vite.config.js
```

- Paste this into the `vite.config.js`:

```js
import tailwindcss from "@tailwindcss/vite";
export default { plugins: [tailwindcss()] };
```

- Create a stylesheet:

```
touch style.css
```

- In the stylesheet, import Tailwind and setup some of the css variables ThemeForseen needs.

```css
@import "tailwindcss";

@theme inline {
  --color-primary: var(--color-primary);
  --color-bg: var(--color-bg);
  --color-text: var(--color-text);
  --font-heading: var(--font-heading);
  --font-body: var(--font-body);
}
```

- Defining cusom css variables in `@theme` like the above code does allows us to use special Tailwind generated classes based on our variable names. So when we define `--color-primary` we can then use the `text-primary` Tailwind class. The Tailwind docs explain that in [Extending the default theme](https://tailwindcss.com/docs/theme#extending-the-default-theme).

- `npm run dev`

## Usage

The drawer auto-initializes when you import the module—no setup code needed.

### With a Bundler (Vite, Webpack, Parcel, etc.)

```html
<script type="module">
  import "theme-forseen";
</script>
```

### Without a Bundler (plain HTML)

If you're serving static HTML files without a bundler, use the full path:

```html
<script type="module">
  import "/node_modules/theme-forseen/dist/index.js";
</script>
```

Or use a CDN:

```html
<script type="module">
  import "https://unpkg.com/theme-forseen/dist/index.js";
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
import "theme-forseen";

function App() {
  return <div>Your app</div>;
}
```

## Styling with CSS Variables

ThemeForseen sets CSS variables on `<html>` at runtime. Use them in your CSS however you like.

### Plain CSS

No config needed. Just use the variables:

```css
h1 {
  color: var(--color-primary);
  font-family: var(--font-heading);
}

body {
  color: var(--color-text);
  background: var(--color-bg);
  font-family: var(--font-body);
}

.card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-accent);
}
```

### Tailwind CSS

To use Tailwind utility classes, map the CSS variables in your config.

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
        primary: "var(--color-primary)",
        "primary-shadow": "var(--color-primary-shadow)",
        accent: "var(--color-accent)",
        "accent-shadow": "var(--color-accent-shadow)",
        bg: "var(--color-bg)",
        "card-bg": "var(--color-card-bg)",
        text: "var(--color-text)",
        extra: "var(--color-extra)",
      },
    },
    fontFamily: {
      heading: ["var(--font-heading)", "sans-serif"],
      body: ["var(--font-body)", "sans-serif"],
    },
  },
};
```

#### Using Tailwind classes

Then use in your markup:

```html
<h1 class="font-heading text-primary">Hello World</h1>
<p class="font-body text-text bg-bg">Body text</p>
```

### Other CSS Frameworks

Any CSS framework that supports CSS variables will work. Just reference the variables (see [CSS Variables Reference](#css-variables-reference) below).

## How to Use the Drawer

1. **Open**: Click the icon on the right side of the screen
2. **Browse Themes**: Click to apply, use arrow keys or mouse wheel to scroll
3. **Toggle Mode**: Switch between Light and Dark mode
4. **Browse Fonts**: Click any font pairing to apply it
5. **Activate**: Click the lightning bolt icon to apply the theme to your project (see [Dev Server](#dev-server) below)

## Dev Server

The dev server lets you write CSS variables directly to your project files with one click.

### Quick Start

```bash
# In your project directory
npx theme-forseen
```

This starts a local server that listens for theme activations. When you click the lightning bolt icon in the drawer, the CSS variables are written directly to your CSS file.

### How It Works

1. **Start the server** in your project directory
2. **Browse themes** in the drawer as usual
3. **Click the lightning bolt** - variables are written to your CSS file instantly
4. **No server running?** Falls back to showing a modal with the CSS to copy

### Smart Project Detection

The server automatically detects your project type and finds the right CSS file:

| Project Type | CSS File Location                          |
| ------------ | ------------------------------------------ |
| Next.js      | `src/app/globals.css` or `app/globals.css` |
| Vite         | `src/index.css` or `src/style.css`         |
| Astro        | `src/styles/global.css`                    |
| SvelteKit    | `src/app.css`                              |
| Nuxt         | `assets/css/main.css`                      |
| Plain HTML   | Parses `index.html` for stylesheet links   |

### Plain HTML Projects

For plain HTML projects, the server is extra smart:

- **One `<link rel="stylesheet">`** - Writes to that CSS file
- **No stylesheet but has `<style>` tag** - Appends to the inline styles
- **Multiple stylesheets** - Uses the first one (or looks for `main.css`, `style.css`, etc.)

### Generated CSS

The server writes CSS variables in this format:

```css
/* ThemeForseen Colors - Light Mode */
:root {
  --color-primary: #ff3366;
  --color-primary-shadow: #cc2952;
  --color-accent: #ffd600;
  --color-accent-shadow: #ccab00;
  --color-bg: #ffffff;
  --color-card-bg: #fff8f0;
  --color-text: #1a1a1a;
  --color-extra: #ff6b00;
}
/* End ThemeForseen */
```

Subsequent activations update the existing block without duplicating.

### Server Options

```bash
npx theme-forseen          # Start the server
npx theme-forseen --help   # Show help
npx theme-forseen -v       # Show version
```

The server runs on port 3847 by default.

## CSS Variables Reference

### Colors

| Variable                                 | Description                        |
| ---------------------------------------- | ---------------------------------- |
| `--color-primary`                        | Primary brand color                |
| `--color-primary-shadow`                 | Darker shade of primary            |
| `--color-accent`                         | Accent/secondary color             |
| `--color-accent-shadow`                  | Darker shade of accent             |
| `--color-bg`                             | Background color                   |
| `--color-card-bg`                        | Card/surface background            |
| `--color-text`                           | Main text color                    |
| `--color-extra`                          | Additional accent color            |
| `--color-h1`, `--color-h2`, `--color-h3` | Heading colors                     |
| `--color-heading`                        | General heading color (same as h1) |
| `--primary-color`                        | Alias for `--color-primary`        |
| `--secondary-color`                      | Alias for `--color-accent`         |

### Fonts

| Variable         | Description                |
| ---------------- | -------------------------- |
| `--font-heading` | Font family for headings   |
| `--font-body`    | Font family for body text  |
| `--heading-font` | Alias for `--font-heading` |
| `--body-font`    | Alias for `--font-body`    |

## Customization

Add your own themes by editing `src/themes.ts`:

```typescript
export const colorThemes: ColorTheme[] = [
  {
    name: "My Custom Theme",
    light: {
      primary: "#FF0000",
      primaryShadow: "#CC0000",
      accent: "#00FF00",
      accentShadow: "#00CC00",
      background: "#FFFFFF",
      cardBackground: "#F5F5F5",
      text: "#333333",
      extra: "#0000FF",
      h1Color: "primary",
      h2Color: "primary",
      h3Color: "accent",
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

### Local Testing

To test the drawer locally:

```bash
npx serve . -l 3000
```

Then open http://localhost:3000/tests/fixtures

### Running Tests

```bash
npm test           # Run all tests
npm run test:ui    # Run with Playwright UI
npm run test:headed # Run in headed browser
```

## Contributing

Contributions welcome!

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Open a PR to `main`

PRs require all tests to pass before merging. Tests run automatically when you open a PR.

## How It Works

ThemeForseen sets [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) (CSS variables) on `<html>` when you select themes. Your CSS references these variables, so colors and fonts update instantly. Works with plain CSS, Tailwind, or any CSS framework.

Built as a vanilla [Web Component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components), so it works with any framework (React, Vue, Svelte, Astro, plain HTML, etc.).

## License

MIT
