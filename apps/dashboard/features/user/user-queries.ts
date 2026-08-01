import "server-only";

import { db, schema } from "@workspace/db";
import { desc, eq } from "@workspace/db/drizzle-orm";

/**
 * Platform-wide user reads for the `(admin)` route group — no organization
 * filter, so only ever called from behind `requireAdmin()`.
 */

export interface PlatformUser {
	banned: boolean;
	banReason: string | null;
	createdAt: Date;
	email: string;
	id: string;
	memberships: { organizationName: string; role: string }[];
	name: string;
	role: string | null;
}

/**
 * Every user with the barbershops they belong to. Read with drizzle rather than
 * `auth.api.listUsers` because that endpoint swallows database errors and
 * returns an empty list, and it cannot join memberships.
 */
export async function listPlatformUsers(): Promise<PlatformUser[]> {
	const [users, memberships] = await Promise.all([
		db
			.select({
				id: schema.user.id,
				name: schema.user.name,
				email: schema.user.email,
				role: schema.user.role,
				banned: schema.user.banned,
				banReason: schema.user.banReason,
				createdAt: schema.user.createdAt,
			})
			.from(schema.user)
			.orderBy(desc(schema.user.createdAt)),
		db
			.select({
				userId: schema.member.userId,
				role: schema.member.role,
				organizationName: schema.organization.name,
			})
			.from(schema.member)
			.innerJoin(
				schema.organization,
				eq(schema.member.organizationId, schema.organization.id)
			),
	]);

	const byUser = new Map<
		string,
		{ organizationName: string; role: string }[]
	>();
	for (const membership of memberships) {
		const existing = byUser.get(membership.userId) ?? [];
		existing.push({
			organizationName: membership.organizationName,
			role: membership.role,
		});
		byUser.set(membership.userId, existing);
	}

	return users.map((user) => ({
		...user,
		banned: user.banned ?? false,
		memberships: byUser.get(user.id) ?? [],
	}));
}
