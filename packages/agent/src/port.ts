export interface RespondInput {
	/** WhatsApp `wa_id` — E.164 phone number, no leading `+`. */
	customerPhone: string;
	message: string;
	organizationId: string;
}

export interface RespondResult {
	reply: string;
}

/**
 * The WhatsApp worker's only dependency on "the AI part" — callers code
 * against this, not against a concrete LLM/tool-loop implementation, so
 * tests can use {@link FakeAgent} instead of calling a real model.
 */
export interface Agent {
	respond(input: RespondInput): Promise<RespondResult>;
}
