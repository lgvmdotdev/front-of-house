import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionError } from "@/components/ui/section-error";
import { CreateTenantDialog } from "@/features/tenant/components/create-tenant-dialog";
import {
	TenantsTable,
	TenantsTableSkeleton,
} from "@/features/tenant/components/tenants-table";

export const metadata: Metadata = {
	title: "Barbearias · Recepcionai",
};

export default function BarbeariasPage() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				action={<CreateTenantDialog />}
				description="Todos os tenants da plataforma."
				title="Barbearias"
			/>
			<SectionError title="Não foi possível carregar as barbearias">
				<Suspense fallback={<TenantsTableSkeleton />}>
					<TenantsTable />
				</Suspense>
			</SectionError>
		</div>
	);
}
