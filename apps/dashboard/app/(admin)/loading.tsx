import { Skeleton } from "@workspace/ui/components/skeleton";

/** Same reasoning as the tenant panel's loading boundary. */
export default function AdminLoading() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-4 w-72" />
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				<Skeleton className="h-24" />
				<Skeleton className="h-24" />
				<Skeleton className="h-24" />
			</div>
		</div>
	);
}
