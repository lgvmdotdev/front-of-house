import "server-only";

import { db, schema } from "@workspace/db";
import { and, desc, eq } from "@workspace/db/drizzle-orm";
import { cache } from "react";
import type { ConversationStatus } from "./conversation-status";

/**
 * What the receptionist said to customers. Read-only — the panel never writes a
 * conversation; the WhatsApp worker owns that.
 *
 * `organizationId` first, in every `where`: a conversation id from another
 * barbershop must read as "not found", never as data.
 */

export interface ConversationRecord {
	customerPhone: string;
	id: string;
	lastMessageAt: Date;
	status: string;
}

export interface ConversationMessageRecord {
	content: string;
	createdAt: Date;
	id: string;
	role: string;
}

export interface ConversationThread extends ConversationRecord {
	messages: ConversationMessageRecord[];
}

export function listConversations(
	orgId: string,
	status?: ConversationStatus
): Promise<ConversationRecord[]> {
	const scope = eq(schema.conversation.organizationId, orgId);
	return db
		.select({
			id: schema.conversation.id,
			customerPhone: schema.conversation.customerPhone,
			status: schema.conversation.status,
			lastMessageAt: schema.conversation.lastMessageAt,
		})
		.from(schema.conversation)
		.where(status ? and(scope, eq(schema.conversation.status, status)) : scope)
		.orderBy(desc(schema.conversation.lastMessageAt));
}

/**
 * `null` for an unknown id *or* an id belonging to another barbershop.
 *
 * `cache()`d because both `generateMetadata` and the transcript component read
 * it in the same render. One request, one query.
 */
export const getConversation = cache(async function getConversation(
	orgId: string,
	id: string
): Promise<ConversationThread | null> {
	const row = await db.query.conversation.findFirst({
		where: and(
			eq(schema.conversation.id, id),
			eq(schema.conversation.organizationId, orgId)
		),
		with: {
			messages: {
				columns: { id: true, role: true, content: true, createdAt: true },
				orderBy: schema.conversationMessage.createdAt,
			},
		},
	});
	if (!row) {
		return null;
	}
	return {
		id: row.id,
		customerPhone: row.customerPhone,
		status: row.status,
		lastMessageAt: row.lastMessageAt,
		messages: row.messages,
	};
});
