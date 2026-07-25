import {
	BOOKING_STATUSES,
	type Booking,
	type BookingStatus,
	type Professional,
	professionalSchema,
	type Service,
	serviceSchema,
	type Weekday,
	type WorkingHours,
	workingHoursSchema,
} from "../types";
import { SERVICE_IDS_SEPARATOR } from "./layout";

/**
 * Pure row⇄domain translation for the spreadsheet adapter. Header-aware so
 * column order in the sheet doesn't matter. Throws descriptive errors on
 * malformed rows so a bad cell points the operator at the offending column.
 */

/** Maps lower-cased header names to their column index. */
export function headerIndex(header: readonly string[]): Map<string, number> {
	const index = new Map<string, number>();
	for (const [position, name] of header.entries()) {
		index.set(name.trim().toLowerCase(), position);
	}
	return index;
}

function cell(
	row: readonly string[],
	index: Map<string, number>,
	column: string
): string {
	const position = index.get(column);
	if (position === undefined) {
		throw new Error(`Spreadsheet is missing the "${column}" column`);
	}
	return (row[position] ?? "").trim();
}

function toInt(value: string, column: string): number {
	const parsed = Number(value);
	if (!Number.isInteger(parsed)) {
		throw new Error(
			`Column "${column}" must be a whole number, got "${value}"`
		);
	}
	return parsed;
}

function toInstant(value: string, column: string): Date {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Column "${column}" must be an ISO date, got "${value}"`);
	}
	return date;
}

export function parseServiceRow(
	index: Map<string, number>,
	row: readonly string[]
): Service {
	return serviceSchema.parse({
		id: cell(row, index, "id"),
		name: cell(row, index, "name"),
		durationMinutes: toInt(
			cell(row, index, "duration_minutes"),
			"duration_minutes"
		),
		price: {
			amountCents: toInt(cell(row, index, "price_cents"), "price_cents"),
			currency: "BRL",
		},
	});
}

export function parseHoursRow(
	index: Map<string, number>,
	row: readonly string[]
): { professionalId: string; hours: WorkingHours } {
	const professionalId = cell(row, index, "professional_id");
	const hours = workingHoursSchema.parse({
		weekday: toInt(cell(row, index, "weekday"), "weekday") as Weekday,
		start: cell(row, index, "start"),
		end: cell(row, index, "end"),
	});
	return { professionalId, hours };
}

export function parseProfessionalRow(
	index: Map<string, number>,
	row: readonly string[],
	hoursByProfessional: ReadonlyMap<string, WorkingHours[]>
): Professional {
	const id = cell(row, index, "id");
	const serviceIds = cell(row, index, "service_ids")
		.split(SERVICE_IDS_SEPARATOR)
		.map((value) => value.trim())
		.filter((value) => value.length > 0);
	return professionalSchema.parse({
		id,
		name: cell(row, index, "name"),
		serviceIds,
		workingHours: hoursByProfessional.get(id) ?? [],
	});
}

function parseStatus(value: string): BookingStatus {
	const status = value.toLowerCase();
	if ((BOOKING_STATUSES as readonly string[]).includes(status)) {
		return status as BookingStatus;
	}
	throw new Error(
		`Column "status" must be one of ${BOOKING_STATUSES.join(", ")}, got "${value}"`
	);
}

export function parseAppointmentRow(
	index: Map<string, number>,
	row: readonly string[]
): Booking {
	const notes = cell(row, index, "notes");
	return {
		id: cell(row, index, "id"),
		serviceId: cell(row, index, "service_id"),
		professionalId: cell(row, index, "professional_id"),
		customer: {
			name: cell(row, index, "customer_name"),
			phone: cell(row, index, "customer_phone"),
		},
		start: toInstant(cell(row, index, "start"), "start"),
		end: toInstant(cell(row, index, "end"), "end"),
		status: parseStatus(cell(row, index, "status")),
		notes: notes.length > 0 ? notes : undefined,
		createdAt: toInstant(cell(row, index, "created_at"), "created_at"),
	};
}

/** Flat record of an appointment, keyed by canonical column name. */
export function appointmentRecord(booking: Booking): Record<string, string> {
	return {
		id: booking.id,
		service_id: booking.serviceId,
		professional_id: booking.professionalId,
		customer_name: booking.customer.name,
		customer_phone: booking.customer.phone,
		start: booking.start.toISOString(),
		end: booking.end.toISOString(),
		status: booking.status,
		notes: booking.notes ?? "",
		created_at: booking.createdAt.toISOString(),
	};
}

/** Orders a record's values to match the sheet's actual header row. */
export function recordToRow(
	header: readonly string[],
	record: Record<string, string>
): string[] {
	return header.map((column) => record[column.trim().toLowerCase()] ?? "");
}
