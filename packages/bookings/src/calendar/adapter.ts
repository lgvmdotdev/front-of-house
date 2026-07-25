import { computeSlotsFromBusy, type Interval } from "../availability";
import { isWithinWorkingHours } from "../booking-rules";
import {
	BookingNotFoundError,
	ProfessionalNotFoundError,
	ProfessionalServiceMismatchError,
	ServiceNotFoundError,
	SlotUnavailableError,
} from "../errors";
import type { BookingEngine } from "../port";
import { DEFAULT_UTC_OFFSET_MINUTES } from "../time";
import {
	type AvailabilityQuery,
	type Booking,
	type CreateBookingInput,
	createBookingInputSchema,
	type ListBookingsQuery,
	type Professional,
	type Service,
	type Slot,
} from "../types";
import type { CalendarClient } from "./client";
import {
	bookingPrivateProperties,
	bookingToEventInput,
	DEFAULT_APP_TAG,
	eventToBooking,
	isManaged,
	managedFilter,
} from "./mappers";

const MS_PER_MINUTE = 60_000;

/** Maps one professional to the Google Calendar that holds their appointments. */
export interface CalendarProfessional {
	/**
	 * Calendar id for this barber. Give each barber their own calendar for true
	 * per-barber availability; point several at the same id to share one shop
	 * calendar (they then share busy time).
	 */
	calendarId: string;
	professional: Professional;
}

export interface GoogleCalendarBookingEngineOptions {
	/** Marker stored on our events to tell them apart from personal entries. */
	appTag?: string;
	client: CalendarClient;
	now?: () => Date;
	/** Fixed UTC offset for working-hour math. Defaults to São Paulo (−180). */
	offsetMinutes?: number;
	/** Barbers and the calendar each one books into. */
	professionals: readonly CalendarProfessional[];
	/** Service catalog — Calendar has no concept of services, so we configure it. */
	services: readonly Service[];
}

function overlapsInterval(busy: Interval, start: Date, end: Date): boolean {
	return (
		busy.start.getTime() < end.getTime() && start.getTime() < busy.end.getTime()
	);
}

/**
 * {@link BookingEngine} backed by Google Calendar — the default integration for
 * shops with no existing scheduling tool. Each barber maps to a calendar;
 * bookings are events carrying our metadata in private extended properties.
 * Availability comes from the freebusy API (so the barber's own calendar entries
 * block slots too); only events bearing our marker are treated as bookings.
 */
export class GoogleCalendarBookingEngine implements BookingEngine {
	readonly #client: CalendarClient;
	readonly #services: Map<string, Service>;
	readonly #professionals: Map<string, CalendarProfessional>;
	readonly #calendarIds: string[];
	readonly #offset: number;
	readonly #now: () => Date;
	readonly #appTag: string;

	constructor(options: GoogleCalendarBookingEngineOptions) {
		this.#client = options.client;
		this.#services = new Map(options.services.map((s) => [s.id, s]));
		this.#professionals = new Map(
			options.professionals.map((entry) => [entry.professional.id, entry])
		);
		this.#calendarIds = [
			...new Set(options.professionals.map((entry) => entry.calendarId)),
		];
		this.#offset = options.offsetMinutes ?? DEFAULT_UTC_OFFSET_MINUTES;
		this.#now = options.now ?? (() => new Date());
		this.#appTag = options.appTag ?? DEFAULT_APP_TAG;
	}

	listServices(): Promise<Service[]> {
		return Promise.resolve([...this.#services.values()]);
	}

	listProfessionals(): Promise<Professional[]> {
		return Promise.resolve(
			[...this.#professionals.values()].map((entry) => entry.professional)
		);
	}

	async getAvailability(query: AvailabilityQuery): Promise<Slot[]> {
		const service = this.#requireService(query.serviceId);
		if (
			query.professionalId !== undefined &&
			!this.#professionals.has(query.professionalId)
		) {
			throw new ProfessionalNotFoundError(query.professionalId);
		}
		const candidates = [...this.#professionals.values()].filter(
			(entry) =>
				entry.professional.serviceIds.includes(service.id) &&
				(query.professionalId === undefined ||
					entry.professional.id === query.professionalId)
		);
		if (candidates.length === 0) {
			return [];
		}

		const calendarIds = [...new Set(candidates.map((c) => c.calendarId))];
		const busyByCalendar = await this.#client.freeBusy(
			calendarIds,
			query.from,
			query.to
		);
		const busyByProfessional = new Map<string, readonly Interval[]>();
		for (const candidate of candidates) {
			busyByProfessional.set(
				candidate.professional.id,
				busyByCalendar.get(candidate.calendarId) ?? []
			);
		}

		return computeSlotsFromBusy({
			query,
			service,
			professionals: candidates.map((c) => c.professional),
			busyByProfessional,
			offsetMinutes: this.#offset,
			now: this.#now(),
		});
	}

	async createBooking(input: CreateBookingInput): Promise<Booking> {
		const parsed = createBookingInputSchema.parse(input);
		const service = this.#requireService(parsed.serviceId);
		const entry = this.#requireProfessional(parsed.professionalId);
		if (!entry.professional.serviceIds.includes(service.id)) {
			throw new ProfessionalServiceMismatchError(
				entry.professional.id,
				service.id
			);
		}
		const end = new Date(
			parsed.start.getTime() + service.durationMinutes * MS_PER_MINUTE
		);
		await this.#assertSlotAvailable(entry, parsed.start, end);

		const draft: Booking = {
			id: "",
			serviceId: service.id,
			professionalId: entry.professional.id,
			customer: parsed.customer,
			start: parsed.start,
			end,
			status: "confirmed",
			notes: parsed.notes,
			createdAt: this.#now(),
		};
		const event = await this.#client.insertEvent(
			entry.calendarId,
			bookingToEventInput(draft, service, this.#appTag)
		);
		return { ...draft, id: event.id, createdAt: event.created };
	}

	async cancelBooking(bookingId: string): Promise<void> {
		const found = await this.#findBooking(bookingId);
		if (!found) {
			throw new BookingNotFoundError(bookingId);
		}
		const cancelled: Booking = { ...found.booking, status: "cancelled" };
		await this.#client.patchEvent(found.calendarId, bookingId, {
			busy: false,
			privateProperties: bookingPrivateProperties(cancelled, this.#appTag),
		});
	}

	async rescheduleBooking(bookingId: string, newStart: Date): Promise<Booking> {
		const found = await this.#findBooking(bookingId);
		if (!found) {
			throw new BookingNotFoundError(bookingId);
		}
		const service = this.#requireService(found.booking.serviceId);
		const entry = this.#requireProfessional(found.booking.professionalId);
		const newEnd = new Date(
			newStart.getTime() + service.durationMinutes * MS_PER_MINUTE
		);
		await this.#assertSlotAvailable(entry, newStart, newEnd, bookingId);

		const moved: Booking = { ...found.booking, start: newStart, end: newEnd };
		const event = await this.#client.patchEvent(found.calendarId, bookingId, {
			start: newStart,
			end: newEnd,
			privateProperties: bookingPrivateProperties(moved, this.#appTag),
		});
		return { ...moved, createdAt: event.created };
	}

	async listBookings(query: ListBookingsQuery): Promise<Booking[]> {
		const from = query.from.getTime();
		const to = query.to.getTime();
		const bookings: Booking[] = [];
		for (const calendarId of this.#calendarIds) {
			const events = await this.#client.listEvents(
				calendarId,
				query.from,
				query.to,
				managedFilter(this.#appTag)
			);
			for (const event of events) {
				const booking = eventToBooking(event, this.#appTag);
				if (booking) {
					bookings.push(booking);
				}
			}
		}
		return bookings
			.filter(
				(booking) =>
					booking.start.getTime() < to &&
					booking.end.getTime() > from &&
					(query.professionalId === undefined ||
						booking.professionalId === query.professionalId) &&
					(query.status === undefined || booking.status === query.status)
			)
			.sort((a, b) => a.start.getTime() - b.start.getTime());
	}

	async getBooking(bookingId: string): Promise<Booking | null> {
		return (await this.#findBooking(bookingId))?.booking ?? null;
	}

	#requireService(serviceId: string): Service {
		const service = this.#services.get(serviceId);
		if (!service) {
			throw new ServiceNotFoundError(serviceId);
		}
		return service;
	}

	#requireProfessional(professionalId: string): CalendarProfessional {
		const entry = this.#professionals.get(professionalId);
		if (!entry) {
			throw new ProfessionalNotFoundError(professionalId);
		}
		return entry;
	}

	async #assertSlotAvailable(
		entry: CalendarProfessional,
		start: Date,
		end: Date,
		excludeEventId?: string
	): Promise<void> {
		if (
			!isWithinWorkingHours(entry.professional, start, end, this.#offset) ||
			(await this.#hasConflict(entry.calendarId, start, end, excludeEventId))
		) {
			throw new SlotUnavailableError(entry.professional.id, start);
		}
	}

	async #hasConflict(
		calendarId: string,
		start: Date,
		end: Date,
		excludeEventId?: string
	): Promise<boolean> {
		const events = await this.#client.listEvents(calendarId, start, end);
		return events.some((event) => {
			if (event.id === excludeEventId) {
				return false;
			}
			// Our own cancelled events are transparent and don't block.
			if (
				isManaged(event, this.#appTag) &&
				event.privateProperties.status === "cancelled"
			) {
				return false;
			}
			return overlapsInterval(
				{ start: event.start, end: event.end },
				start,
				end
			);
		});
	}

	async #findBooking(
		bookingId: string
	): Promise<{ calendarId: string; booking: Booking } | null> {
		for (const calendarId of this.#calendarIds) {
			const event = await this.#client.getEvent(calendarId, bookingId);
			if (event && isManaged(event, this.#appTag)) {
				const booking = eventToBooking(event, this.#appTag);
				if (booking) {
					return { calendarId, booking };
				}
			}
		}
		return null;
	}
}
