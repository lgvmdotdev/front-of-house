import { describe, expect, test } from "bun:test";
import {
	professionalInputSchema,
	serviceInputSchema,
	workingHourInputSchema,
} from "./catalog-schema";

const validService = {
	name: "Corte",
	durationMinutes: 60,
	priceCents: 5000,
	active: true,
};

const validProfessional = {
	name: "Felipe",
	serviceIds: [] as string[],
	workingHours: [] as { weekday: number; start: string; end: string }[],
	active: true,
};

describe("serviceInputSchema", () => {
	test("accepts a valid service", () => {
		expect(serviceInputSchema.safeParse(validService).success).toBe(true);
	});

	test("trims the name", () => {
		const parsed = serviceInputSchema.parse({
			...validService,
			name: "  Corte  ",
		});
		expect(parsed.name).toBe("Corte");
	});

	test("rejects a blank name", () => {
		expect(
			serviceInputSchema.safeParse({ ...validService, name: "   " }).success
		).toBe(false);
	});

	test("rejects a non-positive or fractional duration", () => {
		expect(
			serviceInputSchema.safeParse({ ...validService, durationMinutes: 0 })
				.success
		).toBe(false);
		expect(
			serviceInputSchema.safeParse({ ...validService, durationMinutes: 30.5 })
				.success
		).toBe(false);
	});

	test("rejects a duration longer than a day", () => {
		expect(
			serviceInputSchema.safeParse({ ...validService, durationMinutes: 1441 })
				.success
		).toBe(false);
	});

	test("accepts a free service but rejects a negative price", () => {
		expect(
			serviceInputSchema.safeParse({ ...validService, priceCents: 0 }).success
		).toBe(true);
		expect(
			serviceInputSchema.safeParse({ ...validService, priceCents: -1 }).success
		).toBe(false);
	});

	test("rejects a fractional price in cents", () => {
		expect(
			serviceInputSchema.safeParse({ ...validService, priceCents: 1050.5 })
				.success
		).toBe(false);
	});
});

describe("workingHourInputSchema", () => {
	test("accepts a valid window", () => {
		expect(
			workingHourInputSchema.safeParse({
				weekday: 5,
				start: "09:00",
				end: "18:00",
			}).success
		).toBe(true);
	});

	test("rejects start equal to or after end", () => {
		expect(
			workingHourInputSchema.safeParse({
				weekday: 5,
				start: "18:00",
				end: "18:00",
			}).success
		).toBe(false);
		expect(
			workingHourInputSchema.safeParse({
				weekday: 5,
				start: "18:00",
				end: "09:00",
			}).success
		).toBe(false);
	});

	test("accepts weekday 0 and 6 but rejects 7 and -1", () => {
		for (const weekday of [0, 6]) {
			expect(
				workingHourInputSchema.safeParse({
					weekday,
					start: "09:00",
					end: "18:00",
				}).success
			).toBe(true);
		}
		for (const weekday of [7, -1]) {
			expect(
				workingHourInputSchema.safeParse({
					weekday,
					start: "09:00",
					end: "18:00",
				}).success
			).toBe(false);
		}
	});

	test("rejects a malformed time", () => {
		for (const start of ["9h", "9:00", "24:00", "09:60", ""]) {
			expect(
				workingHourInputSchema.safeParse({ weekday: 5, start, end: "23:00" })
					.success
			).toBe(false);
		}
	});
});

describe("professionalInputSchema", () => {
	test("accepts a professional with services and a split shift", () => {
		expect(
			professionalInputSchema.safeParse({
				...validProfessional,
				serviceIds: ["svc-1", "svc-2"],
				workingHours: [
					{ weekday: 5, start: "09:00", end: "12:00" },
					{ weekday: 5, start: "13:00", end: "18:00" },
				],
				calendarId: "felipe@example.com",
			}).success
		).toBe(true);
	});

	test("accepts no services, no hours, no calendar", () => {
		expect(professionalInputSchema.safeParse(validProfessional).success).toBe(
			true
		);
	});

	test("rejects a blank name", () => {
		expect(
			professionalInputSchema.safeParse({ ...validProfessional, name: " " })
				.success
		).toBe(false);
	});

	test("rejects overlapping windows on the same weekday", () => {
		const result = professionalInputSchema.safeParse({
			...validProfessional,
			workingHours: [
				{ weekday: 5, start: "09:00", end: "13:00" },
				{ weekday: 5, start: "12:00", end: "18:00" },
			],
		});
		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe(
			"Há horários sobrepostos no mesmo dia"
		);
	});

	test("accepts the same window on two different weekdays", () => {
		expect(
			professionalInputSchema.safeParse({
				...validProfessional,
				workingHours: [
					{ weekday: 1, start: "09:00", end: "18:00" },
					{ weekday: 2, start: "09:00", end: "18:00" },
				],
			}).success
		).toBe(true);
	});
});
