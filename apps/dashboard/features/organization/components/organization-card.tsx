import { Skeleton } from "@workspace/ui/components/skeleton";
import { notFound } from "next/navigation";
import { requireActiveOrg } from "@/lib/session";
import { getOrganization } from "../organization-queries";
import { OrganizationForm } from "./organization-form";

export async function OrganizationCard() {
	const { organizationId } = await requireActiveOrg();
	const organization = await getOrganization(organizationId);
	if (!organization) {
		notFound();
	}
	return <OrganizationForm organization={organization} />;
}

export function OrganizationCardSkeleton() {
	return (
		<div aria-hidden className="flex flex-col gap-6 rounded-xl border p-6">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-5 w-44" />
				<Skeleton className="h-4 w-full max-w-md" />
			</div>
			{["name", "slug", "logo"].map((field) => (
				<div className="flex flex-col gap-2" key={field}>
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-9 w-full" />
				</div>
			))}
			<Skeleton className="h-9 w-24" />
		</div>
	);
}
