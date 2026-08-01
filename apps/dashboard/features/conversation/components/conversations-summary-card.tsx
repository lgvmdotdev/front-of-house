import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import Link from "next/link";
import { CardGridSkeleton } from "@/components/ui/table-skeleton";
import { requireActiveOrg } from "@/lib/session";
import { listConversations } from "../conversation-queries";

/** The conversations card on the overview: totals by situation. */
export async function ConversationsSummaryCard() {
	const { organizationId } = await requireActiveOrg();
	const conversations = await listConversations(organizationId);

	const open = conversations.filter(
		(conversation) => conversation.status === "open"
	).length;
	const handedOff = conversations.filter(
		(conversation) => conversation.status === "handed_off"
	).length;

	return (
		<Link href="/conversas">
			<Card className="h-full transition-colors hover:border-ring">
				<CardHeader>
					<CardTitle>Conversas</CardTitle>
					<CardDescription>
						{conversations.length} no total, {open} aberta(s) e {handedOff} com
						atendente.
					</CardDescription>
				</CardHeader>
			</Card>
		</Link>
	);
}

export function ConversationsSummaryCardSkeleton() {
	return <CardGridSkeleton cards={1} />;
}
