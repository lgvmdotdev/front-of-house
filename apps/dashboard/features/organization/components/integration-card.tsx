import { Skeleton } from "@workspace/ui/components/skeleton";
import { requireActiveOrg } from "@/lib/session";
import { getIntegrationSettings } from "../organization-queries";
import { IntegrationForm } from "./integration-form";

/**
 * Owns the read; the form it renders is the only client code on `/integracao`.
 * The skeleton reserves the card's real height so the heading above it does not
 * jump when the settings arrive.
 */
export async function IntegrationCard() {
	const { organizationId } = await requireActiveOrg();
	const integration = await getIntegrationSettings(organizationId);
	return <IntegrationForm integration={integration} />;
}

export function IntegrationCardSkeleton() {
	return (
		<div aria-hidden className="flex flex-col gap-6 rounded-xl border p-6">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-5 w-48" />
				<Skeleton className="h-4 w-full max-w-lg" />
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-4 w-20" />
				<Skeleton className="h-9 w-full" />
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-4 w-64" />
				<Skeleton className="h-9 w-full" />
				<Skeleton className="h-3 w-52" />
			</div>
			<Skeleton className="h-9 w-40" />
		</div>
	);
}
