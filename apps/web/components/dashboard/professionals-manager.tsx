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
import { cn } from "@workspace/ui/lib/utils";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	deleteProfessionalAction,
	saveProfessionalAction,
} from "@/app/(dashboard)/dashboard/_actions/catalog";
import type { ProfessionalRecord, ServiceRecord } from "@/lib/catalog";

const WEEKDAYS = [
	{ value: 0, label: "Dom" },
	{ value: 1, label: "Seg" },
	{ value: 2, label: "Ter" },
	{ value: 3, label: "Qua" },
	{ value: 4, label: "Qui" },
	{ value: 5, label: "Sex" },
	{ value: 6, label: "Sáb" },
] as const;

interface HourRow {
	end: string;
	start: string;
	weekday: number;
}

export function ProfessionalsManager({
	professionals,
	services,
}: {
	professionals: ProfessionalRecord[];
	services: ServiceRecord[];
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState<ProfessionalRecord | null>(null);
	const [name, setName] = useState("");
	const [calendarId, setCalendarId] = useState("");
	const [serviceIds, setServiceIds] = useState<string[]>([]);
	const [hours, setHours] = useState<HourRow[]>([]);
	const [pending, startTransition] = useTransition();

	const serviceName = (id: string) =>
		services.find((service) => service.id === id)?.name ?? id;

	function openCreate() {
		setEditing(null);
		setName("");
		setCalendarId("");
		setServiceIds([]);
		setHours([]);
		setOpen(true);
	}

	function openEdit(professional: ProfessionalRecord) {
		setEditing(professional);
		setName(professional.name);
		setCalendarId(professional.calendarId ?? "");
		setServiceIds(professional.serviceIds);
		setHours(
			professional.workingHours.map((entry) => ({
				weekday: entry.weekday,
				start: entry.start,
				end: entry.end,
			}))
		);
		setOpen(true);
	}

	function toggleService(id: string) {
		setServiceIds((current) =>
			current.includes(id)
				? current.filter((value) => value !== id)
				: [...current, id]
		);
	}

	function addHour() {
		setHours((current) => [
			...current,
			{ weekday: 1, start: "09:00", end: "18:00" },
		]);
	}

	function updateHour(index: number, patch: Partial<HourRow>) {
		setHours((current) =>
			current.map((row, rowIndex) =>
				rowIndex === index ? { ...row, ...patch } : row
			)
		);
	}

	function removeHour(index: number) {
		setHours((current) => current.filter((_, rowIndex) => rowIndex !== index));
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		startTransition(async () => {
			const result = await saveProfessionalAction({
				id: editing?.id,
				name,
				serviceIds,
				workingHours: hours,
				calendarId: calendarId.trim() || undefined,
			});
			if (result.ok) {
				setOpen(false);
				router.refresh();
				toast.success("Profissional salvo");
			} else {
				toast.error(result.error);
			}
		});
	}

	function handleDelete(professional: ProfessionalRecord) {
		startTransition(async () => {
			const result = await deleteProfessionalAction(professional.id);
			if (result.ok) {
				router.refresh();
				toast.success("Profissional removido");
			} else {
				toast.error(result.error);
			}
		});
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl">Profissionais</h1>
					<p className="text-muted-foreground">
						Os barbeiros, os serviços que fazem e seus horários.
					</p>
				</div>
				<Button onClick={openCreate} type="button">
					Novo profissional
				</Button>
			</div>

			{professionals.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					Nenhum profissional cadastrado ainda.
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Serviços</TableHead>
							<TableHead>Horários</TableHead>
							<TableHead className="w-0" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{professionals.map((professional) => (
							<TableRow key={professional.id}>
								<TableCell className="font-medium">
									{professional.name}
								</TableCell>
								<TableCell>
									{professional.serviceIds.length === 0
										? "—"
										: professional.serviceIds.map(serviceName).join(", ")}
								</TableCell>
								<TableCell>
									{professional.workingHours.length} janela(s)
								</TableCell>
								<TableCell className="flex justify-end gap-2">
									<Button
										onClick={() => openEdit(professional)}
										size="sm"
										type="button"
										variant="ghost"
									>
										Editar
									</Button>
									<Button
										disabled={pending}
										onClick={() => handleDelete(professional)}
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
				<DialogContent className="max-h-[90svh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editing ? "Editar profissional" : "Novo profissional"}
						</DialogTitle>
						<DialogDescription>
							Nome, serviços que realiza e horários de trabalho.
						</DialogDescription>
					</DialogHeader>
					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						<div className="flex flex-col gap-2">
							<Label htmlFor="pro-name">Nome</Label>
							<Input
								id="pro-name"
								onChange={(event) => setName(event.target.value)}
								required
								value={name}
							/>
						</div>

						<fieldset className="flex flex-col gap-2">
							<legend className="font-medium text-sm">Serviços</legend>
							{services.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									Cadastre serviços primeiro.
								</p>
							) : (
								<div className="flex flex-wrap gap-2">
									{services.map((service) => {
										const checked = serviceIds.includes(service.id);
										return (
											<button
												className={cn(
													"rounded-md border px-3 py-1 text-sm",
													checked
														? "border-ring bg-accent text-accent-foreground"
														: "border-input"
												)}
												key={service.id}
												onClick={() => toggleService(service.id)}
												type="button"
											>
												{service.name}
											</button>
										);
									})}
								</div>
							)}
						</fieldset>

						<fieldset className="flex flex-col gap-2">
							<div className="flex items-center justify-between">
								<legend className="font-medium text-sm">Horários</legend>
								<Button
									onClick={addHour}
									size="sm"
									type="button"
									variant="outline"
								>
									Adicionar
								</Button>
							</div>
							{hours.map((row, index) => (
								<div
									className="flex items-center gap-2"
									// biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and editable
									key={index}
								>
									<select
										className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
										onChange={(event) =>
											updateHour(index, { weekday: Number(event.target.value) })
										}
										value={row.weekday}
									>
										{WEEKDAYS.map((day) => (
											<option key={day.value} value={day.value}>
												{day.label}
											</option>
										))}
									</select>
									<Input
										aria-label="Início"
										onChange={(event) =>
											updateHour(index, { start: event.target.value })
										}
										type="time"
										value={row.start}
									/>
									<Input
										aria-label="Fim"
										onChange={(event) =>
											updateHour(index, { end: event.target.value })
										}
										type="time"
										value={row.end}
									/>
									<Button
										onClick={() => removeHour(index)}
										size="sm"
										type="button"
										variant="ghost"
									>
										×
									</Button>
								</div>
							))}
						</fieldset>

						<div className="flex flex-col gap-2">
							<Label htmlFor="pro-calendar">
								ID do Google Agenda (opcional)
							</Label>
							<Input
								id="pro-calendar"
								onChange={(event) => setCalendarId(event.target.value)}
								placeholder="barbeiro@gmail.com"
								value={calendarId}
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
