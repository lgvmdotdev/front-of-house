// biome-ignore-all lint/performance/noBarrelFile: this is the package's public API surface

export {
	ClaudeAgent,
	type ClaudeAgentOptions,
	createAnthropicToolLoop,
	type RunToolLoop,
	type RunToolLoopParams,
} from "./claude-agent";
export type {
	ConversationMessageRecord,
	ConversationRole,
	ConversationStore,
} from "./conversation-store";
export { FakeAgent } from "./fake";
export { FakeConversationStore } from "./fake-conversation-store";
export {
	connectMcpServer,
	type McpBridgedTool,
	mcpToolsToBetaTools,
} from "./mcp-client";
// Provider-agnostic contract — code against this, not a concrete LLM.
export type { Agent, RespondInput, RespondResult } from "./port";
export { PostgresConversationStore } from "./postgres-conversation-store";
export { buildSystemPrompt } from "./prompt";
