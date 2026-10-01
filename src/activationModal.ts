import type { ColorTheme } from "./themes.js";
import { generateTailwindColorConfig, generateFontCSS } from "./codeGenerators.js";

type ThemeColors = ColorTheme["light"] | ColorTheme["dark"];

/** One file's worth of the selection, with what to call it when saved */
export interface ActivationSection {
  title: string;
  filename: string;
  suggestedName: string;
  accept: Record<string, string[]>;
  code: string;
}

export function activationSections(
  colors: ThemeColors,
  fonts: { heading: string; body: string }
): ActivationSection[] {
  return [
    {
      title: "Colors",
      filename: "tailwind.config.js (or .ts, .mjs)",
      suggestedName: "tailwind.config.js",
      accept: { "text/javascript": [".js", ".ts", ".mjs"] },
      code: generateTailwindColorConfig(colors),
    },
    {
      title: "Fonts",
      filename: "src/styles/fonts.css (or wherever your styles live)",
      suggestedName: "fonts.css",
      accept: { "text/css": [".css"] },
      code: generateFontCSS(fonts.heading, fonts.body),
    },
  ];
}

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function showActivationModal(shadowRoot: ShadowRoot, sections: ActivationSection[]): void {
  const modal = shadowRoot.querySelector<HTMLDialogElement>(".activation-modal");
  const instructions = shadowRoot.querySelector(".activation-instructions");
  const container = shadowRoot.querySelector(".activation-sections");
  if (!modal || !instructions || !container) return;

  instructions.innerHTML =
    "Run <code>npx theme-forseen</code> in your project and Apply writes these for you. Until then, copy each block into its file, or save it.";

  container.innerHTML = sections
    .map(
      (section, i) => `
      <div class="activation-section" data-section="${i}">
        <div class="activation-code-header">
          <div>
            <div class="activation-code-title">${section.title}</div>
            <div class="activation-code-filename">${escape(section.filename)}</div>
          </div>
          <div class="activation-code-actions">
            <button class="activation-copy-btn">Copy</button>
            <button class="activation-save-btn">Save to File</button>
          </div>
        </div>
        <pre class="activation-code-block"><code class="activation-code">${escape(section.code)}</code></pre>
      </div>`
    )
    .join("");

  container.querySelectorAll<HTMLElement>(".activation-section").forEach((element, i) => {
    const section = sections[i];
    const copy = element.querySelector(".activation-copy-btn") as HTMLButtonElement;
    const save = element.querySelector(".activation-save-btn") as HTMLButtonElement;

    copy.addEventListener("click", async () => {
      await navigator.clipboard.writeText(section.code);
      flash(copy, "Copied!", "copied");
    });

    save.addEventListener("click", () => saveToFile(section, save));
  });

  // The top layer: above everything on the page, whatever the drawer is docked inside
  if (!modal.open) modal.showModal();
}

function flash(button: HTMLButtonElement, label: string, className: string) {
  const original = button.textContent;
  button.textContent = label;
  button.classList.add(className);
  setTimeout(() => {
    button.textContent = original;
    button.classList.remove(className);
  }, 2000);
}

interface FilePickerWindow extends Window {
  showSaveFilePicker(options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }): Promise<{ createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }> }>;
}

async function saveToFile(section: ActivationSection, button: HTMLButtonElement): Promise<void> {
  if (!("showSaveFilePicker" in window)) {
    alert("This browser cannot save files from a page. Copy the code instead.");
    return;
  }

  try {
    const handle = await (window as unknown as FilePickerWindow).showSaveFilePicker({
      suggestedName: section.suggestedName,
      types: [{ description: "Code", accept: section.accept }],
    });
    const writable = await handle.createWritable();
    await writable.write(section.code);
    await writable.close();
    flash(button, "Saved!", "saved");
  } catch (error) {
    if ((error as Error).name !== "AbortError") {
      console.error("[ThemeForseen] Could not save the file.", error);
      alert("The file could not be saved. Copy the code instead.");
    }
  }
}
