import dotenv from "dotenv";
import * as path from "path";

dotenv.config();

export const PROJECT_ROOT: string = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : process.cwd();

export const ALLOWED_PORTS: number[] = (
  process.env.ALLOWED_PORTS || "3000,5173,8080,4200,4000"
)
  .split(",")
  .map((p) => parseInt(p.trim(), 10))
  .filter((p) => !isNaN(p));

/**
 * "npm run" (no script name) is intentionally bare: isCommandAllowed does a
 * prefix match, so this permits "npm run <any-script-in-package.json>"
 * without needing every script name listed individually.
 */
const DEFAULT_ALLOWED_COMMANDS = [
  // npm
  "npm install",
  "npm ci",
  "npm run",
  "npm test",
  "npm outdated",
  "npm audit",
  "npm list",
  "npm --version",
  // npx (curated — npx can execute arbitrary published packages, so this
  // stays a specific list rather than a bare "npx" prefix)
  "npx tsc --noEmit",
  "npx eslint",
  "npx prettier --check",
  "npx playwright test",
  "npx vitest",
  "npx jest",
  "npx next build",
  "npx next lint",
  // yarn / pnpm (for projects that use them instead of npm)
  "yarn install",
  "yarn build",
  "yarn test",
  "yarn lint",
  "pnpm install",
  "pnpm build",
  "pnpm test",
  "pnpm lint",
  // git (day-to-day workflow; excludes destructive ops like reset --hard,
  // clean -fd, and push --force by simply not listing them)
  "git status",
  "git diff",
  "git log",
  "git branch",
  "git show",
  "git remote -v",
  "git fetch",
  "git pull",
  "git add",
  "git commit",
  "git stash",
  "git checkout",
  "git push",
  // python
  "python -m venv",
  "python -m pytest",
  "pytest",
  "pip install",
  "pip list",
  "pip freeze",
  "python --version",
  // docker
  "docker compose up",
  "docker compose down",
  "docker compose build",
  "docker compose ps",
  "docker ps",
  "docker --version",
  // misc
  "node --version",
].join(",");

export const ALLOWED_COMMANDS: string[] = (
  process.env.ALLOWED_COMMANDS || DEFAULT_ALLOWED_COMMANDS
)
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

export const ALLOWED_WRITE_DIRS: string[] = (
  process.env.ALLOWED_WRITE_DIRS || PROJECT_ROOT
)
  .split(",")
  .map((d) => path.resolve(d.trim()));

export const BACKUP_DIR: string = path.join(PROJECT_ROOT, ".mcp-backups");

export const HTTP_PORT: number = parseInt(
  process.env.HTTP_PORT || "3333",
  10
);

export const API_KEY: string = process.env.MCP_API_KEY || "";

/** Validates config at startup and logs warnings for suspicious values. */
export function validateConfig(): void {
  const invalidPorts = (process.env.ALLOWED_PORTS || "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && isNaN(parseInt(p, 10)));

  if (invalidPorts.length > 0) {
    console.error(
      `[config] WARNING: Invalid port(s) in ALLOWED_PORTS (ignored): ${invalidPorts.join(", ")}`
    );
  }

  if (ALLOWED_PORTS.length === 0) {
    console.error(
      "[config] WARNING: No valid ports in ALLOWED_PORTS. API and browser tools will be disabled."
    );
  }

  if (ALLOWED_COMMANDS.length === 0) {
    console.error(
      "[config] WARNING: No valid commands in ALLOWED_COMMANDS. run_command tool will be disabled."
    );
  }

  if (!API_KEY) {
    console.error(
      "[config] WARNING: MCP_API_KEY is not set. The HTTP server is running without authentication."
    );
  }
}
