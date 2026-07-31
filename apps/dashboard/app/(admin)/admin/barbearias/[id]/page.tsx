import { RiArrowLeftLine } from "@remixicon/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
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
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/conversations/status-badge";
import { getTenantDetail } from "@/lib/admin";
import {
	formatDate,
	formatDateTime,
	formatPhone,
	formatUtcOffset,
} from "@/lib/format";
import { BOOKING_PROVIDERS, MEMBER_ROLES } from "@/lib/settings-schema";

export const metadata: Metadata = {
	title: "Barbearia · Recepcionai",
};

function providerLabel(provider: string): string {
	return (
		BOOKING_PROVIDERS.find((option) => option.value === provider)?.label ??
		provider
	);
}

function roleLabel(role: string | null): string {
	return MEMBER_ROLES.find((option) => option.value === role)?.label ?? "—";
}

export default async function BarbeariaPage({
	params,
}: PageProps<"/admin/barbearias/[id]">) {
	const { id } = await params;
	const detail = await getTenantDetail(id);
	if (!detail) {
		notFound();
	}
	const { organization, integration } = detail;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-3">
				<Button asChild className="self-start" size="sm" variant="ghost">
					<Link href="/admin/barbearias">
						<RiArrowLeftLine aria-hidden size={16} />
						Barbearias
					</Link>
				</Button>
				<div>
					<h1 className="font-semibold text-2xl">{organization.name}</h1>
					<p className="font-mono text-muted-foreground text-sm">
						{organization.slug} · {organization.id}
					</p>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Card>
					<CardHeader>
						<CardDescription>Catálogo</CardDescription>
						<CardTitle className="text-xl">
							{detail.services} serviços · {detail.professionals} profissionais
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>WhatsApp</CardDescription>
						<CardTitle className="text-xl">
							{detail.channels.length === 0 ? (
								<Badge variant="outline">não conectado</Badge>
							) : (
								<span className="font-mono text-base">
									{detail.channels
										.map((channel) => channel.phoneNumberId)
										.join(", ")}
								</span>
							)}
						</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Integração</CardTitle>
					<CardDescription>
						Backend de agenda configurado para esta barbearia.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{integration ? (
						<dl className="grid gap-2 text-sm sm:grid-cols-3">
							<div>
								<dt className="text-muted-foreground">Provedor</dt>
								<dd>{providerLabel(integration.provider)}</dd>
							</div>
							<div>
								<dt className="text-muted-foreground">Planilha</dt>
								<dd className="font-mono text-xs">
									{integration.spreadsheetId ?? "—"}
								</dd>
							</div>
							<div>
								<dt className="text-muted-foreground">Fuso</dt>
								<dd>{formatUtcOffset(integration.offsetMinutes)}</dd>
							</div>
						</dl>
					) : (
						<p className="text-muted-foreground text-sm">
							Sem configuração — a barbearia usará o Google Agenda por padrão.
						</p>
					)}
				</CardContent>
			</Card>

			<section className="flex flex-col gap-3">
				<h2 className="font-medium">Membros</h2>
				{detail.members.length === 0 ? (
					<p className="text-muted-foreground text-sm">Nenhum membro.</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nome</TableHead>
								<TableHead>E-mail</TableHead>
								<TableHead>Papel</TableHead>
								<TableHead>Desde</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{detail.members.map((member) => (
								<TableRow key={member.id}>
									<TableCell className="font-medium">{member.name}</TableCell>
									<TableCell>{member.email}</TableCell>
									<TableCell>{roleLabel(member.role)}</TableCell>
									<TableCell>{formatDate(member.createdAt)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</section>

			{detail.invitations.length > 0 ? (
				<section className="flex flex-col gap-3">
					<h2 className="font-medium">Convites pendentes</h2>
					<ul className="flex flex-col gap-1 text-sm">
						{detail.invitations.map((invitation) => (
							<li key={invitation.id}>
								{invitation.email} — {roleLabel(invitation.role)} (expira{" "}
								{formatDate(invitation.expiresAt)})
							</li>
						))}
					</ul>
				</section>
			) : null}

			<section className="flex flex-col gap-3">
				<h2 className="font-medium">Conversas recentes</h2>
				{detail.conversations.length === 0 ? (
					<p className="text-muted-foreground text-sm">Nenhuma conversa.</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Cliente</TableHead>
								<TableHead>Situação</TableHead>
								<TableHead>Última mensagem</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{detail.conversations.map((conversation) => (
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
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</section>
		</div>
	);
}
