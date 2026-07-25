"use client";

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
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	deleteServiceAction,
	saveServiceAction,
} from "@/app/(dashboard)/dashboard/_actions/catalog";
import type { ServiceRecord } from "@/lib/catalog";

const CENTS_PER_REAL = 100;

const currency = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

export function ServicesManager({ services }: { services: ServiceRecord[] }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState<ServiceRecord | null>(null);
	const [name, setName] = useState("");
	const [duration, setDuration] = useState("");
	const [price, setPrice] = useState("");
	const [pending, startTransition] = useTransition();

	function openCreate() {
		setEditing(null);
		setName("");
		setDuration("");
		setPrice("");
		setOpen(true);
	}

	function openEdit(service: ServiceRecord) {
		setEditing(service);
		setName(service.name);
		setDuration(String(service.durationMinutes));
		setPrice((service.priceCents / CENTS_PER_REAL).toFixed(2));
		setOpen(true);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		startTransition(async () => {
			const result = await saveServiceAction({
				id: editing?.id,
				name,
				durationMinutes: Number(duration),
				priceCents: Math.round(Number(price) * CENTS_PER_REAL),
			});
			if (result.ok) {
				setOpen(false);
				router.refresh();
				toast.success("Serviço salvo");
			} else {
				toast.error(result.error);
			}
		});
	}

	function handleDelete(service: ServiceRecord) {
		startTransition(async () => {
			const result = await deleteServiceAction(service.id);
			if (result.ok) {
				router.refresh();
				toast.success("Serviço removido");
			} else {
				toast.error(result.error);
			}
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl">Serviços</h1>
					<p className="text-muted-foreground">
						Os serviços que a recepcionista pode agendar.
					</p>
				</div>
				<Button onClick={openCreate} type="button">
					Novo serviço
				</Button>
			</div>

			{services.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					Nenhum serviço cadastrado ainda.
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Duração</TableHead>
							<TableHead>Preço</TableHead>
							<TableHead className="w-0" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{services.map((service) => (
							<TableRow key={service.id}>
								<TableCell className="font-medium">{service.name}</TableCell>
								<TableCell>{service.durationMinutes} min</TableCell>
								<TableCell>
									{currency.format(service.priceCents / CENTS_PER_REAL)}
								</TableCell>
								<TableCell className="flex justify-end gap-2">
									<Button
										onClick={() => openEdit(service)}
										size="sm"
										type="button"
										variant="ghost"
									>
										Editar
									</Button>
									<Button
										disabled={pending}
										onClick={() => handleDelete(service)}
										size="sm"
										type="button"
										variant="ghost"
									>
										Remover
									</Button>
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
								id="service-name"
								onChange={(event) => setName(event.target.value)}
								required
								value={name}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="service-duration">Duração (minutos)</Label>
							<Input
								id="service-duration"
								min={1}
								onChange={(event) => setDuration(event.target.value)}
								required
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
