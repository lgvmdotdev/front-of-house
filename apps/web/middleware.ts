import { type NextRequest, NextResponse } from "next/server";

/**
 * Fast redirect of unauthenticated dashboard requests to `/login`. This only
 * checks for the presence of a session cookie — the dashboard layout performs
 * the authoritative session + active-organization check server-side.
 */
export function middleware(request: NextRequest) {
	const hasSessionCookie = request.cookies
		.getAll()
		.some((cookie) => cookie.name.includes("session_token"));

	if (!hasSessionCookie) {
		const loginUrl = new URL("/login", request.url);
		return NextResponse.redirect(loginUrl);
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
