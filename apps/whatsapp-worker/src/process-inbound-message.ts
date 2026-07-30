import type { InboundMessage, WhatsAppClient } from "@workspace/whatsapp";

/**
 * MVP reply: acknowledge receipt so the pipeline is testable end-to-end.
 * Will be replaced by the AI receptionist's actual response.
 */
export const RECEIPT_TEXT =
	"Recebemos sua mensagem! Em breve alguém do time vai te responder por aqui. ✅";

/** Delay before showing the typing indicator, after marking the message read. */
export const MIN_TYPING_START_DELAY_MS = 1000;
export const MAX_TYPING_START_DELAY_MS = 2000;

/** Delay before sending the reply, after showing the typing indicator. */
export const MIN_REPLY_DELAY_MS = 3000;
export const MAX_REPLY_DELAY_MS = 10_000;

export interface ProcessInboundMessageOptions {
	/** Injectable sleep — real timer by default, tests inject a no-op. */
	wait?: (ms: number) => Promise<void>;
}

function randomDelayMs(minMs: number, maxMs: number): number {
	return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}

function realWait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Humanized reply sequence: mark read, pause, show typing, pause, reply.
 * Each step is spaced out so it doesn't read as an instant, obviously
 * automated response.
 */
export async function processInboundMessage(
	message: InboundMessage,
	client: WhatsAppClient,
	options: ProcessInboundMessageOptions = {}
): Promise<void> {
	const wait = options.wait ?? realWait;

	await client.markAsRead(message.waMessageId);
	await wait(
		randomDelayMs(MIN_TYPING_START_DELAY_MS, MAX_TYPING_START_DELAY_MS)
	);
	await client.showTypingIndicator(message.waMessageId);
	await wait(randomDelayMs(MIN_REPLY_DELAY_MS, MAX_REPLY_DELAY_MS));
	await client.sendText({ to: message.from, body: RECEIPT_TEXT });
}
