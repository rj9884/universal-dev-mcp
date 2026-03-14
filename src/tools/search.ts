import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { PROJECT_ROOT } from "../config.js";
import { isPathAllowed } from "../utils/security.js";

const MAX_RESULTS = 100;
const MAX_FILE_SIZE_BYTES = 1_000_000;

function* walkFiles(dir: string, fileFilter: RegExp | null): Generator<string> {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    // Skip hidden dirs and node_modules
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath, fileFilter);
    } else if (entry.isFile()) {
      if (!fileFilter || fileFilter.test(entry.name)) yield fullPath;
    }
  }
}

export function registerSearchTools(server: McpServer): void {
  server.registerTool(
    "search_files",
    {
      description:
        "Search for a text string or regex pattern across all files in the project. Returns matching file paths, line numbers, and the matching lines. Optionally filter by file name glob (e.g. '*.ts'). Skips node_modules, hidden directories, and binary files.",
      inputSchema: {
        query: z
          .string()
          .describe("The text or regular expression to search for"),
        file_pattern: z
          .string()
          .optional()
          .describe(
            "Optional filename filter, e.g. '*.ts' or '*.json'. Matches against the filename only, not the full path."
          ),
        case_sensitive: z
          .boolean()
          .optional()
          .default(false)
          .describe("Whether the search is case-sensitive (default: false)"),
        directory: z
          .string()
          .optional()
          .default("")
          .describe(
            "Subdirectory to search in, relative to project root. Leave empty to search the whole project."
          ),
        is_regex: z
          .boolean()
          .optional()
          .default(false)
          .describe("Treat query as a regular expression (default: false)"),
      },
    },
    async ({ query, file_pattern, case_sensitive, directory, is_regex }) => {
      const searchRoot = path.join(PROJECT_ROOT, directory || "");

      if (!isPathAllowed(searchRoot)) {
        return {
          content: [{ type: "text", text: `Access denied: ${searchRoot}` }],
        };
      }

      if (!fs.existsSync(searchRoot)) {
        return {
          content: [{ type: "text", text: `Directory not found: ${searchRoot}` }],
        };
      }

      let searchRe: RegExp;
      try {
        const flags = case_sensitive ? "g" : "gi";
        searchRe = is_regex
          ? new RegExp(query, flags)
          : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
      } catch (e) {
        return {
          content: [
            { type: "text", text: `Invalid regex: ${(e as Error).message}` },
          ],
        };
      }

      // Convert glob-style file pattern (supports * wildcard) to regex
      const fileFilterRe = file_pattern
        ? new RegExp(
            "^" +
              file_pattern
                .replace(/[.+^${}()|[\]\\]/g, "\\$&")
                .replace(/\*/g, ".*") +
              "$",
            "i"
          )
        : null;

      const results: string[] = [];
      let totalMatches = 0;
      let filesSearched = 0;
      let filesSkipped = 0;

      for (const filePath of walkFiles(searchRoot, fileFilterRe)) {
        if (totalMatches >= MAX_RESULTS) break;

        const stat = fs.statSync(filePath);
        if (stat.size > MAX_FILE_SIZE_BYTES) {
          filesSkipped++;
          continue;
        }

        let content: string;
        try {
          content = fs.readFileSync(filePath, "utf8");
        } catch {
          filesSkipped++;
          continue;
        }

        if (content.includes("\0")) {
          filesSkipped++;
          continue;
        }

        filesSearched++;
        const lines = content.split("\n");
        const fileMatches: string[] = [];

        for (let i = 0; i < lines.length; i++) {
          searchRe.lastIndex = 0;
          if (searchRe.test(lines[i])) {
            fileMatches.push(`  L${i + 1}: ${lines[i].trim().slice(0, 200)}`);
            totalMatches++;
            if (totalMatches >= MAX_RESULTS) break;
          }
        }

        if (fileMatches.length > 0) {
          const relPath = path.relative(PROJECT_ROOT, filePath);
          results.push(
            `${relPath} (${fileMatches.length} match${fileMatches.length > 1 ? "es" : ""})`
          );
          results.push(...fileMatches);
        }
      }

      const matchedFiles = results.filter((l) => !l.startsWith("  ")).length;
      const header = [
        `Search: "${query}"${file_pattern ? ` in ${file_pattern}` : ""}`,
        `Found ${totalMatches} match${totalMatches !== 1 ? "es" : ""} across ${matchedFiles} file(s) (${filesSearched} searched, ${filesSkipped} skipped)`,
        totalMatches >= MAX_RESULTS
          ? `[Results capped at ${MAX_RESULTS}. Narrow your search or use a file_pattern to see more.]`
          : "",
        "",
      ].filter(Boolean);

      return {
        content: [
          {
            type: "text",
            text:
              results.length > 0
                ? [...header, ...results].join("\n")
                : [...header, "No matches found."].join("\n"),
          },
        ],
      };
    }
  );
}
