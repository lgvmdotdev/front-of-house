"use client";

import { RiSpyLine } from "@remixicon/react";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { stopImpersonatingAction } from "@/app/_actions/impersonation";

/**
 * Without this bar an admin who impersonates a tenant owner has no way back —
 * the session looks exactly like that owner's.
 */
export function ImpersonationBanner({ userName }: { userName: string }) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	function handleStop() {
		startTransition(async () => {
			const result = await stopImpersonatingAction();
			if (result.ok) {
				router.push("/admin");
				router.refresh();
				return;
			}
			toast.error(result.error);
		});
	}

	return (
		<div className="flex flex-wrap items-center justify-between gap-2 border-b bg-accent/15 px-4 py-2 text-sm">
			<span className="flex items-center gap-2">
				<RiSpyLine aria-hidden size={16} />
				Você está acessando como <strong>{userName}</strong>.
			</span>
			<Button
				disabled={pending}
				onClick={handleStop}
				size="xs"
				type="button"
				variant="outline"
			>
				{pending ? "Encerrando..." : "Encerrar acesso"}
			</Button>
		</div>
	);
}
