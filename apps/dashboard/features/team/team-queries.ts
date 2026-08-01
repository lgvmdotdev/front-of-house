import "server-only";

import { db, schema } from "@workspace/db";
import { and, desc, eq } from "@workspace/db/drizzle-orm";

/**
 * Who has access to one barbershop's panel. Reads go through drizzle because
 * they need a join onto `user` that better-auth's `listMembers` cannot do; the
 * writes in `team-actions.ts` go through better-auth so its invitation
 * token/expiry and role permissions apply.
 */

export interface MemberRecord {
	createdAt: Date;
	email: string;
	id: string;
	name: string;
	role: string;
	userId: string;
}

export interface InvitationRecord {
	email: string;
	expiresAt: Date;
	id: string;
	role: string | null;
	status: string;
}

export function listMembers(orgId: string): Promise<MemberRecord[]> {
	return db
		.select({
			id: schema.member.id,
			userId: schema.member.userId,
			role: schema.member.role,
			createdAt: schema.member.createdAt,
			name: schema.user.name,
			email: schema.user.email,
		})
		.from(schema.member)
		.innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
		.where(eq(schema.member.organizationId, orgId))
		.orderBy(schema.member.createdAt);
}

/** Pending invitations only — accepted/rejected/canceled ones are history. */
export function listPendingInvitations(
	orgId: string
): Promise<InvitationRecord[]> {
	return db
		.select({
			id: schema.invitation.id,
			email: schema.invitation.email,
			role: schema.invitation.role,
			status: schema.invitation.status,
			expiresAt: schema.invitation.expiresAt,
		})
		.from(schema.invitation)
		.where(
			and(
				eq(schema.invitation.organizationId, orgId),
				eq(schema.invitation.status, "pending")
			)
		)
		.orderBy(desc(schema.invitation.createdAt));
}
