import type { SendTextInput, SendTextResult, WhatsAppClient } from "./port";

/**
 * In-memory {@link WhatsAppClient}. The Cloud API is a true external
 * boundary, so this hand-written fake is the test seam — consumers (the
 * worker) depend on `WhatsAppClient` and get this in tests instead of a mock.
 */
export class FakeWhatsAppClient implements WhatsAppClient {
	readonly sent: SendTextInput[] = [];
	#sequence = 0;

	sendText(input: SendTextInput): Promise<SendTextResult> {
		this.sent.push(input);
		this.#sequence += 1;
		return Promise.resolve({ waMessageId: `fake-wamid-${this.#sequence}` });
	}
}
