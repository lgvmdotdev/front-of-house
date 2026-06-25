import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

import { Wordmark } from "./wordmark";

export function Header() {
	return (
		<header className="relative z-30 border-line/60 border-b backdrop-blur-md">
			<div className="container mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-10">
				<Link
					aria-label="Recepcionai — voltar ao topo"
					className="-my-2 flex items-center py-2"
					href="#top"
				>
					<Wordmark />
				</Link>

				<nav
					aria-label="Navegação principal"
					className="hidden items-center gap-8 text-paper-muted text-sm md:flex"
				>
					<Link
						className="-my-2 rounded-md px-1 py-2 outline-none transition-colors hover:text-paper focus-visible:ring-2 focus-visible:ring-mint/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
						href="#como-funciona"
					>
						Como funciona
					</Link>
					<Link
						className="-my-2 rounded-md px-1 py-2 outline-none transition-colors hover:text-paper focus-visible:ring-2 focus-visible:ring-mint/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
						href="#integracoes"
					>
						Integrações
					</Link>
					<Link
						className="-my-2 rounded-md px-1 py-2 outline-none transition-colors hover:text-paper focus-visible:ring-2 focus-visible:ring-mint/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
						href="#perguntas"
					>
						Perguntas
					</Link>
				</nav>

				<Button
					asChild
					className="h-11 rounded-full bg-mint px-5 text-[13px] text-primary-foreground hover:bg-mint-deep"
				>
					<Link
						href="/whatsapp"
						prefetch={false}
						rel="noopener"
						target="_blank"
					>
						Agendar demonstração
					</Link>
				</Button>
			</div>
		</header>
	);
}
