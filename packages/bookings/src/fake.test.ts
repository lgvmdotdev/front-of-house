import { beforeEach, describe, expect, test } from "bun:test";
import { FakeBookingEngine } from "./fake";
import type { Professional, Service } from "./types";

const NO_SERVICE = /no service/i;
const NO_PROFESSIONAL = /no professional/i;
const DOES_NOT_PERFORM = /does not perform/i;
const NOT_AVAILABLE = /not available/i;
const NO_BOOKING = /no booking/i;

const CORTE: Service = {
	id: "svc-corte",
	name: "Corte",
	durationMinutes: 60,
	price: { amountCents: 5000, currency: "BRL" },
};
const BARBA: Service = {
	id: "svc-barba",
	name: "Barba",
	durationMinutes: 30,
	price: { amountCents: 3000, currency: "BRL" },
};
// Friday 09:00–11:00 BRT → 12:00Z–14:00Z
const FELIPE: Professional = {
	id: "pro-felipe",
	name: "Felipe",
	serviceIds: ["svc-corte", "svc-barba"],
	workingHours: [{ weekday: 5, start: "09:00", end: "11:00" }],
};
const BRUNO: Professional = {
	id: "pro-bruno",
	name: "Bruno",
	serviceIds: ["svc-barba"],
	workingHours: [{ weekday: 5, start: "09:00", end: "11:00" }],
};

const FRIDAY_9AM = new Date("2026-06-26T12:00:00Z");
const FRIDAY_10AM = new Date("2026-06-26T13:00:00Z");
const WINDOW = {
	from: new Date("2026-06-26T03:00:00Z"),
	to: new Date("2026-06-27T03:00:00Z"),
};

let engine: FakeBookingEngine;

beforeEach(() => {
	engine = new FakeBookingEngine({
		services: [CORTE, BARBA],
		professionals: [FELIPE, BRUNO],
		now: () => new Date("2026-06-01T00:00:00Z"),
	});
});

describe("catalog", () => {
	test("lists services and professionals", async () => {
		expect(await engine.listServices()).toHaveLength(2);
		expect((await engine.listProfessionals()).map((p) => p.id)).toEqual([
			"pro-felipe",
			"pro-bruno",
		]);
	});
});

describe("getAvailability", () => {
	test("returns slots for a qualified professional", async () => {
		const slots = await engine.getAvailability({
			serviceId: "svc-corte",
			...WINDOW,
		});
		expect(slots.map((s) => s.start.toISOString())).toEqual([
			"2026-06-26T12:00:00.000Z",
			"2026-06-26T13:00:00.000Z",
		]);
	});

	test("throws for an unknown service", () => {
		expect(
			engine.getAvailability({ serviceId: "nope", ...WINDOW })
		).rejects.toThrow(NO_SERVICE);
	});

	test("throws for an unknown professional", () => {
		expect(
			engine.getAvailability({
				serviceId: "svc-corte",
				professionalId: "ghost",
				...WINDOW,
			})
		).rejects.toThrow(NO_PROFESSIONAL);
	});
});

describe("createBooking", () => {
	test("books a free slot and persists it", async () => {
		const booking = await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});
		expect(booking.id).toBeString();
		expect(booking.status).toBe("confirmed");
		expect(booking.end.toISOString()).toBe("2026-06-26T13:00:00.000Z");
		expect(booking.createdAt.toISOString()).toBe("2026-06-01T00:00:00.000Z");
		expect(await engine.getBooking(booking.id)).toEqual(booking);
	});

	test("removes the booked slot from availability", async () => {
		await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});
		const slots = await engine.getAvailability({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			...WINDOW,
		});
		expect(slots.map((s) => s.start.toISOString())).toEqual([
			"2026-06-26T13:00:00.000Z",
		]);
	});

	test("rejects a professional that doesn't perform the service", () => {
		expect(
			engine.createBooking({
				serviceId: "svc-corte",
				professionalId: "pro-bruno",
				customer: { name: "Ana", phone: "5511999998888" },
				start: FRIDAY_9AM,
			})
		).rejects.toThrow(DOES_NOT_PERFORM);
	});

	test("rejects a slot outside working hours", () => {
		expect(
			engine.createBooking({
				serviceId: "svc-corte",
				professionalId: "pro-felipe",
				customer: { name: "Ana", phone: "5511999998888" },
				start: new Date("2026-06-26T20:00:00Z"),
			})
		).rejects.toThrow(NOT_AVAILABLE);
	});

	test("rejects a double-booking", async () => {
		await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});
		expect(
			engine.createBooking({
				serviceId: "svc-barba",
				professionalId: "pro-felipe",
				customer: { name: "Beto", phone: "5511888887777" },
				start: FRIDAY_9AM,
			})
		).rejects.toThrow(NOT_AVAILABLE);
	});

	test("rejects an unknown service or professional", () => {
		expect(
			engine.createBooking({
				serviceId: "nope",
				professionalId: "pro-felipe",
				customer: { name: "Ana", phone: "5511999998888" },
				start: FRIDAY_9AM,
			})
		).rejects.toThrow(NO_SERVICE);
		expect(
			engine.createBooking({
				serviceId: "svc-corte",
				professionalId: "ghost",
				customer: { name: "Ana", phone: "5511999998888" },
				start: FRIDAY_9AM,
			})
		).rejects.toThrow(NO_PROFESSIONAL);
	});
});

describe("cancelBooking", () => {
	test("frees the slot again", async () => {
		const booking = await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});
		await engine.cancelBooking(booking.id);

		expect((await engine.getBooking(booking.id))?.status).toBe("cancelled");
		const slots = await engine.getAvailability({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			...WINDOW,
		});
		expect(slots).toHaveLength(2);
	});

	test("throws for an unknown booking", () => {
		expect(engine.cancelBooking("ghost")).rejects.toThrow(NO_BOOKING);
	});
});

describe("rescheduleBooking", () => {
	test("moves a booking to a new free slot", async () => {
		const booking = await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});
		const moved = await engine.rescheduleBooking(booking.id, FRIDAY_10AM);

		expect(moved.start.toISOString()).toBe("2026-06-26T13:00:00.000Z");
		expect(moved.end.toISOString()).toBe("2026-06-26T14:00:00.000Z");
		expect(moved.id).toBe(booking.id);
	});

	test("rejects a clash with another booking", async () => {
		await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});
		const second = await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Beto", phone: "5511888887777" },
			start: FRIDAY_10AM,
		});
		expect(engine.rescheduleBooking(second.id, FRIDAY_9AM)).rejects.toThrow(
			NOT_AVAILABLE
		);
	});

	test("throws for an unknown booking", () => {
		expect(engine.rescheduleBooking("ghost", FRIDAY_9AM)).rejects.toThrow(
			NO_BOOKING
		);
	});
});

describe("listBookings", () => {
	test("filters by window and status", async () => {
		const booking = await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});
		expect(await engine.listBookings(WINDOW)).toHaveLength(1);

		await engine.cancelBooking(booking.id);
		expect(await engine.listBookings(WINDOW)).toHaveLength(1);
		expect(
			await engine.listBookings({ ...WINDOW, status: "confirmed" })
		).toHaveLength(0);
		expect(
			await engine.listBookings({
				from: new Date("2026-07-01T00:00:00Z"),
				to: new Date("2026-07-02T00:00:00Z"),
			})
		).toHaveLength(0);
	});
});

test("getBooking returns null when not found", async () => {
	expect(await engine.getBooking("ghost")).toBeNull();
});
