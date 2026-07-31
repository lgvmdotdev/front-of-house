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
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [pending, setPending] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setPending(true);
		const { error } = await authClient.signIn.email({ email, password });
		setPending(false);
		if (error) {
			toast.error(error.message ?? "Não foi possível entrar.");
			return;
		}
		// The panel layout decides where this user belongs (tenant or admin).
		router.push("/painel");
		router.refresh();
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Entrar</CardTitle>
				<CardDescription>Acesse o painel da sua barbearia.</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
							autoComplete="current-password"
							id="password"
							onChange={(event) => setPassword(event.target.value)}
							required
							type="password"
							value={password}
						/>
					</div>
					<Button className="mt-2" disabled={pending} type="submit">
						{pending ? "Entrando..." : "Entrar"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
