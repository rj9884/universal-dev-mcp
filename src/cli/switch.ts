#!/usr/bin/env node
/**
 * mcp-switch CLI
 * Cross-platform CLI to switch the active PROJECT_ROOT across AI editors:
 * Claude Desktop, Cursor, Windsurf, and Zed.
 *
 * Usage:
 *   npx mcp-switch                        # interactive menu
 *   npx mcp-switch list                   # list all projects
 *   npx mcp-switch use <project-name>     # switch directly by name
 *   npx mcp-switch current                # show active project
 *   npx mcp-switch add                    # add a new project interactively
 *   npx mcp-switch sync [editor]          # sync active project to editors
 */

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Project {
  name: string;
  root: string;
  allowed_ports: string;
  allowed_commands: string;
}

interface ProjectsFile {
  projects: Project[];
}

function getProjectsFilePath(): string {
  return path.resolve(__dirname, "..", "..", "projects.json");
}

function getMcpServerPath(): string {
  return path.resolve(__dirname, "..", "server.js");
}

function getClaudeConfigPath(): string | null {
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
  } else if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  } else {
    return path.join(os.homedir(), ".config", "Claude", "claude_desktop_config.json");
  }

  return null;
}

function getCursorConfigPath(): string | null {
  const home = os.homedir();
  const dir = path.join(home, ".cursor");
  return path.join(dir, "mcp.json");
}

function getWindsurfConfigPath(): string | null {
  const home = os.homedir();
  const dir = path.join(home, ".codeium", "windsurf");
  return path.join(dir, "mcp_config.json");
}

function getZedConfigPath(): string | null {
  const platform = os.platform();
  const home = os.homedir();
  if (platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Zed", "settings.json");
  }
  return path.join(home, ".config", "zed", "settings.json");
}

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
};

function log(msg: string) {
  console.log(msg);
}
function info(msg: string) {
  console.log(`${c.cyan}${msg}${c.reset}`);
}
function success(msg: string) {
  console.log(`${c.green}${c.bold}${msg}${c.reset}`);
}
function warn(msg: string) {
  console.log(`${c.yellow}${msg}${c.reset}`);
}
function error(msg: string) {
  console.error(`${c.red}${c.bold}ERROR:${c.reset} ${c.red}${msg}${c.reset}`);
}
function dim(msg: string) {
  console.log(`${c.gray}${msg}${c.reset}`);
}
function bar(char = "=", n = 52) {
  return char.repeat(n);
}

function loadProjects(): Project[] {
  const file = getProjectsFilePath();
  if (!fs.existsSync(file)) {
    return [];
  }
  try {
    const data: ProjectsFile = JSON.parse(fs.readFileSync(file, "utf8"));
    return data.projects || [];
  } catch (e) {
    error(`Could not parse projects.json: ${(e as Error).message}`);
    process.exit(1);
  }
}

function saveProjects(projects: Project[]): void {
  const file = getProjectsFilePath();
  const data: ProjectsFile = { projects };
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function writeJsonConfig(filePath: string, updater: (config: any) => any): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let config: any = {};
    if (fs.existsSync(filePath)) {
      try {
        config = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch {
        config = {};
      }
    }
    const updated = updater(config);
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf8");
    return true;
  } catch (e) {
    return false;
  }
}

function applySwitchToClaude(project: Project): boolean {
  const configPath = getClaudeConfigPath();
  if (!configPath) return false;

  const mcpEntry = {
    command: "node",
    args: [getMcpServerPath()],
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

function applySwitchToCursor(project: Project): boolean {
  const configPath = getCursorConfigPath();
  if (!configPath) return false;

  const mcpEntry = {
    command: "node",
    args: [getMcpServerPath()],
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

function applySwitchToWindsurf(project: Project): boolean {
  const configPath = getWindsurfConfigPath();
  if (!configPath) return false;

  const mcpEntry = {
    command: "node",
    args: [getMcpServerPath()],
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

function applySwitchToZed(project: Project): boolean {
  const configPath = getZedConfigPath();
  if (!configPath) return false;

  const serverEntry = {
    id: "universal-dev-mcp",
    command: "node",
    args: [getMcpServerPath()],
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
    const idx = servers.findIndex((s) => s.id === "universal-dev-mcp");
    if (idx >= 0) {
      servers[idx] = serverEntry;
    } else {
      servers.push(serverEntry);
    }
    config.experimental.model_context_protocol.servers = servers;
    return config;
  });
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function cmdCurrent() {
  const claudePath = getClaudeConfigPath();
  let activeRoot = "";

  if (claudePath && fs.existsSync(claudePath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(claudePath, "utf8"));
      activeRoot = cfg?.mcpServers?.["universal-dev-mcp"]?.env?.PROJECT_ROOT || "";
    } catch {
      /* ignore */
    }
  }

  log("");
  info(bar());
  info("  Current Active Project");
  info(bar());
  log("");

  if (!activeRoot) {
    warn("  No active project detected in Claude Desktop config.");
    log("");
    return;
  }

  const projects = loadProjects();
  const project = projects.find((p) => path.resolve(p.root) === path.resolve(activeRoot));

  if (project) {
    success(`  * ${project.name} (active)`);
    dim(`    Path: ${project.root}`);
    dim(`    Allowed Ports: ${project.allowed_ports}`);
    dim(`    Allowed Commands: ${project.allowed_commands}`);
  } else {
    log(`  Active path: ${activeRoot} (not configured in projects.json)`);
  }
  log("");
}

function cmdList() {
  const projects = loadProjects();
  const claudePath = getClaudeConfigPath();
  let activeRoot = "";

  if (claudePath && fs.existsSync(claudePath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(claudePath, "utf8"));
      activeRoot = cfg?.mcpServers?.["universal-dev-mcp"]?.env?.PROJECT_ROOT || "";
    } catch {
      /* ignore */
    }
  }

  log("");
  info(bar());
  info("  Projects in projects.json");
  info(bar());
  log("");

  if (projects.length === 0) {
    warn("  No projects defined. Run: npx mcp-switch add");
  } else {
    projects.forEach((p, i) => {
      const isActive = path.resolve(p.root) === path.resolve(activeRoot || "/__none__");
      const marker = isActive ? `${c.green}* ` : "  ";
      const exists = fs.existsSync(p.root);
      log(`${marker}[${i + 1}] ${c.bold}${p.name}${c.reset}${isActive ? `${c.green} (active)${c.reset}` : ""}`);
      log(`      ${c.gray}${p.root}${c.reset}${!exists ? ` ${c.red}[folder not found]${c.reset}` : ""}`);
      log("");
    });
  }
}

function cmdUse(name: string, targetEditor = "all") {
  const projects = loadProjects();
  const project = projects.find((p) => p.name.toLowerCase() === name.toLowerCase());

  if (!project) {
    error(`Project "${name}" not found in projects.json`);
    log("");
    log("Available projects:");
    projects.forEach((p) => dim(`  - ${p.name}`));
    log("");
    process.exit(1);
  }

  if (!fs.existsSync(project.root)) {
    warn(`Folder not found: ${project.root}`);
    warn("Switching anyway — make sure the folder exists before using AI tools.");
  }

  log("");
  info(`  Switching active project to: ${project.name}`);
  info(`  ${bar("-", 40)}`);

  let updatedCount = 0;

  if (targetEditor === "all" || targetEditor === "claude") {
    const claudeOk = applySwitchToClaude(project);
    if (claudeOk) {
      success("  ✓ Claude Desktop config updated");
      updatedCount++;
    } else {
      dim("  - Claude Desktop config not found (skipped)");
    }
  }

  if (targetEditor === "all" || targetEditor === "cursor") {
    const cursorOk = applySwitchToCursor(project);
    if (cursorOk) {
      success("  ✓ Cursor mcp.json updated");
      updatedCount++;
    } else {
      dim("  - Cursor mcp.json not found (skipped)");
    }
  }

  if (targetEditor === "all" || targetEditor === "windsurf") {
    const windsurfOk = applySwitchToWindsurf(project);
    if (windsurfOk) {
      success("  ✓ Windsurf mcp_config.json updated");
      updatedCount++;
    } else {
      dim("  - Windsurf mcp_config.json not found (skipped)");
    }
  }

  if (targetEditor === "all" || targetEditor === "zed") {
    const zedOk = applySwitchToZed(project);
    if (zedOk) {
      success("  ✓ Zed settings.json updated");
      updatedCount++;
    } else {
      dim("  - Zed settings.json not found (skipped)");
    }
  }

  log("");
  if (updatedCount > 0) {
    success(`  Switched successfully for ${updatedCount} editor(s)!`);
    warn("  Please restart your editor(s) for the new configuration to take effect.");
  } else {
    warn("  No editor configuration files were updated. Check your editor installations.");
  }
  log("");
}

async function cmdInteractive() {
  const projects = loadProjects();

  if (projects.length === 0) {
    warn("No projects defined. Run: npx mcp-switch add");
    process.exit(0);
  }

  log("");
  info("  Universal Dev MCP - Switch Project Root");
  info("  " + bar("=", 42));
  log("");

  projects.forEach((p, i) => {
    const exists = fs.existsSync(p.root);
    log(`  [${i + 1}] ${c.bold}${p.name}${c.reset}`);
    log(`      ${c.gray}${p.root}${c.reset}${!exists ? ` ${c.red}[not found]${c.reset}` : ""}`);
    log("");
  });

  const answer = await prompt("  Select a project (number): ");
  const index = parseInt(answer, 10) - 1;

  if (isNaN(index) || index < 0 || index >= projects.length) {
    error("Invalid selection.");
    process.exit(1);
  }

  cmdUse(projects[index].name);
}

async function cmdAdd() {
  log("");
  info("  Add a new project");
  info("  " + bar("=", 20));
  log("");

  const name = await prompt("  Project name (e.g. my-app): ");
  const root = await prompt("  Project root path: ");
  const ports =
    (await prompt("  Allowed ports (default: 3000,5173,8080): ")) || "3000,5173,8080";
  const commands =
    (await prompt(
      "  Allowed commands (default: npm run build,npx tsc --noEmit,npm test): "
    )) || "npm run build,npx tsc --noEmit,npm test";

  if (!name || !root) {
    error("Name and root path are required.");
    process.exit(1);
  }

  const projects = loadProjects();

  if (projects.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
    error(`A project named "${name}" already exists.`);
    process.exit(1);
  }

  const newProject: Project = {
    name,
    root: path.resolve(root),
    allowed_ports: ports,
    allowed_commands: commands,
  };

  projects.push(newProject);
  saveProjects(projects);

  log("");
  success(`  Project "${name}" added to projects.json!`);
  log("");
  log(`  To switch to it: ${c.cyan}npx mcp-switch use ${name}${c.reset}`);
  log("");
}

const program = new Command();

program
  .name("mcp-switch")
  .description("Switch active PROJECT_ROOT for Claude Desktop, Cursor, Windsurf, Zed")
  .version("1.1.0");

program
  .command("use <project-name>")
  .description("Switch to a project by name")
  .option("-e, --editor <editor>", "Target editor (all, claude, cursor, windsurf, zed)", "all")
  .action((name: string, options: { editor: string }) => {
    cmdUse(name, options.editor);
  });

program
  .command("current")
  .description("Show currently active project")
  .action(() => {
    cmdCurrent();
  });

program
  .command("list")
  .description("List all projects in projects.json")
  .action(() => {
    cmdList();
  });

program
  .command("add")
  .description("Add a new project interactively")
  .action(async () => {
    await cmdAdd();
  });

program.action(async () => {
  await cmdInteractive();
});

program.parse(process.argv);
