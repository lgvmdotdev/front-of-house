import { describe, expect, test } from "bun:test";
import { FakeConversationStore } from "./fake-conversation-store";

describe("FakeConversationStore", () => {
	test("creates a new conversation and returns the same one on repeat contact", async () => {
		const store = new FakeConversationStore();

		const first = await store.findOrCreateConversation({
			organizationId: "org-1",
			customerPhone: "5547999998888",
		});
		const second = await store.findOrCreateConversation({
			organizationId: "org-1",
			customerPhone: "5547999998888",
		});

		expect(second.conversationId).toBe(first.conversationId);
	});

	test("separates conversations by organization", async () => {
		const store = new FakeConversationStore();

		const first = await store.findOrCreateConversation({
			organizationId: "org-1",
			customerPhone: "5547999998888",
		});
		const second = await store.findOrCreateConversation({
			organizationId: "org-2",
			customerPhone: "5547999998888",
		});

		expect(second.conversationId).not.toBe(first.conversationId);
	});

	test("appends messages and returns them in order", async () => {
		const store = new FakeConversationStore();
		const { conversationId } = await store.findOrCreateConversation({
			organizationId: "org-1",
			customerPhone: "5547999998888",
		});

		await store.appendMessage({
			conversationId,
			role: "user",
			content: "oi",
		});
		await store.appendMessage({
			conversationId,
			role: "assistant",
			content: "olá!",
		});

		expect(await store.getHistory(conversationId)).toEqual([
			{ role: "user", content: "oi" },
			{ role: "assistant", content: "olá!" },
		]);
	});
});
