/**
 * The `conversation.status` vocabulary, kept out of `conversation-queries.ts`
 * so the client-side filter nav can import it without pulling `server-only`
 * into the browser bundle.
 */

export const CONVERSATION_STATUSES = [
	{ value: "open", label: "Aberta" },
	{ value: "handed_off", label: "Com atendente" },
	{ value: "closed", label: "Encerrada" },
] as const;

export type ConversationStatus =
	(typeof CONVERSATION_STATUSES)[number]["value"];

export function isConversationStatus(
	value: string
): value is ConversationStatus {
	return CONVERSATION_STATUSES.some((status) => status.value === value);
}

/**
 * Parses the `?status=` filter. Anything unrecognised means "all", so a
 * hand-edited URL degrades to the unfiltered list instead of an error.
 */
export function parseConversationStatus(
	value: string | string[] | undefined
): ConversationStatus | undefined {
	return typeof value === "string" && isConversationStatus(value)
		? value
		: undefined;
}
