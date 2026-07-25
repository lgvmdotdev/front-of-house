/**
 * Typed errors for the booking domain. Adapters throw these so callers (the AI
 * agent, API routes) can branch on failure kind without string-matching.
 */

export type BookingErrorCode =
	| "SERVICE_NOT_FOUND"
	| "PROFESSIONAL_NOT_FOUND"
	| "PROFESSIONAL_SERVICE_MISMATCH"
	| "SLOT_UNAVAILABLE"
	| "BOOKING_NOT_FOUND";

/** Base class for every booking error. Carries a discriminant `code`. */
export class BookingError extends Error {
	readonly code: BookingErrorCode;

	constructor(code: BookingErrorCode, message: string) {
		super(message);
		this.name = new.target.name;
		this.code = code;
	}
}

export class ServiceNotFoundError extends BookingError {
	constructor(serviceId: string) {
		super("SERVICE_NOT_FOUND", `No service found with id "${serviceId}"`);
	}
}

export class ProfessionalNotFoundError extends BookingError {
	constructor(professionalId: string) {
		super(
			"PROFESSIONAL_NOT_FOUND",
			`No professional found with id "${professionalId}"`
		);
	}
}

export class ProfessionalServiceMismatchError extends BookingError {
	constructor(professionalId: string, serviceId: string) {
		super(
			"PROFESSIONAL_SERVICE_MISMATCH",
			`Professional "${professionalId}" does not perform service "${serviceId}"`
		);
	}
}

export class SlotUnavailableError extends BookingError {
	constructor(professionalId: string, start: Date) {
		super(
			"SLOT_UNAVAILABLE",
			`Professional "${professionalId}" is not available at ${start.toISOString()}`
		);
	}
}

export class BookingNotFoundError extends BookingError {
	constructor(bookingId: string) {
		super("BOOKING_NOT_FOUND", `No booking found with id "${bookingId}"`);
	}
}
