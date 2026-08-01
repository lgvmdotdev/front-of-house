import { RiArrowLeftLine } from "@remixicon/react";
import { Button } from "@workspace/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SectionError } from "@/components/ui/section-error";
import {
	TenantDetail,
	TenantDetailSkeleton,
} from "@/features/tenant/components/tenant-detail";
import { getTenantDetail } from "@/features/tenant/tenant-queries";

/**
 * Names the tab after the barbershop and fails fast on an unknown id, so the
 * 404 page renders instead of a skeleton that resolves into one.
 * `getTenantDetail` is `cache()`d, so the component below reuses this read.
 * Same status-code trade-off as `/conversas/[id]` — see the note there.
 */
export async function generateMetadata({
	params,
}: PageProps<"/admin/barbearias/[id]">): Promise<Metadata> {
	const { id } = await params;
	const detail = await getTenantDetail(id);
	if (!detail) {
		notFound();
	}
	return { title: `${detail.organization.name} · Recepcionai` };
}

export default function BarbeariaPage({
	params,
}: PageProps<"/admin/barbearias/[id]">) {
	return (
		<div className="flex flex-col gap-6">
			<Button asChild className="self-start" size="sm" variant="ghost">
				<Link href="/admin/barbearias">
					<RiArrowLeftLine aria-hidden size={16} />
					Barbearias
				</Link>
			</Button>
			<SectionError title="Não foi possível carregar a barbearia">
				<Suspense fallback={<TenantDetailSkeleton />}>
					{params.then(({ id }) => (
						<TenantDetail id={id} />
					))}
				</Suspense>
			</SectionError>
		</div>
	);
}
