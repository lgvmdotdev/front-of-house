import {
	RiCalendarCheckLine,
	RiChat3Line,
	RiPlugLine,
	RiTimerLine,
} from "@remixicon/react";

import { Section } from "@/components/site/section";

const CAPABILITIES = [
	{
		Icon: RiChat3Line,
		title: "Marca horário sozinha",
		body: "Cliente pede horário, a Recepcionai consulta a agenda do barbeiro e marca. Você nem precisa abrir o celular pra responder.",
	},
	{
		Icon: RiCalendarCheckLine,
		title: "Responde tudo que perguntam",
		body: "Preço, horário, serviço, qual barbeiro trabalha amanhã. A Recepcionai aprende o que a sua barbearia faz e responde no seu tom — em português natural.",
	},
	{
		Icon: RiTimerLine,
		title: "Cadeira parada vira passado",
		body: "Antes do horário, ela manda lembrete. Quem confirma vai. Quem não vai, avisa — e o horário volta pra agenda imediatamente.",
	},
	{
		Icon: RiPlugLine,
		title: "Você assume quando quiser",
		body: "A qualquer momento você entra na conversa e a Recepcionai sai de cena. Sem barreira entre você e seus clientes.",
	},
];

export function Capabilities() {
	return (
		<Section
			heading={
				<>
					O que a Recepcionai <span className="text-mint">faz por você</span>.
				</>
			}
			id="capacidades"
			kicker="Capacidades"
			lede="Tudo que uma recepcionista faria — rodando 24 horas, no WhatsApp da sua barbearia, enquanto você corta cabelo."
			number="03"
		>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{CAPABILITIES.map(({ Icon, title, body }, index) => (
					<article
						className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-line bg-surface/40 p-7 transition-colors hover:border-line-strong hover:bg-surface/70 md:p-9"
						key={title}
					>
						<div className="flex items-start justify-between">
							<div
								aria-hidden="true"
								className="flex size-11 items-center justify-center rounded-xl border border-mint/25 bg-mint/[0.08] text-mint"
							>
								<Icon className="size-5" />
							</div>
							<span className="font-mono text-[10px] text-paper-faint uppercase tracking-[0.22em]">
								{String(index + 1).padStart(2, "0")} / 04
							</span>
						</div>
						<div className="flex flex-col gap-3">
							<h3 className="text-balance font-heading text-[1.7rem] text-paper leading-[1.08] tracking-[-0.01em]">
								{title}
							</h3>
							<p className="text-[14.5px] text-paper-muted leading-relaxed">
								{body}
							</p>
						</div>
						<div
							aria-hidden="true"
							className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-mint/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
						/>
					</article>
				))}
			</div>
		</Section>
	);
}
