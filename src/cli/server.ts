import * as http from "http";
import { detectProject, getDefaultCssPath, getImportInstruction } from "./projectDetector.js";
import { writeThemeToTarget, writeFontToTarget } from "./cssWriter.js";
import type { ApplyRequest, ApplyResponse, HealthResponse, ProjectInfo, CssTarget } from "./types.js";

const PORT = 3847;
const VERSION = "1.0.0";

let cachedProjectInfo: ProjectInfo | null = null;

function getProjectInfo(): ProjectInfo {
  if (!cachedProjectInfo) {
    cachedProjectInfo = detectProject();
  }
  return cachedProjectInfo;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

function sendJson(
  res: http.ServerResponse,
  statusCode: number,
  data: unknown
): void {
  res.writeHead(statusCode, corsHeaders());
  res.end(JSON.stringify(data));
}

function handleHealth(res: http.ServerResponse): void {
  const project = getProjectInfo();
  const cssTarget = project.cssTarget;
  const response: HealthResponse = {
    status: "ok",
    version: VERSION,
    projectType: project.type,
    cssFile: cssTarget ? cssTarget.path : null,
  };
  sendJson(res, 200, response);
}

function handleApply(req: http.IncomingMessage, res: http.ServerResponse): void {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const request: ApplyRequest = JSON.parse(body);
      const project = getProjectInfo();

      // Determine CSS target to use
      let target: CssTarget;

      if (project.cssTarget) {
        target = project.cssTarget;
      } else {
        // Fall back to creating a default CSS file
        target = { type: "file", path: getDefaultCssPath(project.type) };
      }

      let result: ApplyResponse;

      if (request.type === "theme" && request.data.colors) {
        const writeResult = writeThemeToTarget(
          target,
          request.data.colors,
          request.data.isDarkMode || false
        );

        result = {
          success: writeResult.success,
          message: writeResult.message,
          file: target.path,
          projectType: project.type,
          created: writeResult.created,
        };

        if (writeResult.created) {
          result.importInstruction = getImportInstruction(project.type, target.path);
        }
      } else if (request.type === "font" && request.data.font) {
        const writeResult = writeFontToTarget(target, request.data.font);

        result = {
          success: writeResult.success,
          message: writeResult.message,
          file: target.path,
          projectType: project.type,
          created: writeResult.created,
        };

        if (writeResult.created) {
          result.importInstruction = getImportInstruction(project.type, target.path);
        }
      } else {
        result = {
          success: false,
          message: "Invalid request: must specify type (theme/font) and corresponding data",
        };
      }

      sendJson(res, result.success ? 200 : 400, result);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      sendJson(res, 400, {
        success: false,
        message: `Failed to parse request: ${errMsg}`,
      });
    }
  });
}

function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  const url = req.url || "/";
  const method = req.method || "GET";

  // Handle CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  // Route requests
  if (url === "/api/health" && method === "GET") {
    handleHealth(res);
  } else if (url === "/api/apply" && method === "POST") {
    handleApply(req, res);
  } else {
    sendJson(res, 404, { error: "Not found" });
  }
}

export function startServer(): void {
  const project = getProjectInfo();

  const server = http.createServer(handleRequest);

  server.listen(PORT, () => {
    console.log("");
    console.log("  \x1b[36m╔═══════════════════════════════════════╗\x1b[0m");
    console.log("  \x1b[36m║\x1b[0m   \x1b[1m\x1b[33m⚡ ThemeForseen Dev Server ⚡\x1b[0m        \x1b[36m║\x1b[0m");
    console.log("  \x1b[36m╚═══════════════════════════════════════╝\x1b[0m");
    console.log("");
    console.log(`  \x1b[2mServer running on\x1b[0m \x1b[1mhttp://localhost:${PORT}\x1b[0m`);
    console.log("");
    console.log(`  \x1b[2mProject type:\x1b[0m  \x1b[1m${project.type}\x1b[0m`);

    if (project.cssTarget) {
      if (project.cssTarget.type === "inline") {
        console.log(`  \x1b[2mCSS target:\x1b[0m    \x1b[1m<style> in ${project.cssTarget.path}\x1b[0m`);
      } else {
        console.log(`  \x1b[2mCSS target:\x1b[0m    \x1b[1m${project.cssTarget.path}\x1b[0m`);
      }
    } else {
      console.log(`  \x1b[2mCSS target:\x1b[0m    \x1b[33mWill create ${getDefaultCssPath(project.type)}\x1b[0m`);
    }

    if (project.hasTailwind) {
      console.log(`  \x1b[2mTailwind:\x1b[0m      \x1b[32m✓ detected\x1b[0m`);
    }
    console.log("");
    console.log("  \x1b[2mClick the ⚡ in ThemeForseen to apply themes directly!\x1b[0m");
    console.log("  \x1b[2mPress Ctrl+C to stop\x1b[0m");
    console.log("");
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`\x1b[31mError: Port ${PORT} is already in use.\x1b[0m`);
      console.error("Another ThemeForseen server may be running.");
      process.exit(1);
    }
    throw error;
  });
}
