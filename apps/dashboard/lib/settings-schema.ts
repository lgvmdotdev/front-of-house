import { z } from "zod";

/**
 * Validation for the non-catalog tenant settings: the booking backend, the
 * barbershop's own profile, and team invitations.
 */

/**
 * The providers `@workspace/bookings`' factory actually understands: `sheets`
 * routes to `SpreadsheetBookingEngine` and needs a `spreadsheetId`, anything
 * else falls back to the Google Calendar engine.
 */
export const BOOKING_PROVIDERS = [
	{ value: "calendar", label: "Google Agenda" },
	{ value: "sheets", label: "Planilha Google" },
] as const;

/** UTC-3 (Brasília). Brazil has had no DST since 2019, so a fixed offset holds. */
const MINUTES_PER_DAY = 24 * 60;

export const integrationInputSchema = z
	.object({
		provider: z.enum(["calendar", "sheets"], {
			message: "Escolha um provedor",
		}),
		spreadsheetId: z.string().trim().optional(),
		offsetMinutes: z
			.number()
			.int("Fuso inválido")
			.min(-MINUTES_PER_DAY, "Fuso inválido")
			.max(MINUTES_PER_DAY, "Fuso inválido"),
	})
	.refine(
		(input) => input.provider !== "sheets" || Boolean(input.spreadsheetId),
		{
			message: "Informe o ID da planilha para usar Planilha Google",
			path: ["spreadsheetId"],
		}
	);
export type IntegrationInput = z.infer<typeof integrationInputSchema>;

/** Lowercase letters, digits and single hyphens — it is a URL segment. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const organizationInputSchema = z.object({
	name: z.string().trim().min(1, "Informe o nome da barbearia"),
	slug: z
		.string()
		.trim()
		.min(2, "O identificador precisa ter ao menos 2 caracteres")
		.regex(
			SLUG_PATTERN,
			"Use apenas letras minúsculas, números e hífens (ex.: barbearia-demo)"
		),
	logo: z.union([z.literal(""), z.string().trim().url("URL inválida")]),
});
export type OrganizationInput = z.infer<typeof organizationInputSchema>;

/** better-auth's default organization roles. */
export const MEMBER_ROLES = [
	{ value: "owner", label: "Proprietário" },
	{ value: "admin", label: "Administrador" },
	{ value: "member", label: "Membro" },
] as const;

export const invitationInputSchema = z.object({
	email: z.string().trim().toLowerCase().email("E-mail inválido"),
	role: z.enum(["owner", "admin", "member"], { message: "Escolha um papel" }),
});
export type InvitationInput = z.infer<typeof invitationInputSchema>;

export const memberRoleInputSchema = z.object({
	memberId: z.string().min(1),
	role: z.enum(["owner", "admin", "member"], { message: "Escolha um papel" }),
});

/** Admin panel: create a barbershop together with its first owner. */
export const tenantInputSchema = z.object({
	name: z.string().trim().min(1, "Informe o nome da barbearia"),
	slug: z
		.string()
		.trim()
		.min(2, "O identificador precisa ter ao menos 2 caracteres")
		.regex(
			SLUG_PATTERN,
			"Use apenas letras minúsculas, números e hífens (ex.: barbearia-demo)"
		),
	ownerName: z.string().trim().min(1, "Informe o nome do proprietário"),
	ownerEmail: z.string().trim().toLowerCase().email("E-mail inválido"),
	ownerPassword: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
});
export type TenantInput = z.infer<typeof tenantInputSchema>;
