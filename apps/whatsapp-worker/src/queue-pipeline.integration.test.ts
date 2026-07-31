import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FakeAgent } from "@workspace/agent";
import {
	FakeWhatsAppClient,
	INBOUND_MESSAGE_QUEUE_NAME,
	INBOUND_MESSAGE_QUEUE_OPTIONS,
	type InboundMessage,
	inboundMessageSchema,
} from "@workspace/whatsapp";
import amqplib, { type Channel, type ChannelModel } from "amqplib";
import { processInboundMessage } from "./process-inbound-message";

const ORGANIZATION_ID = "org-1";

/**
 * Proves the webhook -> RabbitMQ -> worker pipeline works against a real
 * broker, not just that each side's logic is individually correct in
 * isolation. Publishes a job the same way the webhook app's queue-client
 * does, then runs it through the same worker handler as production.
 *
 * Requires the local RabbitMQ container up:
 *   bun run --filter @workspace/whatsapp mq:start
 */

const AMQP_URL = process.env.AMQP_URL ?? "amqp://guest:guest@localhost:5672";

/**
 * Uses a throwaway queue (real options, disposable name) rather than the
 * shared production queue name — a prior run whose test timed out can leave
 * a dead consumer registered on a durable queue for up to the broker's
 * heartbeat window, which then races a later run for message delivery and
 * causes spurious timeouts. Auto-delete + a random suffix sidesteps that.
 */
const TEST_QUEUE_NAME = `${INBOUND_MESSAGE_QUEUE_NAME}-test-${crypto.randomUUID()}`;

describe("webhook -> RabbitMQ -> worker pipeline", () => {
	let connection: ChannelModel;
	let channel: Channel;

	beforeAll(async () => {
		connection = await amqplib.connect(AMQP_URL);
		channel = await connection.createChannel();
		await channel.assertQueue(TEST_QUEUE_NAME, {
			...INBOUND_MESSAGE_QUEUE_OPTIONS,
			autoDelete: true,
		});
	});

	afterAll(async () => {
		await channel.deleteQueue(TEST_QUEUE_NAME);
		await channel.close();
		await connection.close();
	});

	test("a message published to the queue is picked up and gets a receipt sent", async () => {
		const client = new FakeWhatsAppClient();
		const agent = new FakeAgent("Temos horário disponível!");
		const message: InboundMessage = {
			waMessageId: `wamid.integration-${crypto.randomUUID()}`,
			phoneNumberId: "123456123",
			from: "5547999998888",
			timestamp: String(Date.now()),
			type: "text",
			text: "Oi, quero marcar um horário",
		};

		channel.sendToQueue(TEST_QUEUE_NAME, Buffer.from(JSON.stringify(message)), {
			persistent: true,
			contentType: "application/json",
		});

		const processed = new Promise<void>((resolve, reject) => {
			channel
				.consume(TEST_QUEUE_NAME, (msg) => {
					if (!msg) {
						return;
					}
					(async () => {
						try {
							const data = JSON.parse(msg.content.toString());
							const parsed = inboundMessageSchema.parse(data);
							// Skip the humanized reply delay — this test proves the
							// broker wiring works, not the timing behavior.
							await processInboundMessage(
								parsed,
								client,
								agent,
								ORGANIZATION_ID,
								{ wait: () => Promise.resolve() }
							);
							channel.ack(msg);
							resolve();
						} catch (error) {
							channel.nack(msg, false, false);
							reject(error as Error);
						}
					})();
				})
				.catch(reject);
		});

		await processed;

		expect(client.sent).toHaveLength(1);
		expect(client.sent[0]?.to).toBe(message.from);
	}, 10_000);
});
