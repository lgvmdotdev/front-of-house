import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { formatDate } from "@/lib/format";
import { requireActiveOrg } from "@/lib/session";
import { listPendingInvitations } from "../team-queries";
import { memberRoleLabel } from "../team-schema";
import { CancelInvitationButton } from "./team-controls";

export async function PendingInvitations() {
	const { organizationId } = await requireActiveOrg();
	const invitations = await listPendingInvitations(organizationId);

	if (invitations.length === 0) {
		return (
			<p className="text-muted-foreground text-sm">Nenhum convite pendente.</p>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>E-mail</TableHead>
					<TableHead>Papel</TableHead>
					<TableHead>Expira</TableHead>
					<TableHead className="w-0" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{invitations.map((invitation) => (
					<TableRow key={invitation.id}>
						<TableCell className="font-medium">{invitation.email}</TableCell>
						<TableCell>{memberRoleLabel(invitation.role)}</TableCell>
						<TableCell>{formatDate(invitation.expiresAt)}</TableCell>
						<TableCell>
							<div className="flex justify-end">
								<CancelInvitationButton invitation={invitation} />
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export function PendingInvitationsSkeleton() {
	return <TableSkeleton columns={4} rows={2} />;
}
