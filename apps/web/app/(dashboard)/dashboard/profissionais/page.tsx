import type { Metadata } from "next";
import { ProfessionalsManager } from "@/components/dashboard/professionals-manager";
import { listProfessionals, listServices } from "@/lib/catalog";
import { requireActiveOrg } from "@/lib/session";

export const metadata: Metadata = {
	title: "Profissionais · Recepcionai",
};

export default async function ProfissionaisPage() {
	const { organizationId } = await requireActiveOrg();
	const [professionals, services] = await Promise.all([
		listProfessionals(organizationId),
		listServices(organizationId),
	]);
	return (
		<ProfessionalsManager professionals={professionals} services={services} />
	);
}
