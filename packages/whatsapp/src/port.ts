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
	/** Marks an inbound message as read (blue ticks) in the customer's chat. */
	markAsRead(waMessageId: string): Promise<void>;
	sendText(input: SendTextInput): Promise<SendTextResult>;
	/**
	 * Marks the message as read and shows the "typing…" bubble in the
	 * customer's chat. Meta's API only exposes the typing indicator bundled
	 * with a read receipt in the same request — there's no way to show one
	 * without the other.
	 */
	showTypingIndicator(waMessageId: string): Promise<void>;
}
