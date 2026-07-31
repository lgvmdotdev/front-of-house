import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { db, schema } from "@workspace/db";
import {
	getConversation,
	getIntegrationSettings,
	getOrganization,
	isConversationStatus,
	listConversations,
	listMembers,
	listPendingInvitations,
	listWhatsappChannels,
	saveIntegrationSettings,
	updateOrganization,
} from "./tenant";
import {
	createTestOrg,
	createTestUser,
	dropTestOrg,
	dropTestUser,
} from "./test-org";

let orgId = "";
let otherOrgId = "";
const userIds: string[] = [];

beforeEach(async () => {
	orgId = await createTestOrg("tenant");
	otherOrgId = await createTestOrg("tenant-other");
});

afterEach(async () => {
	await dropTestOrg(orgId);
	await dropTestOrg(otherOrgId);
	while (userIds.length > 0) {
		const id = userIds.pop();
		if (id) {
			await dropTestUser(id);
		}
	}
});

async function seedConversation(
	organizationId: string,
	options: { phone: string; status: string; messages?: string[] }
): Promise<string> {
	const id = crypto.randomUUID();
	await db.insert(schema.conversation).values({
		id,
		organizationId,
		customerPhone: options.phone,
		status: options.status,
		lastMessageAt: new Date(),
	});
	const messages = options.messages ?? [];
	for (const [index, content] of messages.entries()) {
		await db.insert(schema.conversationMessage).values({
			id: crypto.randomUUID(),
			conversationId: id,
			role: index % 2 === 0 ? "user" : "assistant",
			content,
			createdAt: new Date(Date.now() + index * 1000),
		});
	}
	return id;
}

async function seedMember(
	organizationId: string,
	role: string
): Promise<string> {
	const userId = await createTestUser("member");
	userIds.push(userId);
	const id = crypto.randomUUID();
	await db.insert(schema.member).values({
		id,
		organizationId,
		userId,
		role,
		createdAt: new Date(),
	});
	return id;
}

describe("isConversationStatus", () => {
	test("accepts the three schema statuses and rejects anything else", () => {
		for (const status of ["open", "handed_off", "closed"]) {
			expect(isConversationStatus(status)).toBe(true);
		}
		for (const status of ["", "OPEN", "arquivada"]) {
			expect(isConversationStatus(status)).toBe(false);
		}
	});
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

describe("conversations", () => {
	test("lists newest first", async () => {
		await seedConversation(orgId, { phone: "5551111", status: "open" });
		await seedConversation(orgId, { phone: "5552222", status: "closed" });
		const conversations = await listConversations(orgId);
		expect(conversations).toHaveLength(2);
		expect(conversations[0]?.lastMessageAt.getTime()).toBeGreaterThanOrEqual(
			conversations[1]?.lastMessageAt.getTime() ?? 0
		);
	});

	test("filters by status", async () => {
		await seedConversation(orgId, { phone: "5551111", status: "open" });
		await seedConversation(orgId, { phone: "5552222", status: "handed_off" });
		await seedConversation(orgId, { phone: "5553333", status: "closed" });

		expect(await listConversations(orgId, "open")).toHaveLength(1);
		expect(await listConversations(orgId, "handed_off")).toHaveLength(1);
		expect(await listConversations(orgId, "closed")).toHaveLength(1);
		expect(await listConversations(orgId)).toHaveLength(3);
	});

	test("does not leak conversations across organizations", async () => {
		await seedConversation(orgId, { phone: "5551111", status: "open" });
		expect(await listConversations(otherOrgId)).toHaveLength(0);
	});

	test("reads a transcript in chronological order", async () => {
		const id = await seedConversation(orgId, {
			phone: "5551111",
			status: "open",
			messages: ["Oi", "Olá! Como posso ajudar?", "Quero cortar o cabelo"],
		});
		const thread = await getConversation(orgId, id);
		expect(thread?.messages.map((message) => message.content)).toEqual([
			"Oi",
			"Olá! Como posso ajudar?",
			"Quero cortar o cabelo",
		]);
		expect(thread?.messages.map((message) => message.role)).toEqual([
			"user",
			"assistant",
			"user",
		]);
	});

	test("returns null for a conversation belonging to another organization", async () => {
		const id = await seedConversation(orgId, {
			phone: "5551111",
			status: "open",
			messages: ["Segredo"],
		});
		expect(await getConversation(otherOrgId, id)).toBeNull();
	});

	test("returns null for an unknown id", async () => {
		expect(await getConversation(orgId, crypto.randomUUID())).toBeNull();
	});
});

describe("team", () => {
	test("lists members with their user details", async () => {
		await seedMember(orgId, "owner");
		const members = await listMembers(orgId);
		expect(members).toHaveLength(1);
		expect(members[0]?.role).toBe("owner");
		expect(members[0]?.email).toContain("@example.test");
	});

	test("does not leak members across organizations", async () => {
		await seedMember(orgId, "owner");
		expect(await listMembers(otherOrgId)).toHaveLength(0);
	});

	test("lists only pending invitations, scoped to the organization", async () => {
		const inviterId = await createTestUser("inviter");
		userIds.push(inviterId);
		const base = {
			organizationId: orgId,
			inviterId,
			expiresAt: new Date(Date.now() + 86_400_000),
			createdAt: new Date(),
			role: "member",
		};
		await db.insert(schema.invitation).values([
			{
				...base,
				id: crypto.randomUUID(),
				email: "a@x.test",
				status: "pending",
			},
			{
				...base,
				id: crypto.randomUUID(),
				email: "b@x.test",
				status: "canceled",
			},
			{
				...base,
				id: crypto.randomUUID(),
				email: "c@x.test",
				status: "accepted",
			},
		]);

		const pending = await listPendingInvitations(orgId);
		expect(pending).toHaveLength(1);
		expect(pending[0]?.email).toBe("a@x.test");
		expect(await listPendingInvitations(otherOrgId)).toHaveLength(0);
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
		).toEqual({ ok: true });
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
		).toEqual({ ok: false, reason: "slug-taken" });
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
		).toEqual({ ok: true });
		expect((await getOrganization(orgId))?.name).toBe("Mesmo Slug");
	});
});
