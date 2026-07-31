import { RiArrowLeftLine } from "@remixicon/react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/conversations/status-badge";
import { formatDateTime, formatPhone } from "@/lib/format";
import { requireActiveOrg } from "@/lib/session";
import { getConversation } from "@/lib/tenant";

export const metadata: Metadata = {
	title: "Conversa · Recepcionai",
};

/**
 * `getConversation` is org-scoped, so an id belonging to another barbershop
 * lands on the 404 boundary — the same response as an id that never existed.
 */
export default async function ConversaPage({
	params,
}: PageProps<"/conversas/[id]">) {
	const { organizationId } = await requireActiveOrg();
	const { id } = await params;
	const conversation = await getConversation(organizationId, id);
	if (!conversation) {
		notFound();
	}

	return (
		<div className="flex max-w-3xl flex-col gap-6">
			<div className="flex flex-col gap-3">
				<Button asChild className="self-start" size="sm" variant="ghost">
					<Link href="/conversas">
						<RiArrowLeftLine aria-hidden size={16} />
						Conversas
					</Link>
				</Button>
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
		</div>
	);
}
