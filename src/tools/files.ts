import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { getProjectRoot } from "../config.js";
import { isPathAllowed, allowedWriteDirsLabel } from "../utils/security.js";
import { backupFile, relativeBackupPath, getBackupDir } from "../utils/backup.js";
import { getFileTree, resolveProjectPath, toRelativePath } from "../utils/fs.js";
import { registerTool, UnifiedTool } from "../core/registry.js";
import { activityBus } from "../core/events.js";

const MAX_FILE_SIZE_BYTES = 1_000_000; // 1 MB

const readFileSchema = {
  filepath: z
    .string()
    .describe("Path to the file, relative to project root or absolute"),
  start_line: z
    .number()
    .optional()
    .describe("First line to return (1-based, inclusive)"),
  end_line: z
    .number()
    .optional()
    .describe("Last line to return (1-based, inclusive)"),
};

export const readFileTool: UnifiedTool<typeof readFileSchema> = {
  name: "read_file",
  description:
    "Read the contents of a file in the project. Optionally limit output to a range of lines. Use list_files first if you are unsure of the file path.",
  inputSchema: readFileSchema,
  openAiParameters: {
    type: "object",
    properties: {
      filepath: { type: "string", description: "Path to file" },
      start_line: { type: "number", description: "First line (1-based)" },
      end_line: { type: "number", description: "Last line (1-based)" },
    },
    required: ["filepath"],
  },
  handler: async ({ filepath, start_line, end_line }) => {
    const projectRoot = getProjectRoot();
    const resolved = resolveProjectPath(filepath);

    if (!isPathAllowed(resolved)) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Access denied. File must be within the project root: ${projectRoot}`,
          },
        ],
      };
    }

    if (!fs.existsSync(resolved)) {
      return {
        isError: true,
        content: [{ type: "text", text: `File not found: ${resolved}` }],
      };
    }

    const stat = fs.statSync(resolved);

    if (stat.isDirectory()) {
      return {
        isError: true,
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
        isError: true,
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
      metadata: { filepath, totalLines, sizeBytes: stat.size },
    };
  },
};

const editFileSchema = {
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
};

export const editFileTool: UnifiedTool<typeof editFileSchema> = {
  name: "edit_file",
  description:
    "Write new content to a file, replacing it entirely. A timestamped backup is automatically created in .mcp-backups/ before any change. Use patch_file instead when making a small targeted change.",
  inputSchema: editFileSchema,
  openAiParameters: {
    type: "object",
    properties: {
      filepath: { type: "string", description: "Path to file" },
      content: { type: "string", description: "Full content to write" },
      create_if_missing: { type: "boolean", description: "Create if missing" },
    },
    required: ["filepath", "content"],
  },
  handler: async ({ filepath, content, create_if_missing }) => {
    const resolved = resolveProjectPath(filepath);

    if (!isPathAllowed(resolved, true)) {
      return {
        isError: true,
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
        isError: true,
        content: [
          {
            type: "text",
            text: `File does not exist: ${resolved}\nSet create_if_missing to true to create it.`,
          },
        ],
      };
    }

    const backupPath = exists ? backupFile(resolved) : "";
    if (backupPath) {
      activityBus.emitActivity({
        type: "backup:created",
        toolName: "edit_file",
        arguments: { filepath },
        result: `Backup saved to ${relativeBackupPath(backupPath)}`,
        metadata: { backupPath, targetPath: resolved },
      });
    }

    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(resolved, content, "utf8");

    const lineCount = content.split("\n").length;
    const relPath = toRelativePath(resolved);

    const outputLines: string[] = [
      `Written: ${relPath}`,
      `Size:    ${lineCount} lines, ${content.length} bytes`,
    ];

    if (backupPath) {
      outputLines.push(`Backup:  ${relativeBackupPath(backupPath)}`);
      outputLines.push("");
      outputLines.push(`To restore: cp "${backupPath}" "${resolved}"`);
    }

    return {
      content: [{ type: "text", text: outputLines.join("\n") }],
      metadata: { filepath: relPath, backupPath, lineCount, sizeBytes: content.length },
    };
  },
};

const patchFileSchema = {
  filepath: z
    .string()
    .describe("Path to the file, relative to project root or absolute"),
  old_string: z
    .string()
    .describe(
      "The exact string to find and replace. Must be unique in the file — include extra surrounding lines if needed to make it unique."
    ),
  new_string: z.string().describe("The string to replace it with"),
};

export const patchFileTool: UnifiedTool<typeof patchFileSchema> = {
  name: "patch_file",
  description:
    "Replace a specific string or block of code within a file without rewriting the whole file. The old_string must appear exactly once in the file. A backup is created automatically before the change is applied.",
  inputSchema: patchFileSchema,
  openAiParameters: {
    type: "object",
    properties: {
      filepath: { type: "string", description: "Path to file" },
      old_string: { type: "string", description: "Exact string to replace" },
      new_string: { type: "string", description: "New replacement string" },
    },
    required: ["filepath", "old_string", "new_string"],
  },
  handler: async ({ filepath, old_string, new_string }) => {
    const resolved = resolveProjectPath(filepath);

    if (!isPathAllowed(resolved, true)) {
      return {
        isError: true,
        content: [{ type: "text", text: `Write access denied.` }],
      };
    }

    if (!fs.existsSync(resolved)) {
      return {
        isError: true,
        content: [{ type: "text", text: `File not found: ${resolved}` }],
      };
    }

    const original = fs.readFileSync(resolved, "utf8");
    const occurrences = original.split(old_string).length - 1;

    if (occurrences === 0) {
      return {
        isError: true,
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
        isError: true,
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
    activityBus.emitActivity({
      type: "backup:created",
      toolName: "patch_file",
      arguments: { filepath },
      result: `Backup saved to ${relativeBackupPath(backupPath)}`,
      metadata: { backupPath, targetPath: resolved },
    });

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
      metadata: { filepath: toRelativePath(resolved), backupPath },
    };
  },
};

const listFilesSchema = {
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
};

export const listFilesTool: UnifiedTool<typeof listFilesSchema> = {
  name: "list_files",
  description:
    "List the files and directories in the project as a tree. Use this to understand project structure before reading or editing files.",
  inputSchema: listFilesSchema,
  openAiParameters: {
    type: "object",
    properties: {
      directory: { type: "string", description: "Subdirectory to list" },
      depth: { type: "number", description: "Depth (1-5)" },
    },
  },
  handler: async ({ directory, depth }) => {
    const projectRoot = getProjectRoot();
    const target = path.join(projectRoot, directory || "");

    if (!isPathAllowed(target)) {
      return {
        isError: true,
        content: [{ type: "text", text: `Access denied.` }],
      };
    }

    if (!fs.existsSync(target)) {
      return {
        isError: true,
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
            `Root:      ${projectRoot}`,
            "",
            tree || "(empty)",
          ].join("\n"),
        },
      ],
      metadata: { directory: label, depth: maxDepth },
    };
  },
};

const deleteFileSchema = {
  filepath: z
    .string()
    .describe("Path to the file, relative to project root or absolute"),
};

export const deleteFileTool: UnifiedTool<typeof deleteFileSchema> = {
  name: "delete_file",
  description:
    "Delete a file from the project. A backup is automatically created in .mcp-backups/ before deletion. Cannot delete directories.",
  inputSchema: deleteFileSchema,
  openAiParameters: {
    type: "object",
    properties: {
      filepath: { type: "string", description: "Path to file" },
    },
    required: ["filepath"],
  },
  handler: async ({ filepath }) => {
    const resolved = resolveProjectPath(filepath);

    if (!isPathAllowed(resolved, true)) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Write access denied. Allowed write directories: ${allowedWriteDirsLabel()}`,
          },
        ],
      };
    }

    if (!fs.existsSync(resolved)) {
      return {
        isError: true,
        content: [{ type: "text", text: `File not found: ${resolved}` }],
      };
    }

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Cannot delete a directory. Use this tool on individual files only.`,
          },
        ],
      };
    }

    const backupPath = backupFile(resolved);
    activityBus.emitActivity({
      type: "backup:created",
      toolName: "delete_file",
      arguments: { filepath },
      result: `Backup saved to ${relativeBackupPath(backupPath)}`,
      metadata: { backupPath, targetPath: resolved },
    });

    fs.unlinkSync(resolved);

    return {
      content: [
        {
          type: "text",
          text: [
            `Deleted: ${toRelativePath(resolved)}`,
            `Backup:  ${relativeBackupPath(backupPath)}`,
            "",
            `To restore: cp "${backupPath}" "${resolved}"`,
          ].join("\n"),
        },
      ],
      metadata: { filepath: toRelativePath(resolved), backupPath },
    };
  },
};

const moveFileSchema = {
  source: z
    .string()
    .describe("Current file path, relative to project root or absolute"),
  destination: z
    .string()
    .describe("Target file path, relative to project root or absolute"),
  overwrite: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Overwrite the destination if it already exists (default: false)"
    ),
};

export const moveFileTool: UnifiedTool<typeof moveFileSchema> = {
  name: "move_file",
  description:
    "Move or rename a file within the project. A backup of the original is created before the move. Cannot move directories.",
  inputSchema: moveFileSchema,
  openAiParameters: {
    type: "object",
    properties: {
      source: { type: "string", description: "Source file path" },
      destination: { type: "string", description: "Destination file path" },
      overwrite: { type: "boolean", description: "Overwrite destination" },
    },
    required: ["source", "destination"],
  },
  handler: async ({ source, destination, overwrite }) => {
    const resolvedSrc = resolveProjectPath(source);
    const resolvedDst = resolveProjectPath(destination);

    if (
      !isPathAllowed(resolvedSrc, true) ||
      !isPathAllowed(resolvedDst, true)
    ) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Write access denied. Both source and destination must be within allowed write directories.`,
          },
        ],
      };
    }

    if (!fs.existsSync(resolvedSrc)) {
      return {
        isError: true,
        content: [
          { type: "text", text: `Source file not found: ${resolvedSrc}` },
        ],
      };
    }

    const srcStat = fs.statSync(resolvedSrc);
    if (srcStat.isDirectory()) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Cannot move a directory. Use this tool on individual files only.`,
          },
        ],
      };
    }

    if (fs.existsSync(resolvedDst) && !overwrite) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Destination already exists: ${toRelativePath(resolvedDst)}\nSet overwrite: true to replace it.`,
          },
        ],
      };
    }

    const backupPath = backupFile(resolvedSrc);
    const dstDir = path.dirname(resolvedDst);
    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir, { recursive: true });
    }

    fs.renameSync(resolvedSrc, resolvedDst);

    return {
      content: [
        {
          type: "text",
          text: [
            `Moved:  ${toRelativePath(resolvedSrc)}`,
            `    →   ${toRelativePath(resolvedDst)}`,
            `Backup: ${relativeBackupPath(backupPath)}`,
          ].join("\n"),
        },
      ],
      metadata: {
        source: toRelativePath(resolvedSrc),
        destination: toRelativePath(resolvedDst),
        backupPath,
      },
    };
  },
};

const restoreBackupSchema = {
  filepath: z
    .string()
    .describe("Target file path to restore"),
  backup_name_or_path: z
    .string()
    .optional()
    .describe("Specific backup filename (e.g. from .mcp-backups) or empty to restore the latest backup for this file"),
};

export const restoreBackupTool: UnifiedTool<typeof restoreBackupSchema> = {
  name: "restore_backup",
  description:
    "Restore a file from its automated backup in .mcp-backups. If backup_name_or_path is omitted, restores the latest backup available for that file.",
  inputSchema: restoreBackupSchema,
  openAiParameters: {
    type: "object",
    properties: {
      filepath: { type: "string", description: "File path to restore" },
      backup_name_or_path: { type: "string", description: "Backup filename or latest if omitted" },
    },
    required: ["filepath"],
  },
  handler: async ({ filepath, backup_name_or_path }) => {
    const projectRoot = getProjectRoot();
    const resolvedTarget = resolveProjectPath(filepath);

    if (!isPathAllowed(resolvedTarget, true)) {
      return {
        isError: true,
        content: [{ type: "text", text: `Write access denied for ${resolvedTarget}` }],
      };
    }

    const backupDir = getBackupDir();
    if (!fs.existsSync(backupDir)) {
      return {
        isError: true,
        content: [{ type: "text", text: `No backups directory found.` }],
      };
    }

    let backupFileToRestore: string | null = null;

    if (backup_name_or_path) {
      const direct = path.isAbsolute(backup_name_or_path)
        ? backup_name_or_path
        : path.join(backupDir, path.basename(backup_name_or_path));
      if (fs.existsSync(direct)) {
        backupFileToRestore = direct;
      }
    } else {
      // Find latest backup matching prefix
      const relPath = path.relative(projectRoot, resolvedTarget).replace(/[\\/]/g, "__");
      const files = fs.readdirSync(backupDir).filter((f) => f.startsWith(relPath) && f.endsWith(".bak"));
      if (files.length > 0) {
        // Sort by mtime descending
        files.sort((a, b) => {
          return fs.statSync(path.join(backupDir, b)).mtimeMs - fs.statSync(path.join(backupDir, a)).mtimeMs;
        });
        backupFileToRestore = path.join(backupDir, files[0]);
      }
    }

    if (!backupFileToRestore || !fs.existsSync(backupFileToRestore)) {
      return {
        isError: true,
        content: [{ type: "text", text: `No matching backup found to restore for: ${filepath}` }],
      };
    }

    // Create a safety backup of current version if it exists
    if (fs.existsSync(resolvedTarget)) {
      backupFile(resolvedTarget);
    } else {
      const dir = path.dirname(resolvedTarget);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    fs.copyFileSync(backupFileToRestore, resolvedTarget);

    return {
      content: [
        {
          type: "text",
          text: [
            `Successfully restored: ${toRelativePath(resolvedTarget)}`,
            `Restored from:         ${relativeBackupPath(backupFileToRestore)}`,
          ].join("\n"),
        },
      ],
      metadata: {
        restoredFile: toRelativePath(resolvedTarget),
        fromBackup: backupFileToRestore,
      },
    };
  },
};

export function registerFileTools(server?: McpServer): void {
  registerTool(readFileTool);
  registerTool(editFileTool);
  registerTool(patchFileTool);
  registerTool(listFilesTool);
  registerTool(deleteFileTool);
  registerTool(moveFileTool);
  registerTool(restoreBackupTool);

  if (server) {
    const tools = [
      readFileTool,
      editFileTool,
      patchFileTool,
      listFilesTool,
      deleteFileTool,
      moveFileTool,
      restoreBackupTool,
    ];
    for (const tool of tools) {
      server.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        tool.handler
      );
    }
  }
}
