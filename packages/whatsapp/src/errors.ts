/**
 * Typed errors for the WhatsApp Cloud API integration. Handlers throw these so
 * callers (the Bun webhook server, the worker) can branch on failure kind
 * without string-matching.
 */

export type WhatsAppErrorCode =
	| "WEBHOOK_PAYLOAD_MALFORMED"
	| "API_REQUEST_FAILED";

/** Base class for every WhatsApp integration error. Carries a discriminant `code`. */
export class WhatsAppError extends Error {
	readonly code: WhatsAppErrorCode;

	constructor(code: WhatsAppErrorCode, message: string) {
		super(message);
		this.name = new.target.name;
		this.code = code;
	}
}

export class WebhookPayloadError extends WhatsAppError {
	constructor(message: string) {
		super(
			"WEBHOOK_PAYLOAD_MALFORMED",
			`Malformed WhatsApp webhook payload: ${message}`
		);
	}
}

export class WhatsAppApiError extends WhatsAppError {
	readonly status: number;
	readonly body: string;

	constructor(status: number, body: string) {
		super(
			"API_REQUEST_FAILED",
			`WhatsApp Cloud API request failed with status ${status}: ${body}`
		);
		this.status = status;
		this.body = body;
	}
}
