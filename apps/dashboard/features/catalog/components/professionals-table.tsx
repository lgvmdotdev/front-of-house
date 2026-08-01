import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { requireActiveOrg } from "@/lib/session";
import { listProfessionals, listServices } from "../catalog-queries";
import {
	sortWindows,
	type WorkingWindow,
	weekdayLabel,
} from "../working-hours";
import {
	DeleteProfessionalButton,
	ProfessionalDialog,
} from "./professional-controls";

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

export async function ProfessionalsTable() {
	const { organizationId } = await requireActiveOrg();
	const [professionals, services] = await Promise.all([
		listProfessionals(organizationId),
		listServices(organizationId),
	]);

	if (professionals.length === 0) {
		return (
			<EmptyState
				description="Cadastre os barbeiros para a recepcionista saber quem pode atender cada serviço."
				title="Nenhum profissional cadastrado"
			>
				<ProfessionalDialog services={services} />
			</EmptyState>
		);
	}

	const serviceNames = new Map(
		services.map((service) => [service.id, service.name])
	);

	return (
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
							<Badge variant={professional.active ? "secondary" : "outline"}>
								{professional.active ? "Ativo" : "Inativo"}
							</Badge>
						</TableCell>
						<TableCell className="align-top">
							<div className="flex justify-end gap-2">
								<ProfessionalDialog
									professional={professional}
									services={services}
								/>
								<DeleteProfessionalButton professional={professional} />
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export function ProfessionalsTableSkeleton() {
	return <TableSkeleton columns={5} />;
}

/**
 * The page header's create button. Its own component — and its own Suspense
 * boundary — because the dialog needs the service list, and the page should not
 * wait for that read to paint its heading. The placeholder keeps the header's
 * height stable while it resolves; `listServices` is `cache()`d, so this shares
 * the table's query instead of adding one.
 */
export async function NewProfessionalButton() {
	const { organizationId } = await requireActiveOrg();
	const services = await listServices(organizationId);
	return <ProfessionalDialog services={services} />;
}

export function NewProfessionalButtonSkeleton() {
	return (
		<Button disabled type="button">
			Novo profissional
		</Button>
	);
}
