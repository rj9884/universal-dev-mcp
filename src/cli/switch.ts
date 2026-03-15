#!/usr/bin/env node
/**
 * mcp-switch CLI
 * Cross-platform CLI to switch the active PROJECT_ROOT in Claude Desktop.
 *
 * Usage:
 *   npx mcp-switch                        # interactive menu
 *   npx mcp-switch list                   # list all projects
 *   npx mcp-switch use <project-name>     # switch directly by name
 *   npx mcp-switch current                # show active project
 *   npx mcp-switch add                    # add a new project interactively
 */

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);


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

/** Absolute path to the MCP server entry point */
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
      const claudeDir = fs.readdirSync(pkgsDir)
        .find(d => d.startsWith("Claude_"));
      if (claudeDir) {
        const storePath = path.join(pkgsDir, claudeDir, "LocalCache", "Roaming", "Claude", "claude_desktop_config.json");
        if (fs.existsSync(storePath)) return storePath;
      }
    }
  } else if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  } else {
    return path.join(os.homedir(), ".config", "Claude", "claude_desktop_config.json");
  }

  return null;
}


const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  cyan:   "\x1b[36m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  gray:   "\x1b[90m",
};

function log(msg: string)         { console.log(msg); }
function info(msg: string)        { console.log(`${c.cyan}${msg}${c.reset}`); }
function success(msg: string)     { console.log(`${c.green}${c.bold}${msg}${c.reset}`); }
function warn(msg: string)        { console.log(`${c.yellow}${msg}${c.reset}`); }
function error(msg: string)       { console.error(`${c.red}${c.bold}ERROR:${c.reset} ${c.red}${msg}${c.reset}`); }
function dim(msg: string)         { console.log(`${c.gray}${msg}${c.reset}`); }
function bar(char = "=", n = 52)  { return char.repeat(n); }

// Projects file helpers

function loadProjects(): Project[] {
  const file = getProjectsFilePath();
  if (!fs.existsSync(file)) {
    error(`projects.json not found at: ${file}`);
    process.exit(1);
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

// Claude config helpers

function loadClaudeConfig(): { configPath: string; config: Record<string, unknown> } {
  const configPath = getClaudeConfigPath();
  if (!configPath) {
    error("Could not locate Claude Desktop config. Is Claude Desktop installed?");
    process.exit(1);
  }
  if (!fs.existsSync(configPath)) {
    error(`Claude Desktop config not found at:\n  ${configPath}`);
    process.exit(1);
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return { configPath, config };
  } catch (e) {
    error(`Could not parse Claude config: ${(e as Error).message}`);
    process.exit(1);
  }
}

function saveClaudeConfig(configPath: string, config: Record<string, unknown>): void {
  const json = JSON.stringify(config, null, 2);
  fs.writeFileSync(configPath, Buffer.from(json, "utf8"));

  try {
    JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
    error("Config was written but failed JSON validation. Please check the file manually.");
    process.exit(1);
  }
}

function applySwitch(project: Project): void {
  const { configPath, config } = loadClaudeConfig();

  const mcpEntry = {
    command: "node",
    args: [getMcpServerPath()],
    env: {
      PROJECT_ROOT:     project.root,
      ALLOWED_PORTS:    project.allowed_ports,
      ALLOWED_COMMANDS: project.allowed_commands,
    },
  };

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    config.mcpServers = {};
  }
  (config.mcpServers as Record<string, unknown>)["universal-dev-mcp"] = mcpEntry;

  saveClaudeConfig(configPath, config);
}

// Interactive prompt helper

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}


/** mcp-switch list */
function cmdList() {
  const projects = loadProjects();
  const { config } = loadClaudeConfig();

  const activeRoot = (
    (config.mcpServers as Record<string, { env?: { PROJECT_ROOT?: string } }>)
    ?.["universal-dev-mcp"]?.env?.PROJECT_ROOT
  ) || "";

  log("");
  info(bar());
  info("  Projects in projects.json");
  info(bar());
  log("");

  if (projects.length === 0) {
    warn("  No projects defined. Run: npx mcp-switch add");
  } else {
    projects.forEach((p, i) => {
      const isActive = p.root === activeRoot;
      const marker   = isActive ? `${c.green}* ` : "  ";
      const exists   = fs.existsSync(p.root);
      log(`${marker}[${i + 1}] ${c.bold}${p.name}${c.reset}${isActive ? `${c.green} (active)${c.reset}` : ""}`);
      log(`      ${c.gray}${p.root}${c.reset}${!exists ? ` ${c.red}[folder not found]${c.reset}` : ""}`);
      log("");
    });
  }
}

function cmdCurrent() {
  const { config, configPath } = loadClaudeConfig();
  const mcpEnv = (config.mcpServers as Record<string, { env?: Record<string, string> }>)
    ?.["universal-dev-mcp"]?.env;

  const root     = mcpEnv?.PROJECT_ROOT     || "(not set)";
  const ports    = mcpEnv?.ALLOWED_PORTS    || "(not set)";
  const commands = mcpEnv?.ALLOWED_COMMANDS || "(not set)";

  // Try to find matching project name
  const projects = loadProjects();
  const match    = projects.find(p => p.root === root);
  const name     = match?.name || path.basename(root);
  const exists   = fs.existsSync(root);

  log("");
  info(bar());
  info("  ACTIVE PROJECT");
  info(bar());
  log(`  ${c.bold}Name     :${c.reset} ${name}`);
  log(`  ${c.bold}Root     :${c.reset} ${root}`);
  log(`  ${c.bold}Exists   :${c.reset} ${exists ? `${c.green}YES${c.reset}` : `${c.red}NO - folder not found!${c.reset}`}`);
  log(`  ${c.bold}Ports    :${c.reset} ${ports}`);
  log(`  ${c.bold}Commands :${c.reset} ${commands}`);
  dim(`  Config   : ${configPath}`);
  info(bar());
  log("");
}

/** mcp-switch use <name> */
function cmdUse(name: string) {
  const projects = loadProjects();
  const project  = projects.find(p => p.name.toLowerCase() === name.toLowerCase());

  if (!project) {
    error(`Project "${name}" not found in projects.json`);
    log("");
    log("Available projects:");
    projects.forEach(p => dim(`  - ${p.name}`));
    log("");
    process.exit(1);
  }

  if (!fs.existsSync(project.root)) {
    warn(`Folder not found: ${project.root}`);
    warn("Switching anyway — make sure the folder exists before using Claude.");
  }

  applySwitch(project);

  log("");
  success("  Switched successfully!");
  success(`  ${bar("-", 36)}`);
  log(`  ${c.bold}Project :${c.reset} ${project.name}`);
  log(`  ${c.bold}Root    :${c.reset} ${project.root}`);
  log("");
  warn("  Restart Claude Desktop for the change to take effect.");
  log("");
}

/** mcp-switch (no args) — interactive menu */
async function cmdInteractive() {
  const projects = loadProjects();

  if (projects.length === 0) {
    warn("No projects defined. Run: npx mcp-switch add");
    process.exit(0);
  }

  log("");
  info("  Claude MCP - Switch Project Root");
  info("  " + bar("=", 34));
  log("");

  projects.forEach((p, i) => {
    const exists = fs.existsSync(p.root);
    log(`  [${i + 1}] ${c.bold}${p.name}${c.reset}`);
    log(`      ${c.gray}${p.root}${c.reset}${!exists ? ` ${c.red}[not found]${c.reset}` : ""}`);
    log("");
  });

  const answer = await prompt("  Select a project (number): ");
  const index  = parseInt(answer, 10) - 1;

  if (isNaN(index) || index < 0 || index >= projects.length) {
    error("Invalid selection.");
    process.exit(1);
  }

  cmdUse(projects[index].name);
}

/** mcp-switch add — add a new project interactively */
async function cmdAdd() {
  log("");
  info("  Add a new project");
  info("  " + bar("=", 20));
  log("");

  const name     = await prompt("  Project name (e.g. my-app): ");
  const root     = await prompt("  Project root path: ");
  const ports    = await prompt("  Allowed ports (default: 3000,5173,8080): ") || "3000,5173,8080";
  const commands = await prompt("  Allowed commands (default: npm run build,npx tsc --noEmit,npm test): ")
    || "npm run build,npx tsc --noEmit,npm test";

  if (!name || !root) {
    error("Name and root path are required.");
    process.exit(1);
  }

  const projects = loadProjects();

  if (projects.find(p => p.name.toLowerCase() === name.toLowerCase())) {
    error(`A project named "${name}" already exists.`);
    process.exit(1);
  }

  const newProject: Project = {
    name,
    root: path.resolve(root),
    allowed_ports:    ports,
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
  .description("Switch the active PROJECT_ROOT for Claude Desktop MCP server")
  .version("1.0.0");

program
  .command("use <project-name>")
  .description("Switch to a project by name")
  .action((name: string) => {
    cmdUse(name);
  });

program
  .command("list")
  .description("List all projects in projects.json")
  .action(() => {
    cmdList();
  });

program
  .command("current")
  .description("Show the currently active project")
  .action(() => {
    cmdCurrent();
  });

program
  .command("add")
  .description("Add a new project interactively")
  .action(async () => {
    await cmdAdd();
  });

program
  .action(async () => {
    await cmdInteractive();
  });

program.parse(process.argv);
