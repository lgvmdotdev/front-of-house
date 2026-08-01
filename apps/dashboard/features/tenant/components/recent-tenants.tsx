import Link from "next/link";
import { ListSkeleton } from "@/components/ui/table-skeleton";
import { listTenants } from "../tenant-queries";

const RECENT_TENANTS = 5;

/**
 * Both sections below read `listTenants()`, which is `cache()`d — two boundaries
 * that stream independently, one query.
 */
export async function RecentTenants() {
	const tenants = await listTenants();

	if (tenants.length === 0) {
		return (
			<p className="text-muted-foreground text-sm">
				Nenhuma barbearia cadastrada.
			</p>
		);
	}

	return (
		<ul className="flex flex-col gap-2">
			{tenants.slice(0, RECENT_TENANTS).map((tenant) => (
				<li key={tenant.id}>
					<Link
						className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 transition-colors hover:border-ring"
						href={`/admin/barbearias/${tenant.id}`}
					>
						<span className="font-medium">{tenant.name}</span>
						<span className="text-muted-foreground text-sm">
							{tenant.services} serviços · {tenant.professionals} profissionais
							· {tenant.conversations} conversas
						</span>
					</Link>
				</li>
			))}
		</ul>
	);
}

export function RecentTenantsSkeleton() {
	return <ListSkeleton rows={3} />;
}

/** Onboarding call-out: shops that exist but cannot receive a message yet. */
export async function TenantsWithoutChannel() {
	const tenants = await listTenants();
	const withoutChannel = tenants.filter(
		(tenant) => tenant.phoneNumberIds.length === 0
	);
	if (withoutChannel.length === 0) {
		return null;
	}

	return (
		<section className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/10 p-4">
			<h2 className="font-medium">Sem WhatsApp conectado</h2>
			<p className="text-muted-foreground text-sm">
				{withoutChannel.map((tenant) => tenant.name).join(", ")}
			</p>
		</section>
	);
}
