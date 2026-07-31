import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { requireActiveOrg } from "@/lib/session";

/**
 * Tenant panel shell. `requireActiveOrg` is the only place tenancy is decided —
 * every page below reads its `organizationId` from the same helper, so no screen
 * can accidentally query unscoped.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
	const { session, organizationId } = await requireActiveOrg();
	const org = await db.query.organization.findFirst({
		where: eq(schema.organization.id, organizationId),
	});

	return (
		<SidebarProvider>
			<DashboardSidebar
				nav="app"
				subtitle="Recepcionai"
				title={org?.name ?? "Barbearia"}
				userEmail={session.user.email}
				userName={session.user.name}
			/>
			<SidebarInset>
				{session.session.impersonatedBy ? (
					<ImpersonationBanner userName={session.user.name} />
				) : null}
				<header className="flex h-14 items-center gap-2 border-b px-4">
					<SidebarTrigger />
				</header>
				<div className="p-4 md:p-6">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
