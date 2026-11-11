import { describe, it, expect } from "vitest";
import {
  checkEditorStatus,
  getAllEditorStatuses,
  getEditorConfigPath,
  syncProjectToEditors,
} from "../src/core/editor-sync.js";

describe("Editor Sync Subsystem", () => {
  it("should return config paths for all 4 supported editors", () => {
    const editors = ["claude", "cursor", "windsurf", "zed"] as const;
    for (const ed of editors) {
      const p = getEditorConfigPath(ed);
      expect(typeof p).toBe("string");
      expect(p!.length).toBeGreaterThan(0);
    }
  });

  it("should check status of each editor without throwing", () => {
    const statuses = getAllEditorStatuses();
    expect(statuses.length).toBe(4);
    const ids = statuses.map((s) => s.id);
    expect(ids).toContain("claude");
    expect(ids).toContain("cursor");
    expect(ids).toContain("windsurf");
    expect(ids).toContain("zed");
  });

  it("should check specific editor status", () => {
    const zedStatus = checkEditorStatus("zed");
    expect(zedStatus.id).toBe("zed");
    expect(zedStatus.name).toBe("Zed");
    expect(typeof zedStatus.exists).toBe("boolean");
  });

  it("should safely handle sync to all editors", () => {
    const mockProject = {
      name: "test-proj",
      root: "/tmp/test-proj",
      allowed_ports: "3000,5173",
      allowed_commands: "npm test",
    };
    const result = syncProjectToEditors(mockProject, "all");
    expect(result).toHaveProperty("updated");
    expect(result).toHaveProperty("skipped");
    expect(result).toHaveProperty("failed");
    expect(Array.isArray(result.updated)).toBe(true);
    expect(Array.isArray(result.skipped)).toBe(true);
    expect(Array.isArray(result.failed)).toBe(true);
  });
});
