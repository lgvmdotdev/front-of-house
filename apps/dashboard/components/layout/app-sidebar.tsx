"use client";

import {
	RiChat3Line,
	RiDashboardLine,
	RiGroupLine,
	RiPlugLine,
	RiScissorsLine,
	RiSettings3Line,
	RiTeamLine,
	RiWhatsappLine,
} from "@remixicon/react";
import {
	DashboardSidebar,
	type SidebarNavItem,
} from "@/components/layout/dashboard-sidebar";

const NAV_ITEMS: readonly SidebarNavItem[] = [
	{ href: "/painel", label: "Visão geral", icon: RiDashboardLine, exact: true },
	{ href: "/servicos", label: "Serviços", icon: RiScissorsLine },
	{ href: "/profissionais", label: "Profissionais", icon: RiTeamLine },
	{ href: "/conversas", label: "Conversas", icon: RiChat3Line },
	{ href: "/integracao", label: "Integração", icon: RiPlugLine },
	{ href: "/whatsapp", label: "WhatsApp", icon: RiWhatsappLine },
	{ href: "/equipe", label: "Equipe", icon: RiGroupLine },
	{ href: "/configuracoes", label: "Configurações", icon: RiSettings3Line },
] as const;

export function AppSidebar({
	orgName,
	userName,
	userEmail,
}: {
	orgName: string;
	userEmail: string;
	userName: string;
}) {
	return (
		<DashboardSidebar
			groupLabel="Painel"
			items={NAV_ITEMS}
			subtitle="Recepcionai"
			title={orgName}
			userEmail={userEmail}
			userName={userName}
		/>
	);
}
