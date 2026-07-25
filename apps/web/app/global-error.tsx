"use client";

export default function GlobalError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="pt-BR">
			<body className="dark">
				<main
					style={{
						display: "flex",
						minHeight: "100svh",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "1rem",
						fontFamily: "system-ui, sans-serif",
					}}
				>
					<h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
						Algo deu errado
					</h1>
					<button onClick={reset} type="button">
						Tentar novamente
					</button>
				</main>
			</body>
		</html>
	);
}
