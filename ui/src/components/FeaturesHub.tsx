import React, { useState } from "react";
import {
  FolderGit2,
  Terminal,
  GitBranch,
  FileCode,
  Radio,
  Globe,
  Search,
  Cpu,
  ArrowRight,
  Code2,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

export interface FeatureCard {
  id: string;
  name: string;
  toolName: string;
  category: "project" | "execution" | "git" | "files" | "backup" | "radar" | "browser" | "search";
  cliCommand: string;
  description: string;
  parameters: string[];
  targetTab: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ALL_FEATURES: FeatureCard[] = [
  {
    id: "mcp-switch",
    name: "AI Editor Switch & Sync",
    toolName: "get_active_project / set_project_root",
    category: "project",
    cliCommand: "npx mcp-switch use <project> --editor <editor>",
    description: "Switch active project root and automatically sync configuration across Claude Desktop, Cursor, Windsurf, and Zed config files.",
    parameters: ["project_name", "target_editor (all, claude, cursor, windsurf, zed)"],
    targetTab: "projects",
    icon: Cpu,
  },
  {
    id: "project-info",
    name: "Deep Project Telemetry",
    toolName: "get_project_info",
    category: "project",
    cliCommand: "npx mcp-switch current",
    description: "Inspect project structure, package.json dependencies, git branch, allowed ports, and allowlisted shell commands.",
    parameters: ["include_files (boolean)", "max_depth (number)"],
    targetTab: "projects",
    icon: FolderGit2,
  },
  {
    id: "run-command",
    name: "Allowlisted Command Runner",
    toolName: "run_command",
    category: "execution",
    cliCommand: "npm run build / npm test / npx tsc",
    description: "Safely execute allowlisted shell commands in the active project environment with live stdout/stderr capture and timeout protection.",
    parameters: ["command (string)", "timeout_ms (number)", "cwd (optional)"],
    targetTab: "console",
    icon: Terminal,
  },
  {
    id: "git-status",
    name: "Git Repository Status",
    toolName: "get_git_status",
    category: "git",
    cliCommand: "git status --porcelain",
    description: "Live detection of git branch, untracked files, staged and unstaged modifications, and ahead/behind commit telemetry.",
    parameters: ["none"],
    targetTab: "projects",
    icon: GitBranch,
  },
  {
    id: "git-diff",
    name: "Visual Git Diff Inspector",
    toolName: "get_git_diff",
    category: "git",
    cliCommand: "git diff / git diff --staged",
    description: "Inspect live colorized diffs of working tree changes or staged changes, filtered by file or repository-wide.",
    parameters: ["filepath (optional)", "staged (boolean)"],
    targetTab: "projects",
    icon: Code2,
  },
  {
    id: "read-file",
    name: "Safe File Reader",
    toolName: "read_file",
    category: "files",
    cliCommand: "cat / head / tail <file>",
    description: "Read contents of any project file with line numbering, path traversal protection, and optional windowed line range limits.",
    parameters: ["filepath (string)", "start_line (number)", "end_line (number)"],
    targetTab: "explorer",
    icon: FileCode,
  },
  {
    id: "edit-file",
    name: "Safe File Writer & Replacer",
    toolName: "edit_file",
    category: "files",
    cliCommand: "echo 'content' > file (with auto .bak)",
    description: "Write or replace file content safely. Automatically generates an instant timestamped .bak copy in .universal-dev-mcp/backups/ before modifying.",
    parameters: ["filepath (string)", "content (string)", "create_if_missing (boolean)"],
    targetTab: "explorer",
    icon: FileCode,
  },
  {
    id: "patch-file",
    name: "Targeted Block Patcher",
    toolName: "patch_file",
    category: "files",
    cliCommand: "sed / patch (with auto .bak)",
    description: "Precision replacement of a target block of text inside a file with rollback safety and uniqueness checking.",
    parameters: ["filepath (string)", "target_string (string)", "replacement_string (string)"],
    targetTab: "explorer",
    icon: FileCode,
  },
  {
    id: "list-files",
    name: "Recursive File Tree Explorer",
    toolName: "list_files",
    category: "files",
    cliCommand: "find . -maxdepth 3 / ls -R",
    description: "Explore project directories recursively, respecting gitignore and excluding heavy node_modules/.git directories.",
    parameters: ["directory (string)", "depth (number)"],
    targetTab: "explorer",
    icon: FolderGit2,
  },
  {
    id: "delete-file",
    name: "Safe File Deletion",
    toolName: "delete_file",
    category: "files",
    cliCommand: "rm <file> (with auto .bak)",
    description: "Remove project files safely. Creates a full .bak snapshot prior to deletion so any accidental removal can be rolled back instantly.",
    parameters: ["filepath (string)"],
    targetTab: "explorer",
    icon: FileCode,
  },
  {
    id: "move-file",
    name: "Safe Move & Rename",
    toolName: "move_file",
    category: "files",
    cliCommand: "mv <source> <target>",
    description: "Move or rename files within the project root with path validation and destination safety checks.",
    parameters: ["source_path (string)", "target_path (string)"],
    targetTab: "explorer",
    icon: FileCode,
  },
  {
    id: "restore-backup",
    name: "Instant Rollback & Backup Center",
    toolName: "restore_backup",
    category: "backup",
    cliCommand: "cp .universal-dev-mcp/backups/<file>.bak <file>",
    description: "1-click restoration of any file from its timestamped .bak snapshot with side-by-side visual diff preview.",
    parameters: ["filepath (string)", "backup_name_or_path (string)"],
    targetTab: "backups",
    icon: RotateCcw,
  },
  {
    id: "scan-dev-servers",
    name: "Dev Server Port Radar",
    toolName: "scan_dev_servers",
    category: "radar",
    cliCommand: "curl -I localhost:<port> / lsof -i :<port>",
    description: "Scan local development ports (3000, 5173, 8080, etc.), report latency, detect server headers (Vite, Next.js, Express), and verify status.",
    parameters: ["ports (comma-separated string)"],
    targetTab: "radar",
    icon: Radio,
  },
  {
    id: "check-port",
    name: "Instant Single-Port Probe",
    toolName: "check_port",
    category: "radar",
    cliCommand: "nc -zv localhost <port>",
    description: "High-speed probe of a single localhost port to verify server readiness and examine HTTP headers.",
    parameters: ["port (number)"],
    targetTab: "radar",
    icon: Radio,
  },
  {
    id: "view-page",
    name: "Localhost Web Browser Viewer",
    toolName: "view_page",
    category: "browser",
    cliCommand: "curl http://localhost:<port>/<path>",
    description: "Inspect local web app pages, extracting HTML document title, meta tags, interactive links, and rendered text content.",
    parameters: ["port (number)", "path (string)"],
    targetTab: "radar",
    icon: Globe,
  },
  {
    id: "get-api-response",
    name: "Localhost REST API Tester",
    toolName: "get_api_response",
    category: "browser",
    cliCommand: "curl -X <METHOD> http://localhost:<port>/api/...",
    description: "Execute GET, POST, PUT, DELETE, PATCH requests against local dev servers with custom headers and JSON body payloads.",
    parameters: ["port (number)", "path (string)", "method (string)", "body (optional)", "custom_headers (optional)"],
    targetTab: "playground",
    icon: Terminal,
  },
  {
    id: "search-files",
    name: "Fast Code & Regex Search",
    toolName: "search_files",
    category: "search",
    cliCommand: "grep -rn <query> . / ripgrep",
    description: "High-speed pattern search across all project source code with regex support, case sensitivity, and file glob filtering.",
    parameters: ["query (string)", "directory (string)", "case_sensitive (boolean)", "is_regex (boolean)", "file_pattern (optional)"],
    targetTab: "explorer",
    icon: Search,
  },
];

interface FeaturesHubProps {
  onNavigate: (tab: string) => void;
}

export const FeaturesHub: React.FC<FeaturesHubProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedCli, setCopiedCli] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Features (17)" },
    { id: "project", label: "Project & Editors" },
    { id: "execution", label: "Commands" },
    { id: "git", label: "Git Control" },
    { id: "files", label: "Filesystem" },
    { id: "backup", label: "Rollbacks" },
    { id: "radar", label: "Dev Radar" },
    { id: "browser", label: "Browser & API" },
    { id: "search", label: "Code Search" },
  ];

  const filteredFeatures = ALL_FEATURES.filter((f) => {
    const matchesCategory = selectedCategory === "all" || f.category === selectedCategory;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.cliCommand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyCli = (cli: string) => {
    navigator.clipboard.writeText(cli);
    setCopiedCli(cli);
    setTimeout(() => setCopiedCli(null), 2000);
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline-violet pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Features & Capabilities Catalog</h1>
            <span className="bg-accent-lime text-ink-deep text-xs font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-[0.2px]">
              17 Tools Active
            </span>
          </div>
          <p className="text-on-dark-muted text-sm mt-1">
            Every feature can be managed directly in the GUI without opening a terminal, while maintaining full CLI and MCP compatibility.
          </p>
        </div>

        {/* Search input */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-on-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search features, tools, commands..."
            className="w-full bg-surface-night border border-hairline-violet rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder-on-dark-muted focus:outline-none focus:border-accent-lime font-mono"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`btn-cap px-3.5 py-1.5 rounded-md text-xs transition whitespace-nowrap ${
              selectedCategory === cat.id
                ? "bg-white text-ink-deep font-bold"
                : "bg-surface-night text-on-dark-muted hover:text-white border border-hairline-violet"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              className="bg-surface-night border border-hairline-violet hover:border-accent-lime/60 rounded-xl p-5 transition flex flex-col justify-between group shadow-sm"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-ink-deep border border-hairline-violet flex items-center justify-center text-accent-lime group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-accent-lime transition-colors">
                        {feat.name}
                      </h3>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <code className="text-[10px] text-accent-lime font-mono bg-ink-deep px-1.5 py-0.2 rounded border border-hairline-violet">
                          {feat.toolName}
                        </code>
                      </div>
                    </div>
                  </div>
                  <span className="bg-ink-deep text-on-dark-muted text-[10px] font-mono px-2 py-0.5 rounded uppercase border border-hairline-violet">
                    {feat.category}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-on-dark-muted leading-relaxed">
                  {feat.description}
                </p>

                {/* CLI Command Equivalent */}
                <div className="bg-ink-deep rounded-md p-2.5 border border-hairline-violet/70 font-mono text-[11px] relative group/cmd">
                  <div className="text-[9px] uppercase font-bold text-on-dark-faint tracking-wider mb-1 flex items-center justify-between">
                    <span>CLI / Terminal Equivalent</span>
                    <button
                      onClick={() => handleCopyCli(feat.cliCommand)}
                      className="text-on-dark-muted hover:text-white flex items-center space-x-1"
                      title="Copy command"
                    >
                      {copiedCli === feat.cliCommand ? (
                        <Check className="w-3 h-3 text-accent-lime" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedCli === feat.cliCommand ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <code className="text-on-dark-light block truncate">{feat.cliCommand}</code>
                </div>

                {/* Parameters */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-dark-faint block mb-1">
                    Parameters
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {feat.parameters.map((param, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono bg-ink-deep/60 text-on-dark-muted px-1.5 py-0.5 rounded border border-hairline-violet/50"
                      >
                        {param}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-hairline-violet flex items-center justify-between">
                <span className="text-[11px] font-mono text-accent-lime flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-lime" />
                  <span>GUI Ready</span>
                </span>
                <button
                  onClick={() => onNavigate(feat.targetTab)}
                  className="btn-cap bg-white text-ink-deep hover:bg-slate-100 font-bold px-3 py-1.5 rounded-md text-xs transition flex items-center space-x-1.5 shadow"
                >
                  <span>Manage in GUI</span>
                  <ArrowRight className="w-3 h-3 text-ink-deep" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
