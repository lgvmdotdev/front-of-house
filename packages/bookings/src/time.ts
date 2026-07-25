import type { Weekday } from "./types";

/**
 * Fixed-offset local⇄instant conversions.
 *
 * Brazil has observed no daylight-saving time since 2019, so each shop maps to a
 * single constant UTC offset — no IANA timezone database needed. The default is
 * America/São_Paulo (UTC−3).
 */

const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;
const TIME_OF_DAY = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** America/São_Paulo, UTC−3 (no DST). */
export const DEFAULT_UTC_OFFSET_MINUTES = -180;

/** Local wall-clock components, plus the weekday they fall on. */
export interface LocalDateParts {
	day: number;
	hours: number;
	minutes: number;
	month: number;
	weekday: Weekday;
	year: number;
}

/** Parses `"HH:MM"` (24h) into minutes since local midnight. */
export function parseTimeOfDay(value: string): number {
	const match = TIME_OF_DAY.exec(value);
	if (!match) {
		throw new Error(`Invalid time of day: "${value}" (expected HH:MM)`);
	}
	return Number(match[1]) * MINUTES_PER_HOUR + Number(match[2]);
}

/** Renders minutes-since-midnight back to `"HH:MM"`. */
export function formatTimeOfDay(minutesSinceMidnight: number): string {
	const hours = Math.floor(minutesSinceMidnight / MINUTES_PER_HOUR);
	const minutes = minutesSinceMidnight % MINUTES_PER_HOUR;
	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Builds a UTC instant from local wall-clock components. */
export function localToInstant(
	parts: {
		year: number;
		month: number;
		day: number;
		hours?: number;
		minutes?: number;
	},
	offsetMinutes: number = DEFAULT_UTC_OFFSET_MINUTES
): Date {
	const utcMs = Date.UTC(
		parts.year,
		parts.month - 1,
		parts.day,
		parts.hours ?? 0,
		parts.minutes ?? 0
	);
	return new Date(utcMs - offsetMinutes * MS_PER_MINUTE);
}

/** Builds a UTC instant from a local calendar day + minutes-since-midnight. */
export function localDayMinutesToInstant(
	day: { year: number; month: number; day: number },
	minutesSinceMidnight: number,
	offsetMinutes: number = DEFAULT_UTC_OFFSET_MINUTES
): Date {
	return localToInstant(
		{
			year: day.year,
			month: day.month,
			day: day.day,
			hours: Math.floor(minutesSinceMidnight / MINUTES_PER_HOUR),
			minutes: minutesSinceMidnight % MINUTES_PER_HOUR,
		},
		offsetMinutes
	);
}

/** Decomposes a UTC instant into local wall-clock parts. */
export function instantToLocalParts(
	instant: Date,
	offsetMinutes: number = DEFAULT_UTC_OFFSET_MINUTES
): LocalDateParts {
	const shifted = new Date(instant.getTime() + offsetMinutes * MS_PER_MINUTE);
	return {
		year: shifted.getUTCFullYear(),
		month: shifted.getUTCMonth() + 1,
		day: shifted.getUTCDate(),
		hours: shifted.getUTCHours(),
		minutes: shifted.getUTCMinutes(),
		weekday: shifted.getUTCDay() as Weekday,
	};
}
