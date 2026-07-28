import { WhatsAppApiError } from "./errors";
import type { SendTextInput, SendTextResult, WhatsAppClient } from "./port";

const DEFAULT_API_VERSION = "v22.0";

export interface MetaCloudApiClientOptions {
	accessToken: string;
	/** Graph API version, e.g. `"v22.0"`. Defaults to {@link DEFAULT_API_VERSION}. */
	apiVersion?: string;
	/** Injectable seam for tests — defaults to the global `fetch`. */
	fetchImpl?: typeof fetch;
	phoneNumberId: string;
}

/** Response shape for the subset of the `/messages` payload we read. */
interface SendMessageResponse {
	messages?: Array<{ id: string }>;
}

/** Official WhatsApp Cloud API client (Meta Graph API). */
export class MetaCloudApiClient implements WhatsAppClient {
	readonly #accessToken: string;
	readonly #phoneNumberId: string;
	readonly #apiVersion: string;
	readonly #fetch: typeof fetch;

	constructor(options: MetaCloudApiClientOptions) {
		this.#accessToken = options.accessToken;
		this.#phoneNumberId = options.phoneNumberId;
		this.#apiVersion = options.apiVersion ?? DEFAULT_API_VERSION;
		this.#fetch = options.fetchImpl ?? fetch;
	}

	async sendText(input: SendTextInput): Promise<SendTextResult> {
		const url = `https://graph.facebook.com/${this.#apiVersion}/${this.#phoneNumberId}/messages`;
		const response = await this.#fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.#accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				messaging_product: "whatsapp",
				recipient_type: "individual",
				to: input.to,
				type: "text",
				text: { body: input.body },
			}),
		});

		const bodyText = await response.text();
		if (!response.ok) {
			throw new WhatsAppApiError(response.status, bodyText);
		}

		const parsed = JSON.parse(bodyText) as SendMessageResponse;
		const waMessageId = parsed.messages?.[0]?.id;
		if (!waMessageId) {
			throw new WhatsAppApiError(
				response.status,
				`Response missing messages[0].id: ${bodyText}`
			);
		}
		return { waMessageId };
	}
}
