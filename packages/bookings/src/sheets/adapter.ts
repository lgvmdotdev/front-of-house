import { computeAvailability } from "../availability";
import { findConflict, isWithinWorkingHours } from "../booking-rules";
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
	type WorkingHours,
} from "../types";
import type { SheetsClient } from "./client";
import { APPOINTMENT_HEADER, SHEET_TABS } from "./layout";
import {
	appointmentRecord,
	headerIndex,
	parseAppointmentRow,
	parseHoursRow,
	parseProfessionalRow,
	parseServiceRow,
	recordToRow,
} from "./mappers";

const MS_PER_MINUTE = 60_000;

export interface SpreadsheetBookingEngineOptions {
	client: SheetsClient;
	/** Booking id generator. Defaults to `crypto.randomUUID`. */
	idFactory?: () => string;
	/** Clock for `createdAt` and "now" filtering. */
	now?: () => Date;
	/** Fixed UTC offset for working-hour math. Defaults to São Paulo (−180). */
	offsetMinutes?: number;
}

interface Grid {
	dataRows: string[][];
	header: string[];
	index: Map<string, number>;
}

interface LoadedAppointment {
	booking: Booking;
	/** 1-based sheet row number, for in-place updates. */
	rowNumber: number;
}

function isBlank(row: readonly string[]): boolean {
	return row.every((cell) => (cell ?? "").trim().length === 0);
}

/**
 * {@link BookingEngine} backed by a Google Sheets "planilha". The sheet is the
 * source of truth; this reads tabs to answer queries and writes rows to book,
 * cancel, and reschedule. Slot validity is enforced here (a spreadsheet has no
 * server-side rules), reusing the shared booking-rules.
 */
export class SpreadsheetBookingEngine implements BookingEngine {
	readonly #client: SheetsClient;
	readonly #offset: number;
	readonly #now: () => Date;
	readonly #idFactory: () => string;

	constructor(options: SpreadsheetBookingEngineOptions) {
		this.#client = options.client;
		this.#offset = options.offsetMinutes ?? DEFAULT_UTC_OFFSET_MINUTES;
		this.#now = options.now ?? (() => new Date());
		this.#idFactory = options.idFactory ?? (() => crypto.randomUUID());
	}

	async listServices(): Promise<Service[]> {
		const { index, dataRows } = await this.#grid(SHEET_TABS.services);
		return dataRows
			.filter((row) => !isBlank(row))
			.map((row) => parseServiceRow(index, row));
	}

	async listProfessionals(): Promise<Professional[]> {
		return await this.#loadProfessionals();
	}

	async getAvailability(query: AvailabilityQuery): Promise<Slot[]> {
		const service = await this.#requireService(query.serviceId);
		const professionals = await this.#loadProfessionals();
		if (
			query.professionalId !== undefined &&
			!professionals.some((p) => p.id === query.professionalId)
		) {
			throw new ProfessionalNotFoundError(query.professionalId);
		}
		const appointments = await this.#loadAppointments();
		return computeAvailability({
			query,
			service,
			professionals,
			bookings: appointments.items.map((item) => item.booking),
			offsetMinutes: this.#offset,
			now: this.#now(),
		});
	}

	async createBooking(input: CreateBookingInput): Promise<Booking> {
		const parsed = createBookingInputSchema.parse(input);
		const service = await this.#requireService(parsed.serviceId);
		const professionals = await this.#loadProfessionals();
		const professional = professionals.find(
			(p) => p.id === parsed.professionalId
		);
		if (!professional) {
			throw new ProfessionalNotFoundError(parsed.professionalId);
		}
		if (!professional.serviceIds.includes(service.id)) {
			throw new ProfessionalServiceMismatchError(professional.id, service.id);
		}
		const end = new Date(
			parsed.start.getTime() + service.durationMinutes * MS_PER_MINUTE
		);
		const appointments = await this.#loadAppointments();
		this.#assertSlotAvailable(
			professional,
			parsed.start,
			end,
			appointments.items.map((item) => item.booking)
		);

		const booking: Booking = {
			id: this.#idFactory(),
			serviceId: service.id,
			professionalId: professional.id,
			customer: parsed.customer,
			start: parsed.start,
			end,
			status: "confirmed",
			notes: parsed.notes,
			createdAt: this.#now(),
		};
		await this.#client.appendRow(
			SHEET_TABS.appointments,
			recordToRow(appointments.header, appointmentRecord(booking))
		);
		return booking;
	}

	async cancelBooking(bookingId: string): Promise<void> {
		const appointments = await this.#loadAppointments();
		const found = appointments.items.find(
			(item) => item.booking.id === bookingId
		);
		if (!found) {
			throw new BookingNotFoundError(bookingId);
		}
		await this.#client.setRow(
			SHEET_TABS.appointments,
			found.rowNumber,
			recordToRow(
				appointments.header,
				appointmentRecord({ ...found.booking, status: "cancelled" })
			)
		);
	}

	async rescheduleBooking(bookingId: string, newStart: Date): Promise<Booking> {
		const appointments = await this.#loadAppointments();
		const found = appointments.items.find(
			(item) => item.booking.id === bookingId
		);
		if (!found) {
			throw new BookingNotFoundError(bookingId);
		}
		const service = await this.#requireService(found.booking.serviceId);
		const professional = await this.#requireProfessional(
			found.booking.professionalId
		);
		const newEnd = new Date(
			newStart.getTime() + service.durationMinutes * MS_PER_MINUTE
		);
		this.#assertSlotAvailable(
			professional,
			newStart,
			newEnd,
			appointments.items.map((item) => item.booking),
			bookingId
		);

		const moved: Booking = { ...found.booking, start: newStart, end: newEnd };
		await this.#client.setRow(
			SHEET_TABS.appointments,
			found.rowNumber,
			recordToRow(appointments.header, appointmentRecord(moved))
		);
		return moved;
	}

	async listBookings(query: ListBookingsQuery): Promise<Booking[]> {
		const from = query.from.getTime();
		const to = query.to.getTime();
		const appointments = await this.#loadAppointments();
		return appointments.items
			.map((item) => item.booking)
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
		const appointments = await this.#loadAppointments();
		return (
			appointments.items.find((item) => item.booking.id === bookingId)
				?.booking ?? null
		);
	}

	async #grid(tab: string): Promise<Grid> {
		const values = await this.#client.getValues(tab);
		const [header = [], ...dataRows] = values;
		return { header, index: headerIndex(header), dataRows };
	}

	async #loadProfessionals(): Promise<Professional[]> {
		const hoursGrid = await this.#grid(SHEET_TABS.hours);
		const hoursByProfessional = new Map<string, WorkingHours[]>();
		for (const row of hoursGrid.dataRows) {
			if (isBlank(row)) {
				continue;
			}
			const { professionalId, hours } = parseHoursRow(hoursGrid.index, row);
			const list = hoursByProfessional.get(professionalId) ?? [];
			list.push(hours);
			hoursByProfessional.set(professionalId, list);
		}
		const professionalsGrid = await this.#grid(SHEET_TABS.professionals);
		return professionalsGrid.dataRows
			.filter((row) => !isBlank(row))
			.map((row) =>
				parseProfessionalRow(professionalsGrid.index, row, hoursByProfessional)
			);
	}

	async #loadAppointments(): Promise<{
		header: string[];
		items: LoadedAppointment[];
	}> {
		const { header, index, dataRows } = await this.#grid(
			SHEET_TABS.appointments
		);
		const items: LoadedAppointment[] = [];
		for (const [position, row] of dataRows.entries()) {
			if (isBlank(row)) {
				continue;
			}
			items.push({
				booking: parseAppointmentRow(index, row),
				rowNumber: position + 2,
			});
		}
		return {
			header: header.length > 0 ? header : [...APPOINTMENT_HEADER],
			items,
		};
	}

	async #requireService(serviceId: string): Promise<Service> {
		const service = (await this.listServices()).find((s) => s.id === serviceId);
		if (!service) {
			throw new ServiceNotFoundError(serviceId);
		}
		return service;
	}

	async #requireProfessional(professionalId: string): Promise<Professional> {
		const professional = (await this.#loadProfessionals()).find(
			(p) => p.id === professionalId
		);
		if (!professional) {
			throw new ProfessionalNotFoundError(professionalId);
		}
		return professional;
	}

	#assertSlotAvailable(
		professional: Professional,
		start: Date,
		end: Date,
		bookings: readonly Booking[],
		excludeBookingId?: string
	): void {
		const free =
			isWithinWorkingHours(professional, start, end, this.#offset) &&
			findConflict(bookings, professional.id, start, end, excludeBookingId) ===
				undefined;
		if (!free) {
			throw new SlotUnavailableError(professional.id, start);
		}
	}
}
