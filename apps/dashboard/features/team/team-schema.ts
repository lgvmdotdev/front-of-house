import { z } from "zod";

/** better-auth's default organization roles. */
export const MEMBER_ROLES = [
	{ value: "owner", label: "Proprietário" },
	{ value: "admin", label: "Administrador" },
	{ value: "member", label: "Membro" },
] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number]["value"];

export function memberRoleLabel(role: string | null): string {
	return MEMBER_ROLES.find((option) => option.value === role)?.label ?? "—";
}

export const invitationInputSchema = z.object({
	email: z.string().trim().toLowerCase().email("E-mail inválido"),
	role: z.enum(["owner", "admin", "member"], { message: "Escolha um papel" }),
});
export type InvitationInput = z.infer<typeof invitationInputSchema>;

export const memberRoleInputSchema = z.object({
	memberId: z.string().min(1),
	role: z.enum(["owner", "admin", "member"], { message: "Escolha um papel" }),
});
