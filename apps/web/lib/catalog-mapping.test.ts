import { describe, expect, test } from "bun:test";
import { toBookingProfessional, toBookingService } from "./catalog-mapping";

describe("toBookingService", () => {
	test("maps a row to a bookings Service with BRL price", () => {
		expect(
			toBookingService({
				id: "svc-1",
				name: "Corte",
				durationMinutes: 60,
				priceCents: 5000,
			})
		).toEqual({
			id: "svc-1",
			name: "Corte",
			durationMinutes: 60,
			price: { amountCents: 5000, currency: "BRL" },
		});
	});
});

describe("toBookingProfessional", () => {
	test("maps a row with services and working hours", () => {
		expect(
			toBookingProfessional({
				id: "pro-1",
				name: "Felipe",
				serviceIds: ["svc-1", "svc-2"],
				workingHours: [{ weekday: 5, start: "09:00", end: "18:00" }],
			})
		).toEqual({
			id: "pro-1",
			name: "Felipe",
			serviceIds: ["svc-1", "svc-2"],
			workingHours: [{ weekday: 5, start: "09:00", end: "18:00" }],
		});
	});

	test("produces an empty services/hours list when none are set", () => {
		const mapped = toBookingProfessional({
			id: "pro-2",
			name: "Bruno",
			serviceIds: [],
			workingHours: [],
		});
		expect(mapped.serviceIds).toEqual([]);
		expect(mapped.workingHours).toEqual([]);
	});
});
