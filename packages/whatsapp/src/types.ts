import { z } from "zod";

export const textMessageSchema = z.object({
	from: z.string(),
	id: z.string(),
	timestamp: z.string(),
	type: z.literal("text"),
	text: z.object({ body: z.string() }),
});

const changeValueSchema = z.object({
	messaging_product: z.literal("whatsapp"),
	metadata: z.object({
		phone_number_id: z.string(),
		display_phone_number: z.string().optional(),
	}),
	// Other message types (image, audio, …) and delivery `statuses` also land
	// here; we only validate the shapes we act on, so leave these permissive.
	messages: z.array(z.unknown()).optional(),
	statuses: z.array(z.unknown()).optional(),
});

const changeSchema = z.object({
	field: z.string(),
	value: changeValueSchema,
});

const entrySchema = z.object({
	id: z.string(),
	changes: z.array(changeSchema),
});

/** Top-level envelope Meta `POST`s to the webhook on every event. */
export const metaWebhookPayloadSchema = z.object({
	object: z.literal("whatsapp_business_account"),
	entry: z.array(entrySchema),
});
export type MetaWebhookPayload = z.infer<typeof metaWebhookPayloadSchema>;

/**
 * Normalized inbound message — what we actually enqueue. One per text message
 * found across every entry/change in a webhook payload.
 */
export const inboundMessageSchema = z.object({
	waMessageId: z.string(),
	phoneNumberId: z.string(),
	from: z.string(),
	timestamp: z.string(),
	type: z.literal("text"),
	text: z.string(),
});
export type InboundMessage = z.infer<typeof inboundMessageSchema>;
