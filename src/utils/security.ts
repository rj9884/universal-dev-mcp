import * as path from "path";
import {
  getAllowedPorts,
  getAllowedCommands,
  getProjectRoot,
  getAllowedWriteDirs,
} from "../config.js";

export function isPortAllowed(port: number): boolean {
  return getAllowedPorts().includes(port);
}

export function isCommandAllowed(cmd: string): boolean {
  return getAllowedCommands().some(
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
  const dirs = writeMode ? getAllowedWriteDirs() : [getProjectRoot()];
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
  const projectRoot = getProjectRoot();
  const target = cwd && cwd.trim() ? cwd.trim() : projectRoot;
  const resolved = path.isAbsolute(target)
    ? path.resolve(target)
    : path.resolve(projectRoot, target);

  if (resolved !== projectRoot && !resolved.startsWith(projectRoot + path.sep)) {
    return null;
  }
  return resolved;
}

export function allowedPortsLabel(): string {
  return getAllowedPorts().join(", ");
}

export function allowedCommandsLabel(): string {
  return getAllowedCommands().map((c) => `  - ${c}`).join("\n");
}

export function allowedWriteDirsLabel(): string {
  return getAllowedWriteDirs().join(", ");
}
