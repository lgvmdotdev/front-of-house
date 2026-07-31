import { betaTool } from "@anthropic-ai/sdk/helpers/beta/json-schema.js";
import type { BetaRunnableTool } from "@anthropic-ai/sdk/lib/tools/BetaRunnableTool.js";
import { ToolError } from "@anthropic-ai/sdk/lib/tools/ToolError.js";
import type { BetaTool } from "@anthropic-ai/sdk/resources/beta/messages/messages.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/** `betaTool()` always produces a plain custom tool — narrower than the SDK's
 * generic `BetaRunnableTool` (a union that also covers bash/computer-use/memory
 * tools which don't all carry `description`). */
export type McpBridgedTool = BetaRunnableTool & BetaTool;

export interface McpServerConfig {
	args?: string[];
	command: string;
	cwd?: string;
	env?: Record<string, string>;
}

/** Spawns an MCP server as a stdio child process and connects a client to it. */
export async function connectMcpServer(
	config: McpServerConfig
): Promise<Client> {
	const transport = new StdioClientTransport(config);
	const client = new McpClient({ name: "recepcionai-agent", version: "1.0.0" });
	await client.connect(transport);
	return client;
}

function toContentBlocks(
	content: unknown
): Array<{ text: string; type: "text" }> {
	const blocks = (content ?? []) as Array<{ text?: string; type: string }>;
	return blocks
		.filter((block) => block.type === "text")
		.map((block) => ({ type: "text" as const, text: block.text ?? "" }));
}

/**
 * Bridges every tool an MCP server exposes into Anthropic's `betaTool` shape,
 * so `toolRunner()` can call them directly. MCP tool schemas are already JSON
 * Schema, so no zod translation is needed on this side.
 */
export async function mcpToolsToBetaTools(
	client: Client
): Promise<McpBridgedTool[]> {
	const { tools } = await client.listTools();
	return tools.map(
		(tool) =>
			betaTool({
				name: tool.name,
				description: tool.description ?? "",
				inputSchema: tool.inputSchema as Parameters<
					typeof betaTool
				>[0]["inputSchema"],
				run: async (input) => {
					const result = await client.callTool({
						name: tool.name,
						arguments: input as Record<string, unknown>,
					});
					const blocks = toContentBlocks(result.content);
					if (result.isError) {
						throw new ToolError(blocks);
					}
					return blocks;
				},
			}) as McpBridgedTool
	);
}
