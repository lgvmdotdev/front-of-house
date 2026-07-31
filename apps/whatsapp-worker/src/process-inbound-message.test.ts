import { describe, expect, test } from "bun:test";
import { FakeAgent } from "@workspace/agent";
import { FakeWhatsAppClient, type InboundMessage } from "@workspace/whatsapp";
import {
	MAX_REPLY_DELAY_MS,
	MAX_TYPING_START_DELAY_MS,
	MIN_REPLY_DELAY_MS,
	MIN_TYPING_START_DELAY_MS,
	processInboundMessage,
} from "./process-inbound-message";

const ORGANIZATION_ID = "org-1";
const MESSAGE: InboundMessage = {
	waMessageId: "wamid.ABC123",
	phoneNumberId: "123456123",
	from: "5547999998888",
	timestamp: "1735000000",
	type: "text",
	text: "Oi, quero marcar um horário",
};

function noWait() {
	return Promise.resolve();
}

describe("processInboundMessage", () => {
	test("sends the agent's reply back to the sender", async () => {
		const client = new FakeWhatsAppClient();
		const agent = new FakeAgent("Temos horário às 14h.");

		await processInboundMessage(MESSAGE, client, agent, ORGANIZATION_ID, {
			wait: noWait,
		});

		expect(client.sent).toEqual([
			{ to: MESSAGE.from, body: "Temos horário às 14h." },
		]);
	});

	test("asks the agent using the message's organization, sender, and text", async () => {
		const client = new FakeWhatsAppClient();
		const agent = new FakeAgent();

		await processInboundMessage(MESSAGE, client, agent, ORGANIZATION_ID, {
			wait: noWait,
		});

		expect(agent.calls).toEqual([
			{
				organizationId: ORGANIZATION_ID,
				customerPhone: MESSAGE.from,
				message: MESSAGE.text,
			},
		]);
	});

	test("marks the message as read immediately", async () => {
		const client = new FakeWhatsAppClient();
		const agent = new FakeAgent();

		await processInboundMessage(MESSAGE, client, agent, ORGANIZATION_ID, {
			wait: noWait,
		});

		expect(client.readMessageIds).toEqual([MESSAGE.waMessageId]);
	});

	test("shows a typing indicator before replying", async () => {
		const client = new FakeWhatsAppClient();
		const agent = new FakeAgent();

		await processInboundMessage(MESSAGE, client, agent, ORGANIZATION_ID, {
			wait: noWait,
		});

		expect(client.typingIndicatorMessageIds).toEqual([MESSAGE.waMessageId]);
	});

	test("marks read, waits, then shows typing, then waits again before sending", async () => {
		const client = new FakeWhatsAppClient();
		const agent = new FakeAgent();
		const snapshotsAtEachWait: Array<{
			read: string[];
			sent: unknown[];
			typing: string[];
		}> = [];
		const wait = () => {
			snapshotsAtEachWait.push({
				read: [...client.readMessageIds],
				typing: [...client.typingIndicatorMessageIds],
				sent: [...client.sent],
			});
			return Promise.resolve();
		};

		await processInboundMessage(MESSAGE, client, agent, ORGANIZATION_ID, {
			wait,
		});

		expect(snapshotsAtEachWait).toEqual([
			// before the read->typing pause: read fired, typing/reply have not
			{ read: [MESSAGE.waMessageId], typing: [], sent: [] },
			// before the typing->reply pause: typing fired, reply has not
			{ read: [MESSAGE.waMessageId], typing: [MESSAGE.waMessageId], sent: [] },
		]);
	});

	test("waits a short randomized delay between marking read and typing", async () => {
		const client = new FakeWhatsAppClient();
		const agent = new FakeAgent();
		const waitCalls: number[] = [];
		const wait = (ms: number) => {
			waitCalls.push(ms);
			return Promise.resolve();
		};

		await processInboundMessage(MESSAGE, client, agent, ORGANIZATION_ID, {
			wait,
		});

		expect(waitCalls[0]).toBeGreaterThanOrEqual(MIN_TYPING_START_DELAY_MS);
		expect(waitCalls[0]).toBeLessThanOrEqual(MAX_TYPING_START_DELAY_MS);
	});

	test("waits a longer randomized delay between typing and the reply", async () => {
		const client = new FakeWhatsAppClient();
		const agent = new FakeAgent();
		const waitCalls: number[] = [];
		const wait = (ms: number) => {
			waitCalls.push(ms);
			return Promise.resolve();
		};

		await processInboundMessage(MESSAGE, client, agent, ORGANIZATION_ID, {
			wait,
		});

		expect(waitCalls[1]).toBeGreaterThanOrEqual(MIN_REPLY_DELAY_MS);
		expect(waitCalls[1]).toBeLessThanOrEqual(MAX_REPLY_DELAY_MS);
	});
});
