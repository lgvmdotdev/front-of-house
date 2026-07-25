import type { Professional, Service, Weekday } from "@workspace/bookings/types";

/**
 * Pure mapping from catalog DB rows into `@workspace/bookings` config shapes.
 * This is the seam that wires the dashboard-managed catalog into the booking
 * engine (the Calendar/Sheets adapters consume `Service`/`Professional`).
 */

export interface ServiceRow {
	durationMinutes: number;
	id: string;
	name: string;
	priceCents: number;
}

export interface WorkingHoursRow {
	end: string;
	start: string;
	weekday: number;
}

export interface ProfessionalRow {
	id: string;
	name: string;
	serviceIds: string[];
	workingHours: WorkingHoursRow[];
}

export function toBookingService(row: ServiceRow): Service {
	return {
		id: row.id,
		name: row.name,
		durationMinutes: row.durationMinutes,
		price: { amountCents: row.priceCents, currency: "BRL" },
	};
}

export function toBookingProfessional(row: ProfessionalRow): Professional {
	return {
		id: row.id,
		name: row.name,
		serviceIds: row.serviceIds,
		workingHours: row.workingHours.map((hours) => ({
			weekday: hours.weekday as Weekday,
			start: hours.start,
			end: hours.end,
		})),
	};
}
