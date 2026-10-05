import { createMcpHandler } from "mcp-handler";
import { registerMcpTools } from "@/lib/mcp/tools";

const handler = createMcpHandler(
	(server) => {
		registerMcpTools(server);
	},
	{
		serverInfo: {
			name: "zt-inspector-mcp",
			version: "0.1.0",
		},
	},
);

export { handler as GET, handler as POST, handler as DELETE };
