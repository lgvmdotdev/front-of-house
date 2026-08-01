import { describe, expect, test } from "bun:test";
import { tenantInputSchema } from "./tenant-schema";

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

	test("rejects a slug that is not a URL segment", () => {
		expect(
			tenantInputSchema.safeParse({ ...valid, slug: "Barbearia Nova" }).success
		).toBe(false);
	});
});
