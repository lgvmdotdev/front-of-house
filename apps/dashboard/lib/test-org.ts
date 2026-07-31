import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";

/**
 * Test fixture helpers. Per the project's no-mocking rule these tests run
 * against the real Postgres from `packages/db/docker-compose.yml`:
 *
 *   bun run --filter @workspace/db db:start
 *   bun run --filter @workspace/db db:migrate
 *
 * Isolation comes from a throwaway organization per test — deleting it cascades
 * away every catalog, conversation, channel and membership row that hangs off
 * it, which is exactly the blast radius of an org-scoped test.
 */

export async function createTestOrg(label: string): Promise<string> {
	const id = `test-${label}-${crypto.randomUUID()}`;
	await db.insert(schema.organization).values({
		id,
		name: `Org ${label}`,
		slug: id,
		createdAt: new Date(),
	});
	return id;
}

export async function dropTestOrg(id: string): Promise<void> {
	await db.delete(schema.organization).where(eq(schema.organization.id, id));
}

export async function createTestUser(label: string): Promise<string> {
	const id = `test-user-${label}-${crypto.randomUUID()}`;
	await db.insert(schema.user).values({
		id,
		name: `User ${label}`,
		email: `${id}@example.test`,
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	return id;
}

export async function dropTestUser(id: string): Promise<void> {
	await db.delete(schema.user).where(eq(schema.user.id, id));
}
