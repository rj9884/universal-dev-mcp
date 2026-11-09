import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as http from "http";
import {
  fetchUrl,
  stripHtmlToText,
  extractInnerText,
  extractTagAttributes,
  extractMetaTags,
} from "../utils/fetch.js";
import { isPortAllowed, allowedPortsLabel } from "../utils/security.js";
import { registerTool, UnifiedTool } from "../core/registry.js";

const viewPageSchema = {
  port: z
    .number()
    .describe("The localhost port the dev app is running on (e.g. 5173, 3000)"),
  path: z
    .string()
    .optional()
    .default("/")
    .describe("URL path to fetch (e.g. /about, /dashboard)"),
  include_raw_html: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include the full raw HTML in the response (may be large)"),
};

export const viewPageTool: UnifiedTool<typeof viewPageSchema> = {
  name: "view_page",
  description:
    "Fetch the HTML content and structure of a page on a running local dev server. Returns the page title, meta tags, script sources, and visible text. Optionally returns the full raw HTML.",
  inputSchema: viewPageSchema,
  openAiParameters: {
    type: "object",
    properties: {
      port: { type: "number", description: "Localhost port" },
      path: { type: "string", description: "URL path, e.g. /" },
      include_raw_html: { type: "boolean", description: "Include raw HTML" },
    },
    required: ["port"],
  },
  handler: async ({ port, path: urlPath, include_raw_html }) => {
    if (!isPortAllowed(port)) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: [
              `Access denied: port ${port} is not in the allowed list.`,
              `Allowed ports: ${allowedPortsLabel()}`,
              `To add this port, update ALLOWED_PORTS in your .env file or project configuration.`,
            ].join("\n"),
          },
        ],
      };
    }

    const pathString = urlPath || "/";
    const url = `http://localhost:${port}${pathString}`;

    try {
      const { status, body, headers } = await fetchUrl(url);
      const contentType = headers["content-type"] || "unknown";
      const isHtml =
        contentType.includes("html") || body.trim().startsWith("<");

      const title = extractInnerText(body, "title") ?? "(no title)";
      const metaTags = extractMetaTags(body);
      const scripts = extractTagAttributes(
        body,
        /<script[^>]*src\s*=\s*(?:"[^"]*"|'[^']*')[^>]*>/i,
        "src"
      );

      const visibleText = isHtml
        ? stripHtmlToText(body)
        : body.slice(0, 8000);

      const lines: string[] = [
        `URL:          ${url}`,
        `Status:       ${status}`,
        `Title:        ${title}`,
        `Content-Type: ${contentType}`,
        `Size:         ${body.length} bytes`,
      ];

      if (metaTags.length > 0) {
        lines.push("", `Meta tags (${metaTags.length}):`);
        metaTags.slice(0, 10).forEach((tag) => lines.push(`  ${tag}`));
      }

      if (scripts.length > 0) {
        lines.push("", `Script sources:`);
        scripts.forEach((src) => lines.push(`  ${src}`));
      }

      lines.push("", "Visible text:", visibleText);

      if (include_raw_html) {
        lines.push("", "Raw HTML:", body.slice(0, 10000));
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }],
        metadata: { url, status, title, size: body.length },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: [
              `Failed to reach ${url}`,
              `Error: ${message}`,
              `Make sure your dev server is running on port ${port}.`,
            ].join("\n"),
          },
        ],
      };
    }
  },
};

const checkPortSchema = {
  port: z.number().describe("Port number to check"),
};

export const checkPortTool: UnifiedTool<typeof checkPortSchema> = {
  name: "check_port",
  description:
    "Check whether a dev server is currently running and responding on a given localhost port. Run this before view_page to confirm the server is up.",
  inputSchema: checkPortSchema,
  openAiParameters: {
    type: "object",
    properties: {
      port: { type: "number", description: "Port number to check" },
    },
    required: ["port"],
  },
  handler: async ({ port }) => {
    if (!isPortAllowed(port)) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Port ${port} is not in the allowed list. Allowed: ${allowedPortsLabel()}`,
          },
        ],
      };
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      const req = http.get(
        `http://localhost:${port}/`,
        { timeout: 3000 },
        (res) => {
          const latencyMs = Date.now() - startTime;
          resolve({
            content: [
              {
                type: "text",
                text: `Port ${port} is active. Server responded with HTTP ${res.statusCode} in ${latencyMs}ms.`,
              },
            ],
            metadata: { port, active: true, statusCode: res.statusCode, latencyMs },
          });
          res.resume();
        }
      );

      req.on("error", () => {
        resolve({
          content: [
            {
              type: "text",
              text: `Port ${port} is inactive. No server is responding on that port.`,
            },
          ],
          metadata: { port, active: false },
        });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({
          content: [
            {
              type: "text",
              text: `Port ${port} timed out. The server may be slow to start or not running.`,
            },
          ],
          metadata: { port, active: false, timeout: true },
        });
      });
    });
  },
};

export function registerBrowserTools(server?: McpServer): void {
  registerTool(viewPageTool);
  registerTool(checkPortTool);

  if (server) {
    server.registerTool(
      viewPageTool.name,
      { description: viewPageTool.description, inputSchema: viewPageTool.inputSchema },
      viewPageTool.handler
    );
    server.registerTool(
      checkPortTool.name,
      { description: checkPortTool.description, inputSchema: checkPortTool.inputSchema },
      checkPortTool.handler
    );
  }
}
