import type { ReactNode } from "react";

/** Title + one-line description + optional action, repeated on every screen. */
export function PageHeader({
	title,
	description,
	action,
}: {
	action?: ReactNode;
	description?: string;
	title: string;
}) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-3">
			<div>
				<h1 className="font-semibold text-2xl">{title}</h1>
				{description ? (
					<p className="text-muted-foreground">{description}</p>
				) : null}
			</div>
			{action}
		</div>
	);
}
