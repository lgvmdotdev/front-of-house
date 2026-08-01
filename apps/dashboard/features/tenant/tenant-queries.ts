import "server-only";

import { db, schema } from "@workspace/db";
import { count } from "@workspace/db/drizzle-orm";
import { cache } from "react";
import { countCatalog } from "@/features/catalog/catalog-queries";
import {
	type ConversationRecord,
	listConversations,
} from "@/features/conversation/conversation-queries";
import {
	getIntegrationSettings,
	getOrganization,
	type IntegrationRecord,
	listWhatsappChannels,
	type OrganizationRecord,
	type WhatsappChannelRecord,
} from "@/features/organization/organization-queries";
import {
	type InvitationRecord,
	listMembers,
	listPendingInvitations,
	type MemberRecord,
} from "@/features/team/team-queries";

/**
 * Cross-tenant reads for the `(admin)` route group. These deliberately have no
 * `organizationId` filter — that is the whole point of the internal panel — and
 * are therefore only ever called from behind `requireAdmin()`. Nothing here may
 * be imported from `(app)`.
 *
 * The per-tenant detail view reuses the org-scoped queries of the tenant-facing
 * features rather than duplicating them.
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

/**
 * `cache()`d because `/admin` reads it from three sections in one render — the
 * totals row, the recent list, and the "no WhatsApp connected" call-out — and
 * each of those is its own Suspense boundary.
 */
export const listTenants = cache(async (): Promise<TenantSummary[]> => {
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
});

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

/**
 * `cache()`d for the same reason as `getConversation`: `generateMetadata` and
 * the detail component both read it, and this one is six queries — running them
 * twice per request would be the whole cost of the page again.
 */
export const getTenantDetail = cache(async function getTenantDetail(
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
});

export interface PlatformTotals {
	conversations: number;
	tenants: number;
	users: number;
}

export const getPlatformTotals = cache(async (): Promise<PlatformTotals> => {
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
});
