"use client";

/**
 * Last-resort boundary: replaces the whole document when the root layout itself
 * throws, so it must render its own `<html>`/`<body>` and cannot rely on the
 * fonts or providers from `app/layout.tsx`.
 */
export default function GlobalError({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	return (
		<html className="dark" lang="pt-BR">
			<body className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
				<h1 className="font-semibold text-2xl">Algo deu errado</h1>
				<p className="max-w-sm text-muted-foreground">
					Não foi possível carregar o painel. Tente novamente.
				</p>
				{error.digest ? (
					<p className="font-mono text-muted-foreground text-xs">
						Código: {error.digest}
					</p>
				) : null}
				<button
					className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm"
					onClick={() => retry()}
					type="button"
				>
					Tentar novamente
				</button>
			</body>
		</html>
	);
}
