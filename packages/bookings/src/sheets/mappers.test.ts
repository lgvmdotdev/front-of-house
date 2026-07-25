import { describe, expect, test } from "bun:test";
import type { Booking, WorkingHours } from "../types";
import { APPOINTMENT_HEADER } from "./layout";
import {
	appointmentRecord,
	headerIndex,
	parseAppointmentRow,
	parseHoursRow,
	parseProfessionalRow,
	parseServiceRow,
	recordToRow,
} from "./mappers";

const DURATION_COLUMN = /duration_minutes/;

describe("parseServiceRow", () => {
	test("maps a row to a Service", () => {
		const header = ["id", "name", "duration_minutes", "price_cents"];
		const service = parseServiceRow(headerIndex(header), [
			"svc-corte",
			"Corte",
			"60",
			"5000",
		]);
		expect(service).toEqual({
			id: "svc-corte",
			name: "Corte",
			durationMinutes: 60,
			price: { amountCents: 5000, currency: "BRL" },
		});
	});

	test("is tolerant of reordered columns", () => {
		const header = ["price_cents", "id", "duration_minutes", "name"];
		const service = parseServiceRow(headerIndex(header), [
			"5000",
			"svc-corte",
			"60",
			"Corte",
		]);
		expect(service.id).toBe("svc-corte");
		expect(service.price.amountCents).toBe(5000);
	});

	test("throws on a non-numeric duration", () => {
		const header = ["id", "name", "duration_minutes", "price_cents"];
		expect(() =>
			parseServiceRow(headerIndex(header), ["x", "Corte", "abc", "5000"])
		).toThrow(DURATION_COLUMN);
	});
});

describe("parseProfessionalRow", () => {
	test("splits service ids and attaches working hours", () => {
		const header = ["id", "name", "service_ids"];
		const hours: WorkingHours[] = [
			{ weekday: 5, start: "09:00", end: "11:00" },
		];
		const professional = parseProfessionalRow(
			headerIndex(header),
			["pro-felipe", "Felipe", "svc-corte, svc-barba"],
			new Map([["pro-felipe", hours]])
		);
		expect(professional.serviceIds).toEqual(["svc-corte", "svc-barba"]);
		expect(professional.workingHours).toEqual(hours);
	});

	test("defaults to no working hours when none are provided", () => {
		const header = ["id", "name", "service_ids"];
		const professional = parseProfessionalRow(
			headerIndex(header),
			["pro-x", "X", "svc-corte"],
			new Map()
		);
		expect(professional.workingHours).toEqual([]);
	});
});

describe("parseHoursRow", () => {
	test("maps a row to a working-hours entry", () => {
		const header = ["professional_id", "weekday", "start", "end"];
		expect(
			parseHoursRow(headerIndex(header), ["pro-felipe", "5", "09:00", "11:00"])
		).toEqual({
			professionalId: "pro-felipe",
			hours: { weekday: 5, start: "09:00", end: "11:00" },
		});
	});
});

describe("appointment round-trip", () => {
	const booking: Booking = {
		id: "bk-1",
		serviceId: "svc-corte",
		professionalId: "pro-felipe",
		customer: { name: "Ana", phone: "5511999998888" },
		start: new Date("2026-06-26T12:00:00Z"),
		end: new Date("2026-06-26T13:00:00Z"),
		status: "confirmed",
		notes: "cliente novo",
		createdAt: new Date("2026-06-01T00:00:00Z"),
	};

	test("survives record → row → parse", () => {
		const header = [...APPOINTMENT_HEADER];
		const row = recordToRow(header, appointmentRecord(booking));
		const parsed = parseAppointmentRow(headerIndex(header), row);
		expect(parsed).toEqual(booking);
	});

	test("treats an empty notes cell as undefined", () => {
		const header = [...APPOINTMENT_HEADER];
		const row = recordToRow(
			header,
			appointmentRecord({ ...booking, notes: undefined })
		);
		const parsed = parseAppointmentRow(headerIndex(header), row);
		expect(parsed.notes).toBeUndefined();
	});
});
