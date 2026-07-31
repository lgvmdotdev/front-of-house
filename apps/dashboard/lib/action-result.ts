/**
 * The single result shape every server action returns. Actions never throw at
 * the client boundary — a failed validation or a rejected better-auth call comes
 * back as `{ ok: false, error }` with a pt-BR message the UI can toast.
 */
export type ActionResult<T = undefined> =
	| { data: T; ok: true }
	| { error: string; ok: false };

export function success<T = undefined>(data?: T): ActionResult<T> {
	// `data` is only omitted when T defaults to undefined, which the cast encodes.
	return { ok: true, data: data as T };
}

export function failure(error: string): ActionResult<never> {
	return { ok: false, error };
}

const FALLBACK_MESSAGE = "Dados inválidos";

/** First zod issue message, or a generic pt-BR fallback. */
export function firstIssue(issues: { message: string }[]): string {
	return issues[0]?.message ?? FALLBACK_MESSAGE;
}

/** better-auth throws `APIError` carrying `body.message`; prefer it if present. */
export function authErrorMessage(error: unknown, fallback: string): string {
	if (error && typeof error === "object" && "body" in error) {
		const body = (error as { body?: { message?: string } }).body;
		if (body?.message) {
			return body.message;
		}
	}
	return fallback;
}
