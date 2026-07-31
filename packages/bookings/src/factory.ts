import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";
import type { JWT } from "google-auth-library";
import type { CalendarProfessional } from "./calendar/adapter";
import { GoogleCalendarBookingEngine } from "./calendar/adapter";
import { GoogleCalendarClient } from "./calendar/client";
import type { BookingEngine } from "./port";
import { SpreadsheetBookingEngine } from "./sheets/adapter";
import { GoogleSheetsClient } from "./sheets/client";
import { DEFAULT_UTC_OFFSET_MINUTES } from "./time";
import type { Service, Weekday } from "./types";

export interface CreateBookingEngineForOrgOptions {
	/**
	 * Authenticated Google client (service account recommended) — the same
	 * credential works for both Calendar and Sheets scopes. Constructing a
	 * `JWT` doesn't itself make a network call, so this factory stays testable
	 * without hitting Google.
	 */
	googleAuth: JWT;
}

/**
 * Builds the right {@link BookingEngine} for an organization from its
 * `integrationSettings` row (the shop's chosen backend) and catalog
 * (services/professionals/working hours). Defaults to
 * {@link GoogleCalendarBookingEngine} — the "works out of the box" option for
 * shops with no existing tool — when there's no settings row, or the row
 * names a provider without the config it needs.
 */
export async function createBookingEngineForOrg(
	organizationId: string,
	options: CreateBookingEngineForOrgOptions
): Promise<BookingEngine> {
	const settings = await db.query.integrationSettings.findFirst({
		where: eq(schema.integrationSettings.organizationId, organizationId),
	});

	if (settings?.provider === "sheets" && settings.spreadsheetId) {
		const client = new GoogleSheetsClient({
			auth: options.googleAuth,
			spreadsheetId: settings.spreadsheetId,
		});
		return new SpreadsheetBookingEngine({
			client,
			offsetMinutes: settings.offsetMinutes,
		});
	}

	const { services, professionals } = await loadCalendarCatalog(organizationId);
	const client = new GoogleCalendarClient({ auth: options.googleAuth });
	return new GoogleCalendarBookingEngine({
		client,
		services,
		professionals,
		offsetMinutes: settings?.offsetMinutes ?? DEFAULT_UTC_OFFSET_MINUTES,
	});
}

async function loadCalendarCatalog(organizationId: string): Promise<{
	professionals: CalendarProfessional[];
	services: Service[];
}> {
	const serviceRows = await db.query.service.findMany({
		where: eq(schema.service.organizationId, organizationId),
	});
	const professionalRows = await db.query.professional.findMany({
		where: eq(schema.professional.organizationId, organizationId),
		with: { services: true, workingHours: true },
	});

	const services: Service[] = serviceRows.map((row) => ({
		id: row.id,
		name: row.name,
		durationMinutes: row.durationMinutes,
		price: { amountCents: row.priceCents, currency: "BRL" },
	}));

	const professionals: CalendarProfessional[] = professionalRows
		.filter((row) => row.calendarId !== null)
		.map((row) => ({
			calendarId: row.calendarId as string,
			professional: {
				id: row.id,
				name: row.name,
				serviceIds: row.services.map((entry) => entry.serviceId),
				workingHours: row.workingHours.map((hours) => ({
					weekday: hours.weekday as Weekday,
					start: hours.start,
					end: hours.end,
				})),
			},
		}));

	return { services, professionals };
}
