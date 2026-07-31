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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveIntegrationAction } from "@/app/(app)/_actions/settings";
import { formatUtcOffset } from "@/lib/format";
import { BOOKING_PROVIDERS } from "@/lib/settings-schema";
import type { IntegrationRecord } from "@/lib/tenant";

const DEFAULT_OFFSET_MINUTES = -180;

export function IntegrationForm({
	integration,
}: {
	integration: IntegrationRecord | null;
}) {
	const router = useRouter();
	const [provider, setProvider] = useState(integration?.provider ?? "calendar");
	const [spreadsheetId, setSpreadsheetId] = useState(
		integration?.spreadsheetId ?? ""
	);
	const [offsetMinutes, setOffsetMinutes] = useState(
		String(integration?.offsetMinutes ?? DEFAULT_OFFSET_MINUTES)
	);
	const [pending, startTransition] = useTransition();

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		startTransition(async () => {
			const result = await saveIntegrationAction({
				provider,
				spreadsheetId,
				offsetMinutes: Number(offsetMinutes),
			});
			if (result.ok) {
				router.refresh();
				toast.success("Integração salva");
				return;
			}
			toast.error(result.error);
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Agenda da barbearia</CardTitle>
				<CardDescription>
					Onde a recepcionista lê a disponibilidade e grava os agendamentos. Sua
					barbearia continua usando a ferramenta de sempre.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<div className="flex flex-col gap-2">
						<Label htmlFor="integration-provider">Provedor</Label>
						<Select onValueChange={setProvider} value={provider}>
							<SelectTrigger className="w-full" id="integration-provider">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{BOOKING_PROVIDERS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					{provider === "sheets" ? (
						<div className="flex flex-col gap-2">
							<Label htmlFor="integration-spreadsheet">ID da planilha</Label>
							<Input
								id="integration-spreadsheet"
								onChange={(event) => setSpreadsheetId(event.target.value)}
								placeholder="1AbCdEfGhIjKlMnOpQrStUvWxYz"
								required
								value={spreadsheetId}
							/>
							<p className="text-muted-foreground text-xs">
								O trecho entre <code>/d/</code> e <code>/edit</code> na URL da
								planilha.
							</p>
						</div>
					) : (
						<p className="text-muted-foreground text-sm">
							Com o Google Agenda, cada profissional agenda na agenda informada
							no cadastro de profissionais.
						</p>
					)}

					<div className="flex flex-col gap-2">
						<Label htmlFor="integration-offset">
							Fuso horário (minutos em relação ao UTC)
						</Label>
						<Input
							id="integration-offset"
							max={1440}
							min={-1440}
							onChange={(event) => setOffsetMinutes(event.target.value)}
							required
							step={15}
							type="number"
							value={offsetMinutes}
						/>
						<p className="text-muted-foreground text-xs">
							{formatUtcOffset(Number(offsetMinutes) || 0)} — Brasília é −180.
						</p>
					</div>

					<Button className="self-start" disabled={pending} type="submit">
						{pending ? "Salvando..." : "Salvar integração"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
