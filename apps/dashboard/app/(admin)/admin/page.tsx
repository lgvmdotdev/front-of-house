import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionError } from "@/components/ui/section-error";
import {
	PlatformStats,
	PlatformStatsSkeleton,
} from "@/features/tenant/components/platform-stats";
import {
	RecentTenants,
	RecentTenantsSkeleton,
	TenantsWithoutChannel,
} from "@/features/tenant/components/recent-tenants";

export const metadata: Metadata = {
	title: "Administração · Recepcionai",
};

/**
 * Three sections, three boundaries, one query — `listTenants` and
 * `getPlatformTotals` are both `cache()`d, so the sections stream
 * independently without multiplying database work.
 *
 * The call-out at the bottom has no fallback on purpose: it renders nothing when
 * every shop is connected, so an empty space is its resting state rather than a
 * gap that shifts.
 */
export default function AdminPage() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Visão interna da operação Recepcionai."
				title="Administração"
			/>

			<div className="grid gap-4 sm:grid-cols-3">
				<SectionError title="Totais indisponíveis">
					<Suspense fallback={<PlatformStatsSkeleton />}>
						<PlatformStats />
					</Suspense>
				</SectionError>
			</div>

			<section className="flex flex-col gap-3">
				<h2 className="font-medium">Barbearias recentes</h2>
				<SectionError title="Não foi possível carregar as barbearias">
					<Suspense fallback={<RecentTenantsSkeleton />}>
						<RecentTenants />
					</Suspense>
				</SectionError>
			</section>

			<Suspense fallback={null}>
				<TenantsWithoutChannel />
			</Suspense>
		</div>
	);
}
