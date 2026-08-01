import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db, schema } from "@workspace/db";
import { createTestOrg, dropTestOrg } from "@/lib/test-org";
import { getConversation, listConversations } from "./conversation-queries";
import { isConversationStatus } from "./conversation-status";

let orgId = "";
let otherOrgId = "";

beforeEach(async () => {
	orgId = await createTestOrg("conversation");
	otherOrgId = await createTestOrg("conversation-other");
});

afterEach(async () => {
	await dropTestOrg(orgId);
	await dropTestOrg(otherOrgId);
});

async function seedConversation(
	organizationId: string,
	options: { phone: string; status: string; messages?: string[] }
): Promise<string> {
	const id = crypto.randomUUID();
	await db.insert(schema.conversation).values({
		id,
		organizationId,
		customerPhone: options.phone,
		status: options.status,
		lastMessageAt: new Date(),
	});
	const messages = options.messages ?? [];
	for (const [index, content] of messages.entries()) {
		await db.insert(schema.conversationMessage).values({
			id: crypto.randomUUID(),
			conversationId: id,
			role: index % 2 === 0 ? "user" : "assistant",
			content,
			createdAt: new Date(Date.now() + index * 1000),
		});
	}
	return id;
}

describe("isConversationStatus", () => {
	test("accepts the three schema statuses and rejects anything else", () => {
		for (const status of ["open", "handed_off", "closed"]) {
			expect(isConversationStatus(status)).toBe(true);
		}
		for (const status of ["", "OPEN", "arquivada"]) {
			expect(isConversationStatus(status)).toBe(false);
		}
	});
});

describe("conversations", () => {
	test("lists newest first", async () => {
		await seedConversation(orgId, { phone: "5551111", status: "open" });
		await seedConversation(orgId, { phone: "5552222", status: "closed" });
		const conversations = await listConversations(orgId);
		expect(conversations).toHaveLength(2);
		expect(conversations[0]?.lastMessageAt.getTime()).toBeGreaterThanOrEqual(
			conversations[1]?.lastMessageAt.getTime() ?? 0
		);
	});

	test("filters by status", async () => {
		await seedConversation(orgId, { phone: "5551111", status: "open" });
		await seedConversation(orgId, { phone: "5552222", status: "handed_off" });
		await seedConversation(orgId, { phone: "5553333", status: "closed" });

		expect(await listConversations(orgId, "open")).toHaveLength(1);
		expect(await listConversations(orgId, "handed_off")).toHaveLength(1);
		expect(await listConversations(orgId, "closed")).toHaveLength(1);
		expect(await listConversations(orgId)).toHaveLength(3);
	});

	test("does not leak conversations across organizations", async () => {
		await seedConversation(orgId, { phone: "5551111", status: "open" });
		expect(await listConversations(otherOrgId)).toHaveLength(0);
	});

	test("reads a transcript in chronological order", async () => {
		const id = await seedConversation(orgId, {
			phone: "5551111",
			status: "open",
			messages: ["Oi", "Olá! Como posso ajudar?", "Quero cortar o cabelo"],
		});
		const thread = await getConversation(orgId, id);
		expect(thread?.messages.map((message) => message.content)).toEqual([
			"Oi",
			"Olá! Como posso ajudar?",
			"Quero cortar o cabelo",
		]);
		expect(thread?.messages.map((message) => message.role)).toEqual([
			"user",
			"assistant",
			"user",
		]);
	});

	test("returns null for a conversation belonging to another organization", async () => {
		const id = await seedConversation(orgId, {
			phone: "5551111",
			status: "open",
			messages: ["Segredo"],
		});
		expect(await getConversation(otherOrgId, id)).toBeNull();
	});

	test("returns null for an unknown id", async () => {
		expect(await getConversation(orgId, crypto.randomUUID())).toBeNull();
	});
});
