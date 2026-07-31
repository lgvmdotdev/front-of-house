import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { requireAdmin } from "@/lib/session";

/**
 * Admin shell. `requireAdmin` is the authoritative gate — `proxy.ts` only knows
 * whether a session cookie exists, not what role it carries.
 */
export default async function AdminLayout({
	children,
}: {
	children: ReactNode;
}) {
	const session = await requireAdmin();

	return (
		<SidebarProvider>
			<DashboardSidebar
				nav="admin"
				subtitle="Painel interno"
				title="Recepcionai"
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
