import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ProjectEntry } from "./types.js";
import { getProjectRoot, setActiveProjectConfig } from "../config.js";
import { activityBus } from "./events.js";
import { syncProjectToEditors, SupportedEditor } from "./editor-sync.js";

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

export function switchActiveProject(
  nameOrPath: string,
  options?: { syncEditors?: boolean; targetEditor?: "all" | SupportedEditor }
): {
  success: boolean;
  project?: ProjectEntry;
  error?: string;
  editorSync?: { updated: string[]; skipped: string[]; failed: string[] };
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

  let editorSync: { updated: string[]; skipped: string[]; failed: string[] } | undefined;
  if (options?.syncEditors) {
    editorSync = syncProjectToEditors(project, options.targetEditor || "all");
  }

  activityBus.emitActivity({
    type: "project:switched",
    projectRoot: project.root,
    result: `Active project switched to "${project.name}" (${project.root})${
      editorSync && editorSync.updated.length > 0 ? ` [Synced to: ${editorSync.updated.join(", ")}]` : ""
    }`,
    metadata: { projectName: project.name, root: project.root, editorSync },
  });

  return { success: true, project, editorSync };
}

export function updateProject(
  originalName: string,
  updates: Partial<ProjectEntry>
): { success: boolean; project?: ProjectEntry; error?: string } {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.name.toLowerCase() === originalName.toLowerCase());
  if (idx < 0) {
    return { success: false, error: `Project "${originalName}" not found` };
  }

  const updated: ProjectEntry = {
    ...projects[idx],
    ...updates,
    root: updates.root ? path.resolve(updates.root) : projects[idx].root,
  };

  projects[idx] = updated;
  saveProjects(projects);

  if (path.resolve(getProjectRoot()) === path.resolve(projects[idx].root)) {
    setActiveProjectConfig({
      root: updated.root,
      allowedPorts: updated.allowed_ports,
      allowedCommands: updated.allowed_commands,
    });
  }

  return { success: true, project: updated };
}

export function deleteProject(name: string): { success: boolean; error?: string } {
  const projects = loadProjects();
  const filtered = projects.filter((p) => p.name.toLowerCase() !== name.toLowerCase());
  if (filtered.length === projects.length) {
    return { success: false, error: `Project "${name}" not found` };
  }
  saveProjects(filtered);
  return { success: true };
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
