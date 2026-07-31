import { describe, expect, test } from "bun:test";
import {
	integrationInputSchema,
	invitationInputSchema,
	organizationInputSchema,
	tenantInputSchema,
} from "./settings-schema";

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

describe("invitationInputSchema", () => {
	test("lowercases the email", () => {
		const parsed = invitationInputSchema.parse({
			email: "  Dono@Example.COM ",
			role: "member",
		});
		expect(parsed.email).toBe("dono@example.com");
	});

	test("rejects a malformed email", () => {
		expect(
			invitationInputSchema.safeParse({ email: "dono@", role: "member" })
				.success
		).toBe(false);
	});

	test("rejects a role outside the better-auth defaults", () => {
		expect(
			invitationInputSchema.safeParse({
				email: "dono@example.com",
				role: "barbeiro",
			}).success
		).toBe(false);
	});
});

describe("tenantInputSchema", () => {
	const valid = {
		name: "Barbearia Nova",
		slug: "barbearia-nova",
		ownerName: "Dono Novo",
		ownerEmail: "dono@nova.test",
		ownerPassword: "Senha123!",
	};

	test("accepts a valid tenant", () => {
		expect(tenantInputSchema.safeParse(valid).success).toBe(true);
	});

	test("rejects a password shorter than 8 characters", () => {
		expect(
			tenantInputSchema.safeParse({ ...valid, ownerPassword: "Senha1" }).success
		).toBe(false);
	});

	test("rejects a missing owner name", () => {
		expect(
			tenantInputSchema.safeParse({ ...valid, ownerName: "  " }).success
		).toBe(false);
	});
});
