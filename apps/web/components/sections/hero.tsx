import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

import { WhatsAppChat } from "@/components/site/whatsapp-chat";

export function Hero() {
	return (
		<section className="relative isolate overflow-hidden" id="top">
			{/* Hero-specific accent glow, pinned behind everything */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute top-[-12%] left-1/2 h-[640px] w-[1100px] -translate-x-1/2 opacity-60"
			>
				<div className="absolute inset-0 rounded-[100%] bg-[radial-gradient(ellipse_at_center,oklch(0.92_0.21_134/0.18),transparent_55%)] blur-2xl" />
			</div>

			<div className="container relative mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24 md:pb-32 lg:px-10 lg:pt-28">
				<div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
					{/* Copy column */}
					<div className="relative flex flex-col gap-8">
						<div
							className="flex animate-fade-up items-center gap-3 font-mono text-[10.5px] text-paper-faint uppercase tracking-[0.24em]"
							style={{ animationDelay: "0s" }}
						>
							<span className="size-1.5 animate-pulse-dot rounded-full bg-mint" />
							<span>Recepcionista de IA</span>
							<span className="text-line-strong">·</span>
							<span translate="no">WhatsApp</span>
							<span className="text-line-strong">·</span>
							<span>Barbearias</span>
						</div>

						<h1
							className="animate-fade-up text-balance font-heading font-medium text-[2.5rem] text-paper leading-[1.02] tracking-[-0.035em] sm:text-[2.85rem] md:text-[3.25rem] lg:text-[3.6rem] xl:text-[4rem]"
							style={{ animationDelay: "0.1s" }}
						>
							Mais clientes na <span className="text-mint">cadeira</span>.
							<br />
							Menos <span translate="no">WhatsApp</span> na sua{" "}
							<span className="text-mint">mão</span>.
						</h1>

						<p
							className="max-w-xl animate-fade-up text-base text-paper-muted leading-relaxed md:text-lg"
							style={{ animationDelay: "0.2s" }}
						>
							A Recepcionai atende seus clientes no{" "}
							<span translate="no">WhatsApp</span> 24 horas por dia, marca
							horários direto na sua agenda e confirma cada atendimento.{" "}
							<span className="text-paper">Você cuida do corte.</span> Ela cuida
							do resto.
						</p>

						<div
							className="flex animate-fade-up flex-col items-start gap-5"
							style={{ animationDelay: "0.3s" }}
						>
							<Button
								asChild
								className="h-12 rounded-full bg-mint px-6 text-[14px] text-primary-foreground tracking-tight hover:bg-mint-deep"
								size="lg"
							>
								<Link
									href="/whatsapp"
									prefetch={false}
									rel="noopener"
									target="_blank"
								>
									Agendar demonstração
									<svg
										aria-hidden="true"
										className="ml-1 size-4"
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

							<div className="flex items-center gap-3">
								<span
									aria-hidden="true"
									className="size-1.5 animate-pulse-dot rounded-full bg-ember"
								/>
								<span className="font-mono text-[10.5px] text-paper-muted uppercase tracking-[0.22em]">
									Beta fechado · Selecionando barbearias parceiras
								</span>
							</div>
						</div>

						{/* Stat-style mini band — uses honest mechanism framing, no fabricated numbers */}
						<dl
							className="mt-8 grid animate-fade-up grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line/60"
							style={{ animationDelay: "0.4s" }}
						>
							<HeroStat label="Canal" sub="Business" value="WhatsApp" />
							<HeroStat label="Atendimento" sub="Sem pausa" value="24/7" />
							<HeroStat
								label="Sistema"
								sub="Integrado"
								value="O que você já usa"
							/>
						</dl>
					</div>

					{/* Chat column */}
					<div
						className="relative animate-fade-up"
						style={{ animationDelay: "0.25s" }}
					>
						<WhatsAppChat />
					</div>
				</div>
			</div>
		</section>
	);
}

function HeroStat({
	label,
	value,
	sub,
}: {
	label: string;
	value: string;
	sub: string;
}) {
	return (
		<div className="flex flex-col gap-1.5 bg-ink px-4 py-5">
			<dt className="font-mono text-[9.5px] text-paper-faint uppercase tracking-[0.22em]">
				{label}
			</dt>
			<dd className="flex flex-col gap-0.5">
				<span className="font-heading text-paper text-xl leading-none tracking-[-0.01em]">
					{value}
				</span>
				<span className="text-[11.5px] text-paper-muted">{sub}</span>
			</dd>
		</div>
	);
}
