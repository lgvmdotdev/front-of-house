import { Section } from "@/components/site/section";

const STEPS = [
	{
		index: "01",
		title: "Cliente chama. Ela responde em segundos.",
		body: "Sem template robotizado, sem espera. A Recepcionai conversa em português natural, como uma recepcionista que conhece os serviços, os preços e os barbeiros da sua barbearia.",
		signal: "00:00:02",
		signalLabel: "Tempo médio até a resposta",
	},
	{
		index: "02",
		title: "Marca o horário direto na sua agenda.",
		body: "Sua barbearia já usa Booksy, Trinks, Belezito, Google Agenda ou outra ferramenta? A Recepcionai conecta nela. Você não troca de sistema, nem de número — só ganha uma recepcionista trabalhando 24 horas.",
		signal: "Sem trocar nada",
		signalLabel: "Conexão com sua agenda atual",
	},
	{
		index: "03",
		title: "Confirma antes. Lembra na hora. Cadeira sempre cheia.",
		body: "Horas antes do atendimento, ela manda lembrete. Quem vai, confirma. Quem não vai, avisa — e o horário volta pra agenda na hora. Cadeira parada vira exceção.",
		signal: "− no-show",
		signalLabel: "Cadeira sempre ocupada",
	},
];

export function HowItWorks() {
	return (
		<Section
			heading={
				<>
					A Recepcionai <span className="text-mint">assume</span> o WhatsApp da
					sua barbearia.
				</>
			}
			id="como-funciona"
			kicker="Como funciona"
			lede="Da primeira mensagem do cliente ao lembrete no dia do corte, a Recepcionai conduz tudo sozinha. Você nunca mais digita uma resposta."
			number="02"
		>
			<ol className="relative grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line/60 md:grid-cols-3">
				{STEPS.map((step) => (
					<li
						className="relative flex flex-col gap-6 bg-ink p-7 md:p-9"
						key={step.index}
					>
						<div className="flex items-baseline justify-between">
							<span className="font-heading text-[3.5rem] text-mint tabular-nums leading-none tracking-[-0.04em]">
								{step.index}
							</span>
							<span className="font-mono text-[9.5px] text-paper-faint uppercase tracking-[0.22em]">
								Passo {step.index}
							</span>
						</div>
						<h3 className="text-balance font-heading text-2xl text-paper leading-[1.1] tracking-[-0.01em] md:text-[1.7rem]">
							{step.title}
						</h3>
						<p className="flex-1 text-[14.5px] text-paper-muted leading-relaxed">
							{step.body}
						</p>
						<div className="border-line/70 border-t pt-4">
							<div className="font-mono text-[10px] text-paper-faint uppercase tracking-[0.22em]">
								{step.signalLabel}
							</div>
							<div className="mt-1 font-mono text-[13px] text-mint">
								{step.signal}
							</div>
						</div>
					</li>
				))}
			</ol>
		</Section>
	);
}
