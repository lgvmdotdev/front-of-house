import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionError } from "@/components/ui/section-error";
import {
	CatalogSummaryCards,
	CatalogSummaryCardsSkeleton,
} from "@/features/catalog/components/catalog-summary-cards";
import {
	ConversationsSummaryCard,
	ConversationsSummaryCardSkeleton,
} from "@/features/conversation/components/conversations-summary-card";
import {
	WhatsappStatusBadge,
	WhatsappStatusBadgeSkeleton,
} from "@/features/organization/components/whatsapp-channels";

export const metadata: Metadata = {
	title: "Visão geral · Recepcionai",
};

/**
 * Four cards, three independent reads. Each gets its own boundary because the
 * cards are fixed height — a slow count cannot push the others around, so
 * nothing has to wait for the slowest one.
 */
export default function PainelPage() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				action={
					<Suspense fallback={<WhatsappStatusBadgeSkeleton />}>
						<WhatsappStatusBadge />
					</Suspense>
				}
				description="Configure a barbearia para a recepcionista atender no WhatsApp."
				title="Visão geral"
			/>
			<div className="grid gap-4 sm:grid-cols-2">
				<SectionError title="Catálogo indisponível">
					<Suspense fallback={<CatalogSummaryCardsSkeleton />}>
						<CatalogSummaryCards />
					</Suspense>
				</SectionError>
				<SectionError title="Conversas indisponíveis">
					<Suspense fallback={<ConversationsSummaryCardSkeleton />}>
						<ConversationsSummaryCard />
					</Suspense>
				</SectionError>
				<Link href="/integracao">
					<Card className="h-full transition-colors hover:border-ring">
						<CardHeader>
							<CardTitle>Integração</CardTitle>
							<CardDescription>
								Onde a recepcionista lê a agenda e grava os agendamentos.
							</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
		</div>
	);
}
