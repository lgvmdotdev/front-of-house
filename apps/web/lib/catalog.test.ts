import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";
import {
	createProfessional,
	createService,
	deleteProfessional,
	deleteService,
	listProfessionals,
	listServices,
	updateProfessional,
	updateService,
} from "./catalog";

/**
 * Integration tests against the real Postgres (per the project's TDD rule — no
 * mocking the DB). Requires the docker container up + migrated:
 *   bun run --filter @workspace/db db:start && db:migrate
 * Each test runs against a throwaway organization; deleting it cascades away all
 * catalog rows, so tests stay isolated.
 */

const ORG_ID = "test-org-catalog";
const OTHER_ORG_ID = "test-org-catalog-other";

async function seedOrg(id: string): Promise<void> {
	await db.insert(schema.organization).values({
		id,
		name: `Org ${id}`,
		slug: `${id}-${crypto.randomUUID()}`,
		createdAt: new Date(),
	});
}

async function dropOrg(id: string): Promise<void> {
	await db.delete(schema.organization).where(eq(schema.organization.id, id));
}

beforeEach(async () => {
	await dropOrg(ORG_ID);
	await dropOrg(OTHER_ORG_ID);
	await seedOrg(ORG_ID);
	await seedOrg(OTHER_ORG_ID);
});

afterEach(async () => {
	await dropOrg(ORG_ID);
	await dropOrg(OTHER_ORG_ID);
});

describe("services", () => {
	test("creates and lists a service", async () => {
		await createService(ORG_ID, {
			name: "Corte",
			durationMinutes: 60,
			priceCents: 5000,
		});
		const services = await listServices(ORG_ID);
		expect(services).toHaveLength(1);
		expect(services[0]).toMatchObject({
			name: "Corte",
			durationMinutes: 60,
			priceCents: 5000,
			active: true,
		});
	});

	test("updates a service", async () => {
		const created = await createService(ORG_ID, {
			name: "Corte",
			durationMinutes: 60,
			priceCents: 5000,
		});
		await updateService(ORG_ID, created.id, {
			name: "Corte degradê",
			durationMinutes: 45,
			priceCents: 6000,
		});
		const [service] = await listServices(ORG_ID);
		expect(service).toMatchObject({ name: "Corte degradê", priceCents: 6000 });
	});

	test("deletes a service", async () => {
		const created = await createService(ORG_ID, {
			name: "Corte",
			durationMinutes: 60,
			priceCents: 5000,
		});
		await deleteService(ORG_ID, created.id);
		expect(await listServices(ORG_ID)).toHaveLength(0);
	});

	test("does not leak services across organizations", async () => {
		await createService(ORG_ID, {
			name: "Corte",
			durationMinutes: 60,
			priceCents: 5000,
		});
		expect(await listServices(OTHER_ORG_ID)).toHaveLength(0);
	});

	test("does not update a service belonging to another org", async () => {
		const created = await createService(ORG_ID, {
			name: "Corte",
			durationMinutes: 60,
			priceCents: 5000,
		});
		await updateService(OTHER_ORG_ID, created.id, {
			name: "Hacked",
			durationMinutes: 1,
			priceCents: 1,
		});
		const [service] = await listServices(ORG_ID);
		expect(service?.name).toBe("Corte");
	});
});

describe("professionals", () => {
	test("creates a professional with services and working hours", async () => {
		const corte = await createService(ORG_ID, {
			name: "Corte",
			durationMinutes: 60,
			priceCents: 5000,
		});
		const barba = await createService(ORG_ID, {
			name: "Barba",
			durationMinutes: 30,
			priceCents: 3000,
		});
		await createProfessional(ORG_ID, {
			name: "Felipe",
			serviceIds: [corte.id, barba.id],
			workingHours: [{ weekday: 5, start: "09:00", end: "18:00" }],
		});

		const [professional] = await listProfessionals(ORG_ID);
		expect(professional?.name).toBe("Felipe");
		expect(professional?.serviceIds.sort()).toEqual(
			[corte.id, barba.id].sort()
		);
		expect(professional?.workingHours).toHaveLength(1);
		expect(professional?.workingHours[0]).toMatchObject({
			weekday: 5,
			start: "09:00",
			end: "18:00",
		});
	});

	test("ignores service ids from other organizations", async () => {
		const foreignService = await createService(OTHER_ORG_ID, {
			name: "Alheio",
			durationMinutes: 60,
			priceCents: 5000,
		});
		await createProfessional(ORG_ID, {
			name: "Felipe",
			serviceIds: [foreignService.id],
			workingHours: [],
		});
		const [professional] = await listProfessionals(ORG_ID);
		expect(professional?.serviceIds).toEqual([]);
	});

	test("replaces services and hours on update", async () => {
		const corte = await createService(ORG_ID, {
			name: "Corte",
			durationMinutes: 60,
			priceCents: 5000,
		});
		const barba = await createService(ORG_ID, {
			name: "Barba",
			durationMinutes: 30,
			priceCents: 3000,
		});
		const created = await createProfessional(ORG_ID, {
			name: "Felipe",
			serviceIds: [corte.id],
			workingHours: [{ weekday: 5, start: "09:00", end: "12:00" }],
		});
		await updateProfessional(ORG_ID, created.id, {
			name: "Felipe Souza",
			serviceIds: [barba.id],
			workingHours: [{ weekday: 6, start: "10:00", end: "16:00" }],
		});

		const [professional] = await listProfessionals(ORG_ID);
		expect(professional?.name).toBe("Felipe Souza");
		expect(professional?.serviceIds).toEqual([barba.id]);
		expect(professional?.workingHours).toHaveLength(1);
		expect(professional?.workingHours[0]).toMatchObject({ weekday: 6 });
	});

	test("deletes a professional and its links", async () => {
		const created = await createProfessional(ORG_ID, {
			name: "Felipe",
			serviceIds: [],
			workingHours: [{ weekday: 5, start: "09:00", end: "18:00" }],
		});
		await deleteProfessional(ORG_ID, created.id);
		expect(await listProfessionals(ORG_ID)).toHaveLength(0);
	});
});
