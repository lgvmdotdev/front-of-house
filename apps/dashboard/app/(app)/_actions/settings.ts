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
	integrationInputSchema,
	organizationInputSchema,
} from "@/lib/settings-schema";
import { saveIntegrationSettings, updateOrganization } from "@/lib/tenant";

const INTEGRATION_PATH = "/integracao";
const SETTINGS_PATH = "/configuracoes";

export async function saveIntegrationAction(input: {
	offsetMinutes: number;
	provider: string;
	spreadsheetId?: string;
}): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	const parsed = integrationInputSchema.safeParse(input);
	if (!parsed.success) {
		return failure(firstIssue(parsed.error.issues));
	}
	await saveIntegrationSettings(organizationId, parsed.data);
	revalidatePath(INTEGRATION_PATH);
	return success();
}

export async function saveOrganizationAction(input: {
	logo: string;
	name: string;
	slug: string;
}): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	const parsed = organizationInputSchema.safeParse(input);
	if (!parsed.success) {
		return failure(firstIssue(parsed.error.issues));
	}
	const result = await updateOrganization(organizationId, parsed.data);
	if (!result.ok) {
		return failure("Esse identificador já está em uso por outra barbearia.");
	}
	// The barbershop name renders in the sidebar of every screen.
	revalidatePath("/", "layout");
	revalidatePath(SETTINGS_PATH);
	return success();
}
