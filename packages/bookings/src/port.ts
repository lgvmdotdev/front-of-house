import type {
	AvailabilityQuery,
	Booking,
	CreateBookingInput,
	ListBookingsQuery,
	Professional,
	Service,
	Slot,
} from "./types";

/**
 * Provider-agnostic booking engine — the contract every scheduling integration
 * implements (Google Sheets first, then Trinks, Booksy, Belezito, Google
 * Agenda, …). The AI receptionist and API layer code against this, never
 * against a specific backend.
 *
 * The external tool remains the source of truth: implementations read/write the
 * shop's real schedule, they don't keep their own.
 */
export interface BookingEngine {
	/**
	 * Cancels a booking, freeing its slot.
	 *
	 * @throws {@link BookingNotFoundError} if the id is unknown.
	 */
	cancelBooking(bookingId: string): Promise<void>;

	/**
	 * Books an appointment, writing it to the backing schedule.
	 *
	 * @throws {@link ServiceNotFoundError} / {@link ProfessionalNotFoundError} for unknown ids.
	 * @throws {@link ProfessionalServiceMismatchError} if the barber doesn't do the service.
	 * @throws {@link SlotUnavailableError} if the slot is taken or outside working hours.
	 */
	createBooking(input: CreateBookingInput): Promise<Booking>;

	/**
	 * Bookable openings for a service in a time window, optionally restricted to
	 * one professional. Results are sorted by start time.
	 *
	 * @throws {@link ServiceNotFoundError} if the service is unknown.
	 * @throws {@link ProfessionalNotFoundError} if a given professional is unknown.
	 */
	getAvailability(query: AvailabilityQuery): Promise<Slot[]>;

	/** A single booking, or `null` if not found. */
	getBooking(bookingId: string): Promise<Booking | null>;

	/** Bookings overlapping a window — drives the day-of confirmation flow. */
	listBookings(query: ListBookingsQuery): Promise<Booking[]>;

	/** The shop's barbers, with the services they perform and their hours. */
	listProfessionals(): Promise<Professional[]>;
	/** The shop's service menu (for answering price/duration questions). */
	listServices(): Promise<Service[]>;

	/**
	 * Moves a booking to a new start time, keeping its service/professional.
	 *
	 * @throws {@link BookingNotFoundError} if the id is unknown.
	 * @throws {@link SlotUnavailableError} if the new slot isn't free.
	 */
	rescheduleBooking(bookingId: string, newStart: Date): Promise<Booking>;
}
