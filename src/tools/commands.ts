import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { spawn } from "child_process";
import { PROJECT_ROOT } from "../config.js";
import { isCommandAllowed, allowedCommandsLabel } from "../utils/security.js";

const MAX_OUTPUT_BYTES = 1024 * 1024; // 1 MB total output cap

export function registerCommandTools(server: McpServer): void {
  server.registerTool(
    "run_command",
    {
      description:
        "Run an allowlisted shell command in the project root directory. Useful for running tests, linting, type-checking, and builds. Only commands explicitly listed in ALLOWED_COMMANDS may be executed.",
      inputSchema: {
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

      return new Promise((resolve) => {
        // Use spawn (streaming) instead of exec (buffered) to handle large output
        const [program, ...args] = command.split(/\s+/);

        const child = spawn(program, args, {
          cwd: PROJECT_ROOT,
          shell: true, // needed for npm scripts on Windows
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
        }, timeout_ms);

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

          const lines: string[] = [
            `Command:  ${command}`,
            `Duration: ${duration}ms`,
            killed
              ? `Exit:     killed (timeout after ${timeout_ms}ms)`
              : `Exit:     ${code ?? "?"} (${code === 0 ? "success" : "failure"})`,
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

          resolve({ content: [{ type: "text", text: lines.join("\n") }] });
        });

        child.on("error", (err) => {
          clearTimeout(timer);
          const duration = Date.now() - startTime;
          resolve({
            content: [
              {
                type: "text",
                text: [
                  `Command:  ${command}`,
                  `Duration: ${duration}ms`,
                  `Exit:     error`,
                  `Error:    ${err.message}`,
                ].join("\n"),
              },
            ],
          });
        });
      });
    }
  );
}
