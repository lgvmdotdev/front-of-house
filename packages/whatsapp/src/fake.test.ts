import { describe, expect, test } from "bun:test";
import { FakeWhatsAppClient } from "./fake";

describe("FakeWhatsAppClient", () => {
	test("records every sent message", async () => {
		const client = new FakeWhatsAppClient();

		await client.sendText({ to: "5547999998888", body: "primeira" });
		await client.sendText({ to: "5547988887777", body: "segunda" });

		expect(client.sent).toEqual([
			{ to: "5547999998888", body: "primeira" },
			{ to: "5547988887777", body: "segunda" },
		]);
	});

	test("returns a distinct waMessageId per send", async () => {
		const client = new FakeWhatsAppClient();

		const first = await client.sendText({ to: "5547999998888", body: "a" });
		const second = await client.sendText({ to: "5547999998888", body: "b" });

		expect(first.waMessageId).not.toBe(second.waMessageId);
	});

	test("records every message marked as read", async () => {
		const client = new FakeWhatsAppClient();

		await client.markAsRead("wamid.ONE");
		await client.markAsRead("wamid.TWO");

		expect(client.readMessageIds).toEqual(["wamid.ONE", "wamid.TWO"]);
	});

	test("records every typing indicator shown", async () => {
		const client = new FakeWhatsAppClient();

		await client.showTypingIndicator("wamid.ONE");

		expect(client.typingIndicatorMessageIds).toEqual(["wamid.ONE"]);
	});
});
