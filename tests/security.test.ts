import { describe, it, expect } from "vitest";
import {
  isPortAllowed,
  isCommandAllowed,
  hasShellInjectionRisk,
  isPathAllowed,
  resolveAllowedCwd,
} from "../src/utils/security.js";
import * as path from "path";
import { getProjectRoot } from "../src/config.js";

describe("Security Guardrails", () => {
  it("validates allowed ports accurately", () => {
    expect(isPortAllowed(3000)).toBe(true);
    expect(isPortAllowed(5173)).toBe(true);
    expect(isPortAllowed(9999)).toBe(false);
    expect(isPortAllowed(22)).toBe(false);
  });

  it("permits allowed commands and prefixes", () => {
    expect(isCommandAllowed("git status")).toBe(true);
    expect(isCommandAllowed("npm test")).toBe(true);
    expect(isCommandAllowed("npm run build")).toBe(true);
    expect(isCommandAllowed("rm -rf /")).toBe(false);
    expect(isCommandAllowed("curl http://evil.com")).toBe(false);
  });

  it("detects shell injection risk in commands", () => {
    expect(hasShellInjectionRisk("git status")).toBe(false);
    expect(hasShellInjectionRisk("npm test")).toBe(false);
    expect(hasShellInjectionRisk("npm test && rm -rf /")).toBe(true);
    expect(hasShellInjectionRisk("npm test; rm -rf /")).toBe(true);
    expect(hasShellInjectionRisk("npm test | cat /etc/passwd")).toBe(true);
    expect(hasShellInjectionRisk("npm test `whoami`")).toBe(true);
    expect(hasShellInjectionRisk("npm test $(whoami)")).toBe(true);
    expect(hasShellInjectionRisk("npm test > output.txt")).toBe(true);
    expect(hasShellInjectionRisk("npm test < input.txt")).toBe(true);
  });

  it("enforces path containment inside project root", () => {
    const root = getProjectRoot();
    const safeFile = path.join(root, "package.json");
    const safeSub = path.join(root, "src", "server.ts");
    const escapedFile = path.resolve(root, "..", "some_secret.txt");

    expect(isPathAllowed(safeFile)).toBe(true);
    expect(isPathAllowed(safeSub)).toBe(true);
    expect(isPathAllowed(escapedFile)).toBe(false);
    expect(isPathAllowed("/etc/passwd")).toBe(false);
  });

  it("resolves allowed cwd within project root", () => {
    const root = getProjectRoot();
    expect(resolveAllowedCwd("src")).toBe(path.join(root, "src"));
    expect(resolveAllowedCwd("..")).toBe(null);
    expect(resolveAllowedCwd("/")).toBe(null);
  });
});
