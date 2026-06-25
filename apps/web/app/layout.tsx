import { cn } from "@workspace/ui/lib/utils";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, JetBrains_Mono } from "next/font/google";
import "@workspace/ui/globals.css";
import { ThemeProvider } from "@/components/theme-provider";

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
	title: "Recepcionai · Sua barbearia agendando 24 horas no WhatsApp",
	description:
		"Mais clientes na cadeira, menos WhatsApp na sua mão. A Recepcionai atende, agenda e confirma horários no WhatsApp da sua barbearia — enquanto você corta cabelo.",
	metadataBase: new URL("https://recepcionai.com.br"),
	openGraph: {
		title: "Recepcionai · Sua barbearia agendando 24 horas no WhatsApp",
		description:
			"Mais clientes na cadeira, menos WhatsApp na sua mão. Atende, agenda e confirma no WhatsApp da sua barbearia.",
		locale: "pt_BR",
		type: "website",
	},
};

export const viewport: Viewport = {
	themeColor: "#0d0d0c",
	colorScheme: "dark",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			className={cn(
				"dark antialiased",
				fontSans.variable,
				fontHeading.variable,
				fontMono.variable
			)}
			lang="pt-BR"
			suppressHydrationWarning
		>
			<body className="bg-background font-sans text-foreground">
				<ThemeProvider defaultTheme="dark" forcedTheme="dark">
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
