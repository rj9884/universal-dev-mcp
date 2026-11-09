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

export async function switchProject(nameOrPath: string): Promise<any> {
  const res = await fetch("/api/projects/switch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nameOrPath }),
  });
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
