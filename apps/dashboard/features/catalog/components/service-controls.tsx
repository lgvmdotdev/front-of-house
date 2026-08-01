"use client";

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
import { type FormEvent, useState } from "react";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { centsToInput, formatCents, inputToCents } from "@/lib/format";
import { useAction } from "@/lib/use-action";
import { deleteServiceAction, saveServiceAction } from "../catalog-actions";
import type { ServiceRecord } from "../catalog-queries";

/**
 * The interactive leaves of the services screen. Everything around them —
 * the page, the table, the rows — stays on the server; only these ship.
 *
 * Each row owns its own dialog instance rather than the table hoisting one
 * shared "editing" record. Its initial state is just props, which is what let
 * the surrounding table become a server component.
 */

const DEFAULT_DURATION = "30";
const DEFAULT_PRICE = "0.00";

export function ServiceDialog({ service }: { service?: ServiceRecord }) {
	const { pending, run } = useAction();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(service?.name ?? "");
	const [duration, setDuration] = useState(
		service ? String(service.durationMinutes) : DEFAULT_DURATION
	);
	const [price, setPrice] = useState(
		service ? centsToInput(service.priceCents) : DEFAULT_PRICE
	);
	const [active, setActive] = useState(service?.active ?? true);

	// Reopening after a save should show the row as the server now has it, not
	// whatever was typed last time.
	function openDialog() {
		setName(service?.name ?? "");
		setDuration(service ? String(service.durationMinutes) : DEFAULT_DURATION);
		setPrice(service ? centsToInput(service.priceCents) : DEFAULT_PRICE);
		setActive(service?.active ?? true);
		setOpen(true);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		run(
			() =>
				saveServiceAction({
					id: service?.id,
					name,
					durationMinutes: Number(duration),
					priceCents: inputToCents(price),
					active,
				}),
			"Serviço salvo",
			() => setOpen(false)
		);
	}

	return (
		<>
			<Button
				onClick={openDialog}
				size={service ? "sm" : "default"}
				type="button"
				variant={service ? "ghost" : "default"}
			>
				{service ? "Editar" : "Novo serviço"}
			</Button>
			<Dialog onOpenChange={setOpen} open={open}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{service ? "Editar serviço" : "Novo serviço"}
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
		</>
	);
}

export function DeleteServiceButton({ service }: { service: ServiceRecord }) {
	const { pending, run } = useAction();

	return (
		<ConfirmButton
			confirmLabel="Remover serviço"
			description={`"${service.name}" (${formatCents(service.priceCents)}) deixará de ser oferecido pela recepcionista. Profissionais vinculados perdem esse serviço.`}
			disabled={pending}
			label="Remover"
			onConfirm={() =>
				run(() => deleteServiceAction(service.id), "Serviço removido")
			}
			title="Remover serviço?"
		/>
	);
}
