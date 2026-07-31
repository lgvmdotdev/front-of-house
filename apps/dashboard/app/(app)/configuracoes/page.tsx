import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { OrganizationForm } from "@/components/settings/organization-form";
import { requireActiveOrg } from "@/lib/session";
import { getOrganization } from "@/lib/tenant";

export const metadata: Metadata = {
	title: "Configurações · Recepcionai",
};

export default async function ConfiguracoesPage() {
	const { organizationId } = await requireActiveOrg();
	const organization = await getOrganization(organizationId);
	if (!organization) {
		notFound();
	}
	return (
		<div className="flex max-w-2xl flex-col gap-6">
			<PageHeader
				description="Dados da barbearia usados no painel."
				title="Configurações"
			/>
			<OrganizationForm organization={organization} />
		</div>
	);
}
