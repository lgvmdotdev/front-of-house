import { Capabilities } from "@/components/sections/capabilities";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { Founder } from "@/components/sections/founder";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Integrations } from "@/components/sections/integrations";
import { Problem } from "@/components/sections/problem";
import { WhoItsFor } from "@/components/sections/who-its-for";
import { Footer } from "@/components/site/footer";
import { GridBackdrop } from "@/components/site/grid-backdrop";
import { Header } from "@/components/site/header";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";

export default function Page() {
	return (
		<div className="relative min-h-svh overflow-hidden bg-background text-foreground">
			<a
				className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-mint focus:px-4 focus:py-2 focus:text-[13px] focus:text-primary-foreground focus:shadow-lg"
				href="#main"
			>
				Pular para o conteúdo
			</a>
			<GridBackdrop />
			<div className="relative z-10">
				<Header />
				<main id="main" tabIndex={-1}>
					<Hero />
					<Problem />
					<HowItWorks />
					<Capabilities />
					<Integrations />
					<WhoItsFor />
					<Founder />
					<Faq />
					<FinalCta />
				</main>
				<Footer />
			</div>
			<WhatsAppFab />
		</div>
	);
}
