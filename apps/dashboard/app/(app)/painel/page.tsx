import { Badge } from "@workspace/ui/components/badge";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { countCatalog } from "@/lib/catalog";
import { requireActiveOrg } from "@/lib/session";
import { listConversations, listWhatsappChannels } from "@/lib/tenant";

export const metadata: Metadata = {
	title: "Visão geral · Recepcionai",
};

export default async function PainelPage() {
	const { organizationId } = await requireActiveOrg();
	const [catalog, conversations, channels] = await Promise.all([
		countCatalog(organizationId),
		listConversations(organizationId),
		listWhatsappChannels(organizationId),
	]);

	const open = conversations.filter(
		(conversation) => conversation.status === "open"
	).length;
	const handedOff = conversations.filter(
		(conversation) => conversation.status === "handed_off"
	).length;

	const cards = [
		{
			href: "/servicos" as const,
			title: "Serviços",
			description: `${catalog.services} cadastrado(s) — duração e preço do que a recepcionista pode agendar.`,
		},
		{
			href: "/profissionais" as const,
			title: "Profissionais",
			description: `${catalog.professionals} cadastrado(s) — quem atende e em que horários.`,
		},
		{
			href: "/conversas" as const,
			title: "Conversas",
			description: `${conversations.length} no total, ${open} aberta(s) e ${handedOff} com atendente.`,
		},
		{
			href: "/integracao" as const,
			title: "Integração",
			description: "Onde a recepcionista lê a agenda e grava os agendamentos.",
		},
	];

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				action={
					<Badge variant={channels.length > 0 ? "secondary" : "outline"}>
						{channels.length > 0
							? "WhatsApp conectado"
							: "WhatsApp não conectado"}
					</Badge>
				}
				description="Configure a barbearia para a recepcionista atender no WhatsApp."
				title="Visão geral"
			/>
			<div className="grid gap-4 sm:grid-cols-2">
				{cards.map((card) => (
					<Link href={card.href} key={card.href}>
						<Card className="h-full transition-colors hover:border-ring">
							<CardHeader>
								<CardTitle>{card.title}</CardTitle>
								<CardDescription>{card.description}</CardDescription>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
