import type {
	AppendMessageInput,
	ConversationMessageRecord,
	ConversationStore,
	FindOrCreateConversationInput,
} from "./conversation-store";

/** In-memory {@link ConversationStore} — the test seam, no mocking Postgres. */
export class FakeConversationStore implements ConversationStore {
	readonly #conversations = new Map<
		string,
		{ customerPhone: string; organizationId: string }
	>();
	readonly #messages = new Map<string, ConversationMessageRecord[]>();
	#sequence = 0;

	findOrCreateConversation(
		input: FindOrCreateConversationInput
	): Promise<{ conversationId: string }> {
		for (const [id, conversation] of this.#conversations) {
			if (
				conversation.organizationId === input.organizationId &&
				conversation.customerPhone === input.customerPhone
			) {
				return Promise.resolve({ conversationId: id });
			}
		}

		this.#sequence += 1;
		const id = `fake-conversation-${this.#sequence}`;
		this.#conversations.set(id, {
			organizationId: input.organizationId,
			customerPhone: input.customerPhone,
		});
		this.#messages.set(id, []);
		return Promise.resolve({ conversationId: id });
	}

	appendMessage(input: AppendMessageInput): Promise<void> {
		const history = this.#messages.get(input.conversationId) ?? [];
		history.push({ role: input.role, content: input.content });
		this.#messages.set(input.conversationId, history);
		return Promise.resolve();
	}

	getHistory(conversationId: string): Promise<ConversationMessageRecord[]> {
		return Promise.resolve([...(this.#messages.get(conversationId) ?? [])]);
	}
}
