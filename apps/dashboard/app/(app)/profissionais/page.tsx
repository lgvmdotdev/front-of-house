import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionError } from "@/components/ui/section-error";
import {
	NewProfessionalButton,
	NewProfessionalButtonSkeleton,
	ProfessionalsTable,
	ProfessionalsTableSkeleton,
} from "@/features/catalog/components/professionals-table";

export const metadata: Metadata = {
	title: "Profissionais · Recepcionai",
};

/**
 * Two boundaries: the create button needs the service list for its checkboxes,
 * the table needs both lists. `listServices` is `cache()`d, so they share one
 * query while still revealing independently.
 */
export default function ProfissionaisPage() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				action={
					<Suspense fallback={<NewProfessionalButtonSkeleton />}>
						<NewProfessionalButton />
					</Suspense>
				}
				description="Quem atende, quais serviços faz e em que horários."
				title="Profissionais"
			/>
			<SectionError title="Não foi possível carregar os profissionais">
				<Suspense fallback={<ProfessionalsTableSkeleton />}>
					<ProfessionalsTable />
				</Suspense>
			</SectionError>
		</div>
	);
}
