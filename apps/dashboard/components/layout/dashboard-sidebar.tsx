"use client";

import { type RemixiconComponentType, RiLogoutBoxLine } from "@remixicon/react";
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
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export interface SidebarNavItem {
	/** Only match this href exactly — used for section roots like `/painel`. */
	exact?: boolean;
	href: Route;
	icon: RemixiconComponentType;
	label: string;
}

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

/**
 * One sidebar for both route groups — the tenant panel and the admin panel
 * differ only in their nav items and header labels.
 */
export function DashboardSidebar({
	title,
	subtitle,
	groupLabel,
	items,
	userName,
	userEmail,
}: {
	groupLabel: string;
	items: readonly SidebarNavItem[];
	subtitle: string;
	title: string;
	userEmail: string;
	userName: string;
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
					<p className="truncate font-medium text-sm">{title}</p>
					<p className="text-muted-foreground text-xs">{subtitle}</p>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => {
								const isActive = item.exact
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
