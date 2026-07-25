"use client";

import {
	RiDashboardLine,
	RiLogoutBoxLine,
	RiScissorsLine,
	RiTeamLine,
} from "@remixicon/react";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth";

const NAV_ITEMS = [
	{ href: "/dashboard", label: "Visão geral", icon: RiDashboardLine },
	{ href: "/dashboard/servicos", label: "Serviços", icon: RiScissorsLine },
	{
		href: "/dashboard/profissionais",
		label: "Profissionais",
		icon: RiTeamLine,
	},
] as const;

function initials(value: string): string {
	return (
		value
			.split(" ")
			.map((part) => part.charAt(0))
			.slice(0, 2)
			.join("")
			.toUpperCase() || "?"
	);
}

export function AppSidebar({
	orgName,
	userName,
	userEmail,
}: {
	orgName: string;
	userName: string;
	userEmail: string;
}) {
	const pathname = usePathname();
	const router = useRouter();

	async function handleSignOut() {
		await authClient.signOut();
		router.push("/login");
		router.refresh();
	}

	return (
		<Sidebar>
			<SidebarHeader>
				<div className="px-2 py-1.5">
					<p className="font-medium text-sm">{orgName}</p>
					<p className="text-muted-foreground text-xs">Recepcionai</p>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Painel</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{NAV_ITEMS.map((item) => {
								const isActive =
									item.href === "/dashboard"
										? pathname === item.href
										: pathname.startsWith(item.href);
								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton asChild isActive={isActive}>
											<Link href={item.href}>
												<item.icon aria-hidden size={18} />
												<span>{item.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton>
									<Avatar className="size-6">
										<AvatarFallback>{initials(userName)}</AvatarFallback>
									</Avatar>
									<span className="truncate">{userName}</span>
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel className="font-normal">
									<span className="block text-sm">{userName}</span>
									<span className="block text-muted-foreground text-xs">
										{userEmail}
									</span>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onSelect={handleSignOut}>
									<RiLogoutBoxLine aria-hidden size={16} />
									Sair
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
