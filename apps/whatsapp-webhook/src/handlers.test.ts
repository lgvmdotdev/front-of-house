import { describe, expect, test } from "bun:test";
import type { InboundMessage } from "@workspace/whatsapp";
import { handleIncomingWebhook, handleVerificationRequest } from "./handlers";

const VERIFY_TOKEN = "test-verify-token";
const APP_SECRET = "test-app-secret";

function signBody(body: string, secret: string): string {
	const hasher = new Bun.CryptoHasher("sha256", secret);
	hasher.update(body);
	return `sha256=${hasher.digest("hex")}`;
}

function textMessagePayload(text: string) {
	return {
		object: "whatsapp_business_account",
		entry: [
			{
				id: "waba-1",
				changes: [
					{
						field: "messages",
						value: {
							messaging_product: "whatsapp",
							metadata: { phone_number_id: "123456123" },
							messages: [
								{
									from: "5547999998888",
									id: "wamid.ABC123",
									timestamp: "1735000000",
									type: "text",
									text: { body: text },
								},
							],
						},
					},
				],
			},
		],
	};
}

function statusOnlyPayload() {
	return {
		object: "whatsapp_business_account",
		entry: [
			{
				id: "waba-1",
				changes: [
					{
						field: "messages",
						value: {
							messaging_product: "whatsapp",
							metadata: { phone_number_id: "123456123" },
							statuses: [{ id: "wamid.ABC", status: "delivered" }],
						},
					},
				],
			},
		],
	};
}

describe("handleVerificationRequest", () => {
	test("returns 200 with the challenge on a valid handshake", () => {
		const url = new URL(
			"https://example.com/webhook?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=987654"
		);

		const response = handleVerificationRequest(url, {
			verifyToken: VERIFY_TOKEN,
		});

		expect(response.status).toBe(200);
	});

	test("body echoes the challenge", async () => {
		const url = new URL(
			"https://example.com/webhook?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=987654"
		);

		const response = handleVerificationRequest(url, {
			verifyToken: VERIFY_TOKEN,
		});

		expect(await response.text()).toBe("987654");
	});

	test("returns 403 when the verify token is wrong", () => {
		const url = new URL(
			"https://example.com/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=987654"
		);

		const response = handleVerificationRequest(url, {
			verifyToken: VERIFY_TOKEN,
		});

		expect(response.status).toBe(403);
	});
});

describe("handleIncomingWebhook", () => {
	function enqueueCollector() {
		const enqueued: InboundMessage[][] = [];
		const enqueue = (messages: InboundMessage[]) => {
			enqueued.push(messages);
			return Promise.resolve();
		};
		return { enqueue, enqueued };
	}

	test("enqueues parsed text messages and responds 200", async () => {
		const { enqueue, enqueued } = enqueueCollector();
		const body = JSON.stringify(textMessagePayload("Oi, quero marcar horário"));

		const response = await handleIncomingWebhook(
			body,
			signBody(body, APP_SECRET),
			{
				verifyToken: VERIFY_TOKEN,
				appSecret: APP_SECRET,
				enqueue,
			}
		);

		expect(response.status).toBe(200);
		expect(enqueued).toHaveLength(1);
		expect(enqueued[0]?.[0]).toMatchObject({
			waMessageId: "wamid.ABC123",
			text: "Oi, quero marcar horário",
		});
	});

	test("rejects with 403 when the signature is invalid", async () => {
		const { enqueue, enqueued } = enqueueCollector();
		const body = JSON.stringify(textMessagePayload("oi"));

		const response = await handleIncomingWebhook(body, "sha256=deadbeef", {
			verifyToken: VERIFY_TOKEN,
			appSecret: APP_SECRET,
			enqueue,
		});

		expect(response.status).toBe(403);
		expect(enqueued).toHaveLength(0);
	});

	test("rejects with 400 on malformed JSON", async () => {
		const { enqueue } = enqueueCollector();
		const body = "{not json";

		const response = await handleIncomingWebhook(
			body,
			signBody(body, APP_SECRET),
			{
				verifyToken: VERIFY_TOKEN,
				appSecret: APP_SECRET,
				enqueue,
			}
		);

		expect(response.status).toBe(400);
	});

	test("rejects with 400 when the payload doesn't match Meta's webhook shape", async () => {
		const { enqueue } = enqueueCollector();
		const body = JSON.stringify({ not: "a webhook payload" });

		const response = await handleIncomingWebhook(
			body,
			signBody(body, APP_SECRET),
			{
				verifyToken: VERIFY_TOKEN,
				appSecret: APP_SECRET,
				enqueue,
			}
		);

		expect(response.status).toBe(400);
	});

	test("responds 200 without enqueuing for status-only (delivery receipt) payloads", async () => {
		const { enqueue, enqueued } = enqueueCollector();
		const body = JSON.stringify(statusOnlyPayload());

		const response = await handleIncomingWebhook(
			body,
			signBody(body, APP_SECRET),
			{
				verifyToken: VERIFY_TOKEN,
				appSecret: APP_SECRET,
				enqueue,
			}
		);

		expect(response.status).toBe(200);
		expect(enqueued).toHaveLength(0);
	});
});
