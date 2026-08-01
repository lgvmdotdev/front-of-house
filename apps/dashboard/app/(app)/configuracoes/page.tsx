import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionError } from "@/components/ui/section-error";
import {
	OrganizationCard,
	OrganizationCardSkeleton,
} from "@/features/organization/components/organization-card";

export const metadata: Metadata = {
	title: "Configurações · Recepcionai",
};

export default function ConfiguracoesPage() {
	return (
		<div className="flex max-w-2xl flex-col gap-6">
			<PageHeader
				description="Dados da barbearia usados no painel."
				title="Configurações"
			/>
			<SectionError title="Não foi possível carregar as configurações">
				<Suspense fallback={<OrganizationCardSkeleton />}>
					<OrganizationCard />
				</Suspense>
			</SectionError>
		</div>
	);
}
