import { describe, expect, test } from "bun:test";
import {
	integrationInputSchema,
	organizationInputSchema,
	timeZoneForOffset,
	timeZoneOffsetMinutes,
} from "./organization-schema";

describe("time zone options", () => {
	test("maps a zone to its offset", () => {
		expect(timeZoneOffsetMinutes("America/Manaus")).toBe(-240);
	});

	test("falls back to Brasília for a zone outside the list", () => {
		expect(timeZoneOffsetMinutes("Europe/Lisbon")).toBe(-180);
	});

	test("preselects a zone from a saved offset", () => {
		expect(timeZoneForOffset(-300)).toBe("America/Rio_Branco");
		expect(timeZoneForOffset(-180)).toBe("America/Sao_Paulo");
	});
});

describe("integrationInputSchema", () => {
	test("accepts the calendar provider with no spreadsheet", () => {
		expect(
			integrationInputSchema.safeParse({
				provider: "calendar",
				offsetMinutes: -180,
			}).success
		).toBe(true);
	});

	test("accepts the sheets provider with a spreadsheet id", () => {
		expect(
			integrationInputSchema.safeParse({
				provider: "sheets",
				spreadsheetId: "1AbC",
				offsetMinutes: -180,
			}).success
		).toBe(true);
	});

	test("rejects the sheets provider without a spreadsheet id", () => {
		const result = integrationInputSchema.safeParse({
			provider: "sheets",
			offsetMinutes: -180,
		});
		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe(
			"Informe o ID da planilha para usar Planilha Google"
		);
	});

	test("rejects an empty spreadsheet id for sheets", () => {
		expect(
			integrationInputSchema.safeParse({
				provider: "sheets",
				spreadsheetId: "   ",
				offsetMinutes: -180,
			}).success
		).toBe(false);
	});

	test("rejects an unknown provider", () => {
		expect(
			integrationInputSchema.safeParse({
				provider: "booksy",
				offsetMinutes: -180,
			}).success
		).toBe(false);
	});

	test("rejects a fractional or out-of-range offset", () => {
		expect(
			integrationInputSchema.safeParse({
				provider: "calendar",
				offsetMinutes: -180.5,
			}).success
		).toBe(false);
		expect(
			integrationInputSchema.safeParse({
				provider: "calendar",
				offsetMinutes: -2000,
			}).success
		).toBe(false);
	});
});

describe("organizationInputSchema", () => {
	const valid = { name: "Barbearia Demo", slug: "barbearia-demo", logo: "" };

	test("accepts a valid organization with no logo", () => {
		expect(organizationInputSchema.safeParse(valid).success).toBe(true);
	});

	test("accepts an https logo url", () => {
		expect(
			organizationInputSchema.safeParse({
				...valid,
				logo: "https://example.com/logo.png",
			}).success
		).toBe(true);
	});

	test("rejects a non-url logo", () => {
		expect(
			organizationInputSchema.safeParse({ ...valid, logo: "logo.png" }).success
		).toBe(false);
	});

	test("rejects slugs with uppercase, spaces, or edge hyphens", () => {
		for (const slug of [
			"Barbearia",
			"barbearia demo",
			"-demo",
			"demo-",
			"demo--x",
			"a",
		]) {
			expect(
				organizationInputSchema.safeParse({ ...valid, slug }).success
			).toBe(false);
		}
	});

	test("accepts digits in a slug", () => {
		expect(
			organizationInputSchema.safeParse({ ...valid, slug: "barbearia-2" })
				.success
		).toBe(true);
	});
});
