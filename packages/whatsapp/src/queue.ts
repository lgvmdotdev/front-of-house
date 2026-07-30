/**
 * Name of the RabbitMQ queue the webhook app publishes inbound messages onto,
 * and the worker app consumes from. Both apps import this constant instead of
 * hardcoding the string, so they can't drift apart.
 */
export const INBOUND_MESSAGE_QUEUE_NAME = "whatsapp-inbound-messages";

/**
 * Both apps call `channel.assertQueue` with this on startup (idempotent —
 * asserting a queue with matching options is a no-op if it already exists),
 * so the queue's durability can't diverge between producer and consumer.
 *
 * `durable: true` means the queue survives a RabbitMQ restart; messages are
 * still published with `{ persistent: true }` on the send side so they
 * survive too — durability requires both.
 */
export const INBOUND_MESSAGE_QUEUE_OPTIONS = {
	durable: true,
} as const;
