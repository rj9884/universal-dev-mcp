export interface EditorStatusItem {
  id: "claude" | "cursor" | "windsurf" | "zed";
  name: string;
  configPath: string | null;
  exists: boolean;
  configured: boolean;
  configuredRoot: string | null;
}

export interface ProjectItem {
  name: string;
  root: string;
  allowed_ports: string;
  allowed_commands: string;
  isActive: boolean;
  exists: boolean;
}

export interface ActivityEventItem {
  id: string;
  timestamp: number;
  type: "tool:start" | "tool:complete" | "tool:error" | "project:switched" | "backup:created";
  toolName?: string;
  arguments?: Record<string, unknown>;
  result?: string;
  error?: string;
  durationMs?: number;
  projectRoot?: string;
  metadata?: Record<string, unknown>;
}

export interface BackupItem {
  filename: string;
  fullPath: string;
  relPath: string;
  originalRel: string;
  sizeBytes: number;
  modifiedAt: number;
}

export interface PortScanServer {
  port: number;
  active: boolean;
  statusCode?: number;
  latencyMs?: number;
  serverHeader?: string;
  title?: string;
}

export interface ToolItem {
  name: string;
  description: string;
  schema: Record<string, unknown>;
}

export interface ServerInfo {
  name: string;
  version: string;
  status: string;
  project_root: string;
  allowed_ports: number[];
  allowed_commands: string[];
  auth_required: boolean;
  tools_count: number;
}

export async function fetchServerInfo(): Promise<ServerInfo> {
  const res = await fetch("/api/info");
  return res.json();
}

export async function fetchActivity(): Promise<ActivityEventItem[]> {
  const res = await fetch("/api/activity");
  const data = await res.json();
  return data.events || [];
}

export async function clearActivity(): Promise<void> {
  await fetch("/api/activity/clear", { method: "POST" });
}

export async function fetchProjects(): Promise<{ activeRoot: string; projects: ProjectItem[] }> {
  const res = await fetch("/api/projects");
  return res.json();
}

export async function switchProject(
  nameOrPath: string,
  options?: { syncEditors?: boolean; targetEditor?: string }
): Promise<any> {
  const res = await fetch("/api/projects/switch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nameOrPath,
      syncEditors: options?.syncEditors,
      targetEditor: options?.targetEditor,
    }),
  });
  return res.json();
}

export async function updateProject(
  originalName: string,
  updates: Partial<ProjectItem>
): Promise<any> {
  const res = await fetch("/api/projects/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalName, ...updates }),
  });
  return res.json();
}

export async function deleteProject(name: string): Promise<any> {
  const res = await fetch("/api/projects/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function fetchEditorStatuses(): Promise<{
  editors: EditorStatusItem[];
  currentRoot: string;
}> {
  const res = await fetch("/api/editors/status");
  return res.json();
}

export async function syncEditors(
  projectNameOrPath?: string,
  targetEditor: string = "all"
): Promise<{
  success: boolean;
  project: ProjectItem;
  updated: string[];
  skipped: string[];
  failed: string[];
}> {
  const res = await fetch("/api/editors/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectNameOrPath, targetEditor }),
  });
  return res.json();
}

export async function createManualBackup(filepath: string): Promise<{
  success: boolean;
  backupPath: string;
  filename: string;
  error?: string;
}> {
  const res = await fetch("/api/backups/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filepath }),
  });
  return res.json();
}

export async function deleteBackup(filename: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch("/api/backups", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename }),
  });
  return res.json();
}

export async function fetchGitStatus(): Promise<{ success: boolean; output: string; metadata?: any }> {
  const res = await fetch("/api/git/status");
  return res.json();
}

export async function fetchGitDiff(file?: string, staged?: boolean): Promise<{ success: boolean; diff: string; file: string }> {
  const params = new URLSearchParams();
  if (file) params.append("file", file);
  if (staged) params.append("staged", "true");
  const res = await fetch(`/api/git/diff?${params.toString()}`);
  return res.json();
}

export async function runTerminalCommand(
  command: string,
  timeout_ms?: number,
  cwd?: string
): Promise<{ success: boolean; output: string; metadata?: any }> {
  const res = await fetch("/api/commands/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, timeout_ms, cwd }),
  });
  return res.json();
}

export async function fetchFilesTree(
  directory = ".",
  depth = 3
): Promise<{ success: boolean; files: string[]; directories: string[]; output: string }> {
  const res = await fetch(`/api/files/tree?directory=${encodeURIComponent(directory)}&depth=${depth}`);
  return res.json();
}

export async function readProjectFile(
  filepath: string,
  start_line?: number,
  end_line?: number
): Promise<{ success: boolean; content: string; metadata?: any }> {
  const params = new URLSearchParams({ filepath });
  if (start_line) params.append("start_line", String(start_line));
  if (end_line) params.append("end_line", String(end_line));
  const res = await fetch(`/api/files/read?${params.toString()}`);
  return res.json();
}

export async function saveProjectFile(
  filepath: string,
  content: string,
  create_if_missing = true
): Promise<{ success: boolean; output: string }> {
  const res = await fetch("/api/files/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filepath, content, create_if_missing }),
  });
  return res.json();
}

export async function searchProjectCode(
  query: string,
  options?: { directory?: string; case_sensitive?: boolean; is_regex?: boolean; file_pattern?: string }
): Promise<{ success: boolean; output: string; metadata?: any }> {
  const params = new URLSearchParams({ query });
  if (options?.directory) params.append("directory", options.directory);
  if (options?.case_sensitive) params.append("case_sensitive", "true");
  if (options?.is_regex) params.append("is_regex", "true");
  if (options?.file_pattern) params.append("file_pattern", options.file_pattern);
  const res = await fetch(`/api/search/code?${params.toString()}`);
  return res.json();
}

export async function addProject(project: {
  name: string;
  root: string;
  allowed_ports?: string;
  allowed_commands?: string;
}): Promise<any> {
  const res = await fetch("/api/projects/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  return res.json();
}

export async function fetchBackups(): Promise<BackupItem[]> {
  const res = await fetch("/api/backups");
  const data = await res.json();
  return data.backups || [];
}

export async function fetchBackupDiff(filename: string): Promise<{
  originalRel: string;
  currentExists: boolean;
  backupContent: string;
  currentContent: string;
}> {
  const res = await fetch(`/api/backups/diff?filename=${encodeURIComponent(filename)}`);
  return res.json();
}

export async function restoreBackup(filepath: string, backup_name?: string): Promise<{ success: boolean; result: string }> {
  const res = await fetch("/api/backups/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filepath, backup_name }),
  });
  return res.json();
}

export async function scanDevPorts(ports?: string): Promise<{ activeServers: PortScanServer[]; totalScanned: number }> {
  const url = ports ? `/api/ports/scan?ports=${encodeURIComponent(ports)}` : "/api/ports/scan";
  const res = await fetch(url);
  return res.json();
}

export async function fetchEditorConfigs(): Promise<Record<string, unknown>> {
  const res = await fetch("/api/config/editors");
  return res.json();
}

export async function fetchTools(): Promise<ToolItem[]> {
  const res = await fetch("/tools");
  const data = await res.json();
  return data.tools || [];
}

export async function callMcpTool(name: string, args: Record<string, unknown> = {}): Promise<{
  result: string;
  isError?: boolean;
  durationMs: number;
}> {
  const res = await fetch("/call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, arguments: args }),
  });
  return res.json();
}
