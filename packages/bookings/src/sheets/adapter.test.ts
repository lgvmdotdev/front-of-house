import { beforeEach, describe, expect, test } from "bun:test";
import { SpreadsheetBookingEngine } from "./adapter";
import type { SheetsClient } from "./client";
import { SHEET_TABS } from "./layout";

const NO_SERVICE = /no service/i;
const DOES_NOT_PERFORM = /does not perform/i;
const NOT_AVAILABLE = /not available/i;
const NO_BOOKING = /no booking/i;

/** Hand-written in-memory {@link SheetsClient} — the external boundary's fake. */
class InMemorySheetsClient implements SheetsClient {
	readonly #tabs = new Map<string, string[][]>();

	constructor(initial: Record<string, string[][]>) {
		for (const [tab, grid] of Object.entries(initial)) {
			this.#tabs.set(
				tab,
				grid.map((row) => [...row])
			);
		}
	}

	getValues(tab: string): Promise<string[][]> {
		return Promise.resolve((this.#tabs.get(tab) ?? []).map((row) => [...row]));
	}

	appendRow(tab: string, values: readonly string[]): Promise<void> {
		const grid = this.#tabs.get(tab) ?? [];
		grid.push([...values]);
		this.#tabs.set(tab, grid);
		return Promise.resolve();
	}

	setRow(
		tab: string,
		rowNumber: number,
		values: readonly string[]
	): Promise<void> {
		const grid = this.#tabs.get(tab) ?? [];
		grid[rowNumber - 1] = [...values];
		this.#tabs.set(tab, grid);
		return Promise.resolve();
	}

	snapshot(tab: string): string[][] {
		return (this.#tabs.get(tab) ?? []).map((row) => [...row]);
	}
}

const FRIDAY_9AM = new Date("2026-06-26T12:00:00Z");
const FRIDAY_10AM = new Date("2026-06-26T13:00:00Z");
const WINDOW = {
	from: new Date("2026-06-26T03:00:00Z"),
	to: new Date("2026-06-27T03:00:00Z"),
};

function seedClient(): InMemorySheetsClient {
	return new InMemorySheetsClient({
		[SHEET_TABS.services]: [
			["id", "name", "duration_minutes", "price_cents"],
			["svc-corte", "Corte", "60", "5000"],
			["svc-barba", "Barba", "30", "3000"],
		],
		[SHEET_TABS.professionals]: [
			["id", "name", "service_ids"],
			["pro-felipe", "Felipe", "svc-corte,svc-barba"],
			["pro-bruno", "Bruno", "svc-barba"],
		],
		[SHEET_TABS.hours]: [
			["professional_id", "weekday", "start", "end"],
			["pro-felipe", "5", "09:00", "11:00"],
			["pro-bruno", "5", "09:00", "11:00"],
		],
		[SHEET_TABS.appointments]: [
			[
				"id",
				"service_id",
				"professional_id",
				"customer_name",
				"customer_phone",
				"start",
				"end",
				"status",
				"notes",
				"created_at",
			],
		],
	});
}

let client: InMemorySheetsClient;
let engine: SpreadsheetBookingEngine;

beforeEach(() => {
	client = seedClient();
	let counter = 0;
	engine = new SpreadsheetBookingEngine({
		client,
		now: () => new Date("2026-06-01T00:00:00Z"),
		idFactory: () => {
			counter += 1;
			return `bk-${counter}`;
		},
	});
});

describe("catalog", () => {
	test("reads services", async () => {
		expect((await engine.listServices()).map((s) => s.id)).toEqual([
			"svc-corte",
			"svc-barba",
		]);
	});

	test("reads professionals with assembled working hours", async () => {
		const professionals = await engine.listProfessionals();
		const felipe = professionals.find((p) => p.id === "pro-felipe");
		expect(felipe?.serviceIds).toEqual(["svc-corte", "svc-barba"]);
		expect(felipe?.workingHours).toEqual([
			{ weekday: 5, start: "09:00", end: "11:00" },
		]);
	});
});

describe("getAvailability", () => {
	test("computes slots from sheet data", async () => {
		const slots = await engine.getAvailability({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
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
});

describe("createBooking", () => {
	test("appends a confirmed row and persists it", async () => {
		const booking = await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});
		expect(booking.id).toBe("bk-1");

		const rows = client.snapshot(SHEET_TABS.appointments);
		expect(rows).toHaveLength(2); // header + one booking
		expect(rows[1]?.[0]).toBe("bk-1");
		expect(rows[1]?.[7]).toBe("confirmed");

		expect((await engine.getBooking("bk-1"))?.start).toEqual(FRIDAY_9AM);
	});

	test("removes the booked slot from later availability", async () => {
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

	test("rejects a mismatched professional", () => {
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

	test("rejects a double booking", async () => {
		await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});
		expect(
			engine.createBooking({
				serviceId: "svc-corte",
				professionalId: "pro-felipe",
				customer: { name: "Beto", phone: "5511888887777" },
				start: FRIDAY_9AM,
			})
		).rejects.toThrow(NOT_AVAILABLE);
	});
});

describe("cancelBooking", () => {
	test("flips the row status and frees the slot", async () => {
		const booking = await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});
		await engine.cancelBooking(booking.id);

		const rows = client.snapshot(SHEET_TABS.appointments);
		expect(rows[1]?.[7]).toBe("cancelled");
		expect(rows).toHaveLength(2); // updated in place, not appended

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
	test("updates the row in place", async () => {
		const booking = await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});
		const moved = await engine.rescheduleBooking(booking.id, FRIDAY_10AM);

		expect(moved.start).toEqual(FRIDAY_10AM);
		expect(client.snapshot(SHEET_TABS.appointments)).toHaveLength(2);
		expect((await engine.getBooking(booking.id))?.start).toEqual(FRIDAY_10AM);
	});

	test("rejects a clash", async () => {
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
		expect(
			await engine.listBookings({ ...WINDOW, status: "confirmed" })
		).toHaveLength(0);
	});
});

test("getBooking returns null when absent", async () => {
	expect(await engine.getBooking("ghost")).toBeNull();
});

test("tolerates reordered appointment columns on write", async () => {
	const reordered = new InMemorySheetsClient({
		[SHEET_TABS.services]: [
			["id", "name", "duration_minutes", "price_cents"],
			["svc-corte", "Corte", "60", "5000"],
		],
		[SHEET_TABS.professionals]: [
			["id", "name", "service_ids"],
			["pro-felipe", "Felipe", "svc-corte"],
		],
		[SHEET_TABS.hours]: [
			["professional_id", "weekday", "start", "end"],
			["pro-felipe", "5", "09:00", "11:00"],
		],
		// Header in a different order than canonical.
		[SHEET_TABS.appointments]: [
			[
				"status",
				"id",
				"start",
				"end",
				"service_id",
				"professional_id",
				"customer_name",
				"customer_phone",
				"notes",
				"created_at",
			],
		],
	});
	const e = new SpreadsheetBookingEngine({
		client: reordered,
		now: () => new Date("2026-06-01T00:00:00Z"),
		idFactory: () => "bk-x",
	});
	await e.createBooking({
		serviceId: "svc-corte",
		professionalId: "pro-felipe",
		customer: { name: "Ana", phone: "5511999998888" },
		start: FRIDAY_9AM,
	});
	// Round-trips back through the reordered header.
	expect((await e.getBooking("bk-x"))?.status).toBe("confirmed");
	expect(reordered.snapshot(SHEET_TABS.appointments)[1]?.[0]).toBe("confirmed");
});
