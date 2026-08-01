import { RiArrowLeftLine } from "@remixicon/react";
import { Button } from "@workspace/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SectionError } from "@/components/ui/section-error";
import {
	ConversationTranscript,
	ConversationTranscriptSkeleton,
} from "@/features/conversation/components/conversation-transcript";
import { getConversation } from "@/features/conversation/conversation-queries";
import { formatPhone } from "@/lib/format";
import { requireActiveOrg } from "@/lib/session";

/**
 * Titles the tab with the customer's number, and fails fast on an id this
 * barbershop cannot see: the 404 page then renders instead of a skeleton that
 * resolves into one. `getConversation` is `cache()`d, so the transcript below
 * reuses this read.
 *
 * Note the trade-off a synchronous page makes here: the response is committed
 * with 200 before this resolves, so a foreign or unknown id renders the 404 page
 * while keeping a 200 status line. Verified, deliberate, and only reversible by
 * awaiting the read in the page body — which is the shape we moved away from.
 */
export async function generateMetadata({
	params,
}: PageProps<"/conversas/[id]">): Promise<Metadata> {
	const [{ organizationId }, { id }] = await Promise.all([
		requireActiveOrg(),
		params,
	]);
	const conversation = await getConversation(organizationId, id);
	if (!conversation) {
		notFound();
	}
	return {
		title: `${formatPhone(conversation.customerPhone)} · Recepcionai`,
	};
}

/**
 * The back link is the only thing here that does not depend on the read, so it
 * sits above the `params.then()` and paints instantly. Everything the transcript
 * needs — including the customer's number in the heading — comes from one query
 * behind one boundary.
 */
export default function ConversaPage({ params }: PageProps<"/conversas/[id]">) {
	return (
		<div className="flex max-w-3xl flex-col gap-6">
			<Button asChild className="self-start" size="sm" variant="ghost">
				<Link href="/conversas">
					<RiArrowLeftLine aria-hidden size={16} />
					Conversas
				</Link>
			</Button>
			<SectionError title="Não foi possível carregar a conversa">
				<Suspense fallback={<ConversationTranscriptSkeleton />}>
					{params.then(({ id }) => (
						<ConversationTranscript id={id} />
					))}
				</Suspense>
			</SectionError>
		</div>
	);
}
