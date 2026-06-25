import { Section } from "@/components/site/section";

const SCENES = [
	{
		when: "Domingo · 09:30",
		title: "Você acorda com 7 agendamentos novos.",
		body: "Marcados durante a madrugada e a manhã. Cliente chamou, a Recepcionai respondeu, marcou. Você nem precisou abrir o celular.",
	},
	{
		when: "Quarta · 18:42",
		title: "Cliente novo chega — sem aviso prévio.",
		body: "Foi atendido em segundos, recebeu preço do degradê, disponibilidade do Felipe e horário confirmado. Você só percebeu na hora dele chegar.",
	},
	{
		when: "Sexta · 07:00",
		title: "Agenda do dia, toda confirmada.",
		body: "Quem vai, já confirmou. Quem não vai, já avisou. Você abre a barbearia sabendo exatamente quem aparece — e o horário que cancelou já voltou pra agenda.",
	},
];

export function WhoItsFor() {
	return (
		<Section
			heading={
				<>
					Imagine sua barbearia{" "}
					<span className="text-mint">em duas semanas</span>.
				</>
			}
			id="pra-quem"
			kicker="A nova rotina"
			lede="É assim que o dia a dia muda quando a Recepcionai entra na sua barbearia. Mais agendamento, menos WhatsApp na mão, cadeira sempre cheia."
			number="05"
		>
			<div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line/60 md:grid-cols-3">
				{SCENES.map((scene) => (
					<article
						className="group relative flex flex-col gap-5 bg-ink p-7 transition-colors hover:bg-surface md:p-8"
						key={scene.when}
					>
						<div className="flex items-center justify-between font-mono text-[10px] text-paper-faint uppercase tracking-[0.22em]">
							<span className="text-mint">{scene.when}</span>
						</div>
						<h3 className="text-balance font-heading text-2xl text-paper leading-[1.12] tracking-[-0.01em] md:text-[1.65rem]">
							{scene.title}
						</h3>
						<p className="text-[14.5px] text-paper-muted leading-relaxed">
							{scene.body}
						</p>
					</article>
				))}
			</div>
		</Section>
	);
}
