import { type NextRequest, NextResponse } from "next/server";

/**
 * Cheap cookie-presence check so signed-out requests bounce to `/login`
 * without hitting the database. This is *not* authorization — the `(app)` and
 * `(admin)` layouts do the authoritative session / role / active-org checks
 * server-side.
 *
 * `middleware.ts` is deprecated in Next.js 16; `proxy.ts` is the current name
 * for the same convention.
 */
export function proxy(request: NextRequest) {
	const hasSessionCookie = request.cookies
		.getAll()
		.some((cookie) => cookie.name.includes("session_token"));

	if (!hasSessionCookie) {
		return NextResponse.redirect(new URL("/login", request.url));
	}
	return NextResponse.next();
}

export const config = {
	// Everything except the sign-in page, auth endpoints and static assets.
	// Deny-by-default: a new route is protected the moment it is added.
	matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
