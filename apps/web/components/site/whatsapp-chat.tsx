import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

interface Bubble {
	content: ReactNode;
	delay: number;
	id: string;
	kind: "customer" | "agent";
	time: string;
}

interface Typing {
	delay: number;
	duration: number;
	id: string;
	kind: "typing";
}

type Item = Bubble | Typing;

const SCRIPT: Item[] = [
	{
		id: "c1",
		kind: "customer",
		time: "14:23",
		delay: 0.4,
		content: <>Boa tarde! Vocês têm horário pra hoje à tarde?</>,
	},
	{ id: "t1", kind: "typing", delay: 1.05, duration: 1.4 },
	{
		id: "a1",
		kind: "agent",
		time: "14:23",
		delay: 2.0,
		content: (
			<>
				Boa tarde! Hoje à tarde o{" "}
				<span className="font-medium text-mint">Felipe</span> tem{" "}
				<span className="font-medium text-mint">15h30</span> e o{" "}
				<span className="font-medium text-mint">Júnior</span> tem 16h45. Quer
				marcar com algum dos dois?
			</>
		),
	},
	{
		id: "c2",
		kind: "customer",
		time: "14:24",
		delay: 3.0,
		content: <>Pode ser com o Felipe às 15h30.</>,
	},
	{ id: "t2", kind: "typing", delay: 3.6, duration: 1.0 },
	{
		id: "a2",
		kind: "agent",
		time: "14:24",
		delay: 4.4,
		content: (
			<>
				Pronto, <span className="font-medium text-mint">Felipe às 15h30</span>{" "}
				confirmado. Mando um lembrete uma hora antes. Até mais!
			</>
		),
	},
];

export function WhatsAppChat() {
	return (
		<div className="relative mx-auto w-full max-w-[440px]">
			{/* Ambient glow behind the device */}
			<div
				aria-hidden="true"
				className="absolute -inset-12 -z-10 animate-fade-in opacity-60"
				style={{ animationDelay: "0.1s" }}
			>
				<div className="absolute inset-x-0 top-1/3 mx-auto h-72 w-72 rounded-full bg-mint/15 blur-3xl" />
				<div className="absolute inset-x-1/4 bottom-1/4 h-64 w-64 rounded-full bg-ember/10 blur-3xl" />
			</div>

			<div
				className="relative animate-fade-up rounded-[2.4rem] border border-line bg-surface/80 p-2.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
				style={{ animationDelay: "0.05s" }}
			>
				<div className="overflow-hidden rounded-[1.85rem] border border-line/80 bg-ink-deep">
					{/* Chat header */}
					<div className="flex items-center gap-3 border-line/70 border-b bg-surface/50 px-5 py-3.5">
						<div
							aria-hidden="true"
							className="relative flex size-9 items-center justify-center rounded-full bg-mint/12 ring-1 ring-mint/30"
						>
							<div className="size-2 animate-pulse-dot rounded-full bg-mint" />
						</div>
						<div className="flex flex-1 flex-col">
							<div
								className="font-medium text-[13.5px] text-paper leading-tight"
								translate="no"
							>
								Recepcionai
							</div>
							<div className="flex items-center gap-1.5 font-mono text-[9.5px] text-mint tracking-[0.18em]">
								<span className="size-1 rounded-full bg-mint" />
								ONLINE · BARBEARIA NORTE
							</div>
						</div>
						<div
							className="font-mono text-[9px] text-paper-faint tracking-[0.2em]"
							translate="no"
						>
							WHATSAPP
						</div>
					</div>

					{/* Message stream */}
					<div className="relative flex min-h-[440px] flex-col gap-2.5 px-4 py-6">
						{SCRIPT.map((item) => {
							if (item.kind === "typing") {
								return (
									<TypingIndicator
										delay={item.delay}
										duration={item.duration}
										key={item.id}
									/>
								);
							}
							return (
								<ChatBubble
									delay={item.delay}
									key={item.id}
									kind={item.kind}
									time={item.time}
								>
									{item.content}
								</ChatBubble>
							);
						})}
					</div>

					{/* Composer suggestion strip */}
					<div
						aria-hidden="true"
						className="flex items-center gap-2 border-line/70 border-t bg-surface/40 px-4 py-3"
					>
						<div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-line/80 bg-ink/70 px-3 py-2 text-[12px] text-paper-faint">
							<span className="font-mono text-[9.5px] text-mint tracking-[0.18em]">
								IA
							</span>
							<span className="min-w-0 flex-1 truncate">
								A Recepcionai está cuidando dessa conversa
							</span>
						</div>
						<span className="font-mono text-[10px] text-paper-muted uppercase tracking-[0.2em]">
							Assumir
						</span>
					</div>
				</div>
			</div>

			{/* Editorial annotation pointing at the chat */}
			<div
				className="absolute top-4 right-full mr-6 hidden w-44 animate-fade-in flex-col items-end gap-1 text-right xl:flex"
				style={{ animationDelay: "1.2s" }}
			>
				<span className="font-mono text-[9.5px] text-paper-faint uppercase tracking-[0.22em]">
					Demonstração
				</span>
				<span className="text-[13px] text-paper-muted leading-snug">
					Uma conversa de menos de 30 segundos do atendimento ao{" "}
					<span className="font-medium text-paper">agendamento</span>.
				</span>
				<svg
					aria-hidden="true"
					className="mt-1 h-4 w-12 text-line-strong"
					fill="none"
					focusable="false"
					stroke="currentColor"
					strokeWidth="1"
					viewBox="0 0 48 16"
				>
					<title>Seta apontando pra demonstração</title>
					<path
						d="M 0 8 L 40 8 M 36 4 L 40 8 L 36 12"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</div>
		</div>
	);
}

function ChatBubble({
	kind,
	time,
	delay,
	children,
}: {
	kind: "customer" | "agent";
	time: string;
	delay: number;
	children: ReactNode;
}) {
	const isAgent = kind === "agent";

	return (
		<div
			className={cn(
				"flex max-w-[86%] animate-chat-in flex-col gap-1",
				isAgent ? "items-start self-start" : "items-end self-end"
			)}
			style={{ animationDelay: `${delay}s` }}
		>
			<div
				className={cn(
					"rounded-[1.1rem] border px-3.5 py-2.5 text-[13.5px] leading-[1.45]",
					isAgent
						? "rounded-bl-md border-mint/25 bg-mint/[0.08] text-paper"
						: "rounded-br-md border-ember/30 bg-ember/[0.1] text-paper"
				)}
			>
				{children}
			</div>
			<div
				className={cn(
					"flex items-center gap-1 px-1 font-mono text-[9.5px] text-paper-faint tabular-nums tracking-[0.12em]",
					isAgent ? "self-start" : "self-end"
				)}
			>
				<span>{time}</span>
				{isAgent ? (
					<span aria-hidden="true" className="text-mint">
						✓✓
					</span>
				) : null}
			</div>
		</div>
	);
}

function TypingIndicator({
	delay,
	duration,
}: {
	delay: number;
	duration: number;
}) {
	return (
		<div
			aria-hidden="true"
			className="flex w-fit animate-typing items-center gap-1 self-start rounded-[1.1rem] rounded-bl-md border border-mint/20 bg-mint/[0.05] px-3.5 py-2.5"
			style={{
				animationDelay: `${delay}s`,
				animationDuration: `${duration}s`,
			}}
		>
			<TypingDot delay={0} />
			<TypingDot delay={0.18} />
			<TypingDot delay={0.36} />
		</div>
	);
}

function TypingDot({ delay }: { delay: number }) {
	return (
		<span
			className="size-1.5 animate-typing-dot rounded-full bg-mint"
			style={{ animationDelay: `${delay}s` }}
		/>
	);
}
