import { z } from "zod";

/**
 * Provider-agnostic booking domain.
 *
 * Nothing here references Google Sheets, Trinks, Booksy, or any other backend —
 * the concrete adapters translate their own representations into these shapes.
 * This is the vocabulary the AI receptionist reasons about.
 *
 * Conventions:
 * - Money is integer **cents** in BRL — never floats.
 * - Durations are whole **minutes**.
 * - Instants are `Date` (UTC). Wall-clock times (working hours) are local
 *   `"HH:MM"` strings, resolved against a fixed UTC offset (see `time.ts`);
 *   Brazil has had no DST since 2019, so a per-shop fixed offset is correct.
 */

const TIME_OF_DAY = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** A monetary amount in integer cents. */
export interface Money {
	readonly amountCents: number;
	readonly currency: "BRL";
}

export const moneySchema = z.object({
	amountCents: z.number().int().nonnegative(),
	currency: z.literal("BRL"),
}) satisfies z.ZodType<Money>;

/** A service the shop offers (e.g. "Corte", "Barba"). */
export interface Service {
	readonly durationMinutes: number;
	readonly id: string;
	readonly name: string;
	readonly price: Money;
}

export const serviceSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	durationMinutes: z.number().int().positive(),
	price: moneySchema,
}) satisfies z.ZodType<Service>;

/** Day of week, `0` = Sunday … `6` = Saturday (matches `Date.getUTCDay`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Local wall-clock time of day, `"HH:MM"` in 24h. */
export type TimeOfDay = string;

export const timeOfDaySchema = z
	.string()
	.regex(TIME_OF_DAY, "Time must be in 24h HH:MM format (e.g. 09:30)");

/** A recurring weekly working window for a professional. */
export interface WorkingHours {
	/** Exclusive end, local `"HH:MM"`. */
	readonly end: TimeOfDay;
	/** Inclusive start, local `"HH:MM"`. */
	readonly start: TimeOfDay;
	readonly weekday: Weekday;
}

export const workingHoursSchema = z.object({
	weekday: z.union([
		z.literal(0),
		z.literal(1),
		z.literal(2),
		z.literal(3),
		z.literal(4),
		z.literal(5),
		z.literal(6),
	]),
	start: timeOfDaySchema,
	end: timeOfDaySchema,
}) satisfies z.ZodType<WorkingHours>;

/** A barber. */
export interface Professional {
	readonly id: string;
	readonly name: string;
	/** Ids of the services this professional performs. */
	readonly serviceIds: readonly string[];
	/** Weekly schedule. Multiple entries per weekday allow split shifts. */
	readonly workingHours: readonly WorkingHours[];
}

export const professionalSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	serviceIds: z.array(z.string().min(1)).readonly(),
	workingHours: z.array(workingHoursSchema).readonly(),
}) satisfies z.ZodType<Professional>;

/** The customer a booking is for. */
export interface Customer {
	readonly name: string;
	/** Phone in international digits (e.g. `5511999998888`). */
	readonly phone: string;
}

export const customerSchema = z.object({
	name: z.string().min(1),
	phone: z.string().min(1),
}) satisfies z.ZodType<Customer>;

/** Lifecycle of a booking. */
export const BOOKING_STATUSES = ["confirmed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** A scheduled appointment. */
export interface Booking {
	readonly createdAt: Date;
	readonly customer: Customer;
	/** Appointment end instant (`start` + service duration). */
	readonly end: Date;
	readonly id: string;
	readonly notes?: string;
	readonly professionalId: string;
	readonly serviceId: string;
	/** Appointment start instant. */
	readonly start: Date;
	readonly status: BookingStatus;
}

/** A bookable opening returned by availability queries. */
export interface Slot {
	readonly end: Date;
	/** Which professional is free for this slot. */
	readonly professionalId: string;
	readonly start: Date;
}

/** Query for {@link BookingEngine.getAvailability}. */
export interface AvailabilityQuery {
	/** Window start (inclusive). */
	readonly from: Date;
	/** Restrict to one professional; omit to consider every qualified barber. */
	readonly professionalId?: string;
	readonly serviceId: string;
	/** Window end (exclusive). */
	readonly to: Date;
}

/** Input for {@link BookingEngine.createBooking}. */
export interface CreateBookingInput {
	readonly customer: Customer;
	readonly notes?: string;
	readonly professionalId: string;
	readonly serviceId: string;
	readonly start: Date;
}

export const createBookingInputSchema = z.object({
	serviceId: z.string().min(1),
	professionalId: z.string().min(1),
	customer: customerSchema,
	start: z.date(),
	notes: z.string().optional(),
}) satisfies z.ZodType<CreateBookingInput>;

/** Query for {@link BookingEngine.listBookings}. */
export interface ListBookingsQuery {
	/** Window start (inclusive). */
	readonly from: Date;
	readonly professionalId?: string;
	readonly status?: BookingStatus;
	/** Window end (exclusive). */
	readonly to: Date;
}
