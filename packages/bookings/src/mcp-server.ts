import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BookingError } from "./errors";
import type { BookingEngine } from "./port";

// biome-ignore lint/style/useConsistentTypeDefinitions: must be a type alias — the MCP SDK's expected return type has an index signature only a type literal satisfies here
type ToolResult = {
	content: Array<{ text: string; type: "text" }>;
	isError?: boolean;
};

function ok(value: unknown): ToolResult {
	return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

async function guarded(run: () => Promise<unknown>): Promise<ToolResult> {
	try {
		return ok(await run());
	} catch (error) {
		if (error instanceof BookingError) {
			return {
				content: [{ type: "text", text: error.message }],
				isError: true,
			};
		}
		throw error;
	}
}

/**
 * Wraps a {@link BookingEngine} as an MCP server — the agent talks to
 * whichever concrete adapter a tenant is configured for entirely through
 * this fixed tool surface. New ERPs plug in as new `BookingEngine`
 * implementations without changing this file or the agent.
 */
export function createBookingsMcpServer(engine: BookingEngine): McpServer {
	const server = new McpServer({ name: "bookings", version: "1.0.0" });

	server.registerTool(
		"list_services",
		{
			description:
				"List the shop's service menu (name, price in cents BRL, duration in minutes).",
		},
		() => guarded(() => engine.listServices())
	);

	server.registerTool(
		"list_professionals",
		{
			description:
				"List the shop's barbers, the services each performs, and their weekly working hours.",
		},
		() => guarded(() => engine.listProfessionals())
	);

	server.registerTool(
		"get_availability",
		{
			description:
				"Find bookable openings for a service in a time window, optionally for one professional.",
			inputSchema: {
				serviceId: z.string(),
				professionalId: z.string().optional(),
				from: z
					.string()
					.describe("ISO 8601 instant — window start (inclusive)"),
				to: z.string().describe("ISO 8601 instant — window end (exclusive)"),
			},
		},
		({ serviceId, professionalId, from, to }) =>
			guarded(() =>
				engine.getAvailability({
					serviceId,
					professionalId,
					from: new Date(from),
					to: new Date(to),
				})
			)
	);

	server.registerTool(
		"create_booking",
		{
			description: "Book an appointment for a customer.",
			inputSchema: {
				serviceId: z.string(),
				professionalId: z.string(),
				customerName: z.string(),
				customerPhone: z.string(),
				start: z.string().describe("ISO 8601 instant"),
				notes: z.string().optional(),
			},
		},
		({
			serviceId,
			professionalId,
			customerName,
			customerPhone,
			start,
			notes,
		}) =>
			guarded(() =>
				engine.createBooking({
					serviceId,
					professionalId,
					customer: { name: customerName, phone: customerPhone },
					start: new Date(start),
					notes,
				})
			)
	);

	server.registerTool(
		"cancel_booking",
		{
			description: "Cancel an existing booking by id.",
			inputSchema: { bookingId: z.string() },
		},
		({ bookingId }) =>
			guarded(async () => {
				await engine.cancelBooking(bookingId);
				return { cancelled: true };
			})
	);

	server.registerTool(
		"reschedule_booking",
		{
			description: "Move an existing booking to a new start time.",
			inputSchema: {
				bookingId: z.string(),
				newStart: z.string().describe("ISO 8601 instant"),
			},
		},
		({ bookingId, newStart }) =>
			guarded(() => engine.rescheduleBooking(bookingId, new Date(newStart)))
	);

	server.registerTool(
		"list_bookings",
		{
			description:
				"List bookings overlapping a time window, optionally filtered by professional or status.",
			inputSchema: {
				from: z
					.string()
					.describe("ISO 8601 instant — window start (inclusive)"),
				to: z.string().describe("ISO 8601 instant — window end (exclusive)"),
				professionalId: z.string().optional(),
				status: z.enum(["confirmed", "cancelled"]).optional(),
			},
		},
		({ from, to, professionalId, status }) =>
			guarded(() =>
				engine.listBookings({
					from: new Date(from),
					to: new Date(to),
					professionalId,
					status,
				})
			)
	);

	server.registerTool(
		"get_booking",
		{
			description: "Get a single booking by id, or null if it doesn't exist.",
			inputSchema: { bookingId: z.string() },
		},
		({ bookingId }) => guarded(() => engine.getBooking(bookingId))
	);

	return server;
}
