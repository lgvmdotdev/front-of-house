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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { createTenantAction } from "@/app/(admin)/admin/_actions/tenants";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import type { TenantSummary } from "@/lib/admin";
import { formatDate } from "@/lib/format";

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

export function TenantsManager({ tenants }: { tenants: TenantSummary[] }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugEdited, setSlugEdited] = useState(false);
	const [ownerName, setOwnerName] = useState("");
	const [ownerEmail, setOwnerEmail] = useState("");
	const [ownerPassword, setOwnerPassword] = useState("");
	const [pending, startTransition] = useTransition();

	function openCreate() {
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
		startTransition(async () => {
			const result = await createTenantAction({
				name,
				slug,
				ownerName,
				ownerEmail,
				ownerPassword,
			});
			if (result.ok) {
				setOpen(false);
				toast.success("Barbearia criada");
				router.push(`/admin/barbearias/${result.data.organizationId}`);
				router.refresh();
				return;
			}
			toast.error(result.error);
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				action={
					<Button onClick={openCreate} type="button">
						Nova barbearia
					</Button>
				}
				description="Todos os tenants da plataforma."
				title="Barbearias"
			/>

			{tenants.length === 0 ? (
				<EmptyState
					description="Crie a primeira barbearia junto com o usuário proprietário."
					title="Nenhuma barbearia"
				>
					<Button onClick={openCreate} type="button">
						Nova barbearia
					</Button>
				</EmptyState>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Identificador</TableHead>
							<TableHead>Membros</TableHead>
							<TableHead>Catálogo</TableHead>
							<TableHead>Conversas</TableHead>
							<TableHead>WhatsApp</TableHead>
							<TableHead>Criada em</TableHead>
							<TableHead className="w-0" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{tenants.map((tenant) => (
							<TableRow key={tenant.id}>
								<TableCell className="font-medium">{tenant.name}</TableCell>
								<TableCell className="font-mono text-xs">
									{tenant.slug}
								</TableCell>
								<TableCell>{tenant.members}</TableCell>
								<TableCell>
									{tenant.services} serviços · {tenant.professionals}{" "}
									profissionais
								</TableCell>
								<TableCell>{tenant.conversations}</TableCell>
								<TableCell>
									<Badge
										variant={
											tenant.phoneNumberIds.length > 0 ? "secondary" : "outline"
										}
									>
										{tenant.phoneNumberIds.length > 0
											? tenant.phoneNumberIds.join(", ")
											: "não conectado"}
									</Badge>
								</TableCell>
								<TableCell>{formatDate(tenant.createdAt)}</TableCell>
								<TableCell>
									<div className="flex justify-end">
										<Button asChild size="sm" variant="ghost">
											<Link href={`/admin/barbearias/${tenant.id}`}>Abrir</Link>
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

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
		</div>
	);
}
