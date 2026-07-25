import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Visão geral · Recepcionai",
};

const SHORTCUTS = [
	{
		href: "/dashboard/servicos",
		title: "Serviços",
		description: "Cadastre os serviços, duração e preço.",
	},
	{
		href: "/dashboard/profissionais",
		title: "Profissionais",
		description: "Cadastre os barbeiros, serviços e horários.",
	},
] as const;

export default function DashboardPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="font-semibold text-2xl">Visão geral</h1>
				<p className="text-muted-foreground">
					Configure sua barbearia para a recepcionista começar a atender.
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				{SHORTCUTS.map((shortcut) => (
					<Link href={shortcut.href} key={shortcut.href}>
						<Card className="transition-colors hover:border-ring">
							<CardHeader>
								<CardTitle>{shortcut.title}</CardTitle>
								<CardDescription>{shortcut.description}</CardDescription>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
