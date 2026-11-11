import React, { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Radio,
  Check,
  Copy,
  Cpu,
  Globe,
  FileCode2,
  Wrench,
  Layers,
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
    <div className="space-y-16 pb-12 w-full max-w-6xl mx-auto">
      {/* 1. Clean, Spacious Hero Section */}
      <div className="text-center space-y-6 pt-4 px-4">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight">
          Bridge AI coding tools{" "}
          <br className="hidden sm:inline" />
          directly to{" "}
          <span className="text-accent-lime inline-block font-black drop-shadow-[0_0_30px_rgba(194,239,78,0.35)]">
            localhost
          </span>
        </h1>

        <p className="text-base sm:text-lg text-on-dark-muted max-w-2xl mx-auto font-normal leading-relaxed">
          Connect Claude Desktop, Cursor, Windsurf, and Zed to local dev servers, code files,
          git branches, and APIs — with automatic rollback safety before every change.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate("projects")}
            className="btn-cap bg-white hover:bg-slate-100 text-ink-deep font-bold px-7 py-3 rounded-md text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center space-x-2"
          >
            <Cpu className="w-4 h-4 text-ink-deep" />
            <span>CONNECT AI EDITORS</span>
          </button>

          <button
            onClick={() => onNavigate("workbench")}
            className="btn-cap bg-surface-night hover:bg-surface-card text-white font-bold px-7 py-3 rounded-md text-sm border border-hairline-violet hover:border-accent-lime transition-all shadow-md flex items-center space-x-2"
          >
            <Wrench className="w-4 h-4 text-accent-lime" />
            <span>OPEN DEV WORKBENCH</span>
          </button>
        </div>
      </div>

      {/* 2. Focused Hero Visual: Mascot & 2 Sleek Inspection Cards */}
      <div className="relative w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Preview Card: Rollback Safety */}
          <div className="lg:col-span-4 bg-surface-night/95 border border-hairline-violet rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-hairline-violet">
              <div className="flex items-center space-x-2">
                <FileCode2 className="w-4 h-4 text-accent-lime" />
                <span className="font-bold text-white text-xs">Safe File Modification</span>
              </div>
              <span className="text-accent-lime text-[10px] font-mono bg-accent-lime/10 px-2 py-0.5 rounded font-bold">
                AUTO-BACKUP
              </span>
            </div>

            <div className="bg-ink-deep rounded-lg p-3 font-mono text-[11px] text-on-dark-light space-y-1">
              <div className="text-on-dark-faint text-[10px]">Editing src/components/Navbar.tsx:</div>
              <div className="text-accent-pink">- const isConnected = false;</div>
              <div className="text-accent-lime">+ const isConnected = true;</div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-on-dark-muted">
              <span>Saved restore snapshot:</span>
              <code className="text-accent-pink text-[10px]">Navbar.bak</code>
            </div>
          </div>

          {/* Center Column: Clean Mascot Illustration */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden flex items-center justify-center group">
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
            <div className="text-xs font-mono text-on-dark-muted mt-2 text-center">
              Active on <span className="text-white font-bold">localhost:3333</span> • {toolsCount} MCP Tools
            </div>
          </div>

          {/* Right Preview Card: Dev Radar Telemetry */}
          <div className="lg:col-span-4 bg-surface-night/95 border border-hairline-violet rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-hairline-violet">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-accent-lime" />
                <span className="font-bold text-white text-xs">Dev Server Radar</span>
              </div>
              <span className="text-accent-lime text-[10px] font-mono bg-accent-lime/10 px-2 py-0.5 rounded font-bold">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between bg-ink-deep p-2.5 rounded border border-hairline-violet/60">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-accent-lime" />
                  <span className="text-white font-bold">localhost:3000</span>
                </div>
                <span className="text-accent-lime text-[11px]">12ms</span>
              </div>

              <div className="flex items-center justify-between bg-ink-deep p-2.5 rounded border border-hairline-violet/60">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-accent-lime" />
                  <span className="text-white font-bold">localhost:5173</span>
                </div>
                <span className="text-accent-lime text-[11px]">6ms</span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-on-dark-muted">
              <span>Inspected via tool:</span>
              <code className="text-accent-lime text-[10px]">scan_dev_servers</code>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Three Core Pillars (Clean, airy, no clutter) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Pillar 1 */}
        <div className="bg-surface-night border border-hairline-violet hover:border-accent-lime/50 rounded-xl p-6 transition-colors space-y-3">
          <div className="w-9 h-9 rounded-lg bg-ink-deep border border-hairline-violet flex items-center justify-center text-accent-lime">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">1-Click AI Editor Sync</h3>
          <p className="text-xs text-on-dark-muted leading-relaxed">
            Configure Claude Desktop, Cursor, Windsurf, or Zed directly in the GUI. Automatically updates settings files without typing commands.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="bg-surface-night border border-hairline-violet hover:border-accent-pink/50 rounded-xl p-6 transition-colors space-y-3">
          <div className="w-9 h-9 rounded-lg bg-ink-deep border border-hairline-violet flex items-center justify-center text-accent-pink">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">Automatic Rollback Safety</h3>
          <p className="text-xs text-on-dark-muted leading-relaxed">
            Every destructive write or edit creates a timestamped snapshot in <code className="text-accent-pink">.universal-dev-mcp/backups/</code> with 1-click restore.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="bg-surface-night border border-hairline-violet hover:border-purple-400/50 rounded-xl p-6 transition-colors space-y-3">
          <div className="w-9 h-9 rounded-lg bg-ink-deep border border-hairline-violet flex items-center justify-center text-purple-400">
            <Globe className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">Dev Radar & DOM Inspector</h3>
          <p className="text-xs text-on-dark-muted leading-relaxed">
            Scan localhost ports in parallel, probe HTTP response headers, and extract visible page content for LLM verification.
          </p>
        </div>
      </div>

      {/* 4. Progressive Exploration Banner */}
      <div className="bg-surface-night border border-hairline-violet rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-accent-lime" />
            <span>Complete 17-Tool MCP Catalog</span>
          </h3>
          <p className="text-xs text-on-dark-muted mt-1">
            Explore filesystem tools, git operations, terminal command runners, and local API clients.
          </p>
        </div>

        <button
          onClick={() => onNavigate("workbench")}
          className="btn-cap bg-white text-ink-deep hover:bg-slate-100 font-bold px-4 py-2 rounded-md text-xs transition flex items-center space-x-1.5 shadow shrink-0"
        >
          <span>Explore All 17 Tools</span>
          <ArrowRight className="w-3.5 h-3.5 text-ink-deep" />
        </button>
      </div>

      {/* 5. Minimal Editor Configuration Helper */}
      <div className="bg-surface-night border border-hairline-violet rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline-violet pb-3">
          <div>
            <h4 className="text-sm font-bold text-white">Editor Configuration Snippet</h4>
            <p className="text-xs text-on-dark-muted">
              Active project: <span className="text-white font-bold">{activeProjectName}</span>
            </p>
          </div>

          <div className="flex space-x-1 bg-ink-deep p-1 rounded-md border border-hairline-violet">
            {(["claude", "cursor", "windsurf", "zed"] as const).map((ed) => (
              <button
                key={ed}
                onClick={() => setSelectedEditor(ed)}
                className={`btn-cap px-3 py-1 rounded text-xs capitalize transition ${
                  selectedEditor === ed
                    ? "bg-white text-ink-deep font-bold"
                    : "text-on-dark-muted hover:text-white"
                }`}
              >
                {ed}
              </button>
            ))}
          </div>
        </div>

        <div className="relative bg-ink-deep rounded-lg p-3 font-mono text-xs">
          <pre className="text-white overflow-x-auto max-h-48 text-[11px] leading-relaxed">
            {currentConfigJson}
          </pre>
          <button
            onClick={() => handleCopy(currentConfigJson)}
            className="btn-cap absolute top-3 right-3 bg-surface-night hover:bg-white hover:text-ink-deep border border-hairline-violet text-white px-2.5 py-1 rounded text-[11px] flex items-center space-x-1"
          >
            {copied ? <Check className="w-3 h-3 text-accent-lime" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
