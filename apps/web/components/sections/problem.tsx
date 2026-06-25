import { Section } from "@/components/site/section";

const SCENES = [
	{
		tag: "Cena 01",
		time: "22:14",
		title: "O cliente manda mensagem fora do horário.",
		body: "Pergunta se tem horário pro sábado. Ninguém responde. No outro dia, ele já marcou em outra barbearia.",
	},
	{
		tag: "Cena 02",
		time: "15:47",
		title: "O barbeiro está cortando e o WhatsApp não para.",
		body: "Atende mal o cliente da cadeira pra responder o do chat. Atende mal o do chat pra não atrasar a cadeira. Perde os dois.",
	},
	{
		tag: "Cena 03",
		time: "09:00",
		title: "Marcou na quarta, sumiu no sábado.",
		body: "Cadeira parada custa dinheiro — e ninguém ligou pra confirmar. O horário fica vago e o faturamento da semana já não bate.",
	},
];

export function Problem() {
	return (
		<Section
			heading={
				<>
					Toda barbearia perde <span className="text-mint">dinheiro</span> no
					WhatsApp.
				</>
			}
			id="problema"
			kicker="O Problema"
			lede="Três cenas que você já viveu. Cada uma vale uma cadeira vazia e um cliente que marcou em outro lugar."
			number="01"
		>
			<div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line/60 md:grid-cols-3">
				{SCENES.map((scene) => (
					<article
						className="group relative flex flex-col gap-5 bg-ink p-7 transition-colors hover:bg-surface md:p-8"
						key={scene.tag}
					>
						<div className="flex items-center justify-between font-mono text-[10px] text-paper-faint uppercase tracking-[0.22em]">
							<span className="text-ember">{scene.tag}</span>
							<span>{scene.time}</span>
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
