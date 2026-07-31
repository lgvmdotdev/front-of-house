import { db, schema } from "@workspace/db";
import { and, eq, inArray } from "@workspace/db/drizzle-orm";
import type { ProfessionalInput, ServiceInput } from "./catalog-schema";
import { sortWindows, type WorkingWindow } from "./working-hours";

/**
 * Org-scoped catalog data access. Every function takes the barbershop's
 * `organizationId` and filters by it — an id from another organization must
 * behave exactly like an id that does not exist. Kept free of session/redirect
 * logic so it is testable directly against Postgres.
 */

export interface ServiceRecord {
	active: boolean;
	durationMinutes: number;
	id: string;
	name: string;
	priceCents: number;
}

export interface WorkingHoursRecord extends WorkingWindow {
	id: string;
}

export interface ProfessionalRecord {
	active: boolean;
	calendarId: string | null;
	id: string;
	name: string;
	serviceIds: string[];
	workingHours: WorkingHoursRecord[];
}

export function listServices(orgId: string): Promise<ServiceRecord[]> {
	return db
		.select({
			id: schema.service.id,
			name: schema.service.name,
			durationMinutes: schema.service.durationMinutes,
			priceCents: schema.service.priceCents,
			active: schema.service.active,
		})
		.from(schema.service)
		.where(eq(schema.service.organizationId, orgId))
		.orderBy(schema.service.name);
}

export async function createService(
	orgId: string,
	input: ServiceInput
): Promise<ServiceRecord> {
	const id = crypto.randomUUID();
	await db.insert(schema.service).values({
		id,
		organizationId: orgId,
		name: input.name,
		durationMinutes: input.durationMinutes,
		priceCents: input.priceCents,
		active: input.active,
	});
	return { id, ...input };
}

/** Returns `false` when no row in this organization matched. */
export async function updateService(
	orgId: string,
	id: string,
	input: ServiceInput
): Promise<boolean> {
	const updated = await db
		.update(schema.service)
		.set({
			name: input.name,
			durationMinutes: input.durationMinutes,
			priceCents: input.priceCents,
			active: input.active,
		})
		.where(
			and(eq(schema.service.id, id), eq(schema.service.organizationId, orgId))
		)
		.returning({ id: schema.service.id });
	return updated.length > 0;
}

export async function deleteService(
	orgId: string,
	id: string
): Promise<boolean> {
	const deleted = await db
		.delete(schema.service)
		.where(
			and(eq(schema.service.id, id), eq(schema.service.organizationId, orgId))
		)
		.returning({ id: schema.service.id });
	return deleted.length > 0;
}

export async function listProfessionals(
	orgId: string
): Promise<ProfessionalRecord[]> {
	const rows = await db.query.professional.findMany({
		where: eq(schema.professional.organizationId, orgId),
		orderBy: schema.professional.name,
		with: {
			services: { columns: { serviceId: true } },
			workingHours: {
				columns: { id: true, weekday: true, start: true, end: true },
			},
		},
	});
	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		calendarId: row.calendarId,
		active: row.active,
		serviceIds: row.services.map((link) => link.serviceId),
		workingHours: sortWindows(row.workingHours),
	}));
}

/** Keeps only the service ids that actually belong to this organization. */
async function ownedServiceIds(
	orgId: string,
	serviceIds: string[]
): Promise<string[]> {
	if (serviceIds.length === 0) {
		return [];
	}
	const owned = await db
		.select({ id: schema.service.id })
		.from(schema.service)
		.where(
			and(
				eq(schema.service.organizationId, orgId),
				inArray(schema.service.id, serviceIds)
			)
		);
	return owned.map((row) => row.id);
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function replaceProfessionalLinks(
	tx: Transaction,
	professionalId: string,
	serviceIds: string[],
	workingHours: WorkingWindow[]
): Promise<void> {
	if (serviceIds.length > 0) {
		await tx
			.insert(schema.professionalService)
			.values(serviceIds.map((serviceId) => ({ professionalId, serviceId })));
	}
	if (workingHours.length > 0) {
		await tx.insert(schema.workingHours).values(
			workingHours.map((hours) => ({
				id: crypto.randomUUID(),
				professionalId,
				weekday: hours.weekday,
				start: hours.start,
				end: hours.end,
			}))
		);
	}
}

export async function createProfessional(
	orgId: string,
	input: ProfessionalInput
): Promise<{ id: string }> {
	const id = crypto.randomUUID();
	const serviceIds = await ownedServiceIds(orgId, input.serviceIds);
	await db.transaction(async (tx) => {
		await tx.insert(schema.professional).values({
			id,
			organizationId: orgId,
			name: input.name,
			calendarId: input.calendarId || null,
			active: input.active,
		});
		await replaceProfessionalLinks(tx, id, serviceIds, input.workingHours);
	});
	return { id };
}

export async function updateProfessional(
	orgId: string,
	id: string,
	input: ProfessionalInput
): Promise<boolean> {
	const serviceIds = await ownedServiceIds(orgId, input.serviceIds);
	return await db.transaction(async (tx) => {
		const updated = await tx
			.update(schema.professional)
			.set({
				name: input.name,
				calendarId: input.calendarId || null,
				active: input.active,
			})
			.where(
				and(
					eq(schema.professional.id, id),
					eq(schema.professional.organizationId, orgId)
				)
			)
			.returning({ id: schema.professional.id });
		if (updated.length === 0) {
			return false;
		}
		await tx
			.delete(schema.professionalService)
			.where(eq(schema.professionalService.professionalId, id));
		await tx
			.delete(schema.workingHours)
			.where(eq(schema.workingHours.professionalId, id));
		await replaceProfessionalLinks(tx, id, serviceIds, input.workingHours);
		return true;
	});
}

export async function deleteProfessional(
	orgId: string,
	id: string
): Promise<boolean> {
	const deleted = await db
		.delete(schema.professional)
		.where(
			and(
				eq(schema.professional.id, id),
				eq(schema.professional.organizationId, orgId)
			)
		)
		.returning({ id: schema.professional.id });
	return deleted.length > 0;
}

/** Counts for the overview cards, in one round trip per table. */
export async function countCatalog(
	orgId: string
): Promise<{ professionals: number; services: number }> {
	const [services, professionals] = await Promise.all([
		db
			.select({ id: schema.service.id })
			.from(schema.service)
			.where(eq(schema.service.organizationId, orgId)),
		db
			.select({ id: schema.professional.id })
			.from(schema.professional)
			.where(eq(schema.professional.organizationId, orgId)),
	]);
	return { services: services.length, professionals: professionals.length };
}
