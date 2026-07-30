import { timingSafeEqual } from "node:crypto";
import { WebhookPayloadError } from "./errors";
import {
	type InboundMessage,
	metaWebhookPayloadSchema,
	textMessageSchema,
} from "./types";

const SUBSCRIBE_MODE = "subscribe";

/**
 * Handles Meta's `GET` webhook verification handshake. Returns the
 * `hub.challenge` to echo back when the mode/token match the shop's
 * configured verify token, `null` otherwise (caller should respond 403).
 */
export function verifyWebhookSubscription(
	query: URLSearchParams,
	verifyToken: string
): string | null {
	if (query.get("hub.mode") !== SUBSCRIBE_MODE) {
		return null;
	}
	if (query.get("hub.verify_token") !== verifyToken) {
		return null;
	}
	return query.get("hub.challenge");
}

/**
 * Verifies the `X-Hub-Signature-256` header Meta sends on every webhook
 * `POST`, using a constant-time comparison against the HMAC-SHA256 computed
 * over the raw request body with the app secret.
 */
export function verifySignature(
	rawBody: string,
	signatureHeader: string | null,
	appSecret: string
): boolean {
	if (!signatureHeader) {
		return false;
	}
	const [scheme, digest] = signatureHeader.split("=");
	if (scheme !== "sha256" || !digest) {
		return false;
	}

	const hasher = new Bun.CryptoHasher("sha256", appSecret);
	hasher.update(rawBody);
	const expected = hasher.digest("hex");

	const actualBytes = Buffer.from(digest, "hex");
	const expectedBytes = Buffer.from(expected, "hex");
	if (actualBytes.length !== expectedBytes.length) {
		return false;
	}
	return timingSafeEqual(actualBytes, expectedBytes);
}

/**
 * Parses a Meta WhatsApp Cloud API webhook payload into normalized text
 * messages. Non-text message types (image, audio, …) and delivery `statuses`
 * entries are silently skipped — they carry no customer text to act on.
 *
 * @throws {@link WebhookPayloadError} if the top-level envelope doesn't match
 * Meta's webhook shape at all.
 */
export function parseInboundMessages(payload: unknown): InboundMessage[] {
	const parsed = metaWebhookPayloadSchema.safeParse(payload);
	if (!parsed.success) {
		throw new WebhookPayloadError(parsed.error.message);
	}

	const messages: InboundMessage[] = [];
	for (const entry of parsed.data.entry) {
		for (const change of entry.changes) {
			const { phone_number_id: phoneNumberId } = change.value.metadata;
			for (const rawMessage of change.value.messages ?? []) {
				const message = textMessageSchema.safeParse(rawMessage);
				if (!message.success) {
					continue;
				}
				messages.push({
					waMessageId: message.data.id,
					phoneNumberId,
					from: message.data.from,
					timestamp: message.data.timestamp,
					type: "text",
					text: message.data.text.body,
				});
			}
		}
	}
	return messages;
}
