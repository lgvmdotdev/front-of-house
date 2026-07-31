"use client";

import { RiDashboardLine, RiStoreLine, RiUserLine } from "@remixicon/react";
import {
	DashboardSidebar,
	type SidebarNavItem,
} from "@/components/layout/dashboard-sidebar";

const NAV_ITEMS: readonly SidebarNavItem[] = [
	{ href: "/admin", label: "Visão geral", icon: RiDashboardLine, exact: true },
	{ href: "/admin/barbearias", label: "Barbearias", icon: RiStoreLine },
	{ href: "/admin/usuarios", label: "Usuários", icon: RiUserLine },
] as const;

export function AdminSidebar({
	userName,
	userEmail,
}: {
	userEmail: string;
	userName: string;
}) {
	return (
		<DashboardSidebar
			groupLabel="Administração"
			items={NAV_ITEMS}
			subtitle="Painel interno"
			title="Recepcionai"
			userEmail={userEmail}
			userName={userName}
		/>
	);
}
