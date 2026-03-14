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

export function isPathAllowed(filePath: string, writeMode = false): boolean {
  const resolved = path.resolve(filePath);
  const dirs = writeMode ? ALLOWED_WRITE_DIRS : [PROJECT_ROOT];
  return dirs.some(
    (dir) => resolved === dir || resolved.startsWith(dir + path.sep)
  );
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
