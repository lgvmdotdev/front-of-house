import { Badge } from "@workspace/ui/components/badge";
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
import { listMembers } from "../team-queries";
import { MemberRoleSelect, RemoveMemberButton } from "./team-controls";

/**
 * Reads the members *and* the current user id from the session it already needs
 * for tenancy, so the page does not have to thread `currentUserId` through as a
 * prop.
 */
export async function TeamMembers() {
	const { session, organizationId } = await requireActiveOrg();
	const members = await listMembers(organizationId);

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Nome</TableHead>
					<TableHead>E-mail</TableHead>
					<TableHead>Papel</TableHead>
					<TableHead>Desde</TableHead>
					<TableHead className="w-0" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{members.map((member) => {
					const isSelf = member.userId === session.user.id;
					return (
						<TableRow key={member.id}>
							<TableCell className="font-medium">
								{member.name}
								{isSelf ? (
									<Badge className="ml-2" variant="outline">
										você
									</Badge>
								) : null}
							</TableCell>
							<TableCell>{member.email}</TableCell>
							<TableCell>
								<MemberRoleSelect member={member} />
							</TableCell>
							<TableCell>{formatDate(member.createdAt)}</TableCell>
							<TableCell>
								<div className="flex justify-end">
									{isSelf ? null : <RemoveMemberButton member={member} />}
								</div>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}

export function TeamMembersSkeleton() {
	return <TableSkeleton columns={5} rows={3} />;
}
