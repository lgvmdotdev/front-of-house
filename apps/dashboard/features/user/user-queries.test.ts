import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";
import {
	createTestOrg,
	createTestUser,
	dropTestOrg,
	dropTestUser,
} from "@/lib/test-org";
import { listPlatformUsers } from "./user-queries";

/**
 * `listPlatformUsers` has no organization filter — that is the point of the
 * internal panel — so these assertions find the seeded user in the full list
 * rather than asserting on absolute totals, which other suites and the seed
 * script also write to.
 */

let orgId = "";
const userIds: string[] = [];

beforeEach(async () => {
	orgId = await createTestOrg("platform-user");
});

afterEach(async () => {
	await dropTestOrg(orgId);
	while (userIds.length > 0) {
		const id = userIds.pop();
		if (id) {
			await dropTestUser(id);
		}
	}
});

async function addMember(organizationId: string, role: string) {
	const userId = await createTestUser("platform-member");
	userIds.push(userId);
	await db.insert(schema.member).values({
		id: crypto.randomUUID(),
		organizationId,
		userId,
		role,
		createdAt: new Date(),
	});
	return userId;
}

describe("listPlatformUsers", () => {
	test("includes each user's barbershop memberships", async () => {
		const userId = await addMember(orgId, "owner");
		const users = await listPlatformUsers();
		const mine = users.find((user) => user.id === userId);
		expect(mine?.memberships).toHaveLength(1);
		expect(mine?.memberships[0]?.role).toBe("owner");
		expect(mine?.banned).toBe(false);
	});

	test("reports a banned user as banned with its reason", async () => {
		const userId = await createTestUser("banned");
		userIds.push(userId);
		await db
			.update(schema.user)
			.set({ banned: true, banReason: "Teste" })
			.where(eq(schema.user.id, userId));
		const mine = (await listPlatformUsers()).find((user) => user.id === userId);
		expect(mine?.banned).toBe(true);
		expect(mine?.banReason).toBe("Teste");
	});

	test("reports a user with no membership as having none", async () => {
		const userId = await createTestUser("orphan");
		userIds.push(userId);
		const mine = (await listPlatformUsers()).find((user) => user.id === userId);
		expect(mine?.memberships).toEqual([]);
	});
});
