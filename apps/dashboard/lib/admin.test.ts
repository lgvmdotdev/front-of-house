import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";
import {
	getPlatformTotals,
	getTenantDetail,
	listPlatformUsers,
	listTenants,
} from "./admin";
import { createProfessional, createService } from "./catalog";
import { saveIntegrationSettings } from "./tenant";
import {
	createTestOrg,
	createTestUser,
	dropTestOrg,
	dropTestUser,
} from "./test-org";

/**
 * Admin reads are cross-tenant on purpose, so these tests assert that a tenant's
 * own rows are attributed to it and *not* to its neighbour — the counts must not
 * bleed. Absolute totals are asserted as deltas, since the database may already
 * hold rows from other suites or the seed script.
 */

let orgId = "";
let otherOrgId = "";
const userIds: string[] = [];

beforeEach(async () => {
	orgId = await createTestOrg("admin");
	otherOrgId = await createTestOrg("admin-other");
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

async function addMember(organizationId: string, role: string) {
	const userId = await createTestUser("admin-member");
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

async function addConversation(organizationId: string) {
	const id = crypto.randomUUID();
	await db.insert(schema.conversation).values({
		id,
		organizationId,
		customerPhone: "5551234",
		status: "open",
		lastMessageAt: new Date(),
	});
	return id;
}

const corte = {
	name: "Corte",
	durationMinutes: 60,
	priceCents: 5000,
	active: true,
};

describe("listTenants", () => {
	test("attributes counts to the right tenant", async () => {
		await addMember(orgId, "owner");
		await addMember(orgId, "member");
		await createService(orgId, corte);
		await createProfessional(orgId, {
			name: "Felipe",
			serviceIds: [],
			workingHours: [],
			active: true,
		});
		await addConversation(orgId);
		await db.insert(schema.whatsappChannel).values({
			id: crypto.randomUUID(),
			organizationId: orgId,
			phoneNumberId: `phone-${crypto.randomUUID()}`,
		});

		const tenants = await listTenants();
		const mine = tenants.find((tenant) => tenant.id === orgId);
		const neighbour = tenants.find((tenant) => tenant.id === otherOrgId);

		expect(mine).toMatchObject({
			members: 2,
			services: 1,
			professionals: 1,
			conversations: 1,
		});
		expect(mine?.phoneNumberIds).toHaveLength(1);
		expect(neighbour).toMatchObject({
			members: 0,
			services: 0,
			professionals: 0,
			conversations: 0,
		});
		expect(neighbour?.phoneNumberIds).toEqual([]);
	});

	test("includes a tenant with no children at all", async () => {
		const tenants = await listTenants();
		expect(tenants.some((tenant) => tenant.id === orgId)).toBe(true);
	});
});

describe("getTenantDetail", () => {
	test("returns null for an unknown organization", async () => {
		expect(await getTenantDetail("does-not-exist")).toBeNull();
	});

	test("assembles the full picture of one tenant only", async () => {
		await addMember(orgId, "owner");
		await createService(orgId, corte);
		await createService(orgId, { ...corte, name: "Barba" });
		await createProfessional(orgId, {
			name: "Felipe",
			serviceIds: [],
			workingHours: [],
			active: true,
		});
		await saveIntegrationSettings(orgId, {
			provider: "sheets",
			spreadsheetId: "sheet-1",
			offsetMinutes: -180,
		});
		await addConversation(orgId);
		// Neighbour noise that must not show up.
		await addMember(otherOrgId, "owner");
		await createService(otherOrgId, corte);
		await addConversation(otherOrgId);

		const detail = await getTenantDetail(orgId);
		expect(detail?.organization.id).toBe(orgId);
		expect(detail?.members).toHaveLength(1);
		expect(detail?.services).toBe(2);
		expect(detail?.professionals).toBe(1);
		expect(detail?.conversations).toHaveLength(1);
		expect(detail?.integration).toMatchObject({
			provider: "sheets",
			spreadsheetId: "sheet-1",
		});
	});

	test("caps the recent conversation list at five", async () => {
		for (let index = 0; index < 7; index++) {
			await addConversation(orgId);
		}
		expect((await getTenantDetail(orgId))?.conversations).toHaveLength(5);
	});
});

describe("getPlatformTotals", () => {
	test("counts the tenants created by this test", async () => {
		const before = await getPlatformTotals();
		const extraOrg = await createTestOrg("admin-totals");
		const after = await getPlatformTotals();
		expect(after.tenants).toBe(before.tenants + 1);
		await dropTestOrg(extraOrg);
	});
});

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
