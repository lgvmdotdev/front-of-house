"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "./action-result";

/**
 * Runs a server action and handles the two outcomes every caller handles the
 * same way: toast on failure, toast the success message otherwise.
 *
 * No `router.refresh()`: every action in this app calls `revalidatePath` for the
 * screens it affects, and a server action that revalidated the current route
 * already returns the fresh RSC payload with its response. Refreshing on top of
 * that was a second round-trip for data we had.
 *
 * `onSuccess` is for the bits that do differ — closing a dialog, clearing a
 * field, navigating to the row that was just created.
 *
 * Pass `successMessage: null` when an optimistic update already shows the
 * result; a toast next to a value that visibly changed is double feedback.
 */
export function useAction() {
	const [pending, startTransition] = useTransition();

	function run<T>(
		action: () => Promise<ActionResult<T>>,
		successMessage: string | null,
		onSuccess?: (data: T) => void
	): void {
		startTransition(async () => {
			// Deliberately not wrapped in try/catch: `impersonateUserAction`
			// redirects, and swallowing that throw would turn a working navigation
			// into an error toast.
			const result = await action();
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			onSuccess?.(result.data);
			if (successMessage) {
				toast.success(successMessage);
			}
		});
	}

	return { pending, run };
}
