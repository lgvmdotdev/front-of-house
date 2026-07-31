import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";
import { PostgresConversationStore } from "./postgres-conversation-store";

/**
 * Integration tests against the real Postgres (per the project's TDD rule —
 * no mocking the DB). Requires the docker container up + migrated:
 *   bun run --filter @workspace/db db:start && db:migrate
 */

const ORG_ID = "test-org-conversation-store";
const CUSTOMER_PHONE = "5547999998888";

async function cleanup(): Promise<void> {
	await db
		.delete(schema.organization)
		.where(eq(schema.organization.id, ORG_ID));
}

beforeEach(async () => {
	await cleanup();
	await db.insert(schema.organization).values({
		id: ORG_ID,
		name: "Test Org",
		slug: `${ORG_ID}-${crypto.randomUUID()}`,
		createdAt: new Date(),
	});
});

afterEach(cleanup);

describe("PostgresConversationStore", () => {
	test("creates a new conversation on first contact", async () => {
		const store = new PostgresConversationStore();

		const { conversationId } = await store.findOrCreateConversation({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
		});

		expect(conversationId).toBeTruthy();
		expect(await store.getHistory(conversationId)).toEqual([]);
	});

	test("returns the same open conversation for the same customer", async () => {
		const store = new PostgresConversationStore();

		const first = await store.findOrCreateConversation({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
		});
		const second = await store.findOrCreateConversation({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
		});

		expect(second.conversationId).toBe(first.conversationId);
	});

	test("does not mix up conversations across organizations", async () => {
		const otherOrgId = "test-org-conversation-store-other";
		await db.insert(schema.organization).values({
			id: otherOrgId,
			name: "Other Org",
			slug: `${otherOrgId}-${crypto.randomUUID()}`,
			createdAt: new Date(),
		});

		const store = new PostgresConversationStore();
		const first = await store.findOrCreateConversation({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
		});
		const second = await store.findOrCreateConversation({
			organizationId: otherOrgId,
			customerPhone: CUSTOMER_PHONE,
		});

		expect(second.conversationId).not.toBe(first.conversationId);

		await db
			.delete(schema.organization)
			.where(eq(schema.organization.id, otherOrgId));
	});

	test("appends messages and returns them in order", async () => {
		const store = new PostgresConversationStore();
		const { conversationId } = await store.findOrCreateConversation({
			organizationId: ORG_ID,
			customerPhone: CUSTOMER_PHONE,
		});

		await store.appendMessage({
			conversationId,
			role: "user",
			content: "Oi, quero marcar um horário",
			waMessageId: "wamid.ONE",
		});
		await store.appendMessage({
			conversationId,
			role: "assistant",
			content: "Claro! Qual serviço você gostaria?",
		});

		expect(await store.getHistory(conversationId)).toEqual([
			{ role: "user", content: "Oi, quero marcar um horário" },
			{ role: "assistant", content: "Claro! Qual serviço você gostaria?" },
		]);
	});
});
