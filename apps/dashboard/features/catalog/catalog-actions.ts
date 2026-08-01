"use server";

import { revalidatePath } from "next/cache";
import {
	type ActionResult,
	failure,
	firstIssue,
	success,
} from "@/lib/action-result";
import { requireActiveOrg } from "@/lib/session";
import {
	createProfessional,
	createService,
	deleteProfessional,
	deleteService,
	updateProfessional,
	updateService,
} from "./catalog-queries";
import { professionalInputSchema, serviceInputSchema } from "./catalog-schema";

/**
 * Catalog mutations. Each one re-resolves the active organization server-side —
 * the client never supplies an `organizationId`, so a tampered request cannot
 * reach another barbershop's rows. Validation happens here, at the boundary,
 * before anything touches the database.
 */

const SERVICES_PATH = "/servicos";
const PROFESSIONALS_PATH = "/profissionais";
const OVERVIEW_PATH = "/painel";
const NOT_FOUND = "Registro não encontrado nesta barbearia.";

/**
 * The overview counts the catalog and the professionals screen lists services,
 * so a change to either ripples across all three screens. Invalidating them here
 * rather than relying on the caller's `router.refresh()` keeps the action correct
 * on its own.
 */
function revalidateCatalog(): void {
	revalidatePath(SERVICES_PATH);
	revalidatePath(PROFESSIONALS_PATH);
	revalidatePath(OVERVIEW_PATH);
}

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
	revalidateCatalog();
	return success();
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	if (!(await deleteService(organizationId, id))) {
		return failure(NOT_FOUND);
	}
	revalidateCatalog();
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
	revalidateCatalog();
	return success();
}

export async function deleteProfessionalAction(
	id: string
): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	if (!(await deleteProfessional(organizationId, id))) {
		return failure(NOT_FOUND);
	}
	revalidateCatalog();
	return success();
}
