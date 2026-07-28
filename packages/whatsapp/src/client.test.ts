import { describe, expect, test } from "bun:test";
import { MetaCloudApiClient } from "./client";
import { WhatsAppApiError } from "./errors";

interface CapturedRequest {
	body: unknown;
	headers: Record<string, string>;
	method: string | undefined;
	url: string;
}

function fakeFetch(responses: Array<{ status: number; body: unknown }>): {
	fetchImpl: typeof fetch;
	requests: CapturedRequest[];
} {
	const requests: CapturedRequest[] = [];
	let call = 0;
	const fetchImpl = ((input: string | URL | Request, init?: RequestInit) => {
		requests.push({
			url: String(input),
			method: init?.method,
			headers: Object.fromEntries(new Headers(init?.headers).entries()),
			body: init?.body ? JSON.parse(String(init.body)) : undefined,
		});
		const response = responses[call] ?? responses.at(-1);
		call += 1;
		return Promise.resolve(
			new Response(JSON.stringify(response?.body ?? {}), {
				status: response?.status ?? 200,
			})
		);
	}) as typeof fetch;
	return { fetchImpl, requests };
}

describe("MetaCloudApiClient.sendText", () => {
	test("posts a text message to the phone number's messages endpoint", async () => {
		const { fetchImpl, requests } = fakeFetch([
			{
				status: 200,
				body: {
					messaging_product: "whatsapp",
					messages: [{ id: "wamid.SENT1" }],
				},
			},
		]);
		const client = new MetaCloudApiClient({
			accessToken: "test-token",
			phoneNumberId: "123456123",
			fetchImpl,
		});

		const result = await client.sendText({
			to: "5547999998888",
			body: "Recebemos sua mensagem!",
		});

		expect(result).toEqual({ waMessageId: "wamid.SENT1" });
		expect(requests).toHaveLength(1);
		const [request] = requests;
		expect(request?.url).toBe(
			"https://graph.facebook.com/v22.0/123456123/messages"
		);
		expect(request?.method).toBe("POST");
		expect(request?.headers.authorization).toBe("Bearer test-token");
		expect(request?.headers["content-type"]).toBe("application/json");
		expect(request?.body).toEqual({
			messaging_product: "whatsapp",
			recipient_type: "individual",
			to: "5547999998888",
			type: "text",
			text: { body: "Recebemos sua mensagem!" },
		});
	});

	test("uses a custom API version when provided", async () => {
		const { fetchImpl, requests } = fakeFetch([
			{ status: 200, body: { messages: [{ id: "wamid.X" }] } },
		]);
		const client = new MetaCloudApiClient({
			accessToken: "test-token",
			phoneNumberId: "123456123",
			apiVersion: "v19.0",
			fetchImpl,
		});

		await client.sendText({ to: "5547999998888", body: "oi" });

		expect(requests[0]?.url).toBe(
			"https://graph.facebook.com/v19.0/123456123/messages"
		);
	});

	test("throws WhatsAppApiError when the API responds with a non-2xx status", async () => {
		const { fetchImpl } = fakeFetch([
			{ status: 401, body: { error: { message: "Invalid OAuth token" } } },
		]);
		const client = new MetaCloudApiClient({
			accessToken: "bad-token",
			phoneNumberId: "123456123",
			fetchImpl,
		});

		await expect(
			client.sendText({ to: "5547999998888", body: "oi" })
		).rejects.toThrow(WhatsAppApiError);
	});

	test("the thrown error carries the response status and body", async () => {
		const { fetchImpl } = fakeFetch([
			{ status: 401, body: { error: { message: "Invalid OAuth token" } } },
		]);
		const client = new MetaCloudApiClient({
			accessToken: "bad-token",
			phoneNumberId: "123456123",
			fetchImpl,
		});

		try {
			await client.sendText({ to: "5547999998888", body: "oi" });
			throw new Error("expected sendText to throw");
		} catch (error) {
			expect(error).toBeInstanceOf(WhatsAppApiError);
			const apiError = error as WhatsAppApiError;
			expect(apiError.status).toBe(401);
			expect(apiError.body).toContain("Invalid OAuth token");
		}
	});
});
