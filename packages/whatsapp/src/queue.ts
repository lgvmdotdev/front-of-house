/**
 * Name of the pg-boss queue the webhook app enqueues inbound messages onto,
 * and the worker app consumes from. Both apps import this constant instead of
 * hardcoding the string, so they can't drift apart.
 */
export const INBOUND_MESSAGE_QUEUE_NAME = "whatsapp-inbound-messages";

/**
 * Both apps call `createQueue` with this on startup (idempotent), so the
 * queue's policy/retry behavior can't diverge between them either.
 *
 * - `policy: "short"` gives a uniqueness constraint on `singletonKey` while a
 *   job is still queued — used to dedupe Meta's own webhook retries.
 * - `notify: true` uses Postgres LISTEN/NOTIFY for low-latency dispatch
 *   instead of relying solely on polling, which matters at the ~100
 *   messages/sec range this queue needs to sustain.
 */
export const INBOUND_MESSAGE_QUEUE_OPTIONS = {
	policy: "short",
	retryLimit: 3,
	retryBackoff: true,
	notify: true,
} as const;
