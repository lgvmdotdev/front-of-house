import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db, schema } from "@workspace/db";
import {
	createTestOrg,
	createTestUser,
	dropTestOrg,
	dropTestUser,
} from "@/lib/test-org";
import { listMembers, listPendingInvitations } from "./team-queries";

let orgId = "";
let otherOrgId = "";
const userIds: string[] = [];

beforeEach(async () => {
	orgId = await createTestOrg("team");
	otherOrgId = await createTestOrg("team-other");
});

afterEach(async () => {
	await dropTestOrg(orgId);
	await dropTestOrg(otherOrgId);
	while (userIds.length > 0) {
		const id = userIds.pop();
		if (id) {
			await dropTestUser(id);
		}
	}
});

async function seedMember(
	organizationId: string,
	role: string
): Promise<string> {
	const userId = await createTestUser("member");
	userIds.push(userId);
	const id = crypto.randomUUID();
	await db.insert(schema.member).values({
		id,
		organizationId,
		userId,
		role,
		createdAt: new Date(),
	});
	return id;
}

describe("members", () => {
	test("lists members with their user details", async () => {
		await seedMember(orgId, "owner");
		const members = await listMembers(orgId);
		expect(members).toHaveLength(1);
		expect(members[0]?.role).toBe("owner");
		expect(members[0]?.email).toContain("@example.test");
	});

	test("does not leak members across organizations", async () => {
		await seedMember(orgId, "owner");
		expect(await listMembers(otherOrgId)).toHaveLength(0);
	});
});

describe("invitations", () => {
	test("lists only pending invitations, scoped to the organization", async () => {
		const inviterId = await createTestUser("inviter");
		userIds.push(inviterId);
		const base = {
			organizationId: orgId,
			inviterId,
			expiresAt: new Date(Date.now() + 86_400_000),
			createdAt: new Date(),
			role: "member",
		};
		await db.insert(schema.invitation).values([
			{
				...base,
				id: crypto.randomUUID(),
				email: "a@x.test",
				status: "pending",
			},
			{
				...base,
				id: crypto.randomUUID(),
				email: "b@x.test",
				status: "canceled",
			},
			{
				...base,
				id: crypto.randomUUID(),
				email: "c@x.test",
				status: "accepted",
			},
		]);

		const pending = await listPendingInvitations(orgId);
		expect(pending).toHaveLength(1);
		expect(pending[0]?.email).toBe("a@x.test");
		expect(await listPendingInvitations(otherOrgId)).toHaveLength(0);
	});
});
