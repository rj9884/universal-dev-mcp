import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { spawn } from "child_process";
import { getProjectRoot } from "../config.js";
import {
  isCommandAllowed,
  allowedCommandsLabel,
  hasShellInjectionRisk,
  resolveAllowedCwd,
} from "../utils/security.js";
import { registerTool, UnifiedTool } from "../core/registry.js";

const MAX_OUTPUT_BYTES = 1024 * 1024; // 1 MB total output cap

const runCommandSchema = {
  command: z
    .string()
    .describe(
      "The command to run. Must exactly match or start with one of the allowed commands."
    ),
  cwd: z
    .string()
    .optional()
    .describe(
      "Directory to run the command in, relative to the project root (e.g. 'frontend' or 'backend'). Must resolve inside the project root. Defaults to the project root."
    ),
  timeout_ms: z
    .number()
    .optional()
    .default(30000)
    .describe(
      "Maximum execution time in milliseconds before the process is killed (default: 30000)"
    ),
};

export const runCommandTool: UnifiedTool<typeof runCommandSchema> = {
  name: "run_command",
  description:
    "Run an allowlisted shell command in the project root directory (or a subdirectory via `cwd`, useful for monorepos like frontend/ + backend/). Useful for installing dependencies, running tests, linting, type-checking, and builds. Only commands explicitly listed in ALLOWED_COMMANDS may be executed.",
  inputSchema: runCommandSchema,
  openAiParameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "Command to execute" },
      cwd: { type: "string", description: "Optional working directory" },
      timeout_ms: { type: "number", description: "Timeout in ms" },
    },
    required: ["command"],
  },
  handler: async ({ command, cwd, timeout_ms }) => {
    const projectRoot = getProjectRoot();
    const timeout = timeout_ms || 30000;

    if (!isCommandAllowed(command)) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: [
              `Command not allowed: "${command}"`,
              "",
              "Allowed commands:",
              allowedCommandsLabel(),
              "",
              "To permit additional commands, update ALLOWED_COMMANDS in your .env file or project configuration.",
            ].join("\n"),
          },
        ],
      };
    }

    if (hasShellInjectionRisk(command)) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: [
              `Command rejected: "${command}"`,
              "",
              "Contains shell metacharacters (; & | ` $( < >) that could chain or inject additional commands.",
              "Run one command per call instead of chaining with && or ;.",
            ].join("\n"),
          },
        ],
      };
    }

    const resolvedCwd = resolveAllowedCwd(cwd);
    if (resolvedCwd === null) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `cwd "${cwd}" resolves outside the project root (${projectRoot}). Refusing to run.`,
          },
        ],
      };
    }

    const startTime = Date.now();

    return new Promise((resolve) => {
      const [program, ...args] = command.split(/\s+/);

      const child = spawn(program, args, {
        cwd: resolvedCwd,
        shell: true,
        env: process.env,
      });

      let stdout = "";
      let stderr = "";
      let totalBytes = 0;
      let truncated = false;
      let killed = false;

      const timer = setTimeout(() => {
        killed = true;
        child.kill("SIGTERM");
      }, timeout);

      child.stdout.on("data", (chunk: Buffer) => {
        if (totalBytes < MAX_OUTPUT_BYTES) {
          const str = chunk.toString("utf8");
          stdout += str;
          totalBytes += str.length;
        } else {
          truncated = true;
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        if (totalBytes < MAX_OUTPUT_BYTES) {
          const str = chunk.toString("utf8");
          stderr += str;
          totalBytes += str.length;
        } else {
          truncated = true;
        }
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        const duration = Date.now() - startTime;
        const isSuccess = code === 0 && !killed;

        const lines: string[] = [
          `Command:  ${command}`,
          `Cwd:      ${resolvedCwd}`,
          `Duration: ${duration}ms`,
          killed
            ? `Exit:     killed (timeout after ${timeout}ms)`
            : `Exit:     ${code ?? "?"} (${isSuccess ? "success" : "failure"})`,
        ];

        if (truncated) {
          lines.push(`[Output truncated at ${MAX_OUTPUT_BYTES / 1024}KB]`);
        }

        if (stdout.trim()) {
          lines.push("", "stdout:", stdout.trimEnd().slice(0, 5000));
        }

        if (stderr.trim()) {
          lines.push("", "stderr:", stderr.trimEnd().slice(0, 2000));
        }

        resolve({
          isError: !isSuccess,
          content: [{ type: "text", text: lines.join("\n") }],
          metadata: {
            command,
            cwd: resolvedCwd,
            exitCode: code,
            killed,
            durationMs: duration,
            stdoutLength: stdout.length,
            stderrLength: stderr.length,
          },
        });
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        const duration = Date.now() - startTime;
        resolve({
          isError: true,
          content: [
            {
              type: "text",
              text: [
                `Command:  ${command}`,
                `Cwd:      ${resolvedCwd}`,
                `Duration: ${duration}ms`,
                `Exit:     error`,
                `Error:    ${err.message}`,
              ].join("\n"),
            },
          ],
          metadata: { command, error: err.message },
        });
      });
    });
  },
};

export function registerCommandTools(server?: McpServer): void {
  registerTool(runCommandTool);

  if (server) {
    server.registerTool(
      runCommandTool.name,
      {
        description: runCommandTool.description,
        inputSchema: runCommandTool.inputSchema,
      },
      runCommandTool.handler
    );
  }
}
