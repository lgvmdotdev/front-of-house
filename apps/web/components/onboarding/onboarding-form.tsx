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
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth";

const DIACRITICS = /[̀-ͯ]/g;
const NON_SLUG_CHARS = /[^a-z0-9]+/g;
const TRIM_DASHES = /^-+|-+$/g;
const SLUG_SUFFIX_BASE = 36;
const SLUG_SUFFIX_START = 2;
const SLUG_SUFFIX_END = 8;

function slugify(value: string): string {
	const base = value
		.toLowerCase()
		.normalize("NFD")
		.replace(DIACRITICS, "")
		.replace(NON_SLUG_CHARS, "-")
		.replace(TRIM_DASHES, "");
	const suffix = Math.random()
		.toString(SLUG_SUFFIX_BASE)
		.slice(SLUG_SUFFIX_START, SLUG_SUFFIX_END);
	return `${base || "barbearia"}-${suffix}`;
}

export function OnboardingForm() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [pending, setPending] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setPending(true);
		const created = await authClient.organization.create({
			name,
			slug: slugify(name),
		});
		if (created.error) {
			setPending(false);
			toast.error(
				created.error.message ?? "Não foi possível criar a barbearia."
			);
			return;
		}
		await authClient.organization.setActive({
			organizationId: created.data.id,
		});
		router.push("/dashboard");
		router.refresh();
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Sua barbearia</CardTitle>
				<CardDescription>
					Dê um nome à barbearia para criar o painel.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<div className="flex flex-col gap-2">
						<Label htmlFor="name">Nome da barbearia</Label>
						<Input
							id="name"
							onChange={(event) => setName(event.target.value)}
							placeholder="Barbearia do Felipe"
							required
							value={name}
						/>
					</div>
					<Button className="mt-2" disabled={pending} type="submit">
						{pending ? "Criando..." : "Criar barbearia"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
