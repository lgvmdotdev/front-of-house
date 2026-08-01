import { z } from "zod";
import { slugSchema } from "@/features/organization/organization-schema";

/** Admin panel: create a barbershop together with its first owner. */
export const tenantInputSchema = z.object({
	name: z.string().trim().min(1, "Informe o nome da barbearia"),
	slug: slugSchema,
	ownerName: z.string().trim().min(1, "Informe o nome do proprietário"),
	ownerEmail: z.string().trim().toLowerCase().email("E-mail inválido"),
	ownerPassword: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
});
export type TenantInput = z.infer<typeof tenantInputSchema>;
