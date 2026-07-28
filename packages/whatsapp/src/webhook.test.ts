import { describe, expect, test } from "bun:test";
import { WebhookPayloadError } from "./errors";
import {
	parseInboundMessages,
	verifySignature,
	verifyWebhookSubscription,
} from "./webhook";

const VERIFY_TOKEN = "test-verify-token";
const APP_SECRET = "test-app-secret";

function signBody(body: string, secret: string): string {
	const hasher = new Bun.CryptoHasher("sha256", secret);
	hasher.update(body);
	return `sha256=${hasher.digest("hex")}`;
}

describe("verifyWebhookSubscription", () => {
	test("returns the challenge when mode and token match", () => {
		const result = verifyWebhookSubscription(
			{
				"hub.mode": "subscribe",
				"hub.verify_token": VERIFY_TOKEN,
				"hub.challenge": "1234567890",
			},
			VERIFY_TOKEN
		);
		expect(result).toBe("1234567890");
	});

	test("returns null when the mode is not subscribe", () => {
		const result = verifyWebhookSubscription(
			{
				"hub.mode": "unsubscribe",
				"hub.verify_token": VERIFY_TOKEN,
				"hub.challenge": "1234567890",
			},
			VERIFY_TOKEN
		);
		expect(result).toBeNull();
	});

	test("returns null when the verify token does not match", () => {
		const result = verifyWebhookSubscription(
			{
				"hub.mode": "subscribe",
				"hub.verify_token": "wrong-token",
				"hub.challenge": "1234567890",
			},
			VERIFY_TOKEN
		);
		expect(result).toBeNull();
	});

	test("returns null when required query params are missing", () => {
		const result = verifyWebhookSubscription(
			{ "hub.mode": "subscribe" },
			VERIFY_TOKEN
		);
		expect(result).toBeNull();
	});
});

describe("verifySignature", () => {
	const body = JSON.stringify({ hello: "world" });

	test("returns true for a signature matching the computed HMAC", () => {
		expect(verifySignature(body, signBody(body, APP_SECRET), APP_SECRET)).toBe(
			true
		);
	});

	test("returns false when the signature was computed with a different secret", () => {
		expect(
			verifySignature(body, signBody(body, "wrong-secret"), APP_SECRET)
		).toBe(false);
	});

	test("returns false when the body was tampered with after signing", () => {
		const signature = signBody(body, APP_SECRET);
		expect(verifySignature(`${body}tampered`, signature, APP_SECRET)).toBe(
			false
		);
	});

	test("returns false when the header is missing", () => {
		expect(verifySignature(body, null, APP_SECRET)).toBe(false);
	});

	test("returns false when the header lacks the sha256= prefix", () => {
		const hasher = new Bun.CryptoHasher("sha256", APP_SECRET);
		hasher.update(body);
		expect(verifySignature(body, hasher.digest("hex"), APP_SECRET)).toBe(false);
	});
});

describe("parseInboundMessages", () => {
	function payloadWith(...messages: unknown[]) {
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
								metadata: {
									phone_number_id: "123456123",
									display_phone_number: "16505551111",
								},
								messages,
							},
						},
					],
				},
			],
		};
	}

	test("extracts a single text message", () => {
		const payload = payloadWith({
			from: "5547999998888",
			id: "wamid.ABC123",
			timestamp: "1735000000",
			type: "text",
			text: { body: "Oi, queria marcar um horário" },
		});

		expect(parseInboundMessages(payload)).toEqual([
			{
				waMessageId: "wamid.ABC123",
				phoneNumberId: "123456123",
				from: "5547999998888",
				timestamp: "1735000000",
				type: "text",
				text: "Oi, queria marcar um horário",
			},
		]);
	});

	test("extracts messages across multiple entries and changes", () => {
		const payload = {
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
										id: "wamid.ONE",
										timestamp: "1735000000",
										type: "text",
										text: { body: "primeira" },
									},
								],
							},
						},
					],
				},
				{
					id: "waba-2",
					changes: [
						{
							field: "messages",
							value: {
								messaging_product: "whatsapp",
								metadata: { phone_number_id: "999999999" },
								messages: [
									{
										from: "5547988887777",
										id: "wamid.TWO",
										timestamp: "1735000001",
										type: "text",
										text: { body: "segunda" },
									},
								],
							},
						},
					],
				},
			],
		};

		expect(parseInboundMessages(payload).map((m) => m.waMessageId)).toEqual([
			"wamid.ONE",
			"wamid.TWO",
		]);
	});

	test("skips non-text message types instead of throwing", () => {
		const payload = payloadWith(
			{
				from: "5547999998888",
				id: "wamid.IMG",
				timestamp: "1735000000",
				type: "image",
				image: { id: "media-1" },
			},
			{
				from: "5547999998888",
				id: "wamid.TXT",
				timestamp: "1735000001",
				type: "text",
				text: { body: "só isso" },
			}
		);

		expect(parseInboundMessages(payload).map((m) => m.waMessageId)).toEqual([
			"wamid.TXT",
		]);
	});

	test("returns an empty array for a status-only payload (delivery receipts)", () => {
		const payload = {
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

		expect(parseInboundMessages(payload)).toEqual([]);
	});

	test("throws WebhookPayloadError for a malformed top-level payload", () => {
		expect(() => parseInboundMessages({ not: "a webhook payload" })).toThrow(
			WebhookPayloadError
		);
	});
});
