import React, { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Terminal,
  Radio,
  FolderGit2,
  Check,
  Copy,
  Activity,
  ChevronRight,
  Cpu,
  Globe,
  FileCode2,
} from "lucide-react";

interface HomeProps {
  onNavigate: (tab: string) => void;
  editorConfigs?: Record<string, unknown>;
  activeProjectName?: string;
  activeProjectRoot?: string;
  toolsCount?: number;
}

export const Home: React.FC<HomeProps> = ({
  onNavigate,
  editorConfigs = {},
  activeProjectName = "universal-dev-mcp",
  activeProjectRoot = "/home/rajan/Projects/universal-dev-mcp",
  toolsCount = 17,
}) => {
  const [selectedEditor, setSelectedEditor] = useState<string>("claude");
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentConfigJson = JSON.stringify(
    editorConfigs[selectedEditor] || {
      mcpServers: {
        "universal-dev-mcp": {
          command: "node",
          args: [`${activeProjectRoot}/dist/server.js`],
          env: {
            PROJECT_ROOT: activeProjectRoot,
            ALLOWED_PORTS: "3000,5173,8080,3333",
            ALLOWED_COMMANDS: "npm run build,npx tsc --noEmit,npm test",
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div className="space-y-20 pb-16 w-full">
      {/* 1. Announcement Banner */}
      <div className="flex justify-center pt-2 px-4">
        <button
          onClick={() => onNavigate("projects")}
          className="group inline-flex items-center space-x-2 bg-surface-night/90 hover:bg-surface-night border border-hairline-violet hover:border-accent-lime/40 px-4 sm:px-5 py-2 rounded-full text-xs font-mono text-on-dark-muted hover:text-white transition-all duration-200 shadow-lg hover:shadow-accent-lime/10 max-w-full"
        >
          <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse shrink-0" />
          <span className="truncate max-w-[70vw] sm:max-w-none">
            Model Context Protocol (MCP) Server for Claude Desktop, Cursor, Windsurf & Zed
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-accent-lime group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      </div>

      {/* 2. Hero Headline & Real Mission */}
      <div className="text-center max-w-5xl mx-auto space-y-6 px-4">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight py-1">
          Bridge your{" "}
          <span className="text-accent-lime inline-block font-black drop-shadow-[0_0_30px_rgba(194,239,78,0.35)]">
            AI coding tools
          </span>{" "}
          directly to localhost
        </h1>

        <p className="text-base sm:text-xl text-on-dark-muted max-w-3xl mx-auto font-normal leading-relaxed">
          Universal Dev MCP connects Claude Desktop, Cursor, Windsurf, and Zed to your running dev servers,
          local code files, git branches, and APIs — with automatic safety backups before every edit.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate("projects")}
            className="btn-cap bg-white hover:bg-slate-100 text-ink-deep font-bold px-7 py-3 rounded-md text-sm transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center space-x-2"
          >
            <Cpu className="w-4 h-4 text-ink-deep" />
            <span>CONNECT YOUR EDITORS</span>
          </button>

          <button
            onClick={() => onNavigate("activity")}
            className="btn-cap bg-surface-card/80 hover:bg-surface-card text-white font-bold px-7 py-3 rounded-md text-sm border border-hairline-violet hover:border-accent-lime transition-all transform hover:scale-[1.02] shadow-md flex items-center space-x-2"
          >
            <Activity className="w-4 h-4 text-accent-lime" />
            <span>VIEW LIVE TOOL STREAM</span>
          </button>
        </div>
      </div>

      {/* 3. Hero Visual Showcase (Real Tool Telemetry & Dev Runtime) */}
      <div className="relative max-w-7xl mx-auto w-full">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-accent-lime/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-accent-pink/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10 w-full">
          {/* Left Cards: Real Tool Executions */}
          <div className="lg:col-span-4 space-y-4">
            {/* Card 1: Safe File Edit & Snapshot */}
            <div className="bg-[#19112a]/95 border border-[#312351] rounded-xl p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-2.5 border-b border-hairline-violet text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <FileCode2 className="w-3.5 h-3.5 text-accent-lime" />
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">Tool: edit_file</span>
                </div>
                <span className="text-accent-lime text-[10px] font-mono bg-accent-lime/10 px-2 py-0.5 rounded">
                  EXECUTED (14ms)
                </span>
              </div>

              <div className="mt-3 bg-surface-night rounded-md p-3 font-mono text-[11px] leading-relaxed border border-hairline-violet/60">
                <div className="text-on-dark-faint text-[10px] pb-1.5 border-b border-hairline-violet/40">
                  Cursor invoked file modification:
                </div>
                <div className="mt-2 text-on-dark-muted space-y-1">
                  <div><span className="text-on-dark-faint">path:</span> <span className="text-white">"src/components/Navbar.tsx"</span></div>
                  <div><span className="text-accent-pink">- target:</span> <span className="text-accent-pink">"const isConnected = false;"</span></div>
                  <div><span className="text-accent-lime">+ replacement:</span> <span className="text-accent-lime">"const isConnected = true;"</span></div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-on-dark-muted">
                <span className="text-on-dark-faint text-[10px]">Auto-snapshot saved:</span>
                <span className="text-accent-pink text-[10px] font-bold">.mcp-backups/Navbar.bak</span>
              </div>
            </div>

            {/* Card 2: Page Inspector view_page */}
            <div className="bg-[#19112a]/95 border border-[#312351] rounded-xl p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-2.5 border-b border-hairline-violet text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <Globe className="w-3.5 h-3.5 text-accent-lime" />
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">Tool: view_page</span>
                </div>
                <span className="text-white text-[10px] font-mono bg-surface-night px-2 py-0.5 rounded border border-hairline-violet">
                  HTTP 200 OK
                </span>
              </div>

              <div className="mt-3 bg-surface-night rounded-lg border border-hairline-violet p-3 font-mono text-[11px] text-on-dark-muted space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white">http://localhost:3000/</span>
                  <span className="text-accent-lime font-bold">11ms latency</span>
                </div>
                <p className="text-on-dark-faint text-[10px] pt-1">
                  Scraped DOM Title: <span className="text-white">"Local React App"</span>
                </p>
                <p className="text-[10px] text-on-dark-muted">
                  Extracted metadata, visible headings & interactive links for LLM reasoning.
                </p>
              </div>
            </div>
          </div>

          {/* Center Column: Mascot Hero Illustration */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-48 h-32 bg-gradient-to-l from-accent-pink/30 to-transparent blur-xl pointer-events-none transform -rotate-12"
              style={{ zIndex: 1 }}
            />
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-32 bg-gradient-to-r from-accent-lime/30 to-transparent blur-xl pointer-events-none transform rotate-12"
              style={{ zIndex: 1 }}
            />

            <div className="relative w-72 sm:w-80 h-72 sm:h-80 rounded-2xl overflow-hidden flex items-center justify-center p-2 group">
              <img
                src="/mascot.jpg"
                alt="Universal Dev MCP Server"
                className="w-full h-full object-cover rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-105"
                style={{
                  maskImage: "radial-gradient(circle at 50% 50%, black 72%, transparent 98%)",
                  WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 72%, transparent 98%)",
                }}
              />
            </div>

            {/* Clear, Accurate Caption */}
            <div className="mt-3 inline-flex items-center space-x-2 bg-surface-night/95 border border-hairline-violet px-3.5 py-1.5 rounded-full text-xs font-mono text-on-dark-muted shadow-lg">
              <span className="text-accent-lime font-bold">⚡ Universal Dev MCP Server</span>
              <span>•</span>
              <span className="text-white">Stdio & HTTP on Port 3333</span>
            </div>
          </div>

          {/* Right Cards: Dev Server Radar & Security Guardrails */}
          <div className="lg:col-span-4 space-y-4">
            {/* Card 3: Real Localhost Port Scan */}
            <div className="bg-[#19112a]/95 border border-[#312351] rounded-xl p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-2.5 border-b border-hairline-violet text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <Radio className="w-3.5 h-3.5 text-accent-lime animate-pulse" />
                  <span className="font-bold text-accent-lime uppercase tracking-wider text-[11px]">Tool: scan_dev_servers</span>
                </div>
                <span className="text-accent-lime text-[10px] font-bold bg-accent-lime/10 px-2 py-0.5 rounded">
                  3 ACTIVE PORTS
                </span>
              </div>

              <div className="mt-3 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between bg-surface-night p-2 rounded border border-hairline-violet/60 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-accent-lime" />
                    <span className="text-white font-bold">Port 3000</span>
                    <span className="text-on-dark-faint text-[10px]">Next.js</span>
                  </div>
                  <span className="text-accent-lime font-bold">12ms</span>
                </div>

                <div className="flex items-center justify-between bg-surface-night p-2 rounded border border-hairline-violet/60 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-accent-lime" />
                    <span className="text-white font-bold">Port 5173</span>
                    <span className="text-on-dark-faint text-[10px]">Vite App</span>
                  </div>
                  <span className="text-accent-lime font-bold">6ms</span>
                </div>

                <div className="flex items-center justify-between bg-surface-night p-2 rounded border border-hairline-violet/60 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-accent-lime" />
                    <span className="text-white font-bold">Port 3333</span>
                    <span className="text-on-dark-faint text-[10px]">Universal MCP</span>
                  </div>
                  <span className="text-accent-lime font-bold">1ms</span>
                </div>
              </div>
            </div>

            {/* Card 4: Security & Rollback Safeguards */}
            <div className="bg-[#19112a]/95 border border-[#312351] rounded-xl p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 border-b border-hairline-violet text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent-lime" />
                  <span className="font-bold text-white text-[11px] uppercase tracking-wider">Security & Guardrails</span>
                </div>
                <span className="text-[10px] text-accent-lime font-bold bg-accent-lime/10 px-2 py-0.5 rounded">
                  ENFORCED
                </span>
              </div>

              <div className="mt-2.5 space-y-2 font-mono text-[11px]">
                <div className="flex items-start space-x-2 text-on-dark-muted">
                  <Check className="w-3.5 h-3.5 text-accent-lime mt-0.5 flex-shrink-0" />
                  <span>Directory traversal confinement to project root</span>
                </div>
                <div className="flex items-start space-x-2 text-on-dark-muted">
                  <Check className="w-3.5 h-3.5 text-accent-lime mt-0.5 flex-shrink-0" />
                  <span>Strict command allowlist (npm, git, npx)</span>
                </div>
                <div className="flex items-start space-x-2 text-on-dark-muted">
                  <Check className="w-3.5 h-3.5 text-accent-lime mt-0.5 flex-shrink-0" />
                  <span>Automatic backup snapshot before every file write</span>
                </div>
                <div className="flex items-start space-x-2 text-on-dark-muted">
                  <Check className="w-3.5 h-3.5 text-accent-lime mt-0.5 flex-shrink-0" />
                  <span>Real-time SSE telemetry event bus on /sse</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Real Platform Metrics Bar */}
      <div className="max-w-7xl mx-auto bg-surface-card border border-hairline-violet rounded-xl p-6 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center w-full">
        <div className="space-y-1">
          <div className="text-3xl font-black text-white">{toolsCount}</div>
          <div className="text-xs font-mono text-accent-lime font-bold uppercase tracking-wider">MCP Tools Active</div>
          <div className="text-[11px] text-on-dark-muted">File I/O, Git, Web, CLI & Radar</div>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-black text-white">4</div>
          <div className="text-xs font-mono text-white font-bold uppercase tracking-wider">Supported Editors</div>
          <div className="text-[11px] text-on-dark-muted">Claude Desktop, Cursor, Windsurf, Zed</div>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-black text-white">100%</div>
          <div className="text-xs font-mono text-accent-lime font-bold uppercase tracking-wider">Rollback Safety</div>
          <div className="text-[11px] text-on-dark-muted">Auto-snapshots in .mcp-backups/</div>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-black text-white">:3333</div>
          <div className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">Single Port Process</div>
          <div className="text-[11px] text-on-dark-muted">MCP, SSE stream, and Web UI unified</div>
        </div>
      </div>

      {/* 5. Real Feature Modules */}
      <div className="max-w-7xl mx-auto space-y-8 w-full">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Built for AI-assisted local development
          </h2>
          <p className="text-on-dark-muted font-normal max-w-2xl mx-auto text-sm">
            Everything your AI coding assistant needs to inspect your localhost, verify its own work, and operate safely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Feature 1: Dev Radar */}
          <div className="bg-surface-card border border-hairline-violet rounded-xl overflow-hidden hover:border-accent-lime/40 transition-colors flex flex-col justify-between group">
            <div className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-night border border-hairline-violet flex items-center justify-center text-accent-lime">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-accent-lime transition-colors">
                Dev Server Radar & DOM Page Inspector
              </h3>
              <p className="text-sm text-on-dark-muted leading-relaxed">
                Scan localhost ports (3000, 5173, 8080) in parallel to detect running dev servers (Vite, Next.js, Express).
                The <code className="text-white">view_page</code> tool extracts page titles, meta tags, and visible DOM content so AI can verify its own UI changes.
              </p>
            </div>

            <div className="px-6 pb-6 pt-2">
              <div className="relative rounded-lg overflow-hidden border border-hairline-violet/70 bg-surface-night h-48 flex items-center justify-center">
                <img
                  src="/radar-art.jpg"
                  alt="Dev Server Radar Illustration"
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={() => onNavigate("radar")}
                  className="absolute bottom-3 right-3 btn-cap bg-surface-night/90 hover:bg-surface-night text-white text-xs font-mono px-3.5 py-1.5 rounded border border-hairline-violet flex items-center space-x-1.5 backdrop-blur-md"
                >
                  <span>Launch Dev Radar</span>
                  <ChevronRight className="w-3.5 h-3.5 text-accent-lime" />
                </button>
              </div>
            </div>
          </div>

          {/* Feature 2: Safe Backups */}
          <div className="bg-surface-card border border-hairline-violet rounded-xl p-6 hover:border-accent-pink/40 transition-colors flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-night border border-hairline-violet flex items-center justify-center text-accent-pink">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-accent-pink transition-colors">
                Automatic Safety Backups & Visual Diff
              </h3>
              <p className="text-sm text-on-dark-muted leading-relaxed">
                Never worry about an AI assistant corrupting or deleting your code. Every destructive write or edit creates
                an automatic timestamped snapshot in <code className="text-accent-pink">.mcp-backups/</code> with side-by-side visual diff comparison
                and 1-click instant rollback.
              </p>
            </div>

            <div className="mt-6 bg-surface-night rounded-lg border border-hairline-violet p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-on-dark-faint text-[10px]">
                <span>AUTOMATIC SNAPSHOTS</span>
                <span className="text-accent-lime">1-CLICK RESTORE</span>
              </div>
              <div className="p-3 rounded bg-ink-deep border border-hairline-violet/50 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold">src/components/Navbar.tsx</div>
                  <div className="text-[10px] text-on-dark-faint">Saved before Claude edit • 4,120 bytes</div>
                </div>
                <button
                  onClick={() => onNavigate("backups")}
                  className="btn-cap bg-accent-lime text-ink-deep font-bold px-3 py-1 rounded text-xs hover:bg-white"
                >
                  Inspect Diff
                </button>
              </div>
            </div>
          </div>

          {/* Feature 3: Live Telemetry Activity Stream */}
          <div className="bg-surface-card border border-hairline-violet rounded-xl p-6 hover:border-purple-400/40 transition-colors flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-night border border-hairline-violet flex items-center justify-center text-purple-400">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                Real-Time SSE Activity Stream
              </h3>
              <p className="text-sm text-on-dark-muted leading-relaxed">
                Watch every single tool execution, incoming arguments, execution duration, and output live as Claude or Cursor
                interacts with your project. Built on high-performance Server-Sent Events.
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={() => onNavigate("activity")}
                className="w-full btn-cap bg-surface-night hover:bg-ink-deep border border-hairline-violet text-white text-xs font-mono py-2.5 rounded flex items-center justify-center space-x-2"
              >
                <span>Open Live Stream Feed</span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
              </button>
            </div>
          </div>

          {/* Feature 4: Local API & Command Playground */}
          <div className="bg-surface-card border border-hairline-violet rounded-xl p-6 hover:border-accent-lime/40 transition-colors flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-night border border-hairline-violet flex items-center justify-center text-accent-lime">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-accent-lime transition-colors">
                Local API & CLI Command Workbench
              </h3>
              <p className="text-sm text-on-dark-muted leading-relaxed">
                Test your localhost REST endpoints (GET, POST, PUT, DELETE) with custom headers and payloads directly.
                Execute allowlisted git commands, run tests, and inspect outputs without switching windows.
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={() => onNavigate("playground")}
                className="w-full btn-cap bg-surface-night hover:bg-ink-deep border border-hairline-violet text-white text-xs font-mono py-2.5 rounded flex items-center justify-center space-x-2"
              >
                <span>Open API Playground</span>
                <ArrowRight className="w-3.5 h-3.5 text-accent-lime" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. One-Click Editor Setup Section */}
      <div className="max-w-5xl mx-auto bg-surface-card border border-hairline-violet rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white">Connect Your Favorite AI Editor</h3>
            <p className="text-xs font-mono text-on-dark-muted mt-1">
              Active Project: <span className="text-accent-lime font-bold">{activeProjectName}</span> ({activeProjectRoot})
            </p>
          </div>

          {/* Editor Switcher Tabs */}
          <div className="flex space-x-1 bg-surface-night p-1 rounded-lg border border-hairline-violet">
            {(["claude", "cursor", "windsurf", "zed"] as const).map((ed) => (
              <button
                key={ed}
                onClick={() => setSelectedEditor(ed)}
                className={`btn-cap px-3.5 py-1.5 rounded text-xs capitalize font-mono transition-colors ${
                  selectedEditor === ed
                    ? "bg-accent-lime text-ink-deep font-bold"
                    : "text-on-dark-muted hover:text-white"
                }`}
              >
                {ed}
              </button>
            ))}
          </div>
        </div>

        {/* JSON Code Snippet */}
        <div className="relative">
          <div className="flex items-center justify-between bg-ink-deep px-4 py-2.5 rounded-t-lg border-t border-x border-hairline-violet text-xs font-mono text-on-dark-muted">
            <span>
              {selectedEditor === "claude" && "claude_desktop_config.json"}
              {selectedEditor === "cursor" && "~/.cursor/mcp.json"}
              {selectedEditor === "windsurf" && "~/.codeium/windsurf/mcp_config.json"}
              {selectedEditor === "zed" && "settings.json"}
            </span>
            <button
              onClick={() => handleCopy(currentConfigJson)}
              className="flex items-center space-x-1.5 text-xs text-white hover:text-accent-lime transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-accent-lime" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Configuration"}</span>
            </button>
          </div>
          <pre className="bg-[#120c1d] p-4 rounded-b-lg border-b border-x border-hairline-violet font-mono text-xs text-on-dark-light overflow-x-auto">
            {currentConfigJson}
          </pre>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-on-dark-muted pt-2 border-t border-hairline-violet">
          <span>Or switch projects anytime from terminal:</span>
          <code className="text-accent-lime bg-surface-night px-2.5 py-1 rounded border border-hairline-violet">
            npx mcp-switch use {activeProjectName}
          </code>
        </div>
      </div>

      {/* 7. Quick Navigation Cards */}
      <div className="max-w-7xl mx-auto w-full">
        <h4 className="text-xs font-mono text-on-dark-faint uppercase tracking-wider mb-4">
          Explore Developer Modules
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
          {[
            { id: "projects", label: "Project Hub", desc: "Manage projects", icon: FolderGit2 },
            { id: "activity", label: "Live Activity", desc: "Watch tool calls", icon: Activity },
            { id: "radar", label: "Dev Radar", desc: "Scan localhost ports", icon: Radio },
            { id: "backups", label: "Backups", desc: "Diff & safe rollback", icon: ShieldCheck },
            { id: "playground", label: "API & CLI", desc: "Test REST & commands", icon: Terminal },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="btn-cap bg-surface-card hover:bg-surface-night border border-hairline-violet hover:border-accent-lime/50 p-4 rounded-lg text-left transition-all group"
              >
                <Icon className="w-5 h-5 text-accent-lime mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-white text-xs">{item.label}</div>
                <div className="text-[10px] text-on-dark-muted">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
