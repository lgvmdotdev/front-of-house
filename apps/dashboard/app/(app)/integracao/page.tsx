import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { IntegrationForm } from "@/components/settings/integration-form";
import { requireActiveOrg } from "@/lib/session";
import { getIntegrationSettings } from "@/lib/tenant";

export const metadata: Metadata = {
	title: "Integração · Recepcionai",
};

export default async function IntegracaoPage() {
	const { organizationId } = await requireActiveOrg();
	const integration = await getIntegrationSettings(organizationId);
	return (
		<div className="flex max-w-2xl flex-col gap-6">
			<PageHeader
				description="A Recepcionai não substitui sua ferramenta de agenda — ela agenda dentro dela."
				title="Integração"
			/>
			<IntegrationForm integration={integration} />
		</div>
	);
}
