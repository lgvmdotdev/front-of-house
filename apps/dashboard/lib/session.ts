import { auth } from "@workspace/auth";
import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";

/**
 * Session helpers for both route groups. Mirrors `apps/web/lib/session.ts` and
 * adds `requireAdmin` for the `(admin)` group. Tenancy always comes from the
 * session — never from the URL — so a tenant screen cannot be pointed at
 * another barbershop by editing the address bar.
 */

/** The current session (user + session row), or `null` if signed out. */
export async function getSession() {
	return await auth.api.getSession({ headers: await headers() });
}

/** Requires a signed-in user; redirects to `/login` otherwise. */
export async function requireSession() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}
	return session;
}

/**
 * The organization the user belongs to, when the session has no active one.
 * better-auth only populates `activeOrganizationId` when something sets it
 * (onboarding, or an explicit `setActive`), so a freshly signed-in owner would
 * otherwise land on a dashboard with no tenant. Resolved read-only — no session
 * mutation during render.
 */
async function firstMembershipOrgId(userId: string): Promise<string | null> {
	const membership = await db
		.select({ organizationId: schema.member.organizationId })
		.from(schema.member)
		.where(eq(schema.member.userId, userId))
		.orderBy(schema.member.createdAt)
		.limit(1);
	return membership[0]?.organizationId ?? null;
}

/**
 * Requires a signed-in user with a barbershop. Redirects to `/login` when
 * signed out and `/sem-barbearia` when the user belongs to no organization.
 * The returned `organizationId` is what every `(app)` query must filter by.
 */
export async function requireActiveOrg() {
	const session = await requireSession();
	const organizationId =
		session.session.activeOrganizationId ??
		(await firstMembershipOrgId(session.user.id));
	if (!organizationId) {
		redirect("/sem-barbearia");
	}
	return { session, organizationId };
}

/** Requires the better-auth `admin` role; renders the 403 boundary otherwise. */
export async function requireAdmin() {
	const session = await requireSession();
	if (session.user.role !== "admin") {
		forbidden();
	}
	return session;
}
