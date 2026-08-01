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
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { formatDate } from "@/lib/format";
import { listTenants } from "../tenant-queries";
import { CreateTenantDialog } from "./create-tenant-dialog";

export async function TenantsTable() {
	const tenants = await listTenants();

	if (tenants.length === 0) {
		return (
			<EmptyState
				description="Crie a primeira barbearia junto com o usuário proprietário."
				title="Nenhuma barbearia"
			>
				<CreateTenantDialog />
			</EmptyState>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Nome</TableHead>
					<TableHead>Identificador</TableHead>
					<TableHead>Membros</TableHead>
					<TableHead>Catálogo</TableHead>
					<TableHead>Conversas</TableHead>
					<TableHead>WhatsApp</TableHead>
					<TableHead>Criada em</TableHead>
					<TableHead className="w-0" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{tenants.map((tenant) => (
					<TableRow key={tenant.id}>
						<TableCell className="font-medium">{tenant.name}</TableCell>
						<TableCell className="font-mono text-xs">{tenant.slug}</TableCell>
						<TableCell>{tenant.members}</TableCell>
						<TableCell>
							{tenant.services} serviços · {tenant.professionals} profissionais
						</TableCell>
						<TableCell>{tenant.conversations}</TableCell>
						<TableCell>
							<Badge
								variant={
									tenant.phoneNumberIds.length > 0 ? "secondary" : "outline"
								}
							>
								{tenant.phoneNumberIds.length > 0
									? tenant.phoneNumberIds.join(", ")
									: "não conectado"}
							</Badge>
						</TableCell>
						<TableCell>{formatDate(tenant.createdAt)}</TableCell>
						<TableCell>
							<div className="flex justify-end">
								<Button asChild size="sm" variant="ghost">
									<Link href={`/admin/barbearias/${tenant.id}`}>Abrir</Link>
								</Button>
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export function TenantsTableSkeleton() {
	return <TableSkeleton columns={8} />;
}
