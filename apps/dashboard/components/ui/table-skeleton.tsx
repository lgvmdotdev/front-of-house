import { Skeleton } from "@workspace/ui/components/skeleton";

/**
 * Stable keys for fixed-length placeholder grids. Skeletons never reorder, but
 * an index key is still an index key as far as the linter is concerned — and
 * naming the cells reads better than silencing the rule.
 */
function placeholderKeys(count: number, prefix: string): string[] {
	return Array.from({ length: count }, (_, index) => `${prefix}-${index}`);
}

/**
 * Reserves a table's height while its rows stream in. Every list screen in the
 * panel suspends behind one of these, so the only things that vary are the
 * column count and how many placeholder rows to show — 3–4 reads as "a list is
 * coming" without pretending to know the real length.
 */
export function TableSkeleton({
	columns,
	rows = 4,
}: {
	columns: number;
	rows?: number;
}) {
	return (
		<div aria-hidden className="flex flex-col">
			<div className="flex gap-4 border-b pb-3">
				{placeholderKeys(columns, "head").map((key) => (
					<Skeleton className="h-4 flex-1" key={key} />
				))}
			</div>
			{placeholderKeys(rows, "row").map((rowKey) => (
				<div className="flex items-center gap-4 border-b py-4" key={rowKey}>
					{placeholderKeys(columns, `${rowKey}-cell`).map((cellKey) => (
						<Skeleton className="h-5 flex-1" key={cellKey} />
					))}
				</div>
			))}
		</div>
	);
}

/** Same idea for the card grids on the two overview screens. */
export function CardGridSkeleton({ cards = 2 }: { cards?: number }) {
	return (
		<>
			{placeholderKeys(cards, "card").map((key) => (
				<div className="flex flex-col gap-3 rounded-xl border p-6" key={key}>
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-7 w-40" />
				</div>
			))}
		</>
	);
}

/** Placeholder rows for the list-of-links shapes that are not tables. */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
	return (
		<ul aria-hidden className="flex flex-col gap-2">
			{placeholderKeys(rows, "item").map((key) => (
				<li key={key}>
					<div className="flex items-center justify-between gap-2 rounded-lg border px-4 py-3">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-4 w-64" />
					</div>
				</li>
			))}
		</ul>
	);
}
