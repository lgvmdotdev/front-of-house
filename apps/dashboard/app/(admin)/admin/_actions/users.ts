"use server";

import { auth } from "@workspace/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { type ActionResult, failure, success } from "@/lib/action-result";
import { requireAdmin } from "@/lib/session";

/**
 * User administration, all through the better-auth `admin` plugin so its own
 * permission checks and side effects apply (banning also revokes the user's
 * sessions; impersonating writes an `admin_session` cookie that
 * `stopImpersonating` needs later).
 *
 * `requireAdmin()` runs first anyway — the plugin would reject a non-admin, but
 * failing in our own gate keeps the error a 403 page rather than a toast.
 */

const USERS_PATH = "/admin/usuarios";

function authErrorMessage(error: unknown, fallback: string): string {
	if (error && typeof error === "object" && "body" in error) {
		const body = (error as { body?: { message?: string } }).body;
		if (body?.message) {
			return body.message;
		}
	}
	return fallback;
}

export async function banUserAction(
	userId: string,
	banReason: string
): Promise<ActionResult> {
	await requireAdmin();
	try {
		await auth.api.banUser({
			body: { userId, banReason: banReason || "Bloqueado pela equipe" },
			headers: await headers(),
		});
	} catch (error) {
		return failure(
			authErrorMessage(error, "Não foi possível bloquear o usuário.")
		);
	}
	revalidatePath(USERS_PATH);
	return success();
}

export async function unbanUserAction(userId: string): Promise<ActionResult> {
	await requireAdmin();
	try {
		await auth.api.unbanUser({
			body: { userId },
			headers: await headers(),
		});
	} catch (error) {
		return failure(
			authErrorMessage(error, "Não foi possível desbloquear o usuário.")
		);
	}
	revalidatePath(USERS_PATH);
	return success();
}

export async function setUserRoleAction(
	userId: string,
	role: "admin" | "user"
): Promise<ActionResult> {
	await requireAdmin();
	try {
		await auth.api.setRole({
			body: { userId, role },
			headers: await headers(),
		});
	} catch (error) {
		return failure(
			authErrorMessage(error, "Não foi possível alterar o papel.")
		);
	}
	revalidatePath(USERS_PATH);
	return success();
}

/**
 * Swaps the caller's session for the target user's and drops them into the
 * tenant panel. `ImpersonationBanner` is what gets them back out.
 */
export async function impersonateUserAction(userId: string): Promise<never> {
	await requireAdmin();
	await auth.api.impersonateUser({
		body: { userId },
		headers: await headers(),
	});
	revalidatePath("/", "layout");
	redirect("/painel");
}
