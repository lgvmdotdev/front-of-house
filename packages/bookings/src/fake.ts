import { computeAvailability } from "./availability";
import { findConflict, isWithinWorkingHours } from "./booking-rules";
import {
	BookingNotFoundError,
	ProfessionalNotFoundError,
	ProfessionalServiceMismatchError,
	ServiceNotFoundError,
	SlotUnavailableError,
} from "./errors";
import type { BookingEngine } from "./port";
import { DEFAULT_UTC_OFFSET_MINUTES } from "./time";
import {
	type AvailabilityQuery,
	type Booking,
	type CreateBookingInput,
	createBookingInputSchema,
	type ListBookingsQuery,
	type Professional,
	type Service,
	type Slot,
} from "./types";

const MS_PER_MINUTE = 60_000;

/** Runs a synchronous body, surfacing any throw as a rejected promise. */
function resolved<T>(body: () => T): Promise<T> {
	try {
		return Promise.resolve(body());
	} catch (error) {
		return Promise.reject(error as Error);
	}
}

export interface FakeBookingEngineSeed {
	bookings?: readonly Booking[];
	/** Prefix for generated booking ids. Defaults to `"bk"`. */
	idPrefix?: string;
	/** Clock, for deterministic ids/timestamps in tests. */
	now?: () => Date;
	/** Fixed UTC offset for working-hour math. Defaults to São Paulo (−180). */
	offsetMinutes?: number;
	professionals?: readonly Professional[];
	services?: readonly Service[];
}

/**
 * In-memory {@link BookingEngine}. Doubles as the reference implementation and
 * the test seam — consumers depend on `BookingEngine` and get this in tests, so
 * we never mock internal collaborators.
 */
export class FakeBookingEngine implements BookingEngine {
	readonly #services = new Map<string, Service>();
	readonly #professionals = new Map<string, Professional>();
	readonly #bookings = new Map<string, Booking>();
	readonly #offset: number;
	readonly #now: () => Date;
	readonly #idPrefix: string;
	#sequence = 0;

	constructor(seed: FakeBookingEngineSeed = {}) {
		for (const service of seed.services ?? []) {
			this.#services.set(service.id, service);
		}
		for (const professional of seed.professionals ?? []) {
			this.#professionals.set(professional.id, professional);
		}
		for (const booking of seed.bookings ?? []) {
			this.#bookings.set(booking.id, booking);
		}
		this.#offset = seed.offsetMinutes ?? DEFAULT_UTC_OFFSET_MINUTES;
		this.#now = seed.now ?? (() => new Date());
		this.#idPrefix = seed.idPrefix ?? "bk";
	}

	listServices(): Promise<Service[]> {
		return Promise.resolve([...this.#services.values()]);
	}

	listProfessionals(): Promise<Professional[]> {
		return Promise.resolve([...this.#professionals.values()]);
	}

	getAvailability(query: AvailabilityQuery): Promise<Slot[]> {
		return resolved(() => {
			const service = this.#requireService(query.serviceId);
			if (query.professionalId !== undefined) {
				this.#requireProfessional(query.professionalId);
			}
			return computeAvailability({
				query,
				service,
				professionals: [...this.#professionals.values()],
				bookings: [...this.#bookings.values()],
				offsetMinutes: this.#offset,
				now: this.#now(),
			});
		});
	}

	createBooking(input: CreateBookingInput): Promise<Booking> {
		return resolved(() => {
			const parsed = createBookingInputSchema.parse(input);
			const service = this.#requireService(parsed.serviceId);
			const professional = this.#requireProfessional(parsed.professionalId);
			if (!professional.serviceIds.includes(service.id)) {
				throw new ProfessionalServiceMismatchError(professional.id, service.id);
			}
			const end = new Date(
				parsed.start.getTime() + service.durationMinutes * MS_PER_MINUTE
			);
			this.#assertSlotAvailable(professional, parsed.start, end);

			const booking: Booking = {
				id: this.#nextId(),
				serviceId: service.id,
				professionalId: professional.id,
				customer: parsed.customer,
				start: parsed.start,
				end,
				status: "confirmed",
				notes: parsed.notes,
				createdAt: this.#now(),
			};
			this.#bookings.set(booking.id, booking);
			return booking;
		});
	}

	cancelBooking(bookingId: string): Promise<void> {
		return resolved(() => {
			const booking = this.#requireBooking(bookingId);
			this.#bookings.set(bookingId, { ...booking, status: "cancelled" });
		});
	}

	rescheduleBooking(bookingId: string, newStart: Date): Promise<Booking> {
		return resolved(() => {
			const booking = this.#requireBooking(bookingId);
			const service = this.#requireService(booking.serviceId);
			const professional = this.#requireProfessional(booking.professionalId);
			const newEnd = new Date(
				newStart.getTime() + service.durationMinutes * MS_PER_MINUTE
			);
			this.#assertSlotAvailable(professional, newStart, newEnd, bookingId);

			const moved: Booking = { ...booking, start: newStart, end: newEnd };
			this.#bookings.set(bookingId, moved);
			return moved;
		});
	}

	listBookings(query: ListBookingsQuery): Promise<Booking[]> {
		const from = query.from.getTime();
		const to = query.to.getTime();
		const results = [...this.#bookings.values()]
			.filter(
				(booking) =>
					booking.start.getTime() < to &&
					booking.end.getTime() > from &&
					(query.professionalId === undefined ||
						booking.professionalId === query.professionalId) &&
					(query.status === undefined || booking.status === query.status)
			)
			.sort((a, b) => a.start.getTime() - b.start.getTime());
		return Promise.resolve(results);
	}

	getBooking(bookingId: string): Promise<Booking | null> {
		return Promise.resolve(this.#bookings.get(bookingId) ?? null);
	}

	#requireService(serviceId: string): Service {
		const service = this.#services.get(serviceId);
		if (!service) {
			throw new ServiceNotFoundError(serviceId);
		}
		return service;
	}

	#requireProfessional(professionalId: string): Professional {
		const professional = this.#professionals.get(professionalId);
		if (!professional) {
			throw new ProfessionalNotFoundError(professionalId);
		}
		return professional;
	}

	#requireBooking(bookingId: string): Booking {
		const booking = this.#bookings.get(bookingId);
		if (!booking) {
			throw new BookingNotFoundError(bookingId);
		}
		return booking;
	}

	#assertSlotAvailable(
		professional: Professional,
		start: Date,
		end: Date,
		excludeBookingId?: string
	): void {
		const free =
			isWithinWorkingHours(professional, start, end, this.#offset) &&
			findConflict(
				this.#bookings.values(),
				professional.id,
				start,
				end,
				excludeBookingId
			) === undefined;
		if (!free) {
			throw new SlotUnavailableError(professional.id, start);
		}
	}

	#nextId(): string {
		this.#sequence += 1;
		return `${this.#idPrefix}-${this.#sequence}`;
	}
}
