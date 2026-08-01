import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { notFound } from "next/navigation";
import { formatDateTime, formatPhone } from "@/lib/format";
import { requireActiveOrg } from "@/lib/session";
import { getConversation } from "../conversation-queries";
import { StatusBadge } from "./status-badge";

/**
 * Receives the conversation id, not `params`. `getConversation` is org-scoped,
 * so an id belonging to another barbershop lands on the 404 boundary — the same
 * response as an id that never existed.
 */
export async function ConversationTranscript({ id }: { id: string }) {
	const { organizationId } = await requireActiveOrg();
	const conversation = await getConversation(organizationId, id);
	if (!conversation) {
		notFound();
	}

	return (
		<>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<h1 className="font-semibold text-2xl">
						{formatPhone(conversation.customerPhone)}
					</h1>
					<p className="text-muted-foreground text-sm">
						Última mensagem em {formatDateTime(conversation.lastMessageAt)}
					</p>
				</div>
				<StatusBadge status={conversation.status} />
			</div>

			{conversation.messages.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					Esta conversa ainda não tem mensagens.
				</p>
			) : (
				<ol className="flex flex-col gap-3">
					{conversation.messages.map((message) => {
						const fromCustomer = message.role === "user";
						return (
							<li
								className={cn(
									"flex flex-col gap-1",
									fromCustomer ? "items-start" : "items-end"
								)}
								key={message.id}
							>
								<div
									className={cn(
										"max-w-[80%] rounded-lg px-3 py-2 text-sm",
										fromCustomer
											? "bg-muted text-foreground"
											: "bg-primary text-primary-foreground"
									)}
								>
									{message.content}
								</div>
								<span className="text-muted-foreground text-xs">
									{fromCustomer ? "Cliente" : "Recepcionai"} ·{" "}
									{formatDateTime(message.createdAt)}
								</span>
							</li>
						);
					})}
				</ol>
			)}
		</>
	);
}

export function ConversationTranscriptSkeleton() {
	return (
		<>
			<div
				aria-hidden
				className="flex flex-wrap items-center justify-between gap-2"
			>
				<div className="flex flex-col gap-2">
					<Skeleton className="h-8 w-56" />
					<Skeleton className="h-4 w-44" />
				</div>
				<Skeleton className="h-6 w-20 rounded-full" />
			</div>
			<div aria-hidden className="flex flex-col gap-3">
				{["a", "b", "c", "d"].map((bubble, index) => (
					<div
						className={cn(
							"flex flex-col gap-1",
							index % 2 === 0 ? "items-start" : "items-end"
						)}
						key={bubble}
					>
						<Skeleton className="h-10 w-[60%] rounded-lg" />
						<Skeleton className="h-3 w-32" />
					</div>
				))}
			</div>
		</>
	);
}
