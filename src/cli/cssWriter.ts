import * as fs from "fs";
import * as path from "path";
import type { ThemeColors, CssTarget } from "./types.js";

const START_MARKER = "/* ThemeForseen Colors";
const END_MARKER = "/* End ThemeForseen */";

export interface WriteResult {
  success: boolean;
  message: string;
  created: boolean;
  isInline?: boolean;
}

function generateCssBlock(colors: ThemeColors, isDarkMode: boolean): string {
  const modeLabel = isDarkMode ? "Dark Mode" : "Light Mode";
  return `/* ThemeForseen Colors - ${modeLabel} */
:root {
  --color-primary: ${colors.primary};
  --color-primary-shadow: ${colors.primaryShadow};
  --color-accent: ${colors.accent};
  --color-accent-shadow: ${colors.accentShadow};
  --color-bg: ${colors.background};
  --color-card-bg: ${colors.cardBackground};
  --color-text: ${colors.text};
  --color-extra: ${colors.extra};
}
/* End ThemeForseen */`;
}

function generateFontCssBlock(fontFamily: string): string {
  return `/* ThemeForseen Font */
:root {
  --font-family: ${fontFamily};
}
/* End ThemeForseen */`;
}

function removeExistingThemeForseenBlock(content: string): string {
  // Find and remove any existing ThemeForseen block
  const startIdx = content.indexOf(START_MARKER);
  if (startIdx === -1) return content;

  const endIdx = content.indexOf(END_MARKER, startIdx);
  if (endIdx === -1) return content;

  const before = content.slice(0, startIdx).trimEnd();
  const after = content.slice(endIdx + END_MARKER.length).trimStart();

  // Rejoin with proper spacing
  if (before && after) {
    return before + "\n\n" + after;
  }
  return before || after;
}

function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function writeThemeToCss(
  cssPath: string,
  colors: ThemeColors,
  isDarkMode: boolean
): WriteResult {
  const absolutePath = path.isAbsolute(cssPath)
    ? cssPath
    : path.join(process.cwd(), cssPath);

  const newBlock = generateCssBlock(colors, isDarkMode);
  let created = false;

  try {
    let existingContent = "";

    if (fs.existsSync(absolutePath)) {
      existingContent = fs.readFileSync(absolutePath, "utf8");
    } else {
      created = true;
      ensureDirectoryExists(absolutePath);
    }

    // Remove any existing ThemeForseen block
    const cleanedContent = removeExistingThemeForseenBlock(existingContent);

    // Add new block at the beginning (after any existing content)
    let newContent: string;
    if (cleanedContent.trim()) {
      // Check if there's already a :root at the start
      const hasRootAtStart = cleanedContent.trimStart().startsWith(":root");
      if (hasRootAtStart) {
        // Put ThemeForseen before existing :root
        newContent = newBlock + "\n\n" + cleanedContent;
      } else {
        // Put ThemeForseen at the top
        newContent = newBlock + "\n\n" + cleanedContent;
      }
    } else {
      newContent = newBlock + "\n";
    }

    fs.writeFileSync(absolutePath, newContent, "utf8");

    return {
      success: true,
      message: created
        ? `Created ${cssPath} with theme colors`
        : `Updated ${cssPath} with theme colors`,
      created,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to write CSS: ${errMsg}`,
      created: false,
    };
  }
}

export function writeFontToCss(cssPath: string, fontFamily: string): WriteResult {
  const absolutePath = path.isAbsolute(cssPath)
    ? cssPath
    : path.join(process.cwd(), cssPath);

  const newBlock = generateFontCssBlock(fontFamily);
  let created = false;

  try {
    let existingContent = "";

    if (fs.existsSync(absolutePath)) {
      existingContent = fs.readFileSync(absolutePath, "utf8");
    } else {
      created = true;
      ensureDirectoryExists(absolutePath);
    }

    // For fonts, we look for existing font block specifically
    const fontStartMarker = "/* ThemeForseen Font";
    const startIdx = existingContent.indexOf(fontStartMarker);

    let cleanedContent: string;
    if (startIdx !== -1) {
      const endIdx = existingContent.indexOf(END_MARKER, startIdx);
      if (endIdx !== -1) {
        const before = existingContent.slice(0, startIdx).trimEnd();
        const after = existingContent.slice(endIdx + END_MARKER.length).trimStart();
        cleanedContent = before && after ? before + "\n\n" + after : before || after;
      } else {
        cleanedContent = existingContent;
      }
    } else {
      cleanedContent = existingContent;
    }

    // Add font block
    let newContent: string;
    if (cleanedContent.trim()) {
      newContent = cleanedContent + "\n\n" + newBlock;
    } else {
      newContent = newBlock + "\n";
    }

    fs.writeFileSync(absolutePath, newContent, "utf8");

    return {
      success: true,
      message: created
        ? `Created ${cssPath} with font family`
        : `Updated ${cssPath} with font family`,
      created,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to write CSS: ${errMsg}`,
      created: false,
    };
  }
}

function writeToInlineStyle(
  htmlPath: string,
  cssContent: string,
  markerPrefix: string
): WriteResult {
  const absolutePath = path.isAbsolute(htmlPath)
    ? htmlPath
    : path.join(process.cwd(), htmlPath);

  try {
    if (!fs.existsSync(absolutePath)) {
      return {
        success: false,
        message: `HTML file not found: ${htmlPath}`,
        created: false,
      };
    }

    let htmlContent = fs.readFileSync(absolutePath, "utf8");

    // Find the first <style> tag in the document
    const styleTagMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);

    if (!styleTagMatch) {
      return {
        success: false,
        message: `No <style> tag found in ${htmlPath}`,
        created: false,
      };
    }

    const fullStyleTag = styleTagMatch[0];
    let styleContent = styleTagMatch[1];

    // Remove any existing ThemeForseen block from the style content
    const startIdx = styleContent.indexOf(markerPrefix);
    if (startIdx !== -1) {
      const endIdx = styleContent.indexOf(END_MARKER, startIdx);
      if (endIdx !== -1) {
        const before = styleContent.slice(0, startIdx).trimEnd();
        const after = styleContent.slice(endIdx + END_MARKER.length).trimStart();
        styleContent = before && after ? before + "\n" + after : before || after;
      }
    }

    // Append the new CSS content
    const newStyleContent = styleContent.trim()
      ? styleContent.trimEnd() + "\n\n" + cssContent
      : cssContent;

    // Reconstruct the style tag
    const newStyleTag = fullStyleTag.replace(styleTagMatch[1], "\n" + newStyleContent + "\n");

    // Replace in HTML
    htmlContent = htmlContent.replace(fullStyleTag, newStyleTag);

    fs.writeFileSync(absolutePath, htmlContent, "utf8");

    return {
      success: true,
      message: `Updated inline styles in ${htmlPath}`,
      created: false,
      isInline: true,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to write inline CSS: ${errMsg}`,
      created: false,
    };
  }
}

export function writeThemeToTarget(
  target: CssTarget,
  colors: ThemeColors,
  isDarkMode: boolean
): WriteResult {
  const cssBlock = generateCssBlock(colors, isDarkMode);

  if (target.type === "inline") {
    return writeToInlineStyle(target.path, cssBlock, START_MARKER);
  }

  return writeThemeToCss(target.path, colors, isDarkMode);
}

export function writeFontToTarget(
  target: CssTarget,
  fontFamily: string
): WriteResult {
  const cssBlock = generateFontCssBlock(fontFamily);

  if (target.type === "inline") {
    return writeToInlineStyle(target.path, cssBlock, "/* ThemeForseen Font");
  }

  return writeFontToCss(target.path, fontFamily);
}
