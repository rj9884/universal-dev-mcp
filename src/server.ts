import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { PROJECT_ROOT, ALLOWED_PORTS, ALLOWED_COMMANDS } from "./config.js";

const server = new McpServer({
  name: "universal-dev-mcp",
  version: "1.0.0",
});

registerAllTools(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it does not interfere with the MCP stdio protocol
  console.error("Universal Dev MCP Server started (stdio)");
  console.error(`Project root:     ${PROJECT_ROOT}`);
  console.error(`Allowed ports:    ${ALLOWED_PORTS.join(", ")}`);
  console.error(`Allowed commands: ${ALLOWED_COMMANDS.join(", ")}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});