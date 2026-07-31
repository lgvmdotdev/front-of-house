import { beforeEach, describe, expect, test } from "bun:test";
import { ToolError } from "@anthropic-ai/sdk/lib/tools/ToolError.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpToolsToBetaTools } from "./mcp-client";

describe("mcpToolsToBetaTools", () => {
	let client: Client;

	beforeEach(async () => {
		const server = new McpServer({ name: "test-server", version: "1.0.0" });

		server.registerTool(
			"echo",
			{
				description: "Echoes the given message back",
				inputSchema: { message: z.string() },
			},
			({ message }) => ({ content: [{ type: "text", text: message }] })
		);

		server.registerTool(
			"always_fails",
			{ description: "Always returns an error", inputSchema: {} },
			() => ({
				content: [{ type: "text", text: "something went wrong" }],
				isError: true,
			})
		);

		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();
		client = new Client({ name: "test-client", version: "1.0.0" });
		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);
	});

	test("bridges each MCP tool's name and description", async () => {
		const tools = await mcpToolsToBetaTools(client);

		expect(tools.map((tool) => tool.name).sort()).toEqual([
			"always_fails",
			"echo",
		]);
		const echoTool = tools.find((tool) => tool.name === "echo");
		expect(echoTool?.description).toBe("Echoes the given message back");
	});

	test("running a bridged tool proxies the call to the MCP server", async () => {
		const tools = await mcpToolsToBetaTools(client);
		const echoTool = tools.find((tool) => tool.name === "echo");

		const result = await echoTool?.run({ message: "oi" });

		expect(result).toEqual([{ type: "text", text: "oi" }]);
	});

	test("throws ToolError when the MCP tool returns isError", async () => {
		const tools = await mcpToolsToBetaTools(client);
		const failingTool = tools.find((tool) => tool.name === "always_fails");

		await expect(failingTool?.run({})).rejects.toThrow(ToolError);
	});
});
