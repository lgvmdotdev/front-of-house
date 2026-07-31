"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
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
	banUserAction,
	impersonateUserAction,
	setUserRoleAction,
	unbanUserAction,
} from "@/app/(admin)/admin/_actions/users";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmButton } from "@/components/ui/confirm-button";
import type { ActionResult } from "@/lib/action-result";
import type { PlatformUser } from "@/lib/admin";
import { formatDate } from "@/lib/format";

const USER_ROLES = [
	{ value: "user", label: "Usuário" },
	{ value: "admin", label: "Administrador" },
] as const;

export function UsersManager({
	users,
	currentUserId,
}: {
	currentUserId: string;
	users: PlatformUser[];
}) {
	const router = useRouter();
	const [banTarget, setBanTarget] = useState<PlatformUser | null>(null);
	const [banReason, setBanReason] = useState("");
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

	function handleBan(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const target = banTarget;
		if (!target) {
			return;
		}
		setBanTarget(null);
		run(() => banUserAction(target.id, banReason), "Usuário bloqueado");
		setBanReason("");
	}

	function handleImpersonate(user: PlatformUser) {
		// The action redirects into the tenant panel, so there is no result to read.
		startTransition(async () => {
			await impersonateUserAction(user.id);
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Todos os usuários da plataforma."
				title="Usuários"
			/>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Nome</TableHead>
						<TableHead>E-mail</TableHead>
						<TableHead>Barbearias</TableHead>
						<TableHead>Papel interno</TableHead>
						<TableHead>Situação</TableHead>
						<TableHead>Desde</TableHead>
						<TableHead className="w-0" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((user) => {
						const isSelf = user.id === currentUserId;
						return (
							<TableRow key={user.id}>
								<TableCell className="font-medium">
									{user.name}
									{isSelf ? (
										<Badge className="ml-2" variant="outline">
											você
										</Badge>
									) : null}
								</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell className="whitespace-normal text-sm">
									{user.memberships.length === 0 ? (
										<span className="text-muted-foreground">—</span>
									) : (
										user.memberships
											.map(
												(membership) =>
													`${membership.organizationName} (${membership.role})`
											)
											.join(", ")
									)}
								</TableCell>
								<TableCell>
									<Select
										disabled={pending || isSelf}
										onValueChange={(value) =>
											run(
												() =>
													setUserRoleAction(
														user.id,
														value === "admin" ? "admin" : "user"
													),
												"Papel atualizado"
											)
										}
										value={user.role === "admin" ? "admin" : "user"}
									>
										<SelectTrigger
											aria-label={`Papel de ${user.name}`}
											className="w-40"
											size="sm"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{USER_ROLES.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</TableCell>
								<TableCell>
									{user.banned ? (
										<Badge variant="destructive">
											bloqueado
											{user.banReason ? `: ${user.banReason}` : ""}
										</Badge>
									) : (
										<Badge variant="secondary">ativo</Badge>
									)}
								</TableCell>
								<TableCell>{formatDate(user.createdAt)}</TableCell>
								<TableCell>
									<div className="flex justify-end gap-2">
										{user.banned ? (
											<Button
												disabled={pending}
												onClick={() =>
													run(
														() => unbanUserAction(user.id),
														"Usuário desbloqueado"
													)
												}
												size="sm"
												type="button"
												variant="ghost"
											>
												Desbloquear
											</Button>
										) : (
											<Button
												disabled={pending || isSelf}
												onClick={() => {
													setBanReason("");
													setBanTarget(user);
												}}
												size="sm"
												type="button"
												variant="ghost"
											>
												Bloquear
											</Button>
										)}
										{isSelf || user.memberships.length === 0 ? null : (
											<ConfirmButton
												confirmLabel="Acessar como"
												description={`Sua sessão passa a ser a de ${user.name}. Você poderá voltar pela faixa no topo do painel.`}
												disabled={pending}
												label="Acessar como"
												onConfirm={() => handleImpersonate(user)}
												title="Acessar como este usuário?"
											/>
										)}
									</div>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>

			<Dialog
				onOpenChange={(open) => {
					if (!open) {
						setBanTarget(null);
					}
				}}
				open={banTarget !== null}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Bloquear {banTarget?.name}</DialogTitle>
						<DialogDescription>
							O usuário perde o acesso imediatamente e todas as sessões dele são
							encerradas.
						</DialogDescription>
					</DialogHeader>
					<form className="flex flex-col gap-4" onSubmit={handleBan}>
						<div className="flex flex-col gap-2">
							<Label htmlFor="ban-reason">Motivo</Label>
							<Input
								autoFocus
								id="ban-reason"
								onChange={(event) => setBanReason(event.target.value)}
								placeholder="Bloqueado pela equipe"
								value={banReason}
							/>
						</div>
						<DialogFooter>
							<Button disabled={pending} type="submit" variant="destructive">
								Bloquear
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
