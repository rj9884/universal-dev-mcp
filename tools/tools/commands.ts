import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { PROJECT_ROOT } from "../config.js";
import {
  isCommandAllowed,
  allowedCommandsLabel,
} from "../utils/security.js";

const execAsync = promisify(exec);

export function registerCommandTools(server: McpServer): void {
  server.tool(
    "run_command",
    "Run an allowlisted shell command in the project root directory. Useful for running tests, linting, type-checking, and builds. Only commands explicitly listed in ALLOWED_COMMANDS may be executed.",
    {
      command: z
        .string()
        .describe(
          "The command to run. Must exactly match or start with one of the allowed commands."
        ),
      timeout_ms: z
        .number()
        .optional()
        .default(30000)
        .describe(
          "Maximum execution time in milliseconds before the process is killed (default: 30000)"
        ),
    },
    async ({ command, timeout_ms }) => {
      if (!isCommandAllowed(command)) {
        return {
          content: [
            {
              type: "text",
              text: [
                `Command not allowed: "${command}"`,
                "",
                "Allowed commands:",
                allowedCommandsLabel(),
                "",
                "To permit additional commands, update ALLOWED_COMMANDS in your .env file.",
              ].join("\n"),
            },
          ],
        };
      }

      const startTime = Date.now();

      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: PROJECT_ROOT,
          timeout: timeout_ms,
          maxBuffer: 1024 * 1024,
        });

        const duration = Date.now() - startTime;

        const lines: string[] = [
          `Command:  ${command}`,
          `Duration: ${duration}ms`,
          `Exit:     0 (success)`,
        ];

        if (stdout.trim()) {
          lines.push("", "stdout:", stdout.trimEnd().slice(0, 5000));
        }

        if (stderr.trim()) {
          lines.push("", "stderr:", stderr.trimEnd().slice(0, 2000));
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (err: unknown) {
        const duration = Date.now() - startTime;
        const e = err as {
          message?: string;
          stdout?: string;
          stderr?: string;
          killed?: boolean;
          code?: number;
        };

        const lines: string[] = [
          `Command:  ${command}`,
          `Duration: ${duration}ms`,
          e.killed
            ? `Exit:     killed (timeout after ${timeout_ms}ms)`
            : `Exit:     ${e.code ?? "non-zero"} (failure)`,
          `Error:    ${e.message}`,
        ];

        if (e.stdout?.trim()) {
          lines.push("", "stdout:", e.stdout.trimEnd().slice(0, 3000));
        }

        if (e.stderr?.trim()) {
          lines.push("", "stderr:", e.stderr.trimEnd().slice(0, 3000));
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }
    }
  );
}