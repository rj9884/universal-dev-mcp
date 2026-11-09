import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as http from "http";
import { getAllowedPorts } from "../config.js";
import { registerTool, UnifiedTool } from "../core/registry.js";

const COMMON_DEV_PORTS = [3000, 5173, 8080, 4200, 4000, 8000, 8888, 5000, 1337, 3001, 5174];

function checkSinglePort(port: number): Promise<{
  port: number;
  active: boolean;
  statusCode?: number;
  latencyMs?: number;
  serverHeader?: string;
  title?: string;
}> {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(
      `http://localhost:${port}/`,
      { timeout: 1500 },
      (res) => {
        const latencyMs = Date.now() - start;
        let body = "";
        res.on("data", (chunk) => {
          if (body.length < 2000) body += chunk;
        });
        res.on("end", () => {
          const titleMatch = body.match(/<title[^>]*>(.*?)<\/title>/i);
          resolve({
            port,
            active: true,
            statusCode: res.statusCode,
            latencyMs,
            serverHeader: (res.headers["server"] as string) || (res.headers["x-powered-by"] as string) || undefined,
            title: titleMatch ? titleMatch[1].trim() : undefined,
          });
        });
        res.resume();
      }
    );

    req.on("error", () => {
      resolve({ port, active: false });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ port, active: false });
    });
  });
}

const scanSchema = {
  ports: z
    .string()
    .optional()
    .describe("Comma-separated list of ports to scan. If omitted, scans allowed ports plus common dev ports."),
};

export const scanDevServersTool: UnifiedTool<typeof scanSchema> = {
  name: "scan_dev_servers",
  description:
    "Scan localhost ports in parallel to detect running dev servers (Vite, Next.js, Express, React, etc.) with response status, latency, and page titles.",
  inputSchema: scanSchema,
  openAiParameters: {
    type: "object",
    properties: {
      ports: { type: "string", description: "Optional comma-separated ports to scan" },
    },
  },
  handler: async ({ ports }) => {
    let portList: number[];
    if (ports) {
      portList = ports
        .split(",")
        .map((p) => parseInt(p.trim(), 10))
        .filter((p) => !isNaN(p));
    } else {
      const allowed = getAllowedPorts();
      portList = Array.from(new Set([...allowed, ...COMMON_DEV_PORTS]));
    }

    const results = await Promise.all(portList.map(checkSinglePort));
    const active = results.filter((r) => r.active);
    const inactive = results.filter((r) => !r.active);

    const lines: string[] = [
      `Local Dev Server Radar`,
      `Scanned ${results.length} ports: ${active.length} active, ${inactive.length} inactive.`,
      "",
    ];

    if (active.length > 0) {
      lines.push("ACTIVE SERVERS:");
      for (const s of active) {
        const titleStr = s.title ? ` - "${s.title}"` : "";
        const serverStr = s.serverHeader ? ` (${s.serverHeader})` : "";
        lines.push(`  * Port ${s.port}: HTTP ${s.statusCode} in ${s.latencyMs}ms${serverStr}${titleStr}`);
      }
    } else {
      lines.push("No active servers detected on scanned ports.");
    }

    if (inactive.length > 0) {
      lines.push("", `Inactive ports: ${inactive.map((i) => i.port).join(", ")}`);
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
      metadata: {
        totalScanned: results.length,
        activeServers: active,
      },
    };
  },
};

export function registerRadarTools(server?: McpServer): void {
  registerTool(scanDevServersTool);

  if (server) {
    server.registerTool(
      scanDevServersTool.name,
      { description: scanDevServersTool.description, inputSchema: scanDevServersTool.inputSchema },
      scanDevServersTool.handler
    );
  }
}
