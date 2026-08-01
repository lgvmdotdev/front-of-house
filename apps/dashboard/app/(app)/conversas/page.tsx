import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionError } from "@/components/ui/section-error";
import { ConversationFilters } from "@/features/conversation/components/conversation-filters";
import {
	ConversationsTable,
	ConversationsTableSkeleton,
} from "@/features/conversation/components/conversations-table";
import { parseConversationStatus } from "@/features/conversation/conversation-status";

export const metadata: Metadata = {
	title: "Conversas · Recepcionai",
};

/**
 * Synchronous: `searchParams` is resolved with `.then()` so the header and the
 * filter nav — whose position never depends on the data — paint before the
 * query runs. `group-has-data-pending` dims the table while a filter click is
 * in flight; the filter nav sets that attribute without knowing this wrapper
 * exists.
 */
export default function ConversasPage({
	searchParams,
}: PageProps<"/conversas">) {
	return (
		<div className="group/filters flex flex-col gap-6">
			<PageHeader
				description="O que a recepcionista conversou com seus clientes. Somente leitura."
				title="Conversas"
			/>

			<Suspense fallback={<ConversationFilters />}>
				{searchParams.then((sp) => (
					<ConversationFilters active={parseConversationStatus(sp.status)} />
				))}
			</Suspense>

			<div className="transition-opacity group-has-data-pending/filters:opacity-50">
				<SectionError title="Não foi possível carregar as conversas">
					<Suspense fallback={<ConversationsTableSkeleton />}>
						{searchParams.then((sp) => (
							<ConversationsTable status={parseConversationStatus(sp.status)} />
						))}
					</Suspense>
				</SectionError>
			</div>
		</div>
	);
}
