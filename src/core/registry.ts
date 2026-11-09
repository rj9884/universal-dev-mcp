import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { activityBus } from "./events.js";

export interface UnifiedTool<TArgs extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  inputSchema: TArgs;
  openAiParameters?: Record<string, unknown>;
  handler: (args: z.infer<z.ZodObject<TArgs>>) => Promise<{
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
    metadata?: Record<string, unknown>;
  }>;
}

const toolRegistry = new Map<string, UnifiedTool>();

export function registerTool<TArgs extends z.ZodRawShape>(tool: UnifiedTool<TArgs>): void {
  toolRegistry.set(tool.name, tool as unknown as UnifiedTool);
}

export function getTool(name: string): UnifiedTool | undefined {
  return toolRegistry.get(name);
}

export function getAllTools(): UnifiedTool[] {
  return Array.from(toolRegistry.values());
}

export async function executeTool(
  name: string,
  rawArgs: Record<string, unknown> = {}
): Promise<{
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  durationMs: number;
}> {
  const tool = toolRegistry.get(name);
  if (!tool) {
    const errorMsg = `Unknown tool: "${name}"`;
    activityBus.emitActivity({
      type: "tool:error",
      toolName: name,
      arguments: rawArgs,
      error: errorMsg,
      durationMs: 0,
    });
    return {
      content: [{ type: "text", text: errorMsg }],
      isError: true,
      durationMs: 0,
    };
  }

  const startTime = Date.now();
  activityBus.emitActivity({
    type: "tool:start",
    toolName: name,
    arguments: rawArgs,
  });

  try {
    // Validate with Zod schema if available
    const schema = z.object(tool.inputSchema);
    const parsedArgs = schema.parse(rawArgs);

    const result = await tool.handler(parsedArgs);
    const durationMs = Date.now() - startTime;

    const outputText = result.content.map((c) => c.text).join("\n");

    if (result.isError) {
      activityBus.emitActivity({
        type: "tool:error",
        toolName: name,
        arguments: rawArgs,
        error: outputText,
        durationMs,
        metadata: result.metadata,
      });
    } else {
      activityBus.emitActivity({
        type: "tool:complete",
        toolName: name,
        arguments: rawArgs,
        result: outputText.slice(0, 5000),
        durationMs,
        metadata: result.metadata,
      });
    }

    return {
      ...result,
      durationMs,
    };
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : String(err);

    activityBus.emitActivity({
      type: "tool:error",
      toolName: name,
      arguments: rawArgs,
      error: message,
      durationMs,
    });

    return {
      content: [{ type: "text", text: `Tool error (${name}): ${message}` }],
      isError: true,
      durationMs,
    };
  }
}

export function registerAllToolsWithMcp(server: McpServer): void {
  for (const tool of toolRegistry.values()) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args: Record<string, unknown>) => {
        const result = await executeTool(tool.name, args);
        return {
          content: result.content,
          isError: result.isError,
        };
      }
    );
  }
}

export function getOpenAiToolDefinitions(): Array<{
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}> {
  return Array.from(toolRegistry.values()).map((tool) => {
    return {
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.openAiParameters || {
          type: "object",
          properties: {},
        },
      },
    };
  });
}
