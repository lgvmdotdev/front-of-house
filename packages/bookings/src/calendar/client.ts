import { calendar, type calendar_v3 } from "@googleapis/calendar";
import type { Interval } from "../availability";

/**
 * The slice of the Google Calendar API the booking adapter needs, plus our own
 * minimal event shape. This is the injectable seam: the adapter depends on
 * {@link CalendarClient}, the real implementation wraps `@googleapis/calendar`,
 * and tests pass an in-memory fake. Per the project's testing rules the Google
 * API is a true external boundary, so we hand-write a fake of *this* contract.
 */

/** Our normalized view of a calendar event. */
export interface CalendarEvent {
	created: Date;
	description: string;
	end: Date;
	id: string;
	/** `extendedProperties.private` — where we stash booking metadata. */
	privateProperties: Record<string, string>;
	start: Date;
	summary: string;
}

/** Fields used to create or patch an event. */
export interface CalendarEventInput {
	/** `false` marks the event free (transparent) so it stops blocking slots. */
	busy?: boolean;
	description?: string;
	end: Date;
	privateProperties?: Record<string, string>;
	start: Date;
	summary: string;
}

export interface CalendarClient {
	deleteEvent(calendarId: string, eventId: string): Promise<void>;
	/** Busy intervals per calendar in `[timeMin, timeMax)`. */
	freeBusy(
		calendarIds: readonly string[],
		timeMin: Date,
		timeMax: Date
	): Promise<Map<string, Interval[]>>;
	/** A single event, or `null` if it doesn't exist. */
	getEvent(calendarId: string, eventId: string): Promise<CalendarEvent | null>;
	insertEvent(
		calendarId: string,
		event: CalendarEventInput
	): Promise<CalendarEvent>;
	/** Events overlapping the window, optionally filtered by private props. */
	listEvents(
		calendarId: string,
		timeMin: Date,
		timeMax: Date,
		privateProperties?: Record<string, string>
	): Promise<CalendarEvent[]>;
	patchEvent(
		calendarId: string,
		eventId: string,
		patch: Partial<CalendarEventInput>
	): Promise<CalendarEvent>;
}

export interface GoogleCalendarClientOptions {
	/** An authenticated Google auth client (service account recommended). */
	auth: calendar_v3.Options["auth"];
}

function isNotFound(error: unknown): boolean {
	const status = (error as { code?: number; response?: { status?: number } })
		?.code;
	const responseStatus = (error as { response?: { status?: number } })?.response
		?.status;
	return status === 404 || responseStatus === 404;
}

function toCalendarEvent(
	event: calendar_v3.Schema$Event
): CalendarEvent | null {
	const startIso = event.start?.dateTime;
	const endIso = event.end?.dateTime;
	// Skip all-day events (date only) and anything without a concrete time.
	if (!(startIso && endIso && event.id)) {
		return null;
	}
	return {
		id: event.id,
		summary: event.summary ?? "",
		description: event.description ?? "",
		start: new Date(startIso),
		end: new Date(endIso),
		created: event.created ? new Date(event.created) : new Date(startIso),
		privateProperties: event.extendedProperties?.private ?? {},
	};
}

function toGoogleEvent(
	input: Partial<CalendarEventInput>
): calendar_v3.Schema$Event {
	const event: calendar_v3.Schema$Event = {};
	if (input.summary !== undefined) {
		event.summary = input.summary;
	}
	if (input.description !== undefined) {
		event.description = input.description;
	}
	if (input.start) {
		event.start = { dateTime: input.start.toISOString() };
	}
	if (input.end) {
		event.end = { dateTime: input.end.toISOString() };
	}
	if (input.busy !== undefined) {
		event.transparency = input.busy ? "opaque" : "transparent";
	}
	if (input.privateProperties) {
		event.extendedProperties = { private: input.privateProperties };
	}
	return event;
}

/** Real {@link CalendarClient} backed by the Google Calendar v3 API. */
export class GoogleCalendarClient implements CalendarClient {
	readonly #calendar: calendar_v3.Calendar;

	constructor(options: GoogleCalendarClientOptions) {
		this.#calendar = calendar({ version: "v3", auth: options.auth });
	}

	async freeBusy(
		calendarIds: readonly string[],
		timeMin: Date,
		timeMax: Date
	): Promise<Map<string, Interval[]>> {
		const response = await this.#calendar.freebusy.query({
			requestBody: {
				timeMin: timeMin.toISOString(),
				timeMax: timeMax.toISOString(),
				items: calendarIds.map((id) => ({ id })),
			},
		});
		const calendars = response.data.calendars ?? {};
		const result = new Map<string, Interval[]>();
		for (const id of calendarIds) {
			const busy = calendars[id]?.busy ?? [];
			result.set(
				id,
				busy
					.filter((period) => period.start && period.end)
					.map((period) => ({
						start: new Date(period.start as string),
						end: new Date(period.end as string),
					}))
			);
		}
		return result;
	}

	async listEvents(
		calendarId: string,
		timeMin: Date,
		timeMax: Date,
		privateProperties?: Record<string, string>
	): Promise<CalendarEvent[]> {
		const response = await this.#calendar.events.list({
			calendarId,
			timeMin: timeMin.toISOString(),
			timeMax: timeMax.toISOString(),
			singleEvents: true,
			orderBy: "startTime",
			privateExtendedProperty: privateProperties
				? Object.entries(privateProperties).map(
						([key, value]) => `${key}=${value}`
					)
				: undefined,
		});
		const events: CalendarEvent[] = [];
		for (const item of response.data.items ?? []) {
			const mapped = toCalendarEvent(item);
			if (mapped) {
				events.push(mapped);
			}
		}
		return events;
	}

	async getEvent(
		calendarId: string,
		eventId: string
	): Promise<CalendarEvent | null> {
		try {
			const response = await this.#calendar.events.get({ calendarId, eventId });
			return toCalendarEvent(response.data);
		} catch (error) {
			if (isNotFound(error)) {
				return null;
			}
			throw error;
		}
	}

	async insertEvent(
		calendarId: string,
		event: CalendarEventInput
	): Promise<CalendarEvent> {
		const response = await this.#calendar.events.insert({
			calendarId,
			requestBody: toGoogleEvent(event),
		});
		const mapped = toCalendarEvent(response.data);
		if (!mapped) {
			throw new Error("Google Calendar returned an event without a start time");
		}
		return mapped;
	}

	async patchEvent(
		calendarId: string,
		eventId: string,
		patch: Partial<CalendarEventInput>
	): Promise<CalendarEvent> {
		const response = await this.#calendar.events.patch({
			calendarId,
			eventId,
			requestBody: toGoogleEvent(patch),
		});
		const mapped = toCalendarEvent(response.data);
		if (!mapped) {
			throw new Error("Google Calendar returned an event without a start time");
		}
		return mapped;
	}

	async deleteEvent(calendarId: string, eventId: string): Promise<void> {
		await this.#calendar.events.delete({ calendarId, eventId });
	}
}
