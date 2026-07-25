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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth";

export function SignupForm() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [pending, setPending] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setPending(true);
		const { error } = await authClient.signUp.email({ name, email, password });
		setPending(false);
		if (error) {
			toast.error(error.message ?? "Não foi possível criar a conta.");
			return;
		}
		// New users have no barbershop yet — send them to onboarding.
		router.push("/onboarding");
		router.refresh();
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Criar conta</CardTitle>
				<CardDescription>
					Comece a configurar a recepcionista da sua barbearia.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<div className="flex flex-col gap-2">
						<Label htmlFor="name">Seu nome</Label>
						<Input
							autoComplete="name"
							id="name"
							onChange={(event) => setName(event.target.value)}
							required
							value={name}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="email">E-mail</Label>
						<Input
							autoComplete="email"
							id="email"
							onChange={(event) => setEmail(event.target.value)}
							required
							type="email"
							value={email}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="password">Senha</Label>
						<Input
							autoComplete="new-password"
							id="password"
							minLength={8}
							onChange={(event) => setPassword(event.target.value)}
							required
							type="password"
							value={password}
						/>
					</div>
					<Button className="mt-2" disabled={pending} type="submit">
						{pending ? "Criando..." : "Criar conta"}
					</Button>
				</form>
				<p className="mt-4 text-muted-foreground text-sm">
					Já tem conta?{" "}
					<Link className="text-foreground underline" href="/login">
						Entrar
					</Link>
				</p>
			</CardContent>
		</Card>
	);
}
