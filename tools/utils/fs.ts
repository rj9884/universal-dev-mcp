import * as fs from "fs";
import * as path from "path";
import { PROJECT_ROOT } from "../config.js";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".mcp-backups",
  "coverage",
  ".turbo",
]);

export function getFileTree(
  dir: string,
  depth = 0,
  maxDepth = 3
): string {
  if (depth > maxDepth) return "";

  let result = "";
  let items: string[];

  try {
    items = fs.readdirSync(dir);
  } catch {
    return "";
  }

  for (const item of items) {
    if (IGNORED_DIRS.has(item)) continue;

    const fullPath = path.join(dir, item);
    let stat: fs.Stats;

    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }

    const indent = "  ".repeat(depth);

    if (stat.isDirectory()) {
      result += `${indent}${item}/\n`;
      result += getFileTree(fullPath, depth + 1, maxDepth);
    } else {
      result += `${indent}${item}\n`;
    }
  }

  return result;
}


export function toRelativePath(filePath: string): string {
  return path.relative(PROJECT_ROOT, path.resolve(filePath));
}


export function resolveProjectPath(filePath: string): string {
  return path.isAbsolute(filePath)
    ? filePath
    : path.join(PROJECT_ROOT, filePath);
}