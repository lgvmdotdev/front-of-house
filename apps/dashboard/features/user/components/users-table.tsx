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
import { requireAdmin } from "@/lib/session";
import { listPlatformUsers } from "../user-queries";
import {
	BanUserButton,
	ImpersonateUserButton,
	UnbanUserButton,
	UserRoleSelect,
} from "./user-controls";

export async function UsersTable() {
	const session = await requireAdmin();
	const users = await listPlatformUsers();

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Nome</TableHead>
					<TableHead>E-mail</TableHead>
					<TableHead>Barbearias</TableHead>
					<TableHead>Papel interno</TableHead>
					<TableHead>Situação</TableHead>
					<TableHead>Desde</TableHead>
					<TableHead className="w-0" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{users.map((user) => {
					const isSelf = user.id === session.user.id;
					return (
						<TableRow key={user.id}>
							<TableCell className="font-medium">
								{user.name}
								{isSelf ? (
									<Badge className="ml-2" variant="outline">
										você
									</Badge>
								) : null}
							</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell className="whitespace-normal text-sm">
								{user.memberships.length === 0 ? (
									<span className="text-muted-foreground">—</span>
								) : (
									user.memberships
										.map(
											(membership) =>
												`${membership.organizationName} (${membership.role})`
										)
										.join(", ")
								)}
							</TableCell>
							<TableCell>
								<UserRoleSelect isSelf={isSelf} user={user} />
							</TableCell>
							<TableCell>
								{user.banned ? (
									<Badge variant="destructive">
										bloqueado{user.banReason ? `: ${user.banReason}` : ""}
									</Badge>
								) : (
									<Badge variant="secondary">ativo</Badge>
								)}
							</TableCell>
							<TableCell>{formatDate(user.createdAt)}</TableCell>
							<TableCell>
								<div className="flex justify-end gap-2">
									{user.banned ? (
										<UnbanUserButton user={user} />
									) : (
										<BanUserButton isSelf={isSelf} user={user} />
									)}
									{isSelf || user.memberships.length === 0 ? null : (
										<ImpersonateUserButton user={user} />
									)}
								</div>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}

export function UsersTableSkeleton() {
	return <TableSkeleton columns={7} />;
}
