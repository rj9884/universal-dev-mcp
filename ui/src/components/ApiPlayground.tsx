import React, { useState } from "react";
import { Terminal, Send, Play } from "lucide-react";
import { callMcpTool } from "../api/client.js";

export const ApiPlayground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"api" | "commands">("api");

  // API Tester state
  const [apiPort, setApiPort] = useState<number>(3000);
  const [apiPath, setApiPath] = useState<string>("/api/health");
  const [apiMethod, setApiMethod] = useState<string>("GET");
  const [apiBody, setApiBody] = useState<string>("");
  const [apiHeaders, setApiHeaders] = useState<string>("");
  const [apiResult, setApiResult] = useState<string>("");
  const [apiLoading, setApiLoading] = useState<boolean>(false);

  // Command Runner state
  const [command, setCommand] = useState<string>("git status");
  const [cmdResult, setCmdResult] = useState<string>("");
  const [cmdLoading, setCmdLoading] = useState<boolean>(false);

  const handleSendApi = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiLoading(true);
    try {
      const res = await callMcpTool("get_api_response", {
        port: Number(apiPort),
        path: apiPath,
        method: apiMethod,
        body: apiBody || undefined,
        custom_headers: apiHeaders || undefined,
      });
      setApiResult(res.result);
    } catch (err: any) {
      setApiResult(`API request error: ${err.message}`);
    } finally {
      setApiLoading(false);
    }
  };

  const handleRunCommand = async (cmdToRun?: string) => {
    const finalCmd = cmdToRun || command;
    setCmdLoading(true);
    try {
      const res = await callMcpTool("run_command", {
        command: finalCmd,
      });
      setCmdResult(res.result);
    } catch (err: any) {
      setCmdResult(`Command error: ${err.message}`);
    } finally {
      setCmdLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline-violet pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Playground & Command Center</h1>
            <span className="bg-accent-lime text-ink-deep text-xs font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-[0.2px]">
              Dev Workbench
            </span>
          </div>
          <p className="text-on-dark-muted text-sm mt-1">
            Test local endpoints directly or execute allowlisted commands in the active project environment.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex space-x-2 bg-surface-night p-1 rounded-lg border border-hairline-violet">
          <button
            onClick={() => setActiveTab("api")}
            className={`btn-cap px-3.5 py-1.5 rounded-md text-xs transition ${
              activeTab === "api"
                ? "bg-white text-ink-deep font-bold"
                : "text-on-dark-muted hover:text-white"
            }`}
          >
            Local API Tester
          </button>
          <button
            onClick={() => setActiveTab("commands")}
            className={`btn-cap px-3.5 py-1.5 rounded-md text-xs transition ${
              activeTab === "commands"
                ? "bg-white text-ink-deep font-bold"
                : "text-on-dark-muted hover:text-white"
            }`}
          >
            Allowlisted CLI Runner
          </button>
        </div>
      </div>

      {activeTab === "api" ? (
        /* API Tester View */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-stretch">
          <form
            onSubmit={handleSendApi}
            className="xl:col-span-5 bg-surface-night border border-hairline-violet rounded-xl p-6 space-y-4 font-mono text-xs flex flex-col justify-between"
          >
            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-hairline-violet pb-3">
                Localhost Request Builder
              </h3>

              <div className="flex gap-2">
                <select
                  value={apiMethod}
                  onChange={(e) => setApiMethod(e.target.value)}
                  className="bg-ink-deep border border-hairline-violet rounded-md px-3 py-2 text-white font-bold focus:outline-none focus:border-accent-lime"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>

                <input
                  type="number"
                  value={apiPort}
                  onChange={(e) => setApiPort(Number(e.target.value))}
                  placeholder="Port"
                  className="w-28 bg-ink-deep border border-hairline-violet rounded-md px-3 py-2 text-white focus:outline-none focus:border-accent-lime"
                />

                <input
                  type="text"
                  value={apiPath}
                  onChange={(e) => setApiPath(e.target.value)}
                  placeholder="/api/users"
                  className="flex-1 bg-ink-deep border border-hairline-violet rounded-md px-3 py-2 text-white focus:outline-none focus:border-accent-lime"
                />
              </div>

              <div>
                <label className="block text-on-dark-faint text-[10px] uppercase font-bold mb-1">
                  Custom Headers (JSON)
                </label>
                <input
                  type="text"
                  value={apiHeaders}
                  onChange={(e) => setApiHeaders(e.target.value)}
                  placeholder='{"Authorization": "Bearer token"}'
                  className="w-full bg-ink-deep border border-hairline-violet rounded-md px-3 py-2 text-white focus:outline-none focus:border-accent-lime text-xs"
                />
              </div>

              <div>
                <label className="block text-on-dark-faint text-[10px] uppercase font-bold mb-1">
                  Request Body (JSON)
                </label>
                <textarea
                  rows={6}
                  value={apiBody}
                  onChange={(e) => setApiBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="w-full bg-ink-deep border border-hairline-violet rounded-md px-3 py-2 text-white focus:outline-none focus:border-accent-lime text-xs"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-hairline-violet">
              <button
                type="submit"
                disabled={apiLoading}
                className="btn-cap w-full bg-white text-ink-deep hover:bg-slate-100 py-2.5 rounded-md font-bold text-xs flex items-center justify-center space-x-2 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{apiLoading ? "Sending Request..." : "Send Request"}</span>
              </button>
            </div>
          </form>

          {/* Response Viewer */}
          <div className="xl:col-span-7 bg-surface-night border border-hairline-violet rounded-xl p-6 flex flex-col justify-between font-mono text-xs">
            <div>
              <div className="flex items-center justify-between border-b border-hairline-violet pb-3 mb-4">
                <h3 className="font-bold text-white text-sm">
                  API Response Inspector
                </h3>
                <span className="text-[11px] text-on-dark-faint">
                  Calls <code className="text-accent-lime">get_api_response</code>
                </span>
              </div>
              <div className="bg-ink-deep border border-hairline-violet rounded-lg p-4 max-h-[580px] min-h-[380px] overflow-y-auto">
                {apiResult ? (
                  <pre className="text-white whitespace-pre-wrap leading-relaxed text-xs select-text">
                    {apiResult}
                  </pre>
                ) : (
                  <div className="text-center py-24 text-on-dark-muted">
                    Configure request details on the left and click "Send Request" to test your local dev API.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-hairline-violet flex items-center justify-between text-xs text-on-dark-muted">
              <span>Localhost HTTP dispatcher</span>
              <span className="text-accent-lime">Safe loopback request</span>
            </div>
          </div>
        </div>
      ) : (
        /* Allowlisted Command Runner View */
        <div className="space-y-5 font-mono text-xs">
          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              "git status",
              "git diff",
              "npm test",
              "npx tsc --noEmit",
              "npm run lint",
              "npm run build",
            ].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setCommand(preset);
                  handleRunCommand(preset);
                }}
                className="btn-cap bg-surface-night hover:bg-white hover:text-ink-deep border border-hairline-violet text-on-dark-muted hover:text-ink-deep px-3 py-1.5 rounded-md text-[11px] transition flex items-center space-x-1"
              >
                <Play className="w-2.5 h-2.5 text-accent-lime" />
                <span>{preset}</span>
              </button>
            ))}
          </div>

          {/* Custom Command Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2.5 text-accent-lime font-bold">$</span>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter allowlisted shell command..."
                className="w-full bg-surface-night border border-hairline-violet rounded-md pl-7 pr-3 py-2 text-white font-mono focus:outline-none focus:border-accent-lime"
              />
            </div>
            <button
              onClick={() => handleRunCommand()}
              disabled={cmdLoading}
              className="btn-cap bg-white text-ink-deep hover:bg-surface-press-stronger px-5 py-2 rounded-md font-bold text-xs flex items-center space-x-1.5 shadow-glow"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{cmdLoading ? "Running..." : "Run"}</span>
            </button>
          </div>

          {/* Terminal Output */}
          <div className="bg-surface-night border border-hairline-violet rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-hairline-violet mb-3">
              <span className="text-[11px] font-bold text-accent-lime uppercase tracking-wider">
                Terminal Output
              </span>
              <span className="text-[10px] text-on-dark-muted">
                Run in project root
              </span>
            </div>

            <div className="bg-ink-deep border border-hairline-violet rounded-lg p-4 font-mono text-[11px] max-h-[500px] overflow-y-auto">
              {cmdResult ? (
                <pre className="text-white whitespace-pre-wrap leading-relaxed">
                  {cmdResult}
                </pre>
              ) : (
                <div className="text-center py-16 text-on-dark-muted">
                  Select a preset command above or type an allowlisted command to execute it securely.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
