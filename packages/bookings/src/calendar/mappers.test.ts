import { describe, expect, test } from "bun:test";
import type { Booking, Service } from "../types";
import type { CalendarEvent } from "./client";
import {
	bookingToEventInput,
	eventToBooking,
	isManaged,
	managedFilter,
} from "./mappers";

const APP = "recepcionai";

const CORTE: Service = {
	id: "svc-corte",
	name: "Corte",
	durationMinutes: 60,
	price: { amountCents: 5000, currency: "BRL" },
};

const BOOKING: Booking = {
	id: "evt-1",
	serviceId: "svc-corte",
	professionalId: "pro-felipe",
	customer: { name: "Ana", phone: "5511999998888" },
	start: new Date("2026-06-26T12:00:00Z"),
	end: new Date("2026-06-26T13:00:00Z"),
	status: "confirmed",
	notes: "cliente novo",
	createdAt: new Date("2026-06-01T00:00:00Z"),
};

function eventFor(booking: Booking, app = APP): CalendarEvent {
	const input = bookingToEventInput(booking, CORTE, app);
	return {
		id: booking.id,
		summary: input.summary,
		description: input.description ?? "",
		start: input.start,
		end: input.end,
		created: booking.createdAt,
		privateProperties: input.privateProperties ?? {},
	};
}

describe("bookingToEventInput", () => {
	test("builds a busy event for a confirmed booking", () => {
		const input = bookingToEventInput(BOOKING, CORTE, APP);
		expect(input.summary).toBe("Corte — Ana");
		expect(input.busy).toBe(true);
		expect(input.privateProperties).toMatchObject({
			app: APP,
			service_id: "svc-corte",
			professional_id: "pro-felipe",
			customer_phone: "5511999998888",
			status: "confirmed",
		});
	});

	test("marks a cancelled booking transparent", () => {
		const input = bookingToEventInput(
			{ ...BOOKING, status: "cancelled" },
			CORTE,
			APP
		);
		expect(input.busy).toBe(false);
		expect(input.privateProperties?.status).toBe("cancelled");
	});
});

describe("eventToBooking", () => {
	test("round-trips a booking through an event", () => {
		expect(eventToBooking(eventFor(BOOKING), APP)).toEqual(BOOKING);
	});

	test("drops notes when the description is empty", () => {
		const parsed = eventToBooking(
			eventFor({ ...BOOKING, notes: undefined }),
			APP
		);
		expect(parsed?.notes).toBeUndefined();
	});

	test("reads cancelled status back", () => {
		const parsed = eventToBooking(
			eventFor({ ...BOOKING, status: "cancelled" }),
			APP
		);
		expect(parsed?.status).toBe("cancelled");
	});

	test("returns null for an event without our marker", () => {
		expect(eventToBooking(eventFor(BOOKING, "someone-else"), APP)).toBeNull();
	});
});

describe("isManaged / managedFilter", () => {
	test("recognizes our own events", () => {
		expect(isManaged(eventFor(BOOKING), APP)).toBe(true);
		expect(isManaged(eventFor(BOOKING, "other"), APP)).toBe(false);
	});

	test("managedFilter targets the app marker", () => {
		expect(managedFilter(APP)).toEqual({ app: APP });
	});
});
