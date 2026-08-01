import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionError } from "@/components/ui/section-error";
import { ServiceDialog } from "@/features/catalog/components/service-controls";
import {
	ServicesTable,
	ServicesTableSkeleton,
} from "@/features/catalog/components/services-table";

export const metadata: Metadata = {
	title: "Serviços · Recepcionai",
};

/**
 * Composition only: the header and the "novo serviço" button read nothing, so
 * they paint immediately and the table streams in behind its own boundary.
 */
export default function ServicosPage() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				action={<ServiceDialog />}
				description="O que a recepcionista pode oferecer e agendar no WhatsApp."
				title="Serviços"
			/>
			<SectionError title="Não foi possível carregar os serviços">
				<Suspense fallback={<ServicesTableSkeleton />}>
					<ServicesTable />
				</Suspense>
			</SectionError>
		</div>
	);
}
