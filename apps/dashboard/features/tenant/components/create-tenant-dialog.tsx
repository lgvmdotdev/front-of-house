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
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useAction } from "@/lib/use-action";
import { createTenantAction } from "../tenant-actions";

const COMBINING_MARKS = /[̀-ͯ]/g;
const NON_SLUG = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

/** "Barbearia Demo" → "barbearia-demo", so the operator rarely types a slug. */
function slugify(value: string): string {
	return value
		.normalize("NFD")
		.replace(COMBINING_MARKS, "")
		.toLowerCase()
		.replace(NON_SLUG, "-")
		.replace(EDGE_HYPHENS, "");
}

export function CreateTenantDialog() {
	const router = useRouter();
	const { pending, run } = useAction();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugEdited, setSlugEdited] = useState(false);
	const [ownerName, setOwnerName] = useState("");
	const [ownerEmail, setOwnerEmail] = useState("");
	const [ownerPassword, setOwnerPassword] = useState("");

	function openDialog() {
		setName("");
		setSlug("");
		setSlugEdited(false);
		setOwnerName("");
		setOwnerEmail("");
		setOwnerPassword("");
		setOpen(true);
	}

	function handleNameChange(value: string) {
		setName(value);
		if (!slugEdited) {
			setSlug(slugify(value));
		}
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		run(
			() =>
				createTenantAction({
					name,
					slug,
					ownerName,
					ownerEmail,
					ownerPassword,
				}),
			"Barbearia criada",
			(data) => {
				setOpen(false);
				router.push(`/admin/barbearias/${data.organizationId}`);
			}
		);
	}

	return (
		<>
			<Button onClick={openDialog} type="button">
				Nova barbearia
			</Button>
			<Dialog onOpenChange={setOpen} open={open}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Nova barbearia</DialogTitle>
						<DialogDescription>
							Cria a barbearia e o usuário proprietário. O proprietário precisa
							ser um e-mail novo — cada dono pode ter apenas uma barbearia.
						</DialogDescription>
					</DialogHeader>
					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						<div className="flex flex-col gap-2">
							<Label htmlFor="tenant-name">Nome da barbearia</Label>
							<Input
								autoFocus
								id="tenant-name"
								onChange={(event) => handleNameChange(event.target.value)}
								required
								value={name}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="tenant-slug">Identificador</Label>
							<Input
								id="tenant-slug"
								onChange={(event) => {
									setSlugEdited(true);
									setSlug(event.target.value);
								}}
								required
								value={slug}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="tenant-owner-name">Nome do proprietário</Label>
							<Input
								id="tenant-owner-name"
								onChange={(event) => setOwnerName(event.target.value)}
								required
								value={ownerName}
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2">
								<Label htmlFor="tenant-owner-email">E-mail</Label>
								<Input
									id="tenant-owner-email"
									onChange={(event) => setOwnerEmail(event.target.value)}
									required
									type="email"
									value={ownerEmail}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="tenant-owner-password">Senha inicial</Label>
								<Input
									id="tenant-owner-password"
									minLength={8}
									onChange={(event) => setOwnerPassword(event.target.value)}
									required
									value={ownerPassword}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button disabled={pending} type="submit">
								{pending ? "Criando..." : "Criar barbearia"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
