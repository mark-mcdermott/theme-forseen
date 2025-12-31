import { startServer } from "./server.js";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
  ThemeForseen Dev Server

  Usage:
    npx theme-forseen       Start the dev server
    npx theme-forseen -h    Show this help

  The server runs on port 3847 and allows ThemeForseen's
  lightning bolt (⚡) button to write CSS variables directly
  to your project's CSS file.

  It automatically detects your project type (Next.js, Vite,
  Astro, etc.) and writes to the appropriate CSS file.
`);
  process.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
  console.log("1.0.0");
  process.exit(0);
}

startServer();
