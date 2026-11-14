<img width="2822" height="1564" alt="overview" src="https://github.com/user-attachments/assets/6a2f4db8-8dd3-4049-9e14-6db8602ff407" />

---

# universal-dev-mcp

A universal MCP (Model Context Protocol) server and real-time developer platform that bridges AI coding tools to your local development environment. Connect Claude Desktop, Cursor, Windsurf, Zed, Gemini, ChatGPT, or any MCP-compatible tool to your localhost dev server — view pages, call APIs, read and edit source files, run commands, inspect git status, compare diffs, and switch between projects — complete with an embedded real-time Web UI Dashboard.

---

## Table of contents

- [Features](#features)
- [Web UI Dashboard](#web-ui-dashboard)
- [How it works](#how-it-works)
- [Available tools (17 tools)](#available-tools-17-tools)
- [Project structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Connecting to Claude Desktop](#connecting-to-claude-desktop)
- [Connecting to Cursor, Windsurf & Zed](#connecting-to-cursor-windsurf--zed)
- [Switching projects](#switching-projects)
- [Connecting to Gemini / ChatGPT (HTTP mode)](#connecting-to-gemini--chatgpt-http-mode)
- [Security & guardrails](#security--guardrails)
- [Automated backups & rollback](#automated-backups--rollback)
- [Testing](#testing)
- [npm scripts](#npm-scripts)
- [Example prompts](#example-prompts)
- [License](#license)

---

## Features

- ** 17 Powerful MCP Tools**: Comprehensive toolset covering project discovery, file operations, regex/glob search, allowlisted shell commands, parallel dev server port scanning, DOM/meta scraping, API testing, structured Git status, diff inspection, and automated backup rollback.
- ** Embedded Web UI Dashboard**: Modern full-width web application served at `http://localhost:3333/` featuring Project Hub, Live AI Activity Feed, Visual Backup Diff Viewer, Dev Server Radar, and API Playground.
- ** Real-Time Telemetry & Observability**: Server-Sent Events (SSE) stream broadcasting every AI tool call, arguments, execution duration, and diffs as they happen on your machine.
- ** Auto-Backups & 1-Click Rollback**: Automatic timestamped backups (`.mcp-backups/`) created before any file modification or deletion, with instant restore via MCP tool, Web UI, or REST API.
- ** Multi-Editor Switcher (`mcp-switch`)**: CLI and Web UI project switching with automatic config synchronization across Claude Desktop, Cursor (`mcp.json`), Windsurf (`mcp_config.json`), and Zed (`settings.json`).
- ** Enterprise Security Guardrails**: Strict port allowlists, command allowlists, directory boundary confinement, path traversal guards, and shell injection prevention.
- ** Dual Transports**: Native MCP stdio (JSON-RPC) for code editors, plus HTTP/REST and OpenAI-compatible endpoints for Gemini, ChatGPT, or web applications.

---

## Web UI Dashboard

Start the server in HTTP mode:

```bash
npm run start:http
```

Open **`http://localhost:3333/`** in your browser.

- ** Home Overview**: Hero stage showcasing system status, active project root, connected editors, and telemetry statistics.
- ** Project Hub**: Multi-column command center displaying active Git status (branch, modified/untracked files, commit history) and a 1-click project switcher across all configured workspaces.
- ** Live AI Activity Feed**: Real-time ticker streaming every tool call executed by Claude, Cursor, or Gemini, complete with arguments, duration, and output logs via SSE.
- ** Backup Center**: Visual side-by-side diff viewer comparing current file versions against timestamped snapshots with a 1-click "Restore Version" button.
- ** Dev Server Radar**: Parallel port scanner detecting running localhost servers (Vite, Next.js, Express, Django, etc.), response latency, and DOM page inspection.
- ** API & Command Workbench**: Interactive playground to test local REST endpoints with custom headers/JSON bodies, or execute allowlisted shell commands with formatted terminal outputs.

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
└────────────────┼───────────────────────────┼─────────────────────┘
                 │                            │
       ┌─────────▼──────────┐      ┌──────────▼─────────┐
       │     server.ts      │      │   http-server.ts   │
       │    (stdio mode)    │      │  (HTTP / SSE mode) │
       └─────────┬──────────┘      └──────────┬─────────┘
                 └──────────────┬─────────────┘
                                │
                    ┌───────────▼───────────┐
                    │      17 MCP Tools     │
                    │                       │
                    │  get_active_project   │
                    │  get_project_info     │
                    │  get_git_status       │
                    │  get_git_diff         │
                    │  scan_dev_servers     │
                    │  check_port           │
                    │  view_page            │
                    │  get_api_response     │
                    │  read_file            │
                    │  edit_file            │
                    │  patch_file           │
                    │  restore_backup       │
                    │  list_files           │
                    │  delete_file          │
                    │  move_file            │
                    │  search_files         │
                    │  run_command          │
                    └───────────┬───────────┘
                                │  allowlist guards + auto-backup
                                │
               ┌────────────────▼────────────────┐
               │      Your local dev project     │
               │      localhost:5173 / :3000     │
               │      src/  package.json  etc.   │
               └─────────────────────────────────┘
```

**MCP stdio** (`server.ts`) — used by editors that support MCP natively (Claude Desktop, Cursor, Windsurf, Zed). The editor spawns the server as a child process and communicates over stdin/stdout.

**HTTP/SSE** (`http-server.ts`) — used by web applications, browser agents, or AI models (Gemini, ChatGPT) that connect over HTTP. Hosts the Web UI Dashboard, REST API endpoints, OpenAI function-calling bridge, and real-time SSE stream.

All tool calls pass through the same security layer regardless of transport: port allowlist, command allowlist, write directory scope, and automatic file backups.

---

## Available tools (17 tools)

| Category | Tool | Description |
|---|---|---|
| **Project** | `get_active_project` | Show active project — name, root, git branch, file count, and last commit. |
| **Project** | `get_project_info` | Read package.json, scripts, dependencies, config files, and 2-level directory tree. |
| **Git** | `get_git_status` | Detailed structured Git status: branch, staged/unstaged changes, untracked files, and recent 5 commits. |
| **Git** | `get_git_diff` | View working tree or staged diff, optionally filtered to a specific file. |
| **Dev Server** | `scan_dev_servers` | Scan localhost ports in parallel to detect running dev servers (Vite, Next.js, CRA, Express, Django). |
| **Dev Server** | `check_port` | Verify a dev server is running and responding on a given port. |
| **Browser / API** | `view_page` | Fetch HTML from a running dev server — returns title, meta tags, scripts, and visible text. |
| **Browser / API** | `get_api_response` | Make HTTP requests (GET/POST/PUT/DELETE/PATCH) to API endpoints on a local server. |
| **Filesystem** | `read_file` | Read a source file, optionally limiting output to a line range. |
| **Filesystem** | `edit_file` | Overwrite a file with new content (timestamped backup created automatically). |
| **Filesystem** | `patch_file` | Replace a unique string inside a file without rewriting it entirely (auto-backup created). |
| **Filesystem** | `restore_backup` | Restore a file to its latest automated backup or a specified backup timestamp. |
| **Filesystem** | `list_files` | Display the project directory as a structured file tree. |
| **Filesystem** | `delete_file` | Delete a file (timestamped backup created automatically before deletion). |
| **Filesystem** | `move_file` | Move or rename a file within the project (backup created automatically). |
| **Search** | `search_files` | Search for text or regex across all project files with optional glob filter. |
| **Execution** | `run_command` | Run an allowlisted shell command (tests, lint, build, type-check) in project root or subfolder (`cwd`). |

---

## Project structure

```
universal-dev-mcp/
├── src/
│   ├── cli/
│   │   └── switch.ts          Cross-platform CLI for switching projects (mcp-switch)
│   ├── core/
│   │   ├── events.ts          Central activity bus & SSE event emitter
│   │   ├── project-manager.ts Multi-project state manager & editor config generator
│   │   ├── registry.ts        Tool registry & OpenAI tool-calling adapter
│   │   └── types.ts           TypeScript interfaces and telemetry schemas
│   ├── tools/
│   │   ├── api.ts             get_api_response
│   │   ├── browser.ts         view_page, check_port
│   │   ├── commands.ts        run_command (with cwd and injection checks)
│   │   ├── files.ts           read_file, edit_file, patch_file, list_files, delete_file, move_file, restore_backup
│   │   ├── git.ts             get_git_status, get_git_diff
│   │   ├── index.ts           Aggregates and registers all tools
│   │   ├── project.ts         get_project_info, get_active_project
│   │   ├── radar.ts           scan_dev_servers (parallel port scanner)
│   │   └── search.ts          search_files
│   ├── utils/
│   │   ├── backup.ts          File backup creation, rotation, diffing, and restoration
│   │   ├── fetch.ts           HTTP fetch helpers and HTML parsing utilities
│   │   ├── fs.ts              File tree generation and path helpers
│   │   └── security.ts        Port, command, shell-injection, and path access guards
│   ├── config.ts              Environment variables and mutable live configuration
│   ├── http-server.ts         Express HTTP + SSE server & Web UI host (port 3333)
│   └── server.ts              MCP stdio entry point (JSON-RPC)
├── ui/                        Embedded Web UI Dashboard (React + Vite + Tailwind)
│   ├── src/
│   │   ├── api/client.ts      Typed REST & SSE client
│   │   ├── components/        Navbar, Home, ProjectHub, ActivityFeed, BackupCenter, DevRadar, ApiPlayground
│   │   └── hooks/             useActivityStream
│   └── public/                Mascot and visual assets
├── tests/                     Automated Vitest test suite
│   ├── backup.test.ts         Backup creation, rotation, and rollback tests
│   ├── security.test.ts       Path traversal, allowlist, and injection prevention tests
│   └── tools.test.ts          Git, radar, and file tool execution tests
├── projects.json              Project registry for mcp-switch and Project Hub
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
```

`npm install` compiles TypeScript automatically via the `prepare` script.

To make the `mcp-switch` CLI available globally on your system:

```bash
npm link
```

---

## Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Absolute path to your active project repository
PROJECT_ROOT=/home/yourname/projects/my-app

# Ports your dev servers run on (comma-separated)
# Vite=5173  Next.js/CRA=3000  Angular=4200  Vue=8080  Django=8000
ALLOWED_PORTS=3000,5173,8080

# Shell commands the AI is permitted to run
ALLOWED_COMMANDS=npm test,npm run lint,npm run build,npx tsc --noEmit

# Port for the HTTP server & Web UI Dashboard
HTTP_PORT=3333

# Optional: restrict file writes to specific subdirectories (defaults to PROJECT_ROOT)
# ALLOWED_WRITE_DIRS=/home/yourname/projects/my-app/src

# Optional: require an API key on all HTTP endpoints (passed via x-api-key header)
# MCP_API_KEY=your-secret-key
```

---

## Connecting to Claude Desktop

Edit your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add the `universal-dev-mcp` entry under `mcpServers`:

```json
{
  "mcpServers": {
    "universal-dev-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/universal-dev-mcp/dist/server.js"],
      "env": {
        "PROJECT_ROOT": "/absolute/path/to/your/project",
        "ALLOWED_PORTS": "5173,3000,8080",
        "ALLOWED_COMMANDS": "npm test,npm run lint,npm run build,npx tsc --noEmit"
      }
    }
  }
}
```

> [!NOTE]
> Always use absolute paths for both `universal-dev-mcp/dist/server.js` and `PROJECT_ROOT`. Restart Claude Desktop after saving changes.

---

## Connecting to Cursor, Windsurf & Zed

### Cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "universal-dev-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/universal-dev-mcp/dist/server.js"],
      "env": {
        "PROJECT_ROOT": "/absolute/path/to/your/project",
        "ALLOWED_PORTS": "5173,3000,8080",
        "ALLOWED_COMMANDS": "npm test,npm run lint,npm run build,npx tsc --noEmit"
      }
    }
  }
}
```

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "universal-dev-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/universal-dev-mcp/dist/server.js"],
      "env": {
        "PROJECT_ROOT": "/absolute/path/to/your/project",
        "ALLOWED_PORTS": "5173,3000,8080",
        "ALLOWED_COMMANDS": "npm test,npm run lint,npm run build,npx tsc --noEmit"
      }
    }
  }
}
```

### Zed

Edit `settings.json`:
- **macOS**: `~/Library/Application Support/Zed/settings.json`
- **Linux**: `~/.config/zed/settings.json`

```json
{
  "experimental": {
    "model_context_protocol": {
      "servers": [
        {
          "id": "universal-dev-mcp",
          "command": "node",
          "args": ["/absolute/path/to/universal-dev-mcp/dist/server.js"],
          "env": {
            "PROJECT_ROOT": "/absolute/path/to/your/project",
            "ALLOWED_PORTS": "5173,3000,8080",
            "ALLOWED_COMMANDS": "npm test,npm run lint,npm run build,npx tsc --noEmit"
          }
        }
      ]
    }
  }
}
```

---

## Switching projects

Instead of manually editing config files every time you switch repositories, use the built-in `mcp-switch` CLI or the Web UI Dashboard.

### Setup `projects.json`

Register your projects in `projects.json` located in the root of `universal-dev-mcp`:

```json
{
  "projects": [
    {
      "name": "my-react-app",
      "root": "/home/yourname/projects/my-react-app",
      "allowed_ports": "3000,5173",
      "allowed_commands": "npm run build,npm test,npm run dev"
    },
    {
      "name": "my-backend-api",
      "root": "/home/yourname/projects/my-backend-api",
      "allowed_ports": "8080",
      "allowed_commands": "npm run build,npm test"
    }
  ]
}
```

### CLI Commands

```bash
# Interactive menu — pick a project from a numbered list
npx mcp-switch

# Switch directly by name across all installed editors
npx mcp-switch use my-react-app

# Switch for a specific editor only (claude, cursor, windsurf, or zed)
npx mcp-switch use my-react-app --editor cursor

# Show the currently active project
npx mcp-switch current

# List all projects (active project marked with *)
npx mcp-switch list

# Add a new project interactively
npx mcp-switch add
```

After switching via CLI, restart your editor for the new `PROJECT_ROOT` to take effect.

### Switching via Web UI Dashboard

When running `npm run start:http`, navigate to the **Project Hub** tab at `http://localhost:3333/`. Click **"Switch Context"** on any project card to dynamically switch the active server context in real time without restarting.

### Confirming active project inside your AI tool

Ask your AI assistant:

> "Which project is active?"

The assistant calls `get_active_project` and reports the project name, root path, git branch, file count, and last commit hash.

---

## Connecting to Gemini / ChatGPT (HTTP mode)

Start the HTTP server and Web UI:

```bash
npm run start:http
```

The server listens on `http://localhost:3333`.

### HTTP Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Web UI Dashboard (or server overview JSON if UI not built) |
| `GET` | `/health` | Health check endpoint returning `{ status: "ok", uptime }` |
| `GET` | `/api/info` | Server status, active project root, allowed ports/commands, tool count |
| `GET` | `/tools` | List all 17 registered MCP tools with JSON input schemas |
| `POST` | `/call` | Execute any tool by name with arguments: `{"name": "...", "arguments": {...}}` |
| `GET` | `/openai/tools` | Tool declarations formatted for OpenAI / Gemini function calling |
| `POST` | `/openai/call` | Execute OpenAI-formatted `tool_calls` array |
| `GET` | `/sse` | Server-Sent Events stream for real-time tool telemetry & project switch events |
| `POST` | `/sse/broadcast` | Broadcast custom payload to connected SSE clients |
| `GET` | `/api/projects` | List configured projects, active project status, and folder validation |
| `POST` | `/api/projects/switch` | Switch active project root dynamically |
| `POST` | `/api/projects/add` | Add a new project to `projects.json` |
| `GET` | `/api/activity` | Retrieve recent tool execution telemetry events |
| `POST` | `/api/activity/clear` | Clear the in-memory activity log buffer |
| `GET` | `/api/backups` | List all timestamped `.bak` files with sizes and modification times |
| `GET` | `/api/backups/diff` | Get content comparison between a backup snapshot and the current file |
| `POST` | `/api/backups/restore` | Restore a file to a backup snapshot |
| `GET` | `/api/ports/scan` | Parallel port scanner detecting running dev servers and latency |
| `GET` | `/api/config/editors` | Generate editor configuration snippets for Claude, Cursor, Windsurf, and Zed |

### Calling a tool directly with cURL

```bash
curl -X POST http://localhost:3333/call \
  -H "Content-Type: application/json" \
  -d '{"name": "get_git_status", "arguments": {}}'
```

### Gemini Integration Example (TypeScript)

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
  let result = await chat.sendMessage("Check git status and active project.");

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

## UI Screenshots

### Home

<img width="2823" height="1542" alt="home" src="https://github.com/user-attachments/assets/1f972566-a4b3-48d5-80bf-b6ad2b047eb4" />

### Project

<img width="2811" height="1544" alt="project" src="https://github.com/user-attachments/assets/f919d1f9-9694-4a0d-9bb4-ed4793fdaca1" />

### Dev WorkBench

<img width="2813" height="1556" alt="dev_workbench" src="https://github.com/user-attachments/assets/6bb6ab24-9f9c-4efb-947f-859f0e04711a" />

### Add a Project

<img width="2819" height="1557" alt="add_project" src="https://github.com/user-attachments/assets/055c6abc-9768-42ff-b194-721ec1a03449" />


---

## Security & guardrails

Every tool call executed via stdio or HTTP is strictly bounded by layered security checks:

- **Port Allowlist**: Outbound requests via `check_port`, `view_page`, and `get_api_response` are restricted to ports defined in `ALLOWED_PORTS`.
- **Command Allowlist**: Execution via `run_command` requires exact prefix matching against `ALLOWED_COMMANDS`. Shell metacharacters (`;`, `&&`, `||`, `|`, `` ` ``, `$()`, `>`, `<`) are rejected to prevent command chaining and injection.
- **Write Boundary Scope**: `edit_file`, `patch_file`, `delete_file`, and `move_file` can only touch paths within `ALLOWED_WRITE_DIRS` (defaulting to `PROJECT_ROOT`).
- **Path Traversal Protection**: All relative paths are resolved to absolute canonical paths and validated to prevent directory traversal (`../`).
- **API Key Guard**: Set `MCP_API_KEY` to require an `x-api-key` header on all HTTP and SSE endpoints.

---

## Automated backups & rollback

Whenever `edit_file`, `patch_file`, `delete_file`, or `move_file` modifies or removes a file, an automated timestamped backup is captured in `.mcp-backups/` before disk operations occur.

### Rolling back changes

You can restore a backup in four convenient ways:

1. **Via AI Prompt**:
   Ask Claude or Cursor:
   > "Restore src/App.tsx to its latest backup."
   *(The AI executes the `restore_backup` tool)*

2. **Via Web UI Dashboard**:
   Open **`http://localhost:3333/`** → **Backup Center**. Inspect the visual side-by-side diff against the current working copy and click **"Restore Version"**.

3. **Via REST API**:
   ```bash
   curl -X POST http://localhost:3333/api/backups/restore \
     -H "Content-Type: application/json" \
     -d '{"filepath": "src/App.tsx"}'
   ```

4. **Via Terminal**:
   ```bash
   cp .mcp-backups/src__App.tsx.2026-11-09T15-00-00-000Z.bak src/App.tsx
   ```

*Backups older than 7 days are automatically pruned, keeping at most 10 revisions per file.*

---

## Testing

universal-dev-mcp includes an automated test suite powered by [Vitest](https://vitest.dev/), validating security guardrails, shell injection prevention, backup creation, and tool execution:

```bash
npm test
```

---

## npm scripts

| Command | Description |
|---|---|
| `npm run build` | Compile both the server (TypeScript) and Web UI (Vite) into `dist/` and `dist/public/` |
| `npm run build:server` | Compile TypeScript server code into `dist/` |
| `npm run build:ui` | Compile Vite React frontend into `dist/public/` |
| `npm test` | Run the automated Vitest test suite |
| `npm run start` | Start stdio MCP server (for Claude Desktop, Cursor, Windsurf, Zed) |
| `npm run start:http` | Start HTTP + SSE server & serve Web UI Dashboard at `http://localhost:3333` |
| `npm run dev` | Start stdio server with `ts-node` (development without pre-compiling) |
| `npm run dev:http` | Start HTTP server with `ts-node` (development without pre-compiling) |
| `npm run dev:ui` | Start Vite dev server with Hot Module Replacement on port `5174` |

---

## Example prompts

Once connected to your AI assistant:

```
Which project is currently active?
```
```
Show git status and summarize the last 5 commits.
```
```
Show the git diff for src/components/Navbar.tsx.
```
```
Scan local dev ports to see which dev servers are running.
```
```
Check if my Vite dev server is responding on port 5173.
```
```
Fetch the homepage from localhost:5173 and describe the UI layout.
```
```
Search for all occurrences of 'useActivityStream' across the project.
```
```
Run npm test and summarize any failures.
```
```
Fix the TypeScript error in src/utils/backup.ts on line 42.
```
```
Restore src/components/Navbar.tsx to its latest backup snapshot.
```

---

## License

MIT License — Copyright (c) 2026 RAJAN JAISWAL

See [LICENSE](./LICENSE) for full details.
