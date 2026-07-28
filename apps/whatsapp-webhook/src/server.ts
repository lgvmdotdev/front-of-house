import { env } from "@workspace/env/whatsapp-webhook";
import { handleIncomingWebhook, handleVerificationRequest } from "./handlers";
import { createQueueClient } from "./queue-client";

const DEFAULT_PORT = 8787;

const queue = createQueueClient(env.DATABASE_URL);
await queue.start();

const server = Bun.serve({
	port: env.PORT ? Number(env.PORT) : DEFAULT_PORT,
	async fetch(request) {
		const url = new URL(request.url);
		if (url.pathname !== "/webhook") {
			return new Response("Not Found", { status: 404 });
		}

		if (request.method === "GET") {
			return handleVerificationRequest(url, {
				verifyToken: env.WHATSAPP_VERIFY_TOKEN,
			});
		}

		if (request.method === "POST") {
			const rawBody = await request.text();
			return await handleIncomingWebhook(
				rawBody,
				request.headers.get("x-hub-signature-256"),
				{
					verifyToken: env.WHATSAPP_VERIFY_TOKEN,
					appSecret: env.WHATSAPP_APP_SECRET,
					enqueue: (messages) => queue.enqueue(messages),
				}
			);
		}

		return new Response("Method Not Allowed", { status: 405 });
	},
});

process.stdout.write(`whatsapp-webhook listening on :${server.port}\n`);
