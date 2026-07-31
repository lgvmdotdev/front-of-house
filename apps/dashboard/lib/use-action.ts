"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "./action-result";

/**
 * Runs a server action and handles the two outcomes every caller handles the
 * same way: refresh the tree and toast on success, toast the message on failure.
 *
 * `onSuccess` is for the bits that do differ — closing a dialog, clearing a
 * field, navigating to the row that was just created.
 */
export function useAction() {
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	function run<T>(
		action: () => Promise<ActionResult<T>>,
		successMessage: string,
		onSuccess?: (data: T) => void
	): void {
		startTransition(async () => {
			const result = await action();
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			onSuccess?.(result.data);
			router.refresh();
			toast.success(successMessage);
		});
	}

	return { pending, run };
}
