import { describe, expect, test } from "bun:test";
import {
	centsToInput,
	formatCents,
	formatPhone,
	formatUtcOffset,
	inputToCents,
} from "./format";

describe("money", () => {
	test("formats cents as BRL", () => {
		// Intl uses a non-breaking space between the symbol and the number.
		expect(formatCents(4500).replace(/ /g, " ")).toBe("R$ 45,00");
		expect(formatCents(0).replace(/ /g, " ")).toBe("R$ 0,00");
	});

	test("round-trips through the form input", () => {
		expect(inputToCents(centsToInput(4500))).toBe(4500);
		expect(inputToCents(centsToInput(3))).toBe(3);
	});

	test("rounds a fractional input to whole cents", () => {
		expect(inputToCents("45.005")).toBe(4501);
	});
});

describe("formatPhone", () => {
	test("formats a Brazilian mobile wa_id", () => {
		expect(formatPhone("5551999990001")).toBe("+55 (51) 99999-0001");
	});

	test("formats a Brazilian landline wa_id", () => {
		expect(formatPhone("555133334444")).toBe("+55 (51) 3333-4444");
	});

	test("leaves an unrecognised number untouched", () => {
		expect(formatPhone("14155550100")).toBe("14155550100");
	});
});

describe("formatUtcOffset", () => {
	test("formats negative, positive and zero offsets", () => {
		expect(formatUtcOffset(-180)).toBe("UTC-03:00");
		expect(formatUtcOffset(-210)).toBe("UTC-03:30");
		expect(formatUtcOffset(0)).toBe("UTC+00:00");
		expect(formatUtcOffset(330)).toBe("UTC+05:30");
	});
});
