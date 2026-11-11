import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ProjectEntry } from "./types.js";

export type SupportedEditor = "claude" | "cursor" | "windsurf" | "zed";

export interface EditorInfo {
  id: SupportedEditor;
  name: string;
  configPath: string | null;
  exists: boolean;
  configured: boolean;
  configuredRoot: string | null;
}

export function getMcpServerPath(): string {
  return path.resolve(process.cwd(), "dist", "server.js");
}

export function getClaudeConfigPath(): string | null {
  const platform = os.platform();

  if (platform === "win32") {
    const standard = path.join(process.env.APPDATA || "", "Claude", "claude_desktop_config.json");
    if (fs.existsSync(standard)) return standard;

    const pkgsDir = path.join(process.env.LOCALAPPDATA || "", "Packages");
    if (fs.existsSync(pkgsDir)) {
      try {
        const claudeDir = fs.readdirSync(pkgsDir).find((d) => d.startsWith("Claude_"));
        if (claudeDir) {
          const storePath = path.join(
            pkgsDir,
            claudeDir,
            "LocalCache",
            "Roaming",
            "Claude",
            "claude_desktop_config.json"
          );
          if (fs.existsSync(storePath)) return storePath;
        }
      } catch {
        /* ignore */
      }
    }
    return standard;
  } else if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  } else {
    return path.join(os.homedir(), ".config", "Claude", "claude_desktop_config.json");
  }
}

export function getCursorConfigPath(): string | null {
  const home = os.homedir();
  return path.join(home, ".cursor", "mcp.json");
}

export function getWindsurfConfigPath(): string | null {
  const home = os.homedir();
  return path.join(home, ".codeium", "windsurf", "mcp_config.json");
}

export function getZedConfigPath(): string | null {
  const platform = os.platform();
  const home = os.homedir();
  if (platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Zed", "settings.json");
  }
  return path.join(home, ".config", "zed", "settings.json");
}

export function getEditorConfigPath(editor: SupportedEditor): string | null {
  switch (editor) {
    case "claude":
      return getClaudeConfigPath();
    case "cursor":
      return getCursorConfigPath();
    case "windsurf":
      return getWindsurfConfigPath();
    case "zed":
      return getZedConfigPath();
  }
}

export function parseJsonc(content: string): any {
  // Strip line and block comments while handling trailing commas
  const cleaned = content
    .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1")
    .replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(cleaned);
}

function writeJsonConfig(filePath: string, updater: (config: any) => any): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let config: any = {};
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      try {
        config = parseJsonc(raw);
      } catch {
        try {
          config = JSON.parse(raw);
        } catch {
          config = {};
        }
      }
    }
    const updated = updater(config);
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

export function applySwitchToClaude(project: ProjectEntry, serverPath?: string): boolean {
  const configPath = getClaudeConfigPath();
  if (!configPath) return false;

  const mcpEntry = {
    command: "node",
    args: [serverPath || getMcpServerPath()],
    env: {
      PROJECT_ROOT: project.root,
      ALLOWED_PORTS: project.allowed_ports,
      ALLOWED_COMMANDS: project.allowed_commands,
    },
  };

  return writeJsonConfig(configPath, (config) => {
    if (!config.mcpServers || typeof config.mcpServers !== "object") {
      config.mcpServers = {};
    }
    config.mcpServers["universal-dev-mcp"] = mcpEntry;
    return config;
  });
}

export function applySwitchToCursor(project: ProjectEntry, serverPath?: string): boolean {
  const configPath = getCursorConfigPath();
  if (!configPath) return false;

  const mcpEntry = {
    command: "node",
    args: [serverPath || getMcpServerPath()],
    env: {
      PROJECT_ROOT: project.root,
      ALLOWED_PORTS: project.allowed_ports,
      ALLOWED_COMMANDS: project.allowed_commands,
    },
  };

  return writeJsonConfig(configPath, (config) => {
    if (!config.mcpServers || typeof config.mcpServers !== "object") {
      config.mcpServers = {};
    }
    config.mcpServers["universal-dev-mcp"] = mcpEntry;
    return config;
  });
}

export function applySwitchToWindsurf(project: ProjectEntry, serverPath?: string): boolean {
  const configPath = getWindsurfConfigPath();
  if (!configPath) return false;

  const mcpEntry = {
    command: "node",
    args: [serverPath || getMcpServerPath()],
    env: {
      PROJECT_ROOT: project.root,
      ALLOWED_PORTS: project.allowed_ports,
      ALLOWED_COMMANDS: project.allowed_commands,
    },
  };

  return writeJsonConfig(configPath, (config) => {
    if (!config.mcpServers || typeof config.mcpServers !== "object") {
      config.mcpServers = {};
    }
    config.mcpServers["universal-dev-mcp"] = mcpEntry;
    return config;
  });
}

export function applySwitchToZed(project: ProjectEntry, serverPath?: string): boolean {
  const configPath = getZedConfigPath();
  if (!configPath) return false;

  const serverEntry = {
    id: "universal-dev-mcp",
    command: "node",
    args: [serverPath || getMcpServerPath()],
    env: {
      PROJECT_ROOT: project.root,
      ALLOWED_PORTS: project.allowed_ports,
      ALLOWED_COMMANDS: project.allowed_commands,
    },
  };

  return writeJsonConfig(configPath, (config) => {
    if (!config.experimental || typeof config.experimental !== "object") {
      config.experimental = {};
    }
    if (!config.experimental.model_context_protocol || typeof config.experimental.model_context_protocol !== "object") {
      config.experimental.model_context_protocol = { servers: [] };
    }
    const servers: any[] = Array.isArray(config.experimental.model_context_protocol.servers)
      ? config.experimental.model_context_protocol.servers
      : [];
    const idx = servers.findIndex((s: any) => s.id === "universal-dev-mcp");
    if (idx >= 0) {
      servers[idx] = serverEntry;
    } else {
      servers.push(serverEntry);
    }
    config.experimental.model_context_protocol.servers = servers;
    return config;
  });
}

export function checkEditorStatus(editor: SupportedEditor): EditorInfo {
  const names: Record<SupportedEditor, string> = {
    claude: "Claude Desktop",
    cursor: "Cursor",
    windsurf: "Windsurf",
    zed: "Zed",
  };

  const configPath = getEditorConfigPath(editor);
  let exists = false;
  let configured = false;
  let configuredRoot: string | null = null;

  if (configPath) {
    const dir = path.dirname(configPath);
    exists = fs.existsSync(configPath) || fs.existsSync(dir);

    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, "utf8");
        let parsed: any;
        try {
          parsed = parseJsonc(raw);
        } catch {
          parsed = JSON.parse(raw);
        }
        if (editor === "zed") {
          const servers = parsed?.experimental?.model_context_protocol?.servers;
          if (Array.isArray(servers)) {
            const entry = servers.find((s) => s.id === "universal-dev-mcp");
            if (entry) {
              configured = true;
              configuredRoot = entry.env?.PROJECT_ROOT || null;
            }
          }
        } else {
          const entry = parsed?.mcpServers?.["universal-dev-mcp"];
          if (entry) {
            configured = true;
            configuredRoot = entry.env?.PROJECT_ROOT || null;
          }
        }
      } catch {
        /* ignore parse error */
      }
    }
  }

  return {
    id: editor,
    name: names[editor],
    configPath,
    exists,
    configured,
    configuredRoot,
  };
}

export function getAllEditorStatuses(): EditorInfo[] {
  const editors: SupportedEditor[] = ["claude", "cursor", "windsurf", "zed"];
  return editors.map(checkEditorStatus);
}

export function syncProjectToEditors(
  project: ProjectEntry,
  targetEditor: "all" | SupportedEditor = "all",
  serverPath?: string
): {
  updated: SupportedEditor[];
  skipped: SupportedEditor[];
  failed: SupportedEditor[];
} {
  const updated: SupportedEditor[] = [];
  const skipped: SupportedEditor[] = [];
  const failed: SupportedEditor[] = [];

  const editorsToProcess: SupportedEditor[] =
    targetEditor === "all" ? ["claude", "cursor", "windsurf", "zed"] : [targetEditor];

  for (const ed of editorsToProcess) {
    const status = checkEditorStatus(ed);

    // If target is "all" and editor directory/file doesn't exist, we skip rather than creating alien dirs
    if (targetEditor === "all" && !status.exists) {
      skipped.push(ed);
      continue;
    }

    let ok = false;
    if (ed === "claude") ok = applySwitchToClaude(project, serverPath);
    else if (ed === "cursor") ok = applySwitchToCursor(project, serverPath);
    else if (ed === "windsurf") ok = applySwitchToWindsurf(project, serverPath);
    else if (ed === "zed") ok = applySwitchToZed(project, serverPath);

    if (ok) {
      updated.push(ed);
    } else {
      failed.push(ed);
    }
  }

  return { updated, skipped, failed };
}
