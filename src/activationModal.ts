import { colorThemes, fontPairings, type ColorTheme } from "./themes.js";
import { generateTailwindColorConfig, generateFontCSS } from "./codeGenerators.js";

type ThemeColors = ColorTheme["light"] | ColorTheme["dark"];

export interface ActivationContext {
  shadowRoot: ShadowRoot;
  isDarkMode: boolean;
  selectedHeadingFont: string | null;
  selectedBodyFont: string | null;
}

export function showActivationModal(
  type: "theme" | "font",
  index: number,
  context: ActivationContext
): void {
  const { shadowRoot, isDarkMode, selectedHeadingFont, selectedBodyFont } = context;

  const modal = shadowRoot.querySelector(".activation-modal");
  const instructions = shadowRoot.querySelector(".activation-instructions");
  const filename = shadowRoot.querySelector(".activation-code-filename");
  const code = shadowRoot.querySelector(".activation-code");
  const saveBtn = shadowRoot.querySelector(".activation-save-btn") as HTMLButtonElement;

  if (!modal || !instructions || !filename || !code || !saveBtn) return;

  let generatedCode = "";
  let targetFilename = "";
  let instructionText = "";

  if (type === "theme") {
    const theme = colorThemes[index];
    const colors: ThemeColors = isDarkMode ? theme.dark : theme.light;

    generatedCode = generateTailwindColorConfig(colors);
    targetFilename = "tailwind.config.js (or .ts, .mjs)";
    instructionText = `Add these color definitions to your Tailwind config file. If you don't have a tailwind.config.js file in your project root, please create one first. Click "Save to File" to select your config file, or copy the code and paste it manually.`;
  } else {
    const pairing = fontPairings[index];
    const headingFont = selectedHeadingFont || pairing.heading;
    const bodyFont = selectedBodyFont || pairing.body;

    generatedCode = generateFontCSS(headingFont, bodyFont);
    targetFilename = "src/styles/fonts.css (or your preferred location)";
    instructionText = `Add these font definitions to a CSS file in your project. We recommend creating a file like src/styles/fonts.css. Make sure to import this file in your main layout or global styles. Click "Save to File" to save, or copy the code and paste it manually.`;
  }

  instructions.textContent = instructionText;
  filename.textContent = targetFilename;
  code.textContent = generatedCode;

  // Store the generated code and filename for the save function
  (saveBtn as any)._generatedCode = generatedCode;
  (saveBtn as any)._targetFilename = targetFilename;

  modal.classList.remove("hidden");
}

export async function handleSaveToFile(shadowRoot: ShadowRoot): Promise<void> {
  const saveBtn = shadowRoot.querySelector(".activation-save-btn") as any;
  if (!saveBtn || !saveBtn._generatedCode) return;

  const generatedCode = saveBtn._generatedCode;
  const targetFilename = saveBtn._targetFilename;

  // Check if File System Access API is supported
  if ("showSaveFilePicker" in window) {
    try {
      const suggestedName = targetFilename.includes("tailwind")
        ? "tailwind.config.js"
        : "fonts.css";

      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: suggestedName,
        types: [
          {
            description: "Code Files",
            accept: targetFilename.includes("tailwind")
              ? { "text/javascript": [".js", ".ts", ".mjs"] }
              : { "text/css": [".css"] },
          },
        ],
      });

      const writable = await fileHandle.createWritable();
      await writable.write(generatedCode);
      await writable.close();

      // Show success message
      saveBtn.textContent = "Saved!";
      saveBtn.style.background = "#4CAF50";
      setTimeout(() => {
        saveBtn.textContent = "Save to File";
        saveBtn.style.background = "";
      }, 2000);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error saving file:", err);
        alert("Error saving file. Please copy the code manually.");
      }
    }
  } else {
    alert(
      "File System Access API is not supported in your browser. Please copy the code manually and paste it into your file."
    );
  }
}
