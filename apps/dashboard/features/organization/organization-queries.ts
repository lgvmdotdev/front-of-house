import "server-only";

import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";
import type {
	IntegrationInput,
	OrganizationInput,
} from "./organization-schema";

/**
 * How one barbershop is wired up: its own profile, the booking backend the
 * receptionist writes into, and the WhatsApp number it answers on.
 *
 * `organizationId` is the first argument of every function and appears in every
 * `where` — a row from another barbershop must read as "not found", never as
 * data. Kept free of session/redirect logic so it is testable directly against
 * Postgres.
 */

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

// ------------------------------------------------------------------- profile

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
 * collision returns `false`, matching the convention in `catalog-queries.ts`.
 */
export async function updateOrganization(
	orgId: string,
	input: OrganizationInput
): Promise<boolean> {
	const existing = await db.query.organization.findFirst({
		where: eq(schema.organization.slug, input.slug),
		columns: { id: true },
	});
	if (existing && existing.id !== orgId) {
		return false;
	}
	await db
		.update(schema.organization)
		.set({ name: input.name, slug: input.slug, logo: input.logo || null })
		.where(eq(schema.organization.id, orgId));
	return true;
}
