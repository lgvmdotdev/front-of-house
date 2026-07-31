"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	cancelInvitationAction,
	inviteMemberAction,
	removeMemberAction,
	updateMemberRoleAction,
} from "@/app/(app)/_actions/team";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmButton } from "@/components/ui/confirm-button";
import type { ActionResult } from "@/lib/action-result";
import { formatDate } from "@/lib/format";
import { MEMBER_ROLES } from "@/lib/settings-schema";
import type { InvitationRecord, MemberRecord } from "@/lib/tenant";

function roleLabel(role: string | null): string {
	return MEMBER_ROLES.find((option) => option.value === role)?.label ?? "—";
}

export function TeamManager({
	members,
	invitations,
	currentUserId,
}: {
	currentUserId: string;
	invitations: InvitationRecord[];
	members: MemberRecord[];
}) {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("member");
	const [pending, startTransition] = useTransition();

	function run(action: () => Promise<ActionResult>, message: string) {
		startTransition(async () => {
			const result = await action();
			if (result.ok) {
				router.refresh();
				toast.success(message);
				return;
			}
			toast.error(result.error);
		});
	}

	function handleInvite(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		startTransition(async () => {
			const result = await inviteMemberAction({ email, role });
			if (result.ok) {
				setEmail("");
				router.refresh();
				toast.success("Convite enviado");
				return;
			}
			toast.error(result.error);
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Quem tem acesso ao painel desta barbearia."
				title="Equipe"
			/>

			<form
				className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
				onSubmit={handleInvite}
			>
				<div className="flex min-w-56 flex-1 flex-col gap-2">
					<Label htmlFor="invite-email">Convidar por e-mail</Label>
					<Input
						id="invite-email"
						onChange={(event) => setEmail(event.target.value)}
						placeholder="pessoa@barbearia.com"
						required
						type="email"
						value={email}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<Label htmlFor="invite-role">Papel</Label>
					<Select onValueChange={setRole} value={role}>
						<SelectTrigger className="w-44" id="invite-role">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{MEMBER_ROLES.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<Button disabled={pending} type="submit">
					{pending ? "Enviando..." : "Enviar convite"}
				</Button>
			</form>

			<section className="flex flex-col gap-3">
				<h2 className="font-medium">Membros</h2>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>E-mail</TableHead>
							<TableHead>Papel</TableHead>
							<TableHead>Desde</TableHead>
							<TableHead className="w-0" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{members.map((member) => (
							<TableRow key={member.id}>
								<TableCell className="font-medium">
									{member.name}
									{member.userId === currentUserId ? (
										<Badge className="ml-2" variant="outline">
											você
										</Badge>
									) : null}
								</TableCell>
								<TableCell>{member.email}</TableCell>
								<TableCell>
									<Select
										disabled={pending}
										onValueChange={(value) =>
											run(
												() =>
													updateMemberRoleAction({
														memberId: member.id,
														role: value,
													}),
												"Papel atualizado"
											)
										}
										value={member.role}
									>
										<SelectTrigger
											aria-label={`Papel de ${member.name}`}
											className="w-40"
											size="sm"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{MEMBER_ROLES.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</TableCell>
								<TableCell>{formatDate(member.createdAt)}</TableCell>
								<TableCell>
									<div className="flex justify-end">
										{member.userId === currentUserId ? null : (
											<ConfirmButton
												confirmLabel="Remover membro"
												description={`${member.name} perderá o acesso ao painel desta barbearia.`}
												disabled={pending}
												label="Remover"
												onConfirm={() =>
													run(
														() => removeMemberAction(member.id),
														"Membro removido"
													)
												}
												title="Remover membro?"
											/>
										)}
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="font-medium">Convites pendentes</h2>
				{invitations.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						Nenhum convite pendente.
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>E-mail</TableHead>
								<TableHead>Papel</TableHead>
								<TableHead>Expira</TableHead>
								<TableHead className="w-0" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{invitations.map((invitation) => (
								<TableRow key={invitation.id}>
									<TableCell className="font-medium">
										{invitation.email}
									</TableCell>
									<TableCell>{roleLabel(invitation.role)}</TableCell>
									<TableCell>{formatDate(invitation.expiresAt)}</TableCell>
									<TableCell>
										<div className="flex justify-end">
											<Button
												disabled={pending}
												onClick={() =>
													run(
														() => cancelInvitationAction(invitation.id),
														"Convite cancelado"
													)
												}
												size="sm"
												type="button"
												variant="ghost"
											>
												Cancelar
											</Button>
										</div>
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
