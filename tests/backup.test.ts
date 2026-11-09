import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { backupFile, ensureBackupDir, getBackupDir } from "../src/utils/backup.js";
import { getProjectRoot } from "../src/config.js";

describe("Backup System", () => {
  const testFilePath = path.join(getProjectRoot(), "test-temp-file.txt");

  beforeEach(() => {
    fs.writeFileSync(testFilePath, "Hello World Initial", "utf8");
  });

  afterEach(() => {
    if (fs.existsSync(testFilePath)) {
      try {
        fs.unlinkSync(testFilePath);
      } catch {
        /* ignore */
      }
    }
  });

  it("creates a timestamped backup before modifying a file", () => {
    const backupDir = ensureBackupDir();
    expect(fs.existsSync(backupDir)).toBe(true);

    const backupPath = backupFile(testFilePath);
    expect(fs.existsSync(backupPath)).toBe(true);
    expect(backupPath.endsWith(".bak")).toBe(true);

    const backupContent = fs.readFileSync(backupPath, "utf8");
    expect(backupContent).toBe("Hello World Initial");

    // Cleanup backup file
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
  });
});
