import { Button } from "@workspace/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/conversations/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatPhone } from "@/lib/format";
import { requireActiveOrg } from "@/lib/session";
import {
	CONVERSATION_STATUSES,
	isConversationStatus,
	listConversations,
} from "@/lib/tenant";

export const metadata: Metadata = {
	title: "Conversas · Recepcionai",
};

const FILTERS = [
	{ value: undefined, label: "Todas" },
	...CONVERSATION_STATUSES.map((status) => ({
		value: status.value as string | undefined,
		label: status.label,
	})),
];

export default async function ConversasPage({
	searchParams,
}: PageProps<"/conversas">) {
	const { organizationId } = await requireActiveOrg();
	const { status } = await searchParams;
	const active =
		typeof status === "string" && isConversationStatus(status)
			? status
			: undefined;
	const conversations = await listConversations(organizationId, active);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="O que a recepcionista conversou com seus clientes. Somente leitura."
				title="Conversas"
			/>

			<nav aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
				{FILTERS.map((filter) => (
					<Button
						asChild
						key={filter.label}
						size="sm"
						variant={filter.value === active ? "secondary" : "ghost"}
					>
						<Link
							aria-current={filter.value === active ? "page" : undefined}
							href={
								filter.value
									? `/conversas?status=${filter.value}`
									: "/conversas"
							}
						>
							{filter.label}
						</Link>
					</Button>
				))}
			</nav>

			{conversations.length === 0 ? (
				<EmptyState
					description="As conversas aparecem aqui assim que a recepcionista começar a atender no WhatsApp."
					title="Nenhuma conversa"
				/>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Cliente</TableHead>
							<TableHead>Situação</TableHead>
							<TableHead>Última mensagem</TableHead>
							<TableHead className="w-0" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{conversations.map((conversation) => (
							<TableRow key={conversation.id}>
								<TableCell className="font-medium">
									{formatPhone(conversation.customerPhone)}
								</TableCell>
								<TableCell>
									<StatusBadge status={conversation.status} />
								</TableCell>
								<TableCell>
									{formatDateTime(conversation.lastMessageAt)}
								</TableCell>
								<TableCell>
									<div className="flex justify-end">
										<Button asChild size="sm" variant="ghost">
											<Link href={`/conversas/${conversation.id}`}>Abrir</Link>
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
