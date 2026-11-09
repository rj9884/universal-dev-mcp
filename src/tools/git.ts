import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as childProcess from "child_process";
import { getProjectRoot } from "../config.js";
import { registerTool, UnifiedTool } from "../core/registry.js";

const gitStatusSchema = {};

export const getGitStatusTool: UnifiedTool<typeof gitStatusSchema> = {
  name: "get_git_status",
  description:
    "Get detailed structured Git repository status: current branch, tracking status (ahead/behind), staged changes, unstaged changes, untracked files, and recent 5 commits.",
  inputSchema: gitStatusSchema,
  openAiParameters: {
    type: "object",
    properties: {},
  },
  handler: async () => {
    const projectRoot = getProjectRoot();

    try {
      childProcess.execSync("git rev-parse --is-inside-work-tree", {
        cwd: projectRoot,
        timeout: 3000,
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {
      return {
        isError: false,
        content: [{ type: "text", text: `Directory is not a git repository: ${projectRoot}` }],
        metadata: { isGitRepo: false },
      };
    }

    try {
      const statusOutput = childProcess
        .execSync("git status --porcelain=v1 -b", {
          cwd: projectRoot,
          timeout: 4000,
          stdio: ["ignore", "pipe", "ignore"],
        })
        .toString("utf8");

      const lines = statusOutput.split("\n").filter((l) => l.trim().length > 0);
      const branchLine = lines[0] || "";
      const fileLines = lines.slice(1);

      const staged: string[] = [];
      const modified: string[] = [];
      const untracked: string[] = [];

      for (const line of fileLines) {
        const x = line[0];
        const y = line[1];
        const filename = line.slice(3).trim();

        if (x === "?" && y === "?") {
          untracked.push(filename);
        } else {
          if (x !== " " && x !== "?") {
            staged.push(`${x} ${filename}`);
          }
          if (y !== " " && y !== "?") {
            modified.push(`${y} ${filename}`);
          }
        }
      }

      let recentCommits: string[] = [];
      try {
        const logOutput = childProcess
          .execSync("git log -5 --oneline", {
            cwd: projectRoot,
            timeout: 3000,
            stdio: ["ignore", "pipe", "ignore"],
          })
          .toString("utf8");
        recentCommits = logOutput.split("\n").filter(Boolean);
      } catch {
        /* no commits yet */
      }

      const out = [
        `Git Repository Status`,
        `Root: ${projectRoot}`,
        `Branch info: ${branchLine.replace(/^##\s*/, "")}`,
        "",
        `Staged files (${staged.length}):`,
        staged.length ? staged.map((f) => `  + ${f}`).join("\n") : "  (none)",
        "",
        `Unstaged modifications (${modified.length}):`,
        modified.length ? modified.map((f) => `  * ${f}`).join("\n") : "  (none)",
        "",
        `Untracked files (${untracked.length}):`,
        untracked.length ? untracked.map((f) => `  ? ${f}`).join("\n") : "  (none)",
        "",
        `Recent commits:`,
        recentCommits.length ? recentCommits.map((c) => `  ${c}`).join("\n") : "  (none)",
      ];

      return {
        content: [{ type: "text", text: out.join("\n") }],
        metadata: {
          isGitRepo: true,
          branchInfo: branchLine,
          stagedCount: staged.length,
          modifiedCount: modified.length,
          untrackedCount: untracked.length,
          recentCommits,
        },
      };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: "text", text: `Git status failed: ${(e as Error).message}` }],
      };
    }
  },
};

const gitDiffSchema = {
  staged: z
    .boolean()
    .optional()
    .default(false)
    .describe("View staged diff (--staged) instead of unstaged diff"),
  filepath: z
    .string()
    .optional()
    .describe("Optional specific filepath to diff"),
};

export const getGitDiffTool: UnifiedTool<typeof gitDiffSchema> = {
  name: "get_git_diff",
  description: "View git diff for working tree or staged changes, optionally for a specific file.",
  inputSchema: gitDiffSchema,
  openAiParameters: {
    type: "object",
    properties: {
      staged: { type: "boolean", description: "View staged diff" },
      filepath: { type: "string", description: "Optional specific file" },
    },
  },
  handler: async ({ staged, filepath }) => {
    const projectRoot = getProjectRoot();
    const args = ["diff"];
    if (staged) args.push("--staged");
    if (filepath) args.push("--", filepath);

    try {
      const output = childProcess
        .execSync(`git ${args.join(" ")}`, {
          cwd: projectRoot,
          timeout: 8000,
          maxBuffer: 1024 * 1024,
        })
        .toString("utf8");

      if (!output.trim()) {
        return {
          content: [
            {
              type: "text",
              text: `No ${staged ? "staged" : "unstaged"} git changes${filepath ? ` for ${filepath}` : ""}.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: [
              `Git diff (${staged ? "staged" : "unstaged"}${filepath ? ` - ${filepath}` : ""}):`,
              "```diff",
              output.slice(0, 15000),
              "```",
            ].join("\n"),
          },
        ],
        metadata: { staged: Boolean(staged), filepath, length: output.length },
      };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: "text", text: `Git diff failed: ${(e as Error).message}` }],
      };
    }
  },
};

export function registerGitTools(server?: McpServer): void {
  registerTool(getGitStatusTool);
  registerTool(getGitDiffTool);

  if (server) {
    server.registerTool(
      getGitStatusTool.name,
      { description: getGitStatusTool.description, inputSchema: getGitStatusTool.inputSchema },
      getGitStatusTool.handler
    );
    server.registerTool(
      getGitDiffTool.name,
      { description: getGitDiffTool.description, inputSchema: getGitDiffTool.inputSchema },
      getGitDiffTool.handler
    );
  }
}
