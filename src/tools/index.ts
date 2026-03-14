import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBrowserTools } from "./browser.js";
import { registerApiTools } from "./api.js";
import { registerFileTools } from "./files.js";
import { registerCommandTools } from "./commands.js";
import { registerProjectTools } from "./project.js";
import { registerSearchTools } from "./search.js";

export function registerAllTools(server: McpServer): void {
  registerProjectTools(server);
  registerBrowserTools(server);
  registerApiTools(server);
  registerFileTools(server);
  registerCommandTools(server);
  registerSearchTools(server);
}
