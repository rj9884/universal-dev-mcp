import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ProjectEntry } from "./types.js";
import { getProjectRoot, setActiveProjectConfig } from "../config.js";
import { activityBus } from "./events.js";

function getProjectsFilePath(): string {
  return path.resolve(process.cwd(), "projects.json");
}

export function loadProjects(): ProjectEntry[] {
  const filePath = getProjectsFilePath();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return data.projects || [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: ProjectEntry[]): void {
  const filePath = getProjectsFilePath();
  fs.writeFileSync(filePath, JSON.stringify({ projects }, null, 2), "utf8");
}

export function switchActiveProject(nameOrPath: string): {
  success: boolean;
  project?: ProjectEntry;
  error?: string;
} {
  const projects = loadProjects();
  let project = projects.find(
    (p) => p.name.toLowerCase() === nameOrPath.toLowerCase() || path.resolve(p.root) === path.resolve(nameOrPath)
  );

  if (!project && fs.existsSync(nameOrPath)) {
    const resolved = path.resolve(nameOrPath);
    project = {
      name: path.basename(resolved),
      root: resolved,
      allowed_ports: "3000,5173,8080",
      allowed_commands: "npm run build,npx tsc --noEmit,npm test",
    };
  }

  if (!project) {
    return { success: false, error: `Project not found: ${nameOrPath}` };
  }

  setActiveProjectConfig({
    root: project.root,
    allowedPorts: project.allowed_ports,
    allowedCommands: project.allowed_commands,
  });

  activityBus.emitActivity({
    type: "project:switched",
    projectRoot: project.root,
    result: `Active project switched to "${project.name}" (${project.root})`,
    metadata: { projectName: project.name, root: project.root },
  });

  return { success: true, project };
}

export function generateEditorConfig(
  editor: "claude" | "cursor" | "windsurf" | "zed",
  project: ProjectEntry,
  serverPath?: string
): Record<string, unknown> {
  const mcpPath = serverPath || path.resolve(process.cwd(), "dist", "server.js");

  const mcpEntry = {
    command: "node",
    args: [mcpPath],
    env: {
      PROJECT_ROOT: project.root,
      ALLOWED_PORTS: project.allowed_ports,
      ALLOWED_COMMANDS: project.allowed_commands,
    },
  };

  if (editor === "claude") {
    return {
      mcpServers: {
        "universal-dev-mcp": mcpEntry,
      },
    };
  }

  if (editor === "cursor") {
    return {
      mcpServers: {
        "universal-dev-mcp": mcpEntry,
      },
    };
  }

  if (editor === "windsurf") {
    return {
      mcpServers: {
        "universal-dev-mcp": mcpEntry,
      },
    };
  }

  if (editor === "zed") {
    return {
      experimental: {
        model_context_protocol: {
          servers: [
            {
              id: "universal-dev-mcp",
              command: "node",
              args: [mcpPath],
              env: mcpEntry.env,
            },
          ],
        },
      },
    };
  }

  return { mcpEntry };
}
