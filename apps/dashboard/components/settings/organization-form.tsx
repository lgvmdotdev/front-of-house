"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveOrganizationAction } from "@/app/(app)/_actions/settings";
import type { OrganizationRecord } from "@/lib/tenant";

export function OrganizationForm({
	organization,
}: {
	organization: OrganizationRecord;
}) {
	const router = useRouter();
	const [name, setName] = useState(organization.name);
	const [slug, setSlug] = useState(organization.slug);
	const [logo, setLogo] = useState(organization.logo ?? "");
	const [pending, startTransition] = useTransition();

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		startTransition(async () => {
			const result = await saveOrganizationAction({ name, slug, logo });
			if (result.ok) {
				router.refresh();
				toast.success("Barbearia atualizada");
				return;
			}
			toast.error(result.error);
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Dados da barbearia</CardTitle>
				<CardDescription>
					Nome exibido no painel, identificador interno e logo.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<div className="flex flex-col gap-2">
						<Label htmlFor="org-name">Nome</Label>
						<Input
							id="org-name"
							onChange={(event) => setName(event.target.value)}
							required
							value={name}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="org-slug">Identificador</Label>
						<Input
							id="org-slug"
							onChange={(event) => setSlug(event.target.value)}
							required
							value={slug}
						/>
						<p className="text-muted-foreground text-xs">
							Letras minúsculas, números e hífens. Ex.: barbearia-demo.
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="org-logo">Logo (URL)</Label>
						<Input
							id="org-logo"
							onChange={(event) => setLogo(event.target.value)}
							placeholder="https://..."
							value={logo}
						/>
					</div>
					<Button className="self-start" disabled={pending} type="submit">
						{pending ? "Salvando..." : "Salvar"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
