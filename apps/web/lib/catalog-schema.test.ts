import { describe, expect, test } from "bun:test";
import {
	professionalInputSchema,
	serviceInputSchema,
	workingHourInputSchema,
} from "./catalog-schema";

describe("serviceInputSchema", () => {
	test("accepts a valid service", () => {
		expect(
			serviceInputSchema.safeParse({
				name: "Corte",
				durationMinutes: 60,
				priceCents: 5000,
			}).success
		).toBe(true);
	});

	test("rejects empty name, non-positive duration, negative price", () => {
		expect(
			serviceInputSchema.safeParse({
				name: "",
				durationMinutes: 60,
				priceCents: 5000,
			}).success
		).toBe(false);
		expect(
			serviceInputSchema.safeParse({
				name: "Corte",
				durationMinutes: 0,
				priceCents: 5000,
			}).success
		).toBe(false);
		expect(
			serviceInputSchema.safeParse({
				name: "Corte",
				durationMinutes: 60,
				priceCents: -1,
			}).success
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

	test("rejects start >= end", () => {
		expect(
			workingHourInputSchema.safeParse({
				weekday: 5,
				start: "18:00",
				end: "09:00",
			}).success
		).toBe(false);
	});

	test("rejects an out-of-range weekday", () => {
		expect(
			workingHourInputSchema.safeParse({
				weekday: 7,
				start: "09:00",
				end: "18:00",
			}).success
		).toBe(false);
	});

	test("rejects a malformed time", () => {
		expect(
			workingHourInputSchema.safeParse({
				weekday: 5,
				start: "9h",
				end: "18:00",
			}).success
		).toBe(false);
	});
});

describe("professionalInputSchema", () => {
	test("accepts a professional with services and hours", () => {
		expect(
			professionalInputSchema.safeParse({
				name: "Felipe",
				serviceIds: ["svc-1"],
				workingHours: [{ weekday: 5, start: "09:00", end: "18:00" }],
				calendarId: "felipe@example.com",
			}).success
		).toBe(true);
	});

	test("accepts no services, no hours, no calendar", () => {
		expect(
			professionalInputSchema.safeParse({
				name: "Bruno",
				serviceIds: [],
				workingHours: [],
			}).success
		).toBe(true);
	});

	test("rejects an empty name", () => {
		expect(
			professionalInputSchema.safeParse({
				name: "",
				serviceIds: [],
				workingHours: [],
			}).success
		).toBe(false);
	});
});
