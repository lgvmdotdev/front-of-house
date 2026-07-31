import { db, schema } from "@workspace/db";
import { and, asc, eq } from "@workspace/db/drizzle-orm";
import type {
	AppendMessageInput,
	ConversationMessageRecord,
	ConversationStore,
	FindOrCreateConversationInput,
} from "./conversation-store";

/** {@link ConversationStore} backed by the `conversation`/`conversation_message` tables. */
export class PostgresConversationStore implements ConversationStore {
	async findOrCreateConversation(
		input: FindOrCreateConversationInput
	): Promise<{ conversationId: string }> {
		const existing = await db.query.conversation.findFirst({
			where: and(
				eq(schema.conversation.organizationId, input.organizationId),
				eq(schema.conversation.customerPhone, input.customerPhone),
				eq(schema.conversation.status, "open")
			),
		});
		if (existing) {
			return { conversationId: existing.id };
		}

		const id = crypto.randomUUID();
		await db.insert(schema.conversation).values({
			id,
			organizationId: input.organizationId,
			customerPhone: input.customerPhone,
		});
		return { conversationId: id };
	}

	async appendMessage(input: AppendMessageInput): Promise<void> {
		await db.insert(schema.conversationMessage).values({
			id: crypto.randomUUID(),
			conversationId: input.conversationId,
			role: input.role,
			content: input.content,
			waMessageId: input.waMessageId,
		});
		await db
			.update(schema.conversation)
			.set({ lastMessageAt: new Date() })
			.where(eq(schema.conversation.id, input.conversationId));
	}

	async getHistory(
		conversationId: string
	): Promise<ConversationMessageRecord[]> {
		const rows = await db.query.conversationMessage.findMany({
			where: eq(schema.conversationMessage.conversationId, conversationId),
			orderBy: asc(schema.conversationMessage.createdAt),
		});
		return rows.map((row) => ({
			role: row.role as ConversationMessageRecord["role"],
			content: row.content,
		}));
	}
}
