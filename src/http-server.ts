/**
 * HTTP + SSE bridge for AI tools and Web UI Dashboard.
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import * as path from "path";
import * as fs from "fs";
import {
  getProjectRoot,
  getAllowedPorts,
  getAllowedCommands,
  HTTP_PORT,
  API_KEY,
  getBackupDir,
} from "./config.js";
import { initAllTools } from "./tools/index.js";
import {
  executeTool,
  getAllTools,
  getOpenAiToolDefinitions,
} from "./core/registry.js";
import { activityBus } from "./core/events.js";
import {
  loadProjects,
  saveProjects,
  switchActiveProject,
  updateProject,
  deleteProject,
  generateEditorConfig,
} from "./core/project-manager.js";
import {
  getAllEditorStatuses,
  syncProjectToEditors,
  SupportedEditor,
} from "./core/editor-sync.js";
import { scanDevServersTool } from "./tools/radar.js";
import {
  restoreBackupTool,
  readFileTool,
  editFileTool,
  listFilesTool,
} from "./tools/files.js";
import { getGitStatusTool, getGitDiffTool } from "./tools/git.js";
import { runCommandTool } from "./tools/commands.js";
import { searchFilesTool } from "./tools/search.js";
import { backupFile, relativeBackupPath } from "./utils/backup.js";
import { resolveProjectPath } from "./utils/fs.js";

// Initialize all MCP tools
initAllTools();

const app = express();
app.use(cors());
app.use(express.json());

// Optional API key middleware (exempts health, root, and static assets)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!API_KEY) return next();
  if (req.path === "/" || req.path === "/health" || req.path.startsWith("/assets")) {
    return next();
  }
  const key = req.headers["x-api-key"] || req.query["api_key"];
  if (key !== API_KEY) {
    res.status(401).json({ error: "Unauthorized. Provide a valid x-api-key header." });
    return;
  }
  next();
});

// SSE Client pool
const sseClients = new Set<Response>();

// Forward all internal activityBus events to all connected SSE clients
activityBus.on("activity", (event) => {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      /* ignore write error */
    }
  });
});

// Server info
app.get("/api/info", (_req: Request, res: Response) => {
  res.json({
    name: "universal-dev-mcp",
    version: "1.0.0",
    status: "running",
    project_root: getProjectRoot(),
    allowed_ports: getAllowedPorts(),
    allowed_commands: getAllowedCommands(),
    auth_required: Boolean(API_KEY),
    tools_count: getAllTools().length,
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// List all registered tools
app.get("/tools", (_req: Request, res: Response) => {
  res.json({
    tools: getAllTools().map((t) => ({
      name: t.name,
      description: t.description,
      schema: t.inputSchema,
    })),
  });
});

// Call a tool
app.post("/call", async (req: Request, res: Response) => {
  const { name, arguments: args } = req.body;
  if (!name) {
    res.status(400).json({ error: "Missing required field: name" });
    return;
  }
  try {
    const result = await executeTool(name, (args as Record<string, unknown>) || {});
    const output = result.content.map((c) => c.text).join("\n");
    res.json({
      result: output,
      isError: result.isError,
      durationMs: result.durationMs,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// OpenAI tools schema
app.get("/openai/tools", (_req: Request, res: Response) => {
  res.json({ tools: getOpenAiToolDefinitions() });
});

// Execute OpenAI format tool calls
app.post("/openai/call", async (req: Request, res: Response) => {
  const { tool_calls } = req.body;
  if (!Array.isArray(tool_calls) || tool_calls.length === 0) {
    res.status(400).json({ error: "Missing or empty tool_calls array" });
    return;
  }

  try {
    const results = await Promise.all(
      tool_calls.map(async (tc: { id: string; function: { name: string; arguments: string } }) => {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments || "{}");
        } catch {
          /* use empty */
        }
        const result = await executeTool(tc.function.name, args);
        const output = result.content.map((c) => c.text).join("\n");
        return { tool_call_id: tc.id, role: "tool", content: output };
      })
    );
    res.json({ tool_results: results });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// SSE endpoint
app.get("/sse", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      message: "Universal Dev MCP SSE stream connected",
      projectRoot: getProjectRoot(),
    })}\n\n`
  );
  sseClients.add(res);

  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: "heartbeat", ts: Date.now() })}\n\n`);
  }, 15000);

  req.on("close", () => {
    sseClients.delete(res);
    clearInterval(heartbeat);
  });
});

// Broadcast event
app.post("/sse/broadcast", (req: Request, res: Response) => {
  const payload = JSON.stringify(req.body);
  sseClients.forEach((client) => client.write(`data: ${payload}\n\n`));
  res.json({ sent_to: sseClients.size });
});

// REST API for Dashboard: Activity Feed
app.get("/api/activity", (_req: Request, res: Response) => {
  res.json({ events: activityBus.getRecentEvents() });
});

app.post("/api/activity/clear", (_req: Request, res: Response) => {
  activityBus.clear();
  res.json({ success: true });
});

// REST API for Dashboard: Projects
app.get("/api/projects", (_req: Request, res: Response) => {
  const projects = loadProjects();
  const currentRoot = getProjectRoot();
  res.json({
    activeRoot: currentRoot,
    projects: projects.map((p) => ({
      ...p,
      isActive: path.resolve(p.root) === path.resolve(currentRoot),
      exists: fs.existsSync(p.root),
    })),
  });
});

app.post("/api/projects/switch", (req: Request, res: Response) => {
  const { nameOrPath, syncEditors, targetEditor } = req.body;
  if (!nameOrPath) {
    res.status(400).json({ error: "Missing nameOrPath" });
    return;
  }
  const result = switchActiveProject(nameOrPath, {
    syncEditors: Boolean(syncEditors),
    targetEditor: targetEditor as any,
  });
  if (!result.success) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json({
    success: true,
    activeProject: result.project,
    activeRoot: getProjectRoot(),
    editorSync: result.editorSync,
  });
});

app.post("/api/projects/update", (req: Request, res: Response) => {
  const { originalName, name, root, allowed_ports, allowed_commands } = req.body;
  if (!originalName) {
    res.status(400).json({ error: "originalName is required" });
    return;
  }
  const result = updateProject(originalName, {
    name,
    root,
    allowed_ports,
    allowed_commands,
  });
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result);
});

app.post("/api/projects/delete", (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const result = deleteProject(name);
  if (!result.success) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json(result);
});

// REST API for Dashboard: Editor configuration & live sync
app.get("/api/editors/status", (_req: Request, res: Response) => {
  res.json({
    editors: getAllEditorStatuses(),
    currentRoot: getProjectRoot(),
  });
});

app.post("/api/editors/sync", (req: Request, res: Response) => {
  const { projectNameOrPath, targetEditor } = req.body;
  const projects = loadProjects();
  let project = projectNameOrPath
    ? projects.find(
        (p) =>
          p.name.toLowerCase() === projectNameOrPath.toLowerCase() ||
          path.resolve(p.root) === path.resolve(projectNameOrPath)
      )
    : projects.find((p) => path.resolve(p.root) === path.resolve(getProjectRoot()));

  if (!project) {
    project = {
      name: path.basename(getProjectRoot()),
      root: getProjectRoot(),
      allowed_ports: getAllowedPorts().join(", "),
      allowed_commands: getAllowedCommands().join(", "),
    };
  }

  const result = syncProjectToEditors(project, (targetEditor as any) || "all");
  res.json({
    success: result.updated.length > 0 || (result.failed.length === 0 && result.skipped.length > 0),
    project,
    updated: result.updated,
    skipped: result.skipped,
    failed: result.failed,
  });
});

app.post("/api/projects/add", (req: Request, res: Response) => {
  const { name, root, allowed_ports, allowed_commands } = req.body;
  if (!name || !root) {
    res.status(400).json({ error: "name and root are required" });
    return;
  }
  const projects = loadProjects();
  if (projects.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
    res.status(409).json({ error: "Project with this name already exists" });
    return;
  }
  const newProject = {
    name,
    root: path.resolve(root),
    allowed_ports: allowed_ports || "3000,5173,8080",
    allowed_commands: allowed_commands || "npm run build,npx tsc --noEmit,npm test",
  };
  projects.push(newProject);
  saveProjects(projects);
  res.json({ success: true, project: newProject });
});

// REST API for Dashboard: Backups
app.get("/api/backups", (_req: Request, res: Response) => {
  const backupDir = getBackupDir();
  if (!fs.existsSync(backupDir)) {
    res.json({ backups: [] });
    return;
  }
  try {
    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".bak"));
    const backups = files.map((filename) => {
      const fullPath = path.join(backupDir, filename);
      const stat = fs.statSync(fullPath);
      const relPath = relativeBackupPath(fullPath);

      // parse original filename from __ separator
      const originalRel = filename
        .replace(/\.\d{4}-\d{2}-\d{2}T[\d-]+Z\.bak$/, "")
        .replace(/__/g, "/");

      return {
        filename,
        fullPath,
        relPath,
        originalRel,
        sizeBytes: stat.size,
        modifiedAt: stat.mtimeMs,
      };
    });

    backups.sort((a, b) => b.modifiedAt - a.modifiedAt);
    res.json({ backups });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/backups/diff", (req: Request, res: Response) => {
  const filename = req.query.filename as string;
  if (!filename) {
    res.status(400).json({ error: "Missing filename parameter" });
    return;
  }
  const backupDir = getBackupDir();
  const backupFilePath = path.join(backupDir, path.basename(filename));

  if (!fs.existsSync(backupFilePath)) {
    res.status(404).json({ error: "Backup file not found" });
    return;
  }

  const originalRel = path.basename(filename)
    .replace(/\.\d{4}-\d{2}-\d{2}T[\d-]+Z\.bak$/, "")
    .replace(/__/g, "/");

  const currentFilePath = resolveProjectPath(originalRel);
  const backupContent = fs.readFileSync(backupFilePath, "utf8");
  const currentContent = fs.existsSync(currentFilePath)
    ? fs.readFileSync(currentFilePath, "utf8")
    : "";

  res.json({
    originalRel,
    currentExists: fs.existsSync(currentFilePath),
    backupContent,
    currentContent,
  });
});

app.post("/api/backups/restore", async (req: Request, res: Response) => {
  const { filepath, backup_name } = req.body;
  if (!filepath) {
    res.status(400).json({ error: "filepath is required" });
    return;
  }

  const result = await restoreBackupTool.handler({
    filepath,
    backup_name_or_path: backup_name,
  });

  const output = result.content.map((c) => c.text).join("\n");
  res.json({
    success: !result.isError,
    result: output,
  });
});

app.post("/api/backups/create", (req: Request, res: Response) => {
  const { filepath } = req.body;
  if (!filepath) {
    res.status(400).json({ error: "filepath is required" });
    return;
  }
  try {
    const fullPath = resolveProjectPath(filepath);
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: `File not found: ${filepath}` });
      return;
    }
    const backupPath = backupFile(fullPath);
    res.json({
      success: true,
      backupPath,
      filename: path.basename(backupPath),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete("/api/backups", (req: Request, res: Response) => {
  const filename = (req.query.filename as string) || req.body?.filename;
  if (!filename) {
    res.status(400).json({ error: "filename parameter is required" });
    return;
  }
  const backupDir = getBackupDir();
  const filePath = path.join(backupDir, path.basename(filename));
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Backup file not found" });
    return;
  }
  try {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: `Backup ${path.basename(filename)} deleted` });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// REST API for Dashboard: Git operations
app.get("/api/git/status", async (_req: Request, res: Response) => {
  try {
    const result = await getGitStatusTool.handler({});
    res.json({
      success: !result.isError,
      output: result.content.map((c) => c.text).join("\n"),
      metadata: result.metadata,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/git/diff", async (req: Request, res: Response) => {
  try {
    const filepath = req.query.file as string | undefined;
    const staged = req.query.staged === "true";
    const result = await getGitDiffTool.handler({ filepath, staged });
    res.json({
      success: !result.isError,
      diff: result.content.map((c) => c.text).join("\n"),
      file: filepath || "all",
      staged,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// REST API for Dashboard: Terminal & Command Execution
app.post("/api/commands/run", async (req: Request, res: Response) => {
  const { command, timeout_ms, cwd } = req.body;
  if (!command) {
    res.status(400).json({ error: "command is required" });
    return;
  }
  try {
    const result = await runCommandTool.handler({
      command,
      timeout_ms: typeof timeout_ms === "number" ? timeout_ms : 30000,
      cwd,
    });
    res.json({
      success: !result.isError,
      output: result.content.map((c) => c.text).join("\n"),
      metadata: result.metadata,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// REST API for Dashboard: Filesystem Exploration & Safe Editing
app.get("/api/files/tree", async (req: Request, res: Response) => {
  try {
    const directory = (req.query.subpath as string) || (req.query.directory as string) || ".";
    const depth = req.query.depth ? Number(req.query.depth) : 3;
    const result = await listFilesTool.handler({ directory, depth });
    res.json({
      success: !result.isError,
      files: result.metadata?.files || [],
      directories: result.metadata?.directories || [],
      output: result.content.map((c) => c.text).join("\n"),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/files/read", async (req: Request, res: Response) => {
  const filepath = req.query.filepath as string;
  if (!filepath) {
    res.status(400).json({ error: "filepath query parameter is required" });
    return;
  }
  try {
    const result = await readFileTool.handler({
      filepath,
      start_line: req.query.start_line ? Number(req.query.start_line) : undefined,
      end_line: req.query.end_line ? Number(req.query.end_line) : undefined,
    });
    res.json({
      success: !result.isError,
      content: result.content.map((c) => c.text).join("\n"),
      metadata: result.metadata,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/files/save", async (req: Request, res: Response) => {
  const { filepath, content, create_if_missing } = req.body;
  if (!filepath || content === undefined) {
    res.status(400).json({ error: "filepath and content are required" });
    return;
  }
  try {
    const result = await editFileTool.handler({
      filepath,
      content,
      create_if_missing: Boolean(create_if_missing),
    });
    res.json({
      success: !result.isError,
      output: result.content.map((c) => c.text).join("\n"),
      metadata: result.metadata,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// REST API for Dashboard: Code Search
app.get("/api/search/code", async (req: Request, res: Response) => {
  const query = req.query.query as string;
  if (!query) {
    res.status(400).json({ error: "query query parameter is required" });
    return;
  }
  try {
    const result = await searchFilesTool.handler({
      query,
      directory: (req.query.directory as string) || (req.query.path as string) || ".",
      case_sensitive: req.query.case_sensitive === "true",
      is_regex: req.query.is_regex === "true",
      file_pattern: req.query.file_pattern as string | undefined,
    });
    res.json({
      success: !result.isError,
      output: result.content.map((c) => c.text).join("\n"),
      metadata: result.metadata,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// REST API for Dashboard: Dev radar scan
app.get("/api/ports/scan", async (req: Request, res: Response) => {
  const ports = req.query.ports as string | undefined;
  const result = await scanDevServersTool.handler({ ports });
  res.json(result.metadata || { content: result.content });
});

// REST API for Dashboard: Editor configuration snippets
app.get("/api/config/editors", (_req: Request, res: Response) => {
  const currentProject = {
    name: path.basename(getProjectRoot()),
    root: getProjectRoot(),
    allowed_ports: getAllowedPorts().join(", "),
    allowed_commands: getAllowedCommands().join(", "),
  };

  res.json({
    claude: generateEditorConfig("claude", currentProject),
    cursor: generateEditorConfig("cursor", currentProject),
    windsurf: generateEditorConfig("windsurf", currentProject),
    zed: generateEditorConfig("zed", currentProject),
  });
});

// Serve static Web UI if built into dist/public
const publicDir = path.resolve(process.cwd(), "dist", "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api") || req.path === "/health" || req.path === "/tools" || req.path === "/sse") {
      return next();
    }
    const indexHtml = path.join(publicDir, "index.html");
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      next();
    }
  });
} else {
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      name: "universal-dev-mcp",
      version: "1.0.0",
      status: "running",
      project_root: getProjectRoot(),
      allowed_ports: getAllowedPorts(),
      auth_required: Boolean(API_KEY),
      dashboard: "UI not built yet. Build UI to dist/public to access dashboard at http://localhost:3333/",
      endpoints: {
        "GET  /tools": "List tools",
        "POST /call": "Call tool",
        "GET  /openai/tools": "OpenAI schemas",
        "POST /openai/call": "OpenAI tool execution",
        "GET  /sse": "Real-time SSE event stream",
        "GET  /api/projects": "List projects",
        "POST /api/projects/switch": "Switch project",
        "GET  /api/backups": "List backups",
        "GET  /api/ports/scan": "Scan dev server ports",
      },
    });
  });
}

export function startHttpServer(port = HTTP_PORT): http.Server {
  return app.listen(port, () => {
    console.log(`Universal Dev MCP HTTP Server`);
    console.log(`Listening on:     http://localhost:${port}`);
    console.log(`Project root:     ${getProjectRoot()}`);
    console.log(`Allowed ports:    ${getAllowedPorts().join(", ")}`);
    console.log(`Allowed commands: ${getAllowedCommands().join(", ")}`);
    console.log(`Auth:             ${API_KEY ? "enabled (x-api-key required)" : "disabled"}`);
  });
}

import * as http from "http";
startHttpServer();
