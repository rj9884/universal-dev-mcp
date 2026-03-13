import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as http from "http";
import { fetchUrl, stripHtmlToText } from "../utils/fetch.js";
import { isPortAllowed, allowedPortsLabel } from "../utils/security.js";

export function registerBrowserTools(server: McpServer): void {
  
  server.tool(
    "view_page",
    "Fetch the HTML content and structure of a page on a running local dev server. Returns the page title, meta tags, script sources, and visible text. Optionally returns the full raw HTML.",
    {
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
    },
    async ({ port, path: urlPath, include_raw_html }) => {
      if (!isPortAllowed(port)) {
        return {
          content: [
            {
              type: "text",
              text: [
                `Access denied: port ${port} is not in the allowed list.`,
                `Allowed ports: ${allowedPortsLabel()}`,
                `To add this port, update ALLOWED_PORTS in your .env file.`,
              ].join("\n"),
            },
          ],
        };
      }

      const url = `http://localhost:${port}${urlPath}`;

      try {
        const { status, body, headers } = await fetchUrl(url);
        const contentType = headers["content-type"] || "unknown";
        const isHtml =
          contentType.includes("html") || body.trim().startsWith("<");

        const titleMatch = body.match(/<title[^>]*>(.*?)<\/title>/is);
        const title = titleMatch ? titleMatch[1].trim() : "(no title)";

        const metaTags: string[] = [];
        const metaRegex = /<meta[^>]+>/gi;
        let metaMatch: RegExpExecArray | null;
        while ((metaMatch = metaRegex.exec(body)) !== null) {
          metaTags.push(metaMatch[0]);
        }

        const scripts: string[] = [];
        const scriptRegex = /<script[^>]*src=["']([^"']+)["']/gi;
        let scriptMatch: RegExpExecArray | null;
        while ((scriptMatch = scriptRegex.exec(body)) !== null) {
          scripts.push(scriptMatch[1]);
        }

        const visibleText = isHtml ? stripHtmlToText(body) : body.slice(0, 8000);

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

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
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
    }
  );

   server.tool(
    "check_port",
    "Check whether a dev server is currently running and responding on a given localhost port. Run this before view_page to confirm the server is up.",
    {
      port: z.number().describe("Port number to check"),
    },
    async ({ port }) => {
      if (!isPortAllowed(port)) {
        return {
          content: [
            {
              type: "text",
              text: `Port ${port} is not in the allowed list. Allowed: ${allowedPortsLabel()}`,
            },
          ],
        };
      }

      return new Promise((resolve) => {
        const req = http.get(
          `http://localhost:${port}/`,
          { timeout: 3000 },
          (res) => {
            resolve({
              content: [
                {
                  type: "text",
                  text: `Port ${port} is active. Server responded with HTTP ${res.statusCode}.`,
                },
              ],
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
          });
        });
      });
    }
  );
}