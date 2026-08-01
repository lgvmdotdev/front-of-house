"use server";

import { auth } from "@workspace/auth";
import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";
import { revalidatePath } from "next/cache";
import {
	type ActionResult,
	failure,
	firstIssue,
	success,
} from "@/lib/action-result";
import { requireAdmin } from "@/lib/session";
import { tenantInputSchema } from "./tenant-schema";

/**
 * Creating a barbershop from the internal panel. Two better-auth calls, both on
 * their documented server-only path (no `headers` → no session required):
 *
 *  - `createUser` makes the owner, hashes the password and links the
 *    `credential` account. `signUpEmail` cannot be used here because the admin
 *    plugin marks `role` as non-writable through the sign-up path.
 *  - `createOrganization` with `userId` attributes ownership to that user and
 *    applies `creatorRole: "owner"` from the auth config.
 *
 * `organizationLimit: 1` is *not* bypassed by the server-only path, which is why
 * every tenant gets a freshly created owner rather than reusing an existing one.
 */

const TENANTS_PATH = "/admin/barbearias";

export async function createTenantAction(input: {
	name: string;
	ownerEmail: string;
	ownerName: string;
	ownerPassword: string;
	slug: string;
}): Promise<ActionResult<{ organizationId: string }>> {
	await requireAdmin();
	const parsed = tenantInputSchema.safeParse(input);
	if (!parsed.success) {
		return failure(firstIssue(parsed.error.issues));
	}
	const { name, slug, ownerName, ownerEmail, ownerPassword } = parsed.data;

	const [slugTaken, emailTaken] = await Promise.all([
		db.query.organization.findFirst({
			where: eq(schema.organization.slug, slug),
			columns: { id: true },
		}),
		db.query.user.findFirst({
			where: eq(schema.user.email, ownerEmail),
			columns: { id: true },
		}),
	]);
	if (slugTaken) {
		return failure("Já existe uma barbearia com esse identificador.");
	}
	if (emailTaken) {
		return failure(
			"Já existe um usuário com esse e-mail. Use outro e-mail para o proprietário."
		);
	}

	let ownerId: string;
	try {
		const created = await auth.api.createUser({
			body: { email: ownerEmail, name: ownerName, password: ownerPassword },
		});
		ownerId = created.user.id;
	} catch {
		return failure("Não foi possível criar o usuário proprietário.");
	}

	try {
		const organization = await auth.api.createOrganization({
			body: { name, slug, userId: ownerId },
		});
		if (!organization) {
			throw new Error("no organization returned");
		}
		revalidatePath(TENANTS_PATH);
		revalidatePath("/admin");
		return success({ organizationId: organization.id });
	} catch {
		// Do not leave a stranded owner behind if the organization failed.
		await db.delete(schema.user).where(eq(schema.user.id, ownerId));
		return failure("Não foi possível criar a barbearia.");
	}
}
