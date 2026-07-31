"use client";

import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

/**
 * One boundary for both route groups. Sitting at the root means it also catches
 * failures in the group layouts themselves (`requireActiveOrg`, `requireAdmin`),
 * which a per-group `error.tsx` cannot — a boundary never wraps the `layout.tsx`
 * beside it.
 *
 * Next 16.3 stabilised the `retry` prop, which re-fetches and re-renders the
 * boundary's children; `reset()` only clears the error state, so a failed
 * database read would just fail again.
 */
export default function AppError({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	return (
		<main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
			<h1 className="font-semibold text-2xl">Algo deu errado</h1>
			<p className="max-w-sm text-muted-foreground">
				Não foi possível carregar esta tela. Tente novamente; se continuar, fale
				com a equipe Recepcionai.
			</p>
			{error.digest ? (
				<p className="font-mono text-muted-foreground text-xs">
					Código: {error.digest}
				</p>
			) : null}
			<div className="flex gap-2">
				<Button onClick={() => retry()} type="button">
					Tentar novamente
				</Button>
				<Button asChild variant="outline">
					<Link href="/">Voltar ao início</Link>
				</Button>
			</div>
		</main>
	);
}
