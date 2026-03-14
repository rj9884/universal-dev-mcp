import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs";
import * as path from "path";
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
