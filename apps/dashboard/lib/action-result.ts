/**
 * The single result shape every server action returns. Actions never throw at
 * the client boundary — a failed validation or a rejected better-auth call comes
 * back as `{ ok: false, error }` with a pt-BR message the UI can toast.
 */
export type ActionResult<T = undefined> =
	| { data: T; ok: true }
	| { error: string; ok: false };

export function success(): ActionResult;
export function success<T>(data: T): ActionResult<T>;
export function success<T>(data?: T): ActionResult<T | undefined> {
	return { ok: true, data };
}

export function failure(error: string): ActionResult<never> {
	return { ok: false, error };
}

const FALLBACK_MESSAGE = "Dados inválidos";

/** First zod issue message, or a generic pt-BR fallback. */
export function firstIssue(issues: { message: string }[]): string {
	return issues[0]?.message ?? FALLBACK_MESSAGE;
}
