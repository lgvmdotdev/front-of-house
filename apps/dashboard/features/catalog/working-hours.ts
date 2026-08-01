/** A weekly working window, as the forms and the DB both carry it. */
export interface WorkingWindow {
	/** Local "HH:MM", exclusive. */
	end: string;
	/** Local "HH:MM", inclusive. */
	start: string;
	/** 0 = Sunday … 6 = Saturday. */
	weekday: number;
}

/** Weekday, then start time. `"HH:MM"` sorts correctly as a plain string. */
export function sortWindows<T extends WorkingWindow>(windows: T[]): T[] {
	return [...windows].sort(
		(a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start)
	);
}

/**
 * The first window that overlaps an earlier one on the same weekday, or `null`
 * when the set is valid. Split shifts are fine and touching windows
 * (`12:00` end / `12:00` start) are fine — `end` is exclusive.
 */
export function findOverlappingWindow<T extends WorkingWindow>(
	windows: T[]
): T | null {
	const sorted = sortWindows(windows);
	for (let index = 1; index < sorted.length; index++) {
		const previous = sorted[index - 1];
		const current = sorted[index];
		if (!(previous && current)) {
			continue;
		}
		if (previous.weekday === current.weekday && current.start < previous.end) {
			return current;
		}
	}
	return null;
}

const WEEKDAY_LABELS = [
	"Domingo",
	"Segunda",
	"Terça",
	"Quarta",
	"Quinta",
	"Sexta",
	"Sábado",
] as const;

export const WEEKDAYS = WEEKDAY_LABELS.map((label, value) => ({
	value,
	label,
}));

export function weekdayLabel(weekday: number): string {
	return WEEKDAY_LABELS[weekday] ?? String(weekday);
}
