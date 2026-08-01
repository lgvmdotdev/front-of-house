import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionError } from "@/components/ui/section-error";
import {
	IntegrationCard,
	IntegrationCardSkeleton,
} from "@/features/organization/components/integration-card";

export const metadata: Metadata = {
	title: "Integração · Recepcionai",
};

export default function IntegracaoPage() {
	return (
		<div className="flex max-w-2xl flex-col gap-6">
			<PageHeader
				description="A Recepcionai não substitui sua ferramenta de agenda — ela agenda dentro dela."
				title="Integração"
			/>
			<SectionError title="Não foi possível carregar a integração">
				<Suspense fallback={<IntegrationCardSkeleton />}>
					<IntegrationCard />
				</Suspense>
			</SectionError>
		</div>
	);
}
