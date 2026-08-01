"use server";

import { auth } from "@workspace/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
	type ActionResult,
	authErrorMessage,
	failure,
	success,
} from "@/lib/action-result";
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

/**
 * Ends an admin's impersonation session and restores the admin's own. Lives
 * here rather than with the tenant panel that shows the banner, because the
 * impersonation it undoes was started from `/admin/usuarios` — same domain,
 * opposite direction.
 */
export async function stopImpersonatingAction(): Promise<ActionResult> {
	try {
		await auth.api.stopImpersonating({ headers: await headers() });
	} catch {
		return failure("Não foi possível encerrar a personificação.");
	}
	revalidatePath("/", "layout");
	return success();
}
