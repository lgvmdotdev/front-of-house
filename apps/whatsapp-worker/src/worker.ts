import { env } from "@workspace/env/whatsapp-worker";
import {
	INBOUND_MESSAGE_QUEUE_NAME,
	INBOUND_MESSAGE_QUEUE_OPTIONS,
	inboundMessageSchema,
	MetaCloudApiClient,
} from "@workspace/whatsapp";
import { PgBoss } from "pg-boss";
import { processInboundMessage } from "./process-inbound-message";

const BATCH_SIZE = 25;
const POLLING_INTERVAL_SECONDS = 1;

const client = new MetaCloudApiClient({
	accessToken: env.WHATSAPP_ACCESS_TOKEN,
	phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
	apiVersion: env.WHATSAPP_API_VERSION,
});

const boss = new PgBoss(env.DATABASE_URL);
boss.on("error", (error: unknown) => {
	process.stderr.write(`[pg-boss] ${String(error)}\n`);
});

await boss.start();
await boss.createQueue(
	INBOUND_MESSAGE_QUEUE_NAME,
	INBOUND_MESSAGE_QUEUE_OPTIONS
);

await boss.work(
	INBOUND_MESSAGE_QUEUE_NAME,
	{ batchSize: BATCH_SIZE, pollingIntervalSeconds: POLLING_INTERVAL_SECONDS },
	async (jobs) => {
		await Promise.all(
			jobs.map(async (job) => {
				const message = inboundMessageSchema.parse(job.data);
				await processInboundMessage(message, client);
			})
		);
	}
);

process.stdout.write("whatsapp-worker started\n");
