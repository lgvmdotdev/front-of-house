import type { Metadata } from "next";
import { TenantsManager } from "@/components/admin/tenants-manager";
import { listTenants } from "@/lib/admin";

export const metadata: Metadata = {
	title: "Barbearias · Recepcionai",
};

export default async function BarbeariasPage() {
	const tenants = await listTenants();
	return <TenantsManager tenants={tenants} />;
}
