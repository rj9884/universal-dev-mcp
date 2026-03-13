import * as fs from "fs";
import * as path from "path";
import { BACKUP_DIR, PROJECT_ROOT } from "../config.js";

export function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export function backupFile(filePath: string): string {
  ensureBackupDir();
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    return "";
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `${path.basename(resolved)}.${timestamp}.bak`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  fs.copyFileSync(resolved, backupPath);
  return backupPath;
}

export function relativeBackupPath(backupPath: string): string {
  return path.relative(PROJECT_ROOT, backupPath);
}