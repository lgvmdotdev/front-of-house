import {
	INBOUND_MESSAGE_QUEUE_NAME,
	INBOUND_MESSAGE_QUEUE_OPTIONS,
	type InboundMessage,
} from "@workspace/whatsapp";
import { PgBoss } from "pg-boss";

export interface QueueClient {
	enqueue(messages: InboundMessage[]): Promise<void>;
	start(): Promise<void>;
	stop(): Promise<void>;
}

/**
 * Postgres-backed queue (via pg-boss) between this webhook receiver and the
 * `whatsapp-worker` app. Runs on the same Postgres instance as the rest of
 * the app — no separate infra.
 */
export function createQueueClient(connectionString: string): QueueClient {
	const boss = new PgBoss(connectionString);
	boss.on("error", (error: unknown) => {
		process.stderr.write(`[pg-boss] ${String(error)}\n`);
	});

	let startPromise: Promise<void> | null = null;

	function ensureStarted(): Promise<void> {
		startPromise ??= boss.start().then(async () => {
			await boss.createQueue(
				INBOUND_MESSAGE_QUEUE_NAME,
				INBOUND_MESSAGE_QUEUE_OPTIONS
			);
		});
		return startPromise;
	}

	return {
		start: ensureStarted,
		stop: () => boss.stop(),
		async enqueue(messages) {
			await ensureStarted();
			for (const message of messages) {
				await boss.send(INBOUND_MESSAGE_QUEUE_NAME, message, {
					// Meta retries the webhook itself when it doesn't get a fast 200,
					// so a duplicate `waMessageId` would otherwise double-enqueue.
					singletonKey: message.waMessageId,
				});
			}
		},
	};
}
