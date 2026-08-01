import { Button } from "@workspace/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { formatDateTime, formatPhone } from "@/lib/format";
import { requireActiveOrg } from "@/lib/session";
import { listConversations } from "../conversation-queries";
import type { ConversationStatus } from "../conversation-status";
import { StatusBadge } from "./status-badge";

/**
 * Receives the parsed `?status=` value, never `searchParams` itself — the page
 * resolves that promise and hands over a typed filter.
 */
export async function ConversationsTable({
	status,
}: {
	status?: ConversationStatus;
}) {
	const { organizationId } = await requireActiveOrg();
	const conversations = await listConversations(organizationId, status);

	if (conversations.length === 0) {
		return (
			<EmptyState
				description="As conversas aparecem aqui assim que a recepcionista começar a atender no WhatsApp."
				title="Nenhuma conversa"
			/>
		);
	}

	return (
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
						<TableCell>{formatDateTime(conversation.lastMessageAt)}</TableCell>
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
	);
}

export function ConversationsTableSkeleton() {
	return <TableSkeleton columns={4} />;
}
