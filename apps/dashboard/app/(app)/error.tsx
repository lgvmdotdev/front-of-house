"use client";

import { Button } from "@workspace/ui/components/button";

/**
 * Segment-level error boundary. Next 16.3 stabilised the `retry` prop, which
 * re-fetches and re-renders the boundary's children — the right thing for a
 * failed database read. `reset()` only clears the error state without
 * re-fetching, so it would just show the same failure again.
 */
export default function AppError({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	return (
		<div className="flex flex-col items-start gap-3">
			<h1 className="font-semibold text-2xl">Algo deu errado</h1>
			<p className="max-w-md text-muted-foreground">
				Não foi possível carregar esta tela. Tente novamente; se continuar, fale
				com a equipe Recepcionai.
			</p>
			{error.digest ? (
				<p className="font-mono text-muted-foreground text-xs">
					Código: {error.digest}
				</p>
			) : null}
			<Button onClick={() => retry()} type="button">
				Tentar novamente
			</Button>
		</div>
	);
}
