"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useAction } from "@/lib/use-action";
import {
	cancelInvitationAction,
	removeMemberAction,
	updateMemberRoleAction,
} from "../team-actions";
import type { InvitationRecord, MemberRecord } from "../team-queries";
import { MEMBER_ROLES } from "../team-schema";

/**
 * The row-level controls of `/equipe`. The tables around them are server
 * components; only these leaves ship to the browser.
 */

/**
 * A role change is a dropdown the user already sees move, so it updates
 * optimistically and only speaks up when the server disagrees — a success toast
 * next to a select that visibly changed is double feedback. `setOptimisticRole`
 * has to be called inside the transition, which is why this uses `useTransition`
 * directly instead of `useAction`.
 */
export function MemberRoleSelect({ member }: { member: MemberRecord }) {
	const [optimisticRole, setOptimisticRole] = useOptimistic(member.role);
	const [isPending, startTransition] = useTransition();

	function changeRole(role: string) {
		if (role === optimisticRole) {
			return;
		}
		startTransition(async () => {
			setOptimisticRole(role);
			const result = await updateMemberRoleAction({
				memberId: member.id,
				role,
			});
			if (!result.ok) {
				toast.error(result.error);
			}
		});
	}

	return (
		<Select
			disabled={isPending}
			onValueChange={changeRole}
			value={optimisticRole}
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
	);
}

export function RemoveMemberButton({ member }: { member: MemberRecord }) {
	const { pending, run } = useAction();

	return (
		<ConfirmButton
			confirmLabel="Remover membro"
			description={`${member.name} perderá o acesso ao painel desta barbearia.`}
			disabled={pending}
			label="Remover"
			onConfirm={() =>
				run(() => removeMemberAction(member.id), "Membro removido")
			}
			title="Remover membro?"
		/>
	);
}

export function CancelInvitationButton({
	invitation,
}: {
	invitation: InvitationRecord;
}) {
	const { pending, run } = useAction();

	return (
		<Button
			disabled={pending}
			onClick={() =>
				run(() => cancelInvitationAction(invitation.id), "Convite cancelado")
			}
			size="sm"
			type="button"
			variant="ghost"
		>
			Cancelar
		</Button>
	);
}
