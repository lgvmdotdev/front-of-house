import { describe, expect, test } from "bun:test";
import {
	DEFAULT_UTC_OFFSET_MINUTES,
	formatTimeOfDay,
	instantToLocalParts,
	localToInstant,
	parseTimeOfDay,
} from "./time";

describe("parseTimeOfDay", () => {
	test("parses HH:MM into minutes since midnight", () => {
		expect(parseTimeOfDay("00:00")).toBe(0);
		expect(parseTimeOfDay("09:30")).toBe(570);
		expect(parseTimeOfDay("23:59")).toBe(1439);
	});

	test("throws on malformed input", () => {
		expect(() => parseTimeOfDay("9:30")).toThrow();
		expect(() => parseTimeOfDay("24:00")).toThrow();
		expect(() => parseTimeOfDay("noon")).toThrow();
	});
});

describe("formatTimeOfDay", () => {
	test("renders minutes back to HH:MM", () => {
		expect(formatTimeOfDay(0)).toBe("00:00");
		expect(formatTimeOfDay(570)).toBe("09:30");
		expect(formatTimeOfDay(1439)).toBe("23:59");
	});

	test("round-trips with parseTimeOfDay", () => {
		expect(formatTimeOfDay(parseTimeOfDay("14:05"))).toBe("14:05");
	});
});

describe("localToInstant", () => {
	test("treats 09:00 BRT as 12:00 UTC", () => {
		const instant = localToInstant(
			{ year: 2026, month: 6, day: 26, hours: 9, minutes: 0 },
			DEFAULT_UTC_OFFSET_MINUTES
		);
		expect(instant.toISOString()).toBe("2026-06-26T12:00:00.000Z");
	});

	test("defaults to São Paulo offset", () => {
		const instant = localToInstant({
			year: 2026,
			month: 1,
			day: 1,
			hours: 0,
			minutes: 0,
		});
		expect(instant.toISOString()).toBe("2026-01-01T03:00:00.000Z");
	});
});

describe("instantToLocalParts", () => {
	test("converts a UTC instant to local wall-clock parts", () => {
		const parts = instantToLocalParts(
			new Date("2026-06-26T12:00:00.000Z"),
			DEFAULT_UTC_OFFSET_MINUTES
		);
		expect(parts).toEqual({
			year: 2026,
			month: 6,
			day: 26,
			hours: 9,
			minutes: 0,
			weekday: 5,
		});
	});

	test("rolls back across midnight", () => {
		// 01:00 UTC is still the previous local day at UTC-3.
		const parts = instantToLocalParts(
			new Date("2026-06-26T01:00:00.000Z"),
			DEFAULT_UTC_OFFSET_MINUTES
		);
		expect(parts.day).toBe(25);
		expect(parts.hours).toBe(22);
	});

	test("round-trips with localToInstant", () => {
		const original = new Date("2026-03-15T17:45:00.000Z");
		const parts = instantToLocalParts(original);
		expect(localToInstant(parts).toISOString()).toBe(original.toISOString());
	});
});
