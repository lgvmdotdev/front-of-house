import {
	DEFAULT_UTC_OFFSET_MINUTES,
	instantToLocalParts,
	localDayMinutesToInstant,
	parseTimeOfDay,
} from "./time";
import type {
	AvailabilityQuery,
	Booking,
	Professional,
	Service,
	Slot,
} from "./types";

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

/** A half-open time interval `[start, end)`. */
export interface Interval {
	end: Date;
	start: Date;
}

function overlaps(
	aStart: number,
	aEnd: number,
	bStart: number,
	bEnd: number
): boolean {
	return aStart < bEnd && bStart < aEnd;
}

/**
 * Steps fixed-duration slots across an open `window`, skipping any that overlap
 * a `busy` interval or start before `notBefore`. Pure and timezone-agnostic —
 * the caller supplies instants.
 */
export function computeFreeSlots(params: {
	window: Interval;
	busy: readonly Interval[];
	durationMinutes: number;
	/** Spacing between candidate starts. Defaults to `durationMinutes`. */
	stepMinutes?: number;
	/** Slots starting before this instant are dropped (e.g. "now"). */
	notBefore?: Date;
}): Interval[] {
	const durationMs = params.durationMinutes * MS_PER_MINUTE;
	const stepMs = (params.stepMinutes ?? params.durationMinutes) * MS_PER_MINUTE;
	const windowEnd = params.window.end.getTime();
	const notBefore = params.notBefore?.getTime() ?? Number.NEGATIVE_INFINITY;
	const busy = params.busy.map((b) => ({
		start: b.start.getTime(),
		end: b.end.getTime(),
	}));

	const slots: Interval[] = [];
	for (
		let start = params.window.start.getTime();
		start + durationMs <= windowEnd;
		start += stepMs
	) {
		const end = start + durationMs;
		if (start < notBefore) {
			continue;
		}
		const isBusy = busy.some((b) => overlaps(start, end, b.start, b.end));
		if (!isBusy) {
			slots.push({ start: new Date(start), end: new Date(end) });
		}
	}
	return slots;
}

function clampInterval(
	window: Interval,
	from: Date,
	to: Date
): Interval | null {
	const start = Math.max(window.start.getTime(), from.getTime());
	const end = Math.min(window.end.getTime(), to.getTime());
	return start < end ? { start: new Date(start), end: new Date(end) } : null;
}

/**
 * Resolves bookable {@link Slot}s for a service across every qualified
 * professional (or one, if the query restricts it), subtracting each
 * professional's busy intervals. Pure: adapters supply the busy time (from
 * stored bookings, or a calendar's freebusy), this computes the answer.
 *
 * Results are sorted by start time, then professional id.
 */
export function computeSlotsFromBusy(params: {
	query: AvailabilityQuery;
	service: Service;
	professionals: readonly Professional[];
	/** Busy intervals to subtract, keyed by professional id. */
	busyByProfessional: ReadonlyMap<string, readonly Interval[]>;
	offsetMinutes?: number;
	/** Slot spacing. Defaults to the service duration (back-to-back). */
	stepMinutes?: number;
	/** Excludes slots in the past. */
	now?: Date;
}): Slot[] {
	const offset = params.offsetMinutes ?? DEFAULT_UTC_OFFSET_MINUTES;
	const { query, service } = params;
	const candidates = params.professionals.filter(
		(professional) =>
			professional.serviceIds.includes(service.id) &&
			(query.professionalId === undefined ||
				professional.id === query.professionalId)
	);

	const slots: Slot[] = [];
	const firstDay = instantToLocalParts(query.from, offset);
	const lastDay = instantToLocalParts(query.to, offset);
	const firstDayUtc = Date.UTC(firstDay.year, firstDay.month - 1, firstDay.day);
	const lastDayUtc = Date.UTC(lastDay.year, lastDay.month - 1, lastDay.day);

	for (const professional of candidates) {
		const busy = params.busyByProfessional.get(professional.id) ?? [];

		for (let dayUtc = firstDayUtc; dayUtc <= lastDayUtc; dayUtc += MS_PER_DAY) {
			const cursor = new Date(dayUtc);
			const day = {
				year: cursor.getUTCFullYear(),
				month: cursor.getUTCMonth() + 1,
				day: cursor.getUTCDate(),
			};
			const weekday = cursor.getUTCDay();

			for (const hours of professional.workingHours) {
				if (hours.weekday !== weekday) {
					continue;
				}
				const rawWindow: Interval = {
					start: localDayMinutesToInstant(
						day,
						parseTimeOfDay(hours.start),
						offset
					),
					end: localDayMinutesToInstant(day, parseTimeOfDay(hours.end), offset),
				};
				const window = clampInterval(rawWindow, query.from, query.to);
				if (!window) {
					continue;
				}
				for (const slot of computeFreeSlots({
					window,
					busy,
					durationMinutes: service.durationMinutes,
					stepMinutes: params.stepMinutes,
					notBefore: params.now,
				})) {
					slots.push({ ...slot, professionalId: professional.id });
				}
			}
		}
	}

	slots.sort((a, b) => {
		const byStart = a.start.getTime() - b.start.getTime();
		return byStart === 0
			? a.professionalId.localeCompare(b.professionalId)
			: byStart;
	});
	return slots;
}

/**
 * Convenience over {@link computeSlotsFromBusy} for adapters that hold the
 * schedule as {@link Booking}s (the fake, the spreadsheet): derives busy time
 * from confirmed bookings, then computes slots.
 */
export function computeAvailability(params: {
	query: AvailabilityQuery;
	service: Service;
	professionals: readonly Professional[];
	bookings: readonly Booking[];
	offsetMinutes?: number;
	stepMinutes?: number;
	now?: Date;
}): Slot[] {
	const busyByProfessional = new Map<string, Interval[]>();
	for (const booking of params.bookings) {
		if (booking.status !== "confirmed") {
			continue;
		}
		const list = busyByProfessional.get(booking.professionalId) ?? [];
		list.push({ start: booking.start, end: booking.end });
		busyByProfessional.set(booking.professionalId, list);
	}
	return computeSlotsFromBusy({
		query: params.query,
		service: params.service,
		professionals: params.professionals,
		busyByProfessional,
		offsetMinutes: params.offsetMinutes,
		stepMinutes: params.stepMinutes,
		now: params.now,
	});
}
