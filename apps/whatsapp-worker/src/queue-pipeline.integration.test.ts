import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	FakeWhatsAppClient,
	INBOUND_MESSAGE_QUEUE_NAME,
	INBOUND_MESSAGE_QUEUE_OPTIONS,
	type InboundMessage,
	inboundMessageSchema,
} from "@workspace/whatsapp";
import { PgBoss } from "pg-boss";
import { processInboundMessage } from "./process-inbound-message";

/**
 * Proves the webhook -> pg-boss -> worker pipeline works against a real
 * Postgres (per the project's no-mocking-the-DB rule), not just that each
 * side's logic is individually correct in isolation. Sends a job the same
 * way the webhook app's queue-client does, then runs it through the same
 * worker handler as production.
 *
 * Requires the local Postgres container up:
 *   bun run --filter @workspace/db db:start
 */

const DATABASE_URL =
	process.env.DATABASE_URL ??
	"postgres://postgres:password@localhost:5432/next-template";

describe("webhook -> pg-boss -> worker pipeline", () => {
	let boss: PgBoss;

	beforeAll(async () => {
		boss = new PgBoss(DATABASE_URL);
		await boss.start();
		await boss.createQueue(
			INBOUND_MESSAGE_QUEUE_NAME,
			INBOUND_MESSAGE_QUEUE_OPTIONS
		);
	});

	afterAll(async () => {
		await boss.stop({ graceful: false });
	});

	test("a message sent to the queue is picked up and gets a receipt sent", async () => {
		const client = new FakeWhatsAppClient();
		const message: InboundMessage = {
			waMessageId: `wamid.integration-${crypto.randomUUID()}`,
			phoneNumberId: "123456123",
			from: "5547999998888",
			timestamp: String(Date.now()),
			type: "text",
			text: "Oi, quero marcar um horário",
		};

		await boss.send(INBOUND_MESSAGE_QUEUE_NAME, message, {
			singletonKey: message.waMessageId,
		});

		const processed = new Promise<void>((resolve, reject) => {
			boss
				.work(INBOUND_MESSAGE_QUEUE_NAME, { batchSize: 1 }, async ([job]) => {
					try {
						const parsed = inboundMessageSchema.parse(job?.data);
						await processInboundMessage(parsed, client);
						resolve();
					} catch (error) {
						reject(error as Error);
					}
				})
				.catch(reject);
		});

		await processed;

		expect(client.sent).toHaveLength(1);
		expect(client.sent[0]?.to).toBe(message.from);
	}, 10_000);
});
