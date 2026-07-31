"use client";

import { RiAddLine, RiCloseLine } from "@remixicon/react";
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
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
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
	deleteProfessionalAction,
	saveProfessionalAction,
} from "@/app/(app)/_actions/catalog";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProfessionalRecord, ServiceRecord } from "@/lib/catalog";
import { useAction } from "@/lib/use-action";
import {
	sortWindows,
	WEEKDAYS,
	type WorkingWindow,
	weekdayLabel,
} from "@/lib/working-hours";

const DEFAULT_WINDOW: WorkingWindow = {
	weekday: 1,
	start: "09:00",
	end: "18:00",
};

/** Groups a professional's windows by weekday for the read-only table cell. */
function summariseHours(windows: WorkingWindow[]): string[] {
	const byWeekday = new Map<number, string[]>();
	for (const window of sortWindows(windows)) {
		const existing = byWeekday.get(window.weekday) ?? [];
		existing.push(`${window.start}–${window.end}`);
		byWeekday.set(window.weekday, existing);
	}
	return [...byWeekday.entries()].map(
		([weekday, ranges]) => `${weekdayLabel(weekday)}: ${ranges.join(", ")}`
	);
}

export function ProfessionalsManager({
	professionals,
	services,
}: {
	professionals: ProfessionalRecord[];
	services: ServiceRecord[];
}) {
	const { pending, run } = useAction();
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState<ProfessionalRecord | null>(null);
	const [name, setName] = useState("");
	const [calendarId, setCalendarId] = useState("");
	const [active, setActive] = useState(true);
	const [serviceIds, setServiceIds] = useState<string[]>([]);
	const [windows, setWindows] = useState<WorkingWindow[]>([]);

	function openCreate() {
		setEditing(null);
		setName("");
		setCalendarId("");
		setActive(true);
		setServiceIds([]);
		setWindows([DEFAULT_WINDOW]);
		setOpen(true);
	}

	function openEdit(professional: ProfessionalRecord) {
		setEditing(professional);
		setName(professional.name);
		setCalendarId(professional.calendarId ?? "");
		setActive(professional.active);
		setServiceIds(professional.serviceIds);
		setWindows(
			professional.workingHours.map((hours) => ({
				weekday: hours.weekday,
				start: hours.start,
				end: hours.end,
			}))
		);
		setOpen(true);
	}

	function toggleService(serviceId: string, checked: boolean) {
		setServiceIds((current) =>
			checked
				? [...current, serviceId]
				: current.filter((id) => id !== serviceId)
		);
	}

	function updateWindow(index: number, patch: Partial<WorkingWindow>) {
		setWindows((current) =>
			current.map((window, position) =>
				position === index ? { ...window, ...patch } : window
			)
		);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		run(
			() =>
				saveProfessionalAction({
					id: editing?.id,
					name,
					calendarId,
					active,
					serviceIds,
					workingHours: windows,
				}),
			"Profissional salvo",
			() => setOpen(false)
		);
	}

	function handleDelete(professional: ProfessionalRecord) {
		run(
			() => deleteProfessionalAction(professional.id),
			"Profissional removido"
		);
	}

	const serviceNames = new Map(
		services.map((service) => [service.id, service.name])
	);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				action={
					<Button onClick={openCreate} type="button">
						Novo profissional
					</Button>
				}
				description="Quem atende, quais serviços faz e em que horários."
				title="Profissionais"
			/>

			{professionals.length === 0 ? (
				<EmptyState
					description="Cadastre os barbeiros para a recepcionista saber quem pode atender cada serviço."
					title="Nenhum profissional cadastrado"
				>
					<Button onClick={openCreate} type="button">
						Novo profissional
					</Button>
				</EmptyState>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Serviços</TableHead>
							<TableHead>Horários</TableHead>
							<TableHead>Situação</TableHead>
							<TableHead className="w-0" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{professionals.map((professional) => (
							<TableRow key={professional.id}>
								<TableCell className="align-top font-medium">
									{professional.name}
									{professional.calendarId ? (
										<span className="block font-normal text-muted-foreground text-xs">
											{professional.calendarId}
										</span>
									) : null}
								</TableCell>
								<TableCell className="whitespace-normal align-top">
									{professional.serviceIds.length === 0 ? (
										<span className="text-muted-foreground">—</span>
									) : (
										<span className="flex flex-wrap gap-1">
											{professional.serviceIds.map((serviceId) => (
												<Badge key={serviceId} variant="outline">
													{serviceNames.get(serviceId) ?? serviceId}
												</Badge>
											))}
										</span>
									)}
								</TableCell>
								<TableCell className="whitespace-normal align-top text-muted-foreground text-xs">
									{professional.workingHours.length === 0 ? (
										<span className="text-muted-foreground">—</span>
									) : (
										summariseHours(professional.workingHours).map((line) => (
											<span className="block" key={line}>
												{line}
											</span>
										))
									)}
								</TableCell>
								<TableCell className="align-top">
									<Badge
										variant={professional.active ? "secondary" : "outline"}
									>
										{professional.active ? "Ativo" : "Inativo"}
									</Badge>
								</TableCell>
								<TableCell className="align-top">
									<div className="flex justify-end gap-2">
										<Button
											disabled={pending}
											onClick={() => openEdit(professional)}
											size="sm"
											type="button"
											variant="ghost"
										>
											Editar
										</Button>
										<ConfirmButton
											confirmLabel="Remover profissional"
											description={`${professional.name} e seus horários serão removidos. A recepcionista deixa de oferecer agenda com ele.`}
											disabled={pending}
											label="Remover"
											onConfirm={() => handleDelete(professional)}
											title="Remover profissional?"
										/>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			<Dialog onOpenChange={setOpen} open={open}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{editing ? "Editar profissional" : "Novo profissional"}
						</DialogTitle>
						<DialogDescription>
							Serviços que atende e janelas de trabalho da semana. Vários
							horários no mesmo dia formam um turno partido.
						</DialogDescription>
					</DialogHeader>
					<form
						className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto"
						onSubmit={handleSubmit}
					>
						<div className="flex flex-col gap-2">
							<Label htmlFor="professional-name">Nome</Label>
							<Input
								autoFocus
								id="professional-name"
								onChange={(event) => setName(event.target.value)}
								required
								value={name}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="professional-calendar">
								ID da agenda (Google Agenda, opcional)
							</Label>
							<Input
								id="professional-calendar"
								onChange={(event) => setCalendarId(event.target.value)}
								placeholder="felipe@barbearia.com"
								value={calendarId}
							/>
						</div>

						<fieldset className="flex flex-col gap-2">
							<legend className="font-medium text-sm">Serviços</legend>
							{services.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									Cadastre serviços antes de vinculá-los.
								</p>
							) : (
								<div className="grid gap-2 sm:grid-cols-2">
									{services.map((service) => (
										<div className="flex items-center gap-2" key={service.id}>
											<Checkbox
												checked={serviceIds.includes(service.id)}
												id={`service-${service.id}`}
												onCheckedChange={(checked) =>
													toggleService(service.id, checked === true)
												}
											/>
											<Label htmlFor={`service-${service.id}`}>
												{service.name}
											</Label>
										</div>
									))}
								</div>
							)}
						</fieldset>

						<fieldset className="flex flex-col gap-2">
							<legend className="font-medium text-sm">
								Horários de trabalho
							</legend>
							{windows.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									Sem horários — a recepcionista não oferecerá agenda com este
									profissional.
								</p>
							) : null}
							{windows.map((window, index) => (
								<div
									className="flex flex-wrap items-end gap-2"
									// biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and freely reordered by the user
									key={index}
								>
									<div className="flex flex-col gap-1">
										<Label
											className="text-xs"
											htmlFor={`window-weekday-${index}`}
										>
											Dia
										</Label>
										<Select
											onValueChange={(value) =>
												updateWindow(index, { weekday: Number(value) })
											}
											value={String(window.weekday)}
										>
											<SelectTrigger
												className="w-32"
												id={`window-weekday-${index}`}
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{WEEKDAYS.map((weekday) => (
														<SelectItem
															key={weekday.value}
															value={String(weekday.value)}
														>
															{weekday.label}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									</div>
									<div className="flex flex-col gap-1">
										<Label
											className="text-xs"
											htmlFor={`window-start-${index}`}
										>
											Início
										</Label>
										<Input
											className="w-28"
											id={`window-start-${index}`}
											onChange={(event) =>
												updateWindow(index, { start: event.target.value })
											}
											required
											type="time"
											value={window.start}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label className="text-xs" htmlFor={`window-end-${index}`}>
											Fim
										</Label>
										<Input
											className="w-28"
											id={`window-end-${index}`}
											onChange={(event) =>
												updateWindow(index, { end: event.target.value })
											}
											required
											type="time"
											value={window.end}
										/>
									</div>
									<Button
										aria-label={`Remover horário ${index + 1}`}
										onClick={() =>
											setWindows((current) =>
												current.filter((_, position) => position !== index)
											)
										}
										size="icon-sm"
										type="button"
										variant="ghost"
									>
										<RiCloseLine aria-hidden size={16} />
									</Button>
								</div>
							))}
							<Button
								className="self-start"
								onClick={() =>
									setWindows((current) => [...current, DEFAULT_WINDOW])
								}
								size="sm"
								type="button"
								variant="outline"
							>
								<RiAddLine aria-hidden size={16} />
								Adicionar horário
							</Button>
						</fieldset>

						<div className="flex items-center gap-2">
							<Checkbox
								checked={active}
								id="professional-active"
								onCheckedChange={(checked) => setActive(checked === true)}
							/>
							<Label htmlFor="professional-active">
								Ativo (a recepcionista pode agendar com ele)
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
