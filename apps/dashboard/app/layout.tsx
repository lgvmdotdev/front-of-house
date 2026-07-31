import "@workspace/ui/globals.css";
import { Toaster } from "@workspace/ui/components/sonner";
import { cn } from "@workspace/ui/lib/utils";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";

const fontHeading = Bricolage_Grotesque({
	subsets: ["latin"],
	axes: ["opsz"],
	variable: "--font-heading",
	display: "swap",
});

const fontSans = Geist({
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
});

const fontMono = JetBrains_Mono({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-mono",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Painel · Recepcionai",
	description:
		"Painel de gestão da recepcionista de WhatsApp da sua barbearia.",
};

export const viewport: Viewport = {
	themeColor: "#0d0d0c",
	colorScheme: "dark",
};

/**
 * `packages/ui` ships a single dark theme in `:root` — the `dark` class only
 * sets `color-scheme`, so there is nothing to toggle and no theme provider.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			className={cn(
				"dark antialiased",
				fontSans.variable,
				fontHeading.variable,
				fontMono.variable
			)}
			// `@workspace/ui`'s globals.css sets `scroll-behavior: smooth` on <html>.
			// Next 16 stopped overriding that during route transitions unless this
			// attribute opts in, and warns in dev when it is missing.
			data-scroll-behavior="smooth"
			lang="pt-BR"
		>
			<body className="bg-background font-sans text-foreground">
				{children}
				<Toaster />
			</body>
		</html>
	);
}
