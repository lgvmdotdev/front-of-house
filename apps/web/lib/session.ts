import { auth } from "@workspace/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
 * Requires a signed-in user with an active barbershop. Redirects to `/login`
 * when signed out and `/onboarding` when the user has no active organization.
 * Returns the session and the active organization id to scope queries.
 */
export async function requireActiveOrg() {
	const session = await requireSession();
	const organizationId = session.session.activeOrganizationId;
	if (!organizationId) {
		redirect("/onboarding");
	}
	return { session, organizationId };
}
