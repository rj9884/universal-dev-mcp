import React, { useState, useEffect } from "react";
import { RefreshCw, ExternalLink, Globe, Server } from "lucide-react";
import { PortScanServer, scanDevPorts, callMcpTool } from "../api/client.js";

export const DevRadar: React.FC = () => {
  const [servers, setServers] = useState<PortScanServer[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [inspectorPort, setInspectorPort] = useState<number>(5173);
  const [inspectorPath, setInspectorPath] = useState<string>("/");
  const [inspectResult, setInspectResult] = useState<string>("");
  const [inspecting, setInspecting] = useState<boolean>(false);

  const runScan = async () => {
    setScanning(true);
    try {
      const data = await scanDevPorts();
      setServers(data.activeServers || []);
      if (data.activeServers && data.activeServers.length > 0) {
        setInspectorPort(data.activeServers[0].port);
      }
    } catch {
      /* ignore */
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    runScan();
  }, []);

  const handleInspect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInspecting(true);
    try {
      const res = await callMcpTool("view_page", {
        port: Number(inspectorPort),
        path: inspectorPath,
      });
      setInspectResult(res.result);
    } catch (err: any) {
      setInspectResult(`Inspection failed: ${err.message}`);
    } finally {
      setInspecting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline-violet pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Dev Server Radar & Inspector</h1>
            <span className="bg-accent-lime text-ink-deep text-xs font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-[0.2px]">
              Port Scanner
            </span>
          </div>
          <p className="text-on-dark-muted text-sm mt-1">
            Detect running local dev servers (Vite, Next.js, CRA, Express, Django) in parallel and inspect their DOM structure.
          </p>
        </div>

        <button
          onClick={runScan}
          disabled={scanning}
          className="btn-cap bg-white text-ink-deep hover:bg-surface-press-stronger px-4 py-2 rounded-md transition flex items-center space-x-2 text-xs font-bold shadow-glow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
          <span>{scanning ? "Scanning Ports..." : "Scan Localhost"}</span>
        </button>
      </div>

      {/* Radar Matrix Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-stretch">
        <div className="xl:col-span-4 bg-surface-night border border-hairline-violet rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2px] flex items-center justify-between pb-3 border-b border-hairline-violet mb-3">
              <span>Detected Active Dev Servers</span>
              <span className="text-accent-lime font-mono">{servers.length} Active</span>
            </h3>

            {servers.length === 0 ? (
              <div className="bg-ink-deep border border-hairline-violet rounded-xl p-8 text-center text-xs font-mono text-on-dark-muted">
                <Server className="w-6 h-6 mx-auto mb-2 opacity-50 text-on-dark-faint" />
                <p>No active dev servers responded on scanned ports.</p>
                <p className="text-[10px] mt-1 text-on-dark-muted/70">
                  Start your dev server (e.g. npm run dev) on port 3000, 5173, or 8080.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                {servers.map((s) => (
                  <div
                    key={s.port}
                    onClick={() => {
                      setInspectorPort(s.port);
                      handleInspect();
                    }}
                    className={`bg-ink-deep border p-4 rounded-xl cursor-pointer transition ${
                      inspectorPort === s.port
                        ? "border-accent-lime shadow-[0_0_12px_rgba(194,239,78,0.15)] ring-1 ring-accent-lime/40"
                        : "border-hairline-violet hover:border-hairline-cool/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-accent-lime shadow-[0_0_8px_rgba(194,239,78,0.8)]" />
                        <span className="font-mono font-bold text-white text-base">
                          localhost:{s.port}
                        </span>
                      </div>
                      <span className="bg-surface-night border border-hairline-violet text-accent-lime text-[11px] font-mono px-2 py-0.5 rounded">
                        {s.latencyMs}ms
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-mono text-on-dark-muted flex items-center justify-between">
                      <span className="truncate">{s.title || "(Untitled page)"}</span>
                      <a
                        href={`http://localhost:${s.port}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-on-dark-muted hover:text-white ml-2"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-hairline-violet text-xs font-mono text-on-dark-faint flex items-center justify-between">
            <span>Scanned: 3000, 5173, 8080, 4200</span>
            <span className="text-accent-lime">Parallel scan</span>
          </div>
        </div>

        {/* Page Inspector Tool */}
        <div className="xl:col-span-8 bg-surface-night border border-hairline-violet rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-hairline-violet pb-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-accent-lime" />
                <h3 className="font-bold text-white text-sm">Live DOM & Page Inspector</h3>
              </div>
              <span className="text-[11px] font-mono text-on-dark-muted">
                Calls MCP tool: <code className="text-accent-lime">view_page</code>
              </span>
            </div>

            {/* Inspection Form */}
            <form onSubmit={handleInspect} className="flex gap-2 text-xs font-mono mt-4">
              <div className="w-32">
                <input
                  type="number"
                  value={inspectorPort}
                  onChange={(e) => setInspectorPort(Number(e.target.value))}
                  placeholder="Port"
                  className="w-full bg-ink-deep border border-hairline-violet rounded-md px-3 py-2 text-white focus:outline-none focus:border-accent-lime"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={inspectorPath}
                  onChange={(e) => setInspectorPath(e.target.value)}
                  placeholder="/ or /about"
                  className="w-full bg-ink-deep border border-hairline-violet rounded-md px-3 py-2 text-white focus:outline-none focus:border-accent-lime"
                />
              </div>
              <button
                type="submit"
                disabled={inspecting}
                className="btn-cap bg-white text-ink-deep hover:bg-slate-100 px-5 py-2 rounded-md font-bold text-xs shrink-0"
              >
                {inspecting ? "Fetching..." : "Inspect Page"}
              </button>
            </form>

            {/* Inspection Output */}
            <div className="bg-ink-deep border border-hairline-violet rounded-lg p-4 font-mono text-xs max-h-[580px] min-h-[380px] overflow-y-auto mt-4">
              {inspectResult ? (
                <pre className="text-white whitespace-pre-wrap leading-relaxed text-xs select-text">
                  {inspectResult}
                </pre>
              ) : (
                <div className="text-center py-20 text-on-dark-muted">
                  Enter a port and path above (e.g. 5173 /) and click "Inspect Page" to extract title, meta tags, and visible content.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-hairline-violet flex items-center justify-between text-xs font-mono text-on-dark-muted">
            <span>LLM Context Extraction</span>
            <span className="text-accent-lime">Extracts meta, title, body content & links</span>
          </div>
        </div>
      </div>
    </div>
  );
};
