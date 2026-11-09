import React, { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Terminal,
  Radio,
  FolderGit2,
  Check,
  Copy,
  Play,
  Activity,
  ChevronRight,
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
  const [demoScrub, setDemoScrub] = useState<number>(42);

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
    <div className="space-y-20 pb-16">
      {/* 1. Hero Announcement Banner */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => onNavigate("radar")}
          className="group inline-flex items-center space-x-2 bg-surface-night/90 hover:bg-surface-night border border-hairline-violet hover:border-accent-pink/40 px-4 py-1.5 rounded-full text-xs font-mono text-on-dark-muted hover:text-white transition-all duration-200 shadow-lg hover:shadow-accent-pink/10"
        >
          <span className="w-2 h-2 rounded-full bg-accent-pink animate-pulse" />
          <span>Universal Dev MCP v1.0.0 is live: Bridge Claude, Cursor & Windsurf to localhost</span>
          <ArrowRight className="w-3.5 h-3.5 text-accent-pink group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 2. Hero Typography & CTAs */}
      <div className="text-center max-w-4xl mx-auto space-y-6">
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-[1.06]">
          Code{" "}
          <span className="text-accent-pink inline-block transform -rotate-1 select-none font-black drop-shadow-[0_0_25px_rgba(250,127,170,0.35)]">
            breaks,
          </span>{" "}
          fix it faster
        </h1>

        <p className="text-lg sm:text-xl text-on-dark-muted max-w-2xl mx-auto font-normal leading-relaxed">
          Application bridge and local developer runtime considered{" "}
          <span className="text-white font-medium">"essential"</span> by AI-assisted engineers.
          Safe backups, git telemetry, dev server radar, and zero port sprawl.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate("projects")}
            className="btn-cap bg-white hover:bg-slate-100 text-ink-deep font-bold px-7 py-3 rounded-md text-sm transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center space-x-2"
          >
            <span>GET STARTED</span>
            <ArrowRight className="w-4 h-4 text-ink-deep" />
          </button>

          <button
            onClick={() => onNavigate("activity")}
            className="btn-cap bg-surface-card/80 hover:bg-surface-card text-white font-bold px-7 py-3 rounded-md text-sm border border-accent-pink/50 hover:border-accent-pink transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(250,127,170,0.1)] flex items-center space-x-2"
          >
            <Activity className="w-4 h-4 text-accent-pink" />
            <span>OPEN CONSOLE</span>
          </button>
        </div>
      </div>

      {/* 3. Hero Interactive Stage (Mascot & Dual-Sided Telemetry Cards) */}
      <div className="relative max-w-6xl mx-auto">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-accent-pink/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-accent-lime/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          {/* Left Cards: Errors & Interactive Replay Preview */}
          <div className="lg:col-span-4 space-y-4">
            {/* Card 1: Errors & AI Telemetry */}
            <div className="bg-[#19112a]/95 border border-[#312351] rounded-xl p-4 shadow-2xl backdrop-blur-md transform hover:-translate-y-0.5 transition-transform">
              <div className="flex items-center justify-between pb-3 border-b border-hairline-violet text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-pink animate-ping" />
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">Runtime Errors</span>
                </div>
                <span className="text-on-dark-faint text-[10px] bg-surface-night px-2 py-0.5 rounded">PID 8310</span>
              </div>

              <div className="mt-3 bg-surface-night rounded-md p-3 font-mono text-[11px] leading-relaxed border border-hairline-violet/60">
                <div className="flex items-center space-x-2 text-on-dark-faint text-[10px] pb-1.5 border-b border-hairline-violet/40">
                  <span className="text-accent-pink font-bold">src/server.ts</span>
                  <span>•</span>
                  <span>Line 6559</span>
                </div>
                <div className="mt-2 text-on-dark-muted">
                  <span className="text-on-dark-faint select-none mr-3">6559</span>
                  <span className="text-accent-pink">return new</span> Error(
                  <span className="text-accent-lime">`Connection refused on :3000`</span>);
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-on-dark-muted">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-on-dark-faint/30 text-white font-bold">Logs (12)</span>
                  <span className="px-2 py-0.5 rounded bg-on-dark-faint/20 text-on-dark-muted">Traces (3)</span>
                </div>
                <span className="text-accent-lime text-[10px] font-bold">Captured in 4ms</span>
              </div>
            </div>

            {/* Card 2: Replays & Dev Preview */}
            <div className="bg-[#19112a]/95 border border-[#312351] rounded-xl p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 text-xs font-mono">
                <span className="font-bold text-white text-[11px] uppercase tracking-wider">DOM Replay & Preview</span>
                <span className="text-[10px] text-accent-lime font-mono">LIVE 60FPS</span>
              </div>

              <div className="mt-2 bg-surface-night rounded-lg border border-hairline-violet overflow-hidden">
                <div className="bg-ink-deep px-3 py-1.5 flex items-center space-x-2 border-b border-hairline-violet text-[10px] font-mono text-on-dark-muted">
                  <span className="w-2 h-2 rounded-full bg-accent-pink/80" />
                  <span className="w-2 h-2 rounded-full bg-yellow-400/80" />
                  <span className="w-2 h-2 rounded-full bg-accent-lime/80" />
                  <span className="ml-2 text-white">http://localhost:3000</span>
                </div>

                <div className="p-3 text-[11px] font-mono text-on-dark-muted space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-on-dark-faint">Rendered via view_page</span>
                    <span className="text-accent-lime">200 OK (11ms)</span>
                  </div>
                  <div className="w-full bg-hairline-violet h-1.5 rounded-full overflow-hidden">
                    <div className="bg-accent-lime h-full rounded-full" style={{ width: `${demoScrub}%` }} />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setDemoScrub((s) => (s >= 95 ? 10 : s + 15))}
                      className="text-white hover:text-accent-lime flex items-center space-x-1 text-[10px]"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Scrub timeline</span>
                    </button>
                    <span className="text-on-dark-faint text-[10px]">00:04.12 / 00:10.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column: Mascot Hero Illustration with Beams */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
            {/* Holographic scanner cone glows */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-48 h-32 bg-gradient-to-l from-accent-pink/40 to-transparent blur-xl pointer-events-none transform -rotate-12"
              style={{ zIndex: 1 }}
            />
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-32 bg-gradient-to-r from-accent-lime/40 to-transparent blur-xl pointer-events-none transform rotate-12"
              style={{ zIndex: 1 }}
            />

            {/* Mascot Image with soft radial edge blending */}
            <div className="relative w-72 sm:w-80 h-72 sm:h-80 rounded-2xl overflow-hidden flex items-center justify-center p-2 group">
              <img
                src="/mascot.jpg"
                alt="Universal Dev MCP Mascot Inspector"
                className="w-full h-full object-cover rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-105"
                style={{
                  maskImage: "radial-gradient(circle at 50% 50%, black 72%, transparent 98%)",
                  WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 72%, transparent 98%)",
                }}
              />
            </div>

            {/* Mascot Caption Badge */}
            <div className="mt-2 inline-flex items-center space-x-2 bg-surface-night/90 border border-hairline-violet px-3 py-1 rounded-full text-[11px] font-mono text-on-dark-muted shadow-lg">
              <span className="text-accent-lime font-bold">⚡ AI Telemetry Guardian</span>
              <span>•</span>
              <span className="text-white">Active on localhost:3333</span>
            </div>
          </div>

          {/* Right Cards: Dev Radar & Root Cause Safety Checklist */}
          <div className="lg:col-span-4 space-y-4">
            {/* Card 3: Dev Radar Diagnostic */}
            <div className="bg-[#19112a]/95 border border-[#312351] rounded-xl p-4 shadow-2xl backdrop-blur-md transform hover:-translate-y-0.5 transition-transform">
              <div className="flex items-center justify-between pb-3 border-b border-hairline-violet text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <Radio className="w-3.5 h-3.5 text-accent-lime animate-pulse" />
                  <span className="font-bold text-accent-lime uppercase tracking-wider text-[11px]">Dev Radar</span>
                </div>
                <span className="text-accent-lime text-[10px] font-bold bg-accent-lime/10 px-2 py-0.5 rounded">
                  SCAN COMPLETED
                </span>
              </div>

              <div className="mt-3 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-on-dark-muted">
                  <span className="text-white font-medium">Local Dev Servers</span>
                  <span className="text-accent-lime font-bold">3 Detected</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between bg-surface-night/90 p-2 rounded border border-hairline-violet/50 text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-accent-lime" />
                      <span className="text-white font-bold">Port 3000</span>
                      <span className="text-on-dark-faint text-[10px]">Next.js</span>
                    </div>
                    <span className="text-accent-lime font-bold">12ms</span>
                  </div>

                  <div className="flex items-center justify-between bg-surface-night/90 p-2 rounded border border-hairline-violet/50 text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-accent-lime" />
                      <span className="text-white font-bold">Port 5173</span>
                      <span className="text-on-dark-faint text-[10px]">Vite UI</span>
                    </div>
                    <span className="text-accent-lime font-bold">6ms</span>
                  </div>

                  <div className="flex items-center justify-between bg-surface-night/90 p-2 rounded border border-hairline-violet/50 text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-accent-lime" />
                      <span className="text-white font-bold">Port 3333</span>
                      <span className="text-on-dark-faint text-[10px]">Universal MCP</span>
                    </div>
                    <span className="text-accent-lime font-bold">1ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Safety & Root Cause Verification */}
            <div className="bg-[#19112a]/95 border border-[#312351] rounded-xl p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 text-xs font-mono">
                <span className="font-bold text-white text-[11px] uppercase tracking-wider">Safety & Rollback Guard</span>
                <span className="text-[10px] text-accent-lime font-bold">100% PROTECTED</span>
              </div>

              <div className="mt-2 space-y-2 font-mono text-[11px]">
                <div className="flex items-start space-x-2 text-on-dark-muted">
                  <Check className="w-3.5 h-3.5 text-accent-lime mt-0.5 flex-shrink-0" />
                  <span>Automatic backup snapshot before AI edits</span>
                </div>
                <div className="flex items-start space-x-2 text-on-dark-muted">
                  <Check className="w-3.5 h-3.5 text-accent-lime mt-0.5 flex-shrink-0" />
                  <span>Git working tree clean (branch: main)</span>
                </div>
                <div className="flex items-start space-x-2 text-on-dark-muted">
                  <Check className="w-3.5 h-3.5 text-accent-lime mt-0.5 flex-shrink-0" />
                  <span>Command allowlist strictly enforced</span>
                </div>
                <div className="flex items-start space-x-2 text-on-dark-muted">
                  <Check className="w-3.5 h-3.5 text-accent-lime mt-0.5 flex-shrink-0" />
                  <span>Real-time SSE event telemetry stream active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Real-Time Platform Metrics Bar */}
      <div className="max-w-6xl mx-auto bg-surface-card border border-hairline-violet rounded-xl p-6 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div className="space-y-1">
          <div className="text-3xl font-black text-white">{toolsCount}</div>
          <div className="text-xs font-mono text-accent-lime font-bold uppercase tracking-wider">AI Tools Active</div>
          <div className="text-[11px] text-on-dark-muted">FS, Git, Web, CLI & Radar</div>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-black text-white">4</div>
          <div className="text-xs font-mono text-accent-pink font-bold uppercase tracking-wider">Supported Editors</div>
          <div className="text-[11px] text-on-dark-muted">Claude, Cursor, Windsurf, Zed</div>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-black text-white">0s</div>
          <div className="text-xs font-mono text-accent-lime font-bold uppercase tracking-wider">Rollback Delay</div>
          <div className="text-[11px] text-on-dark-muted">Instant safe file reversion</div>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-black text-white">:3333</div>
          <div className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">Single Port Process</div>
          <div className="text-[11px] text-on-dark-muted">Zero port sprawl architecture</div>
        </div>
      </div>

      {/* 5. Feature Grid with Rich Visuals */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Engineered for high-velocity local AI development
          </h2>
          <p className="text-on-dark-muted font-normal max-w-xl mx-auto text-sm">
            Everything your AI assistant needs to understand, test, and safely build your web applications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1: Dev Radar */}
          <div className="bg-surface-card border border-hairline-violet rounded-xl overflow-hidden hover:border-accent-lime/40 transition-colors flex flex-col justify-between group">
            <div className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-night border border-hairline-violet flex items-center justify-center text-accent-lime">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-accent-lime transition-colors">
                Dev Server Radar & Page Inspector
              </h3>
              <p className="text-sm text-on-dark-muted leading-relaxed">
                Parallel background scanning across ports 3000, 5173, 8080, and 4200. Let your AI agent view live
                rendered HTML, analyze server headers, and inspect runtime response times.
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
                  className="absolute bottom-3 right-3 btn-cap bg-surface-night/90 hover:bg-surface-night text-white text-xs font-mono px-3 py-1.5 rounded border border-hairline-violet flex items-center space-x-1.5 backdrop-blur-md"
                >
                  <span>Launch Radar</span>
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
                Never fear an LLM hallucinating away your code. Every destructive write creates an automatic timestamped
                snapshot in <code className="text-accent-pink">.mcp-backups/</code> with side-by-side visual diff comparison
                and 1-click restore.
              </p>
            </div>

            <div className="mt-6 bg-surface-night rounded-lg border border-hairline-violet p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-on-dark-faint text-[10px]">
                <span>SNAPSHOT BROWSER</span>
                <span className="text-accent-pink">DIFF READY</span>
              </div>
              <div className="p-2.5 rounded bg-ink-deep border border-hairline-violet/50 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold">src/components/Navbar.tsx</div>
                  <div className="text-[10px] text-on-dark-faint">2 minutes ago • 4,120 bytes</div>
                </div>
                <button
                  onClick={() => onNavigate("backups")}
                  className="btn-cap bg-accent-pink text-ink-deep font-bold px-2.5 py-1 rounded text-[11px] hover:bg-pink-300"
                >
                  View Diff
                </button>
              </div>
            </div>
          </div>

          {/* Feature 3: Live Activity Telemetry */}
          <div className="bg-surface-card border border-hairline-violet rounded-xl p-6 hover:border-purple-400/40 transition-colors flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface-night border border-hairline-violet flex items-center justify-center text-purple-400">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                Real-Time SSE Activity Stream
              </h3>
              <p className="text-sm text-on-dark-muted leading-relaxed">
                Watch every single tool call, argument, execution latency, and error output live as Claude or Cursor
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
                Interactive API & CLI Playground
              </h3>
              <p className="text-sm text-on-dark-muted leading-relaxed">
                Send GET, POST, PUT, DELETE requests to your localhost backend without opening Postman. Execute
                allowlisted git commands, run tests, and inspect build errors directly from the UI.
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
      <div className="max-w-4xl mx-auto bg-surface-card border border-hairline-violet rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white">Connect Your Favorite AI Editor</h3>
            <p className="text-xs font-mono text-on-dark-muted mt-1">
              Active Project: <span className="text-accent-lime">{activeProjectName}</span> ({activeProjectRoot})
            </p>
          </div>

          {/* Editor Switcher Tabs */}
          <div className="flex space-x-1 bg-surface-night p-1 rounded-lg border border-hairline-violet">
            {(["claude", "cursor", "windsurf", "zed"] as const).map((ed) => (
              <button
                key={ed}
                onClick={() => setSelectedEditor(ed)}
                className={`btn-cap px-3 py-1.5 rounded text-xs capitalize font-mono transition-colors ${
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
          <div className="flex items-center justify-between bg-ink-deep px-4 py-2 rounded-t-lg border-t border-x border-hairline-violet text-xs font-mono text-on-dark-muted">
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

      {/* 7. Quick Launch Navigation Cards */}
      <div className="max-w-6xl mx-auto">
        <h4 className="text-xs font-mono text-on-dark-faint uppercase tracking-wider mb-4">
          Explore Developer Modules
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
