import { timeOfDaySchema } from "@workspace/bookings/types";
import { z } from "zod";
import { findOverlappingWindow } from "./working-hours";

/**
 * Validation for the catalog forms and the server actions behind them. Imports
 * the `@workspace/bookings/types` subpath (zod only, no googleapis) so it is safe
 * in a client bundle.
 */

const MAX_WEEKDAY = 6;
/** R$ 100.000,00 — a sanity ceiling, not a business rule. */
const MAX_PRICE_CENTS = 10_000_000;
/** A single window cannot be longer than a day. */
const MAX_DURATION_MINUTES = 24 * 60;

export const serviceInputSchema = z.object({
	name: z.string().trim().min(1, "Informe o nome do serviço"),
	durationMinutes: z
		.number()
		.int("Duração inválida")
		.positive("Duração inválida")
		.max(MAX_DURATION_MINUTES, "Duração inválida"),
	priceCents: z
		.number()
		.int("Preço inválido")
		.nonnegative("Preço inválido")
		.max(MAX_PRICE_CENTS, "Preço inválido"),
	active: z.boolean(),
});
export type ServiceInput = z.infer<typeof serviceInputSchema>;

export const workingHourInputSchema = z
	.object({
		weekday: z
			.number()
			.int()
			.min(0, "Dia da semana inválido")
			.max(MAX_WEEKDAY, "Dia da semana inválido"),
		start: timeOfDaySchema,
		end: timeOfDaySchema,
	})
	.refine((hours) => hours.start < hours.end, {
		message: "O início deve ser antes do fim",
		path: ["end"],
	});
export type WorkingHourInput = z.infer<typeof workingHourInputSchema>;

export const professionalInputSchema = z.object({
	name: z.string().trim().min(1, "Informe o nome do profissional"),
	serviceIds: z.array(z.string().min(1)),
	workingHours: z
		.array(workingHourInputSchema)
		.refine((hours) => findOverlappingWindow(hours) === null, {
			message: "Há horários sobrepostos no mesmo dia",
		}),
	calendarId: z.string().trim().optional(),
	active: z.boolean(),
});
export type ProfessionalInput = z.infer<typeof professionalInputSchema>;
