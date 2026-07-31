import { fileURLToPath } from "node:url";
import {
	type Agent,
	ClaudeAgent,
	connectMcpServer,
	createAnthropicToolLoop,
	PostgresConversationStore,
} from "@workspace/agent";
import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";
import { env } from "@workspace/env/whatsapp-worker";
import {
	INBOUND_MESSAGE_QUEUE_NAME,
	INBOUND_MESSAGE_QUEUE_OPTIONS,
	inboundMessageSchema,
	MetaCloudApiClient,
} from "@workspace/whatsapp";
import amqplib from "amqplib";
import { processInboundMessage } from "./process-inbound-message";
import { TenantResolver } from "./tenant-resolver";

const PREFETCH_COUNT = 25;
const BOOKINGS_MCP_SERVER_ENTRYPOINT = fileURLToPath(
	import.meta.resolve("@workspace/bookings/mcp-server-stdio")
);

// Single global client — correct today because every tenant shares the one
// Meta App/number (see whatsapp-driver-decision memory). Once Embedded
// Signup gives each tenant its own number + access token, this needs the
// same per-tenant resolution TenantResolver does for the agent, keyed by
// `whatsappChannel` growing a credentials column.
const whatsappClient = new MetaCloudApiClient({
	accessToken: env.WHATSAPP_ACCESS_TOKEN,
	phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
	apiVersion: env.WHATSAPP_API_VERSION,
});

/** One bookings MCP server per tenant, spawned as a stdio child process. */
async function buildAgent(organizationId: string): Promise<Agent> {
	const organization = await db.query.organization.findFirst({
		where: eq(schema.organization.id, organizationId),
	});
	if (!organization) {
		throw new Error(`No organization found with id "${organizationId}"`);
	}

	const bookingsMcpClient = await connectMcpServer({
		command: "bun",
		args: ["run", BOOKINGS_MCP_SERVER_ENTRYPOINT],
		env: {
			ORGANIZATION_ID: organizationId,
			...(env.GOOGLE_SERVICE_ACCOUNT_EMAIL && {
				GOOGLE_SERVICE_ACCOUNT_EMAIL: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			}),
			...(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY && {
				GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:
					env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
			}),
		},
	});

	return new ClaudeAgent({
		bookingsMcpClient,
		conversationStore: new PostgresConversationStore(),
		runToolLoop: createAnthropicToolLoop(env.ANTHROPIC_API_KEY),
		shopName: organization.name,
	});
}

const tenantResolver = new TenantResolver({ buildAgent });

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

		const resolved = await tenantResolver.resolveAgent(message.phoneNumberId);
		if (!resolved) {
			process.stderr.write(
				`[whatsapp-worker] no tenant mapped for phoneNumberId "${message.phoneNumberId}" — dropping message\n`
			);
			channel.nack(msg, false, false);
			return;
		}

		await processInboundMessage(
			message,
			whatsappClient,
			resolved.agent,
			resolved.organizationId
		);
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
