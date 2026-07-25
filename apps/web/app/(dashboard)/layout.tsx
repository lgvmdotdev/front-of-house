import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { requireActiveOrg } from "@/lib/session";

export default async function DashboardLayout({
	children,
}: {
	children: ReactNode;
}) {
	const { session, organizationId } = await requireActiveOrg();
	const org = await db.query.organization.findFirst({
		where: eq(schema.organization.id, organizationId),
	});

	return (
		<SidebarProvider>
			<AppSidebar
				orgName={org?.name ?? "Barbearia"}
				userEmail={session.user.email}
				userName={session.user.name}
			/>
			<SidebarInset>
				<header className="flex h-14 items-center gap-2 border-b px-4">
					<SidebarTrigger />
				</header>
				<div className="p-4 md:p-6">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
