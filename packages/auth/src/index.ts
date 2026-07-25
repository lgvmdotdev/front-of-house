import { passkey } from "@better-auth/passkey";
import type {} from "@simplewebauthn/server";
import { createDb, schema } from "@workspace/db";
import { env } from "@workspace/env/web";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, lastLoginMethod, organization } from "better-auth/plugins";

// biome-ignore lint/performance/noBarrelFile: Next.js
export { organizationClient } from "better-auth/client/plugins";
export { toNextJsHandler } from "better-auth/next-js";
export { createAuthClient } from "better-auth/react";

const createAuth = () => {
	const db = createDb();

	return betterAuth({
		appName: "Next.js Template App",
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
		}),
		emailAndPassword: {
			enabled: true,
		},
		emailVerification: {
			sendVerificationEmail: async ({ user, url }) => {
				return await new Promise((resolve) => {
					if (env.NODE_ENV !== "production") {
						console.debug(`${user.id} verification url: ${url}.`);
					}
					return resolve();
				});
				// Send verification email to user
			},
			sendOnSignUp: true,
			autoSignInAfterVerification: true,
			expiresIn: 3600, // 1 hour
		},
		advanced: {
			trustedProxyHeaders: true,
			cookiePrefix: env.PROJECT_NAME,
		},
		plugins: [
			admin(),
			lastLoginMethod(),
			nextCookies(),
			passkey(),
			organization({
				// One barbershop per owner; the creator becomes its "owner".
				creatorRole: "owner",
				organizationLimit: 1,
				sendInvitationEmail({ id, email }) {
					return new Promise((resolve) => {
						if (env.NODE_ENV !== "production") {
							console.debug(`invite ${id} for ${email}`);
						}
						resolve();
					});
				},
			}),
		],
	});
};

export const auth = createAuth();
