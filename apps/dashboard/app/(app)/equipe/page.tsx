import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionError } from "@/components/ui/section-error";
import { InviteForm } from "@/features/team/components/invite-form";
import {
	PendingInvitations,
	PendingInvitationsSkeleton,
} from "@/features/team/components/pending-invitations";
import {
	TeamMembers,
	TeamMembersSkeleton,
} from "@/features/team/components/team-members";

export const metadata: Metadata = {
	title: "Equipe · Recepcionai",
};

/**
 * The invite form reads nothing, so an owner can start typing an address while
 * the two tables are still loading. Both section headings sit outside their
 * boundaries — their position is fixed by the skeletons below them.
 */
export default function EquipePage() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Quem tem acesso ao painel desta barbearia."
				title="Equipe"
			/>

			<InviteForm />

			<section className="flex flex-col gap-3">
				<h2 className="font-medium">Membros</h2>
				<SectionError title="Não foi possível carregar os membros">
					<Suspense fallback={<TeamMembersSkeleton />}>
						<TeamMembers />
					</Suspense>
				</SectionError>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="font-medium">Convites pendentes</h2>
				<SectionError title="Não foi possível carregar os convites">
					<Suspense fallback={<PendingInvitationsSkeleton />}>
						<PendingInvitations />
					</Suspense>
				</SectionError>
			</section>
		</div>
	);
}
