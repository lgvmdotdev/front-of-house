import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Sem barbearia · Recepcionai",
};

/**
 * Reached when a signed-in user belongs to no organization. Tenants are created
 * by the Recepcionai team during onboarding, so there is nothing self-serve to
 * offer here.
 */
export default function SemBarbeariaPage() {
	return (
		<main className="flex min-h-svh items-center justify-center p-6">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Sua conta ainda não tem barbearia</CardTitle>
					<CardDescription>
						O acesso ao painel é liberado quando a equipe Recepcionai conclui a
						configuração da sua barbearia.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild variant="outline">
						<a href="mailto:contato@recepcionai.com.br">Falar com a equipe</a>
					</Button>
				</CardContent>
			</Card>
		</main>
	);
}
