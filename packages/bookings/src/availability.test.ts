import { describe, expect, test } from "bun:test";
import {
	computeAvailability,
	computeFreeSlots,
	computeSlotsFromBusy,
} from "./availability";
import type { Booking, Professional, Service } from "./types";

const iso = (value: string) => new Date(value);

describe("computeFreeSlots", () => {
	const window = {
		start: iso("2026-06-26T12:00:00Z"),
		end: iso("2026-06-26T15:00:00Z"),
	};

	test("fills an empty window with back-to-back slots", () => {
		const slots = computeFreeSlots({ window, busy: [], durationMinutes: 60 });
		expect(slots.map((s) => s.start.toISOString())).toEqual([
			"2026-06-26T12:00:00.000Z",
			"2026-06-26T13:00:00.000Z",
			"2026-06-26T14:00:00.000Z",
		]);
	});

	test("excludes slots overlapping a busy interval", () => {
		const slots = computeFreeSlots({
			window,
			busy: [
				{
					start: iso("2026-06-26T13:00:00Z"),
					end: iso("2026-06-26T14:00:00Z"),
				},
			],
			durationMinutes: 60,
		});
		expect(slots.map((s) => s.start.toISOString())).toEqual([
			"2026-06-26T12:00:00.000Z",
			"2026-06-26T14:00:00.000Z",
		]);
	});

	test("drops slots starting before notBefore", () => {
		const slots = computeFreeSlots({
			window,
			busy: [],
			durationMinutes: 60,
			notBefore: iso("2026-06-26T12:30:00Z"),
		});
		expect(slots.map((s) => s.start.toISOString())).toEqual([
			"2026-06-26T13:00:00.000Z",
			"2026-06-26T14:00:00.000Z",
		]);
	});

	test("honors a custom step granularity", () => {
		const slots = computeFreeSlots({
			window: {
				start: iso("2026-06-26T12:00:00Z"),
				end: iso("2026-06-26T14:00:00Z"),
			},
			busy: [],
			durationMinutes: 60,
			stepMinutes: 30,
		});
		expect(slots.map((s) => s.start.toISOString())).toEqual([
			"2026-06-26T12:00:00.000Z",
			"2026-06-26T12:30:00.000Z",
			"2026-06-26T13:00:00.000Z",
		]);
	});

	test("returns nothing when the window is shorter than the service", () => {
		expect(
			computeFreeSlots({
				window: {
					start: iso("2026-06-26T12:00:00Z"),
					end: iso("2026-06-26T12:30:00Z"),
				},
				busy: [],
				durationMinutes: 60,
			})
		).toEqual([]);
	});
});

describe("computeAvailability", () => {
	const corte: Service = {
		id: "svc-corte",
		name: "Corte",
		durationMinutes: 60,
		price: { amountCents: 5000, currency: "BRL" },
	};

	// Friday 09:00–11:00 BRT  →  12:00Z–14:00Z
	const felipe: Professional = {
		id: "pro-felipe",
		name: "Felipe",
		serviceIds: ["svc-corte"],
		workingHours: [{ weekday: 5, start: "09:00", end: "11:00" }],
	};

	const friday = {
		from: iso("2026-06-26T03:00:00Z"), // Fri 00:00 BRT
		to: iso("2026-06-27T03:00:00Z"), // Sat 00:00 BRT
	};

	test("produces slots within working hours", () => {
		const slots = computeAvailability({
			query: { serviceId: "svc-corte", from: friday.from, to: friday.to },
			service: corte,
			professionals: [felipe],
			bookings: [],
		});
		expect(slots).toEqual([
			{
				start: iso("2026-06-26T12:00:00Z"),
				end: iso("2026-06-26T13:00:00Z"),
				professionalId: "pro-felipe",
			},
			{
				start: iso("2026-06-26T13:00:00Z"),
				end: iso("2026-06-26T14:00:00Z"),
				professionalId: "pro-felipe",
			},
		]);
	});

	test("excludes professionals who don't perform the service", () => {
		const barberWithoutCorte: Professional = {
			...felipe,
			id: "pro-other",
			serviceIds: ["svc-barba"],
		};
		const slots = computeAvailability({
			query: { serviceId: "svc-corte", from: friday.from, to: friday.to },
			service: corte,
			professionals: [barberWithoutCorte],
			bookings: [],
		});
		expect(slots).toEqual([]);
	});

	test("subtracts existing confirmed bookings", () => {
		const existing: Booking = {
			id: "bk-1",
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Cliente", phone: "5511999998888" },
			start: iso("2026-06-26T12:00:00Z"),
			end: iso("2026-06-26T13:00:00Z"),
			status: "confirmed",
			createdAt: iso("2026-06-20T00:00:00Z"),
		};
		const slots = computeAvailability({
			query: { serviceId: "svc-corte", from: friday.from, to: friday.to },
			service: corte,
			professionals: [felipe],
			bookings: [existing],
		});
		expect(slots.map((s) => s.start.toISOString())).toEqual([
			"2026-06-26T13:00:00.000Z",
		]);
	});

	test("ignores cancelled bookings when computing busy time", () => {
		const cancelled: Booking = {
			id: "bk-2",
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Cliente", phone: "5511999998888" },
			start: iso("2026-06-26T12:00:00Z"),
			end: iso("2026-06-26T13:00:00Z"),
			status: "cancelled",
			createdAt: iso("2026-06-20T00:00:00Z"),
		};
		const slots = computeAvailability({
			query: { serviceId: "svc-corte", from: friday.from, to: friday.to },
			service: corte,
			professionals: [felipe],
			bookings: [cancelled],
		});
		expect(slots).toHaveLength(2);
	});

	test("restricts to one professional when requested", () => {
		const bruno: Professional = {
			id: "pro-bruno",
			name: "Bruno",
			serviceIds: ["svc-corte"],
			workingHours: [{ weekday: 5, start: "09:00", end: "11:00" }],
		};
		const slots = computeAvailability({
			query: {
				serviceId: "svc-corte",
				professionalId: "pro-felipe",
				from: friday.from,
				to: friday.to,
			},
			service: corte,
			professionals: [felipe, bruno],
			bookings: [],
		});
		expect(slots.every((s) => s.professionalId === "pro-felipe")).toBe(true);
		expect(slots).toHaveLength(2);
	});

	test("subtracts busy intervals supplied directly (freebusy source)", () => {
		const slots = computeSlotsFromBusy({
			query: { serviceId: "svc-corte", from: friday.from, to: friday.to },
			service: corte,
			professionals: [felipe],
			busyByProfessional: new Map([
				[
					"pro-felipe",
					[
						{
							start: iso("2026-06-26T12:00:00Z"),
							end: iso("2026-06-26T13:00:00Z"),
						},
					],
				],
			]),
		});
		expect(slots.map((s) => s.start.toISOString())).toEqual([
			"2026-06-26T13:00:00.000Z",
		]);
	});

	test("sorts slots by start then professional", () => {
		const bruno: Professional = {
			id: "pro-bruno",
			name: "Bruno",
			serviceIds: ["svc-corte"],
			workingHours: [{ weekday: 5, start: "09:00", end: "11:00" }],
		};
		const slots = computeAvailability({
			query: { serviceId: "svc-corte", from: friday.from, to: friday.to },
			service: corte,
			professionals: [felipe, bruno],
			bookings: [],
		});
		// Two pros, two slots each, interleaved by time then id.
		expect(
			slots.map((s) => `${s.start.toISOString()}|${s.professionalId}`)
		).toEqual([
			"2026-06-26T12:00:00.000Z|pro-bruno",
			"2026-06-26T12:00:00.000Z|pro-felipe",
			"2026-06-26T13:00:00.000Z|pro-bruno",
			"2026-06-26T13:00:00.000Z|pro-felipe",
		]);
	});
});
