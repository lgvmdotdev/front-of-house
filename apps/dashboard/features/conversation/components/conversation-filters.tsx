"use client";

import { Button } from "@workspace/ui/components/button";
import Link, { useLinkStatus } from "next/link";
import { startTransition, useOptimistic } from "react";
import {
	CONVERSATION_STATUSES,
	type ConversationStatus,
} from "../conversation-status";

const FILTERS = [
	{ value: undefined, label: "Todas" },
	...CONVERSATION_STATUSES,
] as const;

/**
 * Filtering is navigation, so there is nothing to be optimistic about on the
 * server — but the button that was clicked should look selected immediately.
 * `useOptimistic` moves the highlight on click and reverts if the navigation
 * never lands.
 *
 * The pending flag comes from `useLinkStatus`, not from a local
 * `useTransition`: a transition that only sets optimistic state settles in the
 * same tick, so its `isPending` was false again long before the new list
 * arrived. `useLinkStatus` reports the navigation itself. It marks the link that
 * was clicked, and the page dims the table with
 * `group-has-data-pending/filters` — no prop drilling, and this component never
 * learns that a table exists.
 */
export function ConversationFilters({
	active,
}: {
	active?: ConversationStatus;
}) {
	const [optimisticActive, setOptimisticActive] = useOptimistic(active);

	return (
		<nav aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
			{FILTERS.map((filter) => {
				const isActive = filter.value === optimisticActive;
				return (
					<Button
						asChild
						key={filter.label}
						size="sm"
						variant={isActive ? "secondary" : "ghost"}
					>
						<Link
							aria-current={isActive ? "page" : undefined}
							href={
								filter.value
									? `/conversas?status=${filter.value}`
									: "/conversas"
							}
							onNavigate={() => {
								if (filter.value === optimisticActive) {
									return;
								}
								startTransition(() => {
									setOptimisticActive(filter.value);
								});
							}}
							scroll={false}
						>
							{filter.label}
							<PendingMarker />
						</Link>
					</Button>
				);
			})}
		</nav>
	);
}

/**
 * `useLinkStatus` only works from a child of the `<Link>` it reports on, so the
 * pending flag has to be carried by an element inside the anchor. It renders
 * nothing visible; `has-data-pending` matches it regardless of `display`.
 */
function PendingMarker() {
	const { pending } = useLinkStatus();
	return pending ? <span aria-hidden className="hidden" data-pending /> : null;
}
