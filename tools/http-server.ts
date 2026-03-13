/**
 * HTTP + SSE bridge for AI tools that do not natively support MCP stdio.
 *
 * Endpoints:
 *   GET  /                  Server info and available endpoints
 *   GET  /health            Health check (no auth required)
 *   GET  /tools             List all tools (name + description)
 *   POST /call              Call a tool by name
 *   GET  /openai/tools      Tool schemas in OpenAI function-calling format
 *   POST /openai/call       Execute tool calls in OpenAI format
 *   GET  /sse               Server-Sent Events stream
 *   POST /sse/broadcast     Broadcast an event to all SSE clients
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PROJECT_ROOT, ALLOWED_PORTS, ALLOWED_COMMANDS, HTTP_PORT, API_KEY } from "./config.js";
import { registerAllTools } from "./tools/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchUrl, httpRequest, stripHtmlToText } from "./utils/fetch.js";
import { isPortAllowed, isCommandAllowed, isPathAllowed, allowedPortsLabel, allowedCommandsLabel, allowedWriteDirsLabel } from "./utils/security.js";
import { backupFile, relativeBackupPath } from "./utils/backup.js";
import { getFileTree, resolveProjectPath, toRelativePath } from "./utils/fs.js";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);


async function callTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "get_project_info": {
      const lines: string[] = [`Project root: ${PROJECT_ROOT}`, ""];
      const pkgPath = path.join(PROJECT_ROOT, "package.json");
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
          lines.push(
            `Name: ${pkg.name || "(unnamed)"}`,
            `Version: ${pkg.version || "n/a"}`,
            `Scripts: ${Object.keys(pkg.scripts || {}).join(", ")}`,
            `Dependencies: ${Object.keys(pkg.dependencies || {}).slice(0, 15).join(", ")}`
          );
        } catch {
          lines.push("(Could not parse package.json)");
        }
      }
      const configs = [
        "tsconfig.json", "vite.config.ts", "next.config.js",
        "tailwind.config.js", ".eslintrc.json", "docker-compose.yml",
      ].filter((f) => fs.existsSync(path.join(PROJECT_ROOT, f)));
      if (configs.length) lines.push("", `Config files: ${configs.join(", ")}`);
      lines.push("", "Project structure:", getFileTree(PROJECT_ROOT, 0, 2));
      lines.push(`Allowed ports: ${ALLOWED_PORTS.join(", ")}`);
      lines.push(`Allowed commands: ${ALLOWED_COMMANDS.join(", ")}`);
      return lines.join("\n");
    }

    case "check_port": {
      const port = args.port as number;
      if (!isPortAllowed(port))
        return `Port ${port} is not allowed. Allowed: ${allowedPortsLabel()}`;
      return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/`, { timeout: 3000 }, (res) => {
          resolve(`Port ${port} is active. HTTP ${res.statusCode}`);
          res.resume();
        });
        req.on("error", () => resolve(`Port ${port} is inactive.`));
        req.on("timeout", () => { req.destroy(); resolve(`Port ${port} timed out.`); });
      });
    }

    case "view_page": {
      const port = args.port as number;
      const urlPath = (args.path as string) || "/";
      const includeRaw = args.include_raw_html as boolean;
      if (!isPortAllowed(port))
        return `Access denied: port ${port} not allowed. Allowed: ${allowedPortsLabel()}`;
      try {
        const { status, body, headers } = await fetchUrl(`http://localhost:${port}${urlPath}`);
        const title = body.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.trim() || "(no title)";
        const scripts: string[] = [];
        const sr = /<script[^>]*src=["']([^"']+)["']/gi;
        let sm: RegExpExecArray | null;
        while ((sm = sr.exec(body)) !== null) scripts.push(sm[1]);
        const lines = [
          `URL: http://localhost:${port}${urlPath}`,
          `Status: ${status}`,
          `Title: ${title}`,
          `Content-Type: ${headers["content-type"] || "unknown"}`,
          `Size: ${body.length} bytes`,
          scripts.length ? `Scripts: ${scripts.slice(0, 5).join(", ")}` : "",
          "",
          "Visible text:",
          stripHtmlToText(body),
        ].filter((l) => l !== "");
        if (includeRaw) lines.push("", "Raw HTML:", body.slice(0, 10000));
        return lines.join("\n");
      } catch (e) {
        return `Failed to reach localhost:${port}. Is your dev server running? (${(e as Error).message})`;
      }
    }

    case "get_api_response": {
      const port = args.port as number;
      const apiPath = args.path as string;
      const method = (args.method as string) || "GET";
      const bodyStr = args.body as string | undefined;
      const customHeaders = args.custom_headers as string | undefined;
      if (!isPortAllowed(port))
        return `Access denied: port ${port} not allowed. Allowed: ${allowedPortsLabel()}`;
      let extraHeaders: Record<string, string> = {};
      if (customHeaders) {
        try { extraHeaders = JSON.parse(customHeaders); }
        catch { return `Invalid custom_headers: must be a JSON string.`; }
      }
      try {
        const { status, body: rb, headers } = await httpRequest(
          `http://localhost:${port}${apiPath}`,
          { method, headers: extraHeaders, body: bodyStr ? Buffer.from(bodyStr) : undefined }
        );
        let parsed: unknown;
        try { parsed = JSON.parse(rb); } catch { parsed = null; }
        return [
          `${method} http://localhost:${port}${apiPath}`,
          `Status: ${status}`,
          `Content-Type: ${headers["content-type"] || "unknown"}`,
          "",
          "Response:",
          parsed ? JSON.stringify(parsed, null, 2).slice(0, 6000) : rb.slice(0, 6000),
        ].join("\n");
      } catch (e) {
        return `Request failed: ${(e as Error).message}`;
      }
    }

    case "read_file": {
      const filepath = args.filepath as string;
      const startLine = args.start_line as number | undefined;
      const endLine = args.end_line as number | undefined;
      const resolved = resolveProjectPath(filepath);
      if (!isPathAllowed(resolved)) return `Access denied. Must be within project root.`;
      if (!fs.existsSync(resolved)) return `File not found: ${resolved}`;
      const stat = fs.statSync(resolved);
      if (stat.isDirectory()) return `That path is a directory. Use list_files.`;
      if (stat.size > 1_000_000) return `File too large (${(stat.size / 1024).toFixed(1)} KB).`;
      const content = fs.readFileSync(resolved, "utf8");
      const lines = content.split("\n");
      const from = startLine ? Math.max(1, startLine) - 1 : 0;
      const to = endLine ? Math.min(lines.length, endLine) : lines.length;
      const ext = path.extname(resolved).slice(1) || "text";
      return [
        `File: ${toRelativePath(resolved)} (lines ${from + 1}–${to} of ${lines.length})`,
        "",
        "```" + ext,
        lines.slice(from, to).join("\n"),
        "```",
      ].join("\n");
    }

    case "edit_file": {
      const filepath = args.filepath as string;
      const content = args.content as string;
      const createIfMissing = args.create_if_missing as boolean;
      const resolved = resolveProjectPath(filepath);
      if (!isPathAllowed(resolved, true))
        return `Write access denied. Allowed: ${allowedWriteDirsLabel()}`;
      const exists = fs.existsSync(resolved);
      if (!exists && !createIfMissing)
        return `File does not exist. Set create_if_missing to true to create it.`;
      const backupPath = exists ? backupFile(resolved) : "";
      const dir = path.dirname(resolved);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(resolved, content, "utf8");
      return [
        `Written: ${toRelativePath(resolved)}`,
        `Size: ${content.split("\n").length} lines, ${content.length} bytes`,
        backupPath ? `Backup: ${relativeBackupPath(backupPath)}` : "",
      ].filter(Boolean).join("\n");
    }

    case "patch_file": {
      const filepath = args.filepath as string;
      const oldStr = args.old_string as string;
      const newStr = args.new_string as string;
      const resolved = resolveProjectPath(filepath);
      if (!isPathAllowed(resolved, true)) return `Write access denied.`;
      if (!fs.existsSync(resolved)) return `File not found: ${resolved}`;
      const original = fs.readFileSync(resolved, "utf8");
      const count = original.split(oldStr).length - 1;
      if (count === 0)
        return `String not found in file. Check whitespace and indentation.`;
      if (count > 1)
        return `Found ${count} occurrences — old_string must be unique. Add more surrounding context.`;
      const backup = backupFile(resolved);
      fs.writeFileSync(resolved, original.replace(oldStr, newStr), "utf8");
      return [
        `Patch applied: ${toRelativePath(resolved)}`,
        `Backup: ${relativeBackupPath(backup)}`,
      ].join("\n");
    }

    case "list_files": {
      const directory = (args.directory as string) || "";
      const depth = Math.min((args.depth as number) || 3, 5);
      const target = path.join(PROJECT_ROOT, directory);
      if (!isPathAllowed(target)) return `Access denied.`;
      if (!fs.existsSync(target)) return `Directory not found: ${target}`;
      return [
        `Directory: ${directory || "(root)"}`,
        `Root: ${PROJECT_ROOT}`,
        "",
        getFileTree(target, 0, depth) || "(empty)",
      ].join("\n");
    }

    case "run_command": {
      const command = args.command as string;
      const timeoutMs = (args.timeout_ms as number) || 30000;
      if (!isCommandAllowed(command))
        return [`Command not allowed: "${command}"`, "", "Allowed commands:", allowedCommandsLabel()].join("\n");
      try {
        const start = Date.now();
        const { stdout, stderr } = await execAsync(command, {
          cwd: PROJECT_ROOT,
          timeout: timeoutMs,
          maxBuffer: 1024 * 1024,
        });
        const duration = Date.now() - start;
        const lines = [
          `Command: ${command}`,
          `Duration: ${duration}ms`,
          `Exit: 0 (success)`,
        ];
        if (stdout.trim()) lines.push("", "stdout:", stdout.trimEnd().slice(0, 5000));
        if (stderr.trim()) lines.push("", "stderr:", stderr.trimEnd().slice(0, 2000));
        return lines.join("\n");
      } catch (e) {
        const err = e as { message?: string; stdout?: string; stderr?: string; killed?: boolean; code?: number };
        const lines = [
          `Command: ${command}`,
          err.killed ? `Exit: killed (timeout)` : `Exit: ${err.code ?? "failure"}`,
          `Error: ${err.message}`,
        ];
        if (err.stdout?.trim()) lines.push("", "stdout:", err.stdout.slice(0, 3000));
        if (err.stderr?.trim()) lines.push("", "stderr:", err.stderr.slice(0, 3000));
        return lines.join("\n");
      }
    }

    default:
      return `Unknown tool: "${name}"`;
  }
}

const OPENAI_TOOLS = [
  { type: "function", function: { name: "get_project_info", description: "Get a full overview of the project. Call this first.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "check_port", description: "Check if a dev server is running on a given port.", parameters: { type: "object", properties: { port: { type: "number" } }, required: ["port"] } } },
  { type: "function", function: { name: "view_page", description: "Fetch a page from a running local dev server.", parameters: { type: "object", properties: { port: { type: "number" }, path: { type: "string" }, include_raw_html: { type: "boolean" } }, required: ["port"] } } },
  { type: "function", function: { name: "get_api_response", description: "Call an API endpoint on a local dev server.", parameters: { type: "object", properties: { port: { type: "number" }, path: { type: "string" }, method: { type: "string", enum: ["GET","POST","PUT","DELETE","PATCH"] }, body: { type: "string" }, custom_headers: { type: "string" } }, required: ["port", "path"] } } },
  { type: "function", function: { name: "read_file", description: "Read a source file from the project.", parameters: { type: "object", properties: { filepath: { type: "string" }, start_line: { type: "number" }, end_line: { type: "number" } }, required: ["filepath"] } } },
  { type: "function", function: { name: "edit_file", description: "Overwrite a file (auto-backup created first).", parameters: { type: "object", properties: { filepath: { type: "string" }, content: { type: "string" }, create_if_missing: { type: "boolean" } }, required: ["filepath", "content"] } } },
  { type: "function", function: { name: "patch_file", description: "Replace a unique string inside a file.", parameters: { type: "object", properties: { filepath: { type: "string" }, old_string: { type: "string" }, new_string: { type: "string" } }, required: ["filepath", "old_string", "new_string"] } } },
  { type: "function", function: { name: "list_files", description: "List the project file structure as a tree.", parameters: { type: "object", properties: { directory: { type: "string" }, depth: { type: "number" } } } } },
  { type: "function", function: { name: "run_command", description: `Run an allowlisted shell command. Allowed: ${ALLOWED_COMMANDS.join(", ")}`, parameters: { type: "object", properties: { command: { type: "string" }, timeout_ms: { type: "number" } }, required: ["command"] } } },
];

const app = express();
app.use(cors());
app.use(express.json());

// Optional API key middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!API_KEY) return next();
  if (req.path === "/" || req.path === "/health") return next();
  const key = req.headers["x-api-key"] || req.query["api_key"];
  if (key !== API_KEY) {
    res.status(401).json({ error: "Unauthorized. Provide a valid x-api-key header." });
    return;
  }
  next();
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "universal-dev-mcp",
    version: "1.0.0",
    status: "running",
    project_root: PROJECT_ROOT,
    allowed_ports: ALLOWED_PORTS,
    auth_required: Boolean(API_KEY),
    endpoints: {
      "GET  /":               "Server info",
      "GET  /health":         "Health check",
      "GET  /tools":          "List tools",
      "POST /call":           "Call a tool",
      "GET  /openai/tools":   "Tool schemas in OpenAI format",
      "POST /openai/call":    "Execute OpenAI-format tool calls",
      "GET  /sse":            "Server-Sent Events stream",
      "POST /sse/broadcast":  "Broadcast an event to SSE clients",
    },
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/tools", (_req: Request, res: Response) => {
  res.json({
    tools: OPENAI_TOOLS.map((t) => ({
      name: t.function.name,
      description: t.function.description,
    })),
  });
});

app.post("/call", async (req: Request, res: Response) => {
  const { name, arguments: args } = req.body;
  if (!name) {
    res.status(400).json({ error: "Missing required field: name" });
    return;
  }
  try {
    const result = await callTool(name, (args as Record<string, unknown>) || {});
    res.json({ result });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/openai/tools", (_req: Request, res: Response) => {
  res.json({ tools: OPENAI_TOOLS });
});

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
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch { /* use empty */ }
        const result = await callTool(tc.function.name, args);
        return { tool_call_id: tc.id, role: "tool", content: result };
      })
    );
    res.json({ tool_results: results });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

const sseClients = new Set<Response>();

app.get("/sse", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(
    `data: ${JSON.stringify({ type: "connected", message: "Universal Dev MCP SSE stream ready" })}\n\n`
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

app.post("/sse/broadcast", (req: Request, res: Response) => {
  const payload = JSON.stringify(req.body);
  sseClients.forEach((client) => client.write(`data: ${payload}\n\n`));
  res.json({ sent_to: sseClients.size });
});


// Register MCP tools (for any future MCP-over-HTTP use)
const _mcpServer = new McpServer({ name: "universal-dev-mcp", version: "1.0.0" });
registerAllTools(_mcpServer);

app.listen(HTTP_PORT, () => {
  console.log(`Universal Dev MCP HTTP Server`);
  console.log(`Listening on:     http://localhost:${HTTP_PORT}`);
  console.log(`Project root:     ${PROJECT_ROOT}`);
  console.log(`Allowed ports:    ${ALLOWED_PORTS.join(", ")}`);
  console.log(`Allowed commands: ${ALLOWED_COMMANDS.join(", ")}`);
  console.log(`Auth:             ${API_KEY ? "enabled (x-api-key required)" : "disabled"}`);
});