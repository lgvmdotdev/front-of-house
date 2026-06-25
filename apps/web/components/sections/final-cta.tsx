import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

import { SectionLabel } from "@/components/site/section-label";

export function FinalCta() {
	return (
		<section
			className="relative isolate overflow-hidden border-line/70 border-t"
			id="agendar"
		>
			{/* Ambient glow */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute top-1/2 left-1/2 h-[520px] w-[1100px] -translate-x-1/2 -translate-y-1/2 opacity-70"
			>
				<div className="absolute inset-0 rounded-[100%] bg-[radial-gradient(ellipse_at_center,oklch(0.92_0.21_134/0.16),transparent_55%)] blur-2xl" />
			</div>

			<div className="container relative mx-auto max-w-6xl px-6 py-28 md:py-36 lg:px-10">
				<div className="mx-auto flex max-w-3xl flex-col items-center gap-10 text-center">
					<SectionLabel kicker="Pronto?" number="08" />

					<h2 className="text-balance font-heading font-medium text-[2.5rem] text-paper leading-[1.02] tracking-[-0.035em] md:text-[3.4rem] lg:text-[4rem]">
						Quer ver a Recepcionai{" "}
						<span className="text-mint">trabalhando na sua barbearia</span>?
					</h2>

					<p className="max-w-2xl text-base text-paper-muted leading-relaxed md:text-lg">
						Marca uma demonstração com a gente. Em 20 minutos a gente te mostra
						a Recepcionai atendendo cliente, marcando horário e confirmando
						atendimento — exatamente como ela vai trabalhar pra você.
					</p>

					<div className="flex flex-col items-center gap-4">
						<Button
							asChild
							className="h-14 rounded-full bg-mint px-8 text-[15px] text-primary-foreground tracking-tight hover:bg-mint-deep"
							size="lg"
						>
							<Link
								href="/whatsapp"
								prefetch={false}
								rel="noopener"
								target="_blank"
							>
								Quero pra minha barbearia
								<svg
									aria-hidden="true"
									className="ml-2 size-4"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.8"
									viewBox="0 0 24 24"
								>
									<path
										d="M5 12h14M13 5l7 7-7 7"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</Link>
						</Button>
						<div className="flex items-center gap-3 font-mono text-[10.5px] text-paper-muted uppercase tracking-[0.22em]">
							<span
								aria-hidden="true"
								className="size-1.5 animate-pulse-dot rounded-full bg-ember"
							/>
							Beta fechado · Selecionando barbearias parceiras
						</div>
					</div>

					{/* Quiet reassurances */}
					<div className="mt-6 grid w-full grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line/60 sm:grid-cols-3">
						<Reassurance label="Resposta" value="Em 1 dia útil" />
						<Reassurance label="Conversa" value="Direto com o fundador" />
						<Reassurance
							label="Compromisso"
							value="Sem pressão, sem contrato"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}

function Reassurance({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col items-center gap-1.5 bg-ink px-5 py-5">
			<span className="font-mono text-[10px] text-paper-faint uppercase tracking-[0.22em]">
				{label}
			</span>
			<span className="font-heading text-[1.1rem] text-paper leading-tight tracking-[-0.01em]">
				{value}
			</span>
		</div>
	);
}
