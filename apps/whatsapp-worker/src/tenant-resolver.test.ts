import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { FakeAgent } from "@workspace/agent";
import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";
import { TenantResolver } from "./tenant-resolver";

/**
 * Integration tests against the real Postgres (per the project's TDD rule —
 * no mocking the DB). Requires the docker container up + migrated:
 *   bun run --filter @workspace/db db:start && db:migrate
 */

const ORG_ID = "test-org-tenant-resolver";
const OTHER_ORG_ID = "test-org-tenant-resolver-other";
const PHONE_NUMBER_ID = "phone-number-1";
const OTHER_PHONE_NUMBER_ID = "phone-number-2";

async function cleanup(): Promise<void> {
	await db
		.delete(schema.organization)
		.where(eq(schema.organization.id, ORG_ID));
	await db
		.delete(schema.organization)
		.where(eq(schema.organization.id, OTHER_ORG_ID));
}

beforeEach(async () => {
	await cleanup();
	await db.insert(schema.organization).values([
		{
			id: ORG_ID,
			name: "Org",
			slug: `${ORG_ID}-${crypto.randomUUID()}`,
			createdAt: new Date(),
		},
		{
			id: OTHER_ORG_ID,
			name: "Other Org",
			slug: `${OTHER_ORG_ID}-${crypto.randomUUID()}`,
			createdAt: new Date(),
		},
	]);
	await db.insert(schema.whatsappChannel).values([
		{
			id: `channel-${PHONE_NUMBER_ID}`,
			organizationId: ORG_ID,
			phoneNumberId: PHONE_NUMBER_ID,
		},
		{
			id: `channel-${OTHER_PHONE_NUMBER_ID}`,
			organizationId: OTHER_ORG_ID,
			phoneNumberId: OTHER_PHONE_NUMBER_ID,
		},
	]);
});

afterEach(cleanup);

describe("TenantResolver", () => {
	test("resolves the organization mapped to a phone number", async () => {
		const resolver = new TenantResolver({
			buildAgent: () => Promise.resolve(new FakeAgent()),
		});

		const result = await resolver.resolveAgent(PHONE_NUMBER_ID);

		expect(result?.organizationId).toBe(ORG_ID);
	});

	test("returns null for an unmapped phone number", async () => {
		const resolver = new TenantResolver({
			buildAgent: () => Promise.resolve(new FakeAgent()),
		});

		const result = await resolver.resolveAgent("no-such-phone-number-id");

		expect(result).toBeNull();
	});

	test("builds the agent once per organization and reuses it across calls", async () => {
		const buildCalls: string[] = [];
		const resolver = new TenantResolver({
			buildAgent: (organizationId) => {
				buildCalls.push(organizationId);
				return Promise.resolve(new FakeAgent());
			},
		});

		const first = await resolver.resolveAgent(PHONE_NUMBER_ID);
		const second = await resolver.resolveAgent(PHONE_NUMBER_ID);

		expect(buildCalls).toEqual([ORG_ID]);
		expect(second?.agent).toBe(first?.agent);
	});

	test("builds separate agents for separate organizations", async () => {
		const buildCalls: string[] = [];
		const resolver = new TenantResolver({
			buildAgent: (organizationId) => {
				buildCalls.push(organizationId);
				return Promise.resolve(new FakeAgent());
			},
		});

		await resolver.resolveAgent(PHONE_NUMBER_ID);
		await resolver.resolveAgent(OTHER_PHONE_NUMBER_ID);

		expect(buildCalls.sort()).toEqual([ORG_ID, OTHER_ORG_ID].sort());
	});
});
