import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process";
import { PROJECT_ROOT, ALLOWED_PORTS, ALLOWED_COMMANDS } from "../config.js";
import { getFileTree } from "../utils/fs.js";

const CONFIG_FILES = [
  "tsconfig.json",
  "tsconfig.base.json",
  "vite.config.ts",
  "vite.config.js",
  "next.config.js",
  "next.config.ts",
  "next.config.mjs",
  "webpack.config.js",
  "webpack.config.ts",
  ".eslintrc.json",
  ".eslintrc.js",
  ".eslintrc.cjs",
  "eslint.config.js",
  "eslint.config.ts",
  "tailwind.config.js",
  "tailwind.config.ts",
  "jest.config.js",
  "jest.config.ts",
  "vitest.config.ts",
  "vitest.config.js",
  "prettier.config.js",
  ".prettierrc",
  "docker-compose.yml",
  "docker-compose.yaml",
  "Dockerfile",
  ".env.example",
  ".env.local",
  "angular.json",
  "svelte.config.js",
  "nuxt.config.ts",
  "astro.config.mjs",
  "remix.config.js",
];

export function registerProjectTools(server: McpServer): void {

  // get_active_project 
  server.registerTool(
    "get_active_project",
    {
      description:
        "Shows which project is currently active — name, root path, package info, file count, and git branch. Use this to visually confirm which project the MCP server is connected to.",
      inputSchema: {},
    },
    async () => {
      const lines: string[] = [];

      let projName    = path.basename(PROJECT_ROOT);
      let projVersion = "";
      let projDesc    = "";
      const pkgPath   = path.join(PROJECT_ROOT, "package.json");
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
          projName    = pkg.name    || projName;
          projVersion = pkg.version || "";
          projDesc    = pkg.description || "";
        } catch { /* ignore */ }
      }

      // Count files (excluding node_modules and hidden dirs)
      let fileCount = 0;
      function countFiles(dir: string) {
        try {
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) countFiles(full);
            else fileCount++;
          }
        } catch { /* ignore */ }
      }
      countFiles(PROJECT_ROOT);

      // Get git branch
      let gitBranch = "(not a git repo)";
      try {
        const result = childProcess.execSync("git rev-parse --abbrev-ref HEAD", {
          cwd: PROJECT_ROOT,
          timeout: 3000,
          stdio: ["ignore", "pipe", "ignore"],
        });
        gitBranch = result.toString().trim();
      } catch { /* ignore */ }

      // Get last git commit
      let lastCommit = "";
      try {
        const result = childProcess.execSync('git log -1 --format="%h %s"', {
          cwd: PROJECT_ROOT,
          timeout: 3000,
          stdio: ["ignore", "pipe", "ignore"],
        });
        lastCommit = result.toString().trim();
      } catch { /* ignore */ }

      const rootExists = fs.existsSync(PROJECT_ROOT);
      const bar = "=".repeat(52);

      lines.push(bar);
      lines.push("  ACTIVE PROJECT");
      lines.push(bar);
      lines.push(`  Name     : ${projName}${projVersion ? " v" + projVersion : ""}`);
      if (projDesc) {
        lines.push(`  Desc     : ${projDesc}`);
      }
      lines.push(`  Root     : ${PROJECT_ROOT}`);
      lines.push(`  Exists   : ${rootExists ? "YES" : "NO - folder not found!"}`);
      lines.push(`  Files    : ${fileCount}`);
      lines.push(`  Git      : ${gitBranch}`);
      if (lastCommit) {
        lines.push(`  Commit   : ${lastCommit}`);
      }
      lines.push(bar);
      lines.push("  MCP Settings");
      lines.push(`  Ports    : ${ALLOWED_PORTS.join(", ")}`);
      lines.push(`  Commands : ${ALLOWED_COMMANDS.join(", ")}`);
      lines.push(bar);

      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );

  // get_project_info 
  server.registerTool(
    "get_project_info",
    {
      description:
        "Get a full overview of the project: package.json metadata, npm scripts, dependencies, detected config files, and a two-level file tree. Always call this first when starting to work on a new project.",
      inputSchema: {},
    },
    async () => {
      const lines: string[] = [`Project root: ${PROJECT_ROOT}`, ""];

      const pkgPath = path.join(PROJECT_ROOT, "package.json");
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

          lines.push("package.json");
          lines.push(`  Name:        ${pkg.name || "(unnamed)"}`);
          lines.push(`  Version:     ${pkg.version || "n/a"}`);
          lines.push(`  Description: ${pkg.description || "n/a"}`);

          const scripts = Object.entries<string>(pkg.scripts || {});
          if (scripts.length > 0) {
            lines.push("  Scripts:");
            scripts.forEach(([key, val]) =>
              lines.push(`    ${key}: ${val}`)
            );
          }

          const deps = Object.keys(pkg.dependencies || {});
          const devDeps = Object.keys(pkg.devDependencies || {});

          if (deps.length > 0) {
            lines.push(
              `  Dependencies (${deps.length}): ${deps.slice(0, 20).join(", ")}${deps.length > 20 ? ", ..." : ""}`
            );
          }

          if (devDeps.length > 0) {
            lines.push(
              `  Dev dependencies (${devDeps.length}): ${devDeps.slice(0, 20).join(", ")}${devDeps.length > 20 ? ", ..." : ""}`
            );
          }
        } catch {
          lines.push("  (Could not parse package.json)");
        }
      } else {
        lines.push("  package.json not found.");
      }

      const foundConfigs = CONFIG_FILES.filter((f) =>
        fs.existsSync(path.join(PROJECT_ROOT, f))
      );

      if (foundConfigs.length > 0) {
        lines.push("", "Detected config files:");
        foundConfigs.forEach((f) => lines.push(`  ${f}`));
      }

      lines.push("", "Project structure (2 levels):");
      lines.push(getFileTree(PROJECT_ROOT, 0, 2) || "  (empty)");

      lines.push("MCP server settings:");
      lines.push(`  Allowed ports:    ${ALLOWED_PORTS.join(", ")}`);
      lines.push(`  Allowed commands: ${ALLOWED_COMMANDS.join(", ")}`);

      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );
}
