/**
 * Physical layout of the booking spreadsheet: one tab per entity, row 1 is a
 * header. Columns are matched by header name (case-insensitive), not position,
 * so a shop owner can reorder columns in their planilha without breaking us.
 *
 * `service_ids` on the Professionals tab is a comma-separated list of service
 * ids. Instants (`start`, `end`, `created_at`) are ISO-8601 strings.
 */

export const SHEET_TABS = {
	services: "Services",
	professionals: "Professionals",
	hours: "Hours",
	appointments: "Appointments",
} as const;

export const SERVICE_HEADER = [
	"id",
	"name",
	"duration_minutes",
	"price_cents",
] as const;

export const PROFESSIONAL_HEADER = ["id", "name", "service_ids"] as const;

export const HOURS_HEADER = [
	"professional_id",
	"weekday",
	"start",
	"end",
] as const;

export const APPOINTMENT_HEADER = [
	"id",
	"service_id",
	"professional_id",
	"customer_name",
	"customer_phone",
	"start",
	"end",
	"status",
	"notes",
	"created_at",
] as const;

/** Separator for the `service_ids` list cell. */
export const SERVICE_IDS_SEPARATOR = ",";
