import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db, schema } from "@workspace/db";
import { createTestOrg, dropTestOrg } from "@/lib/test-org";
import {
	getIntegrationSettings,
	getOrganization,
	listWhatsappChannels,
	saveIntegrationSettings,
	updateOrganization,
} from "./organization-queries";

/**
 * Two organizations per test: whatever is written to one must be invisible from
 * the other. That is the whole tenancy guarantee, asserted at the query layer
 * where it is actually enforced.
 */

let orgId = "";
let otherOrgId = "";

beforeEach(async () => {
	orgId = await createTestOrg("organization");
	otherOrgId = await createTestOrg("organization-other");
});

afterEach(async () => {
	await dropTestOrg(orgId);
	await dropTestOrg(otherOrgId);
});

describe("integration settings", () => {
	test("returns null before anything is saved", async () => {
		expect(await getIntegrationSettings(orgId)).toBeNull();
	});

	test("creates then updates the single row per organization", async () => {
		await saveIntegrationSettings(orgId, {
			provider: "calendar",
			offsetMinutes: -180,
		});
		expect(await getIntegrationSettings(orgId)).toMatchObject({
			provider: "calendar",
			spreadsheetId: null,
			offsetMinutes: -180,
		});

		await saveIntegrationSettings(orgId, {
			provider: "sheets",
			spreadsheetId: "sheet-1",
			offsetMinutes: -240,
		});
		expect(await getIntegrationSettings(orgId)).toMatchObject({
			provider: "sheets",
			spreadsheetId: "sheet-1",
			offsetMinutes: -240,
		});

		const rows = await db.select().from(schema.integrationSettings);
		expect(rows.filter((row) => row.organizationId === orgId)).toHaveLength(1);
	});

	test("does not leak settings across organizations", async () => {
		await saveIntegrationSettings(orgId, {
			provider: "sheets",
			spreadsheetId: "sheet-1",
			offsetMinutes: -180,
		});
		expect(await getIntegrationSettings(otherOrgId)).toBeNull();
	});
});

describe("whatsapp channels", () => {
	test("lists only this organization's channels", async () => {
		await db.insert(schema.whatsappChannel).values({
			id: crypto.randomUUID(),
			organizationId: orgId,
			phoneNumberId: `phone-${crypto.randomUUID()}`,
		});
		expect(await listWhatsappChannels(orgId)).toHaveLength(1);
		expect(await listWhatsappChannels(otherOrgId)).toHaveLength(0);
	});
});

describe("organization profile", () => {
	test("reads the organization", async () => {
		expect(await getOrganization(orgId)).toMatchObject({ id: orgId });
	});

	test("returns null for an unknown organization", async () => {
		expect(await getOrganization("nope")).toBeNull();
	});

	test("updates name, slug and logo", async () => {
		const slug = `barbearia-${crypto.randomUUID().slice(0, 8)}`;
		expect(
			await updateOrganization(orgId, {
				name: "Barbearia Nova",
				slug,
				logo: "https://example.com/logo.png",
			})
		).toBe(true);
		expect(await getOrganization(orgId)).toMatchObject({
			name: "Barbearia Nova",
			slug,
			logo: "https://example.com/logo.png",
		});
	});

	test("clears the logo when given an empty string", async () => {
		await updateOrganization(orgId, {
			name: "Barbearia",
			slug: `slug-${crypto.randomUUID().slice(0, 8)}`,
			logo: "",
		});
		expect((await getOrganization(orgId))?.logo).toBeNull();
	});

	test("rejects a slug already used by another organization", async () => {
		const other = await getOrganization(otherOrgId);
		expect(
			await updateOrganization(orgId, {
				name: "Barbearia",
				slug: other?.slug ?? "",
				logo: "",
			})
		).toBe(false);
		expect((await getOrganization(orgId))?.slug).not.toBe(other?.slug);
	});

	test("accepts re-saving an organization's own slug", async () => {
		const own = await getOrganization(orgId);
		expect(
			await updateOrganization(orgId, {
				name: "Mesmo Slug",
				slug: own?.slug ?? "",
				logo: "",
			})
		).toBe(true);
		expect((await getOrganization(orgId))?.name).toBe("Mesmo Slug");
	});
});
