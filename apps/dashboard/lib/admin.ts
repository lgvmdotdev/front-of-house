import { db, schema } from "@workspace/db";
import { count, desc, eq } from "@workspace/db/drizzle-orm";
import { countCatalog } from "./catalog";
import {
	type ConversationRecord,
	getIntegrationSettings,
	getOrganization,
	type IntegrationRecord,
	type InvitationRecord,
	listConversations,
	listMembers,
	listPendingInvitations,
	listWhatsappChannels,
	type MemberRecord,
	type OrganizationRecord,
	type WhatsappChannelRecord,
} from "./tenant";

/**
 * Cross-tenant reads for the `(admin)` route group. These deliberately have no
 * `organizationId` filter — that is the whole point of the internal panel — and
 * are therefore only ever called from behind `requireAdmin()`. Nothing here may
 * be imported from `(app)`.
 *
 * The per-tenant detail view reuses the org-scoped functions in `tenant.ts` and
 * `catalog.ts` rather than duplicating their queries.
 */

const RECENT_CONVERSATIONS = 5;

export interface TenantSummary {
	conversations: number;
	createdAt: Date;
	id: string;
	logo: string | null;
	members: number;
	name: string;
	phoneNumberIds: string[];
	professionals: number;
	services: number;
	slug: string;
}

/** `organizationId -> count`, for one child table. */
async function countByOrg(
	table:
		| typeof schema.member
		| typeof schema.service
		| typeof schema.professional
		| typeof schema.conversation
): Promise<Map<string, number>> {
	const rows = await db
		.select({ organizationId: table.organizationId, total: count() })
		.from(table)
		.groupBy(table.organizationId);
	return new Map(rows.map((row) => [row.organizationId, Number(row.total)]));
}

export async function listTenants(): Promise<TenantSummary[]> {
	const [organizations, members, services, professionals, conversations] =
		await Promise.all([
			db
				.select({
					id: schema.organization.id,
					name: schema.organization.name,
					slug: schema.organization.slug,
					logo: schema.organization.logo,
					createdAt: schema.organization.createdAt,
				})
				.from(schema.organization)
				.orderBy(schema.organization.name),
			countByOrg(schema.member),
			countByOrg(schema.service),
			countByOrg(schema.professional),
			countByOrg(schema.conversation),
		]);

	const channels = await db
		.select({
			organizationId: schema.whatsappChannel.organizationId,
			phoneNumberId: schema.whatsappChannel.phoneNumberId,
		})
		.from(schema.whatsappChannel);
	const phoneNumbersByOrg = new Map<string, string[]>();
	for (const channel of channels) {
		const existing = phoneNumbersByOrg.get(channel.organizationId) ?? [];
		existing.push(channel.phoneNumberId);
		phoneNumbersByOrg.set(channel.organizationId, existing);
	}

	return organizations.map((organization) => ({
		...organization,
		members: members.get(organization.id) ?? 0,
		services: services.get(organization.id) ?? 0,
		professionals: professionals.get(organization.id) ?? 0,
		conversations: conversations.get(organization.id) ?? 0,
		phoneNumberIds: phoneNumbersByOrg.get(organization.id) ?? [],
	}));
}

export interface TenantDetail {
	channels: WhatsappChannelRecord[];
	conversations: ConversationRecord[];
	integration: IntegrationRecord | null;
	invitations: InvitationRecord[];
	members: MemberRecord[];
	organization: OrganizationRecord;
	professionals: number;
	services: number;
}

export async function getTenantDetail(
	orgId: string
): Promise<TenantDetail | null> {
	const organization = await getOrganization(orgId);
	if (!organization) {
		return null;
	}
	const [members, invitations, catalog, channels, integration, conversations] =
		await Promise.all([
			listMembers(orgId),
			listPendingInvitations(orgId),
			countCatalog(orgId),
			listWhatsappChannels(orgId),
			getIntegrationSettings(orgId),
			listConversations(orgId),
		]);
	return {
		organization,
		members,
		invitations,
		services: catalog.services,
		professionals: catalog.professionals,
		channels,
		integration,
		conversations: conversations.slice(0, RECENT_CONVERSATIONS),
	};
}

export interface PlatformTotals {
	conversations: number;
	tenants: number;
	users: number;
}

export async function getPlatformTotals(): Promise<PlatformTotals> {
	const [tenants, users, conversations] = await Promise.all([
		db.select({ total: count() }).from(schema.organization),
		db.select({ total: count() }).from(schema.user),
		db.select({ total: count() }).from(schema.conversation),
	]);
	return {
		tenants: Number(tenants[0]?.total ?? 0),
		users: Number(users[0]?.total ?? 0),
		conversations: Number(conversations[0]?.total ?? 0),
	};
}

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
