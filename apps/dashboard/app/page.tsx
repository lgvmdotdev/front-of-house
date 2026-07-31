import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";

/**
 * The dashboard has no landing page of its own — it routes by role. Internal
 * staff have no barbershop of their own, so sending everyone to `/painel` would
 * bounce admins straight to `/sem-barbearia`.
 */
export default async function RootPage() {
	const session = await requireSession();
	redirect(session.user.role === "admin" ? "/admin" : "/painel");
}
