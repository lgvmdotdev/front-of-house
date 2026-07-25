// biome-ignore-all lint/performance/noBarrelFile: this is the package's public API surface

// Time + availability helpers (useful to adapters and callers).
export {
	computeAvailability,
	computeFreeSlots,
	computeSlotsFromBusy,
	type Interval,
} from "./availability";
// Google Calendar adapter.
export {
	type CalendarProfessional,
	GoogleCalendarBookingEngine,
	type GoogleCalendarBookingEngineOptions,
} from "./calendar/adapter";
export {
	type CalendarClient,
	type CalendarEvent,
	type CalendarEventInput,
	GoogleCalendarClient,
	type GoogleCalendarClientOptions,
} from "./calendar/client";
export { DEFAULT_APP_TAG } from "./calendar/mappers";
// Typed errors.
export {
	BookingError,
	type BookingErrorCode,
	BookingNotFoundError,
	ProfessionalNotFoundError,
	ProfessionalServiceMismatchError,
	ServiceNotFoundError,
	SlotUnavailableError,
} from "./errors";
// Implementations.
export {
	FakeBookingEngine,
	type FakeBookingEngineSeed,
} from "./fake";
// Provider-agnostic contract — code against this, not a concrete backend.
export type { BookingEngine } from "./port";
export {
	SpreadsheetBookingEngine,
	type SpreadsheetBookingEngineOptions,
} from "./sheets/adapter";
export {
	GoogleSheetsClient,
	type GoogleSheetsClientOptions,
	type SheetsClient,
} from "./sheets/client";
export {
	APPOINTMENT_HEADER,
	HOURS_HEADER,
	PROFESSIONAL_HEADER,
	SERVICE_HEADER,
	SHEET_TABS,
} from "./sheets/layout";
export {
	DEFAULT_UTC_OFFSET_MINUTES,
	formatTimeOfDay,
	instantToLocalParts,
	type LocalDateParts,
	localToInstant,
	parseTimeOfDay,
} from "./time";
export type {
	AvailabilityQuery,
	Booking,
	BookingStatus,
	CreateBookingInput,
	Customer,
	ListBookingsQuery,
	Money,
	Professional,
	Service,
	Slot,
	TimeOfDay,
	Weekday,
	WorkingHours,
} from "./types";
export {
	BOOKING_STATUSES,
	createBookingInputSchema,
	customerSchema,
	moneySchema,
	professionalSchema,
	serviceSchema,
	timeOfDaySchema,
	workingHoursSchema,
} from "./types";
