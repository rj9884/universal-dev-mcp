import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { PROJECT_ROOT } from "../config.js";
import { isPathAllowed, allowedWriteDirsLabel } from "../utils/security.js";
import { backupFile, relativeBackupPath } from "../utils/backup.js";
import { getFileTree, resolveProjectPath, toRelativePath } from "../utils/fs.js";

const MAX_FILE_SIZE_BYTES = 1_000_000; // 1 MB

export function registerFileTools(server: McpServer): void {
   server.registerTool(
    "read_file",
    {
    description: "Read the contents of a file in the project. Optionally limit output to a range of lines. Use list_files first if you are unsure of the file path.",
    inputSchema: {
      filepath: z
        .string()
        .describe(
          "Path to the file, relative to project root or absolute"
        ),
      start_line: z
        .number()
        .optional()
        .describe("First line to return (1-based, inclusive)"),
      end_line: z
        .number()
        .optional()
        .describe("Last line to return (1-based, inclusive)"),
    },
    },
    async ({ filepath, start_line, end_line }) => {
      const resolved = resolveProjectPath(filepath);

      if (!isPathAllowed(resolved)) {
        return {
          content: [
            {
              type: "text",
              text: `Access denied. File must be within the project root: ${PROJECT_ROOT}`,
            },
          ],
        };
      }

      if (!fs.existsSync(resolved)) {
        return {
          content: [{ type: "text", text: `File not found: ${resolved}` }],
        };
      }

      const stat = fs.statSync(resolved);

      if (stat.isDirectory()) {
        return {
          content: [
            {
              type: "text",
              text: `The path points to a directory, not a file. Use list_files to explore directories.`,
            },
          ],
        };
      }

      if (stat.size > MAX_FILE_SIZE_BYTES) {
        return {
          content: [
            {
              type: "text",
              text: `File is too large to read (${(stat.size / 1024).toFixed(1)} KB). Maximum allowed size is 1 MB.`,
            },
          ],
        };
      }

      const content = fs.readFileSync(resolved, "utf8");
      const lines = content.split("\n");
      const totalLines = lines.length;

      const from = start_line ? Math.max(1, start_line) - 1 : 0;
      const to = end_line ? Math.min(totalLines, end_line) : totalLines;
      const selectedLines = lines.slice(from, to);

      const ext = path.extname(resolved).slice(1) || "text";
      const rangeNote =
        start_line || end_line
          ? ` — lines ${from + 1} to ${to} of ${totalLines}`
          : ` — ${totalLines} lines`;

      return {
        content: [
          {
            type: "text",
            text: [
              `File: ${toRelativePath(resolved)}${rangeNote}`,
              "",
              "```" + ext,
              selectedLines.join("\n"),
              "```",
            ].join("\n"),
          },
        ],
      };
    }
  );

   server.registerTool(
    "edit_file",
    {
    description: "Write new content to a file, replacing it entirely. A timestamped backup is automatically created in .mcp-backups/ before any change. Use patch_file instead when making a small targeted change.",
    inputSchema: {
      filepath: z
        .string()
        .describe("Path to the file, relative to project root or absolute"),
      content: z
        .string()
        .describe("The complete new content to write to the file"),
      create_if_missing: z
        .boolean()
        .optional()
        .default(false)
        .describe("Create the file if it does not exist yet"),
    },
    },
    async ({ filepath, content, create_if_missing }) => {
      const resolved = resolveProjectPath(filepath);

      if (!isPathAllowed(resolved, true)) {
        return {
          content: [
            {
              type: "text",
              text: `Write access denied. Allowed write directories: ${allowedWriteDirsLabel()}`,
            },
          ],
        };
      }

      const exists = fs.existsSync(resolved);

      if (!exists && !create_if_missing) {
        return {
          content: [
            {
              type: "text",
              text: `File does not exist: ${resolved}\nSet create_if_missing to true to create it.`,
            },
          ],
        };
      }

      const backupPath = exists ? backupFile(resolved) : "";

      const dir = path.dirname(resolved);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(resolved, content, "utf8");

      const lineCount = content.split("\n").length;
      const relPath = toRelativePath(resolved);

      const lines: string[] = [
        `Written: ${relPath}`,
        `Size:    ${lineCount} lines, ${content.length} bytes`,
      ];

      if (backupPath) {
        lines.push(`Backup:  ${relativeBackupPath(backupPath)}`);
        lines.push("");
        lines.push(
          `To restore: cp "${backupPath}" "${resolved}"`
        );
      }

      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );

    server.registerTool(
    "patch_file",
    {
    description: "Replace a specific string or block of code within a file without rewriting the whole file. The old_string must appear exactly once in the file. A backup is created automatically before the change is applied.",
    inputSchema: {
      filepath: z
        .string()
        .describe("Path to the file, relative to project root or absolute"),
      old_string: z
        .string()
        .describe(
          "The exact string to find and replace. Must be unique in the file — include extra surrounding lines if needed to make it unique."
        ),
      new_string: z
        .string()
        .describe("The string to replace it with"),
    },
    },
    async ({ filepath, old_string, new_string }) => {
      const resolved = resolveProjectPath(filepath);

      if (!isPathAllowed(resolved, true)) {
        return {
          content: [{ type: "text", text: `Write access denied.` }],
        };
      }

      if (!fs.existsSync(resolved)) {
        return {
          content: [{ type: "text", text: `File not found: ${resolved}` }],
        };
      }

      const original = fs.readFileSync(resolved, "utf8");
      const occurrences = original.split(old_string).length - 1;

      if (occurrences === 0) {
        return {
          content: [
            {
              type: "text",
              text: [
                `String not found in file.`,
                `Check that old_string matches the file content exactly, including whitespace and indentation.`,
              ].join("\n"),
            },
          ],
        };
      }

      if (occurrences > 1) {
        return {
          content: [
            {
              type: "text",
              text: [
                `Found ${occurrences} occurrences of old_string. It must be unique.`,
                `Extend old_string to include more surrounding context so it matches only once.`,
              ].join("\n"),
            },
          ],
        };
      }

      const backupPath = backupFile(resolved);
      const updated = original.replace(old_string, new_string);
      fs.writeFileSync(resolved, updated, "utf8");

      return {
        content: [
          {
            type: "text",
            text: [
              `Patch applied: ${toRelativePath(resolved)}`,
              `Backup:        ${relativeBackupPath(backupPath)}`,
            ].join("\n"),
          },
        ],
      };
    }
  );

   server.registerTool(
    "list_files",
    {
    description: "List the files and directories in the project as a tree. Use this to understand project structure before reading or editing files.",
    inputSchema: {
      directory: z
        .string()
        .optional()
        .default("")
        .describe(
          "Subdirectory to list, relative to the project root. Leave empty to list from the project root."
        ),
      depth: z
        .number()
        .optional()
        .default(3)
        .describe("How many levels deep to show (1–5, default 3)"),
    },
    },
    async ({ directory, depth }) => {
      const target = path.join(PROJECT_ROOT, directory);

      if (!isPathAllowed(target)) {
        return {
          content: [{ type: "text", text: `Access denied.` }],
        };
      }

      if (!fs.existsSync(target)) {
        return {
          content: [{ type: "text", text: `Directory not found: ${target}` }],
        };
      }

      const maxDepth = Math.min(Math.max(depth, 1), 5);
      const tree = getFileTree(target, 0, maxDepth);
      const label = directory || "(project root)";

      return {
        content: [
          {
            type: "text",
            text: [
              `Directory: ${label}`,
              `Root:      ${PROJECT_ROOT}`,
              "",
              tree || "(empty)",
            ].join("\n"),
          },
        ],
      };
    }
  );
}