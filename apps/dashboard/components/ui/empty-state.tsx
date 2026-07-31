import type { ReactNode } from "react";

/** The "nothing here yet" panel, composed from layout utilities only. */
export function EmptyState({
	title,
	description,
	children,
}: {
	children?: ReactNode;
	description: string;
	title: string;
}) {
	return (
		<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
			<p className="font-medium">{title}</p>
			<p className="max-w-sm text-muted-foreground text-sm">{description}</p>
			{children}
		</div>
	);
}
