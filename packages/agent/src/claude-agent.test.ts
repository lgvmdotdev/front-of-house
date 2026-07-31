import { beforeEach, describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Professional, Service } from "@workspace/bookings";
import {
	ClaudeAgent,
	type RunToolLoop,
	type RunToolLoopParams,
} from "./claude-agent";
import { FakeConversationStore } from "./fake-conversation-store";

const CORTE: Service = {
	id: "svc-corte",
	name: "Corte",
	durationMinutes: 60,
	price: { amountCents: 5000, currency: "BRL" },
};
const JOAO: Professional = {
	id: "prof-joao",
	name: "João",
	serviceIds: ["svc-corte"],
	workingHours: [{ weekday: 1, start: "09:00", end: "18:00" }],
};

const ORG_ID = "org-1";
const CUSTOMER_PHONE = "5547999998888";

describe("ClaudeAgent", () => {
	let client: Client;
	let store: FakeConversationStore;
	let loopCalls: RunToolLoopParams[];
	let runToolLoop: RunToolLoop;

	beforeEach(async () => {
		const server = new McpServer({ name: "test-bookings", version: "1.0.0" });
		server.registerTool(
			"list_services",
			{ description: "List services" },
			() => ({
				content: [{ type: "text", text: JSON.stringify([CORTE]) }],
			})
		);
		server.registerTool(
			"list_professionals",
			{ description: "List professionals" },
			() => ({ content: [{ type: "text", text: JSON.stringify([JOAO]) }] })
		);

		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();
		client = new Client({ name: "test-client", version: "1.0.0" });
		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);

		store = new FakeConversationStore();
		loopCalls = [];
		runToolLoop = (params) => {
			loopCalls.push(params);
			return Promise.resolve("Claro, temos horário às 14h.");
		};
	});

	function createAgent(): ClaudeAgent {
		return new ClaudeAgent({
			bookingsMcpClient: client,
			conversationStore: store,
			runToolLoop,
			shopName: "Barbearia do Zé",
		});
	}

	/** Same (org, phone) always resolves to the same conversation — safe to call after `respond`. */
	async function currentConversationId(): Promise<string> {
		const { conversationId } = await store.findOrCreateConversation({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
		});
		return conversationId;
	}

	test("returns the tool loop's reply", async () => {
		const agent = createAgent();

		const result = await agent.respond({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
			message: "Tem horário hoje?",
		});

		expect(result).toEqual({ reply: "Claro, temos horário às 14h." });
	});

	test("finds or creates a conversation for the (org, customer) pair", async () => {
		const agent = createAgent();

		await agent.respond({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
			message: "oi",
		});
		await agent.respond({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
			message: "tudo bem?",
		});

		expect(await store.getHistory(await currentConversationId())).toHaveLength(
			4
		);
	});

	test("persists both the inbound message and the reply to conversation history", async () => {
		const agent = createAgent();

		await agent.respond({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
			message: "Tem horário hoje?",
		});

		expect(await store.getHistory(await currentConversationId())).toEqual([
			{ role: "user", content: "Tem horário hoje?" },
			{ role: "assistant", content: "Claro, temos horário às 14h." },
		]);
	});

	test("passes the full conversation history to the tool loop, including the new message", async () => {
		const agent = createAgent();
		const { conversationId } = await store.findOrCreateConversation({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
		});
		await store.appendMessage({ conversationId, role: "user", content: "oi" });
		await store.appendMessage({
			conversationId,
			role: "assistant",
			content: "Olá! Como posso ajudar?",
		});

		await agent.respond({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
			message: "Tem horário hoje?",
		});

		expect(loopCalls[0]?.messages).toEqual([
			{ role: "user", content: "oi" },
			{ role: "assistant", content: "Olá! Como posso ajudar?" },
			{ role: "user", content: "Tem horário hoje?" },
		]);
	});

	test("builds the system prompt from the shop name and the live catalog fetched via MCP", async () => {
		const agent = createAgent();

		await agent.respond({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
			message: "oi",
		});

		expect(loopCalls[0]?.system).toContain("Barbearia do Zé");
		expect(loopCalls[0]?.system).toContain("Corte");
		expect(loopCalls[0]?.system).toContain("João");
	});

	test("passes the bookings MCP server's tools bridged for the model", async () => {
		const agent = createAgent();

		await agent.respond({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
			message: "oi",
		});

		expect(loopCalls[0]?.tools.map((tool) => tool.name).sort()).toEqual([
			"list_professionals",
			"list_services",
		]);
	});
});
