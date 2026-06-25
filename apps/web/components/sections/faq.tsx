import { RiAddLine } from "@remixicon/react";

import { Section } from "@/components/site/section";

const QUESTIONS = [
	{
		q: "Preciso trocar minha agenda atual?",
		a: "Não. A Recepcionai conecta na agenda que sua barbearia já usa. A gente cuida da integração.",
	},
	{
		q: "Como o cliente sabe que está falando com uma IA?",
		a: "A Recepcionai se apresenta e fala em português natural. Se a conversa precisar de você, ela passa o atendimento na hora — sem o cliente perceber demora.",
	},
	{
		q: "Funciona com vários barbeiros?",
		a: "Sim. Cada barbeiro tem agenda própria. “O Felipe tem horário sábado de manhã?” — ela sabe responder.",
	},
	{
		q: "E se o cliente quiser falar com uma pessoa?",
		a: "A qualquer momento ele pede e você assume. A Recepcionai sai de cena até você terminar.",
	},
	{
		q: "Quanto custa?",
		a: "Depende do tamanho da sua barbearia. A gente fecha um plano sob medida na demonstração — sem surpresas, sem letra miúda.",
	},
	{
		q: "Quanto tempo leva pra começar?",
		a: "Poucos dias. A gente cuida de tudo — conexão com sua agenda, treinamento da Recepcionai, ajuste de serviços e horários. Você só precisa contar como sua barbearia funciona.",
	},
	{
		q: "O número do WhatsApp continua sendo o meu?",
		a: "Sim. A Recepcionai trabalha no número da sua barbearia. Você não muda nada.",
	},
	{
		q: "E quando eu quiser responder pessoalmente?",
		a: "Você assume a conversa a qualquer hora. A Recepcionai sai de cena até você terminar.",
	},
];

export function Faq() {
	return (
		<Section
			heading={
				<>
					Perguntas <span className="text-mint">frequentes</span>.
				</>
			}
			id="perguntas"
			kicker="FAQ"
			lede="O que toda barbearia pergunta antes da demonstração."
			number="07"
		>
			<div className="overflow-hidden rounded-2xl border border-line bg-surface/20">
				{QUESTIONS.map((item, index) => (
					<details
						className="group border-line/70 border-b transition-colors last:border-0 open:bg-surface/40 hover:bg-surface/40"
						key={item.q}
					>
						<summary className="flex cursor-pointer list-none items-center gap-5 px-6 py-6 outline-none focus-visible:bg-surface/50 focus-visible:ring-2 focus-visible:ring-mint/40 focus-visible:ring-inset md:px-8 md:py-7">
							<span className="font-mono text-[10.5px] text-paper-faint uppercase tracking-[0.22em]">
								{String(index + 1).padStart(2, "0")}
							</span>
							<span className="flex-1 text-balance font-heading text-[1.35rem] text-paper leading-[1.15] tracking-[-0.01em] md:text-[1.5rem]">
								{item.q}
							</span>
							<span
								aria-hidden="true"
								className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-ink text-paper-muted transition-transform group-open:rotate-45 group-open:border-mint/40 group-open:text-mint"
							>
								<RiAddLine className="size-4" />
							</span>
						</summary>
						<div className="px-6 pb-7 md:px-8 md:pb-8">
							<div className="ml-0 max-w-3xl border-line/60 border-l pl-5 text-[14.5px] text-paper-muted leading-relaxed md:ml-10">
								{item.a}
							</div>
						</div>
					</details>
				))}
			</div>
		</Section>
	);
}
