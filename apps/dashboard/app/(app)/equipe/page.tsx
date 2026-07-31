import type { Metadata } from "next";
import { TeamManager } from "@/components/team/team-manager";
import { requireActiveOrg } from "@/lib/session";
import { listMembers, listPendingInvitations } from "@/lib/tenant";

export const metadata: Metadata = {
	title: "Equipe · Recepcionai",
};

export default async function EquipePage() {
	const { session, organizationId } = await requireActiveOrg();
	const [members, invitations] = await Promise.all([
		listMembers(organizationId),
		listPendingInvitations(organizationId),
	]);
	return (
		<TeamManager
			currentUserId={session.user.id}
			invitations={invitations}
			members={members}
		/>
	);
}
