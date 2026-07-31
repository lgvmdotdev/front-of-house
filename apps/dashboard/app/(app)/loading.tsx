import { Skeleton } from "@workspace/ui/components/skeleton";

/**
 * Every `(app)` page awaits an org-scoped query, so without a boundary a
 * navigation blocks on the database before anything paints. With it the sidebar
 * and header render instantly and only the content area streams in — the
 * "instant navigation" win that does not require caching per-tenant data.
 */
export default function AppLoading() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-72" />
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		</div>
	);
}
