import type { Metadata } from "next";
import { ServicesManager } from "@/components/dashboard/services-manager";
import { listServices } from "@/lib/catalog";
import { requireActiveOrg } from "@/lib/session";

export const metadata: Metadata = {
	title: "Serviços · Recepcionai",
};

export default async function ServicosPage() {
	const { organizationId } = await requireActiveOrg();
	const services = await listServices(organizationId);
	return <ServicesManager services={services} />;
}
