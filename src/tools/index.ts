import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBrowserTools } from "./browser.js";
import { registerApiTools } from "./api.js";
import { registerFileTools } from "./files.js";
import { registerCommandTools } from "./commands.js";
import { registerProjectTools } from "./project.js";
import { registerSearchTools } from "./search.js";
import { registerGitTools } from "./git.js";
import { registerRadarTools } from "./radar.js";
import { registerAllToolsWithMcp } from "../core/registry.js";

export function initAllTools(): void {
  registerProjectTools();
  registerBrowserTools();
  registerApiTools();
  registerFileTools();
  registerCommandTools();
  registerSearchTools();
  registerGitTools();
  registerRadarTools();
}

export function registerAllTools(server: McpServer): void {
  initAllTools();
  registerAllToolsWithMcp(server);
}
