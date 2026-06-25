import { Section } from "@/components/site/section";

const TOOLS = [
	"Booksy",
	"Trinks",
	"Belezito",
	"Trezo",
	"Google Agenda",
	"Schedullr",
	"Planilha",
	"Outra ferramenta",
];

export function Integrations() {
	return (
		<Section
			heading={
				<>
					Você não troca o que já funciona.{" "}
					<span className="text-mint">A Recepcionai entra em cima.</span>
				</>
			}
			id="integracoes"
			kicker="Integrações"
			lede="Sua agenda atual continua sendo a sua agenda. A Recepcionai conecta nela e cuida do WhatsApp em cima. Você não muda nada — só ganha uma recepcionista trabalhando 24 horas por dia."
			number="04"
		>
			<div className="overflow-hidden rounded-2xl border border-line bg-surface/30">
				{/* Marquee strip — tool names as typographic wordmarks */}
				<div className="relative overflow-hidden border-line/60 border-b">
					<div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent" />
					<div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent" />
					<div className="flex w-max animate-marquee items-center gap-14 py-7">
						{TOOLS.map((tool) => (
							<MarqueeItem key={`a-${tool}`} tool={tool} />
						))}
						{TOOLS.map((tool) => (
							<MarqueeItem aria-hidden key={`b-${tool}`} tool={tool} />
						))}
					</div>
				</div>

				<div className="grid grid-cols-1 gap-px bg-line/60 md:grid-cols-3">
					<IntegrationBlock
						body="Cada integração é construída e calibrada junto da sua barbearia, sem template engessado."
						label="Sob medida"
						value="Onboarding white-glove"
					/>
					<IntegrationBlock
						body="A agenda do barbeiro continua sendo a fonte da verdade. A Recepcionai consulta e marca — não substitui."
						label="Fonte da verdade"
						value="A sua agenda"
					/>
					<IntegrationBlock
						body="Não pedimos pra você migrar de sistema, mudar de número ou refazer o cadastro dos clientes."
						label="Sem dor de migração"
						value="Você não troca nada"
					/>
				</div>
			</div>
		</Section>
	);
}

function MarqueeItem({ tool }: { tool: string }) {
	return (
		<div className="flex shrink-0 items-center gap-3">
			<span aria-hidden="true" className="size-1 rounded-full bg-mint/60" />
			<span
				className="font-heading text-[1.9rem] text-paper-muted leading-none tracking-[-0.02em] transition-colors hover:text-paper"
				translate="no"
			>
				{tool}
			</span>
		</div>
	);
}

function IntegrationBlock({
	label,
	value,
	body,
}: {
	label: string;
	value: string;
	body: string;
}) {
	return (
		<div className="flex flex-col gap-3 bg-ink p-7 md:p-9">
			<span className="font-mono text-[10px] text-mint uppercase tracking-[0.22em]">
				{label}
			</span>
			<h3 className="text-balance font-heading text-2xl text-paper leading-[1.1] tracking-[-0.01em]">
				{value}
			</h3>
			<p className="text-[14px] text-paper-muted leading-relaxed">{body}</p>
		</div>
	);
}
