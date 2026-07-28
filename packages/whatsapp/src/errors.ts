/**
 * Typed errors for the WhatsApp Cloud API integration. Handlers throw these so
 * callers (the Bun webhook server, the worker) can branch on failure kind
 * without string-matching.
 */

export type WhatsAppErrorCode =
	| "WEBHOOK_VERIFICATION_FAILED"
	| "WEBHOOK_SIGNATURE_INVALID"
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

export class WebhookVerificationError extends WhatsAppError {
	constructor() {
		super(
			"WEBHOOK_VERIFICATION_FAILED",
			"hub.mode/hub.verify_token did not match the configured verify token"
		);
	}
}

export class WebhookSignatureError extends WhatsAppError {
	constructor() {
		super(
			"WEBHOOK_SIGNATURE_INVALID",
			"X-Hub-Signature-256 did not match the HMAC computed for the request body"
		);
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
