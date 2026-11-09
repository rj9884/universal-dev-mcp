# universal-dev-mcp

A universal MCP (Model Context Protocol) server and real-time developer platform that bridges AI coding tools to your local development environment. Connect Claude Desktop, Cursor, Windsurf, Zed, Gemini, ChatGPT, or any MCP-compatible tool to your localhost dev server — view pages, call APIs, read and edit source files, run commands, inspect git status, compare diffs, and switch between projects — complete with a modern real-time Web UI Dashboard.

---

## Table of contents

- [Features](#features)
- [Web UI Dashboard](#web-ui-dashboard)
- [How it works](#how-it-works)
- [Available tools (17 tools)](#available-tools)
- [Project structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Connecting to Claude Desktop, Cursor, Windsurf & Zed](#connecting-to-mcp-compatible-editors)
- [Switching projects](#switching-projects)
- [Connecting to Gemini / ChatGPT (HTTP mode)](#connecting-to-gemini--chatgpt-http-mode)
- [Security](#security)
- [Testing](#testing)
- [npm scripts](#npm-scripts)
- [Example prompts](#example-prompts)
- [License](#license)

---

## Features

- **⚡ 17 Powerful MCP Tools**: Inspect project structure, read/edit/patch files, search with regex/glob, run commands, check dev server ports, scrape DOM/meta tags, test APIs, query structured Git status/diffs, scan ports in parallel, and restore backups.
- **🖥️ Embedded Web UI Dashboard**: Embedded web application served at `http://localhost:3333/` featuring Project Hub, Live AI Activity Feed, Visual Backup Diff Viewer, Dev Server Radar, and API Playground.
- **📡 Real-Time Telemetry & Observability**: SSE event stream broadcasting every AI tool call, arguments, execution duration, and diffs as they happen.
- **🛡️ Auto-Backups & 1-Click Rollback**: Automatic timestamped backups created before any file modification or deletion with 1-click restore.
- **🔄 Multi-Editor Switcher (`mcp-switch`)**: 1-click project switching across Claude Desktop, Cursor (`mcp.json`), Windsurf (`mcp_config.json`), and Zed (`settings.json`).
- **🔒 Enterprise Security Guardrails**: Configurable port allowlists, command allowlists, directory boundary confinement, and strict shell injection prevention.

---

## Web UI Dashboard

Start the server in HTTP mode:

```bash
npm run start:http
```

Open **`http://localhost:3333/`** in your browser.

- **📁 Project Command Center**: View all configured projects, active Git branches, commit history, and switch active context dynamically without restarting.
- **⚡ Live AI Activity Feed**: Real-time ticker showing every command Claude or Cursor runs on your machine, with arguments, duration, and output.
- **🛡️ Backup & Diff Center**: Side-by-side visual diff comparison between current file versions and timestamped `.mcp-backups/` with a 1-click "Restore Version" button.
- **📡 Dev Server Radar**: Parallel port scanner showing active localhost servers (Vite, Next.js, Express, etc.), response latency, and DOM page inspection.
- **🧪 API & Command Workbench**: Test local endpoints with custom headers/JSON bodies, or run allowlisted CLI commands with formatted terminal outputs.

---

## How it works

universal-dev-mcp sits between your AI tool and your local dev environment. It exposes two transport layers depending on what your AI tool supports:

```
┌──────────────────────────────────────────────────────────────────┐
│                           AI Tools                               │
│                                                                  │
│   ┌─────────────────────────┐    ┌────────────────────────────┐  │
│   │  Claude Desktop         │    │  Gemini  │  ChatGPT  │ etc │  │
│   │  Cursor / Windsurf / Zed│    └────────────────────────────┘  │
│   │  any MCP-compatible tool│              │                     │
│   └────────────┬────────────┘              │ HTTP + SSE          │
│                │ MCP stdio (JSON-RPC)       │ localhost:3333      │
└────────────────┼──────────────────────────-┼────────────────────-┘
                 │                            │
       ┌─────────▼──────────┐      ┌──────────▼─────────┐
       │    server.ts        │      │   http-server.ts    │
       │    (stdio mode)     │      │   (HTTP/SSE mode)   │
       └─────────┬───────────┘      └──────────┬──────────┘
                 └──────────────┬───────────────┘
                                │
                    ┌───────────▼───────────┐
                    │      12 MCP Tools      │
                    │                        │
                    │  get_active_project    │
                    │  get_project_info      │
                    │  check_port            │
                    │  view_page             │
                    │  get_api_response      │
                    │  read_file             │
                    │  edit_file             │
                    │  patch_file            │
                    │  list_files            │
                    │  delete_file           │
                    │  move_file             │
                    │  search_files          │
                    │  run_command           │
                    └───────────┬───────────┘
                                │  allowlist guards + auto-backup
                                │
               ┌────────────────▼────────────────┐
               │      Your local dev project      │
               │      localhost:5173 / :3000      │
               │      src/  package.json  etc.    │
               └─────────────────────────────────-┘
```

**MCP stdio** (`server.ts`) — used by editors that support MCP natively (Claude Desktop, Cursor, Windsurf, Zed). The editor spawns the server as a child process and communicates over stdin/stdout.

**HTTP/SSE** (`http-server.ts`) — used by tools that don't support MCP stdio. Exposes a REST API and an OpenAI-compatible tool-calling interface so any HTTP client can call the same tools.

All tool calls go through the same security layer regardless of transport: port allowlist, command allowlist, write directory scope, and automatic file backups.

---

## Available tools

| Tool | Description |
|---|---|
| `get_active_project` | Show active project — name, root, git branch, file count, and last commit. |
| `get_project_info` | Read package.json, scripts, dependencies, config files, and 2-level directory tree. |
| `get_git_status` | Detailed structured Git status: branch, staged/unstaged changes, untracked files, and recent 5 commits. |
| `get_git_diff` | View working tree or staged diff, optionally filtered to a specific file. |
| `scan_dev_servers` | Scan localhost ports in parallel to detect running dev servers (Vite, Next.js, CRA, Express, Django). |
| `check_port` | Verify a dev server is running and responding on a given port. |
| `view_page` | Fetch HTML from a running dev server — returns title, meta tags, scripts, and visible text. |
| `get_api_response` | Make HTTP requests (GET/POST/PUT/DELETE/PATCH) to API endpoints on a local server. |
| `read_file` | Read a source file, optionally limiting output to a line range. |
| `edit_file` | Overwrite a file with new content (timestamped backup created automatically). |
| `patch_file` | Replace a unique string inside a file without rewriting it entirely (auto-backup created). |
| `restore_backup` | Restore a file to its latest automated backup or a specified backup timestamp. |
| `list_files` | Display the project directory as a structured file tree. |
| `delete_file` | Delete a file (timestamped backup created automatically before deletion). |
| `move_file` | Move or rename a file within the project (backup created automatically). |
| `search_files` | Search for text or regex across all project files with optional glob filter. |
| `run_command` | Run an allowlisted shell command (tests, lint, build, type-check) in project root or subfolder (`cwd`). |

---

## Project structure

```
universal-dev-mcp/
├── src/
│   ├── cli/
│   │   └── switch.ts          Cross-platform CLI for switching projects (mcp-switch)
│   ├── config.ts              Environment variables and defaults
│   ├── server.ts              MCP stdio entry point
│   ├── http-server.ts         HTTP/SSE server for tools that do not support MCP stdio
│   ├── tools/
│   │   ├── index.ts           Registers all tools onto the server
│   │   ├── browser.ts         view_page, check_port
│   │   ├── api.ts             get_api_response
│   │   ├── files.ts           read_file, edit_file, patch_file, list_files, delete_file, move_file
│   │   ├── search.ts          search_files
│   │   ├── commands.ts        run_command
│   │   └── project.ts         get_project_info, get_active_project
│   └── utils/
│       ├── security.ts        Port, command, and path access guards
│       ├── backup.ts          File backup creation, rotation, and cleanup
│       ├── fetch.ts           HTTP fetch helpers and HTML parsing utilities
│       └── fs.ts              File tree generation and path helpers
├── projects.json              List of projects for mcp-switch
├── .env.example               Configuration template
├── .gitignore
├── LICENSE                    MIT License
├── package.json
├── tsconfig.json
└── README.md
```

---

## Installation

```bash
git clone https://github.com/rj9884/universal-dev-mcp
cd universal-dev-mcp
npm install
# npm install automatically compiles TypeScript via the prepare script
```

To make the `mcp-switch` CLI available globally on your machine:

```bash
npm link
```

---

## Configuration

```bash
cp .env.example .env
```

Edit `.env`:

```env
PROJECT_ROOT=/Users/yourname/projects/my-app

# Ports your dev servers run on
# Vite=5173  Next.js/CRA=3000  Angular=4200  Vue=8080
ALLOWED_PORTS=3000,5173

# Commands the AI may run
ALLOWED_COMMANDS=npm test,npm run lint,npm run build

# Port for the HTTP server (Gemini / ChatGPT mode)
HTTP_PORT=3333

# Optional: require an API key on all HTTP endpoints
# MCP_API_KEY=your-secret-key
```

---

## Connecting to Claude Desktop

Edit your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json` or `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude_desktop_config.json` (Windows Store install)
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "universal-dev-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/universal-dev-mcp/dist/server.js"],
      "env": {
        "PROJECT_ROOT": "/absolute/path/to/your/project",
        "ALLOWED_PORTS": "5173,3000",
        "ALLOWED_COMMANDS": "npm test,npm run lint,npm run build"
      }
    }
  }
}
```

Use absolute paths. Restart Claude Desktop after saving.

---

## Switching projects

Instead of manually editing `claude_desktop_config.json` every time you switch projects, use the built-in `mcp-switch` CLI. It works on **Windows, macOS, and Linux**.

### Setup

Add your projects to `projects.json` in the repo root:

```json
{
  "projects": [
    {
      "name": "my-react-app",
      "root": "/Users/yourname/projects/my-react-app",
      "allowed_ports": "3000,5173",
      "allowed_commands": "npm run build,npm test,npm run dev"
    },
    {
      "name": "my-api-server",
      "root": "/Users/yourname/projects/my-api-server",
      "allowed_ports": "8080",
      "allowed_commands": "npm run build,npm test"
    }
  ]
}
```

### Commands

```bash
# Interactive menu — pick a project by number
npx mcp-switch

# Switch directly by name
npx mcp-switch use my-react-app

# Show the currently active project
npx mcp-switch current

# List all projects (active one is marked with *)
npx mcp-switch list

# Add a new project interactively
npx mcp-switch add
```

After switching, **restart Claude Desktop** for the change to take effect.

### Confirming the switch inside Claude

After restarting Claude Desktop, ask Claude:

> "which project is active?"

Claude will call `get_active_project` and show you the project name, root path, git branch, and file count — so you can visually confirm the switch worked.

---

## Connecting to MCP-compatible editors

Any editor that supports MCP stdio (Cursor, Windsurf, Zed, and others) uses the same configuration format. Open your editor's MCP settings and add the same server block shown in the Claude Desktop section above, then restart the editor.

---

## Connecting to Gemini / ChatGPT (HTTP mode)

Start the HTTP server:

```bash
npm run start:http
```

The server starts on `http://localhost:3333`.

### Available HTTP endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Server info and endpoint list |
| GET | `/health` | Health check |
| GET | `/tools` | List all tools |
| POST | `/call` | Call a tool by name |
| GET | `/openai/tools` | Tool schemas in OpenAI function-calling format |
| POST | `/openai/call` | Execute OpenAI-format tool calls |
| GET | `/sse` | Server-Sent Events stream |
| POST | `/sse/broadcast` | Broadcast an event to all SSE clients |

### Example: calling a tool directly

```bash
curl -X POST http://localhost:3333/call \
  -H "Content-Type: application/json" \
  -d '{"name": "get_project_info", "arguments": {}}'
```

### Example: Gemini integration (TypeScript)

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const MCP_URL = "http://localhost:3333";

async function getMcpTools() {
  const res = await fetch(`${MCP_URL}/openai/tools`);
  const { tools } = await res.json();
  return tools;
}

async function callMcpTool(name: string, args: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${MCP_URL}/openai/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tool_calls: [
        { id: "call_1", function: { name, arguments: JSON.stringify(args) } },
      ],
    }),
  });
  const { tool_results } = await res.json();
  return tool_results[0].content;
}

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const tools = await getMcpTools();

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    tools: [{ functionDeclarations: tools.map((t: any) => t.function) }],
  });

  const chat = model.startChat();
  let result = await chat.sendMessage("Get an overview of my project.");

  while (result.response.functionCalls()?.length) {
    const toolResponses = await Promise.all(
      result.response.functionCalls()!.map(async (call) => {
        const output = await callMcpTool(call.name, call.args as Record<string, unknown>);
        return { functionResponse: { name: call.name, response: { result: output } } };
      })
    );
    result = await chat.sendMessage(toolResponses);
  }

  console.log(result.response.text());
}

main();
```

---

## Security

All tool calls are restricted by the following controls:

- **Port allowlist** — AI can only connect to ports listed in `ALLOWED_PORTS`.
- **Command allowlist** — AI can only run commands listed in `ALLOWED_COMMANDS`.
- **Write directory scope** — File writes are restricted to `ALLOWED_WRITE_DIRS` (defaults to `PROJECT_ROOT`).
- **Path traversal protection** — All paths are resolved and validated against allowed directories before any operation.
- **Automatic backups** — Every file write or delete creates a `.mcp-backups/filename.timestamp.bak` before making any change. Backups older than 7 days are cleaned up automatically; at most 10 backups are kept per file.
- **API key** — Set `MCP_API_KEY` to require authentication on all HTTP endpoints.

### Restoring a backup

```bash
ls .mcp-backups/
cp .mcp-backups/App.tsx.2026-03-13T10-00-00.bak src/App.tsx
```

---

## Testing

universal-dev-mcp includes an automated test suite powered by Vitest, testing security guardrails, shell injection prevention, backup creation, and tool execution:

```bash
npm test
```

---

## npm scripts

```bash
npm run build         # Compile both server and UI (dist/ and dist/public/)
npm run build:server  # Compile TypeScript server to dist/
npm run build:ui      # Compile React UI to dist/public/
npm test              # Run automated Vitest test suite
npm run start         # Start stdio server (Claude Desktop, Cursor, Windsurf, Zed)
npm run start:http    # Start HTTP + SSE server & Web UI Dashboard (http://localhost:3333)
npm run dev           # stdio server with ts-node (no build step)
npm run dev:http      # HTTP server with ts-node (no build step)
npm run dev:ui        # Start Vite dev server for Web UI on port 5174
```

---

## Example prompts

Once connected to your AI tool:

```
Which project is currently active?
```
```
Check if my dev server is running on port 5173.
```
```
Get an overview of my project and tell me what tech stack it uses.
```
```
Fetch the homepage from localhost:5173 and describe the UI structure.
```
```
Search for all usages of the useAuth hook across the project.
```
```
Read src/App.tsx and identify any potential issues.
```
```
Run npm test and summarize any failures.
```
```
Fix the TypeScript error in src/utils/api.ts on line 42.
```
```
Rename src/utils/helpers.ts to src/utils/format.ts.
```

---

## License

MIT License — Copyright (c) 2026 RAJAN JAISWAL

See [LICENSE](./LICENSE) for the full text.
