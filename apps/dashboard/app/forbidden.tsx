import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

/** Rendered by `forbidden()` — currently only for non-admins hitting `/admin`. */
export default function Forbidden() {
	return (
		<main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
			<p className="font-mono text-muted-foreground text-sm">403</p>
			<h1 className="font-semibold text-2xl">Acesso restrito</h1>
			<p className="max-w-sm text-muted-foreground">
				Esta área é exclusiva da equipe Recepcionai. Se você administra uma
				barbearia, volte ao seu painel.
			</p>
			<Button asChild>
				<Link href="/painel">Ir para o painel</Link>
			</Button>
		</main>
	);
}
