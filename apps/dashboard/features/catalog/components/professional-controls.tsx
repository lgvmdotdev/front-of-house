"use client";

import { RiAddLine, RiCloseLine } from "@remixicon/react";
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
import { type FormEvent, useState } from "react";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useAction } from "@/lib/use-action";
import {
	deleteProfessionalAction,
	saveProfessionalAction,
} from "../catalog-actions";
import type { ProfessionalRecord, ServiceRecord } from "../catalog-queries";
import { WEEKDAYS, type WorkingWindow } from "../working-hours";

/**
 * The interactive leaves of the professionals screen. The table around them is a
 * server component; `services` arrives already read from the server because the
 * dialog needs the same list the table uses to label each row.
 */

const DEFAULT_WINDOW: WorkingWindow = {
	weekday: 1,
	start: "09:00",
	end: "18:00",
};

function toWindows(professional?: ProfessionalRecord): WorkingWindow[] {
	if (!professional) {
		return [DEFAULT_WINDOW];
	}
	return professional.workingHours.map((hours) => ({
		weekday: hours.weekday,
		start: hours.start,
		end: hours.end,
	}));
}

export function ProfessionalDialog({
	professional,
	services,
}: {
	professional?: ProfessionalRecord;
	services: ServiceRecord[];
}) {
	const { pending, run } = useAction();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(professional?.name ?? "");
	const [calendarId, setCalendarId] = useState(professional?.calendarId ?? "");
	const [active, setActive] = useState(professional?.active ?? true);
	const [serviceIds, setServiceIds] = useState<string[]>(
		professional?.serviceIds ?? []
	);
	const [windows, setWindows] = useState<WorkingWindow[]>(
		toWindows(professional)
	);

	function openDialog() {
		setName(professional?.name ?? "");
		setCalendarId(professional?.calendarId ?? "");
		setActive(professional?.active ?? true);
		setServiceIds(professional?.serviceIds ?? []);
		setWindows(toWindows(professional));
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
					id: professional?.id,
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

	return (
		<>
			<Button
				onClick={openDialog}
				size={professional ? "sm" : "default"}
				type="button"
				variant={professional ? "ghost" : "default"}
			>
				{professional ? "Editar" : "Novo profissional"}
			</Button>
			<Dialog onOpenChange={setOpen} open={open}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{professional ? "Editar profissional" : "Novo profissional"}
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
		</>
	);
}

export function DeleteProfessionalButton({
	professional,
}: {
	professional: ProfessionalRecord;
}) {
	const { pending, run } = useAction();

	return (
		<ConfirmButton
			confirmLabel="Remover profissional"
			description={`${professional.name} e seus horários serão removidos. A recepcionista deixa de oferecer agenda com ele.`}
			disabled={pending}
			label="Remover"
			onConfirm={() =>
				run(
					() => deleteProfessionalAction(professional.id),
					"Profissional removido"
				)
			}
			title="Remover profissional?"
		/>
	);
}
