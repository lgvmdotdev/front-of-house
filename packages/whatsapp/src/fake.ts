import type { SendTextInput, SendTextResult, WhatsAppClient } from "./port";

/**
 * In-memory {@link WhatsAppClient}. The Cloud API is a true external
 * boundary, so this hand-written fake is the test seam — consumers (the
 * worker) depend on `WhatsAppClient` and get this in tests instead of a mock.
 */
export class FakeWhatsAppClient implements WhatsAppClient {
	readonly sent: SendTextInput[] = [];
	readonly readMessageIds: string[] = [];
	readonly typingIndicatorMessageIds: string[] = [];
	#sequence = 0;

	sendText(input: SendTextInput): Promise<SendTextResult> {
		this.sent.push(input);
		this.#sequence += 1;
		return Promise.resolve({ waMessageId: `fake-wamid-${this.#sequence}` });
	}

	markAsRead(waMessageId: string): Promise<void> {
		this.readMessageIds.push(waMessageId);
		return Promise.resolve();
	}

	showTypingIndicator(waMessageId: string): Promise<void> {
		this.typingIndicatorMessageIds.push(waMessageId);
		return Promise.resolve();
	}
}
