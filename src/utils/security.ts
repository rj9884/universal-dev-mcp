import * as path from "path";
import {
  ALLOWED_PORTS,
  ALLOWED_COMMANDS,
  PROJECT_ROOT,
  ALLOWED_WRITE_DIRS,
} from "../config.js";


export function isPortAllowed(port: number): boolean {
  return ALLOWED_PORTS.includes(port);
}


export function isCommandAllowed(cmd: string): boolean {
  return ALLOWED_COMMANDS.some(
    (allowed) => cmd === allowed || cmd.startsWith(allowed + " ")
  );
}

/**
 * Blocks shell metacharacters that could be used to chain or inject
 * additional commands (e.g. "npm run build && rm -rf /"). This is checked
 * in addition to isCommandAllowed, since spawn() runs with shell: true
 * to support npm scripts on Windows, which would otherwise interpret them.
 * Backticks, $(), ;, &, |, >, <, and newlines are disallowed. A single
 * trailing "&" for backgrounding is also disallowed for simplicity.
 */
const SHELL_METACHARACTER_PATTERN = /[;&|`\n\r]|\$\(|<|>/;

export function hasShellInjectionRisk(cmd: string): boolean {
  return SHELL_METACHARACTER_PATTERN.test(cmd);
}

export function isPathAllowed(filePath: string, writeMode = false): boolean {
  const resolved = path.resolve(filePath);
  const dirs = writeMode ? ALLOWED_WRITE_DIRS : [PROJECT_ROOT];
  return dirs.some(
    (dir) => resolved === dir || resolved.startsWith(dir + path.sep)
  );
}

/**
 * Resolves an optional cwd argument (relative or absolute) against
 * PROJECT_ROOT and ensures the result stays inside the project root.
 * Returns null if the resolved path escapes PROJECT_ROOT.
 * Used by run_command so commands can target monorepo subfolders
 * (e.g. "frontend") without needing --prefix hacks that break local
 * binary resolution on Windows.
 */
export function resolveAllowedCwd(cwd?: string): string | null {
  const target = cwd && cwd.trim() ? cwd.trim() : PROJECT_ROOT;
  const resolved = path.isAbsolute(target)
    ? path.resolve(target)
    : path.resolve(PROJECT_ROOT, target);

  if (resolved !== PROJECT_ROOT && !resolved.startsWith(PROJECT_ROOT + path.sep)) {
    return null;
  }
  return resolved;
}

export function allowedPortsLabel(): string {
  return ALLOWED_PORTS.join(", ");
}


export function allowedCommandsLabel(): string {
  return ALLOWED_COMMANDS.map((c) => `  - ${c}`).join("\n");
}

export function allowedWriteDirsLabel(): string {
  return ALLOWED_WRITE_DIRS.join(", ");
}
