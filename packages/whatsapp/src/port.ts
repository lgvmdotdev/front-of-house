export interface SendTextInput {
	body: string;
	/** Recipient's WhatsApp id (E.164 phone number, no leading `+`). */
	to: string;
}

export interface SendTextResult {
	waMessageId: string;
}

/**
 * Outbound side of the WhatsApp integration — sending messages. Callers (the
 * worker) code against this, not against the concrete Cloud API client, so
 * tests can use {@link FakeWhatsAppClient} instead of hitting Meta's API.
 */
export interface WhatsAppClient {
	sendText(input: SendTextInput): Promise<SendTextResult>;
}
