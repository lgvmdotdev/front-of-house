"use server";

import { auth } from "@workspace/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
	type ActionResult,
	failure,
	firstIssue,
	success,
} from "@/lib/action-result";
import { requireActiveOrg } from "@/lib/session";
import {
	invitationInputSchema,
	memberRoleInputSchema,
} from "@/lib/settings-schema";

/**
 * Team mutations go through better-auth rather than raw inserts: it owns the
 * invitation token/expiry, fires `sendInvitationEmail`, and enforces the
 * organization role permissions (only owner/admin may invite or change roles).
 *
 * `organizationId` is always passed explicitly. better-auth would otherwise fall
 * back to `session.activeOrganizationId`, which this app leaves unset — tenancy
 * is resolved from membership instead.
 */

const TEAM_PATH = "/equipe";

/** better-auth throws `APIError` with a `body.code`; surface something readable. */
function authErrorMessage(error: unknown, fallback: string): string {
	if (error && typeof error === "object" && "body" in error) {
		const body = (error as { body?: { message?: string } }).body;
		if (body?.message) {
			return body.message;
		}
	}
	return fallback;
}

export async function inviteMemberAction(input: {
	email: string;
	role: string;
}): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	const parsed = invitationInputSchema.safeParse(input);
	if (!parsed.success) {
		return failure(firstIssue(parsed.error.issues));
	}
	try {
		await auth.api.createInvitation({
			body: { ...parsed.data, organizationId },
			headers: await headers(),
		});
	} catch (error) {
		return failure(
			authErrorMessage(error, "Não foi possível enviar o convite.")
		);
	}
	revalidatePath(TEAM_PATH);
	return success();
}

export async function cancelInvitationAction(
	invitationId: string
): Promise<ActionResult> {
	await requireActiveOrg();
	try {
		await auth.api.cancelInvitation({
			body: { invitationId },
			headers: await headers(),
		});
	} catch (error) {
		return failure(
			authErrorMessage(error, "Não foi possível cancelar o convite.")
		);
	}
	revalidatePath(TEAM_PATH);
	return success();
}

export async function updateMemberRoleAction(input: {
	memberId: string;
	role: string;
}): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	const parsed = memberRoleInputSchema.safeParse(input);
	if (!parsed.success) {
		return failure(firstIssue(parsed.error.issues));
	}
	try {
		await auth.api.updateMemberRole({
			body: { ...parsed.data, organizationId },
			headers: await headers(),
		});
	} catch (error) {
		return failure(
			authErrorMessage(error, "Não foi possível alterar o papel.")
		);
	}
	revalidatePath(TEAM_PATH);
	return success();
}

export async function removeMemberAction(
	memberId: string
): Promise<ActionResult> {
	const { organizationId } = await requireActiveOrg();
	try {
		await auth.api.removeMember({
			body: { memberIdOrEmail: memberId, organizationId },
			headers: await headers(),
		});
	} catch (error) {
		return failure(
			authErrorMessage(error, "Não foi possível remover o membro.")
		);
	}
	revalidatePath(TEAM_PATH);
	return success();
}
