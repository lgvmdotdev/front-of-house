export type ConversationRole = "assistant" | "user";

export interface ConversationMessageRecord {
	content: string;
	role: ConversationRole;
}

export interface FindOrCreateConversationInput {
	customerPhone: string;
	organizationId: string;
}

export interface AppendMessageInput {
	content: string;
	conversationId: string;
	role: ConversationRole;
	waMessageId?: string;
}

/**
 * The agent's memory — one open conversation per (organization, customer
 * phone), with the message history that becomes the LLM's context window.
 */
export interface ConversationStore {
	appendMessage(input: AppendMessageInput): Promise<void>;
	findOrCreateConversation(
		input: FindOrCreateConversationInput
	): Promise<{ conversationId: string }>;
	getHistory(conversationId: string): Promise<ConversationMessageRecord[]>;
}
