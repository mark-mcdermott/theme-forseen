export type ProjectType =
  | "nextjs"
  | "vite"
  | "astro"
  | "svelte"
  | "nuxt"
  | "remix"
  | "plain"
  | "unknown";

export interface CssTarget {
  type: "file" | "inline";
  path: string; // CSS file path OR HTML file path for inline
}

export interface ProjectInfo {
  type: ProjectType;
  rootDir: string;
  cssFiles: string[];
  cssTarget: CssTarget | null; // The best target for writing CSS
  hasTailwind: boolean;
}

export interface ThemeColors {
  primary: string;
  primaryShadow: string;
  accent: string;
  accentShadow: string;
  background: string;
  cardBackground: string;
  text: string;
  extra: string;
}

export interface ApplyRequest {
  type: "theme" | "font";
  data: {
    colors?: ThemeColors;
    font?: string;
    isDarkMode?: boolean;
  };
}

export interface ApplyResponse {
  success: boolean;
  message: string;
  file?: string;
  projectType?: ProjectType;
  created?: boolean;
  importInstruction?: string;
}

export interface HealthResponse {
  status: "ok";
  version: string;
  projectType: ProjectType;
  cssFile: string | null;
}
