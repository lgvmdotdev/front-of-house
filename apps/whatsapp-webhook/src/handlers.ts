import {
	type InboundMessage,
	parseInboundMessages,
	verifySignature,
	verifyWebhookSubscription,
} from "@workspace/whatsapp";

export interface VerificationConfig {
	verifyToken: string;
}

export interface WebhookConfig {
	appSecret: string;
	enqueue: (messages: InboundMessage[]) => Promise<void>;
	verifyToken: string;
}

/** Meta's `GET` webhook verification handshake, run once when the webhook is registered. */
export function handleVerificationRequest(
	url: URL,
	config: VerificationConfig
): Response {
	const challenge = verifyWebhookSubscription(
		url.searchParams,
		config.verifyToken
	);
	if (challenge === null) {
		return new Response("Forbidden", { status: 403 });
	}
	return new Response(challenge, { status: 200 });
}

/**
 * Meta's `POST` webhook delivery. Verifies the signature, parses out any text
 * messages, and hands them to `enqueue`. Always responds fast (Meta retries
 * and eventually disables webhooks that are slow or non-200), so the actual
 * reply is sent asynchronously by the worker, not from here.
 */
export async function handleIncomingWebhook(
	rawBody: string,
	signatureHeader: string | null,
	config: WebhookConfig
): Promise<Response> {
	if (!verifySignature(rawBody, signatureHeader, config.appSecret)) {
		return new Response("Forbidden", { status: 403 });
	}

	let payload: unknown;
	try {
		payload = JSON.parse(rawBody);
	} catch {
		return new Response("Bad Request", { status: 400 });
	}

	let messages: InboundMessage[];
	try {
		messages = parseInboundMessages(payload);
	} catch {
		return new Response("Bad Request", { status: 400 });
	}

	if (messages.length > 0) {
		await config.enqueue(messages);
	}

	return new Response("EVENT_RECEIVED", { status: 200 });
}
