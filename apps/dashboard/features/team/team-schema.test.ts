import { describe, expect, test } from "bun:test";
import { invitationInputSchema, memberRoleLabel } from "./team-schema";

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

describe("memberRoleLabel", () => {
	test("translates the better-auth roles and falls back to an em dash", () => {
		expect(memberRoleLabel("owner")).toBe("Proprietário");
		expect(memberRoleLabel("member")).toBe("Membro");
		expect(memberRoleLabel(null)).toBe("—");
		expect(memberRoleLabel("barbeiro")).toBe("—");
	});
});
