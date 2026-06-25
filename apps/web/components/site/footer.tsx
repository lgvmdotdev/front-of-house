import { Wordmark } from "./wordmark";

export function Footer() {
	const year = new Date().getFullYear();
	return (
		<footer className="relative border-line/70 border-t">
			<div className="container mx-auto max-w-6xl px-6 py-10 lg:px-10">
				<div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
					<div className="flex flex-col gap-2">
						<Wordmark className="text-lg" />
						<p className="font-mono text-[10.5px] text-paper-faint uppercase tracking-[0.22em]">
							Recepcionista de IA · <span translate="no">WhatsApp</span> ·
							Barbearias
						</p>
					</div>

					<div className="flex flex-col gap-1 text-right">
						<p className="text-[13px] text-paper-muted">
							Em beta fechado no Brasil. Selecionando barbearias parceiras.
						</p>
						<p className="font-mono text-[10.5px] text-paper-faint uppercase tracking-[0.22em]">
							© {year} Recepcionai
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
