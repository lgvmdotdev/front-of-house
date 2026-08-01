"use client";

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
import { type FormEvent, useState } from "react";
import { useAction } from "@/lib/use-action";
import { inviteMemberAction } from "../team-actions";
import { MEMBER_ROLES } from "../team-schema";

/**
 * Static — it reads nothing — so the page renders it above its Suspense
 * boundaries and an owner can start typing an invitation before the member list
 * has loaded. Sending an e-mail is an invisible side effect, so this one does
 * toast on success.
 */
export function InviteForm() {
	const { pending, run } = useAction();
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("member");

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		run(
			() => inviteMemberAction({ email, role }),
			"Convite enviado",
			() => setEmail("")
		);
	}

	return (
		<form
			className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
			onSubmit={handleSubmit}
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
	);
}
