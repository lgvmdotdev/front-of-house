import { WhatsApp } from "@workspace/ui/icon/whatsapp";

export function WhatsAppFab() {
	return (
		<a
			aria-label="Conversar com a Recepcionai no WhatsApp"
			className="group fixed z-50 flex size-14 animate-fade-in items-center justify-center rounded-full bg-white shadow-2xl shadow-black/40 outline-none ring-1 ring-black/5 transition-transform hover:scale-[1.06] focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-ink md:size-[60px]"
			href="/whatsapp"
			rel="noopener"
			style={{
				bottom: "max(1.5rem, env(safe-area-inset-bottom))",
				left: "max(1.5rem, env(safe-area-inset-left))",
				animationDelay: "0.8s",
			}}
			target="_blank"
		>
			<WhatsApp
				aria-hidden="true"
				className="size-8 transition-transform group-hover:scale-105 md:size-9"
			/>
		</a>
	);
}
