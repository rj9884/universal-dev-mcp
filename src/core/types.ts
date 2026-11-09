import { z } from "zod";

export interface ToolContext {
  projectRoot: string;
  allowedPorts: number[];
  allowedCommands: string[];
}

export interface ToolDefinition<TArgs extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  schema: TArgs;
  execute: (args: z.infer<z.ZodObject<TArgs>>, ctx?: ToolContext) => Promise<{
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
    metadata?: Record<string, unknown>;
  }>;
}

export interface ActivityEvent {
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

export interface ProjectEntry {
  name: string;
  root: string;
  allowed_ports: string;
  allowed_commands: string;
}
