import {
	INBOUND_MESSAGE_QUEUE_NAME,
	INBOUND_MESSAGE_QUEUE_OPTIONS,
	type InboundMessage,
} from "@workspace/whatsapp";
import amqplib, { type Channel, type ChannelModel } from "amqplib";

/**
 * RabbitMQ-backed queue between this webhook receiver and the
 * `whatsapp-worker` app.
 */
export function createQueueClient(amqpUrl: string) {
	let connection: ChannelModel | null = null;
	let channel: Channel | null = null;
	let startPromise: Promise<void> | null = null;

	function ensureStarted(): Promise<void> {
		startPromise ??= (async () => {
			connection = await amqplib.connect(amqpUrl);
			connection.on("error", (error: unknown) => {
				process.stderr.write(`[amqp] connection error: ${String(error)}\n`);
			});
			channel = await connection.createChannel();
			await channel.assertQueue(
				INBOUND_MESSAGE_QUEUE_NAME,
				INBOUND_MESSAGE_QUEUE_OPTIONS
			);
		})();
		return startPromise;
	}

	return {
		start: ensureStarted,
		async stop(): Promise<void> {
			await channel?.close();
			await connection?.close();
		},
		async enqueue(messages: InboundMessage[]): Promise<void> {
			await ensureStarted();
			for (const message of messages) {
				channel?.sendToQueue(
					INBOUND_MESSAGE_QUEUE_NAME,
					Buffer.from(JSON.stringify(message)),
					{ persistent: true, contentType: "application/json" }
				);
			}
		},
	};
}
