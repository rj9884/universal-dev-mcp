import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { getProjectRoot, getAllowedPorts, getAllowedCommands, validateConfig } from "./config.js";
import { cleanOldBackups } from "./utils/backup.js";

const server = new McpServer({
  name: "universal-dev-mcp",
  version: "1.0.0",
});

registerAllTools(server);

async function main(): Promise<void> {
  validateConfig();
  cleanOldBackups();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it does not interfere with the MCP stdio protocol
  console.error("Universal Dev MCP Server started (stdio)");
  console.error(`Project root:     ${getProjectRoot()}`);
  console.error(`Allowed ports:    ${getAllowedPorts().join(", ")}`);
  console.error(`Allowed commands: ${getAllowedCommands().join(", ")}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
