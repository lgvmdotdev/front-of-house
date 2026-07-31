"use server";

import { auth } from "@workspace/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { ActionResult } from "@/lib/action-result";
import { failure, success } from "@/lib/action-result";

/**
 * Ends an admin's impersonation session and restores the admin's own session.
 * Lives outside both route groups because the banner that triggers it renders in
 * the tenant panel while the impersonation itself was started from `/admin`.
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
