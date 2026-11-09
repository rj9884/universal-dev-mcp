import React, { useState, useEffect } from "react";
import { FolderGit2, Check, Copy, Plus, RefreshCw, Cpu, ArrowRight } from "lucide-react";
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
  const [editorModalOpen, setEditorModalOpen] = useState<boolean>(false);
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [editorConfigs, setEditorConfigs] = useState<Record<string, unknown>>({});
  const [selectedEditor, setSelectedEditor] = useState<string>("claude");
  const [copied, setCopied] = useState<boolean>(false);

  // New Project Form state
  const [newName, setNewName] = useState("");
  const [newRoot, setNewRoot] = useState("");
  const [newPorts, setNewPorts] = useState("3000,5173,8080");
  const [newCommands, setNewCommands] = useState("npm run build,npx tsc --noEmit,npm test");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data.projects || []);

      // Load git status for active project
      const gitRes = await callMcpTool("get_git_status", {});
      if (!gitRes.isError) {
        setGitStatus(gitRes.result);
      }
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

  const activeProject = projects.find((p) => p.isActive);

  return (
    <div className="space-y-8">
      {/* Top Banner & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline-violet pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Project Command Center</h1>
            <span className="bg-accent-lime text-ink-deep text-xs font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-[0.2px]">
              Multi-Project
            </span>
          </div>
          <p className="text-on-dark-muted text-sm mt-1">
            Instantly switch active repository context across Claude Desktop, Cursor, Windsurf, Zed, and HTTP.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setEditorModalOpen(true)}
            className="btn-cap bg-surface-night border border-hairline-violet hover:border-accent-violet text-white px-3.5 py-2 rounded-md transition flex items-center space-x-2 text-xs"
          >
            <Cpu className="w-3.5 h-3.5 text-accent-violet" />
            <span>Connect Editors</span>
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-cap bg-white text-ink-deep hover:bg-surface-press-stronger px-4 py-2 rounded-md transition flex items-center space-x-1.5 text-xs shadow-glow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 rounded-md bg-surface-night border border-hairline-violet text-on-dark-muted hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Active Project Highlight Banner */}
      {activeProject && (
        <div className="bg-surface-night border border-hairline-violet rounded-xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-violet/5 rounded-full filter blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="bg-accent-lime/20 border border-accent-lime/30 text-accent-lime text-xs font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-[0.2px]">
                  ● Live Active Context
                </span>
                <span className="text-xs text-on-dark-muted font-mono">{activeProject.root}</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white flex items-center space-x-3">
                <span>{activeProject.name}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2">
                <div className="bg-ink-deep/70 border border-hairline-violet rounded-lg p-3">
                  <span className="text-on-dark-muted block text-[10px] uppercase tracking-wider mb-1">
                    Allowed Local Ports
                  </span>
                  <span className="text-accent-lime font-bold">{activeProject.allowed_ports}</span>
                </div>
                <div className="bg-ink-deep/70 border border-hairline-violet rounded-lg p-3">
                  <span className="text-on-dark-muted block text-[10px] uppercase tracking-wider mb-1">
                    Allowed Execution Commands
                  </span>
                  <span className="text-white truncate block">{activeProject.allowed_commands}</span>
                </div>
              </div>
            </div>

            {/* Quick Git info card */}
            {gitStatus && (
              <div className="bg-ink-deep/90 border border-hairline-violet rounded-lg p-4 max-w-md w-full text-xs font-mono">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-accent-lime font-bold text-[11px] uppercase tracking-wider flex items-center space-x-1">
                    <FolderGit2 className="w-3.5 h-3.5" />
                    <span>Git Status</span>
                  </span>
                </div>
                <pre className="text-on-dark-muted overflow-x-auto max-h-32 text-[11px] leading-relaxed">
                  {gitStatus.slice(0, 400)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projects List Grid */}
      <div>
        <h3 className="text-sm font-bold text-on-dark-muted uppercase tracking-[0.2px] mb-4">
          Configured Projects ({projects.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const isActive = proj.isActive;
            return (
              <div
                key={proj.name}
                className={`bg-ink-deep border rounded-xl p-5 transition flex flex-col justify-between ${
                  isActive
                    ? "border-accent-lime shadow-[0_0_15px_rgba(194,239,78,0.1)] ring-1 ring-accent-lime/30"
                    : "border-hairline-violet hover:border-accent-violet/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-white tracking-tight">{proj.name}</span>
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

                  <div className="space-y-1.5 text-[11px] font-mono text-on-dark-muted border-t border-hairline-violet/50 pt-3">
                    <div>
                      <span className="text-white/60">Ports: </span>
                      <span className="text-white">{proj.allowed_ports}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-white/60">Cmds: </span>
                      <span className="text-white">{proj.allowed_commands}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-hairline-violet flex items-center justify-end">
                  {isActive ? (
                    <span className="text-xs text-accent-lime font-mono flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Current Active Project</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitch(proj.name)}
                      className="btn-cap bg-surface-night hover:bg-white hover:text-ink-deep text-white border border-hairline-violet text-xs px-3 py-1.5 rounded-md transition flex items-center space-x-1.5"
                    >
                      <span>Switch to this</span>
                      <ArrowRight className="w-3 h-3" />
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
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
              Copy and paste this MCP server configuration block directly into your editor's settings file:
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
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
                className="btn-cap bg-white text-ink-deep hover:bg-surface-press-stronger px-4 py-2 rounded-md font-bold text-xs"
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
