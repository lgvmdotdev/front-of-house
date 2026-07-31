"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Browser-side auth. Deliberately imported from `better-auth/react` rather than
 * the `@workspace/auth` barrel: that barrel evaluates `betterAuth()` — and
 * therefore `@workspace/env` and `@workspace/db` — at module load, which throws
 * in the browser where `process.env` is empty.
 *
 * Only sign-in/sign-out live here. Every organization and admin mutation goes
 * through a server action instead, so no auth client plugins are needed.
 */
export const authClient = createAuthClient();
