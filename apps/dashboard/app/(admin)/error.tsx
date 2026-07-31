"use client";

import { Button } from "@workspace/ui/components/button";

/** Same as the tenant boundary; kept separate so each group can diverge. */
export default function AdminError({
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
				Não foi possível carregar esta tela do painel interno.
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
