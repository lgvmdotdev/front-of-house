"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
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
import { type FormEvent, useState } from "react";
import {
	deleteServiceAction,
	saveServiceAction,
} from "@/app/(app)/_actions/catalog";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
import type { ServiceRecord } from "@/lib/catalog";
import { centsToInput, formatCents, inputToCents } from "@/lib/format";
import { useAction } from "@/lib/use-action";

export function ServicesManager({ services }: { services: ServiceRecord[] }) {
	const { pending, run } = useAction();
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState<ServiceRecord | null>(null);
	const [name, setName] = useState("");
	const [duration, setDuration] = useState("");
	const [price, setPrice] = useState("");
	const [active, setActive] = useState(true);

	function openCreate() {
		setEditing(null);
		setName("");
		setDuration("30");
		setPrice("0.00");
		setActive(true);
		setOpen(true);
	}

	function openEdit(service: ServiceRecord) {
		setEditing(service);
		setName(service.name);
		setDuration(String(service.durationMinutes));
		setPrice(centsToInput(service.priceCents));
		setActive(service.active);
		setOpen(true);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		run(
			() =>
				saveServiceAction({
					id: editing?.id,
					name,
					durationMinutes: Number(duration),
					priceCents: inputToCents(price),
					active,
				}),
			"Serviço salvo",
			() => setOpen(false)
		);
	}

	function handleDelete(service: ServiceRecord) {
		run(() => deleteServiceAction(service.id), "Serviço removido");
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				action={
					<Button onClick={openCreate} type="button">
						Novo serviço
					</Button>
				}
				description="O que a recepcionista pode oferecer e agendar no WhatsApp."
				title="Serviços"
			/>

			{services.length === 0 ? (
				<EmptyState
					description="Cadastre o primeiro serviço para a recepcionista começar a agendar."
					title="Nenhum serviço cadastrado"
				>
					<Button onClick={openCreate} type="button">
						Novo serviço
					</Button>
				</EmptyState>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Duração</TableHead>
							<TableHead>Preço</TableHead>
							<TableHead>Situação</TableHead>
							<TableHead className="w-0" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{services.map((service) => (
							<TableRow key={service.id}>
								<TableCell className="font-medium">{service.name}</TableCell>
								<TableCell>{service.durationMinutes} min</TableCell>
								<TableCell>{formatCents(service.priceCents)}</TableCell>
								<TableCell>
									<Badge variant={service.active ? "secondary" : "outline"}>
										{service.active ? "Ativo" : "Inativo"}
									</Badge>
								</TableCell>
								<TableCell>
									<div className="flex justify-end gap-2">
										<Button
											disabled={pending}
											onClick={() => openEdit(service)}
											size="sm"
											type="button"
											variant="ghost"
										>
											Editar
										</Button>
										<ConfirmButton
											confirmLabel="Remover serviço"
											description={`"${service.name}" deixará de ser oferecido pela recepcionista. Profissionais vinculados perdem esse serviço.`}
											disabled={pending}
											label="Remover"
											onConfirm={() => handleDelete(service)}
											title="Remover serviço?"
										/>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			<Dialog onOpenChange={setOpen} open={open}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editing ? "Editar serviço" : "Novo serviço"}
						</DialogTitle>
						<DialogDescription>
							Nome, duração e preço do serviço.
						</DialogDescription>
					</DialogHeader>
					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						<div className="flex flex-col gap-2">
							<Label htmlFor="service-name">Nome</Label>
							<Input
								autoFocus
								id="service-name"
								onChange={(event) => setName(event.target.value)}
								required
								value={name}
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2">
								<Label htmlFor="service-duration">Duração (minutos)</Label>
								<Input
									id="service-duration"
									max={1440}
									min={1}
									onChange={(event) => setDuration(event.target.value)}
									required
									step={1}
									type="number"
									value={duration}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="service-price">Preço (R$)</Label>
								<Input
									id="service-price"
									min={0}
									onChange={(event) => setPrice(event.target.value)}
									required
									step="0.01"
									type="number"
									value={price}
								/>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox
								checked={active}
								id="service-active"
								onCheckedChange={(checked) => setActive(checked === true)}
							/>
							<Label htmlFor="service-active">
								Ativo (a recepcionista pode oferecer)
							</Label>
						</div>
						<DialogFooter>
							<Button disabled={pending} type="submit">
								{pending ? "Salvando..." : "Salvar"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
