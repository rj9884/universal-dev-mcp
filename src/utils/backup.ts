import * as fs from "fs";
import * as path from "path";
import { getBackupDir, getProjectRoot } from "../config.js";

export { getBackupDir };

const MAX_BACKUPS_PER_FILE = 10; 
const MAX_BACKUP_AGE_MS = 7 * 24 * 60 * 60 * 1000; 

export function ensureBackupDir(): string {
  const dir = getBackupDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function backupFile(filePath: string): string {
  const backupDir = ensureBackupDir();
  const projectRoot = getProjectRoot();
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Cannot back up non-existent file: ${resolved}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  // Include relative path in backup name to avoid collisions between same-named files in different dirs
  const relPath = path.relative(projectRoot, resolved).replace(/[\\/]/g, "__");
  const backupName = `${relPath}.${timestamp}.bak`;
  const backupPath = path.join(backupDir, backupName);

  fs.copyFileSync(resolved, backupPath);
  return backupPath;
}

export function relativeBackupPath(backupPath: string): string {
  return path.relative(getProjectRoot(), backupPath);
}


export function cleanOldBackups(): void {
  const backupDir = getBackupDir();
  if (!fs.existsSync(backupDir)) return;

  const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".bak"));
  const now = Date.now();

  // Group by source file prefix (everything before the timestamp)
  const groups = new Map<string, { name: string; mtime: number }[]>();

  for (const name of files) {
    const fullPath = path.join(backupDir, name);
    let mtime: number;
    try {
      mtime = fs.statSync(fullPath).mtimeMs;
    } catch {
      continue;
    }

    // Delete if older than max age
    if (now - mtime > MAX_BACKUP_AGE_MS) {
      try { fs.unlinkSync(fullPath); } catch { /* ignore */ }
      continue;
    }

    // Extract source prefix: strip trailing ".TIMESTAMP.bak"
    const match = name.match(/^(.+?)\.\d{4}-\d{2}-\d{2}T[\d-]+Z\.bak$/);
    const prefix = match ? match[1] : name;

    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix)!.push({ name, mtime });
  }

  // For each group, delete oldest beyond the limit
  for (const entries of groups.values()) {
    if (entries.length <= MAX_BACKUPS_PER_FILE) continue;
    entries.sort((a, b) => b.mtime - a.mtime); // newest first
    const toDelete = entries.slice(MAX_BACKUPS_PER_FILE);
    for (const { name } of toDelete) {
      try { fs.unlinkSync(path.join(backupDir, name)); } catch { /* ignore */ }
    }
  }
}
