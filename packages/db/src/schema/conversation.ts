import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./organization";

/**
 * A WhatsApp thread with one customer, scoped to an organization (shop). The
 * agent's context window is assembled from `conversationMessage` rows.
 */

export const conversation = pgTable(
	"conversation",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		/** WhatsApp `wa_id` — E.164 phone number, no leading `+`. */
		customerPhone: text("customer_phone").notNull(),
		/** "open" | "handed_off" | "closed" */
		status: text("status").default("open").notNull(),
		lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("conversation_organizationId_idx").on(table.organizationId),
		index("conversation_organizationId_customerPhone_idx").on(
			table.organizationId,
			table.customerPhone
		),
	]
);

export const conversationMessage = pgTable(
	"conversation_message",
	{
		id: text("id").primaryKey(),
		conversationId: text("conversation_id")
			.notNull()
			.references(() => conversation.id, { onDelete: "cascade" }),
		/** "user" | "assistant" */
		role: text("role").notNull(),
		content: text("content").notNull(),
		/** Correlates to the WhatsApp message id, when this row came from/to Meta. */
		waMessageId: text("wa_message_id"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("conversation_message_conversationId_idx").on(table.conversationId),
	]
);

export const conversationRelations = relations(
	conversation,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [conversation.organizationId],
			references: [organization.id],
		}),
		messages: many(conversationMessage),
	})
);

export const conversationMessageRelations = relations(
	conversationMessage,
	({ one }) => ({
		conversation: one(conversation, {
			fields: [conversationMessage.conversationId],
			references: [conversation.id],
		}),
	})
);
