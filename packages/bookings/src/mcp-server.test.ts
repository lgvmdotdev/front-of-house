import { beforeEach, describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { FakeBookingEngine } from "./fake";
import { createBookingsMcpServer } from "./mcp-server";
import type { Professional, Service } from "./types";

const CORTE: Service = {
	id: "svc-corte",
	name: "Corte",
	durationMinutes: 60,
	price: { amountCents: 5000, currency: "BRL" },
};
const JOAO: Professional = {
	id: "prof-joao",
	name: "João",
	serviceIds: ["svc-corte"],
	workingHours: [{ weekday: 1, start: "09:00", end: "18:00" }],
};

function toolResultJson(
	result: Awaited<ReturnType<Client["callTool"]>>
): unknown {
	const [first] = result.content as Array<{ text?: string; type: string }>;
	return JSON.parse(first?.text ?? "null");
}

describe("createBookingsMcpServer", () => {
	let client: Client;

	beforeEach(async () => {
		const engine = new FakeBookingEngine({
			services: [CORTE],
			professionals: [JOAO],
			now: () => new Date("2026-06-29T12:00:00Z"), // a Monday
		});
		const server = createBookingsMcpServer(engine);

		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();
		client = new Client({ name: "test-client", version: "1.0.0" });
		await Promise.all([
			client.connect(clientTransport),
			server.connect(serverTransport),
		]);
	});

	test("lists the tool set the port exposes", async () => {
		const { tools } = await client.listTools();
		expect(tools.map((tool) => tool.name).sort()).toEqual([
			"cancel_booking",
			"create_booking",
			"get_availability",
			"get_booking",
			"list_bookings",
			"list_professionals",
			"list_services",
			"reschedule_booking",
		]);
	});

	test("list_services returns the seeded catalog", async () => {
		const result = await client.callTool({
			name: "list_services",
			arguments: {},
		});
		expect(toolResultJson(result)).toEqual([CORTE]);
	});

	test("list_professionals returns the seeded roster", async () => {
		const result = await client.callTool({
			name: "list_professionals",
			arguments: {},
		});
		expect(toolResultJson(result)).toEqual([JOAO]);
	});

	test("get_availability returns bookable slots", async () => {
		const result = await client.callTool({
			name: "get_availability",
			arguments: {
				serviceId: "svc-corte",
				from: "2026-06-29T12:00:00.000Z",
				to: "2026-06-29T15:00:00.000Z",
			},
		});
		const slots = toolResultJson(result) as Array<{ start: string }>;
		expect(slots.length).toBeGreaterThan(0);
	});

	test("create_booking then get_booking round-trips a real booking", async () => {
		const created = await client.callTool({
			name: "create_booking",
			arguments: {
				serviceId: "svc-corte",
				professionalId: "prof-joao",
				customerName: "Cliente Teste",
				customerPhone: "5547999998888",
				start: "2026-06-29T12:00:00.000Z",
			},
		});
		const booking = toolResultJson(created) as { id: string };
		expect(booking.id).toBeTruthy();

		const fetched = await client.callTool({
			name: "get_booking",
			arguments: { bookingId: booking.id },
		});
		expect(toolResultJson(fetched)).toMatchObject({
			id: booking.id,
			status: "confirmed",
		});
	});

	test("create_booking then cancel_booking frees the slot", async () => {
		const created = await client.callTool({
			name: "create_booking",
			arguments: {
				serviceId: "svc-corte",
				professionalId: "prof-joao",
				customerName: "Cliente Teste",
				customerPhone: "5547999998888",
				start: "2026-06-29T12:00:00.000Z",
			},
		});
		const booking = toolResultJson(created) as { id: string };

		await client.callTool({
			name: "cancel_booking",
			arguments: { bookingId: booking.id },
		});

		const fetched = await client.callTool({
			name: "get_booking",
			arguments: { bookingId: booking.id },
		});
		expect(toolResultJson(fetched)).toMatchObject({ status: "cancelled" });
	});

	test("reschedule_booking moves a booking to a new start time", async () => {
		const created = await client.callTool({
			name: "create_booking",
			arguments: {
				serviceId: "svc-corte",
				professionalId: "prof-joao",
				customerName: "Cliente Teste",
				customerPhone: "5547999998888",
				start: "2026-06-29T12:00:00.000Z",
			},
		});
		const booking = toolResultJson(created) as { id: string };

		const rescheduled = await client.callTool({
			name: "reschedule_booking",
			arguments: {
				bookingId: booking.id,
				newStart: "2026-06-29T13:00:00.000Z",
			},
		});

		expect(toolResultJson(rescheduled)).toMatchObject({
			id: booking.id,
			start: "2026-06-29T13:00:00.000Z",
		});
	});

	test("list_bookings filters by window", async () => {
		await client.callTool({
			name: "create_booking",
			arguments: {
				serviceId: "svc-corte",
				professionalId: "prof-joao",
				customerName: "Cliente Teste",
				customerPhone: "5547999998888",
				start: "2026-06-29T12:00:00.000Z",
			},
		});

		const result = await client.callTool({
			name: "list_bookings",
			arguments: {
				from: "2026-06-29T00:00:00.000Z",
				to: "2026-06-30T00:00:00.000Z",
			},
		});
		expect((toolResultJson(result) as unknown[]).length).toBe(1);
	});

	test("returns a structured tool error for a domain error (unknown service)", async () => {
		const result = await client.callTool({
			name: "get_availability",
			arguments: {
				serviceId: "svc-does-not-exist",
				from: "2026-06-29T12:00:00.000Z",
				to: "2026-06-29T15:00:00.000Z",
			},
		});
		expect(result.isError).toBe(true);
		const [first] = result.content as Array<{ text?: string }>;
		expect(first?.text).toContain("No service found");
	});
});
