import { Badge } from "@workspace/ui/components/badge";
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
import { formatCents } from "@/lib/format";
import { requireActiveOrg } from "@/lib/session";
import { listServices } from "../catalog-queries";
import { DeleteServiceButton, ServiceDialog } from "./service-controls";

/**
 * Owns its own read, so `/servicos` is free to paint its header and "novo
 * serviço" button before the database answers. The page places the Suspense
 * boundary; this file supplies the skeleton for it.
 */
export async function ServicesTable() {
	const { organizationId } = await requireActiveOrg();
	const services = await listServices(organizationId);

	if (services.length === 0) {
		return (
			<EmptyState
				description="Cadastre o primeiro serviço para a recepcionista começar a agendar."
				title="Nenhum serviço cadastrado"
			>
				<ServiceDialog />
			</EmptyState>
		);
	}

	return (
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
								<ServiceDialog service={service} />
								<DeleteServiceButton service={service} />
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export function ServicesTableSkeleton() {
	return <TableSkeleton columns={5} />;
}
