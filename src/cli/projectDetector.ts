import * as fs from "fs";
import * as path from "path";
import type { ProjectInfo, ProjectType, CssTarget } from "./types.js";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function readPackageJson(rootDir: string): PackageJson | null {
  const pkgPath = path.join(rootDir, "package.json");
  if (!fs.existsSync(pkgPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch {
    return null;
  }
}

function hasDependency(pkg: PackageJson | null, name: string): boolean {
  if (!pkg) return false;
  return !!(pkg.dependencies?.[name] || pkg.devDependencies?.[name]);
}

function detectProjectType(rootDir: string): ProjectType {
  const pkg = readPackageJson(rootDir);

  // Check for specific frameworks
  if (hasDependency(pkg, "next")) return "nextjs";
  if (hasDependency(pkg, "nuxt")) return "nuxt";
  if (hasDependency(pkg, "@remix-run/react")) return "remix";
  if (hasDependency(pkg, "astro")) return "astro";
  if (hasDependency(pkg, "svelte")) return "svelte";
  if (hasDependency(pkg, "vite")) return "vite";

  // Check for config files as fallback
  if (fs.existsSync(path.join(rootDir, "next.config.js")) ||
      fs.existsSync(path.join(rootDir, "next.config.mjs")) ||
      fs.existsSync(path.join(rootDir, "next.config.ts"))) {
    return "nextjs";
  }
  if (fs.existsSync(path.join(rootDir, "vite.config.js")) ||
      fs.existsSync(path.join(rootDir, "vite.config.ts"))) {
    return "vite";
  }
  if (fs.existsSync(path.join(rootDir, "astro.config.mjs")) ||
      fs.existsSync(path.join(rootDir, "astro.config.js"))) {
    return "astro";
  }
  if (fs.existsSync(path.join(rootDir, "svelte.config.js"))) {
    return "svelte";
  }
  if (fs.existsSync(path.join(rootDir, "nuxt.config.js")) ||
      fs.existsSync(path.join(rootDir, "nuxt.config.ts"))) {
    return "nuxt";
  }

  // Check for plain HTML
  if (fs.existsSync(path.join(rootDir, "index.html"))) {
    return "plain";
  }

  return "unknown";
}

function hasTailwind(rootDir: string): boolean {
  return (
    fs.existsSync(path.join(rootDir, "tailwind.config.js")) ||
    fs.existsSync(path.join(rootDir, "tailwind.config.ts")) ||
    fs.existsSync(path.join(rootDir, "tailwind.config.mjs"))
  );
}

interface HtmlStyleInfo {
  stylesheetLinks: string[]; // Relative paths to CSS files
  hasInlineStyle: boolean;
  htmlFile: string;
}

function parseHtmlForStyles(rootDir: string): HtmlStyleInfo | null {
  // Look for common HTML entry points
  const htmlFiles = ["index.html", "public/index.html", "src/index.html"];

  for (const htmlFile of htmlFiles) {
    const fullPath = path.join(rootDir, htmlFile);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const content = fs.readFileSync(fullPath, "utf8");

      // Find stylesheet links - match <link rel="stylesheet" href="...">
      const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
      const linkRegex2 = /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi;

      const stylesheetLinks: string[] = [];
      let match;

      while ((match = linkRegex.exec(content)) !== null) {
        const href = match[1];
        // Only include local files, not CDN links
        if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("//")) {
          stylesheetLinks.push(href);
        }
      }

      while ((match = linkRegex2.exec(content)) !== null) {
        const href = match[1];
        if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("//")) {
          // Avoid duplicates
          if (!stylesheetLinks.includes(href)) {
            stylesheetLinks.push(href);
          }
        }
      }

      // Check for inline <style> tag in head
      const hasInlineStyle = /<head[^>]*>[\s\S]*<style[^>]*>[\s\S]*<\/style>[\s\S]*<\/head>/i.test(content);

      return {
        stylesheetLinks,
        hasInlineStyle,
        htmlFile,
      };
    } catch {
      continue;
    }
  }

  return null;
}

function findCssTargetForPlainHtml(rootDir: string): CssTarget | null {
  const htmlInfo = parseHtmlForStyles(rootDir);

  if (!htmlInfo) return null;

  // If there's exactly one stylesheet link, use that file
  if (htmlInfo.stylesheetLinks.length === 1) {
    const cssPath = htmlInfo.stylesheetLinks[0];
    // Resolve relative to HTML file location or root
    const htmlDir = path.dirname(htmlInfo.htmlFile);
    const resolvedPath = cssPath.startsWith("/")
      ? cssPath.slice(1) // Remove leading slash
      : path.join(htmlDir, cssPath);

    // Verify the file exists
    if (fs.existsSync(path.join(rootDir, resolvedPath))) {
      return { type: "file", path: resolvedPath };
    }
    // If file doesn't exist but is referenced, we can create it
    return { type: "file", path: resolvedPath };
  }

  // If no stylesheet links but has inline style, write to HTML inline
  if (htmlInfo.stylesheetLinks.length === 0 && htmlInfo.hasInlineStyle) {
    return { type: "inline", path: htmlInfo.htmlFile };
  }

  // If multiple stylesheets, try to find the most likely main one
  if (htmlInfo.stylesheetLinks.length > 1) {
    const priorities = ["main.css", "style.css", "styles.css", "global.css", "app.css"];
    for (const priority of priorities) {
      const match = htmlInfo.stylesheetLinks.find(link =>
        link.toLowerCase().endsWith(priority)
      );
      if (match) {
        const htmlDir = path.dirname(htmlInfo.htmlFile);
        const resolvedPath = match.startsWith("/")
          ? match.slice(1)
          : path.join(htmlDir, match);
        return { type: "file", path: resolvedPath };
      }
    }
    // Fall back to first stylesheet
    const firstLink = htmlInfo.stylesheetLinks[0];
    const htmlDir = path.dirname(htmlInfo.htmlFile);
    const resolvedPath = firstLink.startsWith("/")
      ? firstLink.slice(1)
      : path.join(htmlDir, firstLink);
    return { type: "file", path: resolvedPath };
  }

  return null;
}

function findExistingCssFiles(rootDir: string, projectType: ProjectType): string[] {
  const candidates: string[] = [];

  // Framework-specific locations (ordered by preference)
  const frameworkPaths: Record<ProjectType, string[]> = {
    nextjs: [
      "src/app/globals.css",
      "app/globals.css",
      "src/styles/globals.css",
      "styles/globals.css",
    ],
    vite: [
      "src/index.css",
      "src/style.css",
      "src/styles/index.css",
      "src/App.css",
    ],
    astro: [
      "src/styles/global.css",
      "src/styles/globals.css",
      "src/styles/main.css",
    ],
    svelte: [
      "src/app.css",
      "src/global.css",
      "src/styles/global.css",
    ],
    nuxt: [
      "assets/css/main.css",
      "assets/main.css",
      "assets/css/global.css",
    ],
    remix: [
      "app/styles/global.css",
      "app/root.css",
      "app/styles.css",
    ],
    plain: [
      "styles.css",
      "style.css",
      "css/styles.css",
      "css/style.css",
      "css/main.css",
      "index.css",
    ],
    unknown: [
      "src/styles.css",
      "src/index.css",
      "styles.css",
      "style.css",
      "css/styles.css",
    ],
  };

  const pathsToCheck = frameworkPaths[projectType] || frameworkPaths.unknown;

  for (const relativePath of pathsToCheck) {
    const fullPath = path.join(rootDir, relativePath);
    if (fs.existsSync(fullPath)) {
      candidates.push(relativePath);
    }
  }

  return candidates;
}

export function detectProject(rootDir: string = process.cwd()): ProjectInfo {
  const type = detectProjectType(rootDir);
  const cssFiles = findExistingCssFiles(rootDir, type);

  // Determine the best CSS target
  let cssTarget: CssTarget | null = null;

  if (type === "plain" || type === "unknown") {
    // For plain HTML, try to parse the HTML file for stylesheets
    cssTarget = findCssTargetForPlainHtml(rootDir);
  }

  // If no target from HTML parsing, use first existing CSS file
  if (!cssTarget && cssFiles.length > 0) {
    cssTarget = { type: "file", path: cssFiles[0] };
  }

  return {
    type,
    rootDir,
    cssFiles,
    cssTarget,
    hasTailwind: hasTailwind(rootDir),
  };
}

export function getDefaultCssPath(projectType: ProjectType): string {
  const defaults: Record<ProjectType, string> = {
    nextjs: "src/app/globals.css",
    vite: "src/index.css",
    astro: "src/styles/global.css",
    svelte: "src/app.css",
    nuxt: "assets/css/main.css",
    remix: "app/styles/global.css",
    plain: "styles.css",
    unknown: "src/styles/theme-forseen.css",
  };
  return defaults[projectType];
}

export function getImportInstruction(
  projectType: ProjectType,
  cssPath: string
): string {
  switch (projectType) {
    case "nextjs":
      return `Add to your layout.tsx or _app.tsx:\nimport './${cssPath.replace(/^src\//, '')}';`;
    case "vite":
      return `Add to your main.tsx or main.ts:\nimport './${cssPath.replace(/^src\//, '')}';`;
    case "astro":
      return `Add to your Layout.astro:\nimport '${cssPath}';`;
    case "svelte":
      return `Add to your +layout.svelte or App.svelte:\nimport './${cssPath.replace(/^src\//, '')}';`;
    case "nuxt":
      return `Add to nuxt.config.ts:\ncss: ['~/${cssPath}']`;
    case "remix":
      return `Add to your root.tsx links function:\n{ rel: 'stylesheet', href: '/${cssPath}' }`;
    case "plain":
      return `Add to your HTML <head>:\n<link rel="stylesheet" href="${cssPath}">`;
    default:
      return `Import this CSS file in your application entry point.`;
  }
}
