import { describe, expect, test } from "bun:test";
import { findOverlappingWindow, sortWindows } from "./working-hours";

/**
 * Split shifts are legal ("09:00-12:00" + "13:00-18:00" on the same weekday);
 * overlapping ones are not, because the booking engine would offer the same slot
 * twice. Weekdays are independent of each other.
 */

describe("findOverlappingWindow", () => {
	test("accepts a split shift on the same weekday", () => {
		expect(
			findOverlappingWindow([
				{ weekday: 1, start: "09:00", end: "12:00" },
				{ weekday: 1, start: "13:00", end: "18:00" },
			])
		).toBeNull();
	});

	test("accepts windows that touch end-to-start", () => {
		expect(
			findOverlappingWindow([
				{ weekday: 1, start: "09:00", end: "12:00" },
				{ weekday: 1, start: "12:00", end: "18:00" },
			])
		).toBeNull();
	});

	test("rejects partially overlapping windows", () => {
		expect(
			findOverlappingWindow([
				{ weekday: 1, start: "09:00", end: "13:00" },
				{ weekday: 1, start: "12:00", end: "18:00" },
			])
		).toEqual({ weekday: 1, start: "12:00", end: "18:00" });
	});

	test("rejects a window fully contained in another", () => {
		expect(
			findOverlappingWindow([
				{ weekday: 3, start: "09:00", end: "18:00" },
				{ weekday: 3, start: "10:00", end: "11:00" },
			])
		).toEqual({ weekday: 3, start: "10:00", end: "11:00" });
	});

	test("rejects duplicate windows", () => {
		expect(
			findOverlappingWindow([
				{ weekday: 0, start: "09:00", end: "18:00" },
				{ weekday: 0, start: "09:00", end: "18:00" },
			])
		).toEqual({ weekday: 0, start: "09:00", end: "18:00" });
	});

	test("allows identical times on different weekdays", () => {
		expect(
			findOverlappingWindow([
				{ weekday: 1, start: "09:00", end: "18:00" },
				{ weekday: 2, start: "09:00", end: "18:00" },
				{ weekday: 6, start: "09:00", end: "18:00" },
			])
		).toBeNull();
	});

	test("detects an overlap regardless of input order", () => {
		expect(
			findOverlappingWindow([
				{ weekday: 4, start: "14:00", end: "18:00" },
				{ weekday: 4, start: "09:00", end: "15:00" },
			])
		).not.toBeNull();
	});

	test("returns null for zero or one window", () => {
		expect(findOverlappingWindow([])).toBeNull();
		expect(
			findOverlappingWindow([{ weekday: 5, start: "09:00", end: "18:00" }])
		).toBeNull();
	});
});

describe("sortWindows", () => {
	test("orders by weekday then start time", () => {
		expect(
			sortWindows([
				{ weekday: 3, start: "13:00", end: "18:00" },
				{ weekday: 1, start: "09:00", end: "12:00" },
				{ weekday: 3, start: "09:00", end: "12:00" },
			])
		).toEqual([
			{ weekday: 1, start: "09:00", end: "12:00" },
			{ weekday: 3, start: "09:00", end: "12:00" },
			{ weekday: 3, start: "13:00", end: "18:00" },
		]);
	});

	test("does not mutate its input", () => {
		const input = [
			{ weekday: 3, start: "13:00", end: "18:00" },
			{ weekday: 1, start: "09:00", end: "12:00" },
		];
		sortWindows(input);
		expect(input[0]?.weekday).toBe(3);
	});
});
