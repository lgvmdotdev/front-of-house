import Anthropic from "@anthropic-ai/sdk";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Professional, Service } from "@workspace/bookings";
import type { ConversationRole, ConversationStore } from "./conversation-store";
import { type McpBridgedTool, mcpToolsToBetaTools } from "./mcp-client";
import type { Agent, RespondInput, RespondResult } from "./port";
import { buildSystemPrompt } from "./prompt";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_MAX_ITERATIONS = 10;

export interface RunToolLoopParams {
	maxIterations: number;
	maxTokens: number;
	messages: Array<{ content: string; role: ConversationRole }>;
	model: string;
	system: string;
	tools: McpBridgedTool[];
}

/**
 * Runs the model + tool-use loop to completion and returns the final reply
 * text. Real Anthropic calls are a true external boundary — this is the
 * injectable seam, so `ClaudeAgent` itself never touches the network in
 * tests.
 */
export type RunToolLoop = (params: RunToolLoopParams) => Promise<string>;

function isTextBlock(
	block: Anthropic.Beta.Messages.BetaContentBlock
): block is Anthropic.Beta.Messages.BetaTextBlock {
	return block.type === "text";
}

/** Real {@link RunToolLoop} backed by `anthropic.beta.messages.toolRunner`. */
export function createAnthropicToolLoop(apiKey: string): RunToolLoop {
	const anthropic = new Anthropic({ apiKey });

	return async (params) => {
		const runner = anthropic.beta.messages.toolRunner({
			model: params.model,
			max_tokens: params.maxTokens,
			max_iterations: params.maxIterations,
			system: params.system,
			messages: params.messages,
			tools: params.tools,
		});
		const finalMessage = await runner;
		return finalMessage.content
			.filter(isTextBlock)
			.map((block) => block.text)
			.join("\n")
			.trim();
	};
}

function parseToolResultJson<T>(result: unknown, fallback: T): T {
	const content =
		result && typeof result === "object" && "content" in result
			? (result as { content: unknown }).content
			: undefined;
	const blocks = (content ?? []) as Array<{ text?: string; type: string }>;
	const text = blocks.find((block) => block.type === "text")?.text;
	if (!text) {
		return fallback;
	}
	return JSON.parse(text) as T;
}

export interface ClaudeAgentOptions {
	/** Connected client for this tenant's bookings MCP server. */
	bookingsMcpClient: Client;
	conversationStore: ConversationStore;
	runToolLoop: RunToolLoop;
	/** Not part of the bookings port — organization metadata, not catalog data. */
	shopName: string;
}

/**
 * {@link Agent} backed by Claude — the Messages API + a hand-rolled tool
 * loop. The system prompt's catalog (services/professionals) is fetched
 * fresh from the bookings MCP server on every `respond()` call, through the
 * same tools the model itself uses — so there's no separate, potentially
 * stale copy of the tenant's catalog living in the agent.
 */
export class ClaudeAgent implements Agent {
	readonly #bookingsMcpClient: Client;
	readonly #conversationStore: ConversationStore;
	readonly #runToolLoop: RunToolLoop;
	readonly #shopName: string;

	constructor(options: ClaudeAgentOptions) {
		this.#bookingsMcpClient = options.bookingsMcpClient;
		this.#conversationStore = options.conversationStore;
		this.#runToolLoop = options.runToolLoop;
		this.#shopName = options.shopName;
	}

	async respond(input: RespondInput): Promise<RespondResult> {
		const { conversationId } =
			await this.#conversationStore.findOrCreateConversation({
				organizationId: input.organizationId,
				customerPhone: input.customerPhone,
			});

		await this.#conversationStore.appendMessage({
			conversationId,
			role: "user",
			content: input.message,
		});

		const [history, tools, services, professionals] = await Promise.all([
			this.#conversationStore.getHistory(conversationId),
			mcpToolsToBetaTools(this.#bookingsMcpClient),
			this.#listServices(),
			this.#listProfessionals(),
		]);

		const reply = await this.#runToolLoop({
			model: DEFAULT_MODEL,
			maxTokens: DEFAULT_MAX_TOKENS,
			maxIterations: DEFAULT_MAX_ITERATIONS,
			system: buildSystemPrompt({
				shopName: this.#shopName,
				services,
				professionals,
			}),
			messages: history,
			tools,
		});

		await this.#conversationStore.appendMessage({
			conversationId,
			role: "assistant",
			content: reply,
		});

		return { reply };
	}

	async #listServices(): Promise<Service[]> {
		const result = await this.#bookingsMcpClient.callTool({
			name: "list_services",
			arguments: {},
		});
		return parseToolResultJson<Service[]>(result, []);
	}

	async #listProfessionals(): Promise<Professional[]> {
		const result = await this.#bookingsMcpClient.callTool({
			name: "list_professionals",
			arguments: {},
		});
		return parseToolResultJson<Professional[]>(result, []);
	}
}
