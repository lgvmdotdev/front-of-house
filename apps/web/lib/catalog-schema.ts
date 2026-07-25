import { timeOfDaySchema } from "@workspace/bookings/types";
import { z } from "zod";

/**
 * Validation for catalog forms and server actions. Imports from the
 * `@workspace/bookings/types` subpath (zod only) so it stays free of the
 * googleapis adapter code and is safe in client bundles.
 */

const MAX_WEEKDAY = 6;

export const serviceInputSchema = z.object({
	name: z.string().min(1, "Informe o nome do serviço"),
	durationMinutes: z.number().int().positive("Duração inválida"),
	priceCents: z.number().int().nonnegative("Preço inválido"),
});
export type ServiceInput = z.infer<typeof serviceInputSchema>;

export const workingHourInputSchema = z
	.object({
		weekday: z.number().int().min(0).max(MAX_WEEKDAY),
		start: timeOfDaySchema,
		end: timeOfDaySchema,
	})
	.refine((hours) => hours.start < hours.end, {
		message: "O início deve ser antes do fim",
		path: ["end"],
	});
export type WorkingHourInput = z.infer<typeof workingHourInputSchema>;

export const professionalInputSchema = z.object({
	name: z.string().min(1, "Informe o nome do profissional"),
	serviceIds: z.array(z.string().min(1)),
	workingHours: z.array(workingHourInputSchema),
	calendarId: z.string().trim().optional(),
});
export type ProfessionalInput = z.infer<typeof professionalInputSchema>;
