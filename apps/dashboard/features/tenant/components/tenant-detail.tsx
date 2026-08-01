import { Badge } from "@workspace/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { notFound } from "next/navigation";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { StatusBadge } from "@/features/conversation/components/status-badge";
import { BOOKING_PROVIDERS } from "@/features/organization/organization-schema";
import { memberRoleLabel } from "@/features/team/team-schema";
import {
	formatDate,
	formatDateTime,
	formatPhone,
	formatUtcOffset,
} from "@/lib/format";
import { getTenantDetail } from "../tenant-queries";

/**
 * One boundary for the whole detail view, because it is one read:
 * `getTenantDetail` composes the six org-scoped queries behind a single await.
 * Splitting the sections into their own boundaries would mean splitting that
 * query first — worth doing if any one of them gets slow, not before.
 */

function providerLabel(provider: string): string {
	return (
		BOOKING_PROVIDERS.find((option) => option.value === provider)?.label ??
		provider
	);
}

export async function TenantDetail({ id }: { id: string }) {
	const detail = await getTenantDetail(id);
	if (!detail) {
		notFound();
	}
	const { organization, integration } = detail;

	return (
		<>
			<div>
				<h1 className="font-semibold text-2xl">{organization.name}</h1>
				<p className="font-mono text-muted-foreground text-sm">
					{organization.slug} · {organization.id}
				</p>
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
									<TableCell>{memberRoleLabel(member.role)}</TableCell>
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
								{invitation.email} — {memberRoleLabel(invitation.role)} (expira{" "}
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
		</>
	);
}

export function TenantDetailSkeleton() {
	return (
		<>
			<div aria-hidden className="flex flex-col gap-2">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-80" />
			</div>
			<div aria-hidden className="grid gap-4 sm:grid-cols-2">
				{["catalog", "whatsapp"].map((card) => (
					<div className="flex flex-col gap-3 rounded-xl border p-6" key={card}>
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-6 w-56" />
					</div>
				))}
			</div>
			<div aria-hidden className="flex flex-col gap-4 rounded-xl border p-6">
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-4 w-full max-w-md" />
				<TableSkeleton columns={3} rows={1} />
			</div>
			<section aria-hidden className="flex flex-col gap-3">
				<Skeleton className="h-5 w-24" />
				<TableSkeleton columns={4} rows={2} />
			</section>
			<section aria-hidden className="flex flex-col gap-3">
				<Skeleton className="h-5 w-40" />
				<TableSkeleton columns={3} rows={2} />
			</section>
		</>
	);
}
