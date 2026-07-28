// biome-ignore-all lint/performance/noBarrelFile: this is the package's public API surface

export { MetaCloudApiClient, type MetaCloudApiClientOptions } from "./client";
export {
	WebhookPayloadError,
	WebhookSignatureError,
	WebhookVerificationError,
	WhatsAppApiError,
	WhatsAppError,
	type WhatsAppErrorCode,
} from "./errors";
export { FakeWhatsAppClient } from "./fake";
export type {
	SendTextInput,
	SendTextResult,
	WhatsAppClient,
} from "./port";
export {
	INBOUND_MESSAGE_QUEUE_NAME,
	INBOUND_MESSAGE_QUEUE_OPTIONS,
} from "./queue";
export type {
	InboundMessage,
	MetaWebhookPayload,
	WebhookVerificationQuery,
} from "./types";
export {
	inboundMessageSchema,
	metaWebhookPayloadSchema,
	webhookVerificationQuerySchema,
} from "./types";
export {
	parseInboundMessages,
	verifySignature,
	verifyWebhookSubscription,
} from "./webhook";
