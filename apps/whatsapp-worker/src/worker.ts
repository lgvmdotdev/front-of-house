import { env } from "@workspace/env/whatsapp-worker";
import {
	INBOUND_MESSAGE_QUEUE_NAME,
	INBOUND_MESSAGE_QUEUE_OPTIONS,
	inboundMessageSchema,
	MetaCloudApiClient,
} from "@workspace/whatsapp";
import amqplib from "amqplib";
import { processInboundMessage } from "./process-inbound-message";

const PREFETCH_COUNT = 25;

const client = new MetaCloudApiClient({
	accessToken: env.WHATSAPP_ACCESS_TOKEN,
	phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
	apiVersion: env.WHATSAPP_API_VERSION,
});

const connection = await amqplib.connect(env.AMQP_URL);
connection.on("error", (error: unknown) => {
	process.stderr.write(`[amqp] connection error: ${String(error)}\n`);
});

const channel = await connection.createChannel();
await channel.assertQueue(
	INBOUND_MESSAGE_QUEUE_NAME,
	INBOUND_MESSAGE_QUEUE_OPTIONS
);
await channel.prefetch(PREFETCH_COUNT);

await channel.consume(INBOUND_MESSAGE_QUEUE_NAME, async (msg) => {
	if (!msg) {
		return;
	}
	try {
		const data = JSON.parse(msg.content.toString());
		const message = inboundMessageSchema.parse(data);
		await processInboundMessage(message, client);
		channel.ack(msg);
	} catch (error) {
		process.stderr.write(
			`[whatsapp-worker] failed to process job: ${String(error)}\n`
		);
		// Drop rather than requeue — a malformed/failing message would otherwise
		// loop forever with no dead-letter queue wired up yet.
		channel.nack(msg, false, false);
	}
});

process.stdout.write("whatsapp-worker started\n");
