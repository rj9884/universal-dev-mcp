import React, { useState, useEffect } from "react";
import { Terminal, Play, Check, Copy, RefreshCw, Trash2, Clock } from "lucide-react";
import { runTerminalCommand, fetchProjects } from "../api/client.js";

interface CommandHistoryItem {
  id: string;
  command: string;
  timestamp: number;
  output: string;
  durationMs: number;
  isError: boolean;
}

export const ConsoleRunner: React.FC = () => {
  const [command, setCommand] = useState<string>("npm test");
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState<boolean>(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [allowedCommands, setAllowedCommands] = useState<string[]>([]);
  const [activeProjectName, setActiveProjectName] = useState<string>("");
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);

  useEffect(() => {
    fetchProjects().then((data) => {
      const active = data.projects.find((p) => p.isActive);
      if (active) {
        setActiveProjectName(active.name);
        const cmds = active.allowed_commands
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        setAllowedCommands(cmds);
        if (cmds.length > 0 && !command) {
          setCommand(cmds[0]);
        }
      }
    }).catch(() => {});
  }, []);

  const handleRun = async (cmdToRun?: string) => {
    const finalCmd = cmdToRun || command;
    if (!finalCmd || running) return;

    setRunning(true);
    const start = Date.now();
    try {
      const res = await runTerminalCommand(finalCmd);
      const duration = Date.now() - start;
      setExecutionTime(duration);
      setOutput(res.output || "(Command produced no stdout/stderr output)");

      const historyItem: CommandHistoryItem = {
        id: String(Date.now()),
        command: finalCmd,
        timestamp: Date.now(),
        output: res.output,
        durationMs: duration,
        isError: !res.success,
      };
      setHistory((prev) => [historyItem, ...prev.slice(0, 19)]);
    } catch (err: any) {
      const duration = Date.now() - start;
      setExecutionTime(duration);
      setOutput(`Execution Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const standardPresets = [
    { label: "Run Tests", cmd: "npm test" },
    { label: "Build Project", cmd: "npm run build" },
    { label: "Typecheck", cmd: "npx tsc --noEmit" },
    { label: "Git Status", cmd: "git status" },
    { label: "Git Diff", cmd: "git diff" },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline-violet pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Terminal Command Center</h1>
            <span className="bg-accent-lime text-ink-deep text-xs font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-[0.2px]">
              Live Execution
            </span>
          </div>
          <p className="text-on-dark-muted text-sm mt-1">
            Execute allowlisted build, test, and shell commands in context of active project{" "}
            <span className="text-white font-mono font-bold">"{activeProjectName || "universal-dev-mcp"}"</span> without opening a terminal window.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-on-dark-muted">Tool:</span>
          <code className="text-xs font-mono text-accent-lime bg-surface-night border border-hairline-violet px-2 py-1 rounded">
            run_command
          </code>
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-on-dark-faint block">
          One-Click Allowlisted Actions
        </label>
        <div className="flex flex-wrap gap-2">
          {standardPresets.map((preset) => (
            <button
              key={preset.cmd}
              onClick={() => {
                setCommand(preset.cmd);
                handleRun(preset.cmd);
              }}
              disabled={running}
              className="btn-cap bg-surface-night hover:bg-white hover:text-ink-deep border border-hairline-violet text-white text-xs px-3.5 py-1.5 rounded-md transition flex items-center space-x-1.5 font-mono group disabled:opacity-50"
            >
              <Play className="w-3 h-3 text-accent-lime group-hover:text-ink-deep fill-current" />
              <span>{preset.label}</span>
              <span className="text-[10px] opacity-60">({preset.cmd})</span>
            </button>
          ))}
          {allowedCommands
            .filter((c) => !standardPresets.some((p) => p.cmd === c))
            .map((cmd) => (
              <button
                key={cmd}
                onClick={() => {
                  setCommand(cmd);
                  handleRun(cmd);
                }}
                disabled={running}
                className="btn-cap bg-surface-night hover:bg-white hover:text-ink-deep border border-hairline-violet text-white text-xs px-3.5 py-1.5 rounded-md transition flex items-center space-x-1.5 font-mono group disabled:opacity-50"
              >
                <Play className="w-3 h-3 text-accent-lime group-hover:text-ink-deep fill-current" />
                <span>{cmd}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Main Command Input Bar */}
      <div className="bg-surface-night border border-hairline-violet rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 relative flex items-center">
            <span className="absolute left-3 text-accent-lime font-mono font-bold">$</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRun();
              }}
              placeholder="Enter allowlisted command (e.g. npm test, npm run build)"
              className="w-full bg-ink-deep border border-hairline-violet rounded-md pl-8 pr-4 py-2.5 text-xs text-white font-mono placeholder-on-dark-muted focus:outline-none focus:border-accent-lime"
            />
          </div>
          <button
            onClick={() => handleRun()}
            disabled={running || !command.trim()}
            className="btn-cap bg-accent-lime text-ink-deep hover:bg-opacity-90 font-bold px-5 py-2.5 rounded-md text-xs transition flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 whitespace-nowrap"
          >
            {running ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-ink-deep" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current text-ink-deep" />
            )}
            <span>{running ? "Executing..." : "Run in GUI"}</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-on-dark-muted">
          <span>
            Security allowlist active: <code className="text-white">{allowedCommands.join(", ")}</code>
          </span>
          {executionTime !== null && (
            <span className="text-accent-lime flex items-center space-x-1">
              <Clock className="w-3 h-3 text-accent-lime" />
              <span>Finished in {executionTime}ms</span>
            </span>
          )}
        </div>
      </div>

      {/* Terminal Output Viewer */}
      <div className="bg-ink-deep border border-hairline-violet rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-surface-night px-4 py-2.5 border-b border-hairline-violet flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
            </div>
            <span className="text-xs font-mono text-on-dark-muted font-bold pl-2">
              Terminal Output
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {output && (
              <>
                <button
                  onClick={handleCopy}
                  className="btn-cap p-1 px-2.5 rounded bg-ink-deep text-on-dark-muted hover:text-white border border-hairline-violet text-[11px] font-mono flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3 h-3 text-accent-lime" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={() => setOutput("")}
                  className="btn-cap p-1 px-2.5 rounded bg-ink-deep text-on-dark-muted hover:text-white border border-hairline-violet text-[11px] font-mono flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-4 font-mono text-xs overflow-auto max-h-[500px] min-h-[220px]">
          {running ? (
            <div className="flex items-center space-x-2 text-on-dark-muted py-12 justify-center">
              <RefreshCw className="w-5 h-5 animate-spin text-accent-lime" />
              <span>Executing command in project root...</span>
            </div>
          ) : output ? (
            <pre className="text-on-dark-light whitespace-pre-wrap leading-relaxed select-text font-mono">
              {output}
            </pre>
          ) : (
            <div className="text-on-dark-muted py-12 text-center space-y-2">
              <Terminal className="w-8 h-8 mx-auto opacity-30 text-on-dark-faint" />
              <p>Ready to execute allowlisted commands. Select a preset or type a command above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Execution History */}
      {history.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-on-dark-muted uppercase tracking-[0.2px]">
            Recent Execution History ({history.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {history.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setCommand(item.command);
                  setOutput(item.output);
                }}
                className="bg-surface-night border border-hairline-violet hover:border-hairline-cool/50 rounded-lg p-3 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.isError ? "bg-accent-pink" : "bg-accent-lime"
                    }`}
                  />
                  <code className="text-xs font-mono text-white truncate">{item.command}</code>
                </div>
                <div className="flex items-center space-x-3 text-[10px] font-mono text-on-dark-muted shrink-0">
                  <span>{item.durationMs}ms</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
