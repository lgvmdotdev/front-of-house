import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { getPlatformTotals, listTenants } from "@/lib/admin";

export const metadata: Metadata = {
	title: "Administração · Recepcionai",
};

const RECENT_TENANTS = 5;

export default async function AdminPage() {
	const [totals, tenants] = await Promise.all([
		getPlatformTotals(),
		listTenants(),
	]);

	const stats = [
		{ label: "Barbearias", value: totals.tenants, href: "/admin/barbearias" },
		{ label: "Usuários", value: totals.users, href: "/admin/usuarios" },
		{
			label: "Conversas",
			value: totals.conversations,
			href: "/admin/barbearias",
		},
	] as const;

	const withoutChannel = tenants.filter(
		(tenant) => tenant.phoneNumberIds.length === 0
	);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Visão interna da operação Recepcionai."
				title="Administração"
			/>

			<div className="grid gap-4 sm:grid-cols-3">
				{stats.map((stat) => (
					<Link href={stat.href} key={stat.label}>
						<Card className="h-full transition-colors hover:border-ring">
							<CardHeader>
								<CardDescription>{stat.label}</CardDescription>
								<CardTitle className="text-3xl">{stat.value}</CardTitle>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>

			<section className="flex flex-col gap-3">
				<h2 className="font-medium">Barbearias recentes</h2>
				{tenants.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						Nenhuma barbearia cadastrada.
					</p>
				) : (
					<ul className="flex flex-col gap-2">
						{tenants.slice(0, RECENT_TENANTS).map((tenant) => (
							<li key={tenant.id}>
								<Link
									className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 transition-colors hover:border-ring"
									href={`/admin/barbearias/${tenant.id}`}
								>
									<span className="font-medium">{tenant.name}</span>
									<span className="text-muted-foreground text-sm">
										{tenant.services} serviços · {tenant.professionals}{" "}
										profissionais · {tenant.conversations} conversas
									</span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</section>

			{withoutChannel.length > 0 ? (
				<section className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/10 p-4">
					<h2 className="font-medium">Sem WhatsApp conectado</h2>
					<p className="text-muted-foreground text-sm">
						{withoutChannel.map((tenant) => tenant.name).join(", ")}
					</p>
				</section>
			) : null}
		</div>
	);
}
