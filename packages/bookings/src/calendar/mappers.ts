import type { Booking, Service } from "../types";
import type { CalendarEvent, CalendarEventInput } from "./client";

/**
 * Pure translation between our {@link Booking} domain and {@link CalendarEvent}s.
 *
 * A booking's structured data (service, professional, customer, our status)
 * lives in the event's private extended properties, tagged with the app marker
 * so we can tell our appointments apart from the barber's own calendar entries.
 * Reading professional from the marker — not the calendar id — keeps it correct
 * even when several barbers share one calendar.
 */

export const DEFAULT_APP_TAG = "recepcionai";

const KEY = {
	app: "app",
	serviceId: "service_id",
	professionalId: "professional_id",
	customerName: "customer_name",
	customerPhone: "customer_phone",
	status: "status",
} as const;

/** The private-property filter that selects this app's events. */
export function managedFilter(appTag: string): Record<string, string> {
	return { [KEY.app]: appTag };
}

/** Is this event one of ours (vs the barber's personal entry)? */
export function isManaged(event: CalendarEvent, appTag: string): boolean {
	return event.privateProperties[KEY.app] === appTag;
}

/** Private properties to write when creating/updating a booking event. */
export function bookingPrivateProperties(
	booking: Booking,
	appTag: string
): Record<string, string> {
	return {
		[KEY.app]: appTag,
		[KEY.serviceId]: booking.serviceId,
		[KEY.professionalId]: booking.professionalId,
		[KEY.customerName]: booking.customer.name,
		[KEY.customerPhone]: booking.customer.phone,
		[KEY.status]: booking.status,
	};
}

/** Builds the event payload for a booking. */
export function bookingToEventInput(
	booking: Booking,
	service: Service,
	appTag: string
): CalendarEventInput {
	return {
		summary: `${service.name} — ${booking.customer.name}`,
		description: booking.notes ?? "",
		start: booking.start,
		end: booking.end,
		busy: booking.status === "confirmed",
		privateProperties: bookingPrivateProperties(booking, appTag),
	};
}

/** Reconstructs a {@link Booking} from one of our events; `null` if not ours. */
export function eventToBooking(
	event: CalendarEvent,
	appTag: string
): Booking | null {
	if (!isManaged(event, appTag)) {
		return null;
	}
	const properties = event.privateProperties;
	return {
		id: event.id,
		serviceId: properties[KEY.serviceId] ?? "",
		professionalId: properties[KEY.professionalId] ?? "",
		customer: {
			name: properties[KEY.customerName] ?? "",
			phone: properties[KEY.customerPhone] ?? "",
		},
		start: event.start,
		end: event.end,
		status: properties[KEY.status] === "cancelled" ? "cancelled" : "confirmed",
		notes: event.description.length > 0 ? event.description : undefined,
		createdAt: event.created,
	};
}
