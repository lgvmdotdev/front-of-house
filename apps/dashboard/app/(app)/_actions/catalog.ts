"use server";

import { revalidatePath } from "next/cache";
import {
	type ActionResult,
	failure,
	firstIssue,
	success,
} from "@/lib/action-result";
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

/**
 * Catalog mutations. Each one re-resolves the active organization server-side —
 * the client never supplies an `organizationId`, so a tampered request cannot
 * reach another barbershop's rows. Validation happens here, at the boundary,
 * before anything touches the database.
 */

const SERVICES_PATH = "/servicos";
const PROFESSIONALS_PATH = "/profissionais";
const NOT_FOUND = "Registro não encontrado nesta barbearia.";

export async function saveServiceAction(input: {
	active: boolean;
	durationMinutes: number;
	id?: string;
	name: string;
	priceCents: number;
}): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	const parsed = serviceInputSchema.safeParse(input);
	if (!parsed.success) {
		return failure(firstIssue(parsed.error.issues));
	}
	if (input.id) {
		const updated = await updateService(organizationId, input.id, parsed.data);
		if (!updated) {
			return failure(NOT_FOUND);
		}
	} else {
		await createService(organizationId, parsed.data);
	}
	revalidatePath(SERVICES_PATH);
	revalidatePath(PROFESSIONALS_PATH);
	return success();
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	if (!(await deleteService(organizationId, id))) {
		return failure(NOT_FOUND);
	}
	revalidatePath(SERVICES_PATH);
	revalidatePath(PROFESSIONALS_PATH);
	return success();
}

export async function saveProfessionalAction(input: {
	active: boolean;
	calendarId?: string;
	id?: string;
	name: string;
	serviceIds: string[];
	workingHours: { end: string; start: string; weekday: number }[];
}): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	const parsed = professionalInputSchema.safeParse(input);
	if (!parsed.success) {
		return failure(firstIssue(parsed.error.issues));
	}
	if (input.id) {
		const updated = await updateProfessional(
			organizationId,
			input.id,
			parsed.data
		);
		if (!updated) {
			return failure(NOT_FOUND);
		}
	} else {
		await createProfessional(organizationId, parsed.data);
	}
	revalidatePath(PROFESSIONALS_PATH);
	return success();
}

export async function deleteProfessionalAction(
	id: string
): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	if (!(await deleteProfessional(organizationId, id))) {
		return failure(NOT_FOUND);
	}
	revalidatePath(PROFESSIONALS_PATH);
	return success();
}
