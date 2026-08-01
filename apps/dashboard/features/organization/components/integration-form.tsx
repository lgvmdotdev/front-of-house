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
import { type FormEvent, useEffect, useState } from "react";
import { formatUtcOffset } from "@/lib/format";
import { useAction } from "@/lib/use-action";
import { saveIntegrationAction } from "../organization-actions";
import type { IntegrationRecord } from "../organization-queries";
import {
	BOOKING_PROVIDERS,
	TIME_ZONES,
	timeZoneForOffset,
	timeZoneOffsetMinutes,
} from "../organization-schema";

export function IntegrationForm({
	integration,
}: {
	integration: IntegrationRecord | null;
}) {
	const { pending, run } = useAction();
	const [provider, setProvider] = useState(integration?.provider ?? "calendar");
	const [spreadsheetId, setSpreadsheetId] = useState(
		integration?.spreadsheetId ?? ""
	);
	const [timeZone, setTimeZone] = useState(
		timeZoneForOffset(integration?.offsetMinutes)
	);

	// Shops that never saved an integration get their browser's zone. Set after
	// mount so the server render (server's own zone) doesn't mismatch hydration.
	useEffect(() => {
		if (integration) {
			return;
		}
		const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		if (TIME_ZONES.some((option) => option.value === browserZone)) {
			setTimeZone(browserZone);
		}
	}, [integration]);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		run(
			() =>
				saveIntegrationAction({
					provider,
					spreadsheetId,
					offsetMinutes: timeZoneOffsetMinutes(timeZone),
				}),
			"Integração salva"
		);
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
						<Label htmlFor="integration-timezone">Fuso horário</Label>
						<Select onValueChange={setTimeZone} value={timeZone}>
							<SelectTrigger className="w-full" id="integration-timezone">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{TIME_ZONES.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label} ({formatUtcOffset(option.offset)})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-muted-foreground text-xs">
							Horário usado para ler a agenda e marcar os agendamentos.
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
