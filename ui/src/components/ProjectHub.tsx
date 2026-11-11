import React, { useState, useEffect } from "react";
import {
  FolderGit2,
  Check,
  Copy,
  Plus,
  RefreshCw,
  Cpu,
  ArrowRight,
  GitBranch,
  Terminal,
  Trash2,
  Edit2,
  Code2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  ProjectItem,
  EditorStatusItem,
  fetchProjects,
  switchProject,
  addProject,
  updateProject,
  deleteProject,
  fetchEditorConfigs,
  fetchEditorStatuses,
  syncEditors,
  fetchGitStatus,
  fetchGitDiff,
} from "../api/client.js";

export const ProjectHub: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editors, setEditors] = useState<EditorStatusItem[]>([]);
  const [syncingEditor, setSyncingEditor] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Git state
  const [gitView, setGitView] = useState<"status" | "diff">("status");
  const [gitStatus, setGitStatus] = useState<string>("");
  const [gitDiff, setGitDiff] = useState<string>("");
  const [gitLoading, setGitLoading] = useState<boolean>(false);
  const [diffStaged, setDiffStaged] = useState<boolean>(false);

  // Modals state
  const [editorModalOpen, setEditorModalOpen] = useState<boolean>(false);
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editorConfigs, setEditorConfigs] = useState<Record<string, unknown>>({});
  const [selectedEditor, setSelectedEditor] = useState<string>("claude");
  const [targetSyncEditor, setTargetSyncEditor] = useState<string>("all");
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // New Project Form state
  const [newName, setNewName] = useState("");
  const [newRoot, setNewRoot] = useState("");
  const [newPorts, setNewPorts] = useState("3000,5173,8080");
  const [newCommands, setNewCommands] = useState("npm run build,npx tsc --noEmit,npm test");

  // Edit Project Form state
  const [editOriginalName, setEditOriginalName] = useState("");
  const [editName, setEditName] = useState("");
  const [editRoot, setEditRoot] = useState("");
  const [editPorts, setEditPorts] = useState("");
  const [editCommands, setEditCommands] = useState("");

  const loadGitInfo = async () => {
    setGitLoading(true);
    try {
      const statusRes = await fetchGitStatus();
      setGitStatus(statusRes.output || "Clean working tree (no modifications).");
      const diffRes = await fetchGitDiff(undefined, diffStaged);
      setGitDiff(diffRes.diff || "(No git diff changes detected)");
    } catch {
      /* ignore */
    } finally {
      setGitLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [projData, editorsData] = await Promise.all([
        fetchProjects(),
        fetchEditorStatuses().catch(() => ({ editors: [], currentRoot: "" })),
      ]);
      setProjects(projData.projects || []);
      setEditors(editorsData.editors || []);
      await loadGitInfo();
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchEditorConfigs().then(setEditorConfigs).catch(() => {});
  }, [diffStaged]);

  const handleSwitch = async (nameOrPath: string, shouldSyncEditors = true) => {
    const res = await switchProject(nameOrPath, {
      syncEditors: shouldSyncEditors,
      targetEditor: "all",
    });
    if (res?.editorSync && res.editorSync.updated?.length > 0) {
      setSyncMessage(`Switched active context and synced to: ${res.editorSync.updated.join(", ")}`);
      setTimeout(() => setSyncMessage(null), 4000);
    }
    await loadData();
  };

  const handleSyncEditors = async (editor = targetSyncEditor) => {
    setSyncingEditor(true);
    try {
      const activeProj = projects.find((p) => p.isActive);
      const res = await syncEditors(activeProj?.name, editor);
      if (res.updated.length > 0) {
        setSyncMessage(`Successfully updated configuration for: ${res.updated.join(", ")}`);
      } else if (res.skipped.length > 0) {
        setSyncMessage(`Editor not found on disk, skipped: ${res.skipped.join(", ")}`);
      }
      setTimeout(() => setSyncMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      alert(`Sync error: ${err.message}`);
    } finally {
      setSyncingEditor(false);
    }
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

  const openEditModal = (proj: ProjectItem) => {
    setEditOriginalName(proj.name);
    setEditName(proj.name);
    setEditRoot(proj.root);
    setEditPorts(proj.allowed_ports);
    setEditCommands(proj.allowed_commands);
    setEditModalOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editRoot) return;
    await updateProject(editOriginalName, {
      name: editName,
      root: editRoot,
      allowed_ports: editPorts,
      allowed_commands: editCommands,
    });
    setEditModalOpen(false);
    await loadData();
  };

  const handleDeleteProject = async (name: string) => {
    if (window.confirm(`Are you sure you want to remove project "${name}" from projects.json?`)) {
      await deleteProject(name);
      await loadData();
    }
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

      {/* Editor Sync Notification */}
      {syncMessage && (
        <div className="bg-surface-night border border-accent-lime/70 rounded-xl p-4 flex items-center justify-between text-xs font-mono text-white shadow-lg animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-accent-lime shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <span className="text-[11px] text-accent-lime uppercase font-bold">Synced</span>
        </div>
      )}

      {/* AI Editor Synchronization Status Bar */}
      <div className="bg-surface-night border border-hairline-violet rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline-violet pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-accent-lime" />
              <span>AI Editor Workspace Synchronization</span>
            </h3>
            <p className="text-xs text-on-dark-muted mt-0.5">
              Sync active PROJECT_ROOT to editor configuration files without running <code className="text-white">npx mcp-switch use</code> in terminal.
            </p>
          </div>

          {/* Quick sync controls */}
          <div className="flex items-center space-x-2">
            <select
              value={targetSyncEditor}
              onChange={(e) => setTargetSyncEditor(e.target.value)}
              className="bg-ink-deep border border-hairline-violet rounded-md px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-accent-lime"
            >
              <option value="all">All Detected Editors</option>
              <option value="claude">Claude Desktop</option>
              <option value="cursor">Cursor</option>
              <option value="windsurf">Windsurf</option>
              <option value="zed">Zed</option>
            </select>
            <button
              onClick={() => handleSyncEditors()}
              disabled={syncingEditor}
              className="btn-cap bg-accent-lime text-ink-deep hover:bg-opacity-90 font-bold px-3.5 py-1.5 rounded-md text-xs transition flex items-center space-x-1.5 shadow disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-ink-deep" />
              <span>{syncingEditor ? "Syncing..." : "Sync to Editors"}</span>
            </button>
          </div>
        </div>

        {/* Editor Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {editors.map((ed) => {
            const isConfigured = ed.configured;
            const exists = ed.exists;
            return (
              <div
                key={ed.id}
                className="bg-ink-deep border border-hairline-violet/70 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{ed.name}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-[3px] font-bold uppercase ${
                      isConfigured
                        ? "bg-accent-lime/20 text-accent-lime border border-accent-lime/40"
                        : exists
                        ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"
                        : "bg-surface-night text-on-dark-muted border border-hairline-violet"
                    }`}
                  >
                    {isConfigured ? "Configured" : exists ? "Detected" : "Not Found"}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-on-dark-muted truncate" title={ed.configPath || ""}>
                  {ed.configPath ? ed.configPath.replace(process.env.HOME || "", "~") : "Path unavailable"}
                </div>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-on-dark-faint">
                    Root: {ed.configuredRoot ? ed.configuredRoot.split("/").pop() : "None"}
                  </span>
                  <button
                    onClick={() => handleSyncEditors(ed.id)}
                    disabled={syncingEditor}
                    className="text-[10px] font-mono text-accent-lime hover:underline font-bold"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Project & Git Telemetry Stage */}
      {activeProject && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
          {/* Left Panel: Active Project Configuration */}
          <div className="lg:col-span-5 bg-surface-night border border-hairline-violet rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-hairline-violet pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-accent-lime font-bold">
                    Active Context Root
                  </span>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2 mt-0.5">
                    <span>{activeProject.name}</span>
                    <span className="w-2 h-2 rounded-full bg-accent-lime shadow-[0_0_8px_rgba(194,239,78,0.8)]" />
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(activeProject)}
                    className="p-1.5 rounded-md bg-ink-deep border border-hairline-violet text-on-dark-muted hover:text-white transition"
                    title="Edit project configuration"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCopyPath(activeProject.root)}
                    className="btn-cap bg-ink-deep border border-hairline-violet hover:border-accent-lime/60 text-white px-2.5 py-1 rounded text-xs transition flex items-center space-x-1 font-mono"
                  >
                    {copiedPath === activeProject.root ? (
                      <Check className="w-3.5 h-3.5 text-accent-lime" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedPath === activeProject.root ? "Copied" : "Copy Path"}</span>
                  </button>
                </div>
              </div>

              {/* Absolute Path Box */}
              <div>
                <label className="text-[10px] uppercase font-bold text-on-dark-faint block mb-1">
                  Filesystem Location
                </label>
                <div className="bg-ink-deep border border-hairline-violet rounded-md px-3 py-2 font-mono text-xs text-on-dark-light break-all select-text">
                  {activeProject.root}
                </div>
              </div>

              {/* Ports Allowed */}
              <div>
                <label className="text-[10px] uppercase font-bold text-on-dark-faint block mb-1">
                  Allowlisted Port Scanner Range
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {activeProject.allowed_ports.split(",").map((p) => (
                    <span
                      key={p}
                      className="bg-ink-deep text-accent-lime border border-hairline-violet text-xs font-mono px-2 py-0.5 rounded font-bold"
                    >
                      :{p.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Commands Allowed */}
              <div>
                <label className="text-[10px] uppercase font-bold text-on-dark-faint block mb-1">
                  Allowlisted Terminal Commands
                </label>
                <div className="bg-ink-deep border border-hairline-violet rounded-md p-2.5 space-y-1 font-mono text-xs max-h-36 overflow-y-auto">
                  {activeProject.allowed_commands.split(",").map((cmd, i) => (
                    <div key={i} className="flex items-center space-x-1.5 text-on-dark-light truncate">
                      <Terminal className="w-3 h-3 text-accent-lime shrink-0" />
                      <span className="truncate">{cmd.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-hairline-violet flex items-center justify-between text-xs font-mono text-on-dark-muted">
              <span>Security Enforced</span>
              <span className="text-accent-lime">Traversal Sandbox Active</span>
            </div>
          </div>

          {/* Right Panel: Live Git Status & Visual Git Diff Viewer */}
          <div className="lg:col-span-7 bg-surface-night border border-hairline-violet rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-hairline-violet pb-3">
                <div className="flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-accent-lime" />
                  <span className="font-bold text-white text-sm">Git Telemetry & Diff Inspector</span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Sub-view toggle */}
                  <div className="flex bg-ink-deep rounded-md p-0.5 border border-hairline-violet text-xs font-mono">
                    <button
                      onClick={() => setGitView("status")}
                      className={`px-2.5 py-1 rounded transition ${
                        gitView === "status"
                          ? "bg-white text-ink-deep font-bold"
                          : "text-on-dark-muted hover:text-white"
                      }`}
                    >
                      Status
                    </button>
                    <button
                      onClick={() => setGitView("diff")}
                      className={`px-2.5 py-1 rounded transition ${
                        gitView === "diff"
                          ? "bg-white text-ink-deep font-bold"
                          : "text-on-dark-muted hover:text-white"
                      }`}
                    >
                      Diff Viewer
                    </button>
                  </div>

                  {gitView === "diff" && (
                    <button
                      onClick={() => setDiffStaged(!diffStaged)}
                      className={`px-2 py-1 rounded border text-[11px] font-mono transition ${
                        diffStaged
                          ? "bg-accent-lime text-ink-deep border-accent-lime font-bold"
                          : "bg-ink-deep text-on-dark-muted border-hairline-violet hover:text-white"
                      }`}
                    >
                      {diffStaged ? "Staged" : "Unstaged"}
                    </button>
                  )}

                  <button
                    onClick={loadGitInfo}
                    className="p-1 text-on-dark-faint hover:text-white transition"
                    title="Refresh Git Information"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${gitLoading ? "animate-spin text-accent-lime" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Output Display Area */}
              <div className="mt-4 bg-ink-deep border border-hairline-violet rounded-lg p-4 font-mono text-xs overflow-auto max-h-80 min-h-[220px]">
                {gitLoading ? (
                  <div className="flex items-center space-x-2 text-on-dark-muted py-8 justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin text-accent-lime" />
                    <span>Querying git repository telemetry...</span>
                  </div>
                ) : gitView === "status" ? (
                  gitStatus ? (
                    <pre className="text-on-dark-light whitespace-pre leading-relaxed select-text font-mono">
                      {gitStatus}
                    </pre>
                  ) : (
                    <div className="text-on-dark-muted py-8 text-center">
                      <FolderGit2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-on-dark-faint" />
                      <p>No git repository detected in this project root.</p>
                    </div>
                  )
                ) : (
                  gitDiff ? (
                    <div className="space-y-0.5 leading-relaxed font-mono select-text">
                      {gitDiff.split("\n").map((line, idx) => {
                        let lineClass = "text-on-dark-light";
                        if (line.startsWith("+") && !line.startsWith("+++")) {
                          lineClass = "text-accent-lime bg-accent-lime/10 px-1 rounded";
                        } else if (line.startsWith("-") && !line.startsWith("---")) {
                          lineClass = "text-accent-pink bg-accent-pink/10 px-1 rounded";
                        } else if (line.startsWith("@@")) {
                          lineClass = "text-accent-violet font-bold";
                        }
                        return (
                          <div key={idx} className={`${lineClass} font-mono whitespace-pre`}>
                            {line || " "}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-on-dark-muted py-8 text-center">
                      <Code2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-on-dark-faint" />
                      <p>Clean working tree. No {diffStaged ? "staged" : "unstaged"} differences found.</p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-hairline-violet flex items-center justify-between text-xs font-mono text-on-dark-muted">
              <span>Tools: <code className="text-white">get_git_status</code>, <code className="text-white">get_git_diff</code></span>
              <span className="text-accent-lime">Colorized Git Diffs Live</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
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
                    <div className="flex items-center space-x-1.5">
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
                      <button
                        onClick={() => openEditModal(proj)}
                        className="p-1 rounded text-on-dark-muted hover:text-white transition"
                        title="Edit project"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.name)}
                        className="p-1 rounded text-on-dark-muted hover:text-accent-pink transition"
                        title="Delete project"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
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

                <div className="mt-5 pt-3 border-t border-hairline-violet flex items-center justify-between">
                  {isActive ? (
                    <span className="text-xs text-accent-lime font-mono flex items-center space-x-1.5 font-bold">
                      <Check className="w-4 h-4 text-accent-lime" />
                      <span>Active Project</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitch(proj.name, true)}
                      className="btn-cap bg-ink-deep hover:bg-white hover:text-ink-deep text-white border border-hairline-violet text-xs px-3.5 py-1.5 rounded-md transition flex items-center space-x-1.5 font-bold"
                    >
                      <span>Switch & Sync</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyPath(proj.root)}
                    className="p-1 text-on-dark-faint hover:text-white transition"
                    title="Copy path"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
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
              Apply configuration directly into your editor's MCP config file with 1 click, or copy the JSON block manually:
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
              <div className="absolute top-3 right-3 flex items-center space-x-2">
                <button
                  onClick={() => handleSyncEditors(selectedEditor)}
                  className="btn-cap bg-accent-lime text-ink-deep hover:bg-opacity-90 px-2.5 py-1 rounded flex items-center space-x-1 text-[11px] font-bold shadow"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Apply to Editor</span>
                </button>
                <button
                  onClick={() =>
                    handleCopyConfig(JSON.stringify(editorConfigs[selectedEditor] || {}, null, 2))
                  }
                  className="btn-cap bg-surface-night hover:bg-white hover:text-ink-deep border border-hairline-violet text-white px-2.5 py-1 rounded flex items-center space-x-1 text-[11px]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-accent-lime" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-on-dark-muted">
              <span className="font-bold text-white">Target Config Location: </span>
              {selectedEditor === "claude" && "~/.config/Claude/claude_desktop_config.json"}
              {selectedEditor === "cursor" && "~/.cursor/mcp.json"}
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
                  placeholder="e.g. my-app"
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
                  placeholder="e.g. /home/rajan/Projects/my-app"
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

      {/* Edit Project Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateProject}
            className="bg-surface-night border border-hairline-violet rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-hairline-violet pb-3">
              <h3 className="text-lg font-bold text-white">Edit Project Configuration</h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
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
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-ink-deep border border-hairline-cool/40 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent-lime"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-1">Project Root Absolute Path</label>
                <input
                  type="text"
                  required
                  value={editRoot}
                  onChange={(e) => setEditRoot(e.target.value)}
                  className="w-full bg-ink-deep border border-hairline-cool/40 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent-lime"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-1">Allowed Ports</label>
                <input
                  type="text"
                  value={editPorts}
                  onChange={(e) => setEditPorts(e.target.value)}
                  className="w-full bg-ink-deep border border-hairline-cool/40 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent-lime"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-1">Allowed Shell Commands</label>
                <textarea
                  rows={3}
                  value={editCommands}
                  onChange={(e) => setEditCommands(e.target.value)}
                  className="w-full bg-ink-deep border border-hairline-cool/40 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent-lime"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-hairline-violet">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="btn-cap px-4 py-2 text-on-dark-muted hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-cap bg-accent-lime text-ink-deep hover:bg-opacity-90 px-4 py-2 rounded-md font-bold text-xs"
              >
                Update Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
