import { z } from "zod";

/**
 * Validation for the barbershop's own settings: the booking backend and the
 * shop profile. No `server-only` here — the forms import these too.
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
const DEFAULT_TIME_ZONE = "America/Sao_Paulo";
const DEFAULT_OFFSET_MINUTES = -180;
const MINUTES_PER_DAY = 24 * 60;

/**
 * Brazilian IANA zones, east to west. We store a fixed offset (see above), so
 * the zone name is only how the operator picks — and how we match the browser's
 * `Intl.DateTimeFormat().resolvedOptions().timeZone`.
 */
export const TIME_ZONES = [
	{ value: "America/Noronha", label: "Fernando de Noronha", offset: -120 },
	{
		value: "America/Sao_Paulo",
		label: "Brasília, São Paulo, Rio de Janeiro",
		offset: -180,
	},
	{ value: "America/Bahia", label: "Salvador", offset: -180 },
	{
		value: "America/Fortaleza",
		label: "Fortaleza, Natal, João Pessoa, Teresina",
		offset: -180,
	},
	{ value: "America/Recife", label: "Recife", offset: -180 },
	{ value: "America/Maceio", label: "Maceió, Aracaju", offset: -180 },
	{ value: "America/Belem", label: "Belém, São Luís", offset: -180 },
	{ value: "America/Santarem", label: "Santarém", offset: -180 },
	{ value: "America/Araguaina", label: "Palmas", offset: -180 },
	{ value: "America/Campo_Grande", label: "Campo Grande", offset: -240 },
	{ value: "America/Cuiaba", label: "Cuiabá", offset: -240 },
	{ value: "America/Manaus", label: "Manaus", offset: -240 },
	{ value: "America/Porto_Velho", label: "Porto Velho", offset: -240 },
	{ value: "America/Boa_Vista", label: "Boa Vista", offset: -240 },
	{ value: "America/Rio_Branco", label: "Rio Branco", offset: -300 },
	{ value: "America/Eirunepe", label: "Eirunepé", offset: -300 },
] as const;

/** Unknown zone (browser outside Brazil) falls back to Brasília. */
export function timeZoneOffsetMinutes(zone: string): number {
	return (
		TIME_ZONES.find((option) => option.value === zone)?.offset ??
		DEFAULT_OFFSET_MINUTES
	);
}

/** First zone sharing a saved offset — enough to preselect the dropdown. */
export function timeZoneForOffset(offsetMinutes?: number): string {
	return (
		TIME_ZONES.find((option) => option.offset === offsetMinutes)?.value ??
		DEFAULT_TIME_ZONE
	);
}

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

/** Shared with the admin panel's tenant-creation form. */
export const slugSchema = z
	.string()
	.trim()
	.min(2, "O identificador precisa ter ao menos 2 caracteres")
	.regex(
		SLUG_PATTERN,
		"Use apenas letras minúsculas, números e hífens (ex.: barbearia-demo)"
	);

export const organizationInputSchema = z.object({
	name: z.string().trim().min(1, "Informe o nome da barbearia"),
	slug: slugSchema,
	logo: z.union([z.literal(""), z.string().trim().url("URL inválida")]),
});
export type OrganizationInput = z.infer<typeof organizationInputSchema>;
