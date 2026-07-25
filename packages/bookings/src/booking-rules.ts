import { instantToLocalParts, parseTimeOfDay } from "./time";
import type { Booking, Professional } from "./types";

/**
 * Shared booking validity rules, used by every {@link BookingEngine}
 * implementation that has to enforce slots itself (the fake, the spreadsheet
 * adapter). Real APIs like Trinks enforce these server-side, so their adapters
 * won't need these.
 */

const MINUTES_PER_HOUR = 60;

/** Does `[start, end)` fit entirely inside one of the professional's windows? */
export function isWithinWorkingHours(
	professional: Professional,
	start: Date,
	end: Date,
	offsetMinutes: number
): boolean {
	const startParts = instantToLocalParts(start, offsetMinutes);
	const endParts = instantToLocalParts(end, offsetMinutes);
	if (
		startParts.year !== endParts.year ||
		startParts.month !== endParts.month ||
		startParts.day !== endParts.day
	) {
		return false;
	}
	const startMinutes = startParts.hours * MINUTES_PER_HOUR + startParts.minutes;
	const endMinutes = endParts.hours * MINUTES_PER_HOUR + endParts.minutes;
	return professional.workingHours.some(
		(hours) =>
			hours.weekday === startParts.weekday &&
			parseTimeOfDay(hours.start) <= startMinutes &&
			endMinutes <= parseTimeOfDay(hours.end)
	);
}

/**
 * Returns a confirmed booking for `professionalId` that overlaps `[start, end)`,
 * or `undefined` if the interval is free. `excludeBookingId` skips a booking
 * being rescheduled so it doesn't clash with itself.
 */
export function findConflict(
	bookings: Iterable<Booking>,
	professionalId: string,
	start: Date,
	end: Date,
	excludeBookingId?: string
): Booking | undefined {
	const startMs = start.getTime();
	const endMs = end.getTime();
	for (const booking of bookings) {
		if (
			booking.id !== excludeBookingId &&
			booking.professionalId === professionalId &&
			booking.status === "confirmed" &&
			booking.start.getTime() < endMs &&
			startMs < booking.end.getTime()
		) {
			return booking;
		}
	}
	return;
}
