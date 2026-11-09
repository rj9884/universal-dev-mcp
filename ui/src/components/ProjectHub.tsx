import React, { useState, useEffect } from "react";
import { FolderGit2, Check, Copy, Plus, RefreshCw, Cpu, ArrowRight, GitBranch, Terminal, Shield } from "lucide-react";
import {
  ProjectItem,
  fetchProjects,
  switchProject,
  addProject,
  fetchEditorConfigs,
  callMcpTool,
} from "../api/client.js";

export const ProjectHub: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [gitStatus, setGitStatus] = useState<string>("");
  const [gitLoading, setGitLoading] = useState<boolean>(false);
  const [editorModalOpen, setEditorModalOpen] = useState<boolean>(false);
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [editorConfigs, setEditorConfigs] = useState<Record<string, unknown>>({});
  const [selectedEditor, setSelectedEditor] = useState<string>("claude");
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // New Project Form state
  const [newName, setNewName] = useState("");
  const [newRoot, setNewRoot] = useState("");
  const [newPorts, setNewPorts] = useState("3000,5173,8080");
  const [newCommands, setNewCommands] = useState("npm run build,npx tsc --noEmit,npm test");

  const loadGitStatus = async () => {
    setGitLoading(true);
    try {
      const gitRes = await callMcpTool("get_git_status", {});
      if (!gitRes.isError) {
        setGitStatus(gitRes.result);
      }
    } catch {
      /* ignore */
    } finally {
      setGitLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data.projects || []);
      await loadGitStatus();
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchEditorConfigs().then(setEditorConfigs).catch(() => {});
  }, []);

  const handleSwitch = async (nameOrPath: string) => {
    await switchProject(nameOrPath);
    await loadData();
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRoot) return;
    await addProject({
      name: newName,
      root: newRoot,
      allowed_ports: newPorts,
      allowed_commands: newCommands,
    });
    setAddModalOpen(false);
    setNewName("");
    setNewRoot("");
    await loadData();
  };

  const handleCopyConfig = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const activeProject = projects.find((p) => p.isActive);

  return (
    <div className="space-y-8 w-full">
      {/* Top Banner & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline-violet pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Project Command Center</h1>
            <span className="bg-accent-lime text-ink-deep text-xs font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-[0.2px]">
              Active Context
            </span>
          </div>
          <p className="text-on-dark-muted text-sm mt-1">
            Manage local code repositories and switch active workspace context across Claude Desktop, Cursor, Windsurf, and Zed.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setEditorModalOpen(true)}
            className="btn-cap bg-surface-night border border-hairline-violet hover:border-accent-lime/60 text-white px-3.5 py-2 rounded-md transition flex items-center space-x-2 text-xs"
          >
            <Cpu className="w-3.5 h-3.5 text-accent-lime" />
            <span>Connect Editors</span>
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-cap bg-white text-ink-deep hover:bg-slate-100 font-bold px-4 py-2 rounded-md transition flex items-center space-x-1.5 text-xs shadow-md"
          >
            <Plus className="w-4 h-4 text-ink-deep" />
            <span>Add Project</span>
          </button>
          <button
            onClick={loadData}
            title="Refresh Projects and Git Status"
            className="p-2 rounded-md bg-surface-night border border-hairline-violet text-on-dark-muted hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Active Project & Git Telemetry Stage */}
      {activeProject && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
          {/* Left Panel: Active Project Configuration */}
          <div className="lg:col-span-5 bg-surface-night border border-hairline-violet rounded-xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="bg-accent-lime/20 border border-accent-lime/30 text-accent-lime text-xs font-bold px-2.5 py-1 rounded-[4px] uppercase tracking-[0.2px] flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
                  <span>Current Active Context</span>
                </span>
                <span className="text-[11px] font-mono text-on-dark-faint bg-ink-deep px-2 py-0.5 rounded border border-hairline-violet">
                  Port 3333 Active
                </span>
              </div>

              <div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  {activeProject.name}
                </h2>
                <div className="mt-2 flex items-center space-x-2 bg-ink-deep/80 border border-hairline-violet rounded-lg p-2.5 font-mono text-xs text-on-dark-muted">
                  <span className="truncate flex-1 text-white">{activeProject.root}</span>
                  <button
                    onClick={() => handleCopyPath(activeProject.root)}
                    title="Copy Root Path"
                    className="p-1 text-on-dark-faint hover:text-accent-lime transition"
                  >
                    {copiedPath === activeProject.root ? (
                      <Check className="w-3.5 h-3.5 text-accent-lime" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-ink-deep border border-hairline-violet/70 rounded-lg p-3">
                  <span className="text-on-dark-faint block text-[10px] uppercase font-mono tracking-wider mb-1.5">
                    Allowed Local Ports
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeProject.allowed_ports.split(",").map((port) => (
                      <span
                        key={port}
                        className="bg-accent-lime/15 text-accent-lime border border-accent-lime/30 text-[11px] font-mono px-2 py-0.5 rounded"
                      >
                        :{port.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-ink-deep border border-hairline-violet/70 rounded-lg p-3">
                  <span className="text-on-dark-faint block text-[10px] uppercase font-mono tracking-wider mb-1.5 flex items-center space-x-1">
                    <Shield className="w-3 h-3 text-accent-pink" />
                    <span>Safety Backups</span>
                  </span>
                  <span className="text-white text-xs font-mono font-medium block">
                    Armed before edits
                  </span>
                  <span className="text-[10px] text-on-dark-faint font-mono">
                    Snapshot to .mcp-backups/
                  </span>
                </div>
              </div>

              <div className="bg-ink-deep border border-hairline-violet/70 rounded-lg p-3">
                <span className="text-on-dark-faint block text-[10px] uppercase font-mono tracking-wider mb-1.5 flex items-center space-x-1">
                  <Terminal className="w-3 h-3 text-on-dark-faint" />
                  <span>Permitted Shell Commands</span>
                </span>
                <p className="text-xs font-mono text-on-dark-muted line-clamp-2 leading-relaxed">
                  {activeProject.allowed_commands}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-hairline-violet flex items-center justify-between text-xs font-mono text-on-dark-faint">
              <span>Switch anytime:</span>
              <code className="text-accent-lime bg-ink-deep px-2 py-0.5 rounded border border-hairline-violet">
                npx mcp-switch use {activeProject.name}
              </code>
            </div>
          </div>

          {/* Right Panel: Full Git Status & Repository Inspector */}
          <div className="lg:col-span-7 bg-surface-night border border-hairline-violet rounded-xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-hairline-violet">
                <div className="flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-accent-lime" />
                  <span className="font-bold text-white text-sm">Git Repository Status & Working Tree</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={loadGitStatus}
                    disabled={gitLoading}
                    className="p-1 text-on-dark-faint hover:text-white transition flex items-center space-x-1 text-xs font-mono"
                    title="Refresh Git Status"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${gitLoading ? "animate-spin text-accent-lime" : ""}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={() => handleCopyConfig(gitStatus)}
                    className="p-1 text-on-dark-faint hover:text-white transition flex items-center space-x-1 text-xs font-mono"
                    title="Copy Git Output"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-accent-lime" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Full Untruncated Git Status Output */}
              <div className="mt-4 bg-ink-deep border border-hairline-violet rounded-lg p-4 font-mono text-xs overflow-auto max-h-72 min-h-[220px]">
                {gitLoading ? (
                  <div className="flex items-center space-x-2 text-on-dark-muted py-8 justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin text-accent-lime" />
                    <span>Querying git repository status...</span>
                  </div>
                ) : gitStatus ? (
                  <pre className="text-on-dark-light whitespace-pre leading-relaxed select-text">
                    {gitStatus}
                  </pre>
                ) : (
                  <div className="text-on-dark-muted py-8 text-center">
                    <FolderGit2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-on-dark-faint" />
                    <p>No git repository detected in this project root.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-hairline-violet flex items-center justify-between text-xs font-mono text-on-dark-muted">
              <span>Structured Git tool: <code className="text-white">get_git_status</code></span>
              <span className="text-accent-lime">Live branch & unstaged diff detection</span>
            </div>
          </div>
        </div>
      )}

      {/* Projects List Grid */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-on-dark-muted uppercase tracking-[0.2px]">
            Configured Projects ({projects.length})
          </h3>
          <span className="text-xs font-mono text-on-dark-faint">
            Stored in projects.json
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 w-full">
          {projects.map((proj) => {
            const isActive = proj.isActive;
            return (
              <div
                key={proj.name}
                className={`bg-surface-night border rounded-xl p-5 transition flex flex-col justify-between ${
                  isActive
                    ? "border-accent-lime shadow-[0_0_20px_rgba(194,239,78,0.12)] ring-1 ring-accent-lime/40"
                    : "border-hairline-violet hover:border-hairline-cool/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-white tracking-tight truncate">{proj.name}</span>
                    {isActive ? (
                      <span className="bg-accent-lime text-ink-deep text-[10px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-[0.2px]">
                        Active
                      </span>
                    ) : (
                      !proj.exists && (
                        <span className="bg-accent-pink/20 text-accent-pink border border-accent-pink/30 text-[10px] font-bold px-1.5 py-0.5 rounded-[4px]">
                          Path Missing
                        </span>
                      )
                    )}
                  </div>

                  <p className="text-xs font-mono text-on-dark-muted truncate mb-4" title={proj.root}>
                    {proj.root}
                  </p>

                  <div className="space-y-2 text-[11px] font-mono text-on-dark-muted border-t border-hairline-violet/50 pt-3">
                    <div>
                      <span className="text-on-dark-faint block text-[10px] uppercase mb-1">Allowed Ports</span>
                      <div className="flex flex-wrap gap-1">
                        {proj.allowed_ports.split(",").map((p) => (
                          <span key={p} className="bg-ink-deep text-white px-1.5 py-0.5 rounded border border-hairline-violet text-[10px]">
                            :{p.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="text-on-dark-faint block text-[10px] uppercase mb-0.5">Commands</span>
                      <p className="text-white truncate text-[10px]">{proj.allowed_commands}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-hairline-violet flex items-center justify-end">
                  {isActive ? (
                    <span className="text-xs text-accent-lime font-mono flex items-center space-x-1.5 font-bold">
                      <Check className="w-4 h-4 text-accent-lime" />
                      <span>Active Project</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitch(proj.name)}
                      className="btn-cap bg-ink-deep hover:bg-white hover:text-ink-deep text-white border border-hairline-violet text-xs px-3.5 py-1.5 rounded-md transition flex items-center space-x-1.5 font-bold"
                    >
                      <span>Switch to this</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connect Editors Modal */}
      {editorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-night border border-hairline-violet rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-hairline-violet pb-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-accent-lime" />
                <h3 className="text-lg font-bold text-white">Connect AI Editors</h3>
              </div>
              <button
                onClick={() => setEditorModalOpen(false)}
                className="text-on-dark-muted hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-dark-muted">
              Copy and paste this configuration block into your editor's MCP settings to immediately enable all 17 local development tools:
            </p>

            {/* Editor selection tabs */}
            <div className="flex space-x-2 border-b border-hairline-violet pb-2">
              {[
                { id: "claude", label: "Claude Desktop" },
                { id: "cursor", label: "Cursor" },
                { id: "windsurf", label: "Windsurf" },
                { id: "zed", label: "Zed" },
              ].map((ed) => (
                <button
                  key={ed.id}
                  onClick={() => setSelectedEditor(ed.id)}
                  className={`btn-cap px-3 py-1.5 rounded-md text-xs transition ${
                    selectedEditor === ed.id
                      ? "bg-white text-ink-deep font-bold"
                      : "text-on-dark-muted hover:text-white hover:bg-ink-deep"
                  }`}
                >
                  {ed.label}
                </button>
              ))}
            </div>

            {/* Config JSON display */}
            <div className="relative bg-ink-deep border border-hairline-violet rounded-lg p-4 font-mono text-xs">
              <pre className="overflow-x-auto max-h-60 text-white">
                {JSON.stringify(editorConfigs[selectedEditor] || {}, null, 2)}
              </pre>
              <button
                onClick={() =>
                  handleCopyConfig(JSON.stringify(editorConfigs[selectedEditor] || {}, null, 2))
                }
                className="btn-cap absolute top-3 right-3 bg-surface-night hover:bg-white hover:text-ink-deep border border-hairline-violet text-white px-2.5 py-1 rounded flex items-center space-x-1 text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-accent-lime" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="text-[11px] text-on-dark-muted">
              <span className="font-bold text-white">Config Location: </span>
              {selectedEditor === "claude" && "~/.config/Claude/claude_desktop_config.json"}
              {selectedEditor === "cursor" && "~/.cursor/mcp.json or <project>/.cursor/mcp.json"}
              {selectedEditor === "windsurf" && "~/.codeium/windsurf/mcp_config.json"}
              {selectedEditor === "zed" && "~/.config/zed/settings.json"}
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddProject}
            className="bg-surface-night border border-hairline-violet rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-hairline-violet pb-3">
              <h3 className="text-lg font-bold text-white">Add Local Dev Project</h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-on-dark-muted hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white font-bold mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. my-vite-app"
                  className="w-full bg-ink-deep border border-hairline-cool/40 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent-lime"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-1">Project Root Absolute Path</label>
                <input
                  type="text"
                  required
                  value={newRoot}
                  onChange={(e) => setNewRoot(e.target.value)}
                  placeholder="e.g. /home/user/projects/my-vite-app"
                  className="w-full bg-ink-deep border border-hairline-cool/40 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent-lime"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-1">Allowed Ports</label>
                <input
                  type="text"
                  value={newPorts}
                  onChange={(e) => setNewPorts(e.target.value)}
                  placeholder="3000,5173,8080"
                  className="w-full bg-ink-deep border border-hairline-cool/40 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent-lime"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-1">Allowed Shell Commands</label>
                <textarea
                  rows={3}
                  value={newCommands}
                  onChange={(e) => setNewCommands(e.target.value)}
                  className="w-full bg-ink-deep border border-hairline-cool/40 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent-lime"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-hairline-violet">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="btn-cap px-4 py-2 text-on-dark-muted hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-cap bg-white text-ink-deep hover:bg-slate-100 px-4 py-2 rounded-md font-bold text-xs"
              >
                Save Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
