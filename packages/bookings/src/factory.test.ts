import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";
import { JWT } from "google-auth-library";
import { GoogleCalendarBookingEngine } from "./calendar/adapter";
import { createBookingEngineForOrg } from "./factory";
import { SpreadsheetBookingEngine } from "./sheets/adapter";

/**
 * Integration tests against the real Postgres (per the project's TDD rule —
 * no mocking the DB). Requires the docker container up + migrated:
 *   bun run --filter @workspace/db db:start && db:migrate
 *
 * `googleAuth` only needs to construct without making a network call — the
 * factory itself never authenticates, it just wires the adapter. Google APIs
 * are a true external boundary; nothing here calls them.
 */

const ORG_ID = "test-org-factory";
const OTHER_ORG_ID = "test-org-factory-no-settings";

const fakeGoogleAuth = new JWT({
	email: "fake-service-account@example.com",
	key: "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n",
	scopes: ["https://www.googleapis.com/auth/calendar"],
});

async function cleanup(): Promise<void> {
	await db
		.delete(schema.organization)
		.where(eq(schema.organization.id, ORG_ID));
	await db
		.delete(schema.organization)
		.where(eq(schema.organization.id, OTHER_ORG_ID));
}

async function seedOrg(id: string): Promise<void> {
	await db.insert(schema.organization).values({
		id,
		name: `Org ${id}`,
		slug: `${id}-${crypto.randomUUID()}`,
		createdAt: new Date(),
	});
}

beforeEach(async () => {
	await cleanup();
	await seedOrg(ORG_ID);
	await seedOrg(OTHER_ORG_ID);
});

afterEach(cleanup);

describe("createBookingEngineForOrg", () => {
	test("defaults to GoogleCalendarBookingEngine when there's no integrationSettings row", async () => {
		const engine = await createBookingEngineForOrg(OTHER_ORG_ID, {
			googleAuth: fakeGoogleAuth,
		});

		expect(engine).toBeInstanceOf(GoogleCalendarBookingEngine);
	});

	test("builds the calendar engine from the org's catalog", async () => {
		const service = await db
			.insert(schema.service)
			.values({
				id: "svc-corte",
				organizationId: ORG_ID,
				name: "Corte",
				durationMinutes: 60,
				priceCents: 5000,
			})
			.returning();
		const professional = await db
			.insert(schema.professional)
			.values({
				id: "prof-joao",
				organizationId: ORG_ID,
				name: "João",
				calendarId: "joao@example.com",
			})
			.returning();
		await db.insert(schema.professionalService).values({
			professionalId: professional[0]?.id ?? "",
			serviceId: service[0]?.id ?? "",
		});
		await db.insert(schema.workingHours).values({
			id: "hours-joao-mon",
			professionalId: professional[0]?.id ?? "",
			weekday: 1,
			start: "09:00",
			end: "18:00",
		});

		const engine = await createBookingEngineForOrg(ORG_ID, {
			googleAuth: fakeGoogleAuth,
		});

		expect(engine).toBeInstanceOf(GoogleCalendarBookingEngine);
		expect(await engine.listServices()).toEqual([
			{
				id: "svc-corte",
				name: "Corte",
				durationMinutes: 60,
				price: { amountCents: 5000, currency: "BRL" },
			},
		]);
		expect(await engine.listProfessionals()).toEqual([
			{
				id: "prof-joao",
				name: "João",
				serviceIds: ["svc-corte"],
				workingHours: [{ weekday: 1, start: "09:00", end: "18:00" }],
			},
		]);
	});

	test("ignores professionals without a calendarId for the calendar engine", async () => {
		await db.insert(schema.professional).values({
			id: "prof-no-calendar",
			organizationId: ORG_ID,
			name: "Sem calendário",
		});

		const engine = await createBookingEngineForOrg(ORG_ID, {
			googleAuth: fakeGoogleAuth,
		});

		expect(await engine.listProfessionals()).toEqual([]);
	});

	test("uses SpreadsheetBookingEngine when integrationSettings.provider is 'sheets'", async () => {
		await db.insert(schema.integrationSettings).values({
			id: "settings-1",
			organizationId: ORG_ID,
			provider: "sheets",
			spreadsheetId: "fake-spreadsheet-id",
		});

		const engine = await createBookingEngineForOrg(ORG_ID, {
			googleAuth: fakeGoogleAuth,
		});

		expect(engine).toBeInstanceOf(SpreadsheetBookingEngine);
	});

	test("falls back to the calendar engine when provider is 'sheets' but spreadsheetId is missing", async () => {
		await db.insert(schema.integrationSettings).values({
			id: "settings-2",
			organizationId: ORG_ID,
			provider: "sheets",
			spreadsheetId: null,
		});

		const engine = await createBookingEngineForOrg(ORG_ID, {
			googleAuth: fakeGoogleAuth,
		});

		expect(engine).toBeInstanceOf(GoogleCalendarBookingEngine);
	});
});
