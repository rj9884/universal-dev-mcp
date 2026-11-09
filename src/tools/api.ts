import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { httpRequest } from "../utils/fetch.js";
import { isPortAllowed, allowedPortsLabel } from "../utils/security.js";
import { registerTool, UnifiedTool } from "../core/registry.js";

const apiToolSchema = {
  port: z.number().describe("The localhost port the API server is running on"),
  path: z
    .string()
    .describe("API endpoint path (e.g. /api/users, /health, /auth/login)"),
  method: z
    .enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
    .optional()
    .default("GET")
    .describe("HTTP method"),
  body: z
    .string()
    .optional()
    .describe("Request body as a JSON string (used with POST, PUT, PATCH)"),
  custom_headers: z
    .string()
    .optional()
    .describe(
      'Additional headers as a JSON string, e.g. \'{"Authorization":"Bearer token"}\''
    ),
};

export const getApiResponseTool: UnifiedTool<typeof apiToolSchema> = {
  name: "get_api_response",
  description:
    "Make an HTTP request to an API endpoint on a local dev server and return the full response. Supports all standard HTTP methods and an optional JSON request body. Useful for testing REST APIs, checking response shapes, and verifying status codes.",
  inputSchema: apiToolSchema,
  openAiParameters: {
    type: "object",
    properties: {
      port: { type: "number", description: "Port number" },
      path: { type: "string", description: "Endpoint path" },
      method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        default: "GET",
      },
      body: { type: "string", description: "Request body string (e.g. JSON)" },
      custom_headers: {
        type: "string",
        description: "Custom headers as JSON string",
      },
    },
    required: ["port", "path"],
  },
  handler: async ({ port, path: apiPath, method, body, custom_headers }) => {
    if (!isPortAllowed(port)) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Access denied: port ${port} is not in the allowed list.\nAllowed ports: ${allowedPortsLabel()}`,
          },
        ],
      };
    }

    const effectiveMethod = method || "GET";
    const url = `http://localhost:${port}${apiPath}`;

    let extraHeaders: Record<string, string> = {};
    if (custom_headers) {
      try {
        extraHeaders = JSON.parse(custom_headers);
      } catch {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Invalid custom_headers value. Must be a valid JSON string.\nExample: '{"Authorization":"Bearer abc123"}'`,
            },
          ],
        };
      }
    }

    const requestBody = body ? Buffer.from(body, "utf8") : undefined;

    try {
      const { status, body: responseBody, headers } = await httpRequest(url, {
        method: effectiveMethod,
        headers: extraHeaders,
        body: requestBody,
      });

      let parsedJson: unknown = null;
      let isJson = false;

      try {
        parsedJson = JSON.parse(responseBody);
        isJson = true;
      } catch {
        // Not JSON — display as plain text
      }

      const lines: string[] = [
        `${effectiveMethod} ${url}`,
        `Status:        ${status}`,
        `Content-Type:  ${headers["content-type"] || "unknown"}`,
        `Response size: ${responseBody.length} bytes`,
        "",
        "Response body:",
        isJson
          ? JSON.stringify(parsedJson, null, 2).slice(0, 6000)
          : responseBody.slice(0, 6000),
      ];

      return {
        content: [{ type: "text", text: lines.join("\n") }],
        metadata: {
          url,
          status,
          method: effectiveMethod,
          size: responseBody.length,
          isJson,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: [
              `Request failed: ${effectiveMethod} ${url}`,
              `Error: ${message}`,
              `Make sure the server is running on port ${port}.`,
            ].join("\n"),
          },
        ],
      };
    }
  },
};

export function registerApiTools(server?: McpServer): void {
  registerTool(getApiResponseTool);

  if (server) {
    server.registerTool(
      getApiResponseTool.name,
      {
        description: getApiResponseTool.description,
        inputSchema: getApiResponseTool.inputSchema,
      },
      getApiResponseTool.handler
    );
  }
}
