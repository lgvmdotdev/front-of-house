import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createTestOrg, dropTestOrg } from "@/lib/test-org";
import {
	countCatalog,
	createProfessional,
	createService,
	deleteProfessional,
	deleteService,
	listProfessionals,
	listServices,
	updateProfessional,
	updateService,
} from "./catalog-queries";

let orgId = "";
let otherOrgId = "";

const corteInput = {
	name: "Corte",
	durationMinutes: 60,
	priceCents: 5000,
	active: true,
};
const barbaInput = {
	name: "Barba",
	durationMinutes: 30,
	priceCents: 3000,
	active: true,
};

function professional(overrides: Record<string, unknown> = {}) {
	return {
		name: "Felipe",
		serviceIds: [] as string[],
		workingHours: [] as { weekday: number; start: string; end: string }[],
		active: true,
		...overrides,
	};
}

beforeEach(async () => {
	orgId = await createTestOrg("catalog");
	otherOrgId = await createTestOrg("catalog-other");
});

afterEach(async () => {
	await dropTestOrg(orgId);
	await dropTestOrg(otherOrgId);
});

describe("services", () => {
	test("creates and lists a service", async () => {
		await createService(orgId, corteInput);
		const services = await listServices(orgId);
		expect(services).toHaveLength(1);
		expect(services[0]).toMatchObject(corteInput);
	});

	test("lists services alphabetically", async () => {
		await createService(orgId, corteInput);
		await createService(orgId, barbaInput);
		expect((await listServices(orgId)).map((s) => s.name)).toEqual([
			"Barba",
			"Corte",
		]);
	});

	test("persists an inactive service", async () => {
		await createService(orgId, { ...corteInput, active: false });
		expect((await listServices(orgId))[0]?.active).toBe(false);
	});

	test("updates a service", async () => {
		const created = await createService(orgId, corteInput);
		expect(
			await updateService(orgId, created.id, {
				name: "Corte degradê",
				durationMinutes: 45,
				priceCents: 6000,
				active: false,
			})
		).toBe(true);
		expect((await listServices(orgId))[0]).toMatchObject({
			name: "Corte degradê",
			durationMinutes: 45,
			priceCents: 6000,
			active: false,
		});
	});

	test("deletes a service", async () => {
		const created = await createService(orgId, corteInput);
		expect(await deleteService(orgId, created.id)).toBe(true);
		expect(await listServices(orgId)).toHaveLength(0);
	});

	test("does not leak services across organizations", async () => {
		await createService(orgId, corteInput);
		expect(await listServices(otherOrgId)).toHaveLength(0);
	});

	test("refuses to update a service owned by another organization", async () => {
		const created = await createService(orgId, corteInput);
		expect(
			await updateService(otherOrgId, created.id, {
				name: "Invadido",
				durationMinutes: 1,
				priceCents: 1,
				active: false,
			})
		).toBe(false);
		expect((await listServices(orgId))[0]?.name).toBe("Corte");
	});

	test("refuses to delete a service owned by another organization", async () => {
		const created = await createService(orgId, corteInput);
		expect(await deleteService(otherOrgId, created.id)).toBe(false);
		expect(await listServices(orgId)).toHaveLength(1);
	});
});

describe("professionals", () => {
	test("creates a professional with services and a split shift", async () => {
		const corte = await createService(orgId, corteInput);
		const barba = await createService(orgId, barbaInput);
		await createProfessional(
			orgId,
			professional({
				serviceIds: [corte.id, barba.id],
				workingHours: [
					{ weekday: 5, start: "13:00", end: "18:00" },
					{ weekday: 5, start: "09:00", end: "12:00" },
				],
			})
		);

		const [record] = await listProfessionals(orgId);
		expect(record?.name).toBe("Felipe");
		expect(record?.serviceIds.sort()).toEqual([corte.id, barba.id].sort());
		expect(record?.workingHours.map((hours) => hours.start)).toEqual([
			"09:00",
			"13:00",
		]);
	});

	test("stores calendarId and normalises an empty one to null", async () => {
		await createProfessional(
			orgId,
			professional({ calendarId: "felipe@example.com" })
		);
		await createProfessional(
			orgId,
			professional({ name: "Bruno", calendarId: "" })
		);
		const records = await listProfessionals(orgId);
		expect(records.find((r) => r.name === "Felipe")?.calendarId).toBe(
			"felipe@example.com"
		);
		expect(records.find((r) => r.name === "Bruno")?.calendarId).toBeNull();
	});

	test("ignores service ids from another organization", async () => {
		const foreign = await createService(otherOrgId, corteInput);
		await createProfessional(orgId, professional({ serviceIds: [foreign.id] }));
		expect((await listProfessionals(orgId))[0]?.serviceIds).toEqual([]);
	});

	test("replaces services and hours on update", async () => {
		const corte = await createService(orgId, corteInput);
		const barba = await createService(orgId, barbaInput);
		const created = await createProfessional(
			orgId,
			professional({
				serviceIds: [corte.id],
				workingHours: [{ weekday: 5, start: "09:00", end: "12:00" }],
			})
		);
		expect(
			await updateProfessional(
				orgId,
				created.id,
				professional({
					name: "Felipe Souza",
					serviceIds: [barba.id],
					workingHours: [{ weekday: 6, start: "10:00", end: "16:00" }],
					active: false,
				})
			)
		).toBe(true);

		const [record] = await listProfessionals(orgId);
		expect(record).toMatchObject({ name: "Felipe Souza", active: false });
		expect(record?.serviceIds).toEqual([barba.id]);
		expect(record?.workingHours).toHaveLength(1);
		expect(record?.workingHours[0]).toMatchObject({ weekday: 6 });
	});

	test("deletes a professional and its working hours", async () => {
		const created = await createProfessional(
			orgId,
			professional({
				workingHours: [{ weekday: 5, start: "09:00", end: "18:00" }],
			})
		);
		expect(await deleteProfessional(orgId, created.id)).toBe(true);
		expect(await listProfessionals(orgId)).toHaveLength(0);
	});

	test("does not leak professionals across organizations", async () => {
		await createProfessional(orgId, professional());
		expect(await listProfessionals(otherOrgId)).toHaveLength(0);
	});

	test("refuses to update a professional owned by another organization", async () => {
		const created = await createProfessional(orgId, professional());
		expect(
			await updateProfessional(
				otherOrgId,
				created.id,
				professional({ name: "Invadido" })
			)
		).toBe(false);
		expect((await listProfessionals(orgId))[0]?.name).toBe("Felipe");
	});

	test("refuses to delete a professional owned by another organization", async () => {
		const created = await createProfessional(orgId, professional());
		expect(await deleteProfessional(otherOrgId, created.id)).toBe(false);
		expect(await listProfessionals(orgId)).toHaveLength(1);
	});

	test("a failed cross-tenant update leaves the existing links intact", async () => {
		const corte = await createService(orgId, corteInput);
		const created = await createProfessional(
			orgId,
			professional({
				serviceIds: [corte.id],
				workingHours: [{ weekday: 5, start: "09:00", end: "12:00" }],
			})
		);
		await updateProfessional(
			otherOrgId,
			created.id,
			professional({ serviceIds: [], workingHours: [] })
		);
		const [record] = await listProfessionals(orgId);
		expect(record?.serviceIds).toEqual([corte.id]);
		expect(record?.workingHours).toHaveLength(1);
	});
});

describe("countCatalog", () => {
	test("counts only this organization's rows", async () => {
		await createService(orgId, corteInput);
		await createService(orgId, barbaInput);
		await createProfessional(orgId, professional());
		await createService(otherOrgId, corteInput);

		expect(await countCatalog(orgId)).toEqual({
			services: 2,
			professionals: 1,
		});
		expect(await countCatalog(otherOrgId)).toEqual({
			services: 1,
			professionals: 0,
		});
	});
});
