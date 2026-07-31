import { auth } from "@workspace/auth";
import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";

/**
 * Idempotent development fixtures: one internal admin, one demo barbershop with
 * a full catalog, a booking integration, a WhatsApp channel and two
 * conversations. Run it as many times as you like — `bun run seed`.
 *
 * Idempotency strategy: everything whose id we control uses a stable `seed-*`
 * id and `onConflictDoUpdate`, so a second run rewrites the same rows instead of
 * adding new ones. Users and the organization get their ids from better-auth, so
 * those are looked up by their natural key (email / slug) before being created.
 *
 * Users are created through `auth.api.createUser` rather than raw inserts: it is
 * the one admin endpoint that skips authentication when called with no headers,
 * and it hashes the password and links the `credential` account for us.
 */

const ADMIN = {
	email: "admin@recepcionai.test",
	name: "Equipe Recepcionai",
	password: "Admin123!",
} as const;

const OWNER = {
	email: "dono@barbearia-demo.test",
	name: "Dono da Barbearia",
	password: "Dono123!",
} as const;

const ORG = { name: "Barbearia Demo", slug: "barbearia-demo" } as const;

const SERVICES = [
	{
		id: "seed-svc-corte",
		name: "Corte",
		durationMinutes: 30,
		priceCents: 4500,
		active: true,
	},
	{
		id: "seed-svc-barba",
		name: "Barba",
		durationMinutes: 20,
		priceCents: 3000,
		active: true,
	},
	{
		id: "seed-svc-combo",
		name: "Corte + Barba",
		durationMinutes: 50,
		priceCents: 7000,
		active: true,
	},
] as const;

const PROFESSIONALS = [
	{
		id: "seed-pro-felipe",
		name: "Felipe",
		calendarId: "felipe@barbearia-demo.test",
		active: true,
		serviceIds: ["seed-svc-corte", "seed-svc-barba", "seed-svc-combo"],
		// Tuesday–Friday split shift, Saturday straight through.
		workingHours: [
			{ weekday: 2, start: "09:00", end: "12:00" },
			{ weekday: 2, start: "13:00", end: "19:00" },
			{ weekday: 3, start: "09:00", end: "12:00" },
			{ weekday: 3, start: "13:00", end: "19:00" },
			{ weekday: 4, start: "09:00", end: "12:00" },
			{ weekday: 4, start: "13:00", end: "19:00" },
			{ weekday: 5, start: "09:00", end: "12:00" },
			{ weekday: 5, start: "13:00", end: "19:00" },
			{ weekday: 6, start: "09:00", end: "17:00" },
		],
	},
	{
		id: "seed-pro-bruno",
		name: "Bruno",
		calendarId: "bruno@barbearia-demo.test",
		active: true,
		serviceIds: ["seed-svc-corte", "seed-svc-combo"],
		workingHours: [
			{ weekday: 1, start: "10:00", end: "18:00" },
			{ weekday: 3, start: "10:00", end: "18:00" },
			{ weekday: 5, start: "10:00", end: "20:00" },
		],
	},
] as const;

const INTEGRATION = {
	id: "seed-integration-demo",
	provider: "sheets",
	spreadsheetId: "1SeedDemoSpreadsheetIdForLocalDevelopment",
	offsetMinutes: -180,
} as const;

const CHANNEL = {
	id: "seed-wa-demo",
	phoneNumberId: "550000000000",
} as const;

const CONVERSATIONS = [
	{
		id: "seed-conv-open",
		customerPhone: "5551999990001",
		status: "open",
		messages: [
			{ role: "user", content: "Boa tarde! Tem horário hoje pra corte?" },
			{
				role: "assistant",
				content:
					"Boa tarde! Tenho sim. Com o Felipe às 16:00 ou com o Bruno às 17:30. Qual prefere?",
			},
			{ role: "user", content: "Com o Felipe às 16:00, por favor." },
			{
				role: "assistant",
				content:
					"Fechado! Corte com o Felipe hoje às 16:00. Te mando uma confirmação mais perto do horário.",
			},
		],
	},
	{
		id: "seed-conv-handed-off",
		customerPhone: "5551999990002",
		status: "handed_off",
		messages: [
			{ role: "user", content: "Vocês fazem pigmentação de barba?" },
			{
				role: "assistant",
				content:
					"Esse serviço não está na minha lista. Vou chamar alguém da barbearia pra te responder, um instante.",
			},
		],
	},
] as const;

const MILLISECONDS_PER_MINUTE = 60_000;

async function ensureUser(input: {
	email: string;
	name: string;
	password: string;
	role?: "admin";
}): Promise<string> {
	const existing = await db.query.user.findFirst({
		where: eq(schema.user.email, input.email),
		columns: { id: true },
	});
	if (existing) {
		if (input.role) {
			await db
				.update(schema.user)
				.set({ role: input.role })
				.where(eq(schema.user.id, existing.id));
		}
		return existing.id;
	}
	// No `headers` on purpose: that is what lets `createUser` run unauthenticated.
	const created = await auth.api.createUser({
		body: {
			email: input.email,
			name: input.name,
			password: input.password,
			...(input.role ? { role: input.role } : {}),
		},
	});
	return created.user.id;
}

async function ensureOrganization(ownerId: string): Promise<string> {
	const existing = await db.query.organization.findFirst({
		where: eq(schema.organization.slug, ORG.slug),
		columns: { id: true },
	});
	if (existing) {
		return existing.id;
	}
	// `userId` with no `headers` is better-auth's documented server-only path; it
	// attributes ownership to the owner user and applies `creatorRole: "owner"`.
	const created = await auth.api.createOrganization({
		body: { name: ORG.name, slug: ORG.slug, userId: ownerId },
	});
	if (!created) {
		throw new Error("better-auth returned no organization");
	}
	return created.id;
}

async function ensureMembership(
	organizationId: string,
	userId: string,
	role: "owner" | "admin" | "member"
): Promise<void> {
	const existing = await db.query.member.findFirst({
		where: eq(schema.member.userId, userId),
		columns: { id: true, organizationId: true },
	});
	if (existing?.organizationId === organizationId) {
		return;
	}
	await auth.api.addMember({ body: { userId, organizationId, role } });
}

async function seedCatalog(organizationId: string): Promise<void> {
	for (const service of SERVICES) {
		const values = {
			name: service.name,
			durationMinutes: service.durationMinutes,
			priceCents: service.priceCents,
			active: service.active,
		};
		await db
			.insert(schema.service)
			.values({ id: service.id, organizationId, ...values })
			.onConflictDoUpdate({ target: schema.service.id, set: values });
	}

	for (const professional of PROFESSIONALS) {
		const values = {
			name: professional.name,
			calendarId: professional.calendarId,
			active: professional.active,
		};
		await db
			.insert(schema.professional)
			.values({ id: professional.id, organizationId, ...values })
			.onConflictDoUpdate({ target: schema.professional.id, set: values });

		await db
			.insert(schema.professionalService)
			.values(
				professional.serviceIds.map((serviceId) => ({
					professionalId: professional.id,
					serviceId,
				}))
			)
			.onConflictDoNothing();

		// Working-hours rows have no natural key, so the seed owns the whole set
		// for its professionals: clear and rewrite.
		await db
			.delete(schema.workingHours)
			.where(eq(schema.workingHours.professionalId, professional.id));
		await db.insert(schema.workingHours).values(
			professional.workingHours.map((hours, index) => ({
				id: `seed-hours-${professional.id}-${index}`,
				professionalId: professional.id,
				weekday: hours.weekday,
				start: hours.start,
				end: hours.end,
			}))
		);
	}
}

async function seedIntegration(organizationId: string): Promise<void> {
	const values = {
		provider: INTEGRATION.provider,
		spreadsheetId: INTEGRATION.spreadsheetId,
		offsetMinutes: INTEGRATION.offsetMinutes,
	};
	await db
		.insert(schema.integrationSettings)
		.values({ id: INTEGRATION.id, organizationId, ...values })
		.onConflictDoUpdate({
			target: schema.integrationSettings.organizationId,
			set: values,
		});
}

async function seedChannel(organizationId: string): Promise<void> {
	await db
		.insert(schema.whatsappChannel)
		.values({
			id: CHANNEL.id,
			organizationId,
			phoneNumberId: CHANNEL.phoneNumberId,
		})
		.onConflictDoUpdate({
			target: schema.whatsappChannel.phoneNumberId,
			set: { organizationId },
		});
}

async function seedConversations(organizationId: string): Promise<void> {
	for (const conversation of CONVERSATIONS) {
		const values = {
			customerPhone: conversation.customerPhone,
			status: conversation.status,
			lastMessageAt: new Date(),
		};
		await db
			.insert(schema.conversation)
			.values({ id: conversation.id, organizationId, ...values })
			.onConflictDoUpdate({ target: schema.conversation.id, set: values });

		for (const [index, message] of conversation.messages.entries()) {
			const messageValues = {
				role: message.role,
				content: message.content,
				// Spread the transcript over the last few minutes so it reads in order.
				createdAt: new Date(
					Date.now() -
						(conversation.messages.length - index) * MILLISECONDS_PER_MINUTE
				),
			};
			await db
				.insert(schema.conversationMessage)
				.values({
					id: `seed-msg-${conversation.id}-${index}`,
					conversationId: conversation.id,
					...messageValues,
				})
				.onConflictDoUpdate({
					target: schema.conversationMessage.id,
					set: messageValues,
				});
		}
	}
}

async function seed(): Promise<void> {
	const adminId = await ensureUser({ ...ADMIN, role: "admin" });
	const ownerId = await ensureUser(OWNER);
	const organizationId = await ensureOrganization(ownerId);
	await ensureMembership(organizationId, ownerId, "owner");
	await seedCatalog(organizationId);
	await seedIntegration(organizationId);
	await seedChannel(organizationId);
	await seedConversations(organizationId);

	process.stdout.write(
		[
			"Seed concluído.",
			`  admin  ${ADMIN.email} / ${ADMIN.password}  (id ${adminId})`,
			`  dono   ${OWNER.email} / ${OWNER.password}  (id ${ownerId})`,
			`  org    ${ORG.name} (${ORG.slug}) id ${organizationId}`,
			`  ${SERVICES.length} serviços, ${PROFESSIONALS.length} profissionais, ${CONVERSATIONS.length} conversas`,
			"",
		].join("\n")
	);
}

await seed();
