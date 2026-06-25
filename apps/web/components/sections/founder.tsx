import { RiCheckLine } from "@remixicon/react";

import { Section } from "@/components/site/section";

const SETUP = [
	"Conexão direta com a agenda que sua barbearia já usa",
	"Recepcionai treinada com seus serviços, preços e barbeiros",
	"Equipe da Recepcionai cuidando da entrada do início ao fim",
	"Pronta pra atender em poucos dias",
	"Atualizações sem você fazer nada",
];

export function Founder() {
	return (
		<Section id="time" kicker="Quem está fazendo" number="06">
			<div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.4fr_1fr]">
				<div className="flex flex-col gap-8">
					<h2 className="text-balance font-heading font-medium text-[2.25rem] text-paper leading-[1.04] tracking-[-0.03em] md:text-[2.85rem] lg:text-[3.4rem]">
						Construída no chão de barbearia,{" "}
						<span className="text-mint">não no escritório</span>.
					</h2>
					<div className="flex flex-col gap-5 text-[15px] text-paper-muted leading-relaxed md:text-base">
						<p>
							Por trás da Recepcionai está{" "}
							<span className="text-paper">Luiz Vergennes</span>, engenheiro de
							software sênior, e as primeiras barbearias parceiras que abriram
							as portas pra calibrar cada conversa, cada lembrete e cada
							integração.
						</p>
						<p>
							Quando você entra, entra com tudo isso{" "}
							<span className="text-paper">já testado</span>: afinado pelo que
							barbearia de verdade precisa no dia a dia.
						</p>
					</div>
				</div>

				{/* "What you get" panel — customer-facing, no engineering stack jargon */}
				<aside className="relative rounded-2xl border border-line bg-surface/50 p-7 md:p-8">
					<div className="flex items-center justify-between border-line/60 border-b pb-4">
						<div className="flex items-center gap-2 font-mono text-[10px] text-paper-faint uppercase tracking-[0.22em]">
							<span className="size-1.5 animate-pulse-dot rounded-full bg-mint" />
							<span>O que você ganha</span>
						</div>
						<span className="font-mono text-[10px] text-paper-faint uppercase tracking-[0.22em]">
							Setup completo
						</span>
					</div>
					<ul className="mt-5 flex flex-col gap-4">
						{SETUP.map((item) => (
							<li className="flex items-start gap-3 text-[13.5px]" key={item}>
								<span
									aria-hidden="true"
									className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-mint/15 text-mint"
								>
									<RiCheckLine className="size-3.5" />
								</span>
								<span className="text-paper leading-snug">{item}</span>
							</li>
						))}
					</ul>
					<p className="mt-6 border-line/60 border-t pt-4 text-[12.5px] text-paper-faint leading-relaxed">
						Você não toca em nada. A gente cuida de tudo enquanto você toca a
						barbearia.
					</p>
				</aside>
			</div>
		</Section>
	);
}
