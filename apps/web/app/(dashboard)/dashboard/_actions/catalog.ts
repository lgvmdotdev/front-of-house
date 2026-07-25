"use server";

import { revalidatePath } from "next/cache";
import {
	createProfessional,
	createService,
	deleteProfessional,
	deleteService,
	updateProfessional,
	updateService,
} from "@/lib/catalog";
import {
	professionalInputSchema,
	serviceInputSchema,
} from "@/lib/catalog-schema";
import { requireActiveOrg } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

const SERVICES_PATH = "/dashboard/servicos";
const PROFESSIONALS_PATH = "/dashboard/profissionais";

export async function saveServiceAction(input: {
	id?: string;
	name: string;
	durationMinutes: number;
	priceCents: number;
}): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	const parsed = serviceInputSchema.safeParse(input);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? "Dados inválidos",
		};
	}
	if (input.id) {
		await updateService(organizationId, input.id, parsed.data);
	} else {
		await createService(organizationId, parsed.data);
	}
	revalidatePath(SERVICES_PATH);
	return { ok: true };
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	await deleteService(organizationId, id);
	revalidatePath(SERVICES_PATH);
	return { ok: true };
}

export async function saveProfessionalAction(input: {
	id?: string;
	name: string;
	serviceIds: string[];
	workingHours: { weekday: number; start: string; end: string }[];
	calendarId?: string;
}): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	const parsed = professionalInputSchema.safeParse(input);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? "Dados inválidos",
		};
	}
	if (input.id) {
		await updateProfessional(organizationId, input.id, parsed.data);
	} else {
		await createProfessional(organizationId, parsed.data);
	}
	revalidatePath(PROFESSIONALS_PATH);
	return { ok: true };
}

export async function deleteProfessionalAction(
	id: string
): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	await deleteProfessional(organizationId, id);
	revalidatePath(PROFESSIONALS_PATH);
	return { ok: true };
}
