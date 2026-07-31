import { db, schema } from "@workspace/db";
import { and, desc, eq } from "@workspace/db/drizzle-orm";
import type { IntegrationInput, OrganizationInput } from "./settings-schema";

/**
 * Org-scoped reads and writes for everything that is not the catalog: the
 * booking-backend settings, the WhatsApp channel mapping, conversations, the
 * team, and the barbershop's own profile.
 *
 * Same rule as `catalog.ts`: `organizationId` is the first argument of every
 * function and appears in every `where`. A conversation id from another
 * barbershop must read as "not found", never as data.
 */

export const CONVERSATION_STATUSES = [
	{ value: "open", label: "Aberta" },
	{ value: "handed_off", label: "Com atendente" },
	{ value: "closed", label: "Encerrada" },
] as const;

export type ConversationStatus =
	(typeof CONVERSATION_STATUSES)[number]["value"];

export function isConversationStatus(
	value: string
): value is ConversationStatus {
	return CONVERSATION_STATUSES.some((status) => status.value === value);
}

// ---------------------------------------------------------------- integration

export interface IntegrationRecord {
	offsetMinutes: number;
	provider: string;
	spreadsheetId: string | null;
}

/** `null` when the shop has no row yet — the bookings factory then defaults. */
export async function getIntegrationSettings(
	orgId: string
): Promise<IntegrationRecord | null> {
	const row = await db.query.integrationSettings.findFirst({
		where: eq(schema.integrationSettings.organizationId, orgId),
		columns: { provider: true, spreadsheetId: true, offsetMinutes: true },
	});
	return row ?? null;
}

/** Upsert — `integration_settings.organization_id` is unique, one row per shop. */
export async function saveIntegrationSettings(
	orgId: string,
	input: IntegrationInput
): Promise<void> {
	const values = {
		provider: input.provider,
		spreadsheetId: input.spreadsheetId || null,
		offsetMinutes: input.offsetMinutes,
	};
	await db
		.insert(schema.integrationSettings)
		.values({ id: crypto.randomUUID(), organizationId: orgId, ...values })
		.onConflictDoUpdate({
			target: schema.integrationSettings.organizationId,
			set: values,
		});
}

// ------------------------------------------------------------------- whatsapp

export interface WhatsappChannelRecord {
	createdAt: Date;
	id: string;
	phoneNumberId: string;
}

export function listWhatsappChannels(
	orgId: string
): Promise<WhatsappChannelRecord[]> {
	return db
		.select({
			id: schema.whatsappChannel.id,
			phoneNumberId: schema.whatsappChannel.phoneNumberId,
			createdAt: schema.whatsappChannel.createdAt,
		})
		.from(schema.whatsappChannel)
		.where(eq(schema.whatsappChannel.organizationId, orgId))
		.orderBy(schema.whatsappChannel.createdAt);
}

// -------------------------------------------------------------- conversations

export interface ConversationRecord {
	customerPhone: string;
	id: string;
	lastMessageAt: Date;
	status: string;
}

export interface ConversationMessageRecord {
	content: string;
	createdAt: Date;
	id: string;
	role: string;
}

export interface ConversationThread extends ConversationRecord {
	messages: ConversationMessageRecord[];
}

export function listConversations(
	orgId: string,
	status?: ConversationStatus
): Promise<ConversationRecord[]> {
	const scope = eq(schema.conversation.organizationId, orgId);
	return db
		.select({
			id: schema.conversation.id,
			customerPhone: schema.conversation.customerPhone,
			status: schema.conversation.status,
			lastMessageAt: schema.conversation.lastMessageAt,
		})
		.from(schema.conversation)
		.where(status ? and(scope, eq(schema.conversation.status, status)) : scope)
		.orderBy(desc(schema.conversation.lastMessageAt));
}

/** `null` for an unknown id *or* an id belonging to another barbershop. */
export async function getConversation(
	orgId: string,
	id: string
): Promise<ConversationThread | null> {
	const row = await db.query.conversation.findFirst({
		where: and(
			eq(schema.conversation.id, id),
			eq(schema.conversation.organizationId, orgId)
		),
		with: {
			messages: {
				columns: { id: true, role: true, content: true, createdAt: true },
				orderBy: schema.conversationMessage.createdAt,
			},
		},
	});
	if (!row) {
		return null;
	}
	return {
		id: row.id,
		customerPhone: row.customerPhone,
		status: row.status,
		lastMessageAt: row.lastMessageAt,
		messages: row.messages,
	};
}

// ----------------------------------------------------------------------- team

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

// --------------------------------------------------------------- organization

export interface OrganizationRecord {
	id: string;
	logo: string | null;
	name: string;
	slug: string;
}

export async function getOrganization(
	orgId: string
): Promise<OrganizationRecord | null> {
	const row = await db.query.organization.findFirst({
		where: eq(schema.organization.id, orgId),
		columns: { id: true, name: true, slug: true, logo: true },
	});
	return row ?? null;
}

/**
 * Writes the barbershop profile directly rather than through
 * `auth.api.updateOrganization`, which requires the caller's active
 * organization to already be set on the session — it is not, since we resolve
 * tenancy from membership. Slug uniqueness is enforced by the DB, so a
 * collision surfaces as a caught error rather than a corrupt row.
 */
export async function updateOrganization(
	orgId: string,
	input: OrganizationInput
): Promise<{ ok: true } | { ok: false; reason: "slug-taken" }> {
	const existing = await db.query.organization.findFirst({
		where: eq(schema.organization.slug, input.slug),
		columns: { id: true },
	});
	if (existing && existing.id !== orgId) {
		return { ok: false, reason: "slug-taken" };
	}
	await db
		.update(schema.organization)
		.set({ name: input.name, slug: input.slug, logo: input.logo || null })
		.where(eq(schema.organization.id, orgId));
	return { ok: true };
}
