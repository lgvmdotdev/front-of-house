"use client";

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
import { type FormEvent, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useAction } from "@/lib/use-action";
import {
	banUserAction,
	impersonateUserAction,
	setUserRoleAction,
	unbanUserAction,
} from "../user-actions";
import type { PlatformUser } from "../user-queries";

/** The row-level controls of `/admin/usuarios`; the table itself is a server component. */

const USER_ROLES = [
	{ value: "user", label: "Usuário" },
	{ value: "admin", label: "Administrador" },
] as const;

/** Optimistic like the member role select — the dropdown is its own feedback. */
export function UserRoleSelect({
	user,
	isSelf,
}: {
	isSelf: boolean;
	user: PlatformUser;
}) {
	const [optimisticRole, setOptimisticRole] = useOptimistic(
		user.role === "admin" ? "admin" : "user"
	);
	const [isPending, startTransition] = useTransition();

	function changeRole(role: string) {
		if (role === optimisticRole) {
			return;
		}
		startTransition(async () => {
			setOptimisticRole(role);
			const result = await setUserRoleAction(
				user.id,
				role === "admin" ? "admin" : "user"
			);
			if (!result.ok) {
				toast.error(result.error);
			}
		});
	}

	return (
		<Select
			disabled={isPending || isSelf}
			onValueChange={changeRole}
			value={optimisticRole}
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
	);
}

/**
 * Unblocking is a single click with a visible result (the badge flips), so it
 * updates optimistically and only toasts when the server refuses.
 */
export function UnbanUserButton({ user }: { user: PlatformUser }) {
	const [optimisticBanned, setOptimisticBanned] = useOptimistic(user.banned);
	const [isPending, startTransition] = useTransition();

	if (!optimisticBanned) {
		return null;
	}

	return (
		<Button
			disabled={isPending}
			onClick={() =>
				startTransition(async () => {
					setOptimisticBanned(false);
					const result = await unbanUserAction(user.id);
					if (!result.ok) {
						toast.error(result.error);
					}
				})
			}
			size="sm"
			type="button"
			variant="ghost"
		>
			Desbloquear
		</Button>
	);
}

/**
 * Blocking asks for a reason, so there is nothing to be optimistic about until
 * the dialog is submitted — and the consequence (every session revoked) deserves
 * the extra step.
 */
export function BanUserButton({
	user,
	isSelf,
}: {
	isSelf: boolean;
	user: PlatformUser;
}) {
	const { pending, run } = useAction();
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState("");

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setOpen(false);
		run(
			() => banUserAction(user.id, reason),
			"Usuário bloqueado",
			() => setReason("")
		);
	}

	return (
		<>
			<Button
				disabled={pending || isSelf}
				onClick={() => {
					setReason("");
					setOpen(true);
				}}
				size="sm"
				type="button"
				variant="ghost"
			>
				Bloquear
			</Button>
			<Dialog onOpenChange={setOpen} open={open}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Bloquear {user.name}</DialogTitle>
						<DialogDescription>
							O usuário perde o acesso imediatamente e todas as sessões dele são
							encerradas.
						</DialogDescription>
					</DialogHeader>
					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						<div className="flex flex-col gap-2">
							<Label htmlFor="ban-reason">Motivo</Label>
							<Input
								autoFocus
								id="ban-reason"
								onChange={(event) => setReason(event.target.value)}
								placeholder="Bloqueado pela equipe"
								value={reason}
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
		</>
	);
}

export function ImpersonateUserButton({ user }: { user: PlatformUser }) {
	const { pending, run } = useAction();

	return (
		<ConfirmButton
			confirmLabel="Acessar como"
			description={`Sua sessão passa a ser a de ${user.name}. Você poderá voltar pela faixa no topo do painel.`}
			disabled={pending}
			label="Acessar como"
			// The action redirects into the tenant panel, so it never resolves here
			// and no success message is ever shown — `run` is for the pending state.
			onConfirm={() => run(() => impersonateUserAction(user.id), null)}
			title="Acessar como este usuário?"
		/>
	);
}
