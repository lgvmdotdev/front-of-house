import { beforeEach, describe, expect, test } from "bun:test";
import type { Interval } from "../availability";
import type { Professional, Service } from "../types";
import {
	type CalendarProfessional,
	GoogleCalendarBookingEngine,
} from "./adapter";
import type {
	CalendarClient,
	CalendarEvent,
	CalendarEventInput,
} from "./client";

const NO_SERVICE = /no service/i;
const NO_PROFESSIONAL = /no professional/i;
const DOES_NOT_PERFORM = /does not perform/i;
const NOT_AVAILABLE = /not available/i;
const NO_BOOKING = /no booking/i;

interface StoredEvent extends CalendarEvent {
	busy: boolean;
}

/** Hand-written in-memory {@link CalendarClient} — the external boundary's fake. */
class InMemoryCalendarClient implements CalendarClient {
	readonly #calendars = new Map<string, Map<string, StoredEvent>>();
	#sequence = 0;
	readonly #now: Date;

	constructor(calendarIds: readonly string[], now: Date) {
		for (const id of calendarIds) {
			this.#calendars.set(id, new Map());
		}
		this.#now = now;
	}

	/** Test helper: seed a raw event (e.g. the barber's personal entry). */
	seed(
		calendarId: string,
		event: Omit<StoredEvent, "created"> & { created?: Date }
	): void {
		const calendar = this.#require(calendarId);
		calendar.set(event.id, { created: this.#now, ...event });
	}

	freeBusy(
		calendarIds: readonly string[],
		timeMin: Date,
		timeMax: Date
	): Promise<Map<string, Interval[]>> {
		const result = new Map<string, Interval[]>();
		for (const id of calendarIds) {
			const events = [...this.#require(id).values()];
			result.set(
				id,
				events
					.filter(
						(event) => event.busy && this.#overlaps(event, timeMin, timeMax)
					)
					.map((event) => ({ start: event.start, end: event.end }))
			);
		}
		return Promise.resolve(result);
	}

	listEvents(
		calendarId: string,
		timeMin: Date,
		timeMax: Date,
		privateProperties?: Record<string, string>
	): Promise<CalendarEvent[]> {
		const events = [...this.#require(calendarId).values()].filter(
			(event) =>
				this.#overlaps(event, timeMin, timeMax) &&
				this.#matches(event, privateProperties)
		);
		return Promise.resolve(events.map((event) => this.#strip(event)));
	}

	getEvent(calendarId: string, eventId: string): Promise<CalendarEvent | null> {
		const event = this.#require(calendarId).get(eventId);
		return Promise.resolve(event ? this.#strip(event) : null);
	}

	insertEvent(
		calendarId: string,
		event: CalendarEventInput
	): Promise<CalendarEvent> {
		this.#sequence += 1;
		const stored: StoredEvent = {
			id: `evt-${this.#sequence}`,
			summary: event.summary,
			description: event.description ?? "",
			start: event.start,
			end: event.end,
			created: this.#now,
			privateProperties: event.privateProperties ?? {},
			busy: event.busy ?? true,
		};
		this.#require(calendarId).set(stored.id, stored);
		return Promise.resolve(this.#strip(stored));
	}

	patchEvent(
		calendarId: string,
		eventId: string,
		patch: Partial<CalendarEventInput>
	): Promise<CalendarEvent> {
		const calendar = this.#require(calendarId);
		const existing = calendar.get(eventId);
		if (!existing) {
			throw new Error(`No event ${eventId}`);
		}
		const updated: StoredEvent = {
			...existing,
			summary: patch.summary ?? existing.summary,
			description: patch.description ?? existing.description,
			start: patch.start ?? existing.start,
			end: patch.end ?? existing.end,
			busy: patch.busy ?? existing.busy,
			// Google merges private properties on patch.
			privateProperties: {
				...existing.privateProperties,
				...patch.privateProperties,
			},
		};
		calendar.set(eventId, updated);
		return Promise.resolve(this.#strip(updated));
	}

	deleteEvent(calendarId: string, eventId: string): Promise<void> {
		this.#require(calendarId).delete(eventId);
		return Promise.resolve();
	}

	#require(calendarId: string): Map<string, StoredEvent> {
		const calendar = this.#calendars.get(calendarId);
		if (!calendar) {
			throw new Error(`Unknown calendar ${calendarId}`);
		}
		return calendar;
	}

	#overlaps(event: StoredEvent, timeMin: Date, timeMax: Date): boolean {
		return (
			event.start.getTime() < timeMax.getTime() &&
			timeMin.getTime() < event.end.getTime()
		);
	}

	#matches(
		event: StoredEvent,
		privateProperties?: Record<string, string>
	): boolean {
		if (!privateProperties) {
			return true;
		}
		return Object.entries(privateProperties).every(
			([key, value]) => event.privateProperties[key] === value
		);
	}

	#strip(event: StoredEvent): CalendarEvent {
		const { busy, ...rest } = event;
		return { ...rest, privateProperties: { ...rest.privateProperties } };
	}
}

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

const NOW = new Date("2026-06-01T00:00:00Z");
const FRIDAY_9AM = new Date("2026-06-26T12:00:00Z");
const FRIDAY_10AM = new Date("2026-06-26T13:00:00Z");
const WINDOW = {
	from: new Date("2026-06-26T03:00:00Z"),
	to: new Date("2026-06-27T03:00:00Z"),
};

const CONFIG: CalendarProfessional[] = [
	{ professional: FELIPE, calendarId: "cal-felipe" },
	{ professional: BRUNO, calendarId: "cal-bruno" },
];

let client: InMemoryCalendarClient;
let engine: GoogleCalendarBookingEngine;

beforeEach(() => {
	client = new InMemoryCalendarClient(["cal-felipe", "cal-bruno"], NOW);
	engine = new GoogleCalendarBookingEngine({
		client,
		services: [CORTE, BARBA],
		professionals: CONFIG,
		now: () => NOW,
	});
});

describe("catalog", () => {
	test("lists configured services and professionals", async () => {
		expect((await engine.listServices()).map((s) => s.id)).toEqual([
			"svc-corte",
			"svc-barba",
		]);
		expect((await engine.listProfessionals()).map((p) => p.id)).toEqual([
			"pro-felipe",
			"pro-bruno",
		]);
	});
});

describe("getAvailability", () => {
	test("computes slots from the calendar's free time", async () => {
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

	test("blocks slots overlapping the barber's own calendar entries", async () => {
		client.seed("cal-felipe", {
			id: "personal-1",
			summary: "Almoço",
			description: "",
			start: FRIDAY_9AM,
			end: FRIDAY_10AM,
			privateProperties: {},
			busy: true,
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
	test("inserts an event and returns the booking with the event id", async () => {
		const booking = await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});
		expect(booking.id).toBe("evt-1");
		expect(booking.status).toBe("confirmed");
		expect(booking.end).toEqual(FRIDAY_10AM);
		expect((await engine.getBooking("evt-1"))?.customer.name).toBe("Ana");
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
	test("frees the slot and marks the booking cancelled", async () => {
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
	test("moves the event to a new free slot", async () => {
		const booking = await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});
		const moved = await engine.rescheduleBooking(booking.id, FRIDAY_10AM);

		expect(moved.start).toEqual(FRIDAY_10AM);
		expect((await engine.getBooking(booking.id))?.start).toEqual(FRIDAY_10AM);
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
});

describe("listBookings", () => {
	test("returns only our managed events, filtered", async () => {
		client.seed("cal-felipe", {
			id: "personal-1",
			summary: "Dentista",
			description: "",
			start: FRIDAY_10AM,
			end: new Date("2026-06-26T14:00:00Z"),
			privateProperties: {},
			busy: true,
		});
		const booking = await engine.createBooking({
			serviceId: "svc-corte",
			professionalId: "pro-felipe",
			customer: { name: "Ana", phone: "5511999998888" },
			start: FRIDAY_9AM,
		});

		const all = await engine.listBookings(WINDOW);
		expect(all.map((b) => b.id)).toEqual([booking.id]); // personal entry excluded

		await engine.cancelBooking(booking.id);
		expect(
			await engine.listBookings({ ...WINDOW, status: "confirmed" })
		).toHaveLength(0);
	});
});

test("getBooking returns null when absent", async () => {
	expect(await engine.getBooking("ghost")).toBeNull();
});

test("shared calendar: a booking blocks every barber on that calendar", async () => {
	const shared = new InMemoryCalendarClient(["cal-shop"], NOW);
	const brunoCorte: Professional = { ...BRUNO, serviceIds: ["svc-corte"] };
	const sharedEngine = new GoogleCalendarBookingEngine({
		client: shared,
		services: [CORTE],
		professionals: [
			{ professional: FELIPE, calendarId: "cal-shop" },
			{ professional: brunoCorte, calendarId: "cal-shop" },
		],
		now: () => NOW,
	});
	await sharedEngine.createBooking({
		serviceId: "svc-corte",
		professionalId: "pro-felipe",
		customer: { name: "Ana", phone: "5511999998888" },
		start: FRIDAY_9AM,
	});
	// Bruno shares the calendar, so Felipe's 9am booking blocks Bruno's 9am too.
	const brunoSlots = await sharedEngine.getAvailability({
		serviceId: "svc-corte",
		professionalId: "pro-bruno",
		...WINDOW,
	});
	expect(brunoSlots.map((s) => s.start.toISOString())).toEqual([
		"2026-06-26T13:00:00.000Z",
	]);
});
